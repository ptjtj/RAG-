import { getDashboard } from '@/services/api/shujukanbanDashboard';
import {
  DatabaseOutlined,
  FireOutlined,
  UserOutlined,
} from '@ant-design/icons';
import { useEffect, useState } from 'react';
import ReactECharts from 'echarts-for-react';
import { Empty } from 'antd';

export default function Dashboard() {
  const [stats, setStats] = useState<any>({});
  const [loading, setLoading] = useState(true);
  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        const res = await getDashboard();
        if (res && res.code === 200) {
          setStats(res.data);
        }
      } catch (error) {
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  const costChartOption = {
    tooltip: {
      trigger: 'axis',
      backgroundColor: '#FFFFFF',
      padding: [16, 20],
      borderRadius: 12,
      textStyle: { color: '#1C1F23' },
      extraCssText: 'box-shadow: 0 8px 30px rgba(0, 0, 0, 0.08); border: none;',
      axisPointer: {
        type: 'shadow',
        shadowStyle: { color: 'rgba(0, 0, 0, 0.03)' },
      },
      formatter: function (params: any) {
        const data = params[0];
        const date = data.name;
        const cost = data.value;
        return `
          <div style="min-width: 240px; font-family: sans-serif;">
            <div style="display: flex; justify-content: space-between; font-weight: 600; color: #1C1F23; margin-bottom: 12px; font-size: 15px;">
              <span>${date}</span>
              <span style="color: #b0b0b0;">¥${cost}</span>
            </div>
            <div style="display: flex; justify-content: space-between; color: #8B8E94; font-size: 13px; align-items: center;">
              <div style="display: flex; align-items: center; gap: 8px;">
                <span style="display: inline-block; width: 12px; height: 12px; background: #FFC107; border-radius: 2px;"></span>
                <span>deepseek-chat & deepseek-reasoner</span>
              </div>
              <span>¥${cost}</span>
            </div>
          </div>
        `;
      },
    },
    grid: {
      left: '0%',
      right: '2%',
      bottom: '5%',
      top: '15%',
      containLabel: true,
    },
    xAxis: {
      type: 'category',
      data: stats.costTrend?.map((item: any) => item.date?.split('T')[0]) || [],
      axisLine: { lineStyle: { color: '#EAEAEA' } }, // 底边轴线
      axisTick: { show: false }, // 隐藏刻度短线
      axisLabel: {
        color: '#8B8E94',
        margin: 16,
      },
    },
    yAxis: {
      type: 'value',
      splitNumber: 2,
      splitLine: {
        lineStyle: { type: 'solid', color: '#F2F2F5' },
      },
      axisLabel: {
        color: '#8B8E94',
        formatter: '¥{value}',
      },
    },
    series: [
      {
        name: '消费金额',
        type: 'bar',
        barWidth: 20, 
        itemStyle: {
          color: '#FFC107', // 黄色
          borderRadius: [2, 2, 0, 0],
        },
        data: stats.costTrend?.map((item: any) => item.cost.toFixed(4)) || [],
      },
    ],
  };
const hasChartData=stats?.costTrend && stats.costTrend.length >0;
  return (
    <div className="w-full min-h-screen bg-[#F5F5F7] p-8 font-sans box-border">
      {/* 头部标题区 */}
      <div className="mb-8">
        <h1 className="text-4xl font-semibold tracking-tighter">系统概览</h1>
        <p className="text-[#86868B] text-base mt-2">
          管理 AI 驱动引擎与核心数据看板
        </p>
      </div>
      <div className="grid grid-cols-3 gap-6 mb-8">
        {/* 卡片 1 */}
        <div className="bg-white rounded-3xl p-6 shadow-[0_2px_20px_rgba(0,0,0,0.02)] transition-transform duration-300 hover:-translate-y-1">
          <div className="flex items-center justify-between mb-4">
            <div className="w-10 h-10 rounded-full bg-blue-50 flex items-center justify-center">
              <DatabaseOutlined className="text-[#0071E3] text-lg" />
            </div>
            <span className="text-[#86868B] text-sm font-medium">总计</span>
          </div>
          <div className="text-[#86868B] text-sm mb-2">知识库总文档数</div>
          <div className="text-5xl leading-none font-bold text-[#1D1D1F] tracking-tight truncate">
            {loading ? '...' : stats?.totalDocs || 0}
          </div>
        </div>

        {/* 卡片 2 */}
        <div className="bg-white rounded-3xl p-6 shadow-[0_2px_20px_rgba(0,0,0,0.02)] transition-transform duration-300 hover:-translate-y-1">
          <div className="flex items-center justify-between mb-4">
            <div className="w-10 h-10 rounded-full bg-purple-50 flex items-center justify-center">
              <UserOutlined className="text-[#AF52DE] text-lg" />
            </div>
            <span className="text-[#86868B] text-sm font-medium">生态</span>
          </div>
          <div className="text-[#86868B] text-sm mb-2">平台注册用户</div>
          <div className="text-5xl leading-none font-bold text-[#1D1D1F] tracking-tight truncate">
            {loading ? '...' : stats?.totalUsers || 0}
          </div>
        </div>

        {/* 卡片 3 */}
        <div className="bg-white rounded-3xl p-6 shadow-[0_2px_20px_rgba(0,0,0,0.02)] transition-transform duration-300 hover:-translate-y-1">
          <div className="flex items-center justify-between mb-4">
            <div className="w-10 h-10 rounded-full bg-green-50 flex items-center justify-center">
              <FireOutlined className="text-[#34C759] text-lg" />
            </div>
            <span className="text-[#34C759] text-sm font-medium">今日活跃</span>
          </div>
          <div className="text-[#86868B] text-sm mb-2">今日 AI 提问次数</div>
          <div className="text-5xl leading-none font-bold text-[#1D1D1F] tracking-tight truncate">
            {loading ? '...' : stats?.todayChats || 0}
          </div>
        </div>
      </div>{' '}
      {/* 底部宽体大卡片 */}
      <div className="bg-white rounded-3xl p-6 shadow-[0_2px_20px_rgba(0,0,0,0.02)] w-full box-border">
        <div className="mb-6 flex items-baseline gap-4 whitespace-nowrap flex-nowrap">
          <h2 className="text-lg font-medium text-[#1D1D1F] shrink-0">
            消费金额
          </h2>
          <span className="text-lg text-[#8B8E94] shrink-0">
            ¥
            {(
              stats.costTrend?.reduce(
                (sum: number, item: any) => sum + item.cost,
                0,
              ) || 0
            ).toFixed(2)}
          </span>
        </div>
        <div className="h-[350px] w-full">
          {!loading ? (
            hasChartData ? (
              <ReactECharts
                option={costChartOption}
                style={{ height: '100%', width: '100%' }}
              />
            ) : (
              <div className="w-full h-full flex items-center justify-center">
                <Empty
                  image={Empty.PRESENTED_IMAGE_DEFAULT}
                  description={
                    <span className="text-[#86868B]">近 7 天暂无消耗数据</span>
                  }
                />
              </div>
            )
          ) : null}
        </div>
      </div>
    </div>
  );
}
