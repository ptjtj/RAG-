package models

// // DailyTokenStat 每日 Token 消耗统计明细
type DailyTokenStat struct {
	Date        string  `json:"date" example:"2020-01-01"`
	TotalTokens int     `json:"totalTokens" example:"01234"`
	Cost        float64 `json:"cost" example:"0.256"`
}

// DashboardStatsData 大屏看板核心统计数据
type DashboardStatsData struct {
	TotalDocs  int64            `json:"totalDocs" example:"80`
	TotalUsers int64            `json:"totalUsers" example:"12"`
	TodayChats int64            `json:"todayChats" example:"156"`
	CostTrend  []DailyTokenStat `json:"costTrend"`
}
