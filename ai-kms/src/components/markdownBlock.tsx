// src/components/MarkdownBlock.tsx
import ReactMarkdown from 'react-markdown';
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter';
import remarkGfm from 'remark-gfm';
// 引入 VS Code 深色主题，你也可以换成 oneDark 等其他主题
import { vscDarkPlus } from 'react-syntax-highlighter/dist/esm/styles/prism';

interface MarkdownBlockProps {
  content: string;
}

export default function MarkdownBlock({ content }: MarkdownBlockProps) {
  return (
    // 使用 Tailwind 的 prose 类，一键实现完美的行高、边距和字体排布
    <div className="prose prose-sm md:prose-base prose-blue max-w-none dark:prose-invert">
      <ReactMarkdown
        remarkPlugins={[remarkGfm]}
        components={{
          // 拦截 <code> 标签，根据是否有语言标志来判断是代码块还是内联代码
          code({ node, inline, className, children, ...props }: any) {
            const match = /language-(\w+)/.exec(className || '');

            return !inline && match ? (
              // 匹配到语言，说明是多行代码块，应用高亮
              <SyntaxHighlighter
                {...props}
                style={vscDarkPlus}
                language={match[1]}
                PreTag="div"
                className="rounded-md my-4 shadow-sm text-sm"
              >
                {String(children).replace(/\n$/, '')}
              </SyntaxHighlighter>
            ) : (
              // 没有匹配到语言，说明是普通的内联代码 (如 `const a = 1`)
              <code
                className="bg-gray-100 text-pink-600 px-1.5 py-0.5 rounded text-sm font-mono mx-1"
                {...props}
              >
                {children}
              </code>
            );
          },
          // 稍微美化一下链接的样式
          a: ({ node, ...props }) => (
            <a
              {...props}
              target="_blank"
              rel="noopener noreferrer"
              className="text-blue-600 hover:underline"
            />
          ),
        }}
      >
        {content}
      </ReactMarkdown>
    </div>
  );
}
