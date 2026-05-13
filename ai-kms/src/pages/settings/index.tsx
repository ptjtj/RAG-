import { useEffect, useState } from 'react';
import { Button, Input, message, Select, Slider, Spin } from 'antd';
import {
  CheckCircleFilled,
  ControlOutlined,
  KeyOutlined,
  RubyOutlined,
} from '@ant-design/icons';
import { getConfigs, putConfigs,postConfigsBatch } from '@/services/api/xitongpeizhi';


export default function Settings() {
  const [configs, setConfigs] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  //用于记录初始数据，方便取消回滚
  const [originalConfigs, setOriginalConfigs] = useState<any[]>([]);
  const [isSaving, setIsSaving] = useState(false); // 全局保存的 loading 状态
  // 定义系统必须填写的关键配置 Key
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
        const data=res.data || [];
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

  // 监听输入框变化，只更新本地 State
  const handleValueChange = (key: string, newValue: any) => {
    setConfigs((prev) =>{
        const isExist=prev.some((Item)=>Item.configKey===key);
        if(isExist){
            return   prev.map((item) =>
        item.configKey === key
          ? { ...item, configValue: String(newValue) }
          : item,
      )
    }
        else{
            return [...prev, { configKey: key, configValue: String(newValue) }];
        }    
  });
  };
  // 提取配置值的辅助函数
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
  //提交保存
  const handleSaveAll = async () => {
    setIsSaving(true);
    try {
      const configsToSave = configs
        .filter((c) => requiredKeys.includes(c.configKey))
        .map((c) => ({
          configKey: c.configKey,
          configValue: String(c.configValue).trim(),
        }));
      // @ts-ignore
      const res = await postConfigsBatch(configsToSave);
      if (res.code === 200) {
        message.success({
          content: '系统配置已成功同步至数据库',
          icon: <CheckCircleFilled className="text-green-500" />,
        });

        // 同步原始数据，让取消按钮失效或基于新数据回滚
        setOriginalConfigs(JSON.parse(JSON.stringify(configs)));
      } else {
        message.error(res.message || '批量保存失败');
      }
    } catch (error) {
      message.error('网络请求异常，请检查后端 API 是否正常');
      console.error('Batch Save Error:', error);
    } finally {
      setIsSaving(false);
    }
  };
  // 取消修改（回滚）
  const handleCancel = () => {
    // 恢复为之前留底的数据
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
          {/* 默认大模型 */}
          <div className="flex items-center justify-between p-6 border-b border-gray-100 transition-colors hover:bg-gray-50/50">
            <div className="flex items-center space-x-4 w-1/3">
              <div className="w-10 h-10 rounded-full bg-blue-50 flex items-center justify-center text-blue-500">
                <RubyOutlined className="text-xl" />
              </div>
              <div>
                <div className="font-semibold text-base">默认 AI 模型</div>
                <div className="text-xs text-gray-400 mt-0.5">
                  {getConfigDesc('llm_model_name')}
                </div>
              </div>
            </div>
            <div className="flex items-center space-x-3 w-2/3 justify-end">
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
            </div>
          </div>

          {/* 智谱 API Key  */}
          <div className="flex items-center justify-between p-6 border-b border-gray-100 transition-colors hover:bg-gray-50/50">
            <div className="flex items-center space-x-4 w-1/3">
              <div className="w-10 h-10 rounded-full bg-indigo-50 flex items-center justify-center text-indigo-500">
                <KeyOutlined className="text-xl" />
              </div>
              <div>
                <div className="font-semibold text-base">智谱 API Key</div>
                <div className="text-xs text-gray-400 mt-0.5">
                  用于文本向量化 (Embedding)
                </div>
              </div>
            </div>
            <div className="flex items-center space-x-3 w-2/3 justify-end">
              <Input.Password
                value={getConfigValue('llm_api_key')}
                onChange={(e) =>
                  handleValueChange('llm_api_key', e.target.value)
                }
                placeholder="sk-..."
                className="max-w-md rounded-lg py-2"
              />
            </div>
          </div>

          {/* ：DeepSeek API Key  */}
          <div className="flex items-center justify-between p-6 border-b border-gray-100 transition-colors hover:bg-gray-50/50">
            <div className="flex items-center space-x-4 w-1/3">
              <div className="w-10 h-10 rounded-full bg-purple-50 flex items-center justify-center text-purple-500">
                <KeyOutlined className="text-xl" />
              </div>
              <div>
                <div className="font-semibold text-base">DeepSeek 密钥</div>
                <div className="text-xs text-gray-400 mt-0.5">
                  用于核心对话生成
                </div>
              </div>
            </div>
            <div className="flex items-center space-x-3 w-2/3 justify-end">
              <Input.Password
                value={getConfigValue('deepseek_api_key')}
                onChange={(e) =>
                  handleValueChange('deepseek_api_key', e.target.value)
                }
                placeholder="sk-..."
                className="max-w-md rounded-lg py-2"
              />
            </div>
          </div>

          {/* 大模型创造力 */}
          <div className="flex items-center justify-between p-6 transition-colors hover:bg-gray-50/50">
            <div className="flex items-center space-x-4 w-1/3">
              <div className="w-10 h-10 rounded-full bg-orange-50 flex items-center justify-center text-orange-500">
                <ControlOutlined className="text-xl" />
              </div>
              <div>
                <div className="font-semibold text-base">模型创造力</div>
                <div className="text-xs text-gray-400 mt-0.5">
                  数值越高，回答越发散 (0.1 - 1.0)
                </div>
              </div>
            </div>
            <div className="flex items-center space-x-5 w-2/3 justify-end">
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
            </div>
          </div>
        </div>
        <div className="flex items-center justify-end space-x-4 p-5 bg-gray-50 border-t border-gray-100">
          <Button
         
              shape="round" 
              size="large"
              onClick={handleCancel}
              className="text-gray-500 hover:text-gray-800">取消</Button>
          <Button
          type='primary'
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
