'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import {
    ArrowLeft, Key, Bot, Brain, Sliders, Server, Palette, Info,
    Eye, EyeOff, RefreshCw, Check, X, Plus, Trash2, ExternalLink,
    Search, Zap, Image as ImageIcon, Wrench, Edit3, Save,
    Copy, AlertCircle, CheckCircle, RotateCcw
} from 'lucide-react';
import Link from 'next/link';
import { useSettings } from '@/hooks/useSettings';
import { Model, PROVIDER_URLS, PERSONAS, MCPServer, Persona, MCP_SERVER_PRESETS, AppSettings } from '@/lib/types';
import { fetchOpenRouterModels, fetchGroqModels, fetchTogetherAIModels } from '@/lib/api';

type SettingsTab = 'api' | 'models' | 'parameters' | 'personas' | 'mcp' | 'appearance' | 'about';

const TABS: { id: SettingsTab; label: string; icon: React.ReactNode }[] = [
    { id: 'api', label: 'API', icon: <Key className="w-4 h-4" /> },
    { id: 'models', label: 'Models', icon: <Bot className="w-4 h-4" /> },
    { id: 'parameters', label: 'Parameters', icon: <Sliders className="w-4 h-4" /> },
    { id: 'personas', label: 'Personas', icon: <Brain className="w-4 h-4" /> },
    { id: 'mcp', label: 'MCP', icon: <Server className="w-4 h-4" /> },
    { id: 'appearance', label: 'Appearance', icon: <Palette className="w-4 h-4" /> },
    { id: 'about', label: 'About', icon: <Info className="w-4 h-4" /> },
];

export default function SettingsPage() {
    const { settings, saveSettings, updateSetting, addMCPServer, updateMCPServer, removeMCPServer, loadSettings } = useSettings();

    const [activeTab, setActiveTab] = useState<SettingsTab>('api');
    const [showApiKey, setShowApiKey] = useState(false);
    const [models, setModels] = useState<Model[]>([]);
    const [modelsLoading, setModelsLoading] = useState(false);
    const [modelsError, setModelsError] = useState<string | null>(null);
    const [modelSearch, setModelSearch] = useState('');
    const [modelFilter, setModelFilter] = useState<'all' | 'free' | 'vision' | 'tools' | 'reasoning'>('all');
    const [saveStatus, setSaveStatus] = useState<'idle' | 'saving' | 'saved' | 'error'>('idle');
    const [apiTestStatus, setApiTestStatus] = useState<'idle' | 'testing' | 'success' | 'error'>('idle');
    const [apiTestMessage, setApiTestMessage] = useState('');
    const [localSettings, setLocalSettings] = useState<AppSettings>({ ...settings });
    const [isDirty, setIsDirty] = useState(false);
    const [newMCPServer, setNewMCPServer] = useState<Partial<MCPServer>>({ name: '', url: '', transport: 'sse', enabled: true, description: '' });
    const [showMCPForm, setShowMCPForm] = useState(false);
    const [editingPersona, setEditingPersona] = useState<Partial<Persona> | null>(null);
    const [showPersonaForm, setShowPersonaForm] = useState(false);

    useEffect(() => { setLocalSettings({ ...settings }); }, [settings]);

    const updateLocal = useCallback(<K extends keyof AppSettings>(key: K, value: AppSettings[K]) => {
        setLocalSettings(prev => ({ ...prev, [key]: value }));
        setIsDirty(true);
    }, []);

    const handleSave = useCallback(async () => {
        setSaveStatus('saving');
        try {
            saveSettings(localSettings);
            setIsDirty(false);
            setSaveStatus('saved');
            setTimeout(() => setSaveStatus('idle'), 2000);
        } catch {
            setSaveStatus('error');
            setTimeout(() => setSaveStatus('idle'), 3000);
        }
    }, [localSettings, saveSettings]);

    const handleReset = useCallback(() => {
        if (confirm('Reset all settings to defaults? This cannot be undone.')) {
            loadSettings();
            setIsDirty(false);
        }
    }, [loadSettings]);

    const loadModels = useCallback(async () => {
        if (!localSettings.apiKey) { setModelsError('Please enter an API key first.'); return; }
        setModelsLoading(true);
        setModelsError(null);
        try {
            let fetchedModels: Model[] = [];
            if (localSettings.providerName === 'OpenRouter') {
                fetchedModels = await fetchOpenRouterModels(localSettings.apiKey);
            } else if (localSettings.providerName === 'Groq') {
                fetchedModels = await fetchGroqModels(localSettings.apiKey);
            } else if (localSettings.providerName === 'Together AI') {
                fetchedModels = await fetchTogetherAIModels(localSettings.apiKey);
            }
            setModels(fetchedModels);
        } catch (err) {
            setModelsError(err instanceof Error ? err.message : 'Failed to load models');
        } finally {
            setModelsLoading(false);
        }
    }, [localSettings.apiKey, localSettings.providerName]);

    const testApiKey = useCallback(async () => {
        if (!localSettings.apiKey) return;
        setApiTestStatus('testing');
        setApiTestMessage('');
        try {
            const url = localSettings.providerUrl || PROVIDER_URLS[localSettings.providerName] || PROVIDER_URLS['OpenRouter'];
            const response = await fetch(url, {
                method: 'POST',
                headers: { 'Authorization': `Bearer ${localSettings.apiKey}`, 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    model: localSettings.selectedModel || 'openai/gpt-4o-mini',
                    messages: [{ role: 'user', content: 'Reply with just "OK".' }],
                    max_tokens: 5
                })
            });
            if (response.ok) {
                const data = await response.json();
                const reply = data.choices?.[0]?.message?.content || 'Connected';
                setApiTestStatus('success');
                setApiTestMessage(`API working! Response: "${reply.trim()}"`);
            } else {
                const err = await response.json().catch(() => ({ error: { message: response.statusText } }));
                setApiTestStatus('error');
                setApiTestMessage(err.error?.message || response.statusText);
            }
        } catch (err) {
            setApiTestStatus('error');
            setApiTestMessage(err instanceof Error ? err.message : 'Connection failed');
        }
    }, [localSettings.apiKey, localSettings.providerName, localSettings.providerUrl, localSettings.selectedModel]);

    const filteredModels = models.filter(model => {
        const matchesSearch = !modelSearch || model.name.toLowerCase().includes(modelSearch.toLowerCase()) || model.id.toLowerCase().includes(modelSearch.toLowerCase());
        const matchesFilter = modelFilter === 'all' || (modelFilter === 'free' && model.isFree) || (modelFilter === 'vision' && model.supportsImages) || (modelFilter === 'tools' && model.supportsTools) || (modelFilter === 'reasoning' && model.supportsReasoning);
        return matchesSearch && matchesFilter;
    });

    const handleAddMCPServer = useCallback(() => {
        if (!newMCPServer.name || !newMCPServer.url) return;
        const server: MCPServer = {
            id: `mcp_${Date.now()}`,
            name: newMCPServer.name!,
            url: newMCPServer.url!,
            transport: newMCPServer.transport || 'sse',
            enabled: newMCPServer.enabled ?? true,
            description: newMCPServer.description || '',
            status: 'disconnected'
        };
        if (newMCPServer.apiKey) server.apiKey = newMCPServer.apiKey;
        addMCPServer(server);
        setNewMCPServer({ name: '', url: '', transport: 'sse', enabled: true, description: '' });
        setShowMCPForm(false);
    }, [newMCPServer, addMCPServer]);

    const handleAddPreset = useCallback((preset: typeof MCP_SERVER_PRESETS[0]) => {
        addMCPServer({ id: `mcp_${Date.now()}`, name: preset.name, url: preset.url, transport: preset.transport, enabled: false, description: preset.description || '', status: 'disconnected' });
    }, [addMCPServer]);

    const handleSavePersona = useCallback(() => {
        if (!editingPersona?.name || !editingPersona?.systemPrompt) return;
        const persona: Persona = {
            id: editingPersona.id || `persona_${Date.now()}`,
            name: editingPersona.name,
            description: editingPersona.description || '',
            systemPrompt: editingPersona.systemPrompt,
            icon: editingPersona.icon || '🤖',
            isCustom: true
        };
        const existing = localSettings.personas || [];
        const idx = existing.findIndex(p => p.id === persona.id);
        const updated = idx >= 0 ? existing.map((p, i) => i === idx ? persona : p) : [...existing, persona];
        updateLocal('personas', updated);
        setEditingPersona(null);
        setShowPersonaForm(false);
    }, [editingPersona, localSettings.personas, updateLocal]);

    const Toggle = ({ value, onChange }: { value: boolean; onChange: () => void }) => (
        <button onClick={onChange} className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${value ? 'bg-blue-600' : 'bg-gray-300 dark:bg-dark-600'}`}>
            <span className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${value ? 'translate-x-6' : 'translate-x-1'}`} />
        </button>
    );

    return (
        <div className="min-h-screen bg-gray-50 dark:bg-dark-950">
            {/* Sticky header */}
            <div className="sticky top-0 z-10 bg-white dark:bg-dark-950 border-b border-gray-200 dark:border-dark-800">
                <div className="max-w-4xl mx-auto px-4 py-3 flex items-center justify-between">
                    <div className="flex items-center gap-3">
                        <Link href="/" className="p-2 text-gray-500 hover:text-gray-700 dark:text-dark-400 dark:hover:text-dark-200 hover:bg-gray-100 dark:hover:bg-dark-800 rounded-lg transition-colors">
                            <ArrowLeft className="w-5 h-5" />
                        </Link>
                        <div>
                            <h1 className="text-base font-bold text-gray-900 dark:text-dark-100">Settings</h1>
                            {isDirty && <p className="text-xs text-orange-500">Unsaved changes</p>}
                        </div>
                    </div>
                    <div className="flex items-center gap-2">
                        <button onClick={handleReset} className="p-2 text-gray-400 hover:text-gray-600 dark:hover:text-dark-200 hover:bg-gray-100 dark:hover:bg-dark-800 rounded-lg transition-colors" title="Reset to defaults">
                            <RotateCcw className="w-4 h-4" />
                        </button>
                        <button onClick={handleSave} disabled={!isDirty} className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all ${isDirty ? 'bg-blue-600 hover:bg-blue-700 text-white' : 'bg-gray-100 dark:bg-dark-800 text-gray-400 dark:text-dark-500 cursor-not-allowed'}`}>
                            {saveStatus === 'saving' ? <RefreshCw className="w-4 h-4 animate-spin" /> : saveStatus === 'saved' ? <Check className="w-4 h-4" /> : <Save className="w-4 h-4" />}
                            {saveStatus === 'saved' ? 'Saved!' : 'Save'}
                        </button>
                    </div>
                </div>
                <div className="max-w-4xl mx-auto px-4">
                    <div className="flex items-center gap-0 overflow-x-auto scrollbar-hide">
                        {TABS.map(tab => (
                            <button key={tab.id} onClick={() => setActiveTab(tab.id)} className={`flex items-center gap-1.5 px-4 py-3 text-sm font-medium border-b-2 transition-colors whitespace-nowrap ${activeTab === tab.id ? 'border-blue-600 text-blue-600 dark:text-blue-400' : 'border-transparent text-gray-600 dark:text-dark-400 hover:text-gray-900 dark:hover:text-dark-200'}`}>
                                {tab.icon}{tab.label}
                            </button>
                        ))}
                    </div>
                </div>
            </div>

            <div className="max-w-4xl mx-auto px-4 py-6 space-y-4">

                {/* API TAB */}
                {activeTab === 'api' && (
                    <>
                        <div className="bg-white dark:bg-dark-900 rounded-xl border border-gray-200 dark:border-dark-700 p-5">
                            <h2 className="text-sm font-semibold text-gray-900 dark:text-dark-100 mb-4">API Provider</h2>
                            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 mb-4">
                                {Object.keys(PROVIDER_URLS).map(p => (
                                    <button key={p} onClick={() => { updateLocal('providerName', p); updateLocal('providerUrl', PROVIDER_URLS[p] || ''); }} className={`p-2.5 rounded-lg border text-xs font-medium transition-all ${localSettings.providerName === p ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20 text-blue-700 dark:text-blue-300' : 'border-gray-200 dark:border-dark-700 text-gray-700 dark:text-dark-200 hover:border-gray-300'}`}>
                                        {p}
                                    </button>
                                ))}
                            </div>
                            {localSettings.providerName === 'Custom API URL' && (
                                <input type="url" value={localSettings.providerUrl} onChange={(e) => updateLocal('providerUrl', e.target.value)} placeholder="https://your-api.com/v1/chat/completions" className="w-full px-3 py-2 border border-gray-300 dark:border-dark-700 rounded-lg bg-white dark:bg-dark-800 text-gray-900 dark:text-dark-100 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 mb-4" />
                            )}
                            <label className="block text-sm font-medium text-gray-700 dark:text-dark-200 mb-1.5">
                                API Key
                                <a href="https://openrouter.ai/keys" target="_blank" rel="noopener noreferrer" className="ml-2 text-blue-500 hover:text-blue-600 text-xs inline-flex items-center gap-1">Get key <ExternalLink className="w-3 h-3" /></a>
                            </label>
                            <div className="relative mb-4">
                                <input type={showApiKey ? 'text' : 'password'} value={localSettings.apiKey} onChange={(e) => updateLocal('apiKey', e.target.value)} placeholder="sk-or-v1-..." className="w-full px-3 py-2 pr-20 border border-gray-300 dark:border-dark-700 rounded-lg bg-white dark:bg-dark-800 text-gray-900 dark:text-dark-100 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 font-mono" />
                                <div className="absolute right-2 top-1/2 -translate-y-1/2 flex items-center gap-1">
                                    <button onClick={() => setShowApiKey(!showApiKey)} className="p-1.5 text-gray-400 hover:text-gray-600 rounded">{showApiKey ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}</button>
                                    {localSettings.apiKey && <button onClick={() => navigator.clipboard.writeText(localSettings.apiKey)} className="p-1.5 text-gray-400 hover:text-gray-600 rounded"><Copy className="w-4 h-4" /></button>}
                                </div>
                            </div>
                            <div className="flex items-center gap-3">
                                <button onClick={testApiKey} disabled={!localSettings.apiKey || apiTestStatus === 'testing'} className="flex items-center gap-2 px-4 py-2 bg-gray-100 dark:bg-dark-800 hover:bg-gray-200 dark:hover:bg-dark-700 text-gray-700 dark:text-dark-200 rounded-lg text-sm font-medium transition-colors disabled:opacity-50">
                                    {apiTestStatus === 'testing' ? <RefreshCw className="w-4 h-4 animate-spin" /> : apiTestStatus === 'success' ? <CheckCircle className="w-4 h-4 text-green-500" /> : apiTestStatus === 'error' ? <AlertCircle className="w-4 h-4 text-red-500" /> : <Zap className="w-4 h-4" />}
                                    Test Connection
                                </button>
                                {apiTestMessage && <span className={`text-sm ${apiTestStatus === 'success' ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'}`}>{apiTestMessage}</span>}
                            </div>
                        </div>

                        <div className="bg-white dark:bg-dark-900 rounded-xl border border-gray-200 dark:border-dark-700 p-5">
                            <h2 className="text-sm font-semibold text-gray-900 dark:text-dark-100 mb-2">Default System Prompt</h2>
                            <p className="text-xs text-gray-500 dark:text-dark-400 mb-3">Instructions given to the AI at the start of every conversation.</p>
                            <textarea value={localSettings.systemPrompt} onChange={(e) => updateLocal('systemPrompt', e.target.value)} placeholder="You are a helpful AI assistant..." rows={5} className="w-full px-3 py-2 border border-gray-300 dark:border-dark-700 rounded-lg bg-white dark:bg-dark-800 text-gray-900 dark:text-dark-100 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 resize-y" />
                            <div className="flex justify-between mt-1">
                                <span className="text-xs text-gray-400">{localSettings.systemPrompt.length} chars</span>
                                <button onClick={() => updateLocal('systemPrompt', '')} className="text-xs text-red-500 hover:text-red-600">Clear</button>
                            </div>
                        </div>
                    </>
                )}

                {/* MODELS TAB */}
                {activeTab === 'models' && (
                    <div className="bg-white dark:bg-dark-900 rounded-xl border border-gray-200 dark:border-dark-700 p-5">
                        <div className="flex items-center justify-between mb-4">
                            <div>
                                <h2 className="text-sm font-semibold text-gray-900 dark:text-dark-100">Model Selection</h2>
                                <p className="text-xs text-gray-500 dark:text-dark-400 mt-0.5">{localSettings.selectedModel ? `Selected: ${models.find(m => m.id === localSettings.selectedModel)?.name || localSettings.selectedModel}` : 'No model selected'}</p>
                            </div>
                            <button onClick={loadModels} disabled={modelsLoading} className="flex items-center gap-2 px-3 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-sm font-medium transition-colors disabled:opacity-50">
                                <RefreshCw className={`w-4 h-4 ${modelsLoading ? 'animate-spin' : ''}`} />
                                {modelsLoading ? 'Loading...' : models.length > 0 ? 'Refresh' : 'Load Models'}
                            </button>
                        </div>
                        {modelsError && <div className="flex items-center gap-2 p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg mb-4"><AlertCircle className="w-4 h-4 text-red-500 flex-shrink-0" /><p className="text-sm text-red-700 dark:text-red-300">{modelsError}</p></div>}
                        {models.length > 0 && (
                            <>
                                <div className="flex items-center gap-2 mb-3">
                                    <div className="relative flex-1">
                                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                                        <input type="text" value={modelSearch} onChange={(e) => setModelSearch(e.target.value)} placeholder="Search models..." className="w-full pl-9 pr-3 py-2 border border-gray-200 dark:border-dark-700 rounded-lg bg-white dark:bg-dark-800 text-sm text-gray-900 dark:text-dark-100 focus:outline-none focus:ring-2 focus:ring-blue-500" />
                                    </div>
                                    <div className="flex items-center gap-1 flex-wrap">
                                        {(['all', 'free', 'vision', 'tools', 'reasoning'] as const).map(f => (
                                            <button key={f} onClick={() => setModelFilter(f)} className={`px-2.5 py-1.5 rounded-lg text-xs font-medium transition-colors ${modelFilter === f ? 'bg-blue-600 text-white' : 'bg-gray-100 dark:bg-dark-800 text-gray-600 dark:text-dark-300 hover:bg-gray-200 dark:hover:bg-dark-700'}`}>
                                                {f === 'all' ? `All (${models.length})` : f.charAt(0).toUpperCase() + f.slice(1)}
                                            </button>
                                        ))}
                                    </div>
                                </div>
                                <div className="space-y-1.5 max-h-[500px] overflow-y-auto">
                                    {filteredModels.length === 0 ? (
                                        <p className="text-center text-sm text-gray-500 py-8">No models match your filter</p>
                                    ) : filteredModels.map(model => (
                                        <button key={model.id} onClick={() => updateLocal('selectedModel', model.id)} className={`w-full flex items-start gap-3 p-3 rounded-lg border transition-all text-left ${localSettings.selectedModel === model.id ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20' : 'border-gray-200 dark:border-dark-700 hover:border-gray-300 dark:hover:border-dark-600 hover:bg-gray-50 dark:hover:bg-dark-800'}`}>
                                            <div className="flex-1 min-w-0">
                                                <div className="flex items-center gap-1.5 flex-wrap">
                                                    <span className="text-sm font-medium text-gray-900 dark:text-dark-100 truncate">{model.name}</span>
                                                    {model.isFree && <span className="px-1.5 py-0.5 bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400 text-xs rounded font-medium">Free</span>}
                                                    {model.supportsReasoning && <span className="px-1.5 py-0.5 bg-yellow-100 dark:bg-yellow-900/30 text-yellow-700 text-xs rounded" title="Reasoning"><Zap className="w-3 h-3 inline" /></span>}
                                                    {model.supportsImages && <span className="px-1.5 py-0.5 bg-blue-100 dark:bg-blue-900/30 text-blue-700 text-xs rounded" title="Vision"><ImageIcon className="w-3 h-3 inline" /></span>}
                                                    {model.supportsTools && <span className="px-1.5 py-0.5 bg-orange-100 dark:bg-orange-900/30 text-orange-700 text-xs rounded" title="Tools"><Wrench className="w-3 h-3 inline" /></span>}
                                                </div>
                                                <p className="text-xs text-gray-400 dark:text-dark-500 mt-0.5 truncate">{model.id}</p>
                                                {model.contextLength && <p className="text-xs text-gray-400 mt-0.5">{(model.contextLength / 1000).toFixed(0)}K ctx{model.pricing ? ` · $${(model.pricing.prompt * 1000000).toFixed(2)}/M` : ''}</p>}
                                            </div>
                                            {localSettings.selectedModel === model.id && <Check className="w-4 h-4 text-blue-600 flex-shrink-0 mt-0.5" />}
                                        </button>
                                    ))}
                                </div>
                            </>
                        )}
                    </div>
                )}

                {/* PARAMETERS TAB */}
                {activeTab === 'parameters' && (
                    <div className="bg-white dark:bg-dark-900 rounded-xl border border-gray-200 dark:border-dark-700 p-5 space-y-6">
                        <h2 className="text-sm font-semibold text-gray-900 dark:text-dark-100">Generation Parameters</h2>
                        {[
                            { key: 'temperature' as const, label: 'Temperature', min: 0, max: 2, step: 0.05, desc: 'Controls randomness: 0=precise, 2=creative' },
                            { key: 'maxTokens' as const, label: 'Max Tokens', min: 256, max: 32768, step: 256, desc: 'Maximum tokens in response' },
                            { key: 'topP' as const, label: 'Top P', min: 0.1, max: 1, step: 0.05, desc: 'Nucleus sampling probability' },
                        ].map(param => (
                            <div key={param.key}>
                                <div className="flex items-center justify-between mb-2">
                                    <div>
                                        <label className="text-sm font-medium text-gray-700 dark:text-dark-200">{param.label}</label>
                                        <p className="text-xs text-gray-400 dark:text-dark-500">{param.desc}</p>
                                    </div>
                                    <span className="text-sm font-mono text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-900/20 px-2 py-0.5 rounded">
                                        {param.key === 'maxTokens' ? (localSettings[param.key] as number).toLocaleString() : (localSettings[param.key] as number).toFixed(2)}
                                    </span>
                                </div>
                                <input type="range" min={param.min} max={param.max} step={param.step} value={localSettings[param.key] as number} onChange={(e) => updateLocal(param.key, param.key === 'maxTokens' ? parseInt(e.target.value) : parseFloat(e.target.value))} className="w-full accent-blue-600" />
                            </div>
                        ))}
                        <div className="flex items-center justify-between p-4 bg-gray-50 dark:bg-dark-800 rounded-lg">
                            <div>
                                <p className="text-sm font-medium text-gray-700 dark:text-dark-200">Streaming Responses</p>
                                <p className="text-xs text-gray-500 dark:text-dark-400">Show response as it generates</p>
                            </div>
                            <button onClick={() => updateLocal('streamingEnabled', !localSettings.streamingEnabled)} className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${localSettings.streamingEnabled ? 'bg-blue-600' : 'bg-gray-300 dark:bg-dark-600'}`}>
                                <span className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${localSettings.streamingEnabled ? 'translate-x-6' : 'translate-x-1'}`} />
                            </button>
                        </div>
                    </div>
                )}

                {/* PERSONAS TAB */}
                {activeTab === 'personas' && (
                    <div className="bg-white dark:bg-dark-900 rounded-xl border border-gray-200 dark:border-dark-700 p-5">
                        <div className="flex items-center justify-between mb-4">
                            <div>
                                <h2 className="text-sm font-semibold text-gray-900 dark:text-dark-100">AI Personas</h2>
                                <p className="text-xs text-gray-500 dark:text-dark-400 mt-0.5">Custom AI personalities and system prompts</p>
                            </div>
                            <button onClick={() => { setEditingPersona({ icon: '🤖' }); setShowPersonaForm(true); }} className="flex items-center gap-2 px-3 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-sm font-medium transition-colors">
                                <Plus className="w-4 h-4" />New
                            </button>
                        </div>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                            {[...PERSONAS, ...(localSettings.personas?.filter(p => p.isCustom) || [])].map(persona => (
                                <div key={persona.id} onClick={() => { updateLocal('activePersonaId', persona.id); updateLocal('systemPrompt', persona.systemPrompt); }} className={`p-4 rounded-lg border cursor-pointer transition-all ${localSettings.activePersonaId === persona.id ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20' : 'border-gray-200 dark:border-dark-700 hover:border-gray-300 dark:hover:border-dark-600'}`}>
                                    <div className="flex items-start justify-between">
                                        <div className="flex items-center gap-2">
                                            <span className="text-xl">{persona.icon}</span>
                                            <div>
                                                <p className="text-sm font-semibold text-gray-900 dark:text-dark-100">{persona.name}</p>
                                                <p className="text-xs text-gray-500 dark:text-dark-400">{persona.description}</p>
                                            </div>
                                        </div>
                                        <div className="flex items-center gap-1">
                                            {localSettings.activePersonaId === persona.id && <Check className="w-4 h-4 text-blue-600" />}
                                            {persona.isCustom && (
                                                <button onClick={(e) => { e.stopPropagation(); setEditingPersona(persona); setShowPersonaForm(true); }} className="p-1 text-gray-400 hover:text-gray-600 rounded">
                                                    <Edit3 className="w-3.5 h-3.5" />
                                                </button>
                                            )}
                                        </div>
                                    </div>
                                    <p className="text-xs text-gray-400 dark:text-dark-500 mt-2 line-clamp-2">{persona.systemPrompt}</p>
                                </div>
                            ))}
                        </div>
                        {showPersonaForm && editingPersona && (
                            <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
                                <div className="bg-white dark:bg-dark-900 rounded-2xl shadow-2xl p-6 max-w-lg w-full mx-4 border border-gray-200 dark:border-dark-700">
                                    <h3 className="text-base font-bold text-gray-900 dark:text-dark-100 mb-4">{editingPersona.id ? 'Edit Persona' : 'New Persona'}</h3>
                                    <div className="space-y-3">
                                        <div className="flex items-center gap-3">
                                            <input type="text" value={editingPersona.icon || ''} onChange={(e) => setEditingPersona(prev => ({ ...prev, icon: e.target.value }))} placeholder="🤖" className="w-16 px-3 py-2 border border-gray-300 dark:border-dark-700 rounded-lg bg-white dark:bg-dark-800 text-center text-2xl focus:outline-none focus:ring-2 focus:ring-blue-500" />
                                            <input type="text" value={editingPersona.name || ''} onChange={(e) => setEditingPersona(prev => ({ ...prev, name: e.target.value }))} placeholder="Persona name" className="flex-1 px-3 py-2 border border-gray-300 dark:border-dark-700 rounded-lg bg-white dark:bg-dark-800 text-gray-900 dark:text-dark-100 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
                                        </div>
                                        <input type="text" value={editingPersona.description || ''} onChange={(e) => setEditingPersona(prev => ({ ...prev, description: e.target.value }))} placeholder="Short description" className="w-full px-3 py-2 border border-gray-300 dark:border-dark-700 rounded-lg bg-white dark:bg-dark-800 text-gray-900 dark:text-dark-100 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
                                        <textarea value={editingPersona.systemPrompt || ''} onChange={(e) => setEditingPersona(prev => ({ ...prev, systemPrompt: e.target.value }))} placeholder="System prompt..." rows={5} className="w-full px-3 py-2 border border-gray-300 dark:border-dark-700 rounded-lg bg-white dark:bg-dark-800 text-gray-900 dark:text-dark-100 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 resize-y" />
                                    </div>
                                    <div className="flex items-center gap-2 mt-4">
                                        <button onClick={handleSavePersona} disabled={!editingPersona.name || !editingPersona.systemPrompt} className="flex-1 py-2 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-200 dark:disabled:bg-dark-700 text-white disabled:text-gray-400 rounded-lg text-sm font-medium transition-colors">Save</button>
                                        <button onClick={() => { setShowPersonaForm(false); setEditingPersona(null); }} className="flex-1 py-2 bg-gray-100 dark:bg-dark-800 hover:bg-gray-200 dark:hover:bg-dark-700 text-gray-700 dark:text-dark-200 rounded-lg text-sm font-medium transition-colors">Cancel</button>
                                    </div>
                                </div>
                            </div>
                        )}
                    </div>
                )}

                {/* MCP TAB */}
                {activeTab === 'mcp' && (
                    <div className="bg-white dark:bg-dark-900 rounded-xl border border-gray-200 dark:border-dark-700 p-5">
                        <div className="flex items-center justify-between mb-4">
                            <div>
                                <h2 className="text-sm font-semibold text-gray-900 dark:text-dark-100">MCP Servers</h2>
                                <p className="text-xs text-gray-500 dark:text-dark-400 mt-0.5">Model Context Protocol — extend AI with external tools</p>
                            </div>
                            <button onClick={() => setShowMCPForm(!showMCPForm)} className="flex items-center gap-2 px-3 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-sm font-medium transition-colors">
                                <Plus className="w-4 h-4" />Add Server
                            </button>
                        </div>
                        <div className="mb-4">
                            <p className="text-xs font-semibold text-gray-500 dark:text-dark-400 uppercase tracking-wider mb-2">Quick Add Presets</p>
                            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                                {MCP_SERVER_PRESETS.map((preset, i) => (
                                    <button key={i} onClick={() => handleAddPreset(preset)} className="p-3 border border-dashed border-gray-300 dark:border-dark-600 rounded-lg text-left hover:border-blue-400 hover:bg-blue-50 dark:hover:bg-blue-900/10 transition-all">
                                        <p className="text-xs font-medium text-gray-700 dark:text-dark-200">{preset.name}</p>
                                        <p className="text-xs text-gray-400 dark:text-dark-500 mt-0.5">{preset.description}</p>
                                    </button>
                                ))}
                            </div>
                        </div>
                        {showMCPForm && (
                            <div className="mb-4 p-4 bg-gray-50 dark:bg-dark-800 rounded-lg border border-gray-200 dark:border-dark-700">
                                <h3 className="text-sm font-semibold text-gray-900 dark:text-dark-100 mb-3">Add MCP Server</h3>
                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                                    <input type="text" value={newMCPServer.name || ''} onChange={(e) => setNewMCPServer(prev => ({ ...prev, name: e.target.value }))} placeholder="Server name" className="px-3 py-2 border border-gray-300 dark:border-dark-600 rounded-lg bg-white dark:bg-dark-900 text-sm text-gray-900 dark:text-dark-100 focus:outline-none focus:ring-2 focus:ring-blue-500" />
                                    <select value={newMCPServer.transport || 'sse'} onChange={(e) => setNewMCPServer(prev => ({ ...prev, transport: e.target.value as 'sse' | 'stdio' | 'websocket' }))} className="px-3 py-2 border border-gray-300 dark:border-dark-600 rounded-lg bg-white dark:bg-dark-900 text-sm text-gray-900 dark:text-dark-100 focus:outline-none focus:ring-2 focus:ring-blue-500">
                                        <option value="sse">SSE (HTTP)</option>
                                        <option value="stdio">Stdio (Local)</option>
                                        <option value="websocket">WebSocket</option>
                                    </select>
                                    <input type="text" value={newMCPServer.url || ''} onChange={(e) => setNewMCPServer(prev => ({ ...prev, url: e.target.value }))} placeholder="Server URL or command" className="sm:col-span-2 px-3 py-2 border border-gray-300 dark:border-dark-600 rounded-lg bg-white dark:bg-dark-900 text-sm text-gray-900 dark:text-dark-100 focus:outline-none focus:ring-2 focus:ring-blue-500" />
                                    <input type="text" value={newMCPServer.description || ''} onChange={(e) => setNewMCPServer(prev => ({ ...prev, description: e.target.value }))} placeholder="Description (optional)" className="px-3 py-2 border border-gray-300 dark:border-dark-600 rounded-lg bg-white dark:bg-dark-900 text-sm text-gray-900 dark:text-dark-100 focus:outline-none focus:ring-2 focus:ring-blue-500" />
                                    <input type="password" value={newMCPServer.apiKey || ''} onChange={(e) => setNewMCPServer(prev => ({ ...prev, apiKey: e.target.value }))} placeholder="API key (optional)" className="px-3 py-2 border border-gray-300 dark:border-dark-600 rounded-lg bg-white dark:bg-dark-900 text-sm text-gray-900 dark:text-dark-100 focus:outline-none focus:ring-2 focus:ring-blue-500" />
                                </div>
                                <div className="flex items-center gap-2 mt-3">
                                    <button onClick={handleAddMCPServer} disabled={!newMCPServer.name || !newMCPServer.url} className="px-4 py-2 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-200 dark:disabled:bg-dark-700 text-white disabled:text-gray-400 rounded-lg text-sm font-medium transition-colors">Add</button>
                                    <button onClick={() => setShowMCPForm(false)} className="px-4 py-2 bg-gray-100 dark:bg-dark-700 text-gray-700 dark:text-dark-200 rounded-lg text-sm font-medium transition-colors">Cancel</button>
                                </div>
                            </div>
                        )}
                        {settings.mcpServers.length === 0 ? (
                            <div className="text-center py-8">
                                <Server className="w-8 h-8 text-gray-300 dark:text-dark-600 mx-auto mb-3" />
                                <p className="text-sm text-gray-500 dark:text-dark-400">No MCP servers configured</p>
                            </div>
                        ) : (
                            <div className="space-y-2">
                                {settings.mcpServers.map(server => (
                                    <div key={server.id} className="flex items-center gap-3 p-3 border border-gray-200 dark:border-dark-700 rounded-lg">
                                        <div className={`w-2 h-2 rounded-full flex-shrink-0 ${server.status === 'connected' ? 'bg-green-500' : server.status === 'connecting' ? 'bg-yellow-500 animate-pulse' : server.status === 'error' ? 'bg-red-500' : 'bg-gray-400'}`} />
                                        <div className="flex-1 min-w-0">
                                            <p className="text-sm font-medium text-gray-900 dark:text-dark-100">{server.name}</p>
                                            <p className="text-xs text-gray-400 dark:text-dark-500 truncate">{server.url}</p>
                                            {server.lastError && <p className="text-xs text-red-500 mt-0.5">{server.lastError}</p>}
                                            {server.tools && server.tools.length > 0 && <p className="text-xs text-green-600 dark:text-green-400 mt-0.5">{server.tools.length} tools available</p>}
                                        </div>
                                        <div className="flex items-center gap-2">
                                            <button onClick={() => updateMCPServer(server.id, { enabled: !server.enabled })} className={`relative inline-flex h-5 w-9 items-center rounded-full transition-colors ${server.enabled ? 'bg-blue-600' : 'bg-gray-300 dark:bg-dark-600'}`}>
                                                <span className={`inline-block h-3 w-3 transform rounded-full bg-white transition-transform ${server.enabled ? 'translate-x-5' : 'translate-x-1'}`} />
                                            </button>
                                            <button onClick={() => removeMCPServer(server.id)} className="p-1.5 text-gray-400 hover:text-red-500 rounded transition-colors"><Trash2 className="w-4 h-4" /></button>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                )}

                {/* APPEARANCE TAB */}
                {activeTab === 'appearance' && (
                    <div className="bg-white dark:bg-dark-900 rounded-xl border border-gray-200 dark:border-dark-700 p-5 space-y-3">
                        <h2 className="text-sm font-semibold text-gray-900 dark:text-dark-100 mb-2">Appearance & UI</h2>
                        {[
                            { key: 'isDarkMode' as const, label: 'Dark Mode', desc: 'Use dark theme' },
                            { key: 'showTokenCount' as const, label: 'Show Token Count', desc: 'Display token usage in header' },
                            { key: 'showModelInfo' as const, label: 'Show Model Info', desc: 'Show model name on messages' },
                        ].map(item => (
                            <div key={item.key} className="flex items-center justify-between p-4 bg-gray-50 dark:bg-dark-800 rounded-lg">
                                <div>
                                    <p className="text-sm font-medium text-gray-700 dark:text-dark-200">{item.label}</p>
                                    <p className="text-xs text-gray-500 dark:text-dark-400">{item.desc}</p>
                                </div>
                                <button onClick={() => updateLocal(item.key, !localSettings[item.key])} className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${localSettings[item.key] ? 'bg-blue-600' : 'bg-gray-300 dark:bg-dark-600'}`}>
                                    <span className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${localSettings[item.key] ? 'translate-x-6' : 'translate-x-1'}`} />
                                </button>
                            </div>
                        ))}
                        <div className="flex items-center justify-between p-4 bg-gray-50 dark:bg-dark-800 rounded-lg">
                            <div>
                                <p className="text-sm font-medium text-gray-700 dark:text-dark-200">Interface Language</p>
                                <p className="text-xs text-gray-500 dark:text-dark-400">UI display language</p>
                            </div>
                            <select value={localSettings.language} onChange={(e) => updateLocal('language', e.target.value as 'en' | 'my')} className="px-3 py-1.5 border border-gray-300 dark:border-dark-600 rounded-lg bg-white dark:bg-dark-800 text-sm text-gray-900 dark:text-dark-100 focus:outline-none focus:ring-2 focus:ring-blue-500">
                                <option value="en">English</option>
                                <option value="my">မြန်မာ (Burmese)</option>
                            </select>
                        </div>
                        <div className="flex items-center justify-between p-4 bg-gray-50 dark:bg-dark-800 rounded-lg">
                            <div>
                                <p className="text-sm font-medium text-gray-700 dark:text-dark-200">Export Format</p>
                                <p className="text-xs text-gray-500 dark:text-dark-400">Default format for chat exports</p>
                            </div>
                            <select value={localSettings.exportFormat} onChange={(e) => updateLocal('exportFormat', e.target.value as 'markdown' | 'json' | 'txt')} className="px-3 py-1.5 border border-gray-300 dark:border-dark-600 rounded-lg bg-white dark:bg-dark-800 text-sm text-gray-900 dark:text-dark-100 focus:outline-none focus:ring-2 focus:ring-blue-500">
                                <option value="markdown">Markdown (.md)</option>
                                <option value="json">JSON (.json)</option>
                                <option value="txt">Plain Text (.txt)</option>
                            </select>
                        </div>
                    </div>
                )}

                {/* ABOUT TAB */}
                {activeTab === 'about' && (
                    <div className="bg-white dark:bg-dark-900 rounded-xl border border-gray-200 dark:border-dark-700 p-6 text-center">
                        <div className="w-16 h-16 bg-gradient-to-br from-purple-500 to-blue-600 rounded-2xl flex items-center justify-center mx-auto mb-4">
                            <Bot className="w-8 h-8 text-white" />
                        </div>
                        <h2 className="text-xl font-bold text-gray-900 dark:text-dark-100">RavenGPT</h2>
                        <p className="text-sm text-gray-500 dark:text-dark-400 mt-1">Version 2.0.0 — Enhanced Edition</p>
                        <p className="text-sm text-gray-600 dark:text-dark-300 mt-3 max-w-md mx-auto">
                            A powerful AI chat interface with multi-model support, MCP integration, tool calling, vision, reasoning, and Burmese language support.
                        </p>
                        <div className="mt-6 grid grid-cols-2 sm:grid-cols-3 gap-3 text-left">
                            {[
                                { icon: '🤖', title: 'Multi-Model', desc: 'OpenRouter, Groq, Together AI' },
                                { icon: '🔧', title: 'Tool Calling', desc: '8 built-in tools' },
                                { icon: '🔌', title: 'MCP Protocol', desc: 'External server integration' },
                                { icon: '👁️', title: 'Vision', desc: 'Image analysis' },
                                { icon: '🧠', title: 'Reasoning', desc: 'Deep thinking models' },
                                { icon: '🌐', title: 'Web Search', desc: 'Real-time internet' },
                                { icon: '💾', title: 'Export/Import', desc: 'Markdown, JSON, TXT' },
                                { icon: '🇲🇲', title: 'Burmese', desc: 'မြန်မာဘာသာ support' },
                                { icon: '⌨️', title: 'Shortcuts', desc: 'Full keyboard nav' },
                            ].map((feature, i) => (
                                <div key={i} className="p-3 bg-gray-50 dark:bg-dark-800 rounded-lg text-left">
                                    <span className="text-lg">{feature.icon}</span>
                                    <p className="text-sm font-medium text-gray-900 dark:text-dark-100 mt-1">{feature.title}</p>
                                    <p className="text-xs text-gray-500 dark:text-dark-400">{feature.desc}</p>
                                </div>
                            ))}
                        </div>
                        <div className="mt-6 flex items-center justify-center gap-4">
                            <a href="https://github.com/wh1sky02/RavenGPT" target="_blank" rel="noopener noreferrer" className="flex items-center gap-2 px-4 py-2 bg-gray-900 dark:bg-gray-100 text-white dark:text-gray-900 rounded-lg text-sm font-medium hover:bg-gray-800 transition-colors">
                                <ExternalLink className="w-4 h-4" />GitHub
                            </a>
                            <a href="https://openrouter.ai" target="_blank" rel="noopener noreferrer" className="flex items-center gap-2 px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded-lg text-sm font-medium transition-colors">
                                <ExternalLink className="w-4 h-4" />OpenRouter
                            </a>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}
