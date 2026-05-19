package controllers

import (
	"backend/config"
	"backend/models"
	"net/http"

	"github.com/gin-gonic/gin"
)

// GetSessions 获取当前用户的会话列表
// @Summary 获取会话列表
// @Description 按时间降序获取历史会话
// @Tags 会话管理
// @Accept json
// @Produce json
// @Success 200 {object} models.Response "成功"
// @Router /sessions [get]
func GetSessions(c *gin.Context) {
	var sessions []models.ChatSession
	//从 JWT Token 中解析出 userID
	userID, exists := c.Get("userID")
	if !exists {
		c.JSON(http.StatusUnauthorized, models.Response{Code: 401, Message: "未授权"})
		return
	}
	result := config.DB.Where("user_id = ?", userID).Order("updated_at desc").Find(&sessions)
	if result.Error != nil {
		c.JSON(http.StatusInternalServerError, models.Response{Code: 500, Message: "获取会话失败"})
		return
	}
	c.JSON(http.StatusOK, models.Response{Code: 200, Message: "success", Data: sessions})
}

// CreateSession 新建一个对话会话
// @Summary 新建会话
// @Description 创建一个新的空白聊天会话
// @Tags 会话管理
// @Accept json
// @Produce json
// @Param data body models.CreateSessionRequest true "新建参数"
// @Success 200 {object} models.Response "成功"
// @Router /sessions [post]
func CreateSession(c *gin.Context) {
	var req models.CreateSessionRequest
	// 绑定前端传来的参数 (即使前端没传，也没关系，我们会在下面给默认值)
	_ = c.ShouldBindJSON(&req)
	if req.Title == "" {
		req.Title = "新对话"
	}
	userID, _ := c.Get("userID")
	session := models.ChatSession{
		UserID:          userID.(uint), //赋值真实用户 ID
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

// GetSessionMessages 获取某个会话的聊天历史记录
// @Summary 获取聊天记录
// @Description 根据会话ID获取该会话下的所有聊天消息
// @Tags 会话管理
// @Accept json
// @Produce json
// @Param id path int true "会话ID"
// @Success 200 {object} models.Response "成功"
// @Router /sessions/{id}/messages [get]
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

// UpdateSession 更新会话 (重命名、置顶/取消置顶)
// @Summary 更新会话信息
// @Description 支持局部更新会话的标题或置顶状态
// @Tags 会话管理
// @Accept json
// @Produce json
// @Param id path int true "会话ID"
// @Param data body models.UpdateSessionRequest true "更新参数"
// @Success 200 {object} models.Response "成功"
// @Router /sessions/{id} [put]
func UpdateSession(c *gin.Context) {
	sessionId := c.Param("id")
	var req models.UpdateSessionRequest
	if err := c.ShouldBindJSON(&req); err != nil {

		c.JSON(http.StatusBadRequest, models.Response{Code: 400, Message: "参数错误: " + err.Error()})
		return
	}
	// 动态构建需要更新的字段
	updates := make(map[string]interface{})
	if req.Title != nil {
		updates["title"] = *req.Title
	}
	if req.IsPinned != nil {
		updates["isPinned"] = *req.IsPinned
	}
	if len(updates) == 0 {
		c.JSON(http.StatusOK, models.Response{Code: 200, Message: "无需修改"})
		return
	}
	result := config.DB.Model(&models.ChatSession{}).Where("id = ?", sessionId).Updates(updates)
	if result.Error != nil {
		c.JSON(http.StatusInternalServerError, models.Response{Code: 500, Message: "更新会话失败"})
		return
	}
	c.JSON(http.StatusOK, models.Response{Code: 200, Message: "更新成功"})
}

// DeleteSession 删除一个历史会话
// @Summary 删除会话
// @Description 删除整个会话及其关联的所有消息
// @Tags 会话管理
// @Accept json
// @Produce json
// @Param id path int true "会话ID"
// @Success 200 {object} models.Response "成功"
// @Router /sessions/{id} [delete]
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
