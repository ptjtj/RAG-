// @ts-ignore
/* eslint-disable */
import { request } from '@umijs/max';

/** 删除文档 删除文档记录、关联的切片数据以及本地物理文件 DELETE /docs/${param0} */
export async function deleteDocument(
  // 叠加生成的Param类型 (非body参数swagger默认没有生成对象)
  params: API.deleteDocumentParams,
  options?: { [key: string]: any },
) {
  const { doc_id: param0, ...queryParams } = params;
  return request<API.Response>(`/docs/${param0}`, {
    method: 'DELETE',
    params: { ...queryParams },
    ...(options || {}),
  });
}
