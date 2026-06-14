'use client';

import React from 'react';
import { Menu, Settings, Sun, Moon, Download, Keyboard, RefreshCw, Trash2 } from 'lucide-react';
import { FeatureMode, Model } from '@/lib/types';

interface HeaderProps {
    showSidebar: boolean;
    setShowSidebar: (show: boolean) => void;
    isDarkMode: boolean;
    toggleDarkMode: () => void;
    selectedModel: string;
    models: Model[];
    featureMode: FeatureMode;
    isLoading: boolean;
    currentChatId: string;
    onOpenSettings: () => void;
    onExportChat?: () => void;
    onClearChat?: () => void;
    onRegenerateLastMessage?: () => void;
    tokenCount?: number;
    showTokenCount?: boolean;
}

const MODE_LABELS: Record<FeatureMode, string> = {
    standard: 'Standard',
    reasoning: 'Reasoning',
    'web-search': 'Web Search',
    vision: 'Vision',
    tools: 'Tools',
    mcp: 'MCP'
};

const MODE_COLORS: Record<FeatureMode, string> = {
    standard: 'bg-gray-100 text-gray-600 dark:bg-dark-800 dark:text-dark-300',
    reasoning: 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400',
    'web-search': 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400',
    vision: 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400',
    tools: 'bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-400',
    mcp: 'bg-teal-100 text-teal-700 dark:bg-teal-900/30 dark:text-teal-400'
};

export function Header({
    showSidebar,
    setShowSidebar,
    isDarkMode,
    toggleDarkMode,
    selectedModel,
    models,
    featureMode,
    isLoading,
    currentChatId,
    onOpenSettings,
    onExportChat,
    onClearChat,
    onRegenerateLastMessage,
    tokenCount,
    showTokenCount = true
}: HeaderProps) {
    const [showShortcuts, setShowShortcuts] = React.useState(false);
    const [showMenu, setShowMenu] = React.useState(false);

    const currentModel = models.find(m => m.id === selectedModel);
    const modelDisplayName = currentModel?.name || selectedModel?.split('/').pop() || 'No model selected';

    return (
        <>
            <header className="flex items-center justify-between px-4 py-3 border-b border-gray-200 dark:border-dark-800 bg-white dark:bg-dark-950 flex-shrink-0">
                {/* Left: Sidebar toggle + title */}
                <div className="flex items-center gap-3 min-w-0">
                    <button
                        onClick={() => setShowSidebar(!showSidebar)}
                        className="p-2 text-gray-500 dark:text-dark-400 hover:text-gray-700 dark:hover:text-dark-200 hover:bg-gray-100 dark:hover:bg-dark-800 rounded-lg transition-colors flex-shrink-0"
                        title="Toggle sidebar (Ctrl+B)"
                    >
                        <Menu className="w-5 h-5" />
                    </button>

                    {/* Model info */}
                    <div className="min-w-0 hidden sm:block">
                        <div className="flex items-center gap-2">
                            <span className="text-sm font-semibold text-gray-900 dark:text-dark-100 truncate max-w-48">
                                {modelDisplayName}
                            </span>
                            <span className={`text-xs px-2 py-0.5 rounded-full font-medium flex-shrink-0 ${MODE_COLORS[featureMode]}`}>
                                {MODE_LABELS[featureMode]}
                            </span>
                        </div>
                        {showTokenCount && tokenCount !== undefined && tokenCount > 0 && (
                            <div className="text-xs text-gray-400 dark:text-dark-500">
                                ~{tokenCount.toLocaleString()} tokens used
                            </div>
                        )}
                    </div>
                </div>

                {/* Right: Actions */}
                <div className="flex items-center gap-1">
                    {/* Loading indicator */}
                    {isLoading && (
                        <div className="flex items-center gap-1.5 text-xs text-blue-600 dark:text-blue-400 mr-2">
                            <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                            <span className="hidden sm:inline">Generating...</span>
                        </div>
                    )}

                    {/* Regenerate */}
                    {onRegenerateLastMessage && currentChatId && !isLoading && (
                        <button
                            onClick={onRegenerateLastMessage}
                            className="p-2 text-gray-500 dark:text-dark-400 hover:text-gray-700 dark:hover:text-dark-200 hover:bg-gray-100 dark:hover:bg-dark-800 rounded-lg transition-colors"
                            title="Regenerate last response (Ctrl+Shift+R)"
                        >
                            <RefreshCw className="w-4 h-4" />
                        </button>
                    )}

                    {/* Export */}
                    {onExportChat && currentChatId && (
                        <button
                            onClick={onExportChat}
                            className="p-2 text-gray-500 dark:text-dark-400 hover:text-gray-700 dark:hover:text-dark-200 hover:bg-gray-100 dark:hover:bg-dark-800 rounded-lg transition-colors"
                            title="Export chat (Ctrl+E)"
                        >
                            <Download className="w-4 h-4" />
                        </button>
                    )}

                    {/* Keyboard shortcuts */}
                    <button
                        onClick={() => setShowShortcuts(true)}
                        className="p-2 text-gray-500 dark:text-dark-400 hover:text-gray-700 dark:hover:text-dark-200 hover:bg-gray-100 dark:hover:bg-dark-800 rounded-lg transition-colors hidden sm:block"
                        title="Keyboard shortcuts"
                    >
                        <Keyboard className="w-4 h-4" />
                    </button>

                    {/* Dark mode toggle */}
                    <button
                        onClick={toggleDarkMode}
                        className="p-2 text-gray-500 dark:text-dark-400 hover:text-gray-700 dark:hover:text-dark-200 hover:bg-gray-100 dark:hover:bg-dark-800 rounded-lg transition-colors"
                        title="Toggle dark mode"
                    >
                        {isDarkMode ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
                    </button>

                    {/* Settings */}
                    <button
                        onClick={onOpenSettings}
                        className="p-2 text-gray-500 dark:text-dark-400 hover:text-gray-700 dark:hover:text-dark-200 hover:bg-gray-100 dark:hover:bg-dark-800 rounded-lg transition-colors"
                        title="Settings (Ctrl+,)"
                    >
                        <Settings className="w-4 h-4" />
                    </button>
                </div>
            </header>

            {/* Keyboard shortcuts modal */}
            {showShortcuts && (
                <div
                    className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm"
                    onClick={() => setShowShortcuts(false)}
                >
                    <div
                        className="bg-white dark:bg-dark-900 rounded-2xl shadow-2xl p-6 max-w-sm w-full mx-4 border border-gray-200 dark:border-dark-700"
                        onClick={(e) => e.stopPropagation()}
                    >
                        <h3 className="text-lg font-bold text-gray-900 dark:text-dark-100 mb-4">Keyboard Shortcuts</h3>
                        <div className="space-y-2">
                            {[
                                { keys: ['Enter'], desc: 'Send message' },
                                { keys: ['Shift', 'Enter'], desc: 'New line' },
                                { keys: ['Esc'], desc: 'Stop generation' },
                                { keys: ['Ctrl', 'K'], desc: 'New chat' },
                                { keys: ['Ctrl', 'B'], desc: 'Toggle sidebar' },
                                { keys: ['Ctrl', '/'], desc: 'Focus input' },
                                { keys: ['Ctrl', 'E'], desc: 'Export chat' },
                                { keys: ['Ctrl', ','], desc: 'Open settings' },
                                { keys: ['Ctrl', 'Shift', 'R'], desc: 'Regenerate response' },
                            ].map((shortcut, i) => (
                                <div key={i} className="flex items-center justify-between">
                                    <span className="text-sm text-gray-600 dark:text-dark-300">{shortcut.desc}</span>
                                    <div className="flex items-center gap-1">
                                        {shortcut.keys.map((key, j) => (
                                            <React.Fragment key={j}>
                                                {j > 0 && <span className="text-gray-400 text-xs">+</span>}
                                                <kbd className="px-2 py-0.5 text-xs bg-gray-100 dark:bg-dark-800 border border-gray-300 dark:border-dark-600 rounded font-mono text-gray-700 dark:text-dark-200">
                                                    {key}
                                                </kbd>
                                            </React.Fragment>
                                        ))}
                                    </div>
                                </div>
                            ))}
                        </div>
                        <button
                            onClick={() => setShowShortcuts(false)}
                            className="mt-4 w-full py-2 bg-gray-100 dark:bg-dark-800 hover:bg-gray-200 dark:hover:bg-dark-700 text-gray-700 dark:text-dark-200 rounded-lg text-sm transition-colors"
                        >
                            Close
                        </button>
                    </div>
                </div>
            )}
        </>
    );
}
