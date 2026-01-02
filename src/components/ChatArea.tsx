import { Bot, Brain } from 'lucide-react';
import { Message, FeatureMode } from '@/lib/types';
import { MessageBubble } from './MessageBubble';

interface ChatAreaProps {
    messages: Message[];
    isLoading: boolean;
    currentChatId: string;
    featureMode: FeatureMode;
    showReasoning: boolean;
    currentStreamingReasoning: string;
    messagesEndRef: React.RefObject<HTMLDivElement | null>;
}

export function ChatArea({
    messages,
    isLoading,
    currentChatId,
    featureMode,
    showReasoning,
    currentStreamingReasoning,
    messagesEndRef
}: ChatAreaProps) {
    return (
        <div className="flex-1 overflow-y-auto">
            {/* Real-time Reasoning Display */}
            {featureMode === 'reasoning' && isLoading && currentStreamingReasoning && (
                <div className="border-b border-gray-200 dark:border-dark-800 bg-gray-50 dark:bg-dark-925">
                    <div className="max-w-3xl mx-auto px-4 py-6">
                        <div className="flex gap-4">
                            <div className="w-8 h-8 rounded-full bg-green-600 flex items-center justify-center flex-shrink-0">
                                <Brain className="w-5 h-5 text-white" />
                            </div>
                            <div className="flex-1">
                                <div className="text-sm font-medium text-gray-700 dark:text-dark-300 mb-2">
                                    Thinking...
                                </div>
                                <div className="text-sm text-gray-600 dark:text-dark-400 whitespace-pre-wrap">
                                    {currentStreamingReasoning}
                                    <span className="inline-block w-2 h-4 bg-gray-500 ml-1 animate-pulse"></span>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {messages.length === 0 ? (
                <div className="flex-1 flex items-center justify-center min-h-[60vh]">
                    <div className="text-center max-w-md mx-auto px-4">
                        {!currentChatId ? (
                            <>
                                <h2 className="text-3xl font-semibold text-gray-900 dark:text-dark-100 mb-4">
                                    Welcome to RavenGPT
                                </h2>
                                <p className="text-lg text-gray-500 dark:text-dark-400 mb-6">
                                    Start typing below to begin a new conversation.
                                </p>
                            </>
                        ) : (
                            <>
                                <h2 className="text-3xl font-semibold text-gray-900 dark:text-dark-100 mb-4">
                                    How can I help you today?
                                </h2>
                                <p className="text-lg text-gray-500 dark:text-dark-400">
                                    {featureMode === 'reasoning' && 'Advanced reasoning mode enabled'}
                                    {featureMode === 'web-search' && 'Web search enabled'}
                                    {featureMode === 'vision' && 'Vision analysis ready'}
                                    {featureMode === 'standard' && 'Ready to chat'}
                                </p>
                            </>
                        )}
                    </div>
                </div>
            ) : (
                <div>
                    {messages.map((message, index) => (
                        <MessageBubble
                            key={message.id}
                            message={message}
                            featureMode={featureMode}
                            showReasoning={showReasoning}
                            isLoading={isLoading}
                            isLast={index === messages.length - 1}
                        />
                    ))}

                    {isLoading && messages.length > 0 && messages[messages.length - 1].role === 'user' && (
                        <div className="border-b border-gray-200 dark:border-dark-800 bg-gray-50 dark:bg-dark-925">
                            <div className="max-w-3xl mx-auto px-4 py-6">
                                <div className="flex gap-4">
                                    <div className="w-8 h-8 rounded-full bg-green-600 flex items-center justify-center">
                                        <Bot className="w-5 h-5 text-white" />
                                    </div>
                                    <div className="flex-1">
                                        <div className="font-semibold text-gray-900 dark:text-dark-100 text-sm mb-2">
                                            RavenGPT
                                        </div>
                                        <div className="flex space-x-1">
                                            <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce"></div>
                                            <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0.1s' }}></div>
                                            <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    )}
                </div>
            )}
            <div ref={messagesEndRef} />
        </div>
    );
}
