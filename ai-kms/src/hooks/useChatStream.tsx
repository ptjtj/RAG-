import { useState, useRef } from 'react';
import { message } from 'antd';

//  将 Message 接口统一维护在这里并导出给组件用
export interface Message {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  reasoning?: string;
  isThinking?: boolean;
  thinkingTime?: number;
  isStopped?: boolean;
  sources?: { title: string; score: number }[];
  attachedFile?: { id: string; name: string };
  createdAt?: string; // 兼容后端返回的历史记录时间
}

interface StreamParams {
  fetchBody: any;
  targetMsgId: string;
  startTime: number;
  initialReasoning?: string;
  initialContent?: string;
}

export function useChatStream(currentSessionId: number | null) {
  const [messages, setMessages] = useState<Message[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const abortControllerRef = useRef<AbortController | null>(null);

  // 停止生成的逻辑
  const stopStream = () => {
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }
    setIsLoading(false);
  };

  // 抽取出来的通用 SSE 流式解析方法
  const processStream = async ({
    fetchBody,
    targetMsgId,
    startTime,
    initialReasoning = '',
    initialContent = '',
  }: StreamParams) => {
    abortControllerRef.current = new AbortController();
    setIsLoading(true);

    try {
      const token = localStorage.getItem('accessToken') || '';
      const response = await fetch('/api/v1/chat', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(fetchBody),
        signal: abortControllerRef.current.signal,
      });

      if (!response.ok) throw new Error('网络请求异常');

      const reader = response.body?.getReader();
      const decoder = new TextDecoder('utf-8');

      let currentReasoning = initialReasoning;
      let currentContent = initialContent;
      let buffer = '';

      while (true) {
        const { done, value } = await reader!.read();
        if (done) break;

        buffer += decoder.decode(value, { stream: true });
        let lineEndIdx;

        while ((lineEndIdx = buffer.indexOf('\n')) !== -1) {
          const line = buffer.slice(0, lineEndIdx).trim();
          buffer = buffer.slice(lineEndIdx + 1);

          if (line.startsWith('data: ')) {
            const dataStr = line.replace('data:', '').trim();
            if (!dataStr) continue;

            try {
              const data = JSON.parse(dataStr);
              const costTime = Math.floor((Date.now() - startTime) / 1000);

              if (data.type === 'reasoning') {
                currentReasoning += data.content;
                setMessages((prev) =>
                  prev.map((msg) =>
                    msg.id === targetMsgId
                      ? {
                          ...msg,
                          reasoning: currentReasoning,
                          thinkingTime: costTime,
                        }
                      : msg,
                  ),
                );
              } else if (data.type === 'answer') {
                currentContent += data.content;
                setMessages((prev) =>
                  prev.map((msg) =>
                    msg.id === targetMsgId
                      ? { ...msg, content: currentContent, isThinking: false }
                      : msg,
                  ),
                );
              } else if (data.type === 'done') {
                setMessages((prev) =>
                  prev.map((msg) =>
                    msg.id === targetMsgId
                      ? {
                          ...msg,
                          sources: data.sources || [],
                          isThinking: false,
                        }
                      : msg,
                  ),
                );
              }
            } catch (e) {
              console.error('SSE 行解析失败:', e, line);
            }
          }
        }
      }
    } catch (error: any) {
      if (error.name === 'AbortError') {
        console.log('用户主动终止了对话');
        setMessages((prev) =>
          prev.map((msg) =>
            msg.id === targetMsgId
              ? { ...msg, isThinking: false, isStopped: true }
              : msg,
          ),
        );
        throw new Error('Aborted'); // 抛出异常让外层知道被打断了
      }
      message.error('网络请求失败');
      setMessages((prev) =>
        prev.map((msg) =>
          msg.id === targetMsgId
            ? {
                ...msg,
                content: '**网络错误：** 无法连接到服务器。',
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

  //  发送新消息
  const sendMessage = async (
    userText: string,
    selectedKbId: number | undefined,
    pendingFile: { id: string; name: string } | null,
    onRefreshSessions?: () => void,
  ) => {
    if (!currentSessionId) return;

    // 构建用户消息 UI
    const uiAttachedFile = pendingFile
      ? { id: pendingFile.id, name: pendingFile.name }
      : undefined;
    const newUserMsg: Message = {
      id: Date.now().toString(),
      role: 'user',
      content: userText,
      attachedFile: uiAttachedFile,
    };

    const aiMsgId = (Date.now() + 1).toString();
    const newAiMsg: Message = {
      id: aiMsgId,
      role: 'assistant',
      content: '',
      reasoning: '',
      isThinking: true,
      thinkingTime: 0,
      sources: [],
    };

    setMessages((prev) => [...prev, newUserMsg, newAiMsg]);

    const fetchBody = {
      message: userText,
      kbId: selectedKbId || 0,
      sessionId: currentSessionId,
      tempFileId: pendingFile?.id || '',
      tempFileName: pendingFile?.name || '',
    };

    try {
      await processStream({
        fetchBody,
        targetMsgId: aiMsgId,
        startTime: Date.now(),
      });
      // 发送成功后刷新左侧会话列表（例如更新自动生成的标题）
      if (onRefreshSessions) {
        setTimeout(onRefreshSessions, 2000);
      }
    } catch (e) {
      // 这里的捕获主要是为了拦截 AbortError，不需要额外处理
    }
  };

  //  继续生成
  const continueMessage = async (
    targetMsg: Message,
    selectedKbId: number | undefined,
  ) => {
    if (!currentSessionId) return;

    // 找到这条 AI 消息对应的上一条用户提问
    const msgIndex = messages.findIndex((m) => m.id === targetMsg.id);
    const userMsg = messages[msgIndex - 1];

    // 恢复思考状态 UI
    setMessages((prev) =>
      prev.map((msg) =>
        msg.id === targetMsg.id
          ? { ...msg, isStopped: false, isThinking: true }
          : msg,
      ),
    );

    const fetchBody = {
      message: userMsg?.content || '',
      kbId: selectedKbId || 0,
      sessionId: currentSessionId,
      isContinue: true,
      partialContent: targetMsg.content,
      tempFileId: userMsg?.attachedFile?.id || '',
      tempFileName: userMsg?.attachedFile?.name || '',
    };

    try {
      await processStream({
        fetchBody,
        targetMsgId: targetMsg.id,
        startTime: Date.now(), // 注意：继续生成时如果需要重置思考时间，可用此 startTime
        initialReasoning: targetMsg.reasoning || '',
        initialContent: targetMsg.content || '',
      });
    } catch (e) {
      // 拦截 AbortError
    }
  };

  return {
    messages,
    setMessages,
    isLoading,
    sendMessage,
    continueMessage,
    stopStream,
  };
}