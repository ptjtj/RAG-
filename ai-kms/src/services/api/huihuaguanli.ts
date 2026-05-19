// @ts-ignore
/* eslint-disable */
import { request } from '@umijs/max';

/** 获取会话列表 按时间降序获取历史会话 GET /sessions */
export async function getSessions(options?: { [key: string]: any }) {
  return request<API.Response>('/sessions', {
    method: 'GET',
    ...(options || {}),
  });
}

/** 新建会话 创建一个新的空白聊天会话 POST /sessions */
export async function postSessions(
  body: API.CreateSessionRequest,
  options?: { [key: string]: any },
) {
  return request<API.Response>('/sessions', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    data: body,
    ...(options || {}),
  });
}

/** 更新会话信息 支持局部更新会话的标题或置顶状态 PUT /sessions/${param0} */
export async function putSessionsId(
  // 叠加生成的Param类型 (非body参数swagger默认没有生成对象)
  params: API.putSessionsIdParams,
  body: API.UpdateSessionRequest,
  options?: { [key: string]: any },
) {
  const { id: param0, ...queryParams } = params;
  return request<API.Response>(`/sessions/${param0}`, {
    method: 'PUT',
    headers: {
      'Content-Type': 'application/json',
    },
    params: { ...queryParams },
    data: body,
    ...(options || {}),
  });
}

/** 删除会话 删除整个会话及其关联的所有消息 DELETE /sessions/${param0} */
export async function deleteSessionsId(
  // 叠加生成的Param类型 (非body参数swagger默认没有生成对象)
  params: API.deleteSessionsIdParams,
  options?: { [key: string]: any },
) {
  const { id: param0, ...queryParams } = params;
  return request<API.Response>(`/sessions/${param0}`, {
    method: 'DELETE',
    params: { ...queryParams },
    ...(options || {}),
  });
}

/** 获取聊天记录 根据会话ID获取该会话下的所有聊天消息 GET /sessions/${param0}/messages */
export async function getSessionsIdMessages(
  // 叠加生成的Param类型 (非body参数swagger默认没有生成对象)
  params: API.getSessionsIdMessagesParams,
  options?: { [key: string]: any },
) {
  const { id: param0, ...queryParams } = params;
  return request<API.Response>(`/sessions/${param0}/messages`, {
    method: 'GET',
    params: { ...queryParams },
    ...(options || {}),
  });
}
