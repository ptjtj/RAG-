import { postRegister } from '@/services/api/renzhengAuth';
import { UserOutlined } from '@ant-design/icons';
import { Button, Form, Input, message, Modal } from 'antd';

interface AddUserModalProps {
  open: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

export default function AddUserModal({
  open,
  onClose,
  onSuccess,
}: AddUserModalProps) {
  const [form] = Form.useForm();
  const [messageApi, contextHolder] = message.useMessage();

  const handleAddUser = async (values: any) => {
    try {
      const res = await postRegister(values);
      if (res.code === 200) {
        messageApi.success('新用户添加成功！');
        form.resetFields();
        onSuccess();
        onClose();
      } else {
        messageApi.error(res.message || '添加失败');
      }
    } catch (error) {
      messageApi.error('账号已存在或网络错误');
    }
  };

  return (
    <Modal
      title={
        <div className="text-xl font-semibold text-[#1D1D1F] text-center mb-2 mt-2">
          新增系统用户
        </div>
      }
      open={open}
      onCancel={onClose}
      footer={null}
      destroyOnClose
      styles={{
        // 弹窗本身也变得更圆润
        content: { borderRadius: 20, padding: 32 },
      }}
      width={400}
    >
      {contextHolder}
      <div className="pt-4">
        <Form
          form={form}
          layout="vertical"
          onFinish={handleAddUser}
          requiredMark={false}
        >
          <Form.Item
            name="username"
            label={
              <span className="text-[#86868B] font-medium text-xs uppercase tracking-wider">
                登录账号 (姓名)
              </span>
            }
            rules={[
              { required: true, message: '请输入账号' },
              { min: 2, message: '账号长度至少 2 位' },
            ]}
          >
            <Input
              prefix={<UserOutlined className="text-[#D2D2D7] mr-2" />}
              placeholder="请输入新用户的登录账号"
              size="large"
              className="bg-[#F5F5F7] border-transparent hover:border-[#D2D2D7] focus:bg-white rounded-xl h-12"
            />
          </Form.Item>

          <Form.Item
            name="password"
            label={
              <span className="text-[#86868B] font-medium text-xs uppercase tracking-wider">
                初始密码
              </span>
            }
            rules={[
              { required: true, message: '请输入初始密码' },
              { min: 6, message: '密码不能少于 6 位' },
            ]}
          >
            <Input.Password
              placeholder="请输入至少6位的密码"
              size="large"
              className="bg-[#F5F5F7] border-transparent hover:border-[#D2D2D7] focus:bg-white rounded-xl h-12"
            />
          </Form.Item>

          <Button
            type="primary"
            htmlType="submit"
            block
            size="large"
            shape="round"
            className="mt-6 bg-[#0071E3] hover:bg-[#0077ED] border-none shadow-sm font-medium h-12 text-base"
          >
            确认添加
          </Button>
        </Form>
      </div>
    </Modal>
  );
}
