# ai-knowledgeStock

## 项目概述

这是一个轻量级的企业级 AI 知识库管理与问答示例工程，包含前端管理控制台（位于 `ai-kms/`）和后端服务（位于 `backend/`）。前端使用 Umi Max + TypeScript + Ant Design + Tailwind 实现交互与页面，后端使用 Gin + GORM + Go 实现 API、文档解析、向量化与 AI 调用。

# ai-knowledgeStock

## 简要说明

ai-knowledgeStock 是一个带前端控制台与 Go 后端的 AI 知识库示例工程。功能涵盖知识库管理、文档上传与解析、向量化嵌入、语义检索（RAG）以及基于外部大模型的问答。前端在 `ai-kms/`，后端在 `backend/`。

## 快速亮点

- 知识库（KB）管理：创建/删除知识库、查看文档列表与状态。
- 文档处理：支持 `.txt`/`.docx`/`.pdf` 上传，异步解析为 chunk 并做 embedding。
- 语义检索 + RAG：基于向量检索返回背景片段并展示来源。
- 会话管理：支持会话创建、历史存储与删除。

## 先决条件

- Go 1.20+
- Node.js 18+/pnpm（前端）
- MySQL 可用并能创建数据库（默认 DSN 在 `backend/config/db.go` 指向 `ai_kms`）
- 可选：DeepSeek / 智谱 等外部 AI Key

## 快速运行（本地）

1. 准备数据库（示例 SQL）

```sql
CREATE DATABASE ai_kms CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci;
```

2. 后端（在 `backend/`）

```bash
cd backend
# 若需调整 DB 连接，请编辑 backend/config/db.go 中的 DSN
go run main.go
```

后端会自动执行 GORM 的 `AutoMigrate` 并播种示例数据（若表为空），包括默认管理员 `admin / 123456`。

3. 前端（在 `ai-kms/`）

```bash
cd ai-kms
pnpm install
pnpm dev
```

## 重要环境变量

- `DEEPSEEK_API_KEY`：用于 Chat（DeepSeek 兼容 API）
- `ZHIPU_API_KEY`：用于 Embedding（智谱 / 大模型服务）

## 数据库（环境变量）

- `DB_USER`：数据库用户名（默认 `root`）
- `DB_PASS`：数据库密码（默认 `123456`）
- `DB_HOST`：数据库主机（默认 `127.0.0.1`）
- `DB_PORT`：数据库端口（默认 `3306`）
- `DB_NAME`：数据库名称（默认 `ai_kms`）

后端会优先从上述环境变量读取数据库连接信息，若未设置则使用默认回退值。示例（PowerShell 临时设置并启动）：

```powershell
$env:DB_USER='root'
$env:DB_PASS='123456'
$env:DB_HOST='127.0.0.1'
$env:DB_PORT='3306'
$env:DB_NAME='ai_kms'
cd backend
go run main.go
```

或在 Linux/macOS 下临时一行设置并运行：

```bash
DB_USER=root DB_PASS=123456 DB_HOST=127.0.0.1 DB_PORT=3306 DB_NAME=ai_kms go run backend/main.go
```



## 代码位置（快速导航）

- 后端入口： [backend/main.go](backend/main.go)
- 控制器： [backend/controllers/](backend/controllers)
- 服务实现（AI、解析、向量）： [backend/services/](backend/services)
- 数据模型： [backend/models/](backend/models)
- 前端入口： [ai-kms/](ai-kms)
- 关键前端页面：
  - 聊天页面： [ai-kms/src/pages/chat](ai-kms/src/pages/chat)
  - 知识库管理： [ai-kms/src/pages/kb](ai-kms/src/pages/kb)
  - 登录： [ai-kms/src/pages/login/index.tsx](ai-kms/src/pages/login/index.tsx)
  - 用户管理： [ai-kms/src/pages/userManage](ai-kms/src/pages/userManage)

## 实现细节与注意点
- 文档解析：`backend/services/parser_service.go` 支持 `.txt`、`.docx`、`.pdf`，按 `kb.ChunkSize` 切片并异步向量化。
- 向量化：`backend/services/ai_service.go` 封装对外部 embedding 与 chat API 的调用，初始化依赖环境变量。
- 相似度搜索：`backend/services/vector_service.go` 使用余弦相似度筛选高于 0.4 的 chunk，返回 top-3 作为背景知识与来源。
- 文件去重：上传时计算 MD5 并在同一知识库内检查重复，若重复则直接返回已有记录。
## ⚠️ 版权与许可声明 / License

本项目采用**自定义的严格版权协议**，保留所有权利（All Rights Reserved）。

**🔴 严禁任何形式的商业用途！**
允许个人学习和研究使用。未经书面授权，禁止将本项目用于任何商业盈利、企业级生产环境或闭源二次开发。具体条款请务必参阅项目根目录下的 [LICENSE](./LICENSE) 文件。




