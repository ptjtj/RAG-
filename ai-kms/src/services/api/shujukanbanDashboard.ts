// @ts-ignore
/* eslint-disable */
import { request } from '@umijs/max';

/** 获取系统数据大屏设计 统计系统的文档总数、用户总数、今日提问次数以及近7天的Token消耗与虚拟成本趋势 GET /dashboard */
export async function getDashboard(options?: { [key: string]: any }) {
  return request<API.Response & { data?: API.DashboardStatsData }>(
    '/dashboard',
    {
      method: 'GET',
      ...(options || {}),
    },
  );
}
