import { useState, useCallback, useEffect } from 'react';
import { ChatSession, Message, FeatureMode } from '@/lib/types';

export function useChatSessions() {
    const [chatSessions, setChatSessions] = useState<ChatSession[]>([]);
    const [currentChatId, setCurrentChatId] = useState<string>('');
    const [isInitialized, setIsInitialized] = useState(false);

    // Helper to save to localStorage
    const saveChatSessions = useCallback((sessions: ChatSession[]) => {
        try {
            // Ensure uniqueness
            const uniqueSessions = sessions.filter((session, index, self) =>
                index === self.findIndex(s => s.id === session.id)
            );
            localStorage.setItem('ai-chatbot-sessions', JSON.stringify(uniqueSessions));
        } catch (error) {
            console.error('Error saving chat sessions:', error);
        }
    }, []);

    const createNewChat = useCallback((featureMode: FeatureMode, model: string) => {
        const newChatId = Date.now().toString();
        const newChat: ChatSession = {
            id: newChatId,
            title: 'New Chat',
            messages: [],
            createdAt: new Date(),
            updatedAt: new Date(),
            featureMode: featureMode,
            model: model,
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

    const renameChat = useCallback((chatId: string, newTitle: string) => {
        setChatSessions(prev => {
            const updated = prev.map(chat =>
                chat.id === chatId ? { ...chat, title: newTitle, updatedAt: new Date() } : chat
            );
            saveChatSessions(updated);
            return updated;
        });
    }, [saveChatSessions]);

    const updateChatMessages = useCallback((chatId: string, messages: Message[], titleOrGenerator?: string | ((currentTitle: string) => string)) => {
        setChatSessions(prev => {
            const updated = prev.map(chat => {
                if (chat.id === chatId) {
                    let newTitle = chat.title;
                    if (typeof titleOrGenerator === 'function') {
                        newTitle = titleOrGenerator(chat.title);
                    } else if (titleOrGenerator) {
                        newTitle = titleOrGenerator;
                    }

                    return {
                        ...chat,
                        messages,
                        title: newTitle,
                        updatedAt: new Date()
                    };
                }
                return chat;
            });
            saveChatSessions(updated);
            return updated;
        });
    }, [saveChatSessions]);

    // Load sessions on mount
    useEffect(() => {
        if (isInitialized) return;

        try {
            const saved = localStorage.getItem('ai-chatbot-sessions');
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

                const uniqueSessions = sessions.filter((session, index, self) =>
                    index === self.findIndex(s => s.id === session.id)
                );

                setChatSessions(uniqueSessions);

                // Don't auto-set current chat ID here to allow page to decide logic (e.g. check URL param? or default to first/new)
                // But for parity with existing logic, we might want to.
                // Existing logic in page.tsx:
                // if (sessions.length > 0) { setCurrentChatId(sessions[0].id); setMessages(sessions[0].messages); } 
                // else { createNewChat(); }
            }
        } catch (error) {
            console.error('Error loading chat sessions:', error);
        }

        setIsInitialized(true);
    }, [isInitialized]);

    return {
        chatSessions,
        setChatSessions, // Exposed if manual manipulation needed
        currentChatId,
        setCurrentChatId,
        createNewChat,
        deleteChat,
        renameChat,
        updateChatMessages,
        isInitialized
    };
}
