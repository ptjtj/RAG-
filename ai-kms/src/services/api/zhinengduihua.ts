// @ts-ignore
/* eslint-disable */
import { request } from '@umijs/max';

/** 智能对话 (流式返回) 采用 SSE (Server-Sent Events) 实现的流式打字机和思维链输出 POST /chat */
export async function postChat(
  body: API.ChatRequest,
  options?: { [key: string]: any },
) {
  return request<string>('/chat', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    data: body,
    ...(options || {}),
  });
}

/** 上传临时会话附件 用户在对话框上传临时文件（PDF/Word/Excel等），不存入全局知识库，仅供当前会话大模型分析使用。 POST /upload/temp */
export async function postUploadTemp(
  body: {},
  file?: File,
  options?: { [key: string]: any },
) {
  const formData = new FormData();

  if (file) {
    formData.append('file', file);
  }

  Object.keys(body).forEach((ele) => {
    const item = (body as any)[ele];

    if (item !== undefined && item !== null) {
      if (typeof item === 'object' && !(item instanceof File)) {
        if (item instanceof Array) {
          item.forEach((f) => formData.append(ele, f || ''));
        } else {
          formData.append(
            ele,
            new Blob([JSON.stringify(item)], { type: 'application/json' }),
          );
        }
      } else {
        formData.append(ele, item);
      }
    }
  });

  return request<API.Response & { data?: API.TempFileResponse }>(
    '/upload/temp',
    {
      method: 'POST',
      data: formData,
      requestType: 'form',
      ...(options || {}),
    },
  );
}
