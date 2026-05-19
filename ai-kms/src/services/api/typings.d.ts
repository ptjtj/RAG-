declare namespace API {
  type ChatRequest = {
    /** 接收继续生成的信号和上下文 */
    isContinue?: boolean;
    /** 接收前端传来的知识库 ID */
    kbId?: number;
    message: string;
    /** 已经生成的前半截内容 */
    partialContent?: string;
    sessionId?: number;
  };

  type CreateKBRequest = {
    chunkSize?: number;
    description?: string;
    name: string;
    /** 接收前端传来的提示词 */
    systemPrompt?: string;
  };

  type CreateSessionRequest = {
    kbId?: number;
    title?: string;
  };

  type deleteDocumentParams = {
    /** 文档 ID */
    doc_id: string;
  };

  type deleteKnowledgeBaseParams = {
    /** 知识库 ID */
    id: number;
  };

  type deleteSessionsIdParams = {
    /** 会话ID */
    id: number;
  };

  type deleteUsersIdParams = {
    /** 要删除的用户ID */
    id: number;
  };

  type getSessionsIdMessagesParams = {
    /** 会话ID */
    id: number;
  };

  type KnowledgeBase = {
    chunkSize?: number;
    createdAt?: string;
    description?: string;
    docCount?: number;
    id?: number;
    name?: string;
    status?: string;
    /** 系统提示词字段 */
    systemPrompt?: string;
    updatedAt?: string;
  };

  type LoginRequest = {
    password: string;
    username: string;
  };

  type putKbIdParams = {
    /** 知识库 ID */
    id: number;
  };

  type putSessionsIdParams = {
    /** 会话ID */
    id: number;
  };

  type RefreshRequest = {
    refresh_token: string;
  };

  type RegisterRequest = {
    password: string;
    username: string;
  };

  type Response = {
    code?: number;
    data?: any;
    message?: string;
  };

  type SysConfig = true;

  type UpdateKBRequest = {
    description?: string;
    name: string;
    /** 允许用户修改提示词 */
    systemPrompt?: string;
  };

  type UpdatePasswordRequest = {
    newPassword: string;
    oldPassword: string;
  };

  type UpdateSessionRequest = {
    isPinned?: boolean;
    /** 使用指针类型 (*string, *bool)：区分前端是传了空值/false，还是根本没传。 */
    title?: string;
  };

  type UpdateUsernameRequest = {
    newUsername: string;
  };
}
