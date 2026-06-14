'use client';

import React, { useState, useRef, useCallback, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Header } from '@/components/Header';
import { Sidebar } from '@/components/Sidebar';
import { ChatArea } from '@/components/ChatArea';
import { ChatInput } from '@/components/ChatInput';
import { FeatureModeSelector } from '@/components/FeatureModeSelector';
import { useChatSessions } from '@/hooks/useChatSessions';
import { useSettings } from '@/hooks/useSettings';
import {
    Message, FeatureMode, Tool, ToolCall, ToolResult,
    BUILTIN_TOOLS, PROVIDER_URLS, MCPTool
} from '@/lib/types';
import {
    fetchOpenRouterModels, fetchGroqModels, fetchTogetherAIModels,
    executeBuiltinTool, callMCPTool, connectMCPServer,
    exportChatToMarkdown, exportChatToJSON, importChatFromJSON,
    estimateMessagesTokens
} from '@/lib/api';
import type { Model } from '@/lib/types';

interface UploadedFile {
    name: string;
    type: 'image' | 'document';
    url?: string;
    size: number;
    mimeType?: string;
    content?: string;
}

export default function Home() {
    const router = useRouter();
    const { settings, updateSetting, toggleDarkMode, updateMCPServer } = useSettings();

    const {
        chatSessions,
        currentChatId,
        setCurrentChatId,
        createNewChat,
        deleteChat,
        deleteAllChats,
        renameChat,
        pinChat,
        updateChatMessages,
        updateChatSettings,
        duplicateChat,
        importChat,
        isInitialized
    } = useChatSessions();

    const [featureMode, setFeatureMode] = useState<FeatureMode>('standard');
    const [input, setInput] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [showSidebar, setShowSidebar] = useState(true);
    const [searchQuery, setSearchQuery] = useState('');
    const [models, setModels] = useState<Model[]>([]);
    const [currentStreamingReasoning, setCurrentStreamingReasoning] = useState('');
    const [uploadedFiles, setUploadedFiles] = useState<UploadedFile[]>([]);
    const [editingChatId, setEditingChatId] = useState<string | null>(null);
    const [editingTitle, setEditingTitle] = useState('');
    const [tokenCount, setTokenCount] = useState(0);
    const [mcpTools, setMcpTools] = useState<MCPTool[]>([]);

    const messagesEndRef = useRef<HTMLDivElement>(null);
    const fileInputRef = useRef<HTMLInputElement>(null);
    const abortControllerRef = useRef<AbortController | null>(null);
    const focusInputRef = useRef<(() => void) | null>(null);

    const currentChat = chatSessions.find(s => s.id === currentChatId);
    const messages = currentChat?.messages || [];

    const filteredChatSessions = chatSessions.filter(chat =>
        chat.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        chat.messages.some(m =>
            typeof m.content === 'string' &&
            m.content.toLowerCase().includes(searchQuery.toLowerCase())
        )
    );

    const scrollToBottom = useCallback(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, []);

    useEffect(() => { scrollToBottom(); }, [messages, scrollToBottom]);

    // Load models
    useEffect(() => {
        if (!settings.apiKey || !settings.providerName) return;
        const loadModels = async () => {
            try {
                let fetchedModels: Model[] = [];
                if (settings.providerName === 'OpenRouter') {
                    fetchedModels = await fetchOpenRouterModels(settings.apiKey);
                } else if (settings.providerName === 'Groq') {
                    fetchedModels = await fetchGroqModels(settings.apiKey);
                } else if (settings.providerName === 'Together AI') {
                    fetchedModels = await fetchTogetherAIModels(settings.apiKey);
                }
                setModels(fetchedModels);
                if (!settings.selectedModel && fetchedModels.length > 0) {
                    updateSetting('selectedModel', fetchedModels[0].id);
                }
            } catch (err) {
                console.error('Failed to load models:', err);
            }
        };
        loadModels();
    }, [settings.apiKey, settings.providerName]); // eslint-disable-line react-hooks/exhaustive-deps

    // Update token count
    useEffect(() => {
        if (messages.length > 0) {
            const count = estimateMessagesTokens(
                messages.map(m => ({ role: m.role, content: m.content }))
            );
            setTokenCount(count);
        } else {
            setTokenCount(0);
        }
    }, [messages]);

    // Keyboard shortcuts
    useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            if (e.ctrlKey && e.key === 'k') { e.preventDefault(); handleCreateNewChat(); }
            if (e.ctrlKey && e.key === 'b') { e.preventDefault(); setShowSidebar(prev => !prev); }
            if (e.ctrlKey && e.key === '/') { e.preventDefault(); focusInputRef.current?.(); }
            if (e.ctrlKey && e.key === 'e') { e.preventDefault(); handleExportChat(); }
            if (e.ctrlKey && e.key === ',') { e.preventDefault(); router.push('/settings'); }
            if (e.ctrlKey && e.shiftKey && e.key === 'R') { e.preventDefault(); handleRegenerateLastMessage(); }
        };
        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, [currentChatId, messages]); // eslint-disable-line react-hooks/exhaustive-deps

    const handleCreateNewChat = useCallback(() => {
        const newId = createNewChat(featureMode, settings.selectedModel, settings.systemPrompt);
        setInput('');
        setUploadedFiles([]);
        setTimeout(() => focusInputRef.current?.(), 100);
        return newId;
    }, [createNewChat, featureMode, settings.selectedModel, settings.systemPrompt]);

    const switchToChat = useCallback((chatId: string) => {
        setCurrentChatId(chatId);
        const chat = chatSessions.find(s => s.id === chatId);
        if (chat) setFeatureMode(chat.featureMode);
    }, [chatSessions, setCurrentChatId]);

    const buildApiMessages = useCallback((chatMessages: Message[], systemPrompt?: string) => {
        const apiMessages: Array<Record<string, unknown>> = [];
        const effectiveSystemPrompt = systemPrompt || settings.systemPrompt;
        if (effectiveSystemPrompt) {
            apiMessages.push({ role: 'system', content: effectiveSystemPrompt });
        }
        for (const msg of chatMessages) {
            if (msg.role === 'system') continue;
            if (msg.role === 'tool') {
                apiMessages.push({
                    role: 'tool',
                    content: typeof msg.content === 'string' ? msg.content : JSON.stringify(msg.content),
                    tool_call_id: msg.toolResults?.[0]?.tool_call_id || '',
                    name: msg.toolResults?.[0]?.name || ''
                });
                continue;
            }
            const messageObj: Record<string, unknown> = { role: msg.role, content: msg.content };
            if (msg.toolCalls && msg.toolCalls.length > 0) {
                messageObj.tool_calls = msg.toolCalls;
            }
            apiMessages.push(messageObj);
        }
        return apiMessages;
    }, [settings.systemPrompt]);

    const generateTitle = useCallback((content: string): string => {
        const cleaned = content.replace(/[#*`]/g, '').trim();
        return cleaned.length <= 40 ? cleaned : cleaned.substring(0, 40) + '...';
    }, []);

    const stopGeneration = useCallback(() => {
        if (abortControllerRef.current) {
            abortControllerRef.current.abort();
            abortControllerRef.current = null;
        }
        setIsLoading(false);
        setCurrentStreamingReasoning('');
    }, []);

    const handleToolCalls = useCallback(async (toolCalls: ToolCall[]): Promise<ToolResult[]> => {
        const toolResults: ToolResult[] = [];
        for (const call of toolCalls) {
            let args: Record<string, unknown> = {};
            try { args = JSON.parse(call.function.arguments); } catch { /* */ }
            let result: string;
            const mcpTool = mcpTools.find(t => t.name === call.function.name);
            if (mcpTool) {
                const mcpResult = await callMCPTool(mcpTool.serverId, call.function.name, args);
                result = JSON.stringify(mcpResult.result || mcpResult.error);
            } else {
                result = await executeBuiltinTool(call.function.name, args);
            }
            toolResults.push({ tool_call_id: call.id, role: 'tool', name: call.function.name, content: result });
        }
        return toolResults;
    }, [mcpTools]);

    const sendMessage = useCallback(async () => {
        if (!input.trim() && uploadedFiles.length === 0) return;
        if (!settings.apiKey) { router.push('/settings'); return; }
        if (isLoading) return;

        const userInput = input.trim();
        setInput('');
        setIsLoading(true);
        setCurrentStreamingReasoning('');

        let activeChatId = currentChatId;
        if (!activeChatId) { activeChatId = handleCreateNewChat(); }

        let userContent: Message['content'];
        if (featureMode === 'vision' && uploadedFiles.some(f => f.type === 'image')) {
            const parts: Array<{ type: 'text' | 'image_url'; text?: string; image_url?: { url: string; detail?: 'low' | 'high' | 'auto' } }> = [];
            if (userInput) parts.push({ type: 'text', text: userInput });
            for (const file of uploadedFiles) {
                if (file.type === 'image' && file.url) {
                    parts.push({ type: 'image_url', image_url: { url: file.url, detail: 'auto' } });
                }
            }
            userContent = parts;
        } else {
            let textContent = userInput;
            for (const file of uploadedFiles) {
                if (file.type === 'document' && file.content) {
                    textContent += `\n\n[Document: ${file.name}]\n${file.content}`;
                }
            }
            userContent = textContent;
        }

        const userMessage: Message = {
            id: `msg_${Date.now()}_user`,
            role: 'user',
            content: userContent,
            timestamp: new Date(),
            attachments: uploadedFiles.map(f => ({ type: f.type, name: f.name, url: f.url || '', size: f.size, mimeType: f.mimeType }))
        };

        setUploadedFiles([]);

        const currentMessages = chatSessions.find(s => s.id === activeChatId)?.messages || [];
        const newMessages = [...currentMessages, userMessage];

        updateChatMessages(activeChatId, newMessages, (title) =>
            title === 'New Chat' ? generateTitle(userInput) : title
        );

        const apiUrl = settings.providerUrl || PROVIDER_URLS[settings.providerName] || PROVIDER_URLS['OpenRouter'];
        const apiMessages = buildApiMessages(newMessages, currentChat?.systemPrompt);

        let modelId = settings.selectedModel;
        if (featureMode === 'web-search' && settings.providerName === 'OpenRouter' && !modelId.endsWith(':online')) {
            modelId = modelId + ':online';
        }

        const tools: Tool[] = [];
        if (featureMode === 'tools' || featureMode === 'mcp') {
            tools.push(...BUILTIN_TOOLS);
            for (const mcpTool of mcpTools) {
                tools.push({
                    type: 'function',
                    function: {
                        name: mcpTool.name,
                        description: `[MCP: ${mcpTool.serverName}] ${mcpTool.description}`,
                        parameters: mcpTool.inputSchema
                    }
                });
            }
        }

        const requestBody: Record<string, unknown> = {
            model: modelId,
            messages: apiMessages,
            max_tokens: settings.maxTokens,
            temperature: settings.temperature,
            top_p: settings.topP,
            stream: settings.streamingEnabled,
        };

        if (tools.length > 0) {
            requestBody.tools = tools;
            requestBody.tool_choice = 'auto';
        }

        if (featureMode === 'reasoning') {
            const model = models.find(m => m.id === settings.selectedModel);
            if (model?.supportsReasoning) {
                requestBody.include_reasoning = true;
            }
        }

        const abortController = new AbortController();
        abortControllerRef.current = abortController;

        try {
            const response = await fetch(apiUrl, {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${settings.apiKey}`,
                    'Content-Type': 'application/json',
                    'HTTP-Referer': typeof window !== 'undefined' ? window.location.origin : '',
                    'X-Title': 'RavenGPT'
                },
                body: JSON.stringify(requestBody),
                signal: abortController.signal
            });

            if (!response.ok) {
                const errorData = await response.json().catch(() => ({ error: { message: response.statusText } }));
                throw new Error(errorData.error?.message || `API Error: ${response.status}`);
            }

            let fullContent = '';
            let fullReasoning = '';
            let toolCalls: ToolCall[] = [];
            let citations: Message['citations'] = [];
            let promptTokens = 0;
            let completionTokens = 0;

            if (settings.streamingEnabled) {
                const reader = response.body?.getReader();
                const decoder = new TextDecoder();
                if (!reader) throw new Error('No response body');

                let buffer = '';
                const toolCallsMap = new Map<number, { id: string; name: string; args: string }>();

                while (true) {
                    const { done, value } = await reader.read();
                    if (done) break;
                    buffer += decoder.decode(value, { stream: true });
                    const lines = buffer.split('\n');
                    buffer = lines.pop() || '';

                    for (const line of lines) {
                        if (!line.startsWith('data: ')) continue;
                        const data = line.slice(6).trim();
                        if (data === '[DONE]') continue;
                        try {
                            const parsed = JSON.parse(data);
                            const delta = parsed.choices?.[0]?.delta;
                            if (!delta) continue;
                            if (delta.content) {
                                fullContent += delta.content;
                                const thinkMatch = fullContent.match(/<think>([\s\S]*?)(?:<\/think>|$)/);
                                if (thinkMatch) setCurrentStreamingReasoning(thinkMatch[1]);
                            }
                            if (delta.reasoning) {
                                fullReasoning += delta.reasoning;
                                setCurrentStreamingReasoning(fullReasoning);
                            }
                            if (delta.tool_calls) {
                                for (const tc of delta.tool_calls) {
                                    if (!toolCallsMap.has(tc.index)) {
                                        toolCallsMap.set(tc.index, { id: tc.id || '', name: '', args: '' });
                                    }
                                    const existing = toolCallsMap.get(tc.index)!;
                                    if (tc.id) existing.id = tc.id;
                                    if (tc.function?.name) existing.name += tc.function.name;
                                    if (tc.function?.arguments) existing.args += tc.function.arguments;
                                }
                            }
                            if (parsed.citations) citations = parsed.citations;
                            if (parsed.usage) {
                                promptTokens = parsed.usage.prompt_tokens || 0;
                                completionTokens = parsed.usage.completion_tokens || 0;
                            }
                        } catch { /* skip */ }
                    }
                }

                toolCalls = Array.from(toolCallsMap.values()).map(tc => ({
                    id: tc.id, type: 'function' as const,
                    function: { name: tc.name, arguments: tc.args }
                }));
            } else {
                const data = await response.json();
                const choice = data.choices?.[0];
                fullContent = choice?.message?.content || '';
                fullReasoning = choice?.message?.reasoning || '';
                toolCalls = choice?.message?.tool_calls || [];
                citations = data.citations || [];
                promptTokens = data.usage?.prompt_tokens || 0;
                completionTokens = data.usage?.completion_tokens || 0;
            }

            if (!fullReasoning) {
                const thinkMatch = fullContent.match(/<think>([\s\S]*?)<\/think>/);
                const thinkingMatch = fullContent.match(/<thinking>([\s\S]*?)<\/thinking>/);
                fullReasoning = (thinkMatch?.[1] || thinkingMatch?.[1] || '').trim();
            }

            let toolResults: ToolResult[] = [];
            if (toolCalls.length > 0) {
                toolResults = await handleToolCalls(toolCalls);
            }

            const assistantMessage: Message = {
                id: `msg_${Date.now()}_assistant`,
                role: 'assistant',
                content: fullContent,
                timestamp: new Date(),
                reasoning: fullReasoning || undefined,
                citations: citations && citations.length > 0 ? citations : undefined,
                toolCalls: toolCalls.length > 0 ? toolCalls : undefined,
                toolResults: toolResults.length > 0 ? toolResults : undefined,
                model: settings.selectedModel,
                tokens: { prompt: promptTokens, completion: completionTokens, total: promptTokens + completionTokens }
            };

            let finalMessages = [...newMessages, assistantMessage];

            if (toolResults.length > 0) {
                for (const tr of toolResults) {
                    finalMessages.push({
                        id: `msg_${Date.now()}_tool_${tr.tool_call_id}`,
                        role: 'tool',
                        content: tr.content,
                        timestamp: new Date(),
                        toolResults: [tr]
                    });
                }

                const followUpMessages = buildApiMessages(finalMessages, currentChat?.systemPrompt);
                const followUpResponse = await fetch(apiUrl, {
                    method: 'POST',
                    headers: {
                        'Authorization': `Bearer ${settings.apiKey}`,
                        'Content-Type': 'application/json',
                        'HTTP-Referer': typeof window !== 'undefined' ? window.location.origin : '',
                        'X-Title': 'RavenGPT'
                    },
                    body: JSON.stringify({
                        model: modelId,
                        messages: followUpMessages,
                        max_tokens: settings.maxTokens,
                        temperature: settings.temperature,
                        stream: false
                    }),
                    signal: abortController.signal
                });

                if (followUpResponse.ok) {
                    const followUpData = await followUpResponse.json();
                    const followUpContent = followUpData.choices?.[0]?.message?.content || '';
                    finalMessages.push({
                        id: `msg_${Date.now()}_followup`,
                        role: 'assistant',
                        content: followUpContent,
                        timestamp: new Date(),
                        model: settings.selectedModel,
                        tokens: {
                            prompt: followUpData.usage?.prompt_tokens || 0,
                            completion: followUpData.usage?.completion_tokens || 0,
                            total: (followUpData.usage?.prompt_tokens || 0) + (followUpData.usage?.completion_tokens || 0)
                        }
                    });
                }
            }

            updateChatMessages(activeChatId, finalMessages);

        } catch (err: unknown) {
            if (err instanceof Error && err.name === 'AbortError') {
                if (newMessages.length > 0) updateChatMessages(activeChatId, newMessages);
            } else {
                const errorMessage: Message = {
                    id: `msg_${Date.now()}_error`,
                    role: 'assistant',
                    content: `Error: ${err instanceof Error ? err.message : 'An unknown error occurred. Please check your API key and try again.'}`,
                    timestamp: new Date(),
                    isError: true
                };
                updateChatMessages(activeChatId, [...newMessages, errorMessage]);
            }
        } finally {
            setIsLoading(false);
            setCurrentStreamingReasoning('');
            abortControllerRef.current = null;
        }
    }, [
        input, uploadedFiles, settings, isLoading, currentChatId, featureMode,
        chatSessions, models, mcpTools, currentChat,
        handleCreateNewChat, buildApiMessages, generateTitle,
        updateChatMessages, handleToolCalls, router
    ]);

    const handleEditMessage = useCallback((messageId: string, newContent: string) => {
        if (!currentChatId) return;
        const msgIndex = messages.findIndex(m => m.id === messageId);
        if (msgIndex === -1) return;
        updateChatMessages(currentChatId, messages.slice(0, msgIndex));
        setInput(newContent);
        setTimeout(() => sendMessage(), 100);
    }, [currentChatId, messages, updateChatMessages, sendMessage]);

    const handleRegenerateLastMessage = useCallback(() => {
        if (!currentChatId || messages.length < 2) return;
        const lastUserIdx = messages.map(m => m.role).lastIndexOf('user');
        if (lastUserIdx === -1) return;
        const truncated = messages.slice(0, lastUserIdx);
        const lastUserMsg = messages[lastUserIdx];
        updateChatMessages(currentChatId, truncated);
        const content = typeof lastUserMsg.content === 'string'
            ? lastUserMsg.content
            : lastUserMsg.content.filter(p => p.type === 'text').map(p => p.text || '').join('\n');
        setInput(content);
        setTimeout(() => sendMessage(), 100);
    }, [currentChatId, messages, updateChatMessages, sendMessage]);

    const handleExportChat = useCallback(() => {
        if (!currentChat) return;
        const content = settings.exportFormat === 'json'
            ? exportChatToJSON(currentChat)
            : exportChatToMarkdown(currentChat);
        const ext = settings.exportFormat === 'json' ? 'json' : 'md';
        const blob = new Blob([content], { type: 'text/plain;charset=utf-8' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `${currentChat.title.replace(/[^a-z0-9]/gi, '_')}.${ext}`;
        a.click();
        URL.revokeObjectURL(url);
    }, [currentChat, settings.exportFormat]);

    const handleImportChat = useCallback(async (file: File) => {
        try {
            const text = await file.text();
            const session = importChatFromJSON(text);
            if (session) {
                importChat(session);
            } else {
                alert('Invalid chat file format. Please import a valid JSON chat export.');
            }
        } catch {
            alert('Failed to import chat file.');
        }
    }, [importChat]);

    const handleFileUpload = useCallback(async (event: React.ChangeEvent<HTMLInputElement>) => {
        const files = Array.from(event.target.files || []);
        for (const file of files) {
            const isImage = file.type.startsWith('image/');
            const uploadedFile: UploadedFile = { name: file.name, type: isImage ? 'image' : 'document', size: file.size, mimeType: file.type };
            if (isImage) {
                const reader = new FileReader();
                reader.onload = (e) => {
                    uploadedFile.url = e.target?.result as string;
                    setUploadedFiles(prev => [...prev, uploadedFile]);
                };
                reader.readAsDataURL(file);
            } else {
                try {
                    const text = await file.text();
                    uploadedFile.content = text.substring(0, 50000);
                    setUploadedFiles(prev => [...prev, uploadedFile]);
                } catch {
                    setUploadedFiles(prev => [...prev, uploadedFile]);
                }
            }
        }
    }, []);

    const removeUploadedFile = useCallback((index: number) => {
        setUploadedFiles(prev => prev.filter((_, i) => i !== index));
    }, []);

    const handleFeatureModeChange = useCallback((mode: FeatureMode) => {
        setFeatureMode(mode);
        if (currentChatId) updateChatSettings(currentChatId, { featureMode: mode });
    }, [currentChatId, updateChatSettings]);

    if (!isInitialized) {
        return (
            <div className="h-screen flex items-center justify-center bg-white dark:bg-dark-950">
                <div className="flex flex-col items-center gap-3">
                    <div className="w-8 h-8 border-2 border-blue-600 border-t-transparent rounded-full animate-spin" />
                    <p className="text-sm text-gray-500 dark:text-dark-400">Loading RavenGPT...</p>
                </div>
            </div>
        );
    }

    return (
        <div className="flex h-screen bg-white dark:bg-dark-950 overflow-hidden">
            <Sidebar
                showSidebar={showSidebar}
                searchQuery={searchQuery}
                setSearchQuery={setSearchQuery}
                chatSessions={chatSessions}
                filteredChatSessions={filteredChatSessions}
                createNewChat={handleCreateNewChat}
                switchToChat={switchToChat}
                currentChatId={currentChatId}
                editingChatId={editingChatId}
                setEditingChatId={setEditingChatId}
                editingTitle={editingTitle}
                setEditingTitle={setEditingTitle}
                renameChat={renameChat}
                deleteChat={deleteChat}
                deleteAllChats={deleteAllChats}
                pinChat={pinChat}
                duplicateChat={(id) => {
                    const newId = duplicateChat(id);
                    if (newId) setCurrentChatId(newId);
                }}
                importChat={handleImportChat}
                exportFormat={settings.exportFormat}
            />

            {showSidebar && (
                <div className="fixed inset-0 bg-black/30 z-10 sm:hidden" onClick={() => setShowSidebar(false)} />
            )}

            <div className="flex-1 flex flex-col min-w-0">
                <Header
                    showSidebar={showSidebar}
                    setShowSidebar={setShowSidebar}
                    isDarkMode={settings.isDarkMode}
                    toggleDarkMode={toggleDarkMode}
                    selectedModel={settings.selectedModel}
                    models={models}
                    featureMode={featureMode}
                    isLoading={isLoading}
                    currentChatId={currentChatId}
                    onOpenSettings={() => router.push('/settings')}
                    onExportChat={handleExportChat}
                    onRegenerateLastMessage={handleRegenerateLastMessage}
                    tokenCount={tokenCount}
                    showTokenCount={settings.showTokenCount}
                />

                <FeatureModeSelector
                    featureMode={featureMode}
                    setFeatureMode={handleFeatureModeChange}
                    selectedModel={settings.selectedModel}
                    models={models}
                    hasMCPServers={settings.mcpServers.some(s => s.enabled && s.status === 'connected')}
                />

                <ChatArea
                    messages={messages}
                    isLoading={isLoading}
                    currentChatId={currentChatId}
                    featureMode={featureMode}
                    showReasoning={true}
                    currentStreamingReasoning={currentStreamingReasoning}
                    messagesEndRef={messagesEndRef}
                    onEditMessage={handleEditMessage}
                    onRegenerateMessage={() => handleRegenerateLastMessage()}
                    showModel={settings.showModelInfo}
                />

                <ChatInput
                    input={input}
                    setInput={setInput}
                    sendMessage={sendMessage}
                    stopGeneration={stopGeneration}
                    isLoading={isLoading}
                    apiKey={settings.apiKey}
                    uploadedFiles={uploadedFiles}
                    removeUploadedFile={removeUploadedFile}
                    handleFileUpload={handleFileUpload}
                    fileInputRef={fileInputRef}
                    featureMode={featureMode}
                    currentChatId={currentChatId}
                    onFocusRef={(fn) => { focusInputRef.current = fn; }}
                />
            </div>
        </div>
    );
}
