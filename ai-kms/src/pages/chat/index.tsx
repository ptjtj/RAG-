import MarkdownBlock from '@/components/markdownBlock';
import {
  FileTextOutlined,
  LoadingOutlined,
  RobotOutlined,
  SendOutlined,
  UserOutlined,
} from '@ant-design/icons';
import { request } from '@umijs/max';
import { Avatar, Button, Input, message, Select,Tag,Tooltip } from 'antd';
import { useEffect, useRef, useState } from 'react';

// 定义消息的类型规范
interface Message {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  sources?: { title: string; score: number }[]; // RAG 特有的引用来源
}

export default function Chat() {
  const [inputValue, setInputValue] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  //知识库状态
  const [kbList, setKbList] = useState<any[]>([]);
  const [selectedKbId, setSelectedKbId] = useState<number | undefined>(
    undefined,
  );

  useEffect(() => {
    const fetchKbs = async () => {
      try {
        const res = await request('/kb', { method: 'GET' });
        if (res.code === 200 && res.data) {
          setKbList(res.data);
          if (res.data.length > 0) {
            setSelectedKbId(res.data[0].id);
          }
        }
      } catch (error) {
        message.error('获取知识库列表失败');
      }
    };
    fetchKbs();
  }, []);
  // 初始欢迎消息
  const [messages, setMessages] = useState<Message[]>([
    {
      id: 'welcome-1',
      role: 'assistant',
      content:
        '你好！我是你的专属 AI 知识库助手。向我提问吧，看看我的实力如何！',
    },
  ]);

  // 自动滚动到最新消息
  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  // 模拟发送消息与 SSE 流式接收
  const handleSend = async () => {
    if (!inputValue.trim() || isLoading) return;
    const userText = inputValue.trim();
    setInputValue('');
    setIsLoading(true);

    //  立即将用户的问题上屏
    const newUserMsg: Message = {
      id: Date.now().toString(),
      role: 'user',
      content: userText,
    };
    setMessages((prev) => [...prev, newUserMsg]);

    //  准备一个空的 AI 回复气泡上屏
    const aiMsgId = (Date.now() + 1).toString();
    setMessages((prev) => [
      ...prev,
      { id: aiMsgId, role: 'assistant', content: '', sources: [] },
    ]);
    try {
      //开发者彩蛋
      if (userText.startsWith('/embed')) {
        const textToEmbed = userText.replace('/embed', '');

        //调用测试接口
        const res = await request('/test-embedding', {
          method: 'POST',
          data: { text: textToEmbed },
        });
        if (res.code === 200) {
         const previewArray = res.data.preview;
         const dim = res.data.dimensions;
         const prettyStr = `**🔥 成功提取数字指纹！**\n\n> 智谱大模型认为这句话的维度是：**${dim} 维**\n\n为了不闪瞎你的眼睛，这里只展示前 10 个维度的坐标：\n\`\`\`json\n[\n  ${previewArray.join(
           ',\n  ',
         )}\n  ... (还有 ${dim - 10} 个数字)\n]\n\`\`\``;
         setMessages((prev) =>
           prev.map((msg) =>
             msg.id === aiMsgId ? { ...msg, content: prettyStr } : msg,
           ),
         );
        }
        else {
          setMessages((prev) =>
            prev.map((msg) =>
              msg.id === aiMsgId
                ? { ...msg, content: `获取失败：${res.message}` }
                : msg,
            ),
          );
        }
        setIsLoading(false);
        return;
      }

      const res = await request('/chat', {
        method: 'POST',
        data: { message: userText, kbId: selectedKbId || 0 },
      });
      if (res.code === 200) {
        // 拿到真实的 AI 回答
    const realResponseText = res.data.text;
    const realSources = res.data.sources || [];

    let currentText = '';
    const textArray = realResponseText.split('');
    for (let i = 0; i < textArray.length; i++) {
      await new Promise((resolve) => setTimeout(resolve, 20));
      currentText += textArray[i];
      setMessages((prev) =>
        prev.map((msg) =>
          msg.id === aiMsgId ? { ...msg, content: currentText } : msg,
        ),
      );
    }

    // 打字结束后，挂载来源标签
    if (realSources.length > 0) {
      setMessages((prev) =>
        prev.map((msg) =>
          msg.id === aiMsgId ? { ...msg, sources: realSources } : msg,
        ),
      );
    }
      } else {
        // 后端返回错误
        setMessages((prev) =>
          prev.map((msg) =>
            msg.id === aiMsgId
              ? { ...msg, content: `**AI 思考时出错了：** ${res.message}` }
              : msg,
          ),
        );
      }
    } catch (error) {
      // 网络断开或后端没启动
      message.error('网络请求失败，请检查后端服务是否启动');
      setMessages((prev) =>
        prev.map((msg) =>
          msg.id === aiMsgId
            ? {
                ...msg,
                content: `**网络错误：** 无法连接到服务器，请检查 Go 后端是否运行在 8080 端口。`,
              }
            : msg,
        ),
      );
    } finally {
      setIsLoading(false);
    }
  };

  return (
    // 使用 h-[calc(100vh-Header高度)] 确保聊天窗口充满屏幕且不产生外层滚动条
    <div className="flex flex-col h-[calc(100vh-64px)] bg-gray-50">
      <div className="bg-white border-b border-gray-200 p-3 shadow-sm z-10 flex items-center justify-center">
        <span className="text-gray-600 font-medium mr-3">当前挂载知识库：</span>
        <Select
          value={selectedKbId}
          onChange={(val) => setSelectedKbId(val)}
          placeholder="请选择要提问的知识库（不选则为纯AI对话）"
          className="w-64"
          allowClear
          options={kbList.map((kb) => ({
            label: kb.name,
            value: kb.id,
          }))}
        />
      </div>
      {/* 聊天消息流区域 */}
      <div className="flex-1 overflow-y-auto p-4 md:p-8">
        <div className="max-w-4xl mx-auto space-y-6">
          {messages.map((msg) => (
            <div
              key={msg.id}
              className={`flex gap-4 ${
                msg.role === 'user' ? 'flex-row-reverse' : 'flex-row'
              }`}
            >
              {/* 头像 */}
              <Avatar
                className={
                  msg.role === 'user'
                    ? 'bg-blue-600'
                    : 'bg-gradient-to-br from-green-400 to-blue-500'
                }
                icon={
                  msg.role === 'user' ? <UserOutlined /> : <RobotOutlined />
                }
              />
              {/* 消息气泡容器 */}
              <div
                className={`flex flex-col max-w-[80%] ${
                  msg.role === 'user' ? 'items-end' : 'items-start'
                }`}
              >
                <div
                  className={`px-5 py-3 rounded-2xl shadow-sm text-sm md:text-base leading-relaxed ${
                    msg.role === 'user'
                      ? 'bg-blue-500 text-white rounded-tr-none'
                      : 'bg-white border border-gray-100 text-gray-800 rounded-tl-none'
                  }`}
                >
                  {msg.content ? (
                    msg.role === 'user' ? (
                      <div className="whitespace-pre-wrap font-medium">
                        {msg.content}
                      </div>
                    ) : (
                      // AI 消息：使用 Markdown 渲染
                      <MarkdownBlock content={msg.content} />
                    )
                  ) : (
                    isLoading &&
                    msg.role === 'assistant' && (
                      <div className="p-1">
                        <LoadingOutlined className="text-blue-500" />{' '}
                        检索记忆中...
                      </div>
                    )
                  )}
                </div>
                {msg.role === 'assistant' &&
                  msg.sources &&
                  msg.sources.length > 0 && (
                    <div className="mt-2 flex flex-wrap gap-2">
                      {msg.sources.map((source, idx) => (
                        <Tooltip
                          key={idx}
                          title={`相关度匹配分: ${(source.score * 100).toFixed(
                            0,
                          )}%`}
                        >
                          <Tag
                            icon={<FileTextOutlined />}
                            className="bg-white border-dashed border-gray-300 text-gray-500 cursor-pointer hover:text-blue-500 hover:border-blue-400 transition-colors m-0"
                          >
                            {source.title}
                          </Tag>
                        </Tooltip>
                      ))}
                    </div>
                  )}
              </div>
            </div>
          ))}
          {/* 用于自动滚动的锚点 */}
          <div ref={messagesEndRef} />
        </div>
      </div>

      {/* 底部输入框区域 */}
      <div className="bg-white border-t border-gray-200 p-4 pb-8">
        <div className="max-w-4xl mx-auto flex items-end gap-3 bg-gray-50 border border-gray-200 rounded-2xl p-2 focus-within:ring-2 focus-within:ring-blue-100 focus-within:border-blue-400 transition-all">
          <Input.TextArea
            value={inputValue}
            onChange={(e) => setInputValue(e.target.value)}
            placeholder="向知识库提问 (Shift + Enter 换行)..."
            autoSize={{ minRows: 1, maxRows: 5 }}
            bordered={false}
            className="flex-1 bg-transparent !shadow-none resize-none px-2 py-1"
            onPressEnter={(e) => {
              if (!e.shiftKey) {
                e.preventDefault(); // 阻止默认换行
                handleSend();
              }
            }}
          />
          <Button
            type="primary"
            shape="circle"
            size="large"
            className="bg-blue-600 mb-0.5 flex-shrink-0"
            icon={<SendOutlined />}
            onClick={handleSend}
            disabled={!inputValue.trim() || isLoading}
            loading={isLoading}
          />
        </div>
        <div className="text-center text-xs text-gray-400 mt-3">
          AI 可能会产生误导性信息，请结合引用的知识库文档进行核实!
        </div>
      </div>
    </div>
  );
}
