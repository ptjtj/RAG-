import {
  deleteUserAvatar,
  putUserPassword,
  putUserUsername,
} from '@/services/api/yonghuUser';

import {
  DeleteOutlined,
  IdcardOutlined,
  LockOutlined,
  UploadOutlined,
  UserOutlined,
} from '@ant-design/icons';
import {
  Avatar,
  Button,
  Form,
  Input,
  message,
  Modal,
  Tabs,
  Upload,
} from 'antd';
import { useEffect, useState } from 'react';
interface UserCenterModalProps {
  open: boolean;
  onClose: () => void;
  user: any;
  onUpdateUser: (newUser: any) => void; // 用于通知父组件更新头像
}

export default function UserCenterModal({
  open,
  onClose,
  user,
  onUpdateUser,
}: UserCenterModalProps) {
  const [messageApi, contextHolder] = message.useMessage();
  const [form] = Form.useForm();
  const [infoForm] = Form.useForm();
  const [loading, setLoading] = useState(false);
  const [localAvatar, setLocalAvatar] = useState(user?.avatar || '');
  useEffect(() => {
    if (open) {
      form.resetFields();
      infoForm.setFieldsValue({ newUsername: user?.username });
      setLocalAvatar(user?.avatar || '');
    }
  }, [open, user]);
  //修改姓名
  const onFinishInfo = async (values: any) => {
    if (values.newUsername === user?.username) {
      messageApi.info('用户名未发生改变');
      return;
    }
    setLoading(true);
    try {
      const res = await putUserUsername({ newUsername: values.newUsername });

      if (res.code === 200) {
        const { accessToken, refreshToken, user: newUser } = res.data || {};

        // 既然拿到了新身份，直接盖掉本地存储
        if (accessToken) {
          localStorage.setItem('accessToken', accessToken);
          localStorage.setItem('refreshToken', refreshToken);
          localStorage.setItem('user', JSON.stringify(newUser));
          onUpdateUser(newUser); // 瞬间更新左下角
        }

        messageApi.success('姓名修改成功！');
        onClose(); // 关闭弹窗

        // 丝滑软刷新，彻底更新全局状态
        setTimeout(() => {
          window.location.reload();
        }, 500);
      } else {
        messageApi.error(res.message || '修改失败');
      }
    } catch (error: any) {
      messageApi.error('该用户名已被占用或网络错误');
    } finally {
      setLoading(false);
    }
  };
  //修改头像
  const uploadProps = {
    name: 'file',
    action: '/api/v1/user/avatar',
    headers: {
      get Authorization() {
        return `Bearer ${localStorage.getItem('accessToken')}`;
      },
    },

    showUploadList: false,
    onChange(info: any) {
      if (info.file.status === 'uploading') {
        // 可以在这里加个 loading 状态
      }
      if (info.file.status === 'done') {
        const newAvatarUrl = info.file.response.data;
        messageApi.success('头像更换成功！');
        setLocalAvatar(newAvatarUrl);
        onUpdateUser({ ...user, avatar: newAvatarUrl }); // 通知父组件更新侧边栏头像
      } else if (info.file.status === 'error') {
        messageApi.error(info.file.response?.message || '头像上传失败');
      }
    },
  };
  // 移除头像
  const handleClearAvatar = async () => {
    try {
      const res = await deleteUserAvatar();
      if (res.code === 200) {
        messageApi.success('头像已移除');
        setLocalAvatar('');
        onUpdateUser({ ...user, avatar: '' });
      } else {
        messageApi.error(res.message || '移除失败');
      }
    } catch (error) {
      messageApi.error('网络错误');
    }
  };
  //修改密码
  const onFinishPassword = async (values: any) => {
    setLoading(true);
    try {
      const res = await putUserPassword({
        oldPassword: values.oldPassword,
        newPassword: values.newPassword,
      });
      if (res.code === 200) {
        messageApi.success('密码修改成功，请重新登录！');
        onClose();
        // setTimeout(() => {
        //   localStorage.clear();
        //   window.location.href = '/login';
        // }, 1500);
      } else {
        messageApi.error(res.message || '修改失败');
      }
    } catch (error: any) {
      const errorMsg =
        error?.response?.data?.message ||
        error?.info?.message ||
        '原密码不正确或网络错误';
      messageApi.error(errorMsg);
      if (error?.response?.status === 401) {
        messageApi.warning('登录身份已过期，请重新登录');
        setTimeout(() => {
          localStorage.clear();
          window.location.href = '/login';
        }, 1500);
      }
    } finally {
      setLoading(false);
    }
    {
    }
  };

  return (
    <Modal
      title={<div className="text-center text-lg font-medium">个人设置</div>}
      open={open}
      onCancel={onClose}
      footer={null}
      width={420}
      destroyOnClose
    >
      {/* 占位符 */}
      {contextHolder}
      <Tabs defaultActiveKey="1" centered className="mt-4">
        <Tabs.TabPane tab="基本信息" key="1">
          <div className="py-4 px-2">
            <Form form={infoForm} layout="vertical" onFinish={onFinishInfo}>
              <Form.Item
                name="newUsername"
                label="展示姓名（登录账号）"
                rules={[
                  { required: true, message: '姓名不能为空' },
                  { min: 2, message: '姓名至少 2 个字符' },
                ]}
                extra="修改后，下次登录需使用新姓名作为账号"
              >
                <Input
                  prefix={<IdcardOutlined className="text-gray-400" />}
                  placeholder="请输入您的姓名"
                  size="large"
                />
              </Form.Item>
              <Button
                type="primary"
                htmlType="submit"
                block
                size="large"
                loading={loading}
                className="mt-4 rounded-full"
              >
                保存修改
              </Button>
            </Form>
          </div>
        </Tabs.TabPane>

        {/* 修改头像 */}
        <Tabs.TabPane tab="更换头像" key="2">
          <div className="flex flex-col items-center py-8">
            <Avatar
              size={90}
              src={localAvatar}
              icon={<UserOutlined />}
              className="mb-6 shadow-sm border border-gray-100"
            />
            <Upload {...uploadProps}>
              <Button icon={<UploadOutlined />} className="rounded-full px-6">
                选择新的图片
              </Button>
            </Upload>
            {/* 把移除头像的按钮加回来 */}
            {localAvatar && (
              <Button
                type="text"
                danger
                icon={<DeleteOutlined />}
                onClick={handleClearAvatar}
                className="mt-2 text-xs"
              >
                移除头像
              </Button>
            )}
            <div className="text-gray-400 text-xs mt-4 text-center">
              支持 JPG、PNG 格式
              <br />
              建议图片尺寸 200x200 像素
            </div>
          </div>
        </Tabs.TabPane>
        {/* 修改密码 */}
        <Tabs.TabPane tab="安全设置" key="3">
          <div className="py-4 px-2">
            <Form form={form} layout="vertical" onFinish={onFinishPassword}>
              <Form.Item
                name="oldPassword"
                label="当前密码"
                rules={[{ required: true, message: '请输入当前密码' }]}
              >
                <Input.Password
                  prefix={<LockOutlined className="text-gray-400" />}
                  placeholder="请输入当前密码"
                  size="large"
                />
              </Form.Item>

              <Form.Item
                name="newPassword"
                label="新密码"
                rules={[
                  { required: true, message: '请输入新密码' },
                  { min: 6, message: '密码长度不能少于 6 位' },
                ]}
              >
                <Input.Password
                  prefix={<LockOutlined className="text-gray-400" />}
                  placeholder="请输入新密码（至少 6 位）"
                  size="large"
                />
              </Form.Item>
              <Form.Item
                name="confirmPassword"
                label="确认新密码"
                dependencies={['newPassword']}
                rules={[
                  { required: true, message: '请再次输入新密码' },
                  // 联动校验：必须和新密码一模一样
                  ({ getFieldValue }) => ({
                    validator(_, value) {
                      if (!value || getFieldValue('newPassword') === value) {
                        return Promise.resolve();
                      }
                      return Promise.reject(
                        new Error('两次输入的新密码不一致！'),
                      );
                    },
                  }),
                ]}
              >
                <Input.Password
                  prefix={<LockOutlined className="text-gray-400" />}
                  placeholder="请再次输入新密码"
                  size="large"
                />
              </Form.Item>
              <Button
                type="primary"
                htmlType="submit"
                block
                size="large"
                loading={loading}
                className="mt-2 rounded-full"
              >
                确认修改
              </Button>
            </Form>
          </div>
        </Tabs.TabPane>
      </Tabs>
    </Modal>
  );
}
