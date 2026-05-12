package config

// 配置与数据库连接（改为从环境变量读取，保留默认回退）
import (
	"fmt"
	"log"
	"os"

	"backend/models"

	"gorm.io/driver/mysql"
	"gorm.io/gorm"
)

// DB 暴露给全局使用的数据库实例 (必须大写)
var DB *gorm.DB

// InitDB 初始化数据库 (必须大写)
func InitDB() {
	// 从环境变量读取数据库配置，未设置时使用默认值
	dbUser := os.Getenv("DB_USER")
	if dbUser == "" {
		dbUser = "root"
	}
	dbPass := os.Getenv("DB_PASS")
	if dbPass == "" {
		dbPass = "123456"
	}
	dbHost := os.Getenv("DB_HOST")
	if dbHost == "" {
		dbHost = "127.0.0.1"
	}
	dbPort := os.Getenv("DB_PORT")
	if dbPort == "" {
		dbPort = "3306"
	}
	dbName := os.Getenv("DB_NAME")
	if dbName == "" {
		dbName = "ai_kms"
	}

	dsn := fmt.Sprintf("%s:%s@tcp(%s:%s)/%s?charset=utf8mb4&parseTime=True&loc=Local", dbUser, dbPass, dbHost, dbPort, dbName)

	var err error
	DB, err = gorm.Open(mysql.Open(dsn), &gorm.Config{})
	if err != nil {
		log.Fatal("连接数据库失败，请检查环境变量或 DSN: ", err)
	}

	err = DB.AutoMigrate(
		&models.KnowledgeBase{},
		&models.Document{}, // 建文档表
		&models.DocumentChunk{},
		&models.ChatSession{},
		&models.ChatMessage{},
		&models.User{},
	)
	if err != nil {
		log.Fatal("自动建表失败: ", err)
	}

	log.Printf("MySQL 数据库连接并迁移成功：%s@%s:%s/%s", dbUser, dbHost, dbPort, dbName)
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
	var adminCount int64
	DB.Model(&models.User{}).Where("username = ?", "admin").Count(&adminCount)
	if adminCount == 0 {
		adminUser := models.User{
			Username: "admin",
			Password: "123456",
		}
		DB.Create(&adminUser)
		log.Println("检测到数据库无用户，已自动在 MySQL 中创建默认管理员: admin / 123456")
	}
}
