// @ts-ignore
/* eslint-disable */
import { request } from '@umijs/max';

/** 刷新 Access Token 使用长令牌换取新的短令牌 POST /refresh */
export async function postRefresh(
  body: API.RefreshRequest,
  options?: { [key: string]: any },
) {
  return request<API.Response>('/refresh', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    data: body,
    ...(options || {}),
  });
}

/** 注册新用户 (添加用户) 管理员在后台添加新用户 POST /register */
export async function postRegister(
  body: API.RegisterRequest,
  options?: { [key: string]: any },
) {
  return request<API.Response>('/register', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    data: body,
    ...(options || {}),
  });
}
