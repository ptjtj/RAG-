package controllers

import (
	"backend/config"
	"backend/models"
	"net/http"
	"time"

	"github.com/gin-gonic/gin"
)

// GetDashboardStats 获取后台首页大屏数据
// @Summary 获取系统数据大屏设计
// @Description 统计系统的文档总数、用户总数、今日提问次数以及近7天的Token消耗与虚拟成本趋势
// @Tags 数据看板 (Dashboard)
// @Security BearerAuth
// @Accept json
// @Produce json
// @Success 200 {object} models.Response{data=models.DashboardStatsData} "获取成功"
// @Failure 401 {object} models.Response "未授权"
// @Failure 500 {object} models.Response "系统内部错误"
// @Router /dashboard [get]
func GetDashboardStats(c *gin.Context) {
	//基础指标统计
	var totalDocs, totalUsers, todayChats int64
	config.DB.Model(&models.Document{}).Count(&totalDocs)
	config.DB.Model(&models.User{}).Count(&totalUsers)

	today := time.Now().Format("2006-01-02")
	config.DB.Model(&models.ChatMessage{}).
		Where("role=? AND DATE(created_at)=?", "user", today).
		Count(&todayChats)

	type sqlResult struct {
		Date  string `gorm:"column:date"`
		Total int    `gorm:"column:total"`
	}
	var rows []sqlResult
	config.DB.Raw(`
		SELECT DATE(created_at) as date, SUM(tokens) as total
		FROM chat_messages
		WHERE role = 'assistant' AND created_at >= DATE_SUB(CURDATE(), INTERVAL 6 DAY)
		GROUP BY date
		ORDER BY date ASC
	`).Scan(&rows)
	//转换为强类型 DTO 格式，并动态计算人民币成本
	var costTrend []models.DailyTokenStat
	for _, row := range rows {
		calculatedCost := float64(row.Total) / 1000000.0 * 2.0
		costTrend = append(costTrend, models.DailyTokenStat{
			Date:        row.Date,
			TotalTokens: row.Total,
			Cost:        calculatedCost,
		})
	}
	// 组装强类型响应对象
	dashboardData := models.DashboardStatsData{
		TotalDocs:  totalDocs,
		TotalUsers: totalUsers,
		TodayChats: todayChats,
		CostTrend:  costTrend,
	}
	c.JSON(http.StatusOK, models.Response{Code: 200,
		Message: "success",
		Data:    dashboardData})
}
