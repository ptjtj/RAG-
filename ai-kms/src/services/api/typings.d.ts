declare namespace API {
  type CreateKBRequest = {
    chunkSize?: number;
    description?: string;
    name: string;
  };

  type deleteDocumentParams = {
    /** 文档 ID */
    doc_id: string;
  };

  type deleteKnowledgeBaseParams = {
    /** 知识库 ID */
    id: number;
  };

  type deleteUsersIdParams = {
    /** 要删除的用户ID */
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
    updatedAt?: string;
  };

  type LoginRequest = {
    password: string;
    username: string;
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

  type UpdatePasswordRequest = {
    newPassword: string;
    oldPassword: string;
  };

  type UpdateUsernameRequest = {
    newUsername: string;
  };
}
