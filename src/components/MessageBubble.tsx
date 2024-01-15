import { useState, useEffect } from 'react';
import { Bot, User } from 'lucide-react';
import ReactMarkdown from 'react-markdown';
import Image from 'next/image';
import { Message, FeatureMode } from '@/lib/types';

interface MessageBubbleProps {
    message: Message;
    featureMode: FeatureMode;
    showReasoning: boolean;
    isLoading?: boolean;
    isLast?: boolean;
}

export function MessageBubble({ message, featureMode, showReasoning, isLoading, isLast }: MessageBubbleProps) {
    const [formattedTime, setFormattedTime] = useState('');

    useEffect(() => {
        setFormattedTime(message.timestamp.toLocaleTimeString());
    }, [message.timestamp]);

    const processContent = () => {
        // Basic string conversion for assistant content
        let content = typeof message.content === 'string' ? message.content : JSON.stringify(message.content);

        // Remove thinking tags and their content if reasoning is disabled
        if (!showReasoning || featureMode !== 'reasoning') {
            content = content
                .replace(/<think>[\s\S]*?<\/think>/g, '')
                .replace(/<thinking>[\s\S]*?<\/thinking>/g, '')
                .replace(/\[REASONING\][\s\S]*?\[\/REASONING\]/g, '')
                .trim();
        }

        // If reasoning is enabled, convert thinking tags to a proper reasoning display
        if (showReasoning && featureMode === 'reasoning') {
            content = content
                .replace(/<think>([\s\S]*?)<\/think>/g, (match, thinkContent) => {
                    return `**🧠 Thinking:**\n\n${thinkContent.trim()}\n\n**Response:**\n\n`;
                })
                .replace(/<thinking>([\s\S]*?)<\/thinking>/g, (match, thinkContent) => {
                    return `**🧠 Thinking:**\n\n${thinkContent.trim()}\n\n**Response:**\n\n`;
                })
                .replace(/\[REASONING\]([\s\S]*?)\[\/REASONING\]/g, (match, thinkContent) => {
                    return `**🧠 Reasoning:**\n\n${thinkContent.trim()}\n\n**Response:**\n\n`;
                });
        }

        return content;
    };

    return (
        <div className={`border-b border-gray-200 dark:border-dark-800 ${message.role === 'assistant' ? 'bg-gray-50 dark:bg-dark-925' : ''}`}>
            <div className="max-w-3xl mx-auto px-4 py-6">
                <div className="flex gap-4">
                    {/* Avatar */}
                    <div className={`w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 ${message.role === 'user' ? 'bg-gray-600' : 'bg-green-600'}`}>
                        {message.role === 'user' ? (
                            <User className="w-5 h-5 text-white" />
                        ) : (
                            <Bot className="w-5 h-5 text-white" />
                        )}
                    </div>

                    {/* Message Content */}
                    <div className="flex-1 min-w-0">
                        <div className="font-semibold text-gray-900 dark:text-dark-100 text-sm mb-2">
                            {message.role === 'user' ? 'You' : 'RavenGPT'}
                        </div>

                        {message.role === 'assistant' ? (
                            <div className="prose prose-gray dark:prose-invert max-w-none prose-p:leading-relaxed prose-pre:bg-gray-800 prose-pre:text-gray-100">
                                <ReactMarkdown>
                                    {processContent()}
                                </ReactMarkdown>
                                {isLoading && isLast && (
                                    <span className="inline-block w-2 h-4 bg-gray-400 ml-1 animate-pulse"></span>
                                )}
                            </div>
                        ) : (
                            <div className="text-gray-900 dark:text-dark-100">
                                {typeof message.content === 'string' ? (
                                    <div className="whitespace-pre-wrap">{message.content}</div>
                                ) : (
                                    <div className="space-y-3">
                                        {Array.isArray(message.content) && message.content.map((part, index) => (
                                            <div key={index}>
                                                {part.type === 'text' && (
                                                    <div className="whitespace-pre-wrap">{part.text}</div>
                                                )}
                                                {part.type === 'image_url' && part.image_url?.url && (
                                                    <Image
                                                        src={part.image_url.url}
                                                        alt="Uploaded image"
                                                        width={400}
                                                        height={300}
                                                        className="rounded-lg border border-gray-200 dark:border-dark-800"
                                                        unoptimized
                                                    />
                                                )}
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </div>
                        )}

                        {/* Citations */}
                        {message.citations && message.citations.length > 0 && (
                            <div className="mt-4 pt-3 border-t border-gray-200 dark:border-dark-800">
                                <div className="text-xs font-medium text-gray-600 dark:text-dark-400 mb-2">Sources:</div>
                                <div className="space-y-1">
                                    {message.citations.map((citation, index) => (
                                        <div key={index}>
                                            <a
                                                href={citation.url}
                                                target="_blank"
                                                rel="noopener noreferrer"
                                                className="text-blue-600 dark:text-blue-400 hover:underline text-sm"
                                            >
                                                {citation.title}
                                            </a>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}

                        <div className="text-xs text-gray-500 dark:text-dark-400 mt-3">
                            {formattedTime}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
