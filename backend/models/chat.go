package models

import "time"

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
