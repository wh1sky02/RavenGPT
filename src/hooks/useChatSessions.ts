import { useState, useCallback, useEffect } from 'react';
import { ChatSession, Message, FeatureMode } from '@/lib/types';

const STORAGE_KEY = 'ravengpt-sessions-v2';
const MAX_SESSIONS = 100;

export function useChatSessions() {
    const [chatSessions, setChatSessions] = useState<ChatSession[]>([]);
    const [currentChatId, setCurrentChatId] = useState<string>('');
    const [isInitialized, setIsInitialized] = useState(false);

    // Save sessions to localStorage
    const saveChatSessions = useCallback((sessions: ChatSession[]) => {
        try {
            const uniqueSessions = sessions
                .filter((session, index, self) =>
                    index === self.findIndex(s => s.id === session.id)
                )
                .slice(0, MAX_SESSIONS); // Limit stored sessions
            localStorage.setItem(STORAGE_KEY, JSON.stringify(uniqueSessions));
        } catch (error) {
            console.error('Error saving chat sessions:', error);
            // If storage is full, try to remove oldest sessions
            try {
                const trimmed = sessions.slice(0, 20);
                localStorage.setItem(STORAGE_KEY, JSON.stringify(trimmed));
            } catch {
                // Silent fail
            }
        }
    }, []);

    const createNewChat = useCallback((featureMode: FeatureMode, model: string, systemPrompt?: string) => {
        const newChatId = `chat_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
        const newChat: ChatSession = {
            id: newChatId,
            title: 'New Chat',
            messages: [],
            createdAt: new Date(),
            updatedAt: new Date(),
            featureMode,
            model,
            systemPrompt: systemPrompt || '',
            tags: [],
            isPinned: false,
            totalTokens: 0,
        };

        setChatSessions(prev => {
            const updated = [newChat, ...prev];
            saveChatSessions(updated);
            return updated;
        });
        setCurrentChatId(newChatId);
        return newChatId;
    }, [saveChatSessions]);

    const deleteChat = useCallback((chatId: string) => {
        setChatSessions(prev => {
            const updated = prev.filter(chat => chat.id !== chatId);
            saveChatSessions(updated);
            return updated;
        });
    }, [saveChatSessions]);

    const deleteAllChats = useCallback(() => {
        setChatSessions([]);
        setCurrentChatId('');
        localStorage.removeItem(STORAGE_KEY);
    }, []);

    const renameChat = useCallback((chatId: string, newTitle: string) => {
        setChatSessions(prev => {
            const updated = prev.map(chat =>
                chat.id === chatId
                    ? { ...chat, title: newTitle.trim() || 'Untitled Chat', updatedAt: new Date() }
                    : chat
            );
            saveChatSessions(updated);
            return updated;
        });
    }, [saveChatSessions]);

    const pinChat = useCallback((chatId: string, pinned: boolean) => {
        setChatSessions(prev => {
            const updated = prev.map(chat =>
                chat.id === chatId ? { ...chat, isPinned: pinned, updatedAt: new Date() } : chat
            );
            // Sort pinned first
            const sorted = [...updated].sort((a, b) => {
                if (a.isPinned && !b.isPinned) return -1;
                if (!a.isPinned && b.isPinned) return 1;
                return b.updatedAt.getTime() - a.updatedAt.getTime();
            });
            saveChatSessions(sorted);
            return sorted;
        });
    }, [saveChatSessions]);

    const updateChatMessages = useCallback((
        chatId: string,
        messages: Message[],
        titleOrGenerator?: string | ((currentTitle: string) => string)
    ) => {
        setChatSessions(prev => {
            const updated = prev.map(chat => {
                if (chat.id === chatId) {
                    let newTitle = chat.title;
                    if (typeof titleOrGenerator === 'function') {
                        newTitle = titleOrGenerator(chat.title);
                    } else if (titleOrGenerator) {
                        newTitle = titleOrGenerator;
                    }

                    // Calculate total tokens
                    const totalTokens = messages.reduce((sum, msg) => {
                        return sum + (msg.tokens?.total || 0);
                    }, 0);

                    return {
                        ...chat,
                        messages,
                        title: newTitle,
                        updatedAt: new Date(),
                        totalTokens
                    };
                }
                return chat;
            });
            saveChatSessions(updated);
            return updated;
        });
    }, [saveChatSessions]);

    const updateChatSettings = useCallback((
        chatId: string,
        settings: Partial<Pick<ChatSession, 'systemPrompt' | 'model' | 'featureMode' | 'temperature' | 'maxTokens' | 'tags'>>
    ) => {
        setChatSessions(prev => {
            const updated = prev.map(chat =>
                chat.id === chatId
                    ? { ...chat, ...settings, updatedAt: new Date() }
                    : chat
            );
            saveChatSessions(updated);
            return updated;
        });
    }, [saveChatSessions]);

    const duplicateChat = useCallback((chatId: string): string => {
        const chat = chatSessions.find(c => c.id === chatId);
        if (!chat) return '';

        const newChatId = `chat_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
        const duplicated: ChatSession = {
            ...chat,
            id: newChatId,
            title: `${chat.title} (Copy)`,
            createdAt: new Date(),
            updatedAt: new Date(),
        };

        setChatSessions(prev => {
            const updated = [duplicated, ...prev];
            saveChatSessions(updated);
            return updated;
        });
        return newChatId;
    }, [chatSessions, saveChatSessions]);

    const importChat = useCallback((session: ChatSession): string => {
        const newId = `chat_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
        const imported: ChatSession = {
            ...session,
            id: newId,
            title: `${session.title} (Imported)`,
            createdAt: new Date(),
            updatedAt: new Date(),
        };

        setChatSessions(prev => {
            const updated = [imported, ...prev];
            saveChatSessions(updated);
            return updated;
        });
        setCurrentChatId(newId);
        return newId;
    }, [saveChatSessions]);

    // Load sessions on mount
    useEffect(() => {
        if (isInitialized) return;

        try {
            // Try new key first, then fall back to old key
            const saved = localStorage.getItem(STORAGE_KEY) ||
                localStorage.getItem('ai-chatbot-sessions');

            if (saved) {
                const sessions: ChatSession[] = JSON.parse(saved).map((session: ChatSession & {
                    createdAt: string;
                    updatedAt: string;
                    messages: Array<Message & { timestamp: string }>
                }) => ({
                    ...session,
                    createdAt: new Date(session.createdAt),
                    updatedAt: new Date(session.updatedAt),
                    messages: session.messages.map((msg: Message & { timestamp: string }) => ({
                        ...msg,
                        timestamp: new Date(msg.timestamp)
                    }))
                }));

                const uniqueSessions = sessions
                    .filter((session, index, self) =>
                        index === self.findIndex(s => s.id === session.id)
                    )
                    .sort((a, b) => {
                        if (a.isPinned && !b.isPinned) return -1;
                        if (!a.isPinned && b.isPinned) return 1;
                        return b.updatedAt.getTime() - a.updatedAt.getTime();
                    });

                setChatSessions(uniqueSessions);

                // Auto-select most recent chat
                if (uniqueSessions.length > 0) {
                    const lastChatId = localStorage.getItem('ravengpt-last-chat-id');
                    const targetId = lastChatId && uniqueSessions.find(s => s.id === lastChatId)
                        ? lastChatId
                        : uniqueSessions[0].id;
                    setCurrentChatId(targetId);
                }
            }
        } catch (error) {
            console.error('Error loading chat sessions:', error);
        }

        setIsInitialized(true);
    }, [isInitialized]);

    // Persist last chat ID
    useEffect(() => {
        if (currentChatId) {
            localStorage.setItem('ravengpt-last-chat-id', currentChatId);
        }
    }, [currentChatId]);

    return {
        chatSessions,
        setChatSessions,
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
    };
}
