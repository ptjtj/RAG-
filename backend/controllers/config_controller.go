package controllers

import (
	"backend/config"
	"backend/models"
	"net/http"
	"strings"

	"github.com/gin-gonic/gin"
)

// GetConfigs 获取所有系统配置
// @Summary 获取所有系统配置项
// @Description 获取系统大模型API Key等动态配置
// @Tags 系统配置
// @Security BearerAuth
// @Produce json
// @Success 200 {object} models.Response
// @Router /configs [get]
func GetConfigs(c *gin.Context) {
	var configs []models.SysConfig
	config.DB.Find(&configs)
	c.JSON(http.StatusOK, models.Response{Code: 200, Data: configs})
}

// UpdateConfig 更新单个配置
// @Summary 更新单个系统配置
// @Description 修改指定的系统配置项的值
// @Tags 系统配置
// @Security BearerAuth
// @param data body models.SysConfig true "配置内容"
// @Success 200 {object} models.Response
// @Router /configs [put]
func UpdateConfig(c *gin.Context) {
	var req models.SysConfig
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, models.Response{Code: 400, Message: "参数错误"})
		return
	}
	cleanValue := strings.TrimSpace(req.ConfigValue)
	if cleanValue == "" {
		c.JSON(http.StatusBadRequest, models.Response{Code: 400, Message: "安全拦截：配置内容不能为空！"})
	}
	config.DB.Model(&models.SysConfig{}).Where("config_key = ?", req.ConfigKey).Update("config_value", cleanValue)
	c.JSON(http.StatusOK, models.Response{Code: 200, Message: "配置更新成功"})
}

// BatchUpdateConfigs 批量更新系统配置
// @Summary 批量更新系统配置
// @Tags 系统配置
// @Security BearerAuth
// @Accept json
// @Param data body []models.SysConfig true "配置列表"
// @Router /configs/batch [post]
func BatchUpdateConfigs(c *gin.Context) {
	var req []models.SysConfig
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, models.Response{Code: 400, Message: "数据格式错误"})
		return
	}
	tx := config.DB.Begin()

	for _, item := range req {
		cleanValue := strings.TrimSpace(item.ConfigValue)
		if cleanValue == "" {
			tx.Rollback()
			c.JSON(http.StatusBadRequest, models.Response{Code: 400, Message: "配置项 " + item.ConfigKey + " 不能为空"})
			return
		}
		err := tx.Model(&models.SysConfig{}).
			Where("config_key = ?", item.ConfigKey).
			Update("config_value", cleanValue).Error
		if err != nil {
			tx.Rollback()
			c.JSON(http.StatusBadRequest, models.Response{Code: 500, Message: "数据库写入失败"})
			return
		}
	}
	tx.Commit()
	c.JSON(http.StatusOK, models.Response{Code: 200, Message: "所有配置已成功保存"})
}
