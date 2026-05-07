package models

import (
	"time"

	"github.com/google/uuid"
	"gorm.io/gorm"
)

type Document struct {
	ID              string         `gorm:"primarykey;type:char(36)" json:"id"`
	KnowledgeBaseID uint           `gorm:"index;not null" json:"knowledgeBaseId"` // 所属知识库的 ID
	FileName        string         `gorm:"type:varchar(255);not null" json:"fileName"`
	FileMD5         string         `gorm:"type:varchar(32);index" json:"fileMD5"`            // 文件的唯一数字指纹
	FileType        string         `gorm:"type:varchar(50)" json:"fileType"`                 // 比如 pdf, txt, docx
	FileSize        int64          `json:"fileSize"`                                         // 文件大小(字节)
	FilePath        string         `gorm:"type:varchar(500)" json:"filePath"`                // 文件在服务器上的物理路径
	Status          string         `gorm:"type:varchar(20);default:'pending'" json:"status"` // 状态: pending等待解析, parsing解析中, success成功, failed失败
	ChunkCount      int            `gorm:"default:0" json:"chunkCount"`                      // 切片数量
	CreatedAt       time.Time      `json:"createdAt"`
	UpdatedAt       time.Time      `json:"updatedAt"`
	DeletedAt       gorm.DeletedAt `gorm:"index" json:"-"`
}

func (doc *Document) BeforeCreate(tx *gorm.DB) (err error) {
	doc.ID = uuid.New().String()
	return
}
