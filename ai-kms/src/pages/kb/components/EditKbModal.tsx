import { Form, Input, Modal, message } from 'antd';
import { useEffect, useState } from 'react';
import { putKbId } from '@/services/api/knowledgeBase';

interface EditKbModalProps {
    open:boolean;
    kbId:number | null;
    initialValues:{name:string;description:string};
    onCancel:()=> void;
    onSuccess:()=> void;
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
      destroyOnClose
    >
      <Form form={form} layout="vertical" className="mt-4">
        <Form.Item
          name="name"
          label="知识库名称"
          rules={[{ required: true, message: '知识库名称不能为空' }]}
        >
          <Input placeholder="请输入知识库名称" size="large" />
        </Form.Item>
        <Form.Item name="description" label="知识库描述">
          <Input.TextArea placeholder="请输入简短的描述" rows={4} />
        </Form.Item>
      </Form>
    </Modal>
  );
}