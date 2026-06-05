package controllers

import (
	"backend/config"
	"backend/models"
	"backend/services"
	"encoding/json"
	"os"
	"path/filepath"
	"strings"

	"fmt"
	"net/http"

	"github.com/gin-gonic/gin"
	"github.com/sashabaranov/go-openai"
)

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

// StreamChat AI 流式聊天接口 (带思维链实时输出)
// @Summary 智能对话 (流式返回)
// @Description 采用 SSE (Server-Sent Events) 实现的流式打字机和思维链输出
// @Tags 智能对话
// @Security BearerAuth
// @Accept json
// @Produce json
// @Param data body models.ChatRequest true "提问参数"
// @Success 200 {string} string "返回 SSE 格式的数据流"
// @Router /chat [post]
func StreamChat(c *gin.Context) {
	var req models.ChatRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, models.Response{Code: 400, Message: "参数错误: " + err.Error()})
		return
	}

	// =================先把用户的问题存进数据库 =================
	if req.SessionID > 0 && !req.IsContinue {
		userMsg := models.ChatMessage{
			SessionID: req.SessionID,
			Role:      "user",
			Content:   req.Message,
			//流式接口也要把附件的唯一ID和原始名字持久化到 MySQL
			FileId:   req.TempFileId,
			FileName: req.TempFileName,
		}
		config.DB.Create(&userMsg)
		//异步更新会话标题
		var session models.ChatSession
		config.DB.First(&session, req.SessionID)
		if session.Title == "新对话" {
			go func(sid uint, msg string) {
				newTitle := generateTitleByAI(msg)
				config.DB.Model(&models.ChatSession{}).Where("id = ?", sid).Update("title", newTitle)
			}(req.SessionID, req.Message)
		}
	}

	var contextStr string
	var sources []services.SourceItem
	var currentSystemPrompt string //准备一个变量装载提示词

	// ================= 语义检索：去向量库找线索 =================
	if req.KbID > 0 {
		//先去数据库查出这个知识库的专属 Prompt
		var kb models.KnowledgeBase
		if err := config.DB.First(&kb, req.KbID).Error; err == nil {
			if kb.SystemPrompt != "" {
				currentSystemPrompt = kb.SystemPrompt
			} else {
				currentSystemPrompt = "你是一个专业的企业知识库助手。请根据以下【背景知识】准确回答用户的问题。\n若背景知识无法回答问题，请诚实说明“知识库中未找到相关信息”，不要瞎编。"
			}
		}
		//然后再去向量库找线索
		var err error
		contextStr, sources, err = services.SearchTopChunksWithSources(req.KbID, req.Message)
		if err != nil {
			fmt.Printf("检索失败: %v\n", err)
		}
	}
	//处理临时附件
	var tempFileContent string
	if req.TempFileId != "" {
		filePath := filepath.Join("./upload/temp", req.TempFileId)
		fileBytes, err := os.ReadFile(filePath)
		if err == nil {
			tempFileContent = string(fileBytes)
		} else {
			fmt.Printf("读取临时附件失败: %v\n", err)
		}
	}

	// =================构造超级 Prompt =================
	finalPrompt := req.Message
	if contextStr != "" || tempFileContent != "" {
		// 如果没有走知识库，系统提示词可能是空的，给个保底人设
		if currentSystemPrompt == "" {
			currentSystemPrompt = "你是一个专业的 AI 助手。请结合我提供的参考资料，准确回答我的问题。"
		}
		promptBuilder := currentSystemPrompt + "\n\n"
		//如果有全局知识库的内容，拼进去
		if contextStr != "" {
			promptBuilder += "【知识库背景】：\n" + contextStr + "\n\n"
		}
		//如果有刚上传的附件内容，拼进去
		if tempFileContent != "" {
			promptBuilder += "【用户上传的文档内容】：\n" + tempFileContent + "\n\n"
		}
		// 最后垫底的是用户当前的问题
		promptBuilder += "【用户的问题】：\n" + req.Message
		finalPrompt = promptBuilder
	}

	// 如果要触发思维链，DeepSeek 官方的推理模型名字必须是 deepseek-reasoner
	modelName := services.GetSysConfig("llm_model_name")
	if modelName == "" {
		modelName = "deepseek-reasoner"
	}
	//动态分配大模型 API 地址和密钥
	var baseURL, apiKey string

	if strings.HasPrefix(modelName, "deepseek") {
		baseURL = "https://api.deepseek.com/v1" // DeepSeek 的官方兼容地址
		apiKey = services.GetSysConfig("deepseek_api_key")
	} else if strings.HasPrefix(modelName, "glm") {
		baseURL = "https://open.bigmodel.cn/api/paas/v4" // 智谱 GLM 的官方兼容地址
		apiKey = services.GetSysConfig("zhipu_api_key")
	}
	if apiKey == "" {
		c.JSON(http.StatusInternalServerError, models.Response{Code: 500, Message: "系统未配置该模型的 API Key，请前往【系统设置】进行配置！"})
		return
	}
	aiConfig := openai.DefaultConfig(apiKey)
	aiConfig.BaseURL = baseURL
	client := openai.NewClientWithConfig(aiConfig)
	// ================= 组装请求参数并开启 Stream =================
	messages := []openai.ChatCompletionMessage{
		{Role: openai.ChatMessageRoleUser, Content: finalPrompt},
	}
	if req.IsContinue && req.PartialContent != "" {
		messages = append(messages, openai.ChatCompletionMessage{
			Role:    openai.ChatMessageRoleAssistant,
			Content: req.PartialContent,
		})
	}
	chatReq := openai.ChatCompletionRequest{
		Model:    modelName,
		Messages: messages,
		Stream:   true, // 开启流式开关
		//强制要求流式返回的最后一个数据包中带有 Token 统计
		StreamOptions: &openai.StreamOptions{IncludeUsage: true},
	}

	stream, err := client.CreateChatCompletionStream(c.Request.Context(), chatReq)
	if err != nil {
		c.JSON(http.StatusOK, models.Response{
			Code:    400,
			Message: "大模型拒绝了访问，请检查 API Key！报错: " + err.Error()})
		return
	}
	defer stream.Close()

	// ================= 设置 SSE (Server-Sent Events) 核心安全响应头 =================
	c.Writer.Header().Set("Content-Type", "text/event-stream")
	c.Writer.Header().Set("Cache-Control", "no-cache, no-transform")
	c.Writer.Header().Set("Connection", "keep-alive")
	c.Writer.Header().Set("X-Accel-Buffering", "no")

	var fullAnswer string //  准备一个空杯子，用来一点点收集大模型的完整正式回答
	var totalTokens int

	// =================  循环读取流，实时推给前端 =================
	for {
		select {
		case <-c.Request.Context().Done():
			//监听到前端断开连接（用户点了暂停按钮）
			if req.SessionID > 0 && fullAnswer != "" {
				if req.IsContinue {
					// 找出现存的最后一条半截 AI 消息，把新吐出来的字追加上去
					var lastMsg models.ChatMessage
					if err := config.DB.Where("session_id = ? AND role = ?", req.SessionID, "assistant").Order("id desc").First(&lastMsg).Error; err == nil {
						config.DB.Model(&lastMsg).Update("content", lastMsg.Content+fullAnswer)
					}
				} else {
					aiMsg := models.ChatMessage{
						SessionID: req.SessionID,
						Role:      "assistant",
						Content:   fullAnswer,
						Tokens:    totalTokens,
					}
					config.DB.Create(&aiMsg)
				}
			}
			return // 彻底切断当前 Goroutine，放过大模型连接
		default:
			//平级平滑过渡，前端还在，继续往下走去接大模型的字
		}
		response, err := stream.Recv()
		// 如果读到末尾 EOF，或者发生异常
		if err != nil {
			// 发送结束标志和溯源数据给前端
			sourcesJSON, _ := json.Marshal(sources)
			c.Writer.Write([]byte(fmt.Sprintf("data: {\"type\":\"done\", \"sources\": %s}\n\n", string(sourcesJSON))))
			if flusher, ok := c.Writer.(http.Flusher); ok {
				flusher.Flush()
			} else {
				c.Writer.Flush()
			}

			// 对话结束了，现在杯子（fullAnswer）装满了！把它存入数据库！
			if req.SessionID > 0 && fullAnswer != "" {
				if req.IsContinue {
					// 找出现存的最后一条半截 AI 消息，把新吐出来的字追加上去
					var lastMsg models.ChatMessage
					if err := config.DB.Where("session_id = ? AND role = ?", req.SessionID, "assistant").Order("id desc").First(&lastMsg).Error; err == nil {
						config.DB.Model(&lastMsg).Update("content", lastMsg.Content+fullAnswer)
					}
				} else {
					aiMsg := models.ChatMessage{
						SessionID: req.SessionID,
						Role:      "assistant",
						Content:   fullAnswer,
						Tokens:    totalTokens,
					}
					config.DB.Create(&aiMsg)
				}
			}
			return // 彻底结束接口
		}
		if response.Usage != nil {
			totalTokens = response.Usage.TotalTokens
		}
		// 拿到大模型刚刚吐出来的一个“字”或“片段”
		delta := response.Choices[0].Delta
		if len(response.Choices) > 0 {
			delta = response.Choices[0].Delta
			//  情景 A：如果是大模型的“思维链思考过程”
			if delta.ReasoningContent != "" {
				escapedReasoning, _ := json.Marshal(delta.ReasoningContent) // 自动带上双引号并转义换行符
				c.Writer.Write([]byte(fmt.Sprintf("data: {\"type\":\"reasoning\", \"content\":%s}\n\n", string(escapedReasoning))))
				if flusher, ok := c.Writer.(http.Flusher); ok {
					flusher.Flush()
				} else {
					c.Writer.Flush()
				}
			}

			// 情景 B：如果是大模型的“最终正式回答”
			if delta.Content != "" {
				fullAnswer += delta.Content // 把它装进杯子里存起来（后端用）
				escapedContent, _ := json.Marshal(delta.Content)
				c.Writer.Write([]byte(fmt.Sprintf("data: {\"type\":\"answer\", \"content\":%s}\n\n", string(escapedContent))))
				if flusher, ok := c.Writer.(http.Flusher); ok {
					flusher.Flush()
				} else {
					c.Writer.Flush()
				}
			}
		}
	}
}
