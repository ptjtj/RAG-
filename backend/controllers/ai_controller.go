package controllers

import (
	"backend/config"
	"backend/models"
	"backend/services"
	"context"
	"encoding/json"

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

// StreamChat AI 流式聊天接口 (带思维链实时输出)
// @Summary 智能对话 (流式返回)
// @Description 采用 SSE (Server-Sent Events) 实现的流式打字机和思维链输出
// @Tags 智能对话
// @Security BearerAuth
// @Accept json
// @Produce json
// @Param data body ChatRequest true "提问参数"
// @Success 200 {string} string "返回 SSE 格式的数据流"
// @Router /chat [post]
func StreamChat(c *gin.Context) {
	var req ChatRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, models.Response{Code: 400, Message: "参数错误: " + err.Error()})
		return
	}

	// =================先把用户的问题存进数据库 =================
	if req.SessionID > 0 {
		userMsg := models.ChatMessage{
			SessionID: req.SessionID,
			Role:      "user",
			Content:   req.Message,
		}
		config.DB.Create(&userMsg)
	}

	var contextStr string
	var sources []services.SourceItem

	// ================= 语义检索：去向量库找线索 =================
	if req.KbID > 0 {
		var err error
		contextStr, sources, err = services.SearchTopChunksWithSources(req.KbID, req.Message)
		if err != nil {
			fmt.Printf("检索失败: %v\n", err)
		}
	}

	// =================构造超级 Prompt =================
	finalPrompt := req.Message
	if contextStr != "" {
		finalPrompt = fmt.Sprintf(`你是一个专业的企业知识库助手。请根据以下【背景知识】准确回答用户的问题。
若背景知识无法回答问题，请诚实说明“知识库中未找到相关信息”，不要瞎编。

【背景知识】：
%s

【用户的问题】：
%s`, contextStr, req.Message)
	}

	// 如果要触发思维链，DeepSeek 官方的推理模型名字必须是 deepseek-reasoner
	modelName := services.GetSysConfig("llm_model_name")
	if modelName == "" {
		modelName = "deepseek-reasoner"
	}

	client, err := services.GetChatClint()
	if err != nil {
		c.JSON(http.StatusInternalServerError, models.Response{Code: 500, Message: "系统未配置大模型 API Key"})
		return
	}

	// ================= 组装请求参数并开启 Stream =================
	chatReq := openai.ChatCompletionRequest{
		Model: modelName,
		Messages: []openai.ChatCompletionMessage{
			{Role: openai.ChatMessageRoleUser, Content: finalPrompt},
		},
		Stream: true, // 开启流式开关！
	}

	stream, err := client.CreateChatCompletionStream(context.Background(), chatReq)
	if err != nil {
		c.JSON(http.StatusOK, models.Response{
			Code:    400,
			Message: "大模型拒绝了访问，请检查 API Key！报错: " + err.Error()})
		return
	}
	defer stream.Close()

	// ================= 5. 设置 SSE (Server-Sent Events) 响应头 =================
	c.Writer.Header().Set("Content-Type", "text/event-stream")
	c.Writer.Header().Set("Cache-Control", "no-cache")
	c.Writer.Header().Set("Connection", "keep-alive")

	var fullAnswer string //  准备一个空杯子，用来一点点收集大模型的完整正式回答

	// =================  循环读取流，实时推给前端 =================
	for {
		response, err := stream.Recv()

		// 如果读到末尾 EOF，或者发生异常
		if err != nil {
			// 1. 发送结束标志和溯源数据给前端
			sourcesJSON, _ := json.Marshal(sources)
			c.Writer.Write([]byte(fmt.Sprintf("data: {\"type\":\"done\", \"sources\": %s}\n\n", string(sourcesJSON))))
			c.Writer.Flush()

			// 2. 对话结束了，现在杯子（fullAnswer）装满了！把它存入数据库！
			if req.SessionID > 0 && fullAnswer != "" {
				aiMsg := models.ChatMessage{
					SessionID: req.SessionID,
					Role:      "assistant",
					Content:   fullAnswer,
				}
				config.DB.Create(&aiMsg)

				// 3. 异步更新会话标题
				var session models.ChatSession
				config.DB.First(&session, req.SessionID)
				if session.Title == "新对话" {
					go func(sid uint, msg string) {
						newTitle := generateTitleByAI(msg)
						config.DB.Model(&models.ChatSession{}).Where("id = ?", sid).Update("title", newTitle)
					}(req.SessionID, req.Message)
				}
			}
			return // 彻底结束接口
		}

		// 拿到大模型刚刚吐出来的一个“字”或“片段”
		delta := response.Choices[0].Delta

		//  情景 A：如果是大模型的“思维链思考过程”
		if delta.ReasoningContent != "" {
			escapedReasoning, _ := json.Marshal(delta.ReasoningContent) // 自动带上双引号并转义换行符
			c.Writer.Write([]byte(fmt.Sprintf("data: {\"type\":\"reasoning\", \"content\":%s}\n\n", string(escapedReasoning))))
			c.Writer.Flush()
		}

		// 情景 B：如果是大模型的“最终正式回答”
		if delta.Content != "" {
			fullAnswer += delta.Content // 把它装进杯子里存起来（后端用）
			escapedContent, _ := json.Marshal(delta.Content)
			c.Writer.Write([]byte(fmt.Sprintf("data: {\"type\":\"answer\", \"content\":%s}\n\n", string(escapedContent))))
			c.Writer.Flush() // 立刻推给前端渲染
		}
	}
}
