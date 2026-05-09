import {
  creatKnowledgeBase,
  deleteKnowledgeBase,
  getKnowledgeBases,
} from '@/services/api/knowledgeBase';
import {
  DeleteOutlined,
  FileTextOutlined,
  MoreOutlined,
  PlusOutlined,
  RobotOutlined,
  SettingOutlined,
} from '@ant-design/icons';
import { PageContainer } from '@ant-design/pro-components';
import {
  Button,
  Card,
  Dropdown,
  Empty,
  MenuProps,
  message,
  Spin,
  Tag,
  Typography,
} from 'antd';
import { useEffect, useState } from 'react';
import CreateKbModal from './components/CreateKbModal';
import KbDetailDrawer from './components/KbDetailDrawer';
import { formatTime } from '@/utils/format';

const { Paragraph } = Typography;

export default function KnowledgeBaseList() {
  //将静态数据转换为 React 状态，这样新增和删除才会触发页面刷新
  const [kbList, setkbList] = useState<any[]>([]);
  //新建知识库弹窗
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  // 控制抽屉的状态
  const [drawerVisible, setDrawerVisible] = useState(false);
  const [activeKb, setActiveKb] = useState<{ id: number | null; name: string }>(
    { id: null, name: '' },
  );

  const fetchKbs = async () => {
    setLoading(true);
    try {
      const res = await getKnowledgeBases();
      setkbList(res.data || []);
    } catch (e) {
      message.error('获取列表失败，请检查后端是否启动');
    } finally {
      setLoading(false);
    }
  };
  //页面初次加载时，自动触发获取列表
  useEffect(() => {
    fetchKbs();
  }, []);
  //删除接口 卡片右上角的“更多操作”下拉菜单
  const getActionMenu = (id: number): MenuProps => ({
    items: [
      {
        key: 'settings',
        icon: <SettingOutlined />,
        label: '空间设置',
      },
      {
        type: 'divider',
      },
      {
        key: 'delete',
        icon: <DeleteOutlined className="text-red-500" />,
        label: <span className="text-red-500">删除知识库</span>,
      },
    ],
    onClick: async ({ key }) => {
      if (key === 'delete') {
        try {
          await deleteKnowledgeBase({ id });
          message.success('已成功删除知识库');
          fetchKbs(); //删除成功后，刷新列表
        } catch (e) {
          message.error('删除失败');
        }
      }
    },
  });

  return (
    <PageContainer
      title="我的知识库"
      subTitle="管理你的专属 AI 知识库，上传文档以增强大模型的回答准确性。"
      extra={[
        <Button
          key="create"
          type="primary"
          icon={<PlusOutlined />}
          className="bg-blue-600"
          onClick={() => setIsModalOpen(true)}
        >
          新建知识库
        </Button>,
      ]}
    >
      <Spin spinning={loading}>
        {/* 如果没数据，给个友好的提示 */}
        {kbList.length === 0 && !loading && (
          <div className="flex flex-col items-center justify-center py-32 bg-white rounded-xl border border-dashed border-gray-200 mt-2">
            <Empty
              image="https://gw.alipayobjects.com/zos/antfincdn/ZHrcdLPrvN/empty.svg"
              styles={{ image: { height: 120 } }}
              description={
                <span className="text-gray-500 text-base">
                  这里空空如也，赶快创建你的第一个专属 AI 知识库吧！
                </span>
              }
            >
              <Button
                type="primary"
                size="large"
                icon={<PlusOutlined />}
                className="mt-4 bg-blue-600"
                onClick={() => {
                  setIsModalOpen(true);
                }}
              >
                立即创建
              </Button>
            </Empty>
          </div>
        )}
        {/* 使用 Tailwind CSS 实现响应式网格布局 */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mt-2">
          {kbList.map((kb) => (
            <Card
              key={kb.id}
              onClick={() => {
                setActiveKb({ id: kb.id, name: kb.name });
                setDrawerVisible(true);
              }}
              variant="borderless"
              className="hover:shadow-xl transition-shadow duration-300 rounded-xl overflow-hidden cursor-pointer flex flex-col h-full"
              styles={{
                body: {
                  padding: '24px',
                  flex: 1,
                  display: 'flex',
                  flexDirection: 'column',
                },
              }}
            >
              {/* 卡片头部：标题与状态 */}
              <div className="flex justify-between items-start mb-4">
                <div className="flex items-center gap-3 font-semibold text-lg text-gray-800">
                  <div className="w-10 h-10 rounded-lg bg-blue-50 flex items-center justify-center text-blue-600">
                    <RobotOutlined className="text-xl" />
                  </div>
                  <span className="truncate w-40" title={kb.name}>
                    {kb.name}
                  </span>
                </div>

                <div className="flex items-center gap-2">
                  {kb.status === 'active' ? (
                    <Tag
                      color="success"
                      className="m-0 border-none bg-green-50 text-green-600 font-medium"
                    >
                      就绪
                    </Tag>
                  ) : (
                    <Tag
                      color="processing"
                      className="m-0 border-none bg-blue-50 text-blue-600 font-medium"
                    >
                      处理中
                    </Tag>
                  )}

                  <Dropdown
                    menu={getActionMenu(kb.id)}
                    trigger={['click']}
                    placement="bottomRight"
                  >
                    <Button
                      type="text"
                      icon={
                        <MoreOutlined className="text-gray-400 hover:text-gray-600" />
                      }
                      onClick={(e) => e.stopPropagation()}
                    />
                  </Dropdown>
                </div>
              </div>

              {/* 卡片中间：描述信息 */}
              <div className="flex-1 mb-6">
                <Paragraph
                  className="text-gray-500 text-sm leading-relaxed m-0"
                  ellipsis={{ rows: 2 }}
                >
                  {kb.description}
                </Paragraph>
              </div>

              {/* 卡片底部：统计数据与时间 */}
              <div className="flex items-center justify-between text-xs text-gray-400 border-t border-gray-100 pt-4 mt-auto">
                <div className="flex items-center gap-1.5">
                  <FileTextOutlined />
                  <span>{kb.docCount} 份文档</span>
                </div>
                <div>
                  更新于{formatTime(kb.updatedAt)}
                  
                </div>
              </div>
            </Card>
          ))}
        </div>
      </Spin>
      <CreateKbModal
        open={isModalOpen}
        onCancel={() => setIsModalOpen(false)}
        onSuccess={async (newKbValues) => {
          // 收到子组件传来的新数据，插入到列表最前面
          try {
            // 直接把表单收集到的值传给 API
            await creatKnowledgeBase(newKbValues);
            message.success('知识库创建成功');
            setIsModalOpen(false);
            //// 创建成功后，立刻重新获取列表刷新页面
            fetchKbs();
          } catch (error) {
            message.error('创建失败，请重试');
          }
        }}
      />
      <KbDetailDrawer
        open={drawerVisible}
        kbId={activeKb.id}
        kbName={activeKb.name}
        onClose={() => setDrawerVisible(false)}
        onRefreshKbList={fetchKbs}
      />
    </PageContainer>
  );
}
