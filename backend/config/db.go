package config

//配置与数据库连接
import (
	"log"

	"backend/models" // 引入你的 models 包

	"gorm.io/driver/mysql"
	"gorm.io/gorm"
)

// DB 暴露给全局使用的数据库实例 (必须大写)
var DB *gorm.DB

// InitDB 初始化数据库 (必须大写)
func InitDB() {
	dsn := "root:123456@tcp(127.0.0.1:3306)/ai_kms?charset=utf8mb4&parseTime=True&loc=Local"

	var err error
	DB, err = gorm.Open(mysql.Open(dsn), &gorm.Config{})
	if err != nil {
		log.Fatal("连接数据库失败，请检查密码或库名: ", err)
	}

	err = DB.AutoMigrate(
		&models.KnowledgeBase{},
		&models.Document{}, //建文档表
		&models.DocumentChunk{},
	)
	if err != nil {
		log.Fatal("自动建表失败: ", err)
	}

	log.Println("MySQL 数据库连接并迁移成功！")
}

// InitSeedData 播种基础数据 (必须大写)
func InitSeedData() {
	var count int64
	DB.Model(&models.KnowledgeBase{}).Count(&count)
	if count == 0 {
		defaultKbs := []models.KnowledgeBase{
			{Name: "新手入门体验库", Description: "欢迎来到AI 知识库！", Status: "active", DocCount: 3, ChunkSize: 500},
			{Name: "研发部架构设计文档", Description: "包含微服务架构图、API 设计规范等。", Status: "active", DocCount: 12, ChunkSize: 800},
		}
		DB.Create(&defaultKbs)
		log.Println("数据库初始化成功：已自动为你插入 2 条示例知识库！")
	}
}
