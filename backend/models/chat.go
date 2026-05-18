package models

import "time"

// ChatRequest 接收前端提问的结构体
type ChatRequest struct {
	Message   string `json:"message" binding:"required"`
	KbID      uint   `json:"kbId"` // 接收前端传来的知识库 ID
	SessionID uint   `json:"sessionId"`
	// 接收继续生成的信号和上下文
	IsContinue     bool   `json:"isContinue"`     // 是否为“继续生成”
	PartialContent string `json:"partialContent"` // 已经生成的前半截内容
}
type ChatSession struct {
	ID              uint      `gorm:"primary_key" json:"id"`
	UserID          uint      `json:"user_id"`
	Title           string    `json:"title"`
	KnowledgeBaseID uint      `json:"kbId"` // 当前会话绑定的知识库 ID
	CreatedAt       time.Time `json:"createdAt"`
	UpdatedAt       time.Time `json:"updatedAt"`
}

type ChatMessage struct {
	ID        uint      `gorm:"primaryKey" json:"id"`
	SessionID uint      `json:"sessionId" gorm:"index"`
	Role      string    `json:"role" `
	Content   string    `gorm:"type:text" json:"content"`
	CreatedAt time.Time `json:"createdAt"`
}
