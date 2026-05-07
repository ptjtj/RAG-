package controllers

import (
	"backend/models"
	"backend/services"
	"fmt"
	"net/http"

	"github.com/gin-gonic/gin"
)

// ChatRequest 接收前端提问的结构体
type ChatRequest struct {
	Message string `json:"message" binding:"required"`
	KbID    uint   `json:"kbId"` // 👈 接收前端传来的知识库 ID
}

// SimpleChat AI 聊天测试接口
func SimpleChat(c *gin.Context) {
	var req ChatRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, models.Response{Code: 400, Message: "参数错误: " + err.Error()})
		return
	}

	userMsg := req.Message
	var contextStr string
	var sources []services.SourceItem //  准备装入溯源信息

	// 1. 语义检索：带着 KbID 去向量记忆库里找线索
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

	// 把问题发给 DeepSeek
	answer, err := services.TestChat(finalPrompt)
	if err != nil {
		c.JSON(http.StatusInternalServerError, models.Response{Code: 500, Message: "AI 请求失败: " + err.Error()})
		return
	}

	// 👇 4. 核心修复：将返回的 Data 变成一个包含 text 和 sources 的对象！
	c.JSON(http.StatusOK, models.Response{
		Code:    200,
		Message: "success",
		Data: map[string]interface{}{
			"text":    answer,  // AI 的回答
			"sources": sources, // 刚才捞出来的文件来源
		},
	})
}
