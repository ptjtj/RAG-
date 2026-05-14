import { DeleteOutlined, InboxOutlined } from '@ant-design/icons';
import { request } from '@umijs/max';
import { Button, Drawer, message, Popconfirm, Table, Tag, Upload } from 'antd';
import { useEffect, useState } from 'react';

const { Dragger } = Upload;

// 定义外部传进来的参数
interface KbDetailDrawerProps {
  open: boolean;
  kbId: number | null; // 当前点击的是哪个知识库
  kbName: string; // 知识库的名字，用于显示标题
  onClose: () => void;
  onRefreshKbList?: () => void;
}

export default function KbDetailDrawer({
  open,
  kbId,
  kbName,
  onClose,
  onRefreshKbList,
}: KbDetailDrawerProps) {
  const [docs, setDocs] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [uploading, setUploading] = useState(false);

  //  获取当前知识库下的所有文档
  const fetchDocs = async () => {
    if (!kbId) return;
    setLoading(true);
    try {
      const res = await request(`/kb/${kbId}/docs`, { method: 'GET' });
      setDocs(res.data || []);
    } catch (error) {
      message.error('获取文档列表失败');
    } finally {
      setLoading(false);
    }
  };

  // 只要抽屉打开，并且有了 kbId，就去拉取数据
  useEffect(() => {
    if (open && kbId) {
      fetchDocs();
    } else {
      // 抽屉关闭时清空数据
      setDocs([]);
    }
  }, [open, kbId]);
  //短轮询
  useEffect(() => {
    // 检查当前列表里，是否还有状态为 'pending'（等待解析）的文
    const hasPending = docs.some((doc: any) => doc.status === 'pending');
    let timer: NodeJS.Timeout;

    if (hasPending && open) {
      //2 秒后自动重新拉取一次列表
      timer = setTimeout(() => {
        fetchDocs();
      }, 2000);
    }
    return () => clearTimeout(timer);
  }, [docs, open]);

  // 自定义拖拽上传逻辑
  const customUpload = async (options: any) => {
    // 如果正在上传，直接拦截并提示
    if (uploading) {
      message.warning('小步快跑，请等待当前文件解析完成后再传下一个哦~');
      return;
    }

    setUploading(true);
    const { file, onSuccess, onError, onProgress } = options;

    const formData = new FormData();
    formData.append('file', file);

    try {
      onProgress({ percent: 30 });
      await request(`/kb/${kbId}/upload`, {
        method: 'POST',
        data: formData,
      });

      onProgress({ percent: 100 });
      message.success(`${file.name} 上传成功！`);
      onSuccess('ok');
      fetchDocs(); // 上传成功，刷新表格
      if (onRefreshKbList) {
        onRefreshKbList();
      }
    } catch (error) {
      message.error(`${file.name} 上传失败`);
      onError(error);
    } finally {
      setUploading(false);
    }
  };
  const handleDeleteDoc = async (docId: string) => {
    try {
      await request(`/docs/${docId}`, { method: 'DELETE' });
      message.success('文档及碎片已彻底清除');
      fetchDocs(); // 删完立刻刷新列表
      if (onRefreshKbList) {
        onRefreshKbList();
      }
    } catch (error) {
      message.error('删除失败，请重试');
    }
  };

  // 表格列配置
  const columns = [
    {
      title: '文件名',
      dataIndex: 'fileName',
      key: 'fileName',
      render: (text: string, record: any) => {
        const rawPath=record.filePath || '';
        const safePath=rawPath.replace(/\\/g,'/');
        const fileLink = safePath.startsWith('http')
          ? safePath
          : `http://localhost:8080/${safePath}`;
          return (
            <a
            href={fileLink}
            target='_blank'
            rel="noopener noreferrer"
            className='text-blue-500 hover:text-blue-700 hover:underline cursor-pointer'
            >
              {text}
            </a>
          )
      },
    },
    {
      title: '大小',
      dataIndex: 'fileSize',
      key: 'fileSize',
      render: (size: number) => `${(size / 1024).toFixed(2)} KB`,
    },
    {
      title: '状态',
      dataIndex: 'status',
      key: 'status',
      render: (status: string) => {
        if (status === 'pending') return <Tag color="processing">等待解析</Tag>;
        if (status === 'success') return <Tag color="success">解析完毕</Tag>;
        return <Tag color="error">解析失败</Tag>;
      },
    },
    //气泡确认框 + 删除按钮
    {
      title: '操作',
      key: 'action',
      render: (_: any, record: any) => (
        <Popconfirm
          title="确定要彻底删除这份文档吗？"
          description="这将会同时清空该文档产生的 AI 知识切片，且不可恢复。"
          onConfirm={() => handleDeleteDoc(record.id)}
          okText="确认删除"
          okButtonProps={{ danger: true }}
          cancelText="取消"
        >
          <Button type="text" danger icon={<DeleteOutlined />} size="small">
            删除
          </Button>
        </Popconfirm>
      ),
    },
  ];

  return (
    <Drawer
      title={`管理文档 - ${kbName}`}
      placement="right"
      width={700} // 设置抽屉宽度稍微大一点，方便放表格
      onClose={onClose}
      open={open}
    >
      {/* 拖拽上传区域 */}
      <div className="bg-gray-50 p-6 rounded-lg border border-dashed border-gray-300 mb-6">
        <Dragger
          customRequest={customUpload}
          multiple={false}
          showUploadList={false}
          disabled={uploading}
        >
          <p className="ant-upload-drag-icon">
            <InboxOutlined className="text-blue-500 text-4xl" />
          </p>
          <p className="text-lg font-semibold text-gray-700 mt-2">
            点击 或 拖拽文件到这里上传
          </p>
          <p className="text-gray-400 mt-1 text-sm">
            支持 PDF, TXT, DOCX 等格式
          </p>
        </Dragger>
      </div>

      {/* 文档表格 */}
      <Table
        dataSource={docs}
        columns={columns}
        rowKey="id"
        loading={loading}
        size="small"
        pagination={{ pageSize: 8 }}
      />
    </Drawer>
  );
}
