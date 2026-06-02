import { Form, Input, Modal, message } from 'antd';
import { useEffect, useState } from 'react';
import { putKbId } from '@/services/api/knowledgeBase';
import { InfoCircleOutlined, ToolFilled } from '@ant-design/icons';

interface EditKbModalProps {
  open: boolean;
  kbId: number | null;
  initialValues: { name: string; description: string; systemPrompt?: string };
  onCancel: () => void;
  onSuccess: () => void;
}
export default function EditKbModal({open,kbId,initialValues,onCancel,onSuccess} :EditKbModalProps ){
  const [form] = Form.useForm();
  const [loading, setLoading] = useState(false);
  //// 当弹窗打开且传入了初始值时，回填表单
  useEffect(()=>{
    if(open){
        form.setFieldsValue(initialValues);
    } else{
      // 关闭时清空
      form.resetFields();
    }
  },[open,initialValues,form]);
  const handleOk=async()=>{
    try {
      const values = await form.validateFields();
      if (!kbId) return;
      setLoading(true);
      await putKbId({ id: kbId }, values);
      message.success('知识库更新成功！');
      onSuccess(); // 通知父页面刷新
    } catch (error) {
      console.log('更新验证失败', error);
    } finally {
      setLoading(false);
    }
  }

  return (
    <Modal
      title="空间设置"
      open={open}
      onOk={handleOk}
      confirmLoading={loading}
      onCancel={onCancel}
      okText="保存修改"
      cancelText="取消"
      // destroyOnClose
    >
      <Form form={form} layout="vertical" className="mt-4">
        <Form.Item
          name="name"
          label="知识库名称"
          rules={[{ required: true, message: '知识库名称不能为空' }]}
        >
          <Input placeholder="请输入知识库名称" size="large" />
        </Form.Item>
        <Form.Item
          name="systemPrompt"
          label={
            <span className="font-medium text-gray-700 flex itc gap-1">
              人设与回复逻辑 (System Prompt)
              <ToolFilled title="定义 AI 的身份和回复风格。例如：你是一个严谨的法务助手，请引用具体条款。不填则使用系统默认设定。">
                <InfoCircleOutlined className="text-gray-400 cursor-help" />
              </ToolFilled>
            </span>
          }
        >
          <Input.TextArea
            rows={4}
            placeholder="默认为：你是一个专业的企业知识库助手。请根据以下【背景知识】准确回答用户的问题。"
            className="rounded-lg font-mono text-sm bg-gray-50"
          />
        </Form.Item>
        <Form.Item name="description" label="知识库描述">
          <Input.TextArea placeholder="请输入简短的描述" rows={4} />
        </Form.Item>
      </Form>
    </Modal>
  );
}