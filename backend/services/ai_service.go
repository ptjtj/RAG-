package services

import (
	"backend/config"
	"backend/models"
	"context"
	"fmt"
	"log"

	"github.com/sashabaranov/go-openai"
)

// 动态获取配置的底层辅助函数
func GetSysConfig(key string) string {
	var cfg models.SysConfig
	// 去数据库里查最新的值
	if err := config.DB.Where("config_key = ?", key).First(&cfg).Error; err != nil {
		log.Println("警告: 数据库中未找到配置项 %s", key)
		return ""
	}
	return cfg.ConfigValue
}

// 动态生成 Chat (对话) 客户端
func GetChatClint() (*openai.Client, error) {
	apiKey := GetSysConfig("deepseek_api_key")
	if apiKey == "" {
		return nil, fmt.Errorf("系统未配置 DeepSeek API Key，请联系管理员")
	}
	chatConfig := openai.DefaultConfig(apiKey)
	chatConfig.BaseURL = "https://api.deepseek.com"
	return openai.NewClientWithConfig(chatConfig), nil
}

// 动态生成 Embedding (向量) 客户端
func GetEmbedClint() (*openai.Client, error) {
	apiKey := GetSysConfig("llm_api_key")
	if apiKey == "" {
		return nil, fmt.Errorf("系统未配置智谱 API Key，请联系管理员")
	}
	embedConfig := openai.DefaultConfig(apiKey)
	embedConfig.BaseURL = "https://open.bigmodel.cn/api/paas/v4"
	return openai.NewClientWithConfig(embedConfig), nil
}

// InitAI 初始化大模型客户端
func InitAI() {
	log.Println("🚀 AI 引擎已切换为【动态配置模式】，API Key 将从数据库实时读取！")
}

// TestChat 测试 deepseek 是否跑通的函数
func TestChat(question string) (string, error) {
	// 每次调用时实时获取最新的 Client
	client, err := GetChatClint()
	if err != nil {
		return "", err
	}
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
	resp, err := client.CreateChatCompletion(context.Background(), req)
	if err != nil {
		return "", err
	}
	// 返回 AI 说的话
	return resp.Choices[0].Message.Content, nil
}

// GetEmbedding 将文本转换为 1024 维度的向量
func GetEmbedding(text string) ([]float32, error) {
	// 每次调用时实时获取最新的 Client
	client, err := GetEmbedClint()
	if err != nil {
		return nil, err
	}
	req := openai.EmbeddingRequest{
		Input: []string{text},
		Model: openai.EmbeddingModel("embedding-3"),
	}
	resp, err := client.CreateEmbeddings(context.Background(), req)
	if err != nil {
		return nil, fmt.Errorf("智谱API请求失败：%v", err)
	}
	return resp.Data[0].Embedding, nil
}
