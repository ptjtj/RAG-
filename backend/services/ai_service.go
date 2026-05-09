package services

import (
	"context"
	"fmt"
	"log"
	"os"

	"github.com/joho/godotenv"
	"github.com/sashabaranov/go-openai"
)

// 定义全局AI客户端
var ChatClient *openai.Client
var EmbedClint *openai.Client

// InitAI 初始化大模型客户端
func InitAI() {
	err := godotenv.Load()
	if err != nil {
		log.Println("⚠️ 未找到 .env 文件，将尝试读取系统环境变量")
	}
	deepseekKey := os.Getenv("DEEPSEEK_API_KEY")
	if deepseekKey == "" {
		log.Fatal("❌ 致命错误：未找到 DEEPSEEK_API_KEY 环境变量！")
	}
	// 使用 OpenAI 的默认配置格式
	chatConfig := openai.DefaultConfig(deepseekKey)
	chatConfig.BaseURL = "https://api.deepseek.com"
	// 实例化客户端
	ChatClient = openai.NewClientWithConfig(chatConfig)
	zhipuKey := os.Getenv("ZHIPU_API_KEY")
	if zhipuKey == "" {
		log.Fatal("❌ 致命错误：未找到 ZHIPU_API_KEY 环境变量！")
	}
	embedConfig := openai.DefaultConfig(zhipuKey)
	embedConfig.BaseURL = "https://open.bigmodel.cn/api/paas/v4"
	EmbedClint = openai.NewClientWithConfig(embedConfig)
	fmt.Println(" AI 引擎初始化完毕！")
}

// TestChat 测试 deepseek 是否跑通的函数
func TestChat(question string) (string, error) {
	// 构造对话请求
	req := openai.ChatCompletionRequest{
		Model: "deepseek-chat",
		Messages: []openai.ChatCompletionMessage{
			{
				Role:    openai.ChatMessageRoleSystem,
				Content: "你是一个资深的 Go 语言全栈架构师，说话幽默风趣。",
			},
			{
				Role:    openai.ChatMessageRoleUser,
				Content: question,
			},
		},
	}
	// 发送请求给 DeepSeek 并等待回复
	resp, err := ChatClient.CreateChatCompletion(context.Background(), req)
	if err != nil {
		return "", err
	}
	// 返回 AI 说的话
	return resp.Choices[0].Message.Content, nil
}

// GetEmbedding 将文本转换为 1024 维度的向量
func GetEmbedding(text string) ([]float32, error) {
	req := openai.EmbeddingRequest{
		Input: []string{text},
		Model: openai.EmbeddingModel("embedding-3"),
	}
	resp, err := EmbedClint.CreateEmbeddings(context.Background(), req)
	if err != nil {
		return nil, fmt.Errorf("智谱API请求失败：%v", err)
	}
	return resp.Data[0].Embedding, nil
}
