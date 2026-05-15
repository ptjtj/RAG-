import MarkdownBlock from '@/components/markdownBlock';
import {
  CheckCircleFilled,
  CheckOutlined,
  CopyOutlined,
  EditFilled,
  EditOutlined,
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
  Collapse,
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
  reasoning?: string; // 记录 AI 的思考过程
  isThinking?: boolean; // 是否正在思考中
  thinkingTime?: number; // 思考耗时(秒)
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
  const [copiedId, setCopiedId] = useState<string | null>(null);
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
  // 发送消息逻辑 流式发送与解析引擎
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
      {
        id: aiMsgId,
        role: 'assistant',
        content: '',
        reasoning: '',
        isThinking: true,
        thinkingTime: 0,
        sources: [],
      },
    ]);
    const startTime = Date.now();
    try {
      const token = localStorage.getItem('accessToken') || '';
      const response = await fetch('/api/v1/chat', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          message: userText,
          kbId: selectedKbId || 0,
          sessionId: currentSessionId,
        }),
        signal: abortControllerRef.current.signal, // 支持中途打断
      });
      if (!response.ok) throw new Error('网络请求异常');
      //开启流式阅读器
      const reader = response.body?.getReader();
      const decoder = new TextDecoder('utf-8');
      let currentReasoning = '';
      let currentContent = '';

      while (true) {
        const { done, value } = await reader!.read();
        if (done) break;

        // 解码二进制数据块
        const chunk = decoder.decode(value, { stream: true });
        // 按 SSE 的双换行符分割数据块
        const lines = chunk.split('\n\n');

        for (const line of lines) {
          if (line.startsWith('data: ')) {
            const dataStr = line.replace('data: ', '').trim();
            if (!dataStr) continue;

            try {
              const data = JSON.parse(dataStr);
              const costTime = Math.floor((Date.now() - startTime) / 1000);

              if (data.type === 'reasoning') {
                currentReasoning += data.content;
                setMessages((prev) =>
                  prev.map((msg) =>
                    msg.id === aiMsgId
                      ? {
                          ...msg,
                          reasoning: currentReasoning,
                          thinkingTime: costTime,
                        }
                      : msg,
                  ),
                );
              } else if (data.type === 'answer') {
                // 一旦开始输出正式内容，就说明思考结束了
                currentContent += data.content;
                setMessages((prev) =>
                  prev.map((msg) =>
                    msg.id === aiMsgId
                      ? {
                          ...msg,
                          content: currentContent,
                          isThinking: false,
                        }
                      : msg,
                  ),
                );
              } else if (data.type === 'done') {
                setMessages((prev) =>
                  prev.map((msg) =>
                    msg.id === aiMsgId
                      ? {
                          ...msg,
                          sources: data.sources || [],
                          isThinking: false,
                        }
                      : msg,
                  ),
                );
              }
            } catch (e) {}
          }
        }
      }
    } catch (error: any) {
      if (error.name === 'AbortError') {
        console.log('用户主动终止了对话');
        return;
      }
      messageApi.error('网络请求失败');
      setMessages((prev) =>
        prev.map((msg) =>
          msg.id === aiMsgId
            ? {
                ...msg,
                content:
                  '**网络错误：** 无法连接到服务器，请检查后端运行状态。',
                isThinking: false,
              }
            : msg,
        ),
      );
    } finally {
      setIsLoading(false);
      abortControllerRef.current = null;
    }
  };
  const handleCopy=async(text:string,msgId:string)=>{
    try{
      // 调用浏览器剪贴板 API
      await navigator.clipboard.writeText(text);
      setCopiedId(msgId);
      setTimeout(() => {
        setCopiedId(null);
      }, 2000);
    } catch(err){
      messageApi.error('复制失败，您的浏览器可能不支持');
    }
  };
  const handleEdit=(text:string)=>{
    setInputValue(text);
    messagesEndRef.current?.scrollIntoView({behavior:'smooth'});
  }

  // 如果左侧没有选中任何会话，显示一个占位符
  if (!currentSessionId) {
    return (
      <Content className="flex flex-col h-full bg-gray-50 flex-1 min-w-0 items-center justify-center text-gray-400">
        <p>请在左侧选择或新建一个对话</p>
      </Content>
    );
  }

  return (
    <Content className="flex flex-col h-full bg-white flex-1 min-w-0 relative">
      {/*  把占位符扔进最外层 */}
      {contextHolder}
      <div className="bg-white border-b border-gray-100 p-3 shadow-sm z-10 flex items-center justify-center">
        <span className="text-gray-500 font-medium mr-3">当前挂载知识库：</span>
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
        <div className="max-w-4xl mx-auto space-y-8">
          {messages.map((msg) => (
            <div
              key={msg.id}
              className={`flex gap-4 ${
                msg.role === 'user' ? 'flex-row-reverse' : 'flex-row'
              }`}
            >
              <Avatar
                size="large"
                className={
                  msg.role === 'user'
                    ? 'bg-blue-50 text-blue-500'
                    : 'bg-white border border-gray-200 text-blue-600'
                }
                icon={
                  msg.role === 'user' ? <UserOutlined /> : <RobotOutlined />
                }
              />
              <div
                className={`flex flex-col max-w-[85%] group ${
                  msg.role === 'user' ? 'items-end' : 'items-start'
                }`}
              >
                <div
                  className={`text-sm md:text-base leading-relaxed ${
                    msg.role === 'user'
                      ? 'bg-[#f4f6f8] text-gray-900 px-5 py-3 rounded-3xl rounded-tr-md'
                      : 'bg-transparent text-gray-900 pt-1 w-full'
                  }`}
                >
                  {msg.role === 'user' ? (
                    <div className="whitespace-pre-wrap">{msg.content}</div>
                  ) : (
                    <div className="flex flex-col gap-3 w-full">
                      {/* 思维链折叠面板 */}
                      {(msg.reasoning || msg.isThinking) && (
                        <Collapse
                          ghost
                          expandIconPosition="end"
                          className="bg-gray-50 border border-gray-200 rounded-xl overflow-hidden shadow-inner w-fit min-w-[300px]"
                          items={[
                            {
                              key: '1',
                              label: (
                                <div className="flex items-center gap-2 text-gray-500 font-medium text-sm">
                                  {msg.isThinking ? (
                                    <>
                                      <LoadingOutlined className="text-blue-500" />
                                      <span>
                                        深度思考中 ({msg.thinkingTime || 0}s)...
                                      </span>
                                    </>
                                  ) : (
                                    <>
                                      <CheckCircleFilled className="text-green-500" />
                                      <span>
                                        已深度思考 (用时 {msg.thinkingTime || 0}{' '}
                                        秒)
                                      </span>
                                    </>
                                  )}
                                </div>
                              ),
                              children: (
                                <div className="text-sm text-gray-400 font-mono whitespace-pre-wrap border-t border-gray-200 pt-3 opacity-80 leading-relaxed border-l-2 border-l-blue-400 pl-3 ml-1 max-h-96 overflow-y-auto">
                                  {msg.reasoning}
                                </div>
                              ),
                            },
                          ]}
                        />
                      )}

                      {/*  正式回答输出区 */}
                      {(msg.content || !msg.isThinking) && (
                        <div className="prose prose-blue max-w-none text-gray-900 mt-2">
                          {msg.content ? (
                            <MarkdownBlock content={msg.content} />
                          ) : (
                            <span className="opacity-0">占位</span> // 保持高度不跳动
                          )}
                        </div>
                      )}
                    </div>
                  )}
                </div>
                {/* 用户消息底部的操作栏 */}
                {msg.role === 'user' && (
                  <div className="flex items-center gap-1 mt-1.5 opacity-0 group-hover:opacity-100 transition-opacity duration-300 mr-2">
                    <Tooltip title="复制">
                      <Button
                        type="text"
                        size="small"
                        className="text-gray-400 hover:text-blue-500 flex items-center justify-center "
                        // 如果当前 msgId 等于刚复制的 ID，就显示绿色的勾
                        icon={
                          copiedId === msg.id ? (
                            <CheckOutlined className="text-green-500" />
                          ) : (
                            <CopyOutlined />
                          )
                        }
                        onClick={() => handleCopy(msg.content, msg.id)}
                      />
                    </Tooltip>
                    <Tooltip title="编辑">
                      <Button 
                      type='text'
                      size='small'
                      className='text-gray-400 hover:text-blue-500 flex items-center justify-center'
                      icon={<EditOutlined/>}
                      onClick={()=>handleEdit(msg.content)}
                      />
                    </Tooltip>
                  </div>
                )}

                {msg.role === 'assistant' &&
                  msg.sources &&
                  msg.sources.length > 0 && (
                    <div className="mt-3 flex flex-wrap gap-2">
                      {msg.sources.map((source, idx) => (
                        <Tooltip
                          key={idx}
                          title={`相关度匹配分: ${(source.score * 100).toFixed(
                            0,
                          )}%`}
                        >
                          <Tag
                            icon={<FileTextOutlined />}
                            className="bg-gray-50 border-gray-200 text-gray-500 cursor-pointer hover:text-blue-500 transition-colors m-0 rounded-md"
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

      <div className="bg-white  p-4 pb-8">
        <div className="max-w-4xl mx-auto flex items-end gap-3 bg-[#f4f6f8] rounded-3xl p-2.5 focus-within:ring-2 focus-within:ring-blue-100 transition-all">
          <Input.TextArea
            value={inputValue}
            onChange={(e) => setInputValue(e.target.value)}
            placeholder="向知识库提问 (Shift + Enter 换行)..."
            autoSize={{ minRows: 1, maxRows: 6 }}
            variant="borderless"
            className="flex-1 bg-transparent !shadow-none resize-none px-3 py-1.5 text-base"
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
              className="mb-1 flex-shrink-0 bg-white border-none shadow-sm text-gray-600"
              icon={<PauseCircleOutlined />}
              onClick={handleStop}
            />
          ) : (
            <Button
              type="primary"
              shape="circle"
              size="large"
              className="bg-blue-600 mb-1 flex-shrink-0"
              icon={<SendOutlined />}
              disabled={!inputValue.trim()}
              onClick={handleSend}
            />
          )}
        </div>
        <div className="text-center text-xs text-gray-400 mt-4">
          AI 可能会产生误导性信息，请结合引用的知识库文档进行核实!
        </div>
      </div>
    </Content>
  );
}
