// @ts-ignore
/* eslint-disable */
import { request } from '@umijs/max';

/** 上传用户头像 接收前端传来的图片文件，保存到本地并更新数据库中的头像 URL POST /user/avatar */
export async function postUserAvatar(
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

  return request<API.Response>('/user/avatar', {
    method: 'POST',
    data: formData,
    requestType: 'form',
    ...(options || {}),
  });
}

/** 移除当前用户头像 将当前登录用户的头像字段清空为默认状态 DELETE /user/avatar */
export async function deleteUserAvatar(options?: { [key: string]: any }) {
  return request<API.Response>('/user/avatar', {
    method: 'DELETE',
    ...(options || {}),
  });
}

/** 修改当前用户密码 验证旧密码并更新为新密码，更新后需要重新登录 PUT /user/password */
export async function putUserPassword(
  body: API.UpdatePasswordRequest,
  options?: { [key: string]: any },
) {
  return request<API.Response>('/user/password', {
    method: 'PUT',
    headers: {
      'Content-Type': 'application/json',
    },
    data: body,
    ...(options || {}),
  });
}

/** 修改当前用户名 修改用户名后，JWT 令牌会失效，前端需要强制重新登录 PUT /user/username */
export async function putUserUsername(
  body: API.UpdateUsernameRequest,
  options?: { [key: string]: any },
) {
  return request<API.Response>('/user/username', {
    method: 'PUT',
    headers: {
      'Content-Type': 'application/json',
    },
    data: body,
    ...(options || {}),
  });
}

/** 获取用户列表 在用户管理表格中展示所有用户 GET /users */
export async function getUsers(options?: { [key: string]: any }) {
  return request<API.Response>('/users', {
    method: 'GET',
    ...(options || {}),
  });
}
