import {
  PlusOutlined,
  MessageOutlined,
  DeleteOutlined,
  PushpinOutlined, 
  PushpinFilled, 
  EditOutlined,
  MenuUnfoldOutlined,
} from '@ant-design/icons';
import { Button,Layout,List,Spin, Tooltip, Input } from "antd";
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
  onRenameSession:(id:number,newTitle:string)=>void;
  onPinSession:(id:number,isPinned:boolean)=>void;
}
export default function ChatSidebar({
  sessions,
  currentSessionId,
  loading,
  onSelectSession,
  onCreateSession,
  isCreating,
  onDeleteSession,
  onRenameSession,
  onPinSession,
}:ChatSidebarProps) {
  const [collapsed, setCollapsed] = useState(false);
  const [editingSessionId, setEditingSessionId] = useState<number | null>(null);
  const [editingTitle, setEditingTitle] = useState('');
  //前端智能加权排序（置顶项无条件置顶，其余按原有时间降序）
  const sortedSessions = [...sessions].sort((a, b) => {
    if (a.isPinned && !b.isPinned) return -1;
    if (!a.isPinned && b.isPinned) return 1;
    return 0;
  });
  //重命名
  const handleSaveRename=(id:number)=>{
    const trimmed = editingTitle.trim();
    const original = sessions.find((s) => s.id === id)?.title;
    if (trimmed && trimmed !== original) {
      onRenameSession(id, trimmed);
    }
    setEditingSessionId(null); // 关闭输入框
  }

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
              onClick={() => {
                const existingNewSession = sessions.find(
                  (s) => s.title === '新对话',
                );
                if (existingNewSession) {
                  if (currentSessionId !== existingNewSession.id) {
                    onSelectSession(existingNewSession.id);
                  }
                } else {
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
                dataSource={sortedSessions}
                locale={{ emptyText: '暂无历史对话' }}
                renderItem={(item) => {
                  const isEditing=editingSessionId===item.id;
                  return(
                  <List.Item
                    onClick={() => !isEditing && onSelectSession(item.id)}
                    className={`group cursor-pointer py-2.5 px-4 rounded-xl mb-1 transition-all border-none ${
                      currentSessionId === item.id
                        ? 'bg-white text-blue-600 shadow-sm font-medium'
                        : 'text-gray-600 hover:bg-gray-200/60 hover:text-gray-900'
                    } ${
                    // 置顶标志
                    item.isPinned ? 'border-l-4 border-l-blue-500 bg-blue-50/20' : ''
                    }`}
                  >
                
                      <div className="flex items-center truncate flex-1 pr-2">
                        <MessageOutlined
                          className={`mr-3 text-base flex-shrink-0 ${
                            currentSessionId === item.id
                              ? 'text-[#1f1f1f]'
                              : 'opacity-60'
                          }`}
                        />
                        {isEditing ? (
                          <Input 
                          size='small'
                          value={editingTitle}
                          onChange={(e)=>setEditingTitle(e.target.value)}
                          onBlur={()=>handleSaveRename(item.id)}
                          onPressEnter={()=>handleSaveRename(item.id)}
                          onClick={(e)=>e.stopPropagation()} // 阻止触发列表点击
                          className='h-6 text-xs py-0 px-1.5 focus:border-blue-400'
                          autoFocus
                          />
                        ) : (
                          <span className="truncate text-sm">{item.title}</span>
                        )}
                      </div>
                    {/* 置顶、重命名、删除这三个按钮 */}
                    {!isEditing && (
                      <div className={`flex items-center gap-1 transition-opacity duration-200 ${
                        item.isPinned ? 'opacity-100' : 'opacity-0 group-hover:opacity-100'
                      }`}
                      >
                        <Tooltip title={item.isPinned ? '取消置顶' : '置顶对话'}>
                          <Button
                          type='text'
                          size='small'
                          className={`flex items-center justify-center p-1 border-none bg-transparent ${
                            item.isPinned ? 'text-blue-500' : 'text-gray-400 hover:text-gray-700'
                          }`}
                          icon={item.isPinned ? <PushpinFilled/> : <PushpinOutlined/>}
                          onClick={(e)=>{
                            e.stopPropagation();
                            onPinSession(item.id, !item.isPinned);
                          }}
                          />
                        </Tooltip>
                         <Tooltip title="重命名">
                          <Button
                          type='text'
                          size='small'
                          className='flex items-center justify-center p-1 text-gray-400 hover:text-gray-700 border-none bg-transparent'
                         icon={<EditOutlined/>}
                        onClick={(e)=>{
                            e.stopPropagation();
                            setEditingSessionId(item.id);
                            setEditingTitle(item.title);
                          }}                      
                         />
                        </Tooltip>
                         <Tooltip title="删除对话">
                          <Button
                          size='small'
                          type='text'
                          className='flex items-center justify-center p-1 text-gray-400 hover:text-red-500 border-none bg-transparent'
                          icon={<DeleteOutlined/>}
                          onClick={(e)=>{
                            e.stopPropagation();
                            onDeleteSession(item.id);
                          }}
                          />
                        </Tooltip>
                      </div>
                    )}
                      </List.Item>
                  );
                }}
                />
            </Spin>
          </div>
        </div>
        
      </Sider>
    </>
  );
};