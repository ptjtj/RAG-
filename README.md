# ai-knowledgeStock

## 项目概述

这是一个轻量级的企业级 AI 知识库管理与问答示例工程，包含前端管理控制台（位于 `ai-kms/`）和后端服务（位于 `backend/`）。前端使用 Umi Max + TypeScript + Ant Design + Tailwind 实现交互与页面，后端使用 Gin + GORM + Go 实现 API、文档解析、向量化与 AI 调用。
## 登录账号密码
admin 
123456

## 已实现的主要功能

- 知识库管理：创建/删除知识库、查看知识库详情、展示文档数量与状态（实现于 `ai-kms/src/pages/kb`）。
- 文档上传与解析：支持上传 `txt`/`docx`/`pdf`，服务器保存文件并异步解析为文本切片，然后对切片做向量化并入库（实现于 `backend/controllers/doc_controller.go` + `backend/services/parser_service.go`）。
- 去重检查：上传时按文件 MD5 查重，避免重复上传（见 `UploadDocument`）。
- 向量化（Embedding）：集成外部向量接口获取 embeddings（封装在 `backend/services/ai_service.go` 的 `GetEmbedding`）。
- 语义检索（RAG）：在提问时可按知识库 ID 检索高相似度切片，并将背景知识拼接进 Prompt（实现于 `backend/services/vector_service.go` 的 `SearchTopChunksWithSources`）。
- 智能问答：把检索到的背景知识与用户问题一起发送到指定大模型（DeepSeek 风格的 Chat API），返回回答同时携带来源（实现于 `backend/controllers/ai_controller.go`）。
- 前端交互体验：聊天实时“打字”效果、来源 Tag 展示、`/embed` 命令用于测试 embedding 接口（实现于 `ai-kms/src/pages/chat/index.tsx`）。

## 技术栈

- 前端：`@umijs/max`、TypeScript、React、Ant Design、Tailwind CSS
- 后端：Go、Gin、GORM、Swag (Swagger)、openai-go-sdk（用于对接 DeepSeek/智谱兼容接口）
- 存储：MySQL（通过 GORM，初始化见 `backend/config`）与本地文件系统 `uploads/` 存放原始文件

## 核心实现说明

- 文档解析：`backend/services/parser_service.go` 支持 `.txt`、`.docx`、`.pdf`，将文本按字符数切分为若干 chunk 并调用 `GetEmbedding` 进行向量化，向量与文本存入 `document_chunks` 表。
- 向量相似度搜索：使用余弦相似度在已向量化的 chunks 中检索高分片段，取 top-N 并返回同时作为“背景知识”和来源标签。
- AI 交互：`InitAI()` 从环境变量加载 `DEEPSEEK_API_KEY` 与 `ZHIPU_API_KEY`（或等效替代），分别用于聊天与 embedding；`TestChat` 调用 DeepSeek-compatible 接口完成对话生成。

## 快速运行（本地）

1. 前端（开发）

```bash
cd ai-kms
pnpm install
pnpm dev
```

2. 后端（开发）

```bash
cd backend
# 请先准备好 MySQL 并填写配置（见 backend/config）
go run main.go
```

3. 环境变量

- `DEEPSEEK_API_KEY`：用于 Chat 接口
- `ZHIPU_API_KEY`：用于 Embedding（或按项目 README/代码调整）

## 关键文件与目录（快速导航）

- 后端启动入口：`backend/main.go`
- 后端控制器：`backend/controllers/`（`ai_controller.go`、`doc_controller.go`、`kb_controller.go`）
- 后端服务实现：`backend/services/`（`ai_service.go`、`parser_service.go`、`vector_service.go`）
- 数据模型：`backend/models/`（`kb.go`、`doc.go`、`chunk.go`）
- 上传文件目录：`uploads/`（示例：`uploads/kb_5/`）
- 前端工程：`ai-kms/`（`package.json`、`src/pages/chat`、`src/pages/kb`、`src/services/api`）

## 已知约束与注意事项

- 后端依赖外部 AI 服务（DeepSeek、智谱等），请确保相应 API Key 正确配置并可访问。
- 文档解析依赖第三方库（如 `github.com/ledongthuc/pdf`），部分特殊 PDF/Docx 可能解析不完整。
- 目前向量阈值、chunk 大小等参数写在代码或数据库默认值中，可按需调整（`kb.ChunkSize` 与 parser 的 `chunkSize` 参数）。


