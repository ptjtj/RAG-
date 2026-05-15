import {
  getKnowledgeBases,
} from '@/services/api/knowledgeBase';
import {
  PlusOutlined,
} from '@ant-design/icons';
import { PageContainer } from '@ant-design/pro-components';
import {
  Button,
  Empty,
  MenuProps,
  message,
  Spin,
  Typography,
} from 'antd';
import { useEffect, useState } from 'react';
import CreateKbModal from './components/CreateKbModal';
import KbDetailDrawer from './components/KbDetailDrawer';
import EditKbModal from './components/EditKbModal';
import KbCard from './components/KbCard';


export default function KnowledgeBaseList() {

  const [kbList, setkbList] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  // 控制新建知识库弹窗的状态
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [drawerVisible, setDrawerVisible] = useState(false);
  const [activeKb, setActiveKb] = useState<{ id: number | null; name: string }>(
    { id: null, name: '' },
  );
  // 编辑弹窗特有状态,只需要记录当前在编辑谁的数据
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [editingKbData, setEditingKbData] = useState<any>(null);

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
          onClick={() => setIsCreateOpen(true)}
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
                  setIsCreateOpen(true);
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
            <KbCard
              kb={kb}
              key={kb.id}
              onClick={(data) => {
                setActiveKb({ id: data.id, name: data.name });
                setDrawerVisible(true);
              }}
              onEdit={(data) => {
                setEditingKbData(data);
                setIsEditModalOpen(true);
              }}
              onDeleteSuccess={fetchKbs}
            />
          ))}
        </div>
      </Spin>
      <CreateKbModal
        open={isCreateOpen}
        onCancel={() => setIsCreateOpen(false)}
        onSuccess={() => {
          setIsCreateOpen(false);
          fetchKbs();
        }}
      />
      {/* 抽离后的编辑弹窗 */}
      <EditKbModal
        open={isEditModalOpen}
        kbId={editingKbData?.id || null}
        initialValues={{
          name: editingKbData?.name,
          description: editingKbData?.description,
        }}
        onCancel={() => setIsEditModalOpen(false)}
        onSuccess={() => {
          setIsEditModalOpen(false);
          fetchKbs();
        }}
      />
      {/* 侧边抽屉 */}
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
