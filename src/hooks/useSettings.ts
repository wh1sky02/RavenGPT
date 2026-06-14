import { useState, useEffect, useCallback } from 'react';
import { AppSettings, DEFAULT_SETTINGS, PROVIDER_URLS, MCPServer } from '@/lib/types';

const SETTINGS_KEY = 'ravengpt-settings-v2';

export function useSettings() {
    const [settings, setSettings] = useState<AppSettings>(DEFAULT_SETTINGS);
    const [isLoaded, setIsLoaded] = useState(false);

    // Load settings from localStorage
    const loadSettings = useCallback(() => {
        try {
            const saved = localStorage.getItem(SETTINGS_KEY);
            if (saved) {
                const parsed = JSON.parse(saved);
                setSettings(prev => ({ ...prev, ...parsed }));
            } else {
                // Migrate from old storage keys
                const oldApiKey = localStorage.getItem('openrouter-api-key');
                const oldProvider = localStorage.getItem('selected-provider');
                const oldModel = localStorage.getItem('selected-model');
                const oldMaxTokens = localStorage.getItem('max-tokens');
                const oldAdaptive = localStorage.getItem('use-adaptive-tokens');
                const oldDarkMode = localStorage.getItem('dark-mode');
                const oldFeatureMode = localStorage.getItem('feature-mode');

                const migrated: Partial<AppSettings> = {};
                if (oldApiKey) migrated.apiKey = oldApiKey;
                if (oldProvider && PROVIDER_URLS[oldProvider]) {
                    migrated.providerName = oldProvider;
                    migrated.providerUrl = PROVIDER_URLS[oldProvider];
                }
                if (oldModel) migrated.selectedModel = oldModel;
                if (oldMaxTokens) migrated.maxTokens = parseInt(oldMaxTokens);
                if (oldAdaptive !== null) migrated.useAdaptiveTokens = oldAdaptive === 'true';
                if (oldDarkMode !== null) migrated.isDarkMode = oldDarkMode === 'true';
                if (oldFeatureMode) migrated.language = 'en';

                if (Object.keys(migrated).length > 0) {
                    const newSettings = { ...DEFAULT_SETTINGS, ...migrated };
                    setSettings(newSettings);
                    localStorage.setItem(SETTINGS_KEY, JSON.stringify(newSettings));
                }
            }
        } catch (error) {
            console.error('Error loading settings:', error);
        }
        setIsLoaded(true);
    }, []);

    // Save settings to localStorage
    const saveSettings = useCallback((newSettings: Partial<AppSettings>) => {
        setSettings(prev => {
            const updated = { ...prev, ...newSettings };
            try {
                localStorage.setItem(SETTINGS_KEY, JSON.stringify(updated));
            } catch (error) {
                console.error('Error saving settings:', error);
            }
            return updated;
        });
    }, []);

    // Update a single setting
    const updateSetting = useCallback(<K extends keyof AppSettings>(
        key: K,
        value: AppSettings[K]
    ) => {
        saveSettings({ [key]: value } as Partial<AppSettings>);
    }, [saveSettings]);

    // Dark mode management
    const applyDarkMode = useCallback((isDark: boolean) => {
        if (isDark) {
            document.documentElement.classList.add('dark');
        } else {
            document.documentElement.classList.remove('dark');
        }
    }, []);

    const toggleDarkMode = useCallback(() => {
        const newValue = !settings.isDarkMode;
        updateSetting('isDarkMode', newValue);
        applyDarkMode(newValue);
    }, [settings.isDarkMode, updateSetting, applyDarkMode]);

    // MCP server management
    const addMCPServer = useCallback((server: MCPServer) => {
        const updated = [...settings.mcpServers, server];
        updateSetting('mcpServers', updated);
    }, [settings.mcpServers, updateSetting]);

    const updateMCPServer = useCallback((serverId: string, updates: Partial<MCPServer>) => {
        const updated = settings.mcpServers.map(s =>
            s.id === serverId ? { ...s, ...updates } : s
        );
        updateSetting('mcpServers', updated);
    }, [settings.mcpServers, updateSetting]);

    const removeMCPServer = useCallback((serverId: string) => {
        const updated = settings.mcpServers.filter(s => s.id !== serverId);
        updateSetting('mcpServers', updated);
    }, [settings.mcpServers, updateSetting]);

    // Initialize
    useEffect(() => {
        loadSettings();
    }, [loadSettings]);

    // Apply dark mode on load
    useEffect(() => {
        if (isLoaded) {
            // Check system preference if no saved preference
            const savedDarkMode = localStorage.getItem(SETTINGS_KEY);
            if (!savedDarkMode) {
                const systemPrefersDark = window.matchMedia?.('(prefers-color-scheme: dark)').matches;
                if (systemPrefersDark) {
                    updateSetting('isDarkMode', true);
                    applyDarkMode(true);
                }
            } else {
                applyDarkMode(settings.isDarkMode);
            }
        }
    }, [isLoaded]); // eslint-disable-line react-hooks/exhaustive-deps

    // Listen for storage changes (multi-tab sync)
    useEffect(() => {
        const handleStorageChange = (e: StorageEvent) => {
            if (e.key === SETTINGS_KEY && e.newValue) {
                try {
                    const parsed = JSON.parse(e.newValue);
                    setSettings(prev => ({ ...prev, ...parsed }));
                    applyDarkMode(parsed.isDarkMode);
                } catch {
                    // Silent fail
                }
            }
        };

        window.addEventListener('storage', handleStorageChange);
        return () => window.removeEventListener('storage', handleStorageChange);
    }, [applyDarkMode]);

    return {
        settings,
        isLoaded,
        saveSettings,
        updateSetting,
        toggleDarkMode,
        applyDarkMode,
        addMCPServer,
        updateMCPServer,
        removeMCPServer,
        loadSettings,
    };
}
