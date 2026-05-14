import { ReactNode } from 'react';

// 定义组件需要接收的参数（Props）
interface SettingItemProps {
  icon: ReactNode; // 左侧的图标
  iconBgClass: string; // 图标外圈的背景色 Tailwind 类名
  iconColorClass: string; // 图标本身的颜色 Tailwind 类名
  title: string; // 设置项标题
  description: string; // 设置项描述
  children: ReactNode; // 右侧的实际操作组件（如 Input, Select, Slider）
  hideBorder?: boolean; // 是否隐藏底部边框（最后一条不需要边框）
}

export default function SettingItem({
  icon,
  iconBgClass,
  iconColorClass,
  title,
  description,
  children,
  hideBorder = false,
}: SettingItemProps) {
  return (
    <div
      className={`flex items-center justify-between p-6 transition-colors hover:bg-gray-50/50 ${
        !hideBorder ? 'border-b border-gray-100' : ''
      }`}
    >
      <div className="flex items-center space-x-4 w-1/3">
        <div
          className={`w-10 h-10 rounded-full flex items-center justify-center text-xl ${iconBgClass} ${iconColorClass}`}
        >
          {icon}
        </div>
        <div>
          <div className="font-semibold text-base">{title}</div>
          <div className="text-xs text-gray-400 mt-0.5">{description}</div>
        </div>
      </div>
      <div className="flex items-center space-x-3 w-2/3 justify-end">
        {/* 是外层传入的 Select / Input / Slider */}
        {children}
      </div>
    </div>
  );
}
