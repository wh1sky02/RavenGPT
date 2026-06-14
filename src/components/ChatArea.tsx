'use client';

import React, { RefObject } from 'react';
import { Message, FeatureMode } from '@/lib/types';
import { MessageBubble } from './MessageBubble';
import { Bot, Zap, Globe, Eye, Wrench, Server } from 'lucide-react';

interface ChatAreaProps {
    messages: Message[];
    isLoading: boolean;
    currentChatId: string;
    featureMode: FeatureMode;
    showReasoning: boolean;
    currentStreamingReasoning: string;
    messagesEndRef: RefObject<HTMLDivElement | null>;
    onEditMessage?: (messageId: string, newContent: string) => void;
    onRegenerateMessage?: (messageId: string) => void;
    showModel?: boolean;
}

const MODE_INFO = {
    standard: {
        icon: <Bot className="w-8 h-8 text-purple-500" />,
        title: 'RavenGPT',
        description: 'Your intelligent AI assistant. Ask anything — code, analysis, writing, math, and more.',
    },
    reasoning: {
        icon: <Zap className="w-8 h-8 text-yellow-500" />,
        title: 'Reasoning Mode',
        description: 'Deep thinking mode. The AI will reason step-by-step before answering complex questions.',
    },
    'web-search': {
        icon: <Globe className="w-8 h-8 text-blue-500" />,
        title: 'Web Search Mode',
        description: 'Real-time web access. Get up-to-date information from the internet.',
    },
    vision: {
        icon: <Eye className="w-8 h-8 text-green-500" />,
        title: 'Vision Mode',
        description: 'Image analysis enabled. Upload images and ask questions about them.',
    },
    tools: {
        icon: <Wrench className="w-8 h-8 text-orange-500" />,
        title: 'Tools Mode',
        description: 'Function calling enabled. The AI can use built-in tools to help you.',
    },
    mcp: {
        icon: <Server className="w-8 h-8 text-teal-500" />,
        title: 'MCP Mode',
        description: 'Model Context Protocol enabled. Connect to external MCP servers for extended capabilities.',
    }
};

const SUGGESTED_PROMPTS = [
    { icon: '💻', text: 'Write a Python function to sort a list of dictionaries by a key' },
    { icon: '📊', text: 'Explain the difference between machine learning and deep learning' },
    { icon: '✍️', text: 'Help me write a professional email to request a meeting' },
    { icon: '🔢', text: 'Solve this math problem: What is the derivative of x² + 3x + 2?' },
    { icon: '🌐', text: 'What are the latest trends in AI development?' },
    { icon: '🇲🇲', text: 'မင်္ဂလာပါ! မြန်မာဘာသာဖြင့် ကူညီပေးနိုင်ပါသလား?' },
];

export function ChatArea({
    messages,
    isLoading,
    currentChatId,
    featureMode,
    showReasoning,
    currentStreamingReasoning,
    messagesEndRef,
    onEditMessage,
    onRegenerateMessage,
    showModel = false
}: ChatAreaProps) {
    const modeInfo = MODE_INFO[featureMode] || MODE_INFO.standard;

    return (
        <div className="flex-1 overflow-y-auto bg-white dark:bg-dark-950">
            {messages.length === 0 ? (
                <div className="h-full flex flex-col items-center justify-center px-4 py-8 min-h-[60vh]">
                    <div className="max-w-2xl w-full text-center">
                        <div className="flex justify-center mb-6">
                            <div className="w-16 h-16 rounded-2xl bg-gray-100 dark:bg-dark-800 flex items-center justify-center">
                                {modeInfo.icon}
                            </div>
                        </div>
                        <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 dark:text-dark-100 mb-3">
                            {modeInfo.title}
                        </h1>
                        <p className="text-gray-500 dark:text-dark-400 mb-8 text-sm sm:text-base">
                            {modeInfo.description}
                        </p>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-left">
                            {SUGGESTED_PROMPTS.map((prompt, i) => (
                                <button
                                    key={i}
                                    className="flex items-start gap-3 p-3 rounded-xl border border-gray-200 dark:border-dark-700 hover:border-gray-300 dark:hover:border-dark-600 hover:bg-gray-50 dark:hover:bg-dark-900 transition-all text-left group"
                                    onClick={() => {
                                        window.dispatchEvent(new CustomEvent('fill-input', { detail: prompt.text }));
                                    }}
                                >
                                    <span className="text-lg flex-shrink-0">{prompt.icon}</span>
                                    <span className="text-sm text-gray-600 dark:text-dark-300 group-hover:text-gray-900 dark:group-hover:text-dark-100 transition-colors leading-snug">
                                        {prompt.text}
                                    </span>
                                </button>
                            ))}
                        </div>
                        {!currentChatId && (
                            <p className="text-xs text-gray-400 dark:text-dark-500 mt-6">
                                Set your API key in Settings to start chatting
                            </p>
                        )}
                    </div>
                </div>
            ) : (
                <div>
                    {messages.map((message, index) => (
                        <MessageBubble
                            key={message.id}
                            message={message}
                            onEdit={onEditMessage}
                            onRegenerate={onRegenerateMessage}
                            showTimestamp={true}
                            showModel={showModel}
                            isLoading={isLoading}
                            isLast={index === messages.length - 1}
                        />
                    ))}

                    {/* Streaming reasoning indicator */}
                    {isLoading && currentStreamingReasoning && showReasoning && featureMode === 'reasoning' && (
                        <div className="border-b border-gray-100 dark:border-dark-800 bg-gray-50 dark:bg-dark-925">
                            <div className="max-w-3xl mx-auto px-4 py-4">
                                <div className="flex gap-3">
                                    <div className="w-8 h-8 rounded-full bg-gradient-to-br from-purple-500 to-purple-600 flex items-center justify-center flex-shrink-0">
                                        <Zap className="w-4 h-4 text-white animate-pulse" />
                                    </div>
                                    <div className="flex-1">
                                        <div className="text-sm font-semibold text-gray-900 dark:text-dark-100 mb-2">Thinking...</div>
                                        <div className="p-3 bg-purple-50 dark:bg-purple-900/20 border border-purple-200 dark:border-purple-800 rounded-lg">
                                            <p className="text-xs font-mono text-purple-700 dark:text-purple-300 whitespace-pre-wrap max-h-32 overflow-y-auto">
                                                {currentStreamingReasoning}
                                                <span className="inline-block w-1.5 h-3 bg-purple-500 ml-0.5 animate-pulse rounded-sm" />
                                            </p>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    )}

                    {/* Loading indicator */}
                    {isLoading && messages.length > 0 && messages[messages.length - 1].role === 'user' && (
                        <div className="border-b border-gray-100 dark:border-dark-800 bg-gray-50 dark:bg-dark-925">
                            <div className="max-w-3xl mx-auto px-4 py-5">
                                <div className="flex gap-3">
                                    <div className="w-8 h-8 rounded-full bg-gradient-to-br from-purple-500 to-purple-600 flex items-center justify-center flex-shrink-0">
                                        <Bot className="w-4 h-4 text-white" />
                                    </div>
                                    <div className="flex-1 pt-1">
                                        <div className="text-sm font-semibold text-gray-900 dark:text-dark-100 mb-2">RavenGPT</div>
                                        <div className="flex items-center gap-1.5">
                                            <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
                                            <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
                                            <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    )}

                    <div ref={messagesEndRef} className="h-4" />
                </div>
            )}
        </div>
    );
}
