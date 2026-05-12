import { request } from '@umijs/max';
import { Layout, message, Modal } from 'antd';
import { useEffect, useRef, useState } from 'react';
import ChatBox from './components/chatBox';
import ChatSidebar from './components/chatSidebar';

export default function ChatPage() {
  // 管理会话列表数据
  const [sessions, setSessions] = useState<any[]>([]);
  const [currentSessionId, setCurrentSessionId] = useState<number | null>(null);
  const [isSidebarLoading, setIsSidebarLoading] = useState(false);
  const [isCreating, setIsCreating] = useState(false);
  const createLockRef = useRef(false);
  const [messageApi, messageContextHolder] = message.useMessage();
  const [modalApi, modalContextHolder] = Modal.useModal();

  // 获取会话列表
  const fetchSessions = async () => {
    setIsSidebarLoading(true);
    try {
      const res = await request('/sessions', { method: 'GET' });
      if (res.code === 200) {
        setSessions(res.data || []);
        // 如果有数据且当前没选中，默认选中第一条
        if (res.data?.length > 0 && !currentSessionId) {
          setCurrentSessionId(res.data[0].id);
        }
      }
    } catch (error) {
      message.error('获取历史会话失败');
    }
    setIsSidebarLoading(false);
  };

  // 新建会话
  const handleCreateSession = async () => {
    if (createLockRef.current) return;
    createLockRef.current = true;
    setIsCreating(true);
    try {
      const res = await request('/sessions', {
        method: 'POST',
        data: { title: '新对话', kbId: 1 }, // 默认kbId，后续可再从 ChatBox 往上提状态，目前够用了
      });
      if (res.code === 200) {
        messageApi.success('已开启新对话');
        fetchSessions();
        setCurrentSessionId(res.data.id);
      }
    } catch (error) {
      messageApi.error('创建对话失败');
    } finally {
      createLockRef.current = false;
      setIsCreating(false);
    }
  };

  const handleDeleteSession = (id: number) => {
    modalApi.confirm({
      title: '确定要删除这个对话吗？',
      content: '删除后，聊天记录将无法恢复。',
      okText: '确认删除',
      okType: 'danger',
      cancelText: '取消',
      onOk: async () => {
        try {
          const res = await request(`/sessions/${id}`, { method: 'DELETE' });
          if (res.code === 200) {
            messageApi.success('删除成功');
            // 如果删掉的正好是当前正在聊的，就把当前 ID 清空
            if (currentSessionId === id) {
              setCurrentSessionId(null);
            }
            fetchSessions();
          }
        } catch (error) {
          messageApi.error('删除失败');
        }
      },
    });
  };

  useEffect(() => {
    fetchSessions();
  }, []);

  return (
    <Layout className="h-[calc(100vh-64px)] flex flex-row bg-white">
      {messageContextHolder}
      {modalContextHolder}
      <ChatSidebar
        sessions={sessions}
        currentSessionId={currentSessionId}
        loading={isSidebarLoading}
        onSelectSession={setCurrentSessionId}
        onCreateSession={handleCreateSession}
        isCreating={isCreating}
        onDeleteSession={handleDeleteSession}
       
      />

      <ChatBox
        currentSessionId={currentSessionId}
        onRefreshSessions={fetchSessions}
      />
     
    </Layout>
  );
}
