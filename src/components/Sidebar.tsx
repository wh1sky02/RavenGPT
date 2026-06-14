'use client';

import React, { useState, useCallback } from 'react';
import { Search, Plus, Edit3, Trash2, Pin, PinOff, Copy, Download, Upload, MoreVertical, MessageSquare, ChevronDown } from 'lucide-react';
import { ChatSession } from '@/lib/types';
import { exportChatToMarkdown, exportChatToJSON } from '@/lib/api';

interface SidebarProps {
    showSidebar: boolean;
    searchQuery: string;
    setSearchQuery: (query: string) => void;
    chatSessions: ChatSession[];
    filteredChatSessions: ChatSession[];
    createNewChat: () => void;
    switchToChat: (chatId: string) => void;
    currentChatId: string;
    editingChatId: string | null;
    setEditingChatId: (id: string | null) => void;
    editingTitle: string;
    setEditingTitle: (title: string) => void;
    renameChat: (chatId: string, newTitle: string) => void;
    deleteChat: (chatId: string) => void;
    deleteAllChats?: () => void;
    pinChat?: (chatId: string, pinned: boolean) => void;
    duplicateChat?: (chatId: string) => void;
    importChat?: (file: File) => void;
    exportFormat?: 'markdown' | 'json' | 'txt';
}

export function Sidebar({
    showSidebar,
    searchQuery,
    setSearchQuery,
    chatSessions,
    filteredChatSessions,
    createNewChat,
    switchToChat,
    currentChatId,
    editingChatId,
    setEditingChatId,
    editingTitle,
    setEditingTitle,
    renameChat,
    deleteChat,
    deleteAllChats,
    pinChat,
    duplicateChat,
    importChat,
    exportFormat = 'markdown'
}: SidebarProps) {
    const [openMenuId, setOpenMenuId] = useState<string | null>(null);
    const [showDeleteAllConfirm, setShowDeleteAllConfirm] = useState(false);
    const importFileRef = React.useRef<HTMLInputElement>(null);

    const handleExportChat = useCallback((chat: ChatSession, e: React.MouseEvent) => {
        e.stopPropagation();
        setOpenMenuId(null);
        const content = exportFormat === 'json'
            ? exportChatToJSON(chat)
            : exportChatToMarkdown(chat);
        const ext = exportFormat === 'json' ? 'json' : 'md';
        const blob = new Blob([content], { type: 'text/plain;charset=utf-8' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `${chat.title.replace(/[^a-z0-9]/gi, '_')}.${ext}`;
        a.click();
        URL.revokeObjectURL(url);
    }, [exportFormat]);

    const handleImportFile = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file && importChat) {
            importChat(file);
        }
        if (e.target) e.target.value = '';
    }, [importChat]);

    const formatDate = (date: Date) => {
        const now = new Date();
        const diff = now.getTime() - date.getTime();
        const days = Math.floor(diff / (1000 * 60 * 60 * 24));

        if (days === 0) return 'Today';
        if (days === 1) return 'Yesterday';
        if (days < 7) return `${days} days ago`;
        if (days < 30) return `${Math.floor(days / 7)} weeks ago`;
        return date.toLocaleDateString();
    };

    // Group chats by date
    const groupedChats = filteredChatSessions.reduce((groups, chat) => {
        const dateLabel = chat.isPinned ? 'Pinned' : formatDate(chat.updatedAt);
        if (!groups[dateLabel]) groups[dateLabel] = [];
        groups[dateLabel].push(chat);
        return groups;
    }, {} as Record<string, ChatSession[]>);

    const groupOrder = ['Pinned', 'Today', 'Yesterday', ...Object.keys(groupedChats).filter(k => !['Pinned', 'Today', 'Yesterday'].includes(k))];

    return (
        <>
            <div className={`${showSidebar ? 'w-64 sm:w-72' : 'w-0'} transition-all duration-200 overflow-hidden bg-gray-50 dark:bg-dark-925 border-r border-gray-200 dark:border-dark-800 flex flex-col flex-shrink-0`}>
                {/* Header */}
                <div className="p-3 border-b border-gray-200 dark:border-dark-800">
                    <div className="flex items-center gap-2 mb-3">
                        <div className="relative flex-1">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-gray-400" />
                            <input
                                type="text"
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                                placeholder="Search chats..."
                                className="w-full pl-9 pr-3 py-2 text-xs bg-white dark:bg-dark-900 border border-gray-200 dark:border-dark-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-900 dark:text-dark-100 placeholder-gray-400 dark:placeholder-dark-500"
                            />
                        </div>
                        {importChat && (
                            <button
                                onClick={() => importFileRef.current?.click()}
                                className="p-2 text-gray-500 dark:text-dark-400 hover:text-gray-700 dark:hover:text-dark-200 hover:bg-gray-200 dark:hover:bg-dark-800 rounded-lg transition-colors"
                                title="Import chat"
                            >
                                <Upload className="w-3.5 h-3.5" />
                            </button>
                        )}
                    </div>
                    <button
                        onClick={createNewChat}
                        className="w-full flex items-center gap-2 px-3 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors text-sm font-medium"
                    >
                        <Plus className="w-4 h-4" />
                        New Chat
                    </button>
                </div>

                {/* Chat list */}
                <div className="flex-1 overflow-y-auto py-2">
                    {filteredChatSessions.length === 0 ? (
                        <div className="text-center py-8 px-4">
                            <MessageSquare className="w-8 h-8 text-gray-300 dark:text-dark-600 mx-auto mb-3" />
                            <p className="text-sm text-gray-500 dark:text-dark-400">
                                {searchQuery ? 'No chats found' : 'No chats yet'}
                            </p>
                            {searchQuery && (
                                <button
                                    onClick={() => setSearchQuery('')}
                                    className="text-blue-500 hover:text-blue-600 text-xs mt-2"
                                >
                                    Clear search
                                </button>
                            )}
                        </div>
                    ) : (
                        groupOrder.map(groupLabel => {
                            const chats = groupedChats[groupLabel];
                            if (!chats || chats.length === 0) return null;

                            return (
                                <div key={groupLabel} className="mb-2">
                                    <div className="px-3 py-1">
                                        <span className="text-xs font-semibold text-gray-400 dark:text-dark-500 uppercase tracking-wider">
                                            {groupLabel}
                                        </span>
                                    </div>
                                    {chats.map((chat) => (
                                        <div
                                            key={chat.id}
                                            className={`group relative mx-2 px-3 py-2.5 rounded-lg cursor-pointer transition-colors mb-0.5 ${currentChatId === chat.id
                                                ? 'bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800'
                                                : 'hover:bg-gray-100 dark:hover:bg-dark-850'
                                                }`}
                                            onClick={() => {
                                                if (openMenuId === chat.id) return;
                                                switchToChat(chat.id);
                                            }}
                                        >
                                            {editingChatId === chat.id ? (
                                                <input
                                                    type="text"
                                                    value={editingTitle}
                                                    onChange={(e) => setEditingTitle(e.target.value)}
                                                    onBlur={() => {
                                                        renameChat(chat.id, editingTitle || chat.title);
                                                        setEditingChatId(null);
                                                    }}
                                                    onKeyDown={(e) => {
                                                        if (e.key === 'Enter') {
                                                            renameChat(chat.id, editingTitle || chat.title);
                                                            setEditingChatId(null);
                                                        }
                                                        if (e.key === 'Escape') {
                                                            setEditingChatId(null);
                                                        }
                                                    }}
                                                    className="w-full text-xs bg-white dark:bg-dark-800 border border-blue-400 rounded px-2 py-1 focus:outline-none text-gray-900 dark:text-dark-100"
                                                    autoFocus
                                                    onClick={(e) => e.stopPropagation()}
                                                />
                                            ) : (
                                                <>
                                                    <div className="flex items-start gap-2">
                                                        {chat.isPinned && (
                                                            <Pin className="w-3 h-3 text-blue-500 flex-shrink-0 mt-0.5" />
                                                        )}
                                                        <div className="flex-1 min-w-0">
                                                            <p className={`text-xs font-medium truncate ${currentChatId === chat.id
                                                                ? 'text-blue-700 dark:text-blue-300'
                                                                : 'text-gray-800 dark:text-dark-100'
                                                                }`}>
                                                                {chat.title}
                                                            </p>
                                                            <p className="text-xs text-gray-400 dark:text-dark-500 mt-0.5 truncate">
                                                                {chat.messages.length} messages
                                                                {chat.totalTokens ? ` · ${(chat.totalTokens / 1000).toFixed(1)}K tokens` : ''}
                                                            </p>
                                                        </div>
                                                    </div>

                                                    {/* Context menu button */}
                                                    <div className="absolute right-2 top-2 opacity-0 group-hover:opacity-100 transition-opacity">
                                                        <button
                                                            onClick={(e) => {
                                                                e.stopPropagation();
                                                                setOpenMenuId(openMenuId === chat.id ? null : chat.id);
                                                            }}
                                                            className="p-1 rounded hover:bg-gray-200 dark:hover:bg-dark-700 transition-colors"
                                                        >
                                                            <MoreVertical className="w-3.5 h-3.5 text-gray-500 dark:text-dark-400" />
                                                        </button>
                                                    </div>

                                                    {/* Context menu */}
                                                    {openMenuId === chat.id && (
                                                        <div
                                                            className="absolute right-2 top-8 z-50 bg-white dark:bg-dark-800 border border-gray-200 dark:border-dark-700 rounded-lg shadow-lg py-1 min-w-36"
                                                            onClick={(e) => e.stopPropagation()}
                                                        >
                                                            <button
                                                                onClick={(e) => {
                                                                    e.stopPropagation();
                                                                    setEditingChatId(chat.id);
                                                                    setEditingTitle(chat.title);
                                                                    setOpenMenuId(null);
                                                                }}
                                                                className="w-full flex items-center gap-2 px-3 py-2 text-xs text-gray-700 dark:text-dark-200 hover:bg-gray-100 dark:hover:bg-dark-700 transition-colors"
                                                            >
                                                                <Edit3 className="w-3.5 h-3.5" />
                                                                Rename
                                                            </button>
                                                            {pinChat && (
                                                                <button
                                                                    onClick={(e) => {
                                                                        e.stopPropagation();
                                                                        pinChat(chat.id, !chat.isPinned);
                                                                        setOpenMenuId(null);
                                                                    }}
                                                                    className="w-full flex items-center gap-2 px-3 py-2 text-xs text-gray-700 dark:text-dark-200 hover:bg-gray-100 dark:hover:bg-dark-700 transition-colors"
                                                                >
                                                                    {chat.isPinned ? <PinOff className="w-3.5 h-3.5" /> : <Pin className="w-3.5 h-3.5" />}
                                                                    {chat.isPinned ? 'Unpin' : 'Pin'}
                                                                </button>
                                                            )}
                                                            {duplicateChat && (
                                                                <button
                                                                    onClick={(e) => {
                                                                        e.stopPropagation();
                                                                        duplicateChat(chat.id);
                                                                        setOpenMenuId(null);
                                                                    }}
                                                                    className="w-full flex items-center gap-2 px-3 py-2 text-xs text-gray-700 dark:text-dark-200 hover:bg-gray-100 dark:hover:bg-dark-700 transition-colors"
                                                                >
                                                                    <Copy className="w-3.5 h-3.5" />
                                                                    Duplicate
                                                                </button>
                                                            )}
                                                            <button
                                                                onClick={(e) => handleExportChat(chat, e)}
                                                                className="w-full flex items-center gap-2 px-3 py-2 text-xs text-gray-700 dark:text-dark-200 hover:bg-gray-100 dark:hover:bg-dark-700 transition-colors"
                                                            >
                                                                <Download className="w-3.5 h-3.5" />
                                                                Export
                                                            </button>
                                                            <div className="border-t border-gray-100 dark:border-dark-700 my-1" />
                                                            <button
                                                                onClick={(e) => {
                                                                    e.stopPropagation();
                                                                    deleteChat(chat.id);
                                                                    setOpenMenuId(null);
                                                                }}
                                                                className="w-full flex items-center gap-2 px-3 py-2 text-xs text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors"
                                                            >
                                                                <Trash2 className="w-3.5 h-3.5" />
                                                                Delete
                                                            </button>
                                                        </div>
                                                    )}
                                                </>
                                            )}
                                        </div>
                                    ))}
                                </div>
                            );
                        })
                    )}
                </div>

                {/* Footer */}
                {deleteAllChats && chatSessions.length > 0 && (
                    <div className="p-3 border-t border-gray-200 dark:border-dark-800">
                        {showDeleteAllConfirm ? (
                            <div className="flex items-center gap-2">
                                <span className="text-xs text-gray-600 dark:text-dark-300 flex-1">Delete all chats?</span>
                                <button
                                    onClick={() => {
                                        deleteAllChats();
                                        setShowDeleteAllConfirm(false);
                                    }}
                                    className="px-2 py-1 text-xs bg-red-600 text-white rounded hover:bg-red-700 transition-colors"
                                >
                                    Yes
                                </button>
                                <button
                                    onClick={() => setShowDeleteAllConfirm(false)}
                                    className="px-2 py-1 text-xs bg-gray-200 dark:bg-dark-700 text-gray-700 dark:text-dark-200 rounded hover:bg-gray-300 transition-colors"
                                >
                                    No
                                </button>
                            </div>
                        ) : (
                            <button
                                onClick={() => setShowDeleteAllConfirm(true)}
                                className="w-full flex items-center gap-2 px-3 py-2 text-xs text-gray-500 dark:text-dark-400 hover:text-red-600 dark:hover:text-red-400 hover:bg-gray-100 dark:hover:bg-dark-800 rounded-lg transition-colors"
                            >
                                <Trash2 className="w-3.5 h-3.5" />
                                Clear all chats
                            </button>
                        )}
                    </div>
                )}
            </div>

            {/* Click outside to close menu */}
            {openMenuId && (
                <div
                    className="fixed inset-0 z-40"
                    onClick={() => setOpenMenuId(null)}
                />
            )}

            {/* Hidden import file input */}
            <input
                ref={importFileRef}
                type="file"
                accept=".json,.md,.txt"
                onChange={handleImportFile}
                className="hidden"
            />
        </>
    );
}
