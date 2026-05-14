package controllers

import (
	"backend/config"
	"backend/models"
	"backend/services"
	"context"

	"fmt"
	"net/http"

	"github.com/gin-gonic/gin"
	"github.com/sashabaranov/go-openai"
)

// ChatRequest 接收前端提问的结构体
type ChatRequest struct {
	Message   string `json:"message" binding:"required"`
	KbID      uint   `json:"kbId"` //  接收前端传来的知识库 ID
	SessionID uint   `json:"sessionId"`
}

// 先写一个辅助函数：让 AI 总结标题
func generateTitleByAI(firstMsg string) string {
	// 构造一个专门总结标题的 Prompt
	prompt := fmt.Sprintf("请将以下用户的提问总结成一个简洁的标题（不超过10个字），直接输出标题，不要带标点符号：\n\n%s", firstMsg)

	// 调用你现有的 TestChat 或者类似的 AI 接口
	title, err := services.TestChat(prompt)
	if err != nil || title == "" {
		return "新对话" // 失败了就保底
	}
	return title
}

// SimpleChat AI 聊天测试接口
func SimpleChat(c *gin.Context) {
	var req ChatRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, models.Response{Code: 400, Message: "参数错误: " + err.Error()})
		return
	}
	// ================= 把用户的问题存进数据库 =================
	if req.SessionID > 0 {
		userMsg := models.ChatMessage{
			SessionID: req.SessionID,
			Role:      "user",
			Content:   req.Message,
		}
		config.DB.Create(&userMsg)
	}
	userMsg := req.Message
	var contextStr string
	var sources []services.SourceItem //  准备装入溯源信息

	// 语义检索：带着 KbID 去向量记忆库里找线索
	if req.KbID > 0 {
		var err error
		contextStr, sources, err = services.SearchTopChunksWithSources(req.KbID, userMsg)
		if err != nil {
			fmt.Printf("检索失败: %v\n", err)
		}
	}

	//  构造超级 Prompt
	finalPrompt := userMsg
	if contextStr != "" {
		finalPrompt = fmt.Sprintf(`你是一个专业的企业知识库助手。请根据以下【背景知识】准确回答用户的问题。
若背景知识无法回答问题，请诚实说明“知识库中未找到相关信息”，不要瞎编。

【背景知识】：
%s

【用户的问题】：
%s`, contextStr, userMsg)
	}

	modelName := services.GetSysConfig("llm_model_name")
	if modelName == "" {
		modelName = "deepseek-chat" // 兜底默认值
	}

	client, err := services.GetChatClint()
	if err != nil {
		c.JSON(http.StatusInternalServerError, models.Response{Code: 500, Message: "系统未配置大模型 API Key，请联系管理员配置"})
		return
	}
	//组装大模型请求参数
	chatReq := openai.ChatCompletionRequest{
		Model: modelName,
		Messages: []openai.ChatCompletionMessage{
			{
				Role:    openai.ChatMessageRoleUser,
				Content: finalPrompt,
			},
		},
	}
	resp, err := client.CreateChatCompletion(context.Background(), chatReq)
	if err != nil {
		c.JSON(http.StatusOK, models.Response{
			Code:    400,
			Message: "大模型拒绝了访问，请前往【系统设置】检查 API Key 是否填对！底层报错: " + err.Error()})
		return
	}
	// 提取 AI 的回答文本
	answer := resp.Choices[0].Message.Content

	// =================  把 AI 的回答存进数据库 =================
	if req.SessionID > 0 && answer != "" {
		aiMsg := models.ChatMessage{
			SessionID: req.SessionID,
			Role:      "assistant",
			Content:   answer,
		}
		config.DB.Create(&aiMsg)
	}

	if req.SessionID > 0 {
		var session models.ChatSession
		config.DB.First(&session, req.SessionID)
		if session.Title == "新对话" {
			// 启动一个 Goroutine（协程）去异步处理，不阻塞当前的对话返回
			go func(sid uint, msg string) {
				newTitle := generateTitleByAI(msg)
				// 更新数据库
				config.DB.Model(&models.ChatSession{}).Where("id = ?", sid).Update("title", newTitle)
				fmt.Printf("会话 %d 标题已自动更新为: %s\n", sid, newTitle)
			}(req.SessionID, req.Message)
		}
	}
	// 将返回的 Data 变成一个包含 text 和 sources 的对象！
	c.JSON(http.StatusOK, models.Response{
		Code:    200,
		Message: "success",
		Data: map[string]interface{}{
			"text":    answer,  // AI 的回答
			"sources": sources, // 刚才捞出来的文件来源
		},
	})
}
