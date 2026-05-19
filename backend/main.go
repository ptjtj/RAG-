package main

import (
	"backend/config"
	"backend/controllers"
	"backend/middlewares"
	"backend/services"
	"fmt"
	"log"

	"github.com/gin-gonic/gin"
	"github.com/joho/godotenv"
	swaggerFiles "github.com/swaggo/files"
	ginSwagger "github.com/swaggo/gin-swagger"
)

import (
	_ "backend/docs"
)

// @title AI 知识库管理平台 API
// @version 1.0
// @description 这是基于 Gin 和 OpenAPI 构建的 AI-KMS 后端服务。
// @host localhost:8080
// @BasePath /api/v1
func main() {

	if err := godotenv.Load(); err != nil {
		log.Println("⚠️ 警告: 未找到 .env 文件，将尝试使用系统环境变量")
	}
	// 初始化数据库及基础数据
	config.InitDB()

	config.InitSeedData()
	//点火 AI 引擎
	services.InitAI()

	vec, err := services.GetEmbedding("测试一下智谱的向量接口！")
	if err != nil {
		fmt.Printf("获取向量失败，智谱返回的错误是：%v\n", err)
		fmt.Println("架构师提示：请去 services/ai_service.go 检查你的 zhipuKey 是否填对！")
	} else {
		fmt.Printf("测试向量提取，成功获取到 %d 维度的浮点数，前三个数字是: %v (错误: %v)\n", len(vec), vec[:3], err)
	}
	r := gin.Default()
	// 挂载中间件
	r.Use(middlewares.Cors())
	// ：配置静态文件访问 这样当访问 /uploads 时，Gin 会去本地文件夹 ./uploads 找文件
	r.Static("/uploads", "./uploads")
	// 注册 Swagger
	r.GET("/swagger/*any", ginSwagger.WrapHandler(swaggerFiles.Handler))

	// 注册路由 (交给控制器处理)
	public := r.Group("/api/v1")
	{
		// 预留给未来的登录接口
		public.POST("/login", controllers.Login)
		public.POST("/refresh", controllers.RefreshToken)

		public.POST("/register", controllers.Register)
	}

	protected := r.Group("/api/v1")
	protected.Use(middlewares.JWTAuth())
	{
		protected.GET("/users", controllers.GetUserList)
		protected.DELETE("/users/:id", controllers.DeleteUser)
		// ==== 个人中心 ====
		protected.PUT("/user/password", controllers.UpdatePassword)
		protected.POST("/user/avatar", controllers.UploadAvatar)
		protected.DELETE("/user/avatar", controllers.ClearAvatar)
		protected.PUT("/user/username", controllers.UpdateUsername)
		// ==== 知识库管理 ====
		protected.GET("/kb", controllers.GetKnowledgeBases)
		protected.POST("/kb", controllers.CreateKnowledgeBase)
		protected.DELETE("/kb/:id", controllers.DeleteKnowledgeBase)
		protected.PUT("/kb/:id", controllers.UpdateKnowledgeBase)
		protected.GET("/kb/:kb_id/docs", controllers.GetDocuments)
		protected.POST("/kb/:kb_id/upload", controllers.UploadDocument)
		// ==== 智能对话 ====
		protected.POST("/chat", controllers.StreamChat)
		// 给 SimpleChat 安排一个专属的测试接口地址
		//protected.POST("/chat/simple", controllers.SimpleChat)
		protected.GET("/sessions", controllers.GetSessions)
		protected.POST("/sessions", controllers.CreateSession)
		protected.GET("/sessions/:id/messages", controllers.GetSessionMessages)
		protected.DELETE("/sessions/:id", controllers.DeleteSession)
		protected.PUT("/sessions/:id", controllers.UpdateSession)
		// ==== 系统配置 ====
		protected.GET("/configs", controllers.GetConfigs)
		protected.PUT("/configs", controllers.UpdateConfig)
		protected.POST("/configs/batch", controllers.BatchUpdateConfigs)
		// ==== 测试接口 ====
		protected.POST("/test-embedding", controllers.TestEmbedding)
		//注册删除文档的路由
		protected.DELETE("/docs/:doc_id", controllers.DeleteDocument)
	}

	log.Fatal(r.Run(":8080"))
}
