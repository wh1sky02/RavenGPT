'use client';

import React from 'react';
import { Bot, Zap, Globe, Eye, Wrench, Server } from 'lucide-react';
import { FeatureMode, Model } from '@/lib/types';

interface FeatureModeSelectorProps {
    featureMode: FeatureMode;
    setFeatureMode: (mode: FeatureMode) => void;
    selectedModel: string;
    models: Model[];
    hasMCPServers?: boolean;
}

interface ModeConfig {
    id: FeatureMode;
    label: string;
    icon: React.ReactNode;
    description: string;
    requiresCapability?: keyof Model;
    alwaysAvailable?: boolean;
}

const MODES: ModeConfig[] = [
    {
        id: 'standard',
        label: 'Standard',
        icon: <Bot className="w-3.5 h-3.5" />,
        description: 'General purpose chat',
        alwaysAvailable: true
    },
    {
        id: 'reasoning',
        label: 'Reasoning',
        icon: <Zap className="w-3.5 h-3.5" />,
        description: 'Deep thinking & step-by-step reasoning',
        requiresCapability: 'supportsReasoning'
    },
    {
        id: 'web-search',
        label: 'Web Search',
        icon: <Globe className="w-3.5 h-3.5" />,
        description: 'Real-time internet access',
        requiresCapability: 'supportsWebSearch'
    },
    {
        id: 'vision',
        label: 'Vision',
        icon: <Eye className="w-3.5 h-3.5" />,
        description: 'Image analysis & understanding',
        requiresCapability: 'supportsImages'
    },
    {
        id: 'tools',
        label: 'Tools',
        icon: <Wrench className="w-3.5 h-3.5" />,
        description: 'Function calling & built-in tools',
        requiresCapability: 'supportsTools'
    },
    {
        id: 'mcp',
        label: 'MCP',
        icon: <Server className="w-3.5 h-3.5" />,
        description: 'Model Context Protocol servers',
        alwaysAvailable: true
    }
];

const MODE_ACTIVE_COLORS: Record<FeatureMode, string> = {
    standard: 'bg-gray-800 dark:bg-gray-200 text-white dark:text-gray-900',
    reasoning: 'bg-yellow-500 text-white',
    'web-search': 'bg-blue-600 text-white',
    vision: 'bg-green-600 text-white',
    tools: 'bg-orange-600 text-white',
    mcp: 'bg-teal-600 text-white'
};

export function FeatureModeSelector({
    featureMode,
    setFeatureMode,
    selectedModel,
    models,
    hasMCPServers = false
}: FeatureModeSelectorProps) {
    const currentModel = models.find(m => m.id === selectedModel);
    const [hoveredMode, setHoveredMode] = React.useState<FeatureMode | null>(null);

    const isModeAvailable = (mode: ModeConfig): boolean => {
        if (mode.alwaysAvailable) {
            if (mode.id === 'mcp') return hasMCPServers;
            return true;
        }
        if (!currentModel || !mode.requiresCapability) return false;
        return !!currentModel[mode.requiresCapability];
    };

    return (
        <div className="px-4 py-2 border-b border-gray-200 dark:border-dark-800 bg-white dark:bg-dark-950">
            <div className="max-w-3xl mx-auto">
                <div className="flex items-center gap-1 overflow-x-auto scrollbar-hide">
                    {MODES.map((mode) => {
                        const available = isModeAvailable(mode);
                        const isActive = featureMode === mode.id;

                        return (
                            <div key={mode.id} className="relative flex-shrink-0">
                                <button
                                    onClick={() => available && setFeatureMode(mode.id)}
                                    disabled={!available}
                                    onMouseEnter={() => setHoveredMode(mode.id)}
                                    onMouseLeave={() => setHoveredMode(null)}
                                    className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium transition-all ${isActive
                                        ? MODE_ACTIVE_COLORS[mode.id]
                                        : available
                                            ? 'text-gray-600 dark:text-dark-300 hover:bg-gray-100 dark:hover:bg-dark-800'
                                            : 'text-gray-300 dark:text-dark-600 cursor-not-allowed opacity-50'
                                        }`}
                                    title={available ? mode.description : `${mode.description} (not supported by selected model)`}
                                >
                                    {mode.icon}
                                    <span>{mode.label}</span>
                                </button>

                                {/* Tooltip */}
                                {hoveredMode === mode.id && (
                                    <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 px-2 py-1 bg-gray-900 dark:bg-gray-100 text-white dark:text-gray-900 text-xs rounded whitespace-nowrap z-50 pointer-events-none">
                                        {available ? mode.description : `Not supported by ${currentModel?.name || 'selected model'}`}
                                        <div className="absolute top-full left-1/2 -translate-x-1/2 border-4 border-transparent border-t-gray-900 dark:border-t-gray-100" />
                                    </div>
                                )}
                            </div>
                        );
                    })}
                </div>
            </div>
        </div>
    );
}
