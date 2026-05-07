// @ts-ignore
/* eslint-disable */
import { request } from '@umijs/max';

/** 获取文档列表 根据知识库 ID 获取该库下的所有文档 GET /kb/${param0}/docs */
export async function getDocuments(
  // 叠加生成的Param类型 (非body参数swagger默认没有生成对象)
  params: API.getDocumentsParams,
  options?: { [key: string]: any },
) {
  const { kb_id: param0, ...queryParams } = params;
  return request<API.Response & { data?: API.Document[] }>(
    `/kb/${param0}/docs`,
    {
      method: 'GET',
      params: { ...queryParams },
      ...(options || {}),
    },
  );
}

/** 上传文档 接收前端传来的文件，保存到本地 uploads 目录，并记录到数据库 POST /kb/${param0}/upload */
export async function uploadDocument(
  // 叠加生成的Param类型 (非body参数swagger默认没有生成对象)
  params: API.uploadDocumentParams,
  body: {},
  file?: File,
  options?: { [key: string]: any },
) {
  const { kb_id: param0, ...queryParams } = params;
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

  return request<API.Response & { data?: API.Document }>(
    `/kb/${param0}/upload`,
    {
      method: 'POST',
      params: { ...queryParams },
      data: formData,
      requestType: 'form',
      ...(options || {}),
    },
  );
}
