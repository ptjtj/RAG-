import MarkdownBlock from '@/components/markdownBlock';
import {
  FileTextOutlined,
  LoadingOutlined,
  PauseCircleOutlined,
  RobotOutlined,
  SendOutlined,
  UserOutlined,
} from '@ant-design/icons';
import { request } from '@umijs/max';
import {
  Avatar,
  Button,
  Input,
  Layout,
  message,
  Select,
  Tag,
  Tooltip,
} from 'antd';
import { useEffect, useRef, useState } from 'react';

const { Content } = Layout;

interface Message {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  sources?: { title: string; score: number }[];
}

interface ChatBoxProps {
  currentSessionId: number | null; // 接收父组件传来的当前会话 ID
  onRefreshSessions: () => void;
}

export default function ChatBox({
  currentSessionId,
  onRefreshSessions,
}: ChatBoxProps) {
    const [messageApi, contextHolder] = message.useMessage();
  const [inputValue, setInputValue] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const [kbList, setKbList] = useState<any[]>([]);
  const [selectedKbId, setSelectedKbId] = useState<number | undefined>(
    undefined,
  );
  const [messages, setMessages] = useState<Message[]>([]);
  // 用来掐断网络请求
  const abortControllerRef = useRef<AbortController | null>(null);
  const isStoppingRef = useRef<boolean>(false); // 标记是否强制停止打字机逻辑

  //获取知识库列表 (原生逻辑)
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
        messageApi.error('获取知识库列表失败');
      }
    };
    fetchKbs();
  }, []);

  //监听会话 ID 变化，拉取对应的聊天历史
  useEffect(() => {
    if (currentSessionId) {
      setMessages([]); // 切换会话时，先清空屏幕
      const fetchHistoryMessages = async () => {
        try {
          const res = await request(`/sessions/${currentSessionId}/messages`, {
            method: 'GET',
          });
          //   console.log('前端收到的历史记录响应：', res);
          if (res.code === 200 && res.data && res.data.length > 0) {
            const historyMsgs = res.data.map((m: any) => ({
              id: m.id.toString(),
              role: m.role,
              content: m.content,
            }));
            setMessages(historyMsgs);
          } else {
            // 如果是空会话，显示你的原生欢迎语
            setMessages([
              {
                id: `welcome-${currentSessionId}`,
                role: 'assistant',
                content: `你好！我是你的专属 AI 知识库助手。向我提问吧，看看我的实力如何！`,
              },
            ]);
          }
        } catch (error) {
          // 容错处理
        }
      };
      fetchHistoryMessages();
    }
  }, [currentSessionId]);

  //  自动滚动 (原生逻辑)
  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };
  useEffect(() => {
    scrollToBottom();
  }, [messages]);
  //会话停止
  const handleStop = () => {
    isStoppingRef.current = true;
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }
    setIsLoading(false);
  };
  // 发送消息逻辑 (原生逻辑，只增加了一个 sessionId 传参)
  const handleSend = async () => {
    if (!inputValue.trim() || isLoading) return;
    isStoppingRef.current = false;
    abortControllerRef.current = new AbortController();

    const userText = inputValue.trim();
    setInputValue('');
    setIsLoading(true);

    const newUserMsg: Message = {
      id: Date.now().toString(),
      role: 'user',
      content: userText,
    };
    setMessages((prev) => [...prev, newUserMsg]);

    const aiMsgId = (Date.now() + 1).toString();
    setMessages((prev) => [
      ...prev,
      { id: aiMsgId, role: 'assistant', content: '', sources: [] },
    ]);

    try {
      // 开发者彩蛋
      if (userText.startsWith('/embed')) {
        const textToEmbed = userText.replace('/embed', '');
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
          setTimeout(() => {
            if (onRefreshSessions) {
              onRefreshSessions();
            }
          }, 3000);
        } else {
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
        data: {
          message: userText,
          kbId: selectedKbId || 0,
          sessionId: currentSessionId,
        },
        signal: abortControllerRef.current.signal,
      });
      if (res.code === 200) {
        const realResponseText = res.data.text;
        const realSources = res.data.sources || [];
        let currentText = '';
        const textArray = realResponseText.split('');
        for (let i = 0; i < textArray.length; i++) {
          if (isStoppingRef.current) break;
          await new Promise((resolve) => setTimeout(resolve, 20));
          currentText += textArray[i];
          setMessages((prev) =>
            prev.map((msg) =>
              msg.id === aiMsgId ? { ...msg, content: currentText } : msg,
            ),
          );
        }
        if (!isStoppingRef.current && realSources.length > 0) {
          setMessages((prev) =>
            prev.map((msg) =>
              msg.id === aiMsgId ? { ...msg, sources: realSources } : msg,
            ),
          );
        }
      } else {
        setMessages((prev) =>
          prev.map((msg) =>
            msg.id === aiMsgId
              ? { ...msg, content: `**AI 思考时出错了：** ${res.message}` }
              : msg,
          ),
        );
      }
    } catch (error: any) {
      if (error.name === 'AbortError' || error.type === 'abort') {
        console.log('用户主动终止了 AI 回答');
        return; // 主动打断不是真报错，直接退出
      }
      messageApi.error('网络请求失败，请检查后端服务是否启动');
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
      abortControllerRef.current = null;
    }
  };

  // 如果左侧没有选中任何会话，显示一个占位符
  if (!currentSessionId) {
    return (
      <Content className="flex flex-col h-full bg-gray-50 flex-1 min-w-0 items-center justify-center text-gray-400">
        <p>请在左侧选择或新建一个对话</p>
      </Content>
    );
  }

  return (
    <Content className="flex flex-col h-full bg-gray-50 flex-1 min-w-0 relative">
      {/*  把占位符扔进最外层 */}
      {contextHolder}
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
      <div className="flex-1 overflow-y-auto p-4 md:p-8">
        <div className="max-w-4xl mx-auto space-y-6">
          {messages.map((msg) => (
            <div
              key={msg.id}
              className={`flex gap-4 ${
                msg.role === 'user' ? 'flex-row-reverse' : 'flex-row'
              }`}
            >
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
          <div ref={messagesEndRef} />
        </div>
      </div>

      <div className="bg-white border-t border-gray-200 p-4 pb-8">
        <div className="max-w-4xl mx-auto flex items-end gap-3 bg-gray-50 border border-gray-200 rounded-2xl p-2 focus-within:ring-2 focus-within:ring-blue-100 focus-within:border-blue-400 transition-all">
          <Input.TextArea
            value={inputValue}
            onChange={(e) => setInputValue(e.target.value)}
            placeholder="向知识库提问 (Shift + Enter 换行)..."
            autoSize={{ minRows: 1, maxRows: 5 }}
            variant="borderless"
            className="flex-1 bg-transparent !shadow-none resize-none px-2 py-1"
            onPressEnter={(e) => {
              if (!e.shiftKey) {
                e.preventDefault();
                handleSend();
              }
            }}
          />
          {isLoading ? (
            <Button
              type="primary"
              danger
              shape="circle"
              size="large"
              className="mb-0.5 flex-shrink-0"
              icon={<PauseCircleOutlined />}
              onClick={handleStop}
            />
          ) : (
            <Button
              type="primary"
              shape="circle"
              size="large"
              className="bg-blue-600 mb-0.5 flex-shrink-0"
              icon={<SendOutlined />}
              disabled={!inputValue.trim()}
            />
          )}
        </div>
        <div className="text-center text-xs text-gray-400 mt-3">
          AI 可能会产生误导性信息，请结合引用的知识库文档进行核实!
        </div>
      </div>
    </Content>
  );
}
