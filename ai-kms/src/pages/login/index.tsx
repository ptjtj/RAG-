import { LockOutlined, UserOutlined } from '@ant-design/icons';
import { request } from '@umijs/max';
import { Button, Form, Input, message } from 'antd';

export default function Login() {
  const [form] = Form.useForm();

  const handleFinish = async (values: any) => {
    try {
      const res = await request('/login', {
        method: 'POST',
        data: values,
      });

      if (res.code === 200 && res.data?.token) {
        
        localStorage.setItem('accessToken', res.data.accessToken);
        localStorage.setItem('refreshToken',res.data.refreshToken);
        message.success('登录成功，欢迎回来！');
        // 带着令牌跳转
        window.location.href = '/chat';
      } else {
        message.error(res.message || '登录失败');
      }
    } catch (error) {
      message.error('网络请求失败，请检查后端服务');
    }
  };

  return (
    
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-gray-100">
      {/* 登录卡片容器 */}
      <div className="bg-white p-10 rounded-2xl shadow-xl w-full max-w-md border border-white/50 backdrop-blur-sm">
        <div className="text-center mb-8">
          <div className="w-16 h-16 bg-blue-600 rounded-2xl mx-auto mb-4 flex items-center justify-center shadow-lg shadow-blue-200">
            <UserOutlined className="text-3xl text-white" />
          </div>
          <h1 className="text-2xl font-bold text-gray-800 tracking-tight">
            AI-KMS 控制台
          </h1>
          <p className="text-gray-400 text-sm mt-2">企业级知识库大模型引擎</p>
        </div>

        <Form
          form={form}
          layout="vertical"
          onFinish={handleFinish}
          size="large"
        >
          <Form.Item
            name="username"
            rules={[{ required: true, message: '请输入管理员账号' }]}
          >
            <Input
              prefix={<UserOutlined className="text-gray-400" />}
              placeholder="账号 (默认: admin)"
              className="rounded-lg"
            />
          </Form.Item>

          <Form.Item
            name="password"
            rules={[{ required: true, message: '请输入密码' }]}
          >
            <Input.Password
              prefix={<LockOutlined className="text-gray-400" />}
              placeholder="密码 (默认: 123456)"
              className="rounded-lg"
            />
          </Form.Item>

          <Form.Item className="mt-8 mb-0">
            <Button
              type="primary"
              htmlType="submit"
              block
              className="bg-blue-600 hover:bg-blue-500 rounded-lg h-11 font-medium text-base shadow-md"
            >
              登 录
            </Button>
          </Form.Item>
        </Form>
      </div>
    </div>
  );
}
