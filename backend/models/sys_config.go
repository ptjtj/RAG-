package models

import "gorm.io/gorm"

type SysConfig struct {
	gorm.Model
	ConfigKey   string `gorm:" size:100 uniqueIndex;not null" json:"configKey" example:"llm_api_key"`
	ConfigValue string `json:"configValue" example:"your-api-key-here"`
	Description string `json:"description" example:"大模型API密钥"`
}
