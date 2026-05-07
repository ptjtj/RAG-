# AI KMS

一个基于 `@umijs/max` + TypeScript + Ant Design + Tailwind 的轻量级 AI 知识库前端示例，包含：

- 智能问答（Chat）页面，支持 RAG（检索增强生成）与来源展示。
- 知识库管理（KB）页面：创建/删除知识库、上传文档等。

**快速开始**

- 安装依赖：

```bash
pnpm install
```

- 本地开发：

```bash
前端
pnpm dev
```
后端
go run main.go
```
- 生产构建：

```bash
pnpm run build
```

- 生成/更新 OpenAPI 客户端（若需要）：

```bash
pnpm run openapi
```

**技术栈**

- 框架：`@umijs/max`（Umi Max）
- 语言：TypeScript
- UI：Ant Design + Tailwind CSS
- API 客户端：基于 OpenAPI 自动生成到 `src/services/api`

**运行前注意事项**

- 本项目前端默认请求后端地址：`http://localhost:8080/api/v1`（见请求配置），请确保后端服务在该地址启动，或修改配置。
- 聊天页面在没有知识库时仍可作为纯对话使用；当挂载知识库时会进行检索并展示来源。

**重要文件（快速导航）**

- 项目配置： [package.json](package.json)
- 路由定义： [src/routes/route.ts](src/routes/route.ts)
- 全局请求配置（baseURL 等）： [src/app.ts](src/app.ts)
- 聊天页面： [src/pages/chat/index.tsx](src/pages/chat/index.tsx)
- 知识库管理： [src/pages/kb/index.tsx](src/pages/kb/index.tsx)
- API 客户端目录（OpenAPI 生成）： [src/services/api](src/services/api)
- OpenAPI -> openapi2ts 配置： [openapi2ts.config.ts](openapi2ts.config.ts)

**功能亮点**

- 智能问答：支持实时打字动画、流式展示与来源 Tag（RAG）。
- 知识库管理：可创建/删除知识库、查看详情与上传文档。
- `/embed` 测试命令：在聊天输入框输入以 `/embed` 开头的命令，会调用后端的测试 embedding 接口，示例在 `src/pages/chat/index.tsx` 中实现。

**开发说明 & 常见命令**

- 安装依赖：`pnpm install`
- 本地开发：`pnpm dev`（内部使用 `max dev`）
- 自动生成 API：`pnpm run openapi`（基于根目录的 OpenAPI 配置，输出到 `src/services/api`）
- 代码格式化：`pnpm run format`（prettier）

**后端接口（示例）**

- 聊天接口：`POST /chat`（返回 AI 文本及来源）
- 知识库列表：`GET /kb`、创建 `POST /kb`、删除 `DELETE /kb/:id`（见 [src/services/api/knowledgeBase.ts](src/services/api/knowledgeBase.ts)）
- 文档上传：`POST /kb/:kb_id/upload`（见 [src/services/api/document.ts](src/services/api/document.ts)）


---


