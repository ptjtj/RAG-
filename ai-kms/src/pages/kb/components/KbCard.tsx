import { deleteKnowledgeBase } from '@/services/api/knowledgeBase';
import { formatTime } from '@/utils/format';
import {
  DeleteOutlined,
  FileTextOutlined,
  MoreOutlined,
  RobotOutlined,
  SettingOutlined,
} from '@ant-design/icons';
import {
  Button,
  Card,
  Dropdown,
  MenuProps,
  message,
  Tag,
  Typography,
} from 'antd';

const { Paragraph } = Typography;

interface KbCardProps {
  kb: any;
  onClick: (kb: any) => void; // 点击卡片本体
  onEdit: (kb: any) => void; // 点击下拉菜单的"空间设置"
  onDeleteSuccess: () => void; // 删除成功后通知父组件刷新
}

export default function KbCard({
  kb,
  onClick,
  onEdit,
  onDeleteSuccess,
}: KbCardProps) {
  const actionMenu: MenuProps = {
    items: [
      { key: 'settings', icon: <SettingOutlined />, label: '空间设置' },
      { type: 'divider' },
      {
        key: 'delete',
        icon: <DeleteOutlined className="text-red-500" />,
        label: <span className="text-red-500">删除知识库</span>,
      },
    ],
    onClick: async ({ key, domEvent }) => {
      domEvent.stopPropagation(); // 阻止冒泡
      if (key === 'settings') {
        onEdit(kb);
      }
      if (key === 'delete') {
        try {
          await deleteKnowledgeBase({ id: kb.id });
          message.success('已成功删除知识库');
          onDeleteSuccess();
        } catch (e) {
          message.error('删除失败');
        }
      }
    },
  };

  return (
    <Card
      onClick={() => onClick(kb)}
      variant="borderless"
      className="hover:shadow-xl transition-shadow duration-300 rounded-xl overflow-hidden cursor-pointer flex flex-col h-full"
      styles={{
        body: {
          padding: '24px',
          flex: 1,
          display: 'flex',
          flexDirection: 'column',
        },
      }}
    >
      <div className="flex justify-between items-start mb-4">
        <div className="flex items-center gap-3 font-semibold text-lg text-gray-800">
          <div className="w-10 h-10 rounded-lg bg-blue-50 flex items-center justify-center text-blue-600">
            <RobotOutlined className="text-xl" />
          </div>
          <span className="truncate w-40" title={kb.name}>
            {kb.name}
          </span>
        </div>
        <div className="flex items-center gap-2">
          {kb.status === 'active' ? (
            <Tag
              color="success"
              className="m-0 border-none bg-green-50 text-green-600 font-medium"
            >
              就绪
            </Tag>
          ) : (
            <Tag
              color="processing"
              className="m-0 border-none bg-blue-50 text-blue-600 font-medium"
            >
              处理中
            </Tag>
          )}
          <Dropdown
            menu={actionMenu}
            trigger={['click']}
            placement="bottomRight"
          >
            <Button
              type="text"
              icon={
                <MoreOutlined className="text-gray-400 hover:text-gray-600" />
              }
              onClick={(e) => e.stopPropagation()}
            />
          </Dropdown>
        </div>
      </div>
      <div className="flex-1 mb-6">
        <Paragraph
          className="text-gray-500 text-sm leading-relaxed m-0"
          ellipsis={{ rows: 2 }}
        >
          {kb.description}
        </Paragraph>
      </div>
      <div className="flex items-center justify-between text-xs text-gray-400 border-t border-gray-100 pt-4 mt-auto">
        <div className="flex items-center gap-1.5">
          <FileTextOutlined />
          <span>{kb.docCount} 份文档</span>
        </div>
        <div>更新于 {formatTime(kb.updatedAt)}</div>
      </div>
    </Card>
  );
}
