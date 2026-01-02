import { Search, Plus, Edit3, Trash2 } from 'lucide-react';
import { ChatSession } from '@/lib/types';

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
    deleteChat
}: SidebarProps) {
    return (
        <div className={`${showSidebar ? 'w-64' : 'w-0'} transition-all duration-200 overflow-hidden bg-gray-50 dark:bg-dark-925 border-r border-gray-200 dark:border-dark-800 flex flex-col`}>
            <div className="p-3">
                <div className="relative mb-3">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400 dark:text-dark-400" />
                    <input
                        type="text"
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        placeholder="Search chats..."
                        className="w-full pl-10 pr-3 py-2 text-sm bg-white dark:bg-dark-900 border border-gray-300 dark:border-dark-800 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-900 dark:text-dark-100 placeholder-gray-500 dark:placeholder-dark-400"
                    />
                </div>

                <button
                    onClick={createNewChat}
                    className="w-full flex items-center gap-3 px-3 py-2.5 text-gray-700 dark:text-dark-100 border border-gray-300 dark:border-dark-800 rounded-md hover:bg-gray-100 dark:hover:bg-dark-850 transition-colors text-sm"
                >
                    <Plus className="w-4 h-4" />
                    New chat
                </button>
            </div>

            <div className="flex-1 overflow-y-auto px-3 pb-3">
                {filteredChatSessions.length === 0 ? (
                    <div className="text-center py-8">
                        <div className="text-gray-500 dark:text-dark-400 text-sm">
                            {searchQuery ? 'No chats found' : chatSessions.length === 0 ? 'No chats yet' : 'No matching chats'}
                        </div>
                        {searchQuery && (
                            <button
                                onClick={() => setSearchQuery('')}
                                className="text-blue-500 hover:text-blue-600 dark:text-blue-400 dark:hover:text-blue-300 text-sm mt-2"
                            >
                                Clear search
                            </button>
                        )}
                        {chatSessions.length === 0 && (
                            <p className="text-gray-400 dark:text-dark-500 text-xs mt-2">
                                Create a new chat to get started
                            </p>
                        )}
                    </div>
                ) : (
                    filteredChatSessions.map((chat) => (
                        <div
                            key={chat.id}
                            className={`group relative p-3 rounded-md cursor-pointer transition-colors mb-1 ${currentChatId === chat.id
                                ? 'bg-gray-200 dark:bg-dark-850'
                                : 'hover:bg-gray-100 dark:hover:bg-dark-900'
                                }`}
                            onClick={() => switchToChat(chat.id)}
                        >
                            {editingChatId === chat.id ? (
                                <input
                                    type="text"
                                    value={editingTitle}
                                    onChange={(e) => setEditingTitle(e.target.value)}
                                    onBlur={() => renameChat(chat.id, editingTitle || chat.title)}
                                    onKeyDown={(e) => {
                                        if (e.key === 'Enter') {
                                            renameChat(chat.id, editingTitle || chat.title);
                                        }
                                        if (e.key === 'Escape') {
                                            setEditingChatId(null);
                                            setEditingTitle('');
                                        }
                                    }}
                                    className="w-full text-sm bg-transparent border-none outline-none text-gray-900 dark:text-dark-100"
                                    autoFocus
                                />
                            ) : (
                                <div className="flex items-center justify-between">
                                    <div className="flex-1 min-w-0">
                                        <div className="text-sm text-gray-900 dark:text-dark-100 truncate">{chat.title}</div>
                                    </div>

                                    <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                        <button
                                            onClick={(e) => {
                                                e.stopPropagation();
                                                setEditingChatId(chat.id);
                                                setEditingTitle(chat.title);
                                            }}
                                            className="p-1.5 hover:bg-gray-100 dark:hover:bg-dark-800 rounded text-gray-500 dark:text-dark-400 hover:text-gray-700 dark:hover:text-dark-200"
                                        >
                                            <Edit3 className="w-3 h-3" />
                                        </button>
                                        <button
                                            onClick={(e) => {
                                                e.stopPropagation();
                                                deleteChat(chat.id);
                                            }}
                                            className="p-1.5 hover:bg-gray-100 dark:hover:bg-dark-800 rounded text-gray-500 dark:text-dark-400 hover:text-gray-700 dark:hover:text-dark-200"
                                        >
                                            <Trash2 className="w-3 h-3" />
                                        </button>
                                    </div>
                                </div>
                            )}
                        </div>
                    ))
                )}
            </div>
        </div>
    );
}
