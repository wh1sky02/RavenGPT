'use client';

import React, { useState, useCallback, useEffect } from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { Message } from '@/lib/types';
import {
    Copy, Check, ChevronDown, ChevronUp, ExternalLink,
    User, Bot, Edit2, RefreshCw, Wrench, Clock, Zap
} from 'lucide-react';
import Image from 'next/image';

interface MessageBubbleProps {
    message: Message;
    onEdit?: (messageId: string, newContent: string) => void;
    onRegenerate?: (messageId: string) => void;
    showTimestamp?: boolean;
    showModel?: boolean;
    isLoading?: boolean;
    isLast?: boolean;
}

// Code block with copy button
const CodeBlock = ({ language, children }: { language?: string; children: string }) => {
    const [copied, setCopied] = useState(false);

    const handleCopy = useCallback(() => {
        navigator.clipboard.writeText(children).then(() => {
            setCopied(true);
            setTimeout(() => setCopied(false), 2000);
        });
    }, [children]);

    return (
        <div className="relative group my-3 rounded-lg overflow-hidden border border-gray-200 dark:border-dark-700">
            <div className="flex items-center justify-between px-4 py-2 bg-gray-100 dark:bg-dark-800 border-b border-gray-200 dark:border-dark-700">
                <span className="text-xs font-mono text-gray-500 dark:text-dark-400">
                    {language || 'code'}
                </span>
                <button
                    onClick={handleCopy}
                    className="flex items-center gap-1.5 text-xs text-gray-500 dark:text-dark-400 hover:text-gray-800 dark:hover:text-dark-100 transition-colors"
                >
                    {copied ? (
                        <><Check className="w-3.5 h-3.5 text-green-500" /><span className="text-green-500">Copied!</span></>
                    ) : (
                        <><Copy className="w-3.5 h-3.5" /><span>Copy</span></>
                    )}
                </button>
            </div>
            <pre className="overflow-x-auto p-4 bg-gray-50 dark:bg-dark-900 text-sm">
                <code className={`language-${language || 'text'} text-gray-800 dark:text-dark-100 font-mono`}>
                    {children}
                </code>
            </pre>
        </div>
    );
};

// Reasoning section (collapsible)
const ReasoningSection = ({ reasoning }: { reasoning: string }) => {
    const [expanded, setExpanded] = useState(false);

    return (
        <div className="mb-3 border border-purple-200 dark:border-purple-800 rounded-lg overflow-hidden">
            <button
                onClick={() => setExpanded(!expanded)}
                className="w-full flex items-center justify-between px-4 py-2.5 bg-purple-50 dark:bg-purple-900/20 text-purple-700 dark:text-purple-300 hover:bg-purple-100 dark:hover:bg-purple-900/30 transition-colors text-sm font-medium"
            >
                <div className="flex items-center gap-2">
                    <Zap className="w-4 h-4" />
                    <span>Reasoning Process</span>
                </div>
                {expanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
            </button>
            {expanded && (
                <div className="p-4 bg-purple-50/50 dark:bg-purple-900/10 text-sm text-gray-700 dark:text-dark-300 whitespace-pre-wrap font-mono text-xs leading-relaxed max-h-64 overflow-y-auto">
                    {reasoning}
                </div>
            )}
        </div>
    );
};

// Citations section
const CitationsSection = ({ citations }: { citations: NonNullable<Message['citations']> }) => {
    const [expanded, setExpanded] = useState(true);

    return (
        <div className="mt-3 border border-blue-200 dark:border-blue-800 rounded-lg overflow-hidden">
            <button
                onClick={() => setExpanded(!expanded)}
                className="w-full flex items-center justify-between px-4 py-2.5 bg-blue-50 dark:bg-blue-900/20 text-blue-700 dark:text-blue-300 hover:bg-blue-100 dark:hover:bg-blue-900/30 transition-colors text-sm font-medium"
            >
                <span>Sources ({citations.length})</span>
                {expanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
            </button>
            {expanded && (
                <div className="p-3 space-y-2">
                    {citations.map((citation, i) => (
                        <a
                            key={i}
                            href={citation.url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="flex items-start gap-2 p-2 rounded hover:bg-blue-50 dark:hover:bg-blue-900/20 transition-colors group"
                        >
                            <span className="flex-shrink-0 w-5 h-5 rounded-full bg-blue-100 dark:bg-blue-900/40 text-blue-600 dark:text-blue-400 text-xs flex items-center justify-center font-medium">
                                {i + 1}
                            </span>
                            <div className="flex-1 min-w-0">
                                <div className="text-sm text-blue-700 dark:text-blue-300 font-medium truncate group-hover:underline">
                                    {citation.title}
                                </div>
                                <div className="text-xs text-gray-500 dark:text-dark-400 truncate">
                                    {citation.url}
                                </div>
                            </div>
                            <ExternalLink className="w-3.5 h-3.5 text-gray-400 flex-shrink-0 mt-0.5" />
                        </a>
                    ))}
                </div>
            )}
        </div>
    );
};

// Tool results section
const ToolResultsSection = ({ toolCalls, toolResults }: {
    toolCalls?: Message['toolCalls'];
    toolResults?: Message['toolResults'];
}) => {
    const [expanded, setExpanded] = useState(false);

    if (!toolCalls || toolCalls.length === 0) return null;

    return (
        <div className="mb-3 border border-orange-200 dark:border-orange-800 rounded-lg overflow-hidden">
            <button
                onClick={() => setExpanded(!expanded)}
                className="w-full flex items-center justify-between px-4 py-2.5 bg-orange-50 dark:bg-orange-900/20 text-orange-700 dark:text-orange-300 hover:bg-orange-100 dark:hover:bg-orange-900/30 transition-colors text-sm font-medium"
            >
                <div className="flex items-center gap-2">
                    <Wrench className="w-4 h-4" />
                    <span>Tool Calls ({toolCalls.length})</span>
                </div>
                {expanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
            </button>
            {expanded && (
                <div className="p-3 space-y-3">
                    {toolCalls.map((call) => {
                        const result = toolResults?.find(r => r.tool_call_id === call.id);
                        let args: Record<string, unknown> = {};
                        try { args = JSON.parse(call.function.arguments); } catch { /* */ }

                        return (
                            <div key={call.id} className="bg-orange-50/50 dark:bg-orange-900/10 rounded p-3">
                                <div className="flex items-center gap-2 mb-2">
                                    <code className="text-xs font-bold text-orange-700 dark:text-orange-300">
                                        {call.function.name}
                                    </code>
                                </div>
                                <div className="text-xs font-mono text-gray-600 dark:text-dark-400 mb-2">
                                    <strong>Args:</strong> {JSON.stringify(args, null, 2)}
                                </div>
                                {result && (
                                    <div className="text-xs font-mono text-green-700 dark:text-green-300 bg-green-50 dark:bg-green-900/20 rounded p-2 mt-1">
                                        <strong>Result:</strong> {result.content}
                                    </div>
                                )}
                            </div>
                        );
                    })}
                </div>
            )}
        </div>
    );
};

// MCP results section
const MCPResultsSection = ({ mcpResults }: { mcpResults: NonNullable<Message['mcpResults']> }) => {
    const [expanded, setExpanded] = useState(false);

    return (
        <div className="mb-3 border border-teal-200 dark:border-teal-800 rounded-lg overflow-hidden">
            <button
                onClick={() => setExpanded(!expanded)}
                className="w-full flex items-center justify-between px-4 py-2.5 bg-teal-50 dark:bg-teal-900/20 text-teal-700 dark:text-teal-300 hover:bg-teal-100 dark:hover:bg-teal-900/30 transition-colors text-sm font-medium"
            >
                <div className="flex items-center gap-2">
                    <Zap className="w-4 h-4" />
                    <span>MCP Tool Results ({mcpResults.length})</span>
                </div>
                {expanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
            </button>
            {expanded && (
                <div className="p-3 space-y-2">
                    {mcpResults.map((result, i) => (
                        <div key={i} className="bg-teal-50/50 dark:bg-teal-900/10 rounded p-3">
                            <div className="flex items-center justify-between mb-1">
                                <code className="text-xs font-bold text-teal-700 dark:text-teal-300">
                                    {result.serverId} / {result.toolName}
                                </code>
                                {result.duration && (
                                    <span className="text-xs text-gray-500 flex items-center gap-1">
                                        <Clock className="w-3 h-3" />{result.duration}ms
                                    </span>
                                )}
                            </div>
                            {result.error ? (
                                <div className="text-xs text-red-600 dark:text-red-400">
                                    Error: {result.error}
                                </div>
                            ) : (
                                <pre className="text-xs font-mono text-gray-700 dark:text-dark-300 overflow-x-auto">
                                    {JSON.stringify(result.result, null, 2)}
                                </pre>
                            )}
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
};

export function MessageBubble({
    message,
    onEdit,
    onRegenerate,
    showTimestamp = true,
    showModel = false,
    isLoading,
    isLast
}: MessageBubbleProps) {
    const [copied, setCopied] = useState(false);
    const [isEditing, setIsEditing] = useState(false);
    const [editContent, setEditContent] = useState('');
    const [formattedTime, setFormattedTime] = useState('');

    useEffect(() => {
        setFormattedTime(message.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }));
    }, [message.timestamp]);

    const isUser = message.role === 'user';
    const isSystem = message.role === 'system';

    const getTextContent = useCallback(() => {
        if (typeof message.content === 'string') return message.content;
        return message.content
            .filter(p => p.type === 'text')
            .map(p => p.text || '')
            .join('\n');
    }, [message.content]);

    const handleCopy = useCallback(() => {
        navigator.clipboard.writeText(getTextContent()).then(() => {
            setCopied(true);
            setTimeout(() => setCopied(false), 2000);
        });
    }, [getTextContent]);

    const handleEditStart = useCallback(() => {
        setEditContent(getTextContent());
        setIsEditing(true);
    }, [getTextContent]);

    const handleEditSave = useCallback(() => {
        if (onEdit && editContent.trim()) {
            onEdit(message.id, editContent.trim());
        }
        setIsEditing(false);
    }, [onEdit, message.id, editContent]);

    // Process content to clean up reasoning markers
    const processContent = useCallback((content: string): string => {
        return content
            .replace(/<think>[\s\S]*?<\/think>/g, '')
            .replace(/<thinking>[\s\S]*?<\/thinking>/g, '')
            .replace(/\[REASONING\][\s\S]*?\[\/REASONING\]/g, '')
            .trim();
    }, []);

    // Extract reasoning from content if not already separated
    const extractReasoning = useCallback((content: string): { reasoning: string; mainContent: string } => {
        const thinkMatch = content.match(/<think>([\s\S]*?)<\/think>/);
        const thinkingMatch = content.match(/<thinking>([\s\S]*?)<\/thinking>/);
        const reasoningMatch = content.match(/\[REASONING\]([\s\S]*?)\[\/REASONING\]/);

        const reasoning = (thinkMatch?.[1] || thinkingMatch?.[1] || reasoningMatch?.[1] || '').trim();
        const mainContent = processContent(content);

        return { reasoning, mainContent };
    }, [processContent]);

    if (isSystem) {
        return (
            <div className="flex justify-center my-2">
                <div className="px-4 py-2 bg-gray-100 dark:bg-dark-800 rounded-full text-xs text-gray-500 dark:text-dark-400 max-w-md text-center">
                    {getTextContent()}
                </div>
            </div>
        );
    }

    const rawContent = getTextContent();
    const { reasoning: extractedReasoning, mainContent } = extractReasoning(rawContent);
    const displayReasoning = message.reasoning || extractedReasoning;

    return (
        <div className={`border-b border-gray-100 dark:border-dark-800 group ${message.role === 'assistant' ? 'bg-gray-50 dark:bg-dark-925' : 'bg-white dark:bg-dark-950'}`}>
            <div className="max-w-3xl mx-auto px-4 py-5">
                <div className="flex gap-3">
                    {/* Avatar */}
                    <div className={`w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 text-white ${isUser
                        ? 'bg-gradient-to-br from-blue-500 to-blue-600'
                        : 'bg-gradient-to-br from-purple-500 to-purple-600'
                        }`}>
                        {isUser ? <User className="w-4 h-4" /> : <Bot className="w-4 h-4" />}
                    </div>

                    {/* Message content */}
                    <div className="flex-1 min-w-0">
                        {/* Header */}
                        <div className="flex items-center gap-2 mb-2">
                            <span className="text-sm font-semibold text-gray-900 dark:text-dark-100">
                                {isUser ? 'You' : 'RavenGPT'}
                            </span>
                            {showTimestamp && formattedTime && (
                                <span className="text-xs text-gray-400 dark:text-dark-500">{formattedTime}</span>
                            )}
                            {showModel && message.model && (
                                <span className="text-xs text-gray-400 dark:text-dark-500 bg-gray-100 dark:bg-dark-800 px-1.5 py-0.5 rounded">
                                    {message.model.split('/').pop()}
                                </span>
                            )}
                            {message.isEdited && (
                                <span className="text-xs text-gray-400 dark:text-dark-500 italic">(edited)</span>
                            )}
                            {message.tokens && (
                                <span className="text-xs text-gray-400 dark:text-dark-500">
                                    {message.tokens.total.toLocaleString()} tokens
                                </span>
                            )}
                        </div>

                        {/* Reasoning section */}
                        {!isUser && displayReasoning && (
                            <ReasoningSection reasoning={displayReasoning} />
                        )}

                        {/* Tool calls */}
                        {!isUser && (message.toolCalls || message.toolResults) && (
                            <ToolResultsSection
                                toolCalls={message.toolCalls}
                                toolResults={message.toolResults}
                            />
                        )}

                        {/* MCP results */}
                        {!isUser && message.mcpResults && message.mcpResults.length > 0 && (
                            <MCPResultsSection mcpResults={message.mcpResults} />
                        )}

                        {/* Editing mode */}
                        {isEditing ? (
                            <div className="space-y-2">
                                <textarea
                                    value={editContent}
                                    onChange={(e) => setEditContent(e.target.value)}
                                    className="w-full p-3 text-sm border border-gray-300 dark:border-dark-600 rounded-lg bg-white dark:bg-dark-800 text-gray-800 dark:text-dark-100 resize-none focus:outline-none focus:ring-2 focus:ring-blue-500"
                                    rows={4}
                                    autoFocus
                                    onKeyDown={(e) => {
                                        if (e.key === 'Enter' && e.ctrlKey) handleEditSave();
                                        if (e.key === 'Escape') setIsEditing(false);
                                    }}
                                />
                                <div className="flex gap-2 text-xs text-gray-500 dark:text-dark-400">
                                    <button
                                        onClick={handleEditSave}
                                        className="px-3 py-1.5 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                                    >
                                        Save & Resend
                                    </button>
                                    <button
                                        onClick={() => setIsEditing(false)}
                                        className="px-3 py-1.5 bg-gray-200 dark:bg-dark-700 text-gray-700 dark:text-dark-200 rounded-lg hover:bg-gray-300 dark:hover:bg-dark-600 transition-colors"
                                    >
                                        Cancel
                                    </button>
                                    <span className="self-center">Ctrl+Enter to save, Esc to cancel</span>
                                </div>
                            </div>
                        ) : (
                            <>
                                {/* User message content */}
                                {isUser ? (
                                    <div className="text-gray-900 dark:text-dark-100">
                                        {typeof message.content === 'string' ? (
                                            <p className="text-sm whitespace-pre-wrap break-words leading-relaxed">{message.content}</p>
                                        ) : (
                                            <div className="space-y-2">
                                                {message.content.map((part, i) => (
                                                    <div key={i}>
                                                        {part.type === 'text' && part.text && (
                                                            <p className="text-sm whitespace-pre-wrap break-words leading-relaxed">{part.text}</p>
                                                        )}
                                                        {part.type === 'image_url' && part.image_url && (
                                                            <div className="mt-2 rounded-lg overflow-hidden max-w-xs border border-gray-200 dark:border-dark-700">
                                                                <Image
                                                                    src={part.image_url.url}
                                                                    alt="Uploaded image"
                                                                    width={300}
                                                                    height={200}
                                                                    className="object-cover"
                                                                    unoptimized
                                                                />
                                                            </div>
                                                        )}
                                                    </div>
                                                ))}
                                            </div>
                                        )}

                                        {/* Attachments */}
                                        {message.attachments && message.attachments.length > 0 && (
                                            <div className="mt-2 space-y-1">
                                                {message.attachments
                                                    .filter(a => a.type !== 'image')
                                                    .map((att, i) => (
                                                        <div key={i} className="flex items-center gap-2 text-xs text-gray-600 dark:text-dark-400 bg-gray-100 dark:bg-dark-800 rounded px-2 py-1 w-fit">
                                                            <span>📎</span>
                                                            <span className="truncate max-w-xs">{att.name}</span>
                                                            <span className="text-gray-400">({(att.size / 1024).toFixed(1)}KB)</span>
                                                        </div>
                                                    ))}
                                            </div>
                                        )}
                                    </div>
                                ) : (
                                    /* Assistant message - rendered markdown */
                                    <div className="prose prose-sm dark:prose-invert max-w-none prose-p:leading-relaxed prose-pre:p-0 prose-pre:bg-transparent">
                                        {message.isError ? (
                                            <div className="flex items-start gap-2 p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg text-red-700 dark:text-red-300">
                                                <span className="text-lg flex-shrink-0">⚠️</span>
                                                <p className="text-sm m-0">{mainContent}</p>
                                            </div>
                                        ) : (
                                            <ReactMarkdown
                                                remarkPlugins={[remarkGfm]}
                                                components={{
                                                    code({ className, children, ...props }) {
                                                        const match = /language-(\w+)/.exec(className || '');
                                                        const codeContent = String(children).replace(/\n$/, '');
                                                        const isInline = !match && !codeContent.includes('\n');

                                                        if (isInline) {
                                                            return (
                                                                <code
                                                                    className="bg-gray-100 dark:bg-dark-800 text-gray-800 dark:text-dark-100 px-1.5 py-0.5 rounded text-xs font-mono"
                                                                    {...props}
                                                                >
                                                                    {children}
                                                                </code>
                                                            );
                                                        }

                                                        return (
                                                            <CodeBlock language={match?.[1]}>
                                                                {codeContent}
                                                            </CodeBlock>
                                                        );
                                                    },
                                                    pre({ children }) {
                                                        return <>{children}</>;
                                                    },
                                                    a({ href, children }) {
                                                        return (
                                                            <a
                                                                href={href}
                                                                target="_blank"
                                                                rel="noopener noreferrer"
                                                                className="text-blue-600 dark:text-blue-400 hover:underline"
                                                            >
                                                                {children}
                                                            </a>
                                                        );
                                                    },
                                                    table({ children }) {
                                                        return (
                                                            <div className="overflow-x-auto my-3">
                                                                <table className="min-w-full border-collapse border border-gray-300 dark:border-dark-600 text-sm">
                                                                    {children}
                                                                </table>
                                                            </div>
                                                        );
                                                    },
                                                    th({ children }) {
                                                        return (
                                                            <th className="border border-gray-300 dark:border-dark-600 px-3 py-2 bg-gray-100 dark:bg-dark-800 font-semibold text-left">
                                                                {children}
                                                            </th>
                                                        );
                                                    },
                                                    td({ children }) {
                                                        return (
                                                            <td className="border border-gray-300 dark:border-dark-600 px-3 py-2">
                                                                {children}
                                                            </td>
                                                        );
                                                    },
                                                }}
                                            >
                                                {mainContent}
                                            </ReactMarkdown>
                                        )}
                                        {isLoading && isLast && (
                                            <span className="inline-block w-2 h-4 bg-gray-400 ml-1 animate-pulse rounded-sm"></span>
                                        )}
                                    </div>
                                )}
                            </>
                        )}

                        {/* Citations */}
                        {!isUser && message.citations && message.citations.length > 0 && (
                            <CitationsSection citations={message.citations} />
                        )}

                        {/* Action buttons */}
                        {!isEditing && (
                            <div className="flex items-center gap-1 mt-2 opacity-0 group-hover:opacity-100 transition-opacity">
                                <button
                                    onClick={handleCopy}
                                    className="p-1.5 text-gray-400 hover:text-gray-600 dark:hover:text-dark-200 hover:bg-gray-100 dark:hover:bg-dark-800 rounded transition-colors"
                                    title="Copy message"
                                >
                                    {copied ? <Check className="w-3.5 h-3.5 text-green-500" /> : <Copy className="w-3.5 h-3.5" />}
                                </button>

                                {isUser && onEdit && (
                                    <button
                                        onClick={handleEditStart}
                                        className="p-1.5 text-gray-400 hover:text-gray-600 dark:hover:text-dark-200 hover:bg-gray-100 dark:hover:bg-dark-800 rounded transition-colors"
                                        title="Edit message"
                                    >
                                        <Edit2 className="w-3.5 h-3.5" />
                                    </button>
                                )}

                                {!isUser && onRegenerate && (
                                    <button
                                        onClick={() => onRegenerate(message.id)}
                                        className="p-1.5 text-gray-400 hover:text-gray-600 dark:hover:text-dark-200 hover:bg-gray-100 dark:hover:bg-dark-800 rounded transition-colors"
                                        title="Regenerate response"
                                    >
                                        <RefreshCw className="w-3.5 h-3.5" />
                                    </button>
                                )}
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
}
