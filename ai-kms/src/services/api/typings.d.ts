declare namespace API {
  type CreateKBRequest = {
    chunkSize?: number;
    description?: string;
    name: string;
  };

  type deleteKnowledgeBaseParams = {
    /** 知识库 ID */
    id: number;
  };

  type Document = {
    /** 切片数量 */
    chunkCount?: number;
    createdAt?: string;
    fileName?: string;
    /** 文件在服务器上的物理路径 */
    filePath?: string;
    /** 文件大小(字节) */
    fileSize?: number;
    /** 比如 pdf, txt, docx */
    fileType?: string;
    id?: number;
    /** 所属知识库的 ID */
    knowledgeBaseId?: number;
    /** 状态: pending等待解析, parsing解析中, success成功, failed失败 */
    status?: string;
    updatedAt?: string;
  };

  type getDocumentsParams = {
    /** 知识库 ID */
    kb_id: number;
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

  type Response = {
    code?: number;
    data?: any;
    message?: string;
  };

  type uploadDocumentParams = {
    /** 知识库 ID */
    kb_id: number;
  };
}
