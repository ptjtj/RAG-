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
	config.DB.Order("id desc").Find(&kbs)
	c.JSON(http.StatusOK, models.Response{Code: 200, Message: "success", Data: kbs})
}

// CreateKnowledgeBase 创建知识库
// @Summary 创建新知识库
// @Description 接收前端参数并在数据库中创建新记录
// @Tags KnowledgeBase
// @Accept json
// @Produce json
// @Param req body models.CreateKBRequest true "请求参数"
// @Success 200 {object} models.Response{data=models.KnowledgeBase} "成功"
// @Router /kb [post]
// @ID creatKnowledgeBase
func CreateKnowledgeBase(c *gin.Context) {
	var req models.CreateKBRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, models.Response{Code: 400, Message: "参数错误: " + err.Error()})
		return
	}

	kb := models.KnowledgeBase{
		Name:        req.Name,
		Description: req.Description,
		ChunkSize:   req.ChunkSize,
		Status:      "active",
		DocCount:    0,
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
