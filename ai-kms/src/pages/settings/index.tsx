import { getConfigs, postConfigsBatch } from '@/services/api/xitongpeizhi';
import {
  CheckCircleFilled,
  ControlOutlined,
  KeyOutlined,
  RubyOutlined,
} from '@ant-design/icons';
import { Button, Input, message, Select, Slider, Spin } from 'antd';
import { useEffect, useState } from 'react';

import SettingItem from './components/settingItem';

export default function Settings() {
  const [configs, setConfigs] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [originalConfigs, setOriginalConfigs] = useState<any[]>([]);
  const [isSaving, setIsSaving] = useState(false);

  const requiredKeys = [
    'llm_model_name',
    'llm_api_key',
    'deepseek_api_key',
    'llm_temperature',
  ];

  const fetchConfigs = async () => {
    try {
      const res = await getConfigs();
      if (res.code === 200) {
        const data = res.data || [];
        setConfigs(data);
        setOriginalConfigs(JSON.parse(JSON.stringify(data)));
      }
    } catch (error) {
      message.error('获取系统配置失败');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchConfigs();
  }, []);

  const handleValueChange = (key: string, newValue: any) => {
    setConfigs((prev) => {
      const isExist = prev.some((Item) => Item.configKey === key);
      if (isExist) {
        return prev.map((item) =>
          item.configKey === key
            ? { ...item, configValue: String(newValue) }
            : item,
        );
      } else {
        return [...prev, { configKey: key, configValue: String(newValue) }];
      }
    });
  };

  const getConfigValue = (key: string) => {
    return configs.find((c) => c.configKey === key)?.configValue || '';
  };
  const getConfigDesc = (key: string) => {
    return configs.find((c) => c.configKey === key)?.description || '';
  };

  const isAllFilled = requiredKeys.every((key) => {
    const val = getConfigValue(key);
    return val !== undefined && String(val).trim() !== '';
  });

  const handleSaveAll = async () => {
    setIsSaving(true);
    try {
      //提取要保存的数据
      const configsToSave = configs
        .filter((c) => requiredKeys.includes(c.configKey))
        .map((c) => ({
          configKey: c.configKey,
          configValue: String(c.configValue).trim(),
        }));
        //校验密钥格式
        const dsKey = configsToSave.find(
          (c) => c.configKey === 'deepseek_api_key',
        )?.configValue;
        if (dsKey && !dsKey.startsWith('sk-')){
          message.error('DeepSeek 密钥格式错误：必须以 "sk-" 开头！');
          setIsSaving(false);
          return;
        }
        const zhipuKey = configsToSave.find(
          (c) => c.configKey === 'llm_api_key',
        )?.configValue;
        if(zhipuKey && !zhipuKey.includes('.')){
          message.error(
            '智谱 API Key 格式错误：通常包含小数点 (.)，请检查是否复制完整！',
          );
          setIsSaving(false);
          return;
        }

// 校验通过，发送请求给后端
      // @ts-ignore
      const res = await postConfigsBatch(configsToSave);
      if (res.code === 200) {
        message.success({
          content: '系统配置已成功同步至数据库',
          icon: <CheckCircleFilled className="text-green-500" />,
        });
        setOriginalConfigs(JSON.parse(JSON.stringify(configs)));
      } else {
        message.error(res.message || '批量保存失败');
      }
    } catch (error) {
      message.error('网络请求异常，请检查后端 API 是否正常');
    } finally {
      setIsSaving(false);
    }
  };

  const handleCancel = () => {
    setConfigs(JSON.parse(JSON.stringify(originalConfigs)));
    message.info('已撤销修改');
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#F5F5F7]">
        <Spin size="large" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#F5F5F7] p-8 text-gray-800">
      <div className="max-w-4xl mx-auto">
        {/* 标题区 */}
        <div className="mb-10 pl-2">
          <h1 className="text-3xl font-bold tracking-tight text-gray-900">
            系统偏好设置
          </h1>
          <p className="text-gray-500 mt-2 text-sm">
            管理 AI-KMS 的核心驱动引擎与密钥，修改后实时生效。
          </p>
        </div>

        {/* 白底大圆角卡片 */}
        <div className="bg-white rounded-2xl shadow-[0_2px_10px_rgba(0,0,0,0.02)] overflow-hidden">
          <SettingItem
            icon={<RubyOutlined />}
            iconBgClass="bg-blue-50"
            iconColorClass="text-blue-500"
            title="默认 AI 模型"
            description={getConfigDesc('llm_model_name')}
          >
            <Select
              value={getConfigValue('llm_model_name')}
              onChange={(val) => handleValueChange('llm_model_name', val)}
              className="w-48"
              size="large"
              options={[
                { value: 'deepseek-chat', label: 'DeepSeek (V3)' },
                { value: 'deepseek-reasoner', label: 'DeepSeek-R1 (推理)' },
                { value: 'glm-4', label: '智谱 GLM-4' },
              ]}
            />
          </SettingItem>

          <SettingItem
            icon={<KeyOutlined />}
            iconBgClass="bg-indigo-50"
            iconColorClass="text-indigo-500"
            title="智谱 API Key"
            description="用于文本向量化 (Embedding)"
          >
            <Input.Password
              value={getConfigValue('llm_api_key')}
              onChange={(e) => handleValueChange('llm_api_key', e.target.value)}
              placeholder="sk-..."
              className="max-w-md rounded-lg py-2"
              allowClear
            />
          </SettingItem>

          <SettingItem
            icon={<KeyOutlined />}
            iconBgClass="bg-purple-50"
            iconColorClass="text-purple-500"
            title="DeepSeek 密钥"
            description="用于核心对话生成"
          >
            <Input.Password
              value={getConfigValue('deepseek_api_key')}
              onChange={(e) =>
                handleValueChange('deepseek_api_key', e.target.value)
              }
              placeholder="sk-..."
              className="max-w-md rounded-lg py-2"
              allowClear
            />
          </SettingItem>

          <SettingItem
            icon={<ControlOutlined />}
            iconBgClass="bg-orange-50"
            iconColorClass="text-orange-500"
            title="模型创造力"
            description="数值越高，回答越发散 (0.1 - 1.0)"
            hideBorder={true} // 最后一条隐藏底边框
          >
            <div className="flex-1 max-w-[200px]">
              <Slider
                min={0.1}
                max={1.0}
                step={0.1}
                value={Number(getConfigValue('llm_temperature')) || 0.7}
                onChange={(val) => handleValueChange('llm_temperature', val)}
                tooltip={{ formatter: (value) => `发散度: ${value}` }}
              />
            </div>
            <div className="text-gray-500 font-mono w-8 text-right">
              {getConfigValue('llm_temperature')}
            </div>
          </SettingItem>
        </div>

        {/* 底部按钮区域 */}
        <div className="flex items-center justify-end space-x-4 p-5 bg-gray-50 border-t border-gray-100 rounded-b-2xl shadow-[0_2px_10px_rgba(0,0,0,0.02)]">
          <Button
            shape="round"
            size="large"
            onClick={handleCancel}
            className="text-gray-500 hover:text-gray-800"
          >
            取消
          </Button>
          <Button
            type="primary"
            shape="round"
            size="large"
            disabled={!isAllFilled}
            loading={isSaving}
            onClick={handleSaveAll}
            className={`border-none shadow-md ${
              isAllFilled ? 'bg-black hover:bg-gray-800' : 'bg-gray-300'
            }`}
          >
            保存更改
          </Button>
        </div>
        {/* 底部版权或系统提示 */}
        <div className="text-center mt-8 text-gray-400 text-xs">
          AI-KMS System Preferences · 动态热更新架构
        </div>
      </div>
    </div>
  );
}
