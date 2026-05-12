import React, { useEffect, useState } from 'react';
import { getUsers } from '@/services/api/yonghuUser';
import { PlusOutlined, UserOutlined } from '@ant-design/icons';
import { Avatar, Button, Card, message, Table, Tag } from 'antd';
import AddUserModal from './components/addUserModal';


export default function UserManage() {
  const [users, setUsers] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [messageApi, contextHolder] = message.useMessage();
  // 控制新增弹窗的开关
  const [isModalOpen, setIsModalOpen] = useState(false);
  // 获取所有用户列表
  const fetchUsers = async () => {
    setLoading(true);
    try {
      const res = await getUsers();
      if (res.code === 200) {
        setUsers(res.data || []);
      } else {
        messageApi.error(res.message || '获取用户列表失败');
      }
    } catch (error:any) {
      if(error?.respose?.status===401){
        messageApi.error('登录状态已过期，请重新登录！');
        setTimeout(() => {
          localStorage.clear();
          window.location.href='/login'
        }, 1000);
      } else{
        messageApi.error('网络请求错误');
      }
    } finally {
      setLoading(false);
    }
  };
  useEffect(() => {
    fetchUsers();
  }, []);

  //表格列配置
  const columns = [
    {
      title: '头像',
      dataIndex: 'avatar',
      key: 'avatar',
      width: 80,
      render: (avatar: string) => (
        <Avatar
          src={avatar}
          icon={<UserOutlined />}
          className="shadow-sm border border-gray-100"
        />
      ),
    },
    {
      title: '登录账号',
      dataIndex: 'username',
      key: 'username',
      render: (text: string) => (
        <span className="font-medium text-gray-700">{text}</span>
      ),
    },
    {
      title: '角色',
      key: 'role',
      render: (_: any, record: any) => {
        return record.username === 'admin' ? (
          <Tag color="blue">超级管理员</Tag>
        ) : (
          <Tag color="default">普通用户</Tag>
        );
      },
    },
    {
      title: '创建时间',
      dataIndex: 'created_at',
      key: 'created_at',
      render: (time: string) => (
        <span className="text-gray-400">
          {time
            ? new Date(time).toLocaleString('zh-CN', { hour12: false })
            : '-'}
        </span>
      ),
    },
  ];

  return (
    <div className="p-6 max-w-6xl mx-auto">
      {contextHolder}
      {/* 头部区域 */}
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-800">用户管理</h1>
          <p className="text-gray-500 text-sm mt-1">
            管理系统内的所有账户，支持添加新成员。
          </p>
        </div>
        <Button
          type="primary"
          icon={<PlusOutlined />}
          size="large"
          className="rounded-lg shadow-md"
          onClick={() => setIsModalOpen(true)}
        >
          新增用户
        </Button>
      </div>
      {/* 表格区域 */}
      <Card
        className="shadow-sm rounded-xl border-gray-100"
        styles={{ body: { padding: 0 } }}
      >
        <Table
          dataSource={users}
          columns={columns}
          rowKey="ID"
          loading={loading}
          pagination={{ pageSize: 10, showSizeChanger: true }}
        />
      </Card>

      {/*  挂载新增用户弹窗子组件 */}
      <AddUserModal
        open={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        // 子组件添加成功后，触发父组件重新拉取表格数据
        onSuccess={() => fetchUsers()}
      />
    </div>
  );
}
