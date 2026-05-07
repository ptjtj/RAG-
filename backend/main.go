package main

import (
	"backend/config"
	"backend/controllers"
	"backend/middlewares"
	"backend/services"
	"fmt"

	"github.com/gin-gonic/gin"
	swaggerFiles "github.com/swaggo/files"
	ginSwagger "github.com/swaggo/gin-swagger"

	_ "backend/docs"
)

// @title AI 知识库管理平台 API
// @version 1.0
// @description 这是基于 Gin 和 OpenAPI 构建的 AI-KMS 后端服务。
// @host localhost:8080
// @BasePath /api/v1
func main() {
	// 1. 初始化数据库及基础数据
	config.InitDB()
	//点火 AI 引擎
	services.InitAI()

	vec, err := services.GetEmbedding("测试一下智谱的向量接口！")
	if err != nil {
		fmt.Println("获取向量失败，智谱返回的错误是：%v\n", err)
		fmt.Println("架构师提示：请去 services/ai_service.go 检查你的 zhipuKey 是否填对！")
	} else {
		fmt.Printf("测试向量提取，成功获取到 %d 维度的浮点数，前三个数字是: %v (错误: %v)\n", len(vec), vec[:3])
	}
	r := gin.Default()
	r.Use(middlewares.Cors()) // 挂载中间件

	// 3. 注册 Swagger
	r.GET("/swagger/*any", ginSwagger.WrapHandler(swaggerFiles.Handler))

	// 4. 注册路由 (交给控制器处理)
	v1 := r.Group("/api/v1")
	{
		v1.GET("/kb", controllers.GetKnowledgeBases)
		v1.POST("/kb", controllers.CreateKnowledgeBase)
		v1.DELETE("/kb/:id", controllers.DeleteKnowledgeBase)
		v1.GET("/kb/:kb_id/docs", controllers.GetDocuments)
		v1.POST("/kb/:kb_id/upload", controllers.UploadDocument)
		v1.POST("/chat", controllers.SimpleChat)
		v1.POST("/test-embedding", controllers.TestEmbedding)
		//注册删除文档的路由
		v1.DELETE("/docs/:doc_id", controllers.DeleteDocument)
	}

	r.Run(":8080")
}
