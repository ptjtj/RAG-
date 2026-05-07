package models

import (
	"time"

	"github.com/google/uuid"
	"gorm.io/gorm"
)

type DocumentChunk struct {
	ID         string    `gorm:"primarykey;type:char(36)" json:"id"`
	DocumentID string    `gorm:"index;type:char(36);not null" json:"documentId"` // 关联到具体哪份文档
	Content    string    `gorm:"type:text;not null" json:"content"`              // 切片出来的文本内容
	Vector     string    `gorm:"type:longtext" json:"-"`
	IsEmbedded bool      `gorm:"default:false" json:"isEmbedded"`
	WordCount  int       `json:"wordCount"` // 这段文本的字数
	CreatedAt  time.Time `json:"createdAt"`
}

// 给 Chunk 也加上自动生成 UUID 的钩子
func (chunk *DocumentChunk) BeforeCreate(tx *gorm.DB) (err error) {
	chunk.ID = uuid.New().String()
	return
}
