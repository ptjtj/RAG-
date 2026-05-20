package controllers

import (
	"net/http"
	"strconv"

	"backend/config" // 引入配置包，为了使用 config.DB
	"backend/models" // 引入模型包

	"github.com/gin-gonic/gin"
)

// GetKnowledgeBases 获取知识库列表
// @Summary 获取知识库列表
// @Description 从数据库获取所有未被删除的知识库
// @Tags KnowledgeBase
// @Accept json
// @Produce json
// @Success 200 {object} models.Response{data=[]models.KnowledgeBase} "成功"
// @Router /kb [get]
// @ID getKnowledgeBases
func GetKnowledgeBases(c *gin.Context) {
	var kbs []models.KnowledgeBase
	//获取当前登录用户的 ID
	userID, exists := c.Get("userID")
	if !exists {
		c.JSON(http.StatusUnauthorized, models.Response{Code: 401, Message: "未授权"})
		return
	}
	config.DB.Where("user_id = ?", userID).Order("id desc").Find(&kbs)
	c.JSON(http.StatusOK, models.Response{Code: 200, Message: "success", Data: kbs})
}

// CreateKnowledgeBase 创建知识库
// @Summary 创建新知识库
// @Description 接收前端参数并在数据库中创建新记录
// @Tags KnowledgeBase
// @Accept json
// @Produce json
// @Param data body models.CreateKBRequest true "创建知识库请求体"
// @Success 200 {object} models.Response{data=models.KnowledgeBase} "成功"
// @Router /kb [post]
// @ID creatKnowledgeBase
func CreateKnowledgeBase(c *gin.Context) {
	var req models.CreateKBRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, models.Response{Code: 400, Message: "参数错误: " + err.Error()})
		return
	}
	userID, _ := c.Get("userID")
	kb := models.KnowledgeBase{
		UserID:       userID.(uint),
		Name:         req.Name,
		Description:  req.Description,
		ChunkSize:    req.ChunkSize,
		SystemPrompt: req.SystemPrompt,
		Status:       "active",
		DocCount:     0,
	}

	if err := config.DB.Create(&kb).Error; err != nil {
		c.JSON(http.StatusInternalServerError, models.Response{Code: 500, Message: "创建失败"})
		return
	}
	c.JSON(http.StatusOK, models.Response{Code: 200, Message: "success", Data: kb})
}

// DeleteKnowledgeBase 删除知识库
// @Summary 删除知识库
// @Description 根据 ID 软删除知识库记录
// @Tags KnowledgeBase
// @Accept json
// @Produce json
// @Param id path int true "知识库 ID"
// @Success 200 {object} models.Response "成功"
// @Router /kb/{id} [delete]
// @ID deleteKnowledgeBase
func DeleteKnowledgeBase(c *gin.Context) {
	idStr := c.Param("id")
	id, err := strconv.Atoi(idStr)
	if err != nil {
		c.JSON(http.StatusBadRequest, models.Response{Code: 400, Message: "无效的 ID"})
		return
	}

	if err := config.DB.Delete(&models.KnowledgeBase{}, id).Error; err != nil {
		c.JSON(http.StatusInternalServerError, models.Response{Code: 500, Message: "删除失败"})
		return
	}

	c.JSON(http.StatusOK, models.Response{Code: 200, Message: "success"})
}

// UpdateKnowledgeBase 更新知识库信息
// @Summary 更新知识库
// @Description 根据 ID 修改指定知识库的名称和描述
// @Tags KnowledgeBase
// @Security BearerAuth
// @Accept json
// @Produce json
// @Param id path int true "知识库 ID"
// @Param data body models.UpdateKBRequest true "更新参数"
// @Success 200 {object} models.Response "更新成功"
// @Failure 400 {object} models.Response "参数错误，名称不能为空"
// @Failure 500 {object} models.Response "更新失败"
// @Router /kb/{id} [put]
func UpdateKnowledgeBase(c *gin.Context) {
	id := c.Param("id")

	var req models.UpdateKBRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, models.Response{Code: 400, Message: "参数错误，名称不能为空"})
		return
	}
	result := config.DB.Model(&models.KnowledgeBase{}).Where("id = ?", id).Updates(map[string]interface{}{
		"name":          req.Name,
		"description":   req.Description,
		"system_prompt": req.SystemPrompt,
	})
	if result.Error != nil {
		c.JSON(http.StatusInternalServerError, models.Response{Code: 500, Message: "更新失败"})
		return
	}
	c.JSON(http.StatusOK, models.Response{Code: 200, Message: "更新成功"})
}
