import { Bot, Brain, Search, Image as ImageIcon } from 'lucide-react';
import { FeatureMode } from '@/lib/types';

interface FeatureModeSelectorProps {
    featureMode: FeatureMode;
    setMode: (mode: FeatureMode) => void;
    showReasoning: boolean;
    setShowReasoning: (show: boolean) => void;
}

export function FeatureModeSelector({
    featureMode,
    setMode,
    showReasoning,
    setShowReasoning
}: FeatureModeSelectorProps) {
    return (
        <div className="px-4 py-2 bg-gray-50 dark:bg-dark-925 border-b border-gray-200 dark:border-dark-800">
            <div className="flex justify-between items-center">
                <div className="flex gap-1">
                    {[
                        { mode: 'standard' as FeatureMode, icon: Bot, label: 'Auto' },
                        { mode: 'reasoning' as FeatureMode, icon: Brain, label: 'Think' },
                        { mode: 'web-search' as FeatureMode, icon: Search, label: 'Search' },
                        { mode: 'vision' as FeatureMode, icon: ImageIcon, label: 'Vision' }
                    ].map(({ mode, icon: Icon, label }) => (
                        <button
                            key={mode}
                            onClick={() => setMode(mode)}
                            className={`flex items-center gap-2 px-3 py-1.5 rounded-md text-sm transition-colors font-medium ${featureMode === mode
                                ? 'bg-gray-200 text-gray-900 dark:bg-dark-800 dark:text-dark-100'
                                : 'text-gray-600 dark:text-dark-400 hover:bg-gray-200 dark:hover:bg-dark-800'
                                }`}
                        >
                            <Icon className="w-4 h-4" />
                            {label}
                        </button>
                    ))}
                </div>

                {/* Reasoning Controls */}
                {featureMode === 'reasoning' && (
                    <div className="flex items-center gap-2">
                        <button
                            onClick={() => setShowReasoning(!showReasoning)}
                            className={`flex items-center gap-1 px-2 py-1 rounded text-xs transition-colors ${showReasoning
                                ? 'bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-300'
                                : 'bg-gray-200 text-gray-600 dark:bg-dark-800 dark:text-dark-400'
                                }`}
                        >
                            <Brain className="w-3 h-3" />
                            {showReasoning ? 'Hide Thinking' : 'Show Thinking'}
                        </button>
                    </div>
                )}
            </div>
        </div>
    );
}
