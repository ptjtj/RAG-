import {
  PlusOutlined,
  MessageOutlined,
  DeleteOutlined,
  UserOutlined,
  SettingOutlined,
  ToolFilled,
  MenuUnfoldOutlined,
} from '@ant-design/icons';
import { Button,Layout,List,Spin,Avatar, Tooltip } from "antd";
import React, { useState } from "react";


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
  onDeleteSession,
}:ChatSidebarProps) {
const [collapsed, setCollapsed]=useState(false);

    return (
      <>
        {collapsed && (
          <div className="absolute top-4 left-4 z-50">
            <Tooltip title="展开侧边栏" placement="right">
              <Button
                type="text"
                size="large"
                icon={<MenuUnfoldOutlined className="text-lg" />}
                onClick={() => setCollapsed(false)}
                className="text-gray-500 hover:text-blue-600 hover:bg-blue-50 rounded-lg shadow-sm bg-white/90 backdrop-blur-sm border border-gray-200"
              />
            </Tooltip>
          </div>
        )}
        <Sider
          width={260}
          collapsible
          collapsed={collapsed}
          collapsedWidth={0}
          trigger={null}
          theme="light"
          style={{ background: '#f9f9f9' }}
          className="border-r border-gray-200  h-full z-10 "
        >
          <div className="flex flex-col h-full w-full bg-transparent">
            <div className="p-4  border-gray-100 flex items-center justify-between gap-2">
              <Button
                type="primary"
                block
                size="large"
                icon={<PlusOutlined />}
                onClick={()=>{
                  const existingNewSession = sessions.find(
                    (s) => s.title === '新对话',
                  );
                  if(existingNewSession){
                    if (currentSessionId !==existingNewSession.id){
                      onSelectSession(existingNewSession.id);
                    }
                  } else{
                    onCreateSession();
                  }
                }}
                className="shadow-sm flex-1"
                loading={isCreating}
                disabled={isCreating}
              >
                新建对话
              </Button>
              <Tooltip title="收起边栏">
                <Button
                  type="text"
                  icon={
                    <MenuUnfoldOutlined className="text-gray-500 text-base" />
                  }
                  onClick={() => setCollapsed(true)}
                  className="hover:bg-gray-100 rounded-lg flex-shrink-0"
                />
              </Tooltip>
            </div>
            <div className="flex-1 overflow-y-auto p-3">
              <Spin spinning={loading}>
                <List
                  dataSource={sessions}
                  locale={{ emptyText: '暂无历史对话' }}
                  renderItem={(item) => (
                    <List.Item
                      onClick={() => onSelectSession(item.id)}
                      className={`group cursor-pointer py-2.5 px-4 rounded-xl mb-1 transition-all border-none ${
                        currentSessionId === item.id
                          ? 'bg-white text-blue-600 shadow-sm font-medium'
                          : 'text-gray-600 hover:bg-gray-200/60 hover:text-gray-900'
                      }`}
                    >
                      <div className="flex items-center justify-between w-full">
                        <div className="flex items-center truncate flex-1 pr-2">
                          <MessageOutlined
                            className={`mr-3 text-base flex-shrink-0 ${
                              currentSessionId === item.id
                                ? 'text-[#1f1f1f]'
                                : 'opacity-60'
                            }`}
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
          </div>
        </Sider>
      </>
    );
};