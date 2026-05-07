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
}

// CreateKBRequest 创建知识库请求参数
type CreateKBRequest struct {
	Name        string `json:"name" binding:"required"`
	Description string `json:"description"`
	ChunkSize   int    `json:"chunkSize"`
}

// Response 通用响应格式
type Response struct {
	Code    int         `json:"code"`
	Message string      `json:"message"`
	Data    interface{} `json:"data,omitempty"`
}
