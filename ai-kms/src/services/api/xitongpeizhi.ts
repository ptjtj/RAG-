// @ts-ignore
/* eslint-disable */
import { request } from '@umijs/max';

/** 获取系统大模型API Key等动态配置 GET /configs */
export async function getConfigs(options?: { [key: string]: any }) {
  return request<API.Response>('/configs', {
    method: 'GET',
    ...(options || {}),
  });
}

/** 更新单个系统配置 修改指定的系统配置项的值 PUT /configs */
export async function putConfigs(
  body: API.SysConfig,
  options?: { [key: string]: any },
) {
  return request<API.Response>('/configs', {
    method: 'PUT',
    headers: {
      'Content-Type': 'application/json',
    },
    data: body,
    ...(options || {}),
  });
}

/** 批量更新系统配置 POST /configs/batch */
export async function postConfigsBatch(
  body: API.SysConfig[],
  options?: { [key: string]: any },
) {
  return request<any>('/configs/batch', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    data: body,
    ...(options || {}),
  });
}
