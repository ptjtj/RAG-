import React from "react";
import { Modal, Form, Input, Slider, Tooltip } from 'antd';
import { InfoCircleOutlined } from '@ant-design/icons';

interface CreateKbModalProps{
    open:boolean;
    onCancel:()=>void;
    onSuccess:(newKb:any)=>void // 创建成功后，把新数据传给父组件的回调
}

export default function CreateKbModal({open,onCancel,onSuccess}:CreateKbModalProps){
const [form]=Form.useForm()
const handleOk=async()=>{
    try{
        const values =await form.validateFields();
        const newKb={
            id: Date.now(),
            name:values.name,
            description:values.description || '暂无描述',
            docCount:0,
            status:'active',
            updatedAt: new Date().toISOString().replace('T',' ').substring(0,19),
        }
        onSuccess(newKb)
        form.resetFields();
    } catch (error){
        console.log('表单校验失败',error);
        
    }
}

const handleCancelClick=()=>{
    form.resetFields();
    onCancel();

}

    return (
  <>
  {open && (
  <Modal
    title={<span className="text-lg font-semibold">新建知识库</span>}
    open={open}
    onOk={handleOk}
    onCancel={handleCancelClick}
    okText="确认创建"
    cancelText="取消"
    width={520}
    okButtonProps={{ className: 'bg-blue-600' }}
  >
    <Form
      form={form}
      layout="vertical"
      className="mt-6"
      initialValues={{ chunkSize: 500 }}
    >
      <Form.Item
        name="name"
        label={<span className="font-medium text-gray-700">知识库名称</span>}
        rules={[{ required: true, message: '知识库名称不能为空' }]}
      >
        <Input
          placeholder="例如：产品需求文档库"
          size="large"
          className="rounded-lg"
        />
      </Form.Item>

      <Form.Item
        name="description"
        label={<span className="font-medium text-gray-700">描述 (可选)</span>}
      >
        <Input.TextArea
          rows={3}
          placeholder="简要描述该知识库的内容和用途..."
          className="rounded-lg"
        />
      </Form.Item>

      <div className="bg-gray-50 p-4 rounded-xl border border-gray-200 mt-2">
        <div className="flex items-center gap-1.5 mb-2">
          <span className="font-medium text-gray-700 text-sm">
            文本切片设置 (Chunk Size)
          </span>
          <Tooltip title="文档在存入向量数据库前会被切割成小段，此参数决定每段文本的最大长度。">
          <span> <InfoCircleOutlined className="text-gray-400 cursor-help" />
          </span>
          </Tooltip>
        </div>
        <Form.Item name="chunkSize" className="mb-0">
          <Slider
            min={100}
            max={2000}
            step={100}
            marks={{ 100: '100', 500: '500', 2000: '2000' }}
          />
        </Form.Item>
      </div>
    </Form>
  </Modal>
  )}
  </>
);
}