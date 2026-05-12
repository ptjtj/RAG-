import { Button, Divider, Form, Input, message, Modal } from 'antd';
import {postRegister} from '@/services/api/renzhengAuth'
import React from 'react';
import { UserOutlined } from '@ant-design/icons';


interface AddUserModalProps {
open:boolean;
onClose:()=>void;
onSuccess:()=> void;
}

export default function AddUserModal({open,onClose,onSuccess}:AddUserModalProps){
const [form]=Form.useForm();
const [messageApi,contextHolder]=message.useMessage();

const handleAddUser=async (values:any)=>{
try{
    const res=await postRegister(values);
    if(res.code===200){
        messageApi.success('新用户添加成功！');

        // ?
        form.resetFields();
        onSuccess(); // 通知外面的表格刷新
        onClose();
    } else{
        messageApi.error(res.message || '添加失败');
    }
} catch (error){
    messageApi.error('账号已存在或网络错误');
}
}
    return (
        // 弹窗
      <Modal
        title={<div className="text-lg font-medium">新增系统用户</div>}
        open={open}
        onCancel={onClose}
        footer={null}
        destroyOnClose
      >
        {contextHolder}
        <div className="pt-4">
          <Form form={form} layout="vertical" onFinish={handleAddUser}>
            <Form.Item
            name="username"
            label="登录账号 (姓名)"
            rules={[
              { required: true, message: '请输入账号' },
              { min: 2, message: '账号长度至少 2 位' },
            ]}
          >
            <Input prefix={<UserOutlined className="text-gray-400" />} placeholder="请输入新用户的登录账号" size="large" />
          </Form.Item>

            <Form.Item
            name="password"
            label="初始密码"
            rules={[
              { required: true, message: '请输入初始密码' },
              { min: 6, message: '密码不能少于 6 位' },
            ]}
            >
              <Input.Password placeholder="请输入至少6位的密码" size="large" />
              <Button type="primary" htmlType="submit" block size="large" className="mt-4 rounded-lg">
                确认添加
              </Button>
            </Form.Item>
          </Form>
        </div>
      </Modal>
    );
}