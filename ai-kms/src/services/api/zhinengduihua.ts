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
