package controllers

import (
	"backend/config"
	"backend/models"
	"net/http"

	"github.com/gin-gonic/gin"
)

func GetSessions(c *gin.Context) {
	var sessions []models.ChatSession
	// 在真实多用户系统中，应该从 JWT Token 中解析出 UserID。
	// 目前为了单机演示跑通，默认查询 UserID = 1 的数据
	result := config.DB.Where("user_id = ?", 1).Order("updated_at desc").Find(&sessions)
	if result.Error != nil {
		c.JSON(http.StatusInternalServerError, models.Response{Code: 500, Message: "获取会话失败"})
		return
	}
	c.JSON(http.StatusOK, models.Response{Code: 200, Message: "success", Data: sessions})
}

// 新建一个对话会话
type CreateSessionRequest struct {
	Title string `json:"title"`
	KbID  uint   `json:"kbId"`
}

func CreateSession(c *gin.Context) {
	var req CreateSessionRequest
	// 绑定前端传来的参数 (即使前端没传，也没关系，我们会在下面给默认值)
	_ = c.ShouldBindJSON(&req)
	if req.Title == "" {
		req.Title = "新对话"
	}
	session := models.ChatSession{
		UserID:          1,
		Title:           req.Title,
		KnowledgeBaseID: req.KbID,
	}
	// 插入数据库
	if err := config.DB.Create(&session).Error; err != nil {
		c.JSON(http.StatusInternalServerError, models.Response{Code: 500, Message: "创建会话失败"})
		return
	}

	c.JSON(http.StatusOK, models.Response{Code: 200, Message: "创建成功", Data: session})
}

// 获取某个会话的聊天历史记录
func GetSessionMessages(c *gin.Context) {
	sessionId := c.Param("id") // 从 URL 路径中拿到动态参数 :id

	var messages []models.ChatMessage

	// 聊天记录按时间【升序】排列 (Order("created_at asc"))
	result := config.DB.Where("session_id = ?", sessionId).Order("created_at asc").Find(&messages)
	if result.Error != nil {
		c.JSON(http.StatusInternalServerError, models.Response{Code: 500, Message: "获取聊天记录失败"})
		return
	}

	c.JSON(http.StatusOK, models.Response{Code: 200, Message: "success", Data: messages})
}

// 删除一个历史会话
func DeleteSession(c *gin.Context) {
	sessionId := c.Param("id")

	config.DB.Where("session_id = ?", sessionId).Delete(&models.ChatMessage{})

	// 再删除会话本身
	result := config.DB.Delete(&models.ChatSession{}, sessionId)

	if result.Error != nil {
		c.JSON(http.StatusInternalServerError, models.Response{Code: 500, Message: "删除会话失败"})
		return
	}

	c.JSON(http.StatusOK, models.Response{Code: 200, Message: "删除成功"})
}
