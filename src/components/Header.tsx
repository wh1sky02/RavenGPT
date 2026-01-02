import Link from 'next/link';
import { Bot, Menu, Sidebar, Moon, Sun, Settings } from 'lucide-react';
import { Model } from '@/lib/types';

interface HeaderProps {
    showSidebar: boolean;
    setShowSidebar: (show: boolean) => void;
    isLoadingModels: boolean;
    availableModels: Model[];
    selectedModel: string;
    isDarkMode: boolean;
    toggleDarkMode: () => void;
    filteredModels: Model[];
}

export function Header({
    showSidebar,
    setShowSidebar,
    isLoadingModels,
    availableModels,
    selectedModel,
    isDarkMode,
    toggleDarkMode,
    filteredModels
}: HeaderProps) {
    return (
        <header className="flex items-center justify-between px-4 py-3 border-b border-gray-200 dark:border-dark-800">
            <div className="flex items-center gap-3">
                <button
                    onClick={() => setShowSidebar(!showSidebar)}
                    className="p-2 rounded-md hover:bg-gray-100 dark:hover:bg-dark-800 text-gray-600 dark:text-dark-300"
                >
                    {showSidebar ? <Sidebar className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
                </button>

                <h1 className="text-lg font-semibold text-gray-900 dark:text-dark-100">
                    RavenGPT
                </h1>
            </div>

            <div className="flex items-center gap-2">
                <div className="flex items-center gap-2 px-3 py-1.5 text-sm bg-gray-50 dark:bg-dark-900 border border-gray-300 dark:border-dark-800 rounded-md">
                    <Bot className="w-4 h-4 text-gray-500 dark:text-dark-400" />
                    <span className="text-gray-700 dark:text-dark-200">
                        {isLoadingModels ? (
                            'Loading models...'
                        ) : availableModels.length === 0 ? (
                            'No models available - Please configure provider'
                        ) : (
                            (() => {
                                const currentModel = filteredModels.find(m => m.id === selectedModel);
                                return currentModel
                                    ? currentModel.name.replace(' (Free)', '').replace('Llama', 'llama').replace('Instruct', '').trim()
                                    : selectedModel ? `Model not found (${selectedModel})` : 'No model selected';
                            })()
                        )}
                    </span>
                </div>

                <button
                    onClick={toggleDarkMode}
                    className="p-2 rounded-md hover:bg-gray-100 dark:hover:bg-dark-800 text-gray-600 dark:text-dark-300 transition-colors"
                    title={isDarkMode ? 'Switch to light mode' : 'Switch to dark mode'}
                >
                    {isDarkMode ? <Sun className="w-5 h-5" /> : <Moon className="w-5 h-5" />}
                </button>

                <Link
                    href="/settings"
                    className="p-2 rounded-md hover:bg-gray-100 dark:hover:bg-dark-800 text-gray-600 dark:text-dark-300"
                >
                    <Settings className="w-5 h-5" />
                </Link>
            </div>
        </header>
    );
}
