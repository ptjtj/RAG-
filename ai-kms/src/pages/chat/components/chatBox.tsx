import MarkdownBlock from '@/components/markdownBlock';
import { getSessionsIdMessages } from '@/services/api/huihuaguanli';
import { useChatStream,Message } from '@/hooks/useChatStream';
import { postUploadTemp } from '@/services/api/zhinengduihua';
import { getKnowledgeBases } from '@/services/api/knowledgeBase';
import {
  CheckCircleFilled,
  CheckOutlined,
  ClockCircleFilled,
  CopyOutlined,
  EditOutlined,
  FileTextOutlined,
  LoadingOutlined,
  PaperClipOutlined,
  PauseCircleOutlined,
  RobotOutlined,
  SendOutlined,
  UserOutlined,
} from '@ant-design/icons';
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
  Upload,
} from 'antd';
import { useEffect, useRef, useState } from 'react';

const { Content } = Layout;
interface ChatBoxProps {
  currentSessionId: number | null; // 接收父组件传来的当前会话 ID
  onRefreshSessions: () => void;
}
// 定义预设的快捷指令列表;
const QUICK_COMMANDS = [
  {
    icon: '📝',
    title: '总结长文',
    prompt: '请帮我提炼以下内容的三个核心要点：\n',
  },
  {
    icon: '🌐',
    title: '中英互译',
    prompt: '请将以下内容翻译为地道专业的英文：\n',
  },
  { icon: '💻', title: '代码解释', prompt: '请逐行解释以下代码的运行逻辑：\n' },
];
export default function ChatBox({
  currentSessionId,
  onRefreshSessions,
}: ChatBoxProps) {
  const [messageApi, contextHolder] = message.useMessage();
  const [inputValue, setInputValue] = useState('');
  //使用 Hook 接管所有流式状态和底层请求
  const {
    messages,
    setMessages,
    isLoading,
    sendMessage,
    continueMessage,
    stopStream,
  } = useChatStream(currentSessionId);

  const [pendingFile, setPendingFile] = useState<{
    id: string;
    name: string;
    url?: string;
  } | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [kbList, setKbList] = useState<any[]>([]);
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [selectedKbId, setSelectedKbId] = useState<number | undefined>(
    undefined,
  );
  //控制快捷菜单显示的状态;
  const [showCommands, setShowCommands] = useState(false);

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const isAtBottomRef = useRef(true);

  //获取知识库列表
  useEffect(() => {
    const fetchKbs = async () => {
      try {
        const res = await getKnowledgeBases();
        if (res.code === 200 && res.data) {
          setKbList(res.data);
        }
      } catch (error) {
        messageApi.error('获取知识库列表失败');
      }
    };
    fetchKbs();
  }, [messageApi]);

  //监听会话 ID 变化，拉取对应的聊天历史
  useEffect(() => {
    if (currentSessionId) {
      setMessages([]); // 切换会话时，先清空屏幕
      const fetchHistoryMessages = async () => {
        try {
          const res = await getSessionsIdMessages({ id: currentSessionId });
          //   console.log('前端收到的历史记录响应：', res);
          if (res.code === 200 && res.data && res.data.length > 0) {
            const historyMsgs = res.data.map((m: any) => ({
              id: m.id.toString(),
              role: m.role,
              content: m.content,
              attachedFile: m.fileId
                ? { id: m.fileId, name: m.fileName }
                : undefined,
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
  }, [currentSessionId, setMessages]);

  //  自动滚动
  const handleScroll = () => {
    if (!scrollContainerRef.current) return;
    const { scrollTop, scrollHeight, clientHeight } =
      scrollContainerRef.current;
    // 如果距离底部小于 150px，我们就认为用户在底部；否则说明用户往上滑了
    isAtBottomRef.current = scrollHeight - scrollTop - clientHeight < 150;
  };
  const scrollToBottom = () => {
    if (isAtBottomRef.current) {
      // 注意：流式高频输出时，'smooth' 会导致动画堆积卡顿，改为 'auto' 瞬间贴底会更丝滑
      messagesEndRef.current?.scrollIntoView({ behavior: 'auto' });
    }
  };
  useEffect(() => {
    scrollToBottom();
  }, [messages]);
  const handleInputChange = (e: any) => {
    const val = e.target.value;
    setInputValue(val);
    // 如果输入的刚好是一个 "/"，就触发菜单
    if (val === '/') {
      setShowCommands(true);
    } else {
      setShowCommands(false);
    }
  };
  //点击快捷指令的回调
  const handleSelectCommand = (prompt: string) => {
    setInputValue(prompt);
    setShowCommands(false);
    //让输入框重新聚焦
  };
  //极简版的发送逻辑：只管 UI(流式发送与解析引擎) 清理，其他全交给 Hook
  const handleSend = async () => {
    if (!inputValue.trim() || isLoading) return;
    isAtBottomRef.current = true;
    const userText = inputValue.trim();
    const fileSnapshot = pendingFile;
    // UI 立即响应
    setInputValue('');
    setPendingFile(null);
    //呼叫底层引擎发送
    await sendMessage(userText,selectedKbId,fileSnapshot,onRefreshSessions);
  }  
  //继续生成
  const handleContinue = async (targetMsg: Message) => {
    if (isLoading) return;
    await continueMessage(targetMsg,selectedKbId); 
  };
  const handleCopy = async (text: string, msgId: string) => {
    try {
      // 调用浏览器剪贴板 API
      await navigator.clipboard.writeText(text);
      setCopiedId(msgId);
      setTimeout(() => {
        setCopiedId(null);
      }, 2000);
    } catch (err) {
      messageApi.error('复制失败，您的浏览器可能不支持');
    }
  };
  const handleEdit = (text: string) => {
    setInputValue(text);
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
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
    <Content className="flex flex-col h-full bg-white flex-1 min-w-0 relative">
      {/*  把占位符扔进最外层 */}
      {contextHolder}
      <div className="bg-white border-b border-gray-100 p-3 shadow-sm z-10 flex items-center justify-center">
        <span className="text-gray-500 font-medium mr-3">当前挂载知识库：</span>
        <Select
          value={selectedKbId || 0}
          onChange={(val) => setSelectedKbId(val === 0 ? undefined : val)}
          variant="borderless"
          placeholder="请选择要提问的知识库（不选则为纯AI对话）"
          className="w-64 bg-gray-50 rounded-md"
          allowClear
          options={[
            { label: '不使用知识库 (纯AI对话)', value: 0 },
            ...kbList.map((kb) => ({
              label: kb.name,
              value: kb.id,
            })),
          ]}
        />
      </div>
      <div
        className="flex-1 overflow-y-auto p-4 md:p-8"
        ref={scrollContainerRef}
        onScroll={handleScroll}
      >
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
                    <div className="flex flex-col items-end gap-2">
                      {/* 如果这条消息带了附件，就渲染一个精美的文件卡片 */}
                      {msg.attachedFile && (
                        <div className="flex items-center gap-2 bg-white/80 border border-gray-200 shadow-sm rounded-lg px-3 py-2 w-fit">
                          <FileTextOutlined className="text-blue-500 text-lg" />
                          <span className="text-sm text-gray-700 max-w-[200px] truncate font-medium">
                            {msg.attachedFile.name}
                          </span>
                        </div>
                      )}

                      {/* 正常的文本消息 */}
                      {msg.content && (
                        <div className="whitespace-pre-wrap">{msg.content}</div>
                      )}
                    </div>
                  ) : (
                    <div className="flex flex-col gap-3 w-full">
                      {/* 思维链折叠面板 */}
                      {(msg.reasoning || msg.isThinking || msg.isStopped) && (
                        <Collapse
                          ghost
                          expandIconPosition="end"
                          className="bg-gray-50 border border-gray-200 rounded-xl overflow-hidden shadow-inner w-fit min-w-[300px]"
                          items={[
                            {
                              key: '1',
                              label: (
                                <div className="flex items-center gap-2 text-gray-500 font-medium text-sm">
                                  {msg.isStopped && !msg.content ? (
                                    <>
                                      <ClockCircleFilled className="text-gray-400" />
                                      <span>已停止</span>
                                    </>
                                  ) : msg.isThinking ? (
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
                            <div className="relative">
                              <MarkdownBlock content={msg.content} />
                              {/* 当处于思考中（包含继续生成等待阶段），显示动态跳动的省略号 */}
                              {msg.isThinking && (
                                <div
                                  className="inline-flex items-center gap-1 mt-2 px-3 py-1.5  border border-gray-100
                                rounded-full shadow-sm"
                                >
                                  <span
                                    className="w-1.5 h-1.5 bg-blue-500 rounded-full animate-bounce"
                                    style={{ animationDelay: '0ms' }}
                                  ></span>
                                  <span
                                    className="w-1.5 h-1.5 bg-blue-500 rounded-full animate-bounce"
                                    style={{ animationDelay: '150ms' }}
                                  ></span>
                                  <span
                                    className="w-1.5 h-1.5 bg-blue-500 rounded-full animate-bounce"
                                    style={{ animationDelay: '300ms' }}
                                  ></span>
                                </div>
                              )}
                            </div>
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
                        className="text-gray-400 hover:text-blue-500 flex items-center justify-center"
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
                        type="text"
                        size="small"
                        className="text-gray-400 hover:text-blue-500 flex items-center justify-center"
                        icon={<EditOutlined />}
                        onClick={() => handleEdit(msg.content)}
                      />
                    </Tooltip>
                  </div>
                )}
                {/* AI 消息底部的操作栏 */}
                {msg.role === 'assistant' && !msg.isThinking && msg.content && (
                  <div className="flex items-center justify-between w-full mt-1">
                    <div className="flex items-center gap-1 mr-1.5 opacity-0 group-hover:opacity-100 transition-opacity duration-300 ml-1">
                      <Tooltip title="复制全文">
                        <Button
                          type="text"
                          size="small"
                          className="text-gray-400 hover:text-blue-500 flex items-center justify-center"
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
                    </div>
                    {msg.isStopped && (
                      <Button
                        shape="round"
                        size="small"
                        className="text-gray-500 hover:text-blue-500 ml-auto bg-gray-200 shadow-sm"
                        onClick={() => handleContinue(msg)}
                      >
                        继续生成
                      </Button>
                    )}
                  </div>
                )}

                {/* AI溯源*/}
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
      <div className="w-full bg-white px-4 pb-6 pt-2">
        <div className="max-w-4xl mx-auto relative">
          {/* 快捷指令浮动菜单 */}
          {showCommands && (
            <div className="absolute bottom-full left-0 mb-3 w-64 bg-white/90 backdrop-blur-md border border-gray-100 shadow-[0_8px_30px_rgb(0,0,0,0.08)] rounded-2xl overflow-hidden z-50 animate-fade-in-up">
              <div className="px-3 py-2 text-xs font-semibold text-gray-400 bg-gray-50/50">
                快捷指令 (按 Esc 关闭)
              </div>
              <div className="p-1">
                {QUICK_COMMANDS.map((cmd, idx) => (
                  <div
                    key={idx}
                    onClick={() => handleSelectCommand(cmd.prompt)}
                    className="flex items-center gap-3 px-3 py-2.5 hover:bg-blue-50 cursor-pointer rounded-xl transition-colors text-sm text-gray-700 hover:text-blue-600"
                  >
                    <span className="text-base bg-white shadow-sm w-7 h-7 rounded-full flex items-center justify-center">
                      {cmd.icon}
                    </span>
                    <span className="font-medium">{cmd.title}</span>
                  </div>
                ))}
              </div>
            </div>
          )}
          {/*  待发送文件展示区（悬浮在输入框左上角） */}
          {pendingFile && (
            <div className="absolute bottom-full left-4 mb-2 z-10 flex items-center gap-2 bg-white/90 backdrop-blur-md border border-gray-200 shadow-sm rounded-lg px-3 py-1.5 animate-fade-in-up">
              <FileTextOutlined className="text-blue-500" />
              <span className="text-sm text-gray-700 max-w-[150px] truncate">
                {pendingFile.name}
              </span>
              <Button
                type="text"
                size="small"
                className="text-gray-400 hover:text-red-500 flex items-center justify-center -mr-2"
                icon={<span className="text-xs">✕</span>}
                onClick={() => setPendingFile(null)} // 点击叉号取消发送
              />
            </div>
          )}

          <div className="flex items-end gap-2 bg-[#f4f6f8] rounded-3xl p-2 focus-within:ring-2 focus-within:ring-blue-100 transition-all border border-transparent focus-within:border-blue-200 shadow-inner text-base">
            {/* 使用 Upload 组件接管原本的 Button */}
            <Upload
              accept=".pdf,.doc,.docx,.xls,.xlsx,.txt"
              showUploadList={false}
              customRequest={async (options) => {
                const { file, onSuccess, onError } = options;
                try {
                  setIsUploading(true);
                  const res = await postUploadTemp({}, file as File);
                  if (res && res.code === 200) {
                    onSuccess?.(res);
                  } else {
                    onError?.(new Error(res?.message || '上传失败'));
                  }
                } catch (error) {
                  onError?.(error as Error);
                }
              }}
              onChange={(info) => {
                if (info.file.status === 'done') {
                  setIsUploading(false);
                  const res = info.file.response as any;
                  if (res && res.code === 200) {
                    messageApi.success(`${info.file.name} 解析准备就绪`);
                    // 把后端返回的 fileId 存起来
                    setPendingFile({
                      id: res.data?.fileId || '',
                      name: info.file.name,
                    });
                  }
                } else if (info.file.status === 'error') {
                  setIsUploading(false);
                  messageApi.error(`${info.file.name} 上传异常`);
                }
              }}
            >
              <Tooltip title="上传文件 (PDF/Doc/Excel)">
                <Button
                  type="text"
                  shape="circle"
                  loading={isUploading}
                  icon={
                    !isUploading && (
                      <PaperClipOutlined className="text-xl text-gray-400 hover:text-blue-500 transition-colors" />
                    )
                  }
                  className="mb-1 ml-1 flex-shrink-0"
                />
              </Tooltip>
            </Upload>

            <Input.TextArea
              value={inputValue}
              onChange={handleInputChange}
              placeholder="向知识库提问，或输入 '/' 唤起快捷指令 (Shift + Enter 换行)..."
              autoSize={{ minRows: 1, maxRows: 6 }}
              variant="borderless"
              className="flex-1 bg-transparent !shadow-none resize-none px-3 py-1.5 text-base"
              onPressEnter={(e) => {
                if (!e.shiftKey) {
                  e.preventDefault();
                  // 如果菜单开着按回车，优先关闭菜单而不是发送
                  if (showCommands) {
                    setShowCommands(false);
                  } else {
                    handleSend();
                  }
                }
              }}
              // 按 Esc 关闭菜单
              onKeyDown={(e) => {
                if (e.key === 'Escape') setShowCommands(false);
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
                onClick={stopStream}
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
        </div>
        <div className="text-center text-xs text-gray-400 mt-4">
          AI 可能会产生误导性信息，请结合引用的知识库文档进行核实!
        </div>
      </div>
    </Content>
  );
}
