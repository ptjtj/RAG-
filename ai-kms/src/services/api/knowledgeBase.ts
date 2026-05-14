// @ts-ignore
/* eslint-disable */
import { request } from '@umijs/max';

/** 获取知识库列表 从数据库获取所有未被删除的知识库 GET /kb */
export async function getKnowledgeBases(options?: { [key: string]: any }) {
  return request<API.Response & { data?: API.KnowledgeBase[] }>('/kb', {
    method: 'GET',
    ...(options || {}),
  });
}

/** 创建新知识库 接收前端参数并在数据库中创建新记录 POST /kb */
export async function creatKnowledgeBase(
  body: API.CreateKBRequest,
  options?: { [key: string]: any },
) {
  return request<API.Response & { data?: API.KnowledgeBase }>('/kb', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    data: body,
    ...(options || {}),
  });
}

/** 更新知识库 根据 ID 修改指定知识库的名称和描述 PUT /kb/${param0} */
export async function putKbId(
  // 叠加生成的Param类型 (非body参数swagger默认没有生成对象)
  params: API.putKbIdParams,
  body: API.UpdateKBRequest,
  options?: { [key: string]: any },
) {
  const { id: param0, ...queryParams } = params;
  return request<API.Response>(`/kb/${param0}`, {
    method: 'PUT',
    headers: {
      'Content-Type': 'application/json',
    },
    params: { ...queryParams },
    data: body,
    ...(options || {}),
  });
}

/** 删除知识库 根据 ID 软删除知识库记录 DELETE /kb/${param0} */
export async function deleteKnowledgeBase(
  // 叠加生成的Param类型 (非body参数swagger默认没有生成对象)
  params: API.deleteKnowledgeBaseParams,
  options?: { [key: string]: any },
) {
  const { id: param0, ...queryParams } = params;
  return request<API.Response>(`/kb/${param0}`, {
    method: 'DELETE',
    params: { ...queryParams },
    ...(options || {}),
  });
}
