import { deleteUsersId, getUsers } from '@/services/api/yonghuUser';
import { PlusOutlined, UserOutlined } from '@ant-design/icons';
import { Avatar, Button, message, Popconfirm, Table } from 'antd'; 
import { useEffect, useState } from 'react';
import AddUserModal from './components/addUserModal';

export default function UserManage() {
  const [users, setUsers] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [messageApi, contextHolder] = message.useMessage();
  const [isModalOpen, setIsModalOpen] = useState(false);

  const fetchUsers = async () => {
    setLoading(true);
    try {
      const res = await getUsers();
      if (res.code === 200) {
        setUsers(res.data || []);
      } else {
        messageApi.error(res.message || '获取用户列表失败');
      }
    } catch (error: any) {
      if (error?.response?.status === 401) {
        messageApi.error('登录状态已过期，请重新登录！');
        setTimeout(() => {
          localStorage.clear();
          window.location.href = '/login';
        }, 1000);
      } else {
        messageApi.error('网络请求错误');
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUsers();
  }, []);

  const handleDelete = async (id: number) => {
    try {
      const res = await deleteUsersId({ id });
      if (res.code === 200) {
        messageApi.success('用户已删除！');
        fetchUsers();
      } else {
        messageApi.error(res.message || '删除失败');
      }
    } catch (error) {
      messageApi.error('网络请求错误');
    }
  };

  const columns = [
    {
      title: '头像',
      dataIndex: 'avatar',
      key: 'avatar',
      width: 100,
      render: (avatar: string) => (
        <Avatar
          src={avatar || undefined}
          icon={<UserOutlined />}
          size="large"
          className="shadow-[0_2px_8px_rgba(0,0,0,0.08)] border border-gray-100 bg-[#0071E3] text-white"
        />
      ),
    },
    {
      title: '登录账号',
      dataIndex: 'username',
      key: 'username',
      render: (text: string) => (
        <span className="font-semibold text-[#1D1D1F] text-base">{text}</span>
      ),
    },
    {
      title: '角色',
      key: 'role',
      render: (_: any, record: any) => {
        return record.username === 'admin' ? (
          <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold bg-[#F5F8FF] text-[#0071E3]">
            超级管理员
          </span>
        ) : (
          <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold bg-[#F5F5F7] text-[#86868B]">
            普通用户
          </span>
        );
      },
    },
    {
      title: '操作',
      key: 'action',
      render: (_: any, record: any) => {
        if (record.username === 'admin') {
          return (
            <span className="text-[#D2D2D7] text-sm font-medium cursor-not-allowed">
              不可操作
            </span>
          );
        }
        return (
          <Popconfirm
            title="永久删除用户"
            description={`确定要删除账号 "${record.username}" 吗？此操作不可恢复。`}
            onConfirm={() => handleDelete(record.id)}
            okText="确定删除"
            okButtonProps={{ danger: true, shape: 'round' }}
            cancelText="取消"
            placement="topRight"
          >
            <Button
              type="text"
              size="small"
              className="text-[#86868B] hover:text-[#FF3B30] hover:bg-red-50 font-medium px-3 rounded-lg transition-colors"
            >
              删除
            </Button>
          </Popconfirm>
        );
      },
    },
  ];

  return (
    <div className="min-h-full bg-[#F5F5F7] p-6 md:p-10">
      <style>{`
        .apple-table .ant-table {
          background: transparent !important;
        }
        .apple-table .ant-table-thead > tr > th {
          background: transparent !important;
          border-bottom: 1px solid #F5F5F7 !important;
          color: #86868B !important;
          font-weight: 500 !important;
          padding: 16px 24px !important;
        }
        .apple-table .ant-table-thead > tr > th::before {
          display: none !important; /* 隐藏表头竖线 */
        }
        .apple-table .ant-table-tbody > tr > td {
          border-bottom: 1px solid #F5F5F7 !important;
          padding: 20px 24px !important;
          color: #1D1D1F;
          transition: background-color 0.2s ease;
        }
        .apple-table .ant-table-tbody > tr:hover > td {
          background: #FBFBFD !important; /* 极浅的悬浮灰 */
        }
        .apple-table .ant-pagination {
          justify-content: center !important;
          margin-top: 24px !important;
          margin-bottom: 8px !important;
        }
      `}</style>

      {contextHolder}

      <div className="max-w-6xl mx-auto">
        {/* 头部区域 */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-end mb-8 gap-4">
          <div>
            <h1 className="text-3xl font-semibold text-[#1D1D1F] tracking-tight mb-2">
              用户管理
            </h1>
            <p className="text-[#86868B] text-sm">
              管理系统内的所有账户，支持添加新成员。
            </p>
          </div>
          <Button
            type="primary"
            icon={<PlusOutlined />}
            size="large"
            shape="round"
            className="bg-[#0071E3] hover:bg-[#0077ED] border-none shadow-[0_1px_2px_rgba(0,0,0,0.1)] font-medium px-6 h-10"
            onClick={() => setIsModalOpen(true)}
          >
            新增用户
          </Button>
        </div>

        {/* 表格卡片区域：圆角 20px，极其微妙的阴影 */}
        <div className="bg-white rounded-[20px] shadow-[0_4px_24px_rgba(0,0,0,0.02)] border border-gray-100/50 overflow-hidden p-2 md:p-4">
          <Table
            className="apple-table"
            dataSource={users}
            columns={columns}
            rowKey="id"
            loading={loading}
            pagination={{ pageSize: 10, showSizeChanger: true }}
          />
        </div>
      </div>

      <AddUserModal
        open={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onSuccess={() => fetchUsers()}
      />
    </div>
  );
}
