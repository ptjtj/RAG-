import {
  PlusOutlined,
  MessageOutlined,
  DeleteOutlined,
} from '@ant-design/icons';
import { Button,Layout,List,Spin } from "antd";
import React from "react";

const {Sider}=Layout;
interface ChatSidebarProps {
  sessions: any[];
  currentSessionId: number | null;
  loading: boolean;
  onSelectSession: (id: number) => void;
  onCreateSession: () => void;
  isCreating: boolean;
  onDeleteSession: (id: number) => void;
}
export default function ChatSidebar({
  sessions,
  currentSessionId,
  loading,
  onSelectSession,
  onCreateSession,
  isCreating,
  onDeleteSession
}:ChatSidebarProps) {
    return (
      <Sider
        width={260}
        theme="light"
        className="border-r border-gray-200 flex flex-col h-full z-10 shadow-[2px_0_8px_rgba(0,0,0,0.02)]"
      >
        <div className="p-4 border-b border-gray-100">
          <Button
            type="primary"
            block
            size="large"
            icon={<PlusOutlined />}
            onClick={onCreateSession}
            className="shadow-sm"
            loading={isCreating}
            disabled={isCreating}
          >
            新建对话
          </Button>
        </div>
        <div className="flex-1 overflow-y-auto p-3">
          <Spin spinning={loading}>
            <List
              dataSource={sessions}
              locale={{ emptyText: '暂无历史对话' }}
              renderItem={(item) => (
                <List.Item
                  onClick={() => onSelectSession(item.id)}
                  className={`group cursor-pointer py-2.5 px-4 rounded-full mb-1 transition-colors border-none ${
                    currentSessionId === item.id
                      ? 'bg-[#e8ebfa] text-[#1f1f1f] font-medium'
                      : 'text-gray-600 hover:bg-[#f0f4f9] hover:text-[#1f1f1f]'
                  }`}
                >
                  <div className="flex items-center justify-between w-full">
                    <div className="flex items-center truncate flex-1 pr-2">
                      <MessageOutlined
                        className={`mr-3 text-base flex-shrink-0 ${currentSessionId===item.id ? 'texy-[#1f1f1f]' : 'opacity-60'}`}
                      />
                      <span className="truncate text-sm">{item.title}</span>
                    </div>
                  </div>
                  {/* 垃圾桶按钮 */}
                  <div
                    className="opacity-0 group-hover:opacity-100 transition-opacity"
                    onClick={(e) => {
                      e.stopPropagation();
                      onDeleteSession(item.id);
                    }}
                  >
                    <DeleteOutlined className="text-gray-400 hover:text-gray-800 p-1 transition-colors" />
                  </div>
                </List.Item>
              )}
            />
          </Spin>
        </div>
      </Sider>
    );
};