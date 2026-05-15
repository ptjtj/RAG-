package models

//数据模型层
import (
	"time"

	"gorm.io/gorm"
)

// KnowledgeBase 知识库模型
type KnowledgeBase struct {
	ID          uint           `gorm:"primarykey" json:"id"`
	CreatedAt   time.Time      `json:"createdAt"`
	UpdatedAt   time.Time      `json:"updatedAt"`
	DeletedAt   gorm.DeletedAt `gorm:"index" json:"-"`
	Name        string         `gorm:"type:varchar(100);not null" json:"name"`
	Description string         `gorm:"type:text" json:"description"`
	DocCount    int            `gorm:"default:0" json:"docCount"`
	Status      string         `gorm:"type:varchar(20);default:'active'" json:"status"`
	ChunkSize   int            `gorm:"default:500" json:"chunkSize"`
	//系统提示词字段
	SystemPrompt string `gorm:"type:text" json:"systemPrompt"`
}

// CreateKBRequest 创建知识库请求参数
type CreateKBRequest struct {
	Name        string `json:"name" binding:"required"`
	Description string `json:"description"`
	ChunkSize   int    `json:"chunkSize"`
	//接收前端传来的提示词
	SystemPrompt string `json:"systemPrompt"`
}

// Response 通用响应格式
type Response struct {
	Code    int         `json:"code"`
	Message string      `json:"message"`
	Data    interface{} `json:"data,omitempty"`
}

// UpdateKbRequest 更新知识库的请求参数
type UpdateKBRequest struct {
	Name        string `json:"name" binding:"required" example:"研发需求库"`
	Description string `json:"description" example:"存放所有研发相关的基础文档"`
	//允许用户修改提示词
	SystemPrompt string `json:"systemPrompt" example:"你是一个专业的法务..."`
}
