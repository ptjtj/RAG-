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
      backgroundColor: 'rgba(255, 255, 255, 0.8)',
      backdropFilter: 'blur(10px)', 
      borderColor: '#E5E5EA',
      textStyle: { color: '#1D1D1F' },
      axisPointer: { type: 'line', lineStyle: { color: '#E5E5EA' } }
    },
    legend: {
      data: ['Token 消耗', '虚拟成本 (元)'],
      bottom: 0,
      icon: 'circle',
      textStyle: { color: '#86868B' }
    },
    grid: { left: '2%', right: '2%', bottom: '12%', top: '10%', containLabel: true },
    xAxis: {
      type: 'category',
      boundaryGap: false,
      data: stats.costTrend?.map((item: any) => item.date) || [],
      axisLine: { show: false }, 
      axisTick: { show: false }, 
      axisLabel: { color: '#86868B', margin: 16 }
    },
    yAxis: [
      {
        type: 'value',
        splitLine: { lineStyle: { type: 'dashed', color: '#F2F2F7' } }, 
        axisLabel: { color: '#86868B' }
      },
      {
        type: 'value',
        splitLine: { show: false },
        axisLabel: { color: '#86868B', formatter: '¥{value}' }
      }
    ],
    series: [
      {
        name: 'Token 消耗',
        type: 'line',
        smooth: 0.4, 
        showSymbol: false, 
        lineStyle: { width: 3, color: '#0071E3' }, 
        areaStyle: {
          color: {
            type: 'linear',
            x: 0, y: 0, x2: 0, y2: 1,
            colorStops: [
              { offset: 0, color: 'rgba(0,113,227,0.15)' },
              { offset: 1, color: 'rgba(0,113,227,0.01)' }
            ]
          }
        },
        data: stats.costTrend?.map((item: any) => item.totalTokens) || [],
      },
      {
        name: '虚拟成本 (元)',
        type: 'bar',
        yAxisIndex: 1,
        barWidth: '20%',
        itemStyle: { 
          color: '#FF3B30', 
          borderRadius: [4, 4, 0, 0] 
        },
        data: stats.costTrend?.map((item: any) => item.cost.toFixed(4)) || [],
      }
    ]
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
        <div className="mb-6 flex justify-between items-end">
          <div>
            <h2 className="text-xl font-semibold text-[#1D1D1F] tracking-tight">
              成本与使用趋势
            </h2>
            <p className="text-[#86868B] text-sm mt-1">
              近 7 天 Token 消耗与虚拟费用折算
            </p>
          </div>
        </div>

        <div className="h-[400px] w-full">
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
