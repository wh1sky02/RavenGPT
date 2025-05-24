'use client';

import { useState, useEffect, useCallback } from 'react';
import { ArrowLeft, Key, Sparkles, Brain, Search, Image as ImageIcon, Check, RefreshCw, ExternalLink, Filter, Grid, List, X, Settings, Bot } from 'lucide-react';
import Link from 'next/link';

interface OpenRouterModel {
  id: string;
  name: string;
  description?: string;
  pricing: {
    prompt: string;
    completion: string;
  };
  context_length: number;
  supported_parameters?: string[];
  architecture?: {
    input_modalities?: string[];
    output_modalities?: string[];
  };
}

interface Model {
  id: string;
  name: string;
  description?: string;
  supportsReasoning?: boolean;
  supportsImages?: boolean;
  supportsWebSearch?: boolean;
  isFree?: boolean;
  pricing?: {
    prompt: number;
    completion: number;
  };
}

// Provider URLs
const PROVIDER_URLS = {
  'OpenRouter': 'https://openrouter.ai/api/v1/chat/completions',
  'Together AI': 'https://api.together.xyz/v1/chat/completions',
  'Groq': 'https://api.groq.com/openai/v1/chat/completions',
  'Custom API URL': ''
};



export default function SettingsPage() {
  const [apiKey, setApiKey] = useState('');
  const [selectedProviderName, setSelectedProviderName] = useState('OpenRouter');
  const [selectedProviderUrl, setSelectedProviderUrl] = useState(PROVIDER_URLS['OpenRouter']);
  const [customApiUrl, setCustomApiUrl] = useState('');
  const [selectedModel, setSelectedModel] = useState('');
  const [tempSelectedModel, setTempSelectedModel] = useState(''); // Temporary model selection for settings
  const [availableModels, setAvailableModels] = useState<Model[]>([]);
  const [isLoadingModels, setIsLoadingModels] = useState(false);
  const [modelsError, setModelsError] = useState<string | null>(null);
  const [saveStatus, setSaveStatus] = useState<'idle' | 'saving' | 'saved'>('idle');
  
  // Temporary state variables for settings (don't affect until save is clicked)
  const [tempApiKey, setTempApiKey] = useState('');
  const [tempSelectedProviderName, setTempSelectedProviderName] = useState('OpenRouter');
  const [tempSelectedProviderUrl, setTempSelectedProviderUrl] = useState(PROVIDER_URLS['OpenRouter']);
  const [tempCustomApiUrl, setTempCustomApiUrl] = useState('');
  const [tempMaxTokens, setTempMaxTokens] = useState(500);
  const [tempUseAdaptiveTokens, setTempUseAdaptiveTokens] = useState(true);
  
  // Model filtering states
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedFilters, setSelectedFilters] = useState<string[]>([]);
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('list');
  
  // Tab state
  const [activeTab, setActiveTab] = useState<'provider' | 'models' | 'tokens' | 'about'>('provider');
  
  // Token settings
  const [maxTokens, setMaxTokens] = useState(500);
  const [useAdaptiveTokens, setUseAdaptiveTokens] = useState(true);

  // Switch provider helper - now only updates temporary state
  const switchProvider = (providerName: string) => {
    setTempSelectedProviderName(providerName);
    if (providerName !== 'Custom API URL') {
      setTempSelectedProviderUrl(PROVIDER_URLS[providerName as keyof typeof PROVIDER_URLS]);
    }
    // Don't save to localStorage immediately - only save when user clicks Save Settings
  };

  // Fetch OpenRouter models
  const fetchOpenRouterModels = async (): Promise<Model[]> => {
    try {
      const response = await fetch('https://openrouter.ai/api/v1/models');
      if (!response.ok) throw new Error(`OpenRouter API error: ${response.status}`);
      
      const data = await response.json();
      const models: OpenRouterModel[] = data.data;
      
      return models.map(model => {
        const promptPrice = parseFloat(model.pricing.prompt || '0');
        const completionPrice = parseFloat(model.pricing.completion || '0');
        const isFree = promptPrice === 0 && completionPrice === 0;
        
        return {
          id: model.id,
          name: `${model.name}${isFree ? ' (Free)' : ''}`,
          description: `${model.description || 'AI model'} • Context: ${model.context_length.toLocaleString()}`,
          supportsReasoning: model.id.includes('reasoning') || 
                            model.id.includes('thinking') || 
                            model.id.includes('r1') ||
                            model.id.includes('qwq') ||
                            model.id.includes('o1') ||
                            model.id.includes('deepseek') ||
                            false,
          supportsImages: model.architecture?.input_modalities?.includes('image') || 
                         model.id.includes('vision') ||
                         model.id.includes('llava') ||
                         model.id.includes('pixtral') ||
                         false,
          supportsWebSearch: true,
          isFree,
          pricing: {
            prompt: promptPrice,
            completion: completionPrice
          }
        };
      });
    } catch (error) {
      console.error('OpenRouter API error:', error);
      throw error;
    }
  };

  // Fetch Groq models
  const fetchGroqModels = async (): Promise<Model[]> => {
    const knownFreeModels = [
      {
        id: 'llama-3.2-3b-preview',
        name: 'Llama 3.2 3B Preview (Free)',
        description: 'Lightning-fast inference • Context: 8K • 14,400 requests/day free',
        supportsReasoning: true,
        supportsImages: false,
        supportsWebSearch: false,
        isFree: true,
        pricing: { prompt: 0, completion: 0 }
      },
      {
        id: 'llama-3.2-1b-preview',
        name: 'Llama 3.2 1B Preview (Free)',
        description: 'Ultra-fast lightweight • Context: 8K • 14,400 requests/day free',
        supportsReasoning: true,
        supportsImages: false,
        supportsWebSearch: false,
        isFree: true,
        pricing: { prompt: 0, completion: 0 }
      },
      {
        id: 'llama3-8b-8192',
        name: 'Llama 3 8B (Free)',
        description: 'Powerful and fast • Context: 8K • 14,400 requests/day free',
        supportsReasoning: true,
        supportsImages: false,
        supportsWebSearch: false,
        isFree: true,
        pricing: { prompt: 0, completion: 0 }
      },
      {
        id: 'llama3-70b-8192',
        name: 'Llama 3 70B (Free)',
        description: 'Most powerful model • Context: 8K • 14,400 requests/day free',
        supportsReasoning: true,
        supportsImages: false,
        supportsWebSearch: false,
        isFree: true,
        pricing: { prompt: 0, completion: 0 }
      },
      {
        id: 'mixtral-8x7b-32768',
        name: 'Mixtral 8x7B (Free)',
        description: 'Mixture of experts • Context: 32K • 14,400 requests/day free',
        supportsReasoning: true,
        supportsImages: false,
        supportsWebSearch: false,
        isFree: true,
        pricing: { prompt: 0, completion: 0 }
      }
    ];

    if (!apiKey) {
      return knownFreeModels;
    }

    try {
      const response = await fetch('https://api.groq.com/openai/v1/models', {
        headers: { 'Authorization': `Bearer ${apiKey}` }
      });
      
      if (!response.ok) {
        if (response.status === 401) {
          return knownFreeModels;
        }
        throw new Error(`Groq API error: ${response.status}`);
      }
      
      const data = await response.json();
      const models = data.data || [];
      
      if (models.length === 0) {
        return knownFreeModels;
      }
      
      // Filter out non-chat models (TTS, transcription, etc.)
      const chatModels = models.filter((model: { id: string }) => {
        const modelId = model.id.toLowerCase();
        // Exclude TTS, transcription, and specialized models
        return !modelId.includes('tts') && 
               !modelId.includes('whisper') && 
               !modelId.includes('transcrib') && 
               !modelId.includes('speech') && 
               !modelId.includes('audio') &&
               !modelId.includes('guard') &&
               !modelId.includes('distil-whisper');
      });

      return chatModels.map((model: { id: string }) => {
        const modelId = model.id;
        const contextLength = modelId.includes('8192') ? '8K' : 
                             modelId.includes('32768') ? '32K' : 
                             modelId.includes('128k') ? '128K' : 'Unknown';
        
        return {
          id: model.id,
          name: `${model.id.replace(/-/g, ' ').replace(/\b\w/g, (l: string) => l.toUpperCase())} (Free)`,
          description: `Lightning-fast inference • Context: ${contextLength} • 14,400 requests/day free`,
          supportsReasoning: true,
          supportsImages: model.id.includes('vision') || model.id.includes('llava'),
          supportsWebSearch: false,
          isFree: true,
          pricing: { prompt: 0, completion: 0 }
        };
      });
    } catch (error) {
      console.error('Groq API error:', error);
      return knownFreeModels;
    }
  };

  // Fetch Together AI models
  const fetchTogetherAIModels = async (): Promise<Model[]> => {
    // Known popular models available on Together AI
    const knownModels = [
      {
        id: 'meta-llama/Meta-Llama-3.1-70B-Instruct-Turbo',
        name: 'Llama 3.1 70B Instruct Turbo',
        description: 'Fast and capable Llama model • Context: 131K • $0.00088 per 1K tokens',
        supportsReasoning: true,
        supportsImages: false,
        supportsWebSearch: false,
        isFree: false,
        pricing: { prompt: 0.00088, completion: 0.00088 }
      },
      {
        id: 'meta-llama/Meta-Llama-3.1-8B-Instruct-Turbo',
        name: 'Llama 3.1 8B Instruct Turbo',
        description: 'Fast and efficient • Context: 131K • $0.00018 per 1K tokens',
        supportsReasoning: true,
        supportsImages: false,
        supportsWebSearch: false,
        isFree: false,
        pricing: { prompt: 0.00018, completion: 0.00018 }
      },
      {
        id: 'mistralai/Mixtral-8x7B-Instruct-v0.1',
        name: 'Mixtral 8x7B Instruct',
        description: 'Mixture of experts • Context: 32K • $0.0006 per 1K tokens',
        supportsReasoning: true,
        supportsImages: false,
        supportsWebSearch: false,
        isFree: false,
        pricing: { prompt: 0.0006, completion: 0.0006 }
      },
      {
        id: 'Qwen/Qwen2.5-72B-Instruct-Turbo',
        name: 'Qwen 2.5 72B Instruct Turbo',
        description: 'High-performance model • Context: 32K • $0.0008 per 1K tokens',
        supportsReasoning: true,
        supportsImages: false,
        supportsWebSearch: false,
        isFree: false,
        pricing: { prompt: 0.0008, completion: 0.0008 }
      },
      {
        id: 'meta-llama/Meta-Llama-3-8B-Instruct',
        name: 'Llama 3 8B Instruct',
        description: 'Reliable and efficient • Context: 8K • $0.0002 per 1K tokens',
        supportsReasoning: true,
        supportsImages: false,
        supportsWebSearch: false,
        isFree: false,
        pricing: { prompt: 0.0002, completion: 0.0002 }
      },
      {
        id: 'deepseek-ai/DeepSeek-R1-Distill-Llama-70B-free',
        name: 'DeepSeek R1 Distill Llama 70B (Free)',
        description: '⚠️ Strong reasoning but very strict rate limits (6 queries/minute) • Context: 8K • Free',
        supportsReasoning: true,
        supportsImages: false,
        supportsWebSearch: false,
        isFree: true,
        pricing: { prompt: 0, completion: 0 }
      }
    ];

    // If no API key, return known models
    if (!apiKey) {
      console.log('No Together AI API key provided, showing known models');
      return knownModels;
    }

    try {
      const response = await fetch('https://api.together.xyz/v1/models', {
        headers: { 'Authorization': `Bearer ${apiKey}` }
      });
      
      if (!response.ok) {
        if (response.status === 401) {
          console.warn('Together AI API key invalid, showing known models');
          return knownModels;
        }
        throw new Error(`Together AI API error: ${response.status}`);
      }
      
      const models = await response.json();
      
      if (!models || models.length === 0) {
        console.warn('No models found via Together AI API, using known models');
        return knownModels;
      }
      
      console.log(`Found ${models.length} models on Together AI`);
      
      return models.map((model: { 
        id: string; 
        display_name?: string; 
        description?: string; 
        context_length?: number; 
        pricing?: { input?: number; output?: number }; 
        type?: string; 
        architecture?: string;
      }) => {
        // Determine if it's a free model (Together AI doesn't have completely free models, but some have very low pricing)
        const inputPrice = model.pricing?.input || 0;
        const outputPrice = model.pricing?.output || 0;
        const isFree = inputPrice === 0 && outputPrice === 0;
        
        return {
          id: model.id,
          name: model.display_name || model.id.split('/').pop()?.replace(/[-_]/g, ' ').replace(/\b\w/g, (l: string) => l.toUpperCase()) || model.id,
          description: `${model.description || 'Together AI model'} • Context: ${model.context_length?.toLocaleString() || 'Unknown'} ${model.pricing ? `• $${inputPrice}/$${outputPrice} per 1K tokens` : ''}`,
          supportsReasoning: model.id.includes('instruct') || 
                            model.id.includes('chat') || 
                            model.id.includes('reasoning') ||
                            model.id.includes('thinking') ||
                            model.type === 'chat',
          supportsImages: model.id.includes('vision') || 
                         model.id.includes('llava') ||
                         model.id.includes('pixtral') ||
                         (model.architecture && model.architecture.includes('vision')),
          supportsWebSearch: false,
          isFree,
          pricing: {
            prompt: inputPrice,
            completion: outputPrice
          }
        };
      });
    } catch (error) {
      console.error('Together AI API error:', error);
      console.log('Falling back to known models');
      return knownModels;
    }
  };

  const fetchAvailableModels = useCallback(async () => {
    setIsLoadingModels(true);
    setModelsError(null);
    
    try {
      let models: Model[] = [];
      
      switch (tempSelectedProviderName) {
        case 'OpenRouter':
          try {
            models = await fetchOpenRouterModels();
          } catch {
            setModelsError('Could not fetch OpenRouter models. Please check your internet connection.');
            models = [];
          }
          break;
        case 'Together AI':
          try {
            models = await fetchTogetherAIModels();
          } catch {
            setModelsError('Could not fetch Together AI models. Please check your API key and connection.');
            models = [];
          }
          break;
        case 'Groq':
          try {
            models = await fetchGroqModels();
          } catch {
            setModelsError('Could not fetch Groq models. Please check your API key and connection.');
            models = [];
          }
          break;
        case 'Custom API URL':
          models = [];
          break;
        default:
          models = [];
      }
      
      if (models.length > 0) {
        setAvailableModels(models);
        // Update temp model selection based on available models
        setTempSelectedModel(currentTempModel => {
          // If current temp model exists in new models, keep it
          if (currentTempModel && models.find(m => m.id === currentTempModel)) {
            return currentTempModel;
          }
          // Otherwise, use the first available model as temp selection
          return models[0]?.id || '';
        });
      } else {
        setAvailableModels([]);
        setTempSelectedModel('');
      }
    } catch (error) {
      console.error('Unexpected error fetching models:', error);
      setModelsError(`Unexpected error loading models from ${tempSelectedProviderName}.`);
      setAvailableModels([]);
      setSelectedModel('');
      localStorage.removeItem('selected-model');
    } finally {
      setIsLoadingModels(false);
    }
  }, [tempSelectedProviderName, tempApiKey]);

  useEffect(() => {
    // Load settings
    const savedApiKey = localStorage.getItem('openrouter-api-key');
    const savedProvider = localStorage.getItem('selected-provider');
    const savedProviderUrl = localStorage.getItem('selected-provider-url');
    const savedCustomUrl = localStorage.getItem('custom-api-url');
    const savedModel = localStorage.getItem('selected-model');
    const savedMaxTokens = localStorage.getItem('max-tokens');
    const savedUseAdaptive = localStorage.getItem('use-adaptive-tokens');

    // Load actual settings
    if (savedApiKey) setApiKey(savedApiKey);
    if (savedProvider && PROVIDER_URLS[savedProvider as keyof typeof PROVIDER_URLS]) {
      setSelectedProviderName(savedProvider);
      setSelectedProviderUrl(PROVIDER_URLS[savedProvider as keyof typeof PROVIDER_URLS]);
    }
    if (savedProviderUrl) setSelectedProviderUrl(savedProviderUrl);
    if (savedCustomUrl) setCustomApiUrl(savedCustomUrl);
    if (savedModel) {
      setSelectedModel(savedModel);
      setTempSelectedModel(savedModel);
    }
    if (savedMaxTokens) setMaxTokens(parseInt(savedMaxTokens));
    if (savedUseAdaptive !== null) setUseAdaptiveTokens(savedUseAdaptive === 'true');
    
    // Initialize temporary settings with saved values
    setTempApiKey(savedApiKey || '');
    setTempSelectedProviderName(savedProvider || 'OpenRouter');
    setTempSelectedProviderUrl(savedProviderUrl || PROVIDER_URLS['OpenRouter']);
    setTempCustomApiUrl(savedCustomUrl || '');
    setTempMaxTokens(savedMaxTokens ? parseInt(savedMaxTokens) : 500);
    setTempUseAdaptiveTokens(savedUseAdaptive !== null ? savedUseAdaptive === 'true' : true);
  }, []);

  useEffect(() => {
    fetchAvailableModels();
  }, [tempSelectedProviderName, tempApiKey]);

  const saveSettings = async () => {
    setSaveStatus('saving');
    
    // Save all temporary settings to localStorage
    localStorage.setItem('openrouter-api-key', tempApiKey);
    localStorage.setItem('selected-provider', tempSelectedProviderName);
    localStorage.setItem('selected-provider-url', tempSelectedProviderUrl);
    localStorage.setItem('custom-api-url', tempCustomApiUrl);
    localStorage.setItem('selected-model', tempSelectedModel);
    localStorage.setItem('max-tokens', tempMaxTokens.toString());
    localStorage.setItem('use-adaptive-tokens', tempUseAdaptiveTokens.toString());
    
    // Update the actual state variables after saving
    setApiKey(tempApiKey);
    setSelectedProviderName(tempSelectedProviderName);
    setSelectedProviderUrl(tempSelectedProviderUrl);
    setCustomApiUrl(tempCustomApiUrl);
    setSelectedModel(tempSelectedModel);
    setMaxTokens(tempMaxTokens);
    setUseAdaptiveTokens(tempUseAdaptiveTokens);
    
    // Simulate saving delay
    setTimeout(() => {
      setSaveStatus('saved');
      setTimeout(() => setSaveStatus('idle'), 2000);
    }, 500);
  };

  const getApiUrl = () => {
    if (tempSelectedProviderName === 'Custom API URL') {
      return tempCustomApiUrl;
    }
    return tempSelectedProviderUrl;
  };

  // Filter models based on search and filters
  const filteredModels = availableModels.filter(model => {
    // Search filter
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      const matchesName = model.name.toLowerCase().includes(query);
      const matchesId = model.id.toLowerCase().includes(query);
      const matchesDescription = model.description?.toLowerCase().includes(query);
      if (!matchesName && !matchesId && !matchesDescription) {
        return false;
      }
    }

    // Capability filters
    if (selectedFilters.length > 0) {
      const hasRequiredCapabilities = selectedFilters.every(filter => {
        switch (filter) {
          case 'reasoning':
            return model.supportsReasoning;
          case 'vision':
            return model.supportsImages;
          case 'search':
            return model.supportsWebSearch;
          case 'free':
            return model.id.toLowerCase().includes('free') || 
                   (model.description?.toLowerCase().includes('free') ?? false);
          default:
            return true;
        }
      });
      if (!hasRequiredCapabilities) {
        return false;
      }
    }

    return true;
  });

  const toggleFilter = (filter: string) => {
    setSelectedFilters(prev => 
      prev.includes(filter) 
        ? prev.filter(f => f !== filter)
        : [...prev, filter]
    );
  };

  const clearFilters = () => {
    setSelectedFilters([]);
    setSearchQuery('');
  };

  // Check if there are unsaved changes
  const hasUnsavedChanges = () => {
    return tempApiKey !== apiKey ||
           tempSelectedProviderName !== selectedProviderName ||
           tempSelectedProviderUrl !== selectedProviderUrl ||
           tempCustomApiUrl !== customApiUrl ||
           tempSelectedModel !== selectedModel ||
           tempMaxTokens !== maxTokens ||
           tempUseAdaptiveTokens !== useAdaptiveTokens;
  };

  // Discard all temporary changes
  const discardChanges = () => {
    setTempApiKey(apiKey);
    setTempSelectedProviderName(selectedProviderName);
    setTempSelectedProviderUrl(selectedProviderUrl);
    setTempCustomApiUrl(customApiUrl);
    setTempSelectedModel(selectedModel);
    setTempMaxTokens(maxTokens);
    setTempUseAdaptiveTokens(useAdaptiveTokens);
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-black">
      {/* Header */}
      <div className="bg-white dark:bg-gray-900 border-b border-gray-200 dark:border-gray-700">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center gap-4">
              <Link 
                href="/"
                className="inline-flex items-center gap-2 text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white transition-colors"
              >
                <ArrowLeft className="w-5 h-5" />
                Back to Chat
              </Link>
              <h1 className="text-xl font-semibold text-gray-900 dark:text-white">
                Settings
              </h1>
            </div>
            <div className="flex items-center gap-2">
              {hasUnsavedChanges() && (
                <button
                  onClick={discardChanges}
                  className="inline-flex items-center gap-2 px-3 py-2 bg-gray-500 text-white rounded-md hover:bg-gray-600 transition-colors text-sm"
                >
                  <X className="w-4 h-4" />
                  Discard Changes
                </button>
              )}
              <button
                onClick={saveSettings}
                disabled={saveStatus === 'saving'}
                className={`inline-flex items-center gap-2 px-4 py-2 rounded-md disabled:opacity-50 transition-colors ${
                  hasUnsavedChanges() 
                    ? 'bg-orange-600 hover:bg-orange-700 text-white animate-pulse' 
                    : 'bg-blue-600 hover:bg-blue-700 text-white'
                }`}
              >
                {saveStatus === 'saving' ? (
                  <RefreshCw className="w-4 h-4 animate-spin" />
                ) : saveStatus === 'saved' ? (
                  <Check className="w-4 h-4" />
                ) : (
                  <Sparkles className="w-4 h-4" />
                )}
                {saveStatus === 'saving' ? 'Saving...' : saveStatus === 'saved' ? 'Saved!' : 
                 hasUnsavedChanges() ? 'Save Changes' : 'Save Settings'}
              </button>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Tab Navigation */}
        <div className="border-b border-gray-200 dark:border-gray-700 mb-8">
          <nav className="-mb-px flex space-x-8">
            <button
              onClick={() => setActiveTab('provider')}
              className={`py-4 px-1 border-b-2 font-medium text-sm transition-colors ${
                activeTab === 'provider'
                  ? 'border-blue-500 text-blue-600 dark:text-blue-400'
                  : 'border-transparent text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300 hover:border-gray-300 dark:hover:border-gray-600'
              }`}
            >
              <div className="flex items-center gap-2">
                <Settings className="w-4 h-4" />
                Provider & API
              </div>
            </button>
            <button
              onClick={() => setActiveTab('models')}
              className={`py-4 px-1 border-b-2 font-medium text-sm transition-colors ${
                activeTab === 'models'
                  ? 'border-blue-500 text-blue-600 dark:text-blue-400'
                  : 'border-transparent text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300 hover:border-gray-300 dark:hover:border-gray-600'
              }`}
            >
              <div className="flex items-center gap-2">
                <Bot className="w-4 h-4" />
                Model Selection
                <span className="px-2 py-0.5 bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-400 text-xs rounded-full">
                  {filteredModels.length}
                </span>
              </div>
            </button>
            <button
              onClick={() => setActiveTab('tokens')}
              className={`py-4 px-1 border-b-2 font-medium text-sm transition-colors ${
                activeTab === 'tokens'
                  ? 'border-blue-500 text-blue-600 dark:text-blue-400'
                  : 'border-transparent text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300 hover:border-gray-300 dark:hover:border-gray-600'
              }`}
            >
              <div className="flex items-center gap-2">
                <Settings className="w-4 h-4" />
                Token Settings
              </div>
            </button>
            <button
              onClick={() => setActiveTab('about')}
              className={`py-4 px-1 border-b-2 font-medium text-sm transition-colors ${
                activeTab === 'about'
                  ? 'border-blue-500 text-blue-600 dark:text-blue-400'
                  : 'border-transparent text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300 hover:border-gray-300 dark:hover:border-gray-600'
              }`}
            >
              <div className="flex items-center gap-2">
                <Bot className="w-4 h-4" />
                About
              </div>
            </button>
          </nav>
        </div>

        {/* Provider Tab Content */}
        {activeTab === 'provider' && (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            {/* Provider Configuration */}
            <div className="space-y-6">
              <div className="bg-white dark:bg-gray-900 rounded-lg shadow p-6">
                <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
                  Provider Configuration
                </h2>
                
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      AI Provider
                    </label>
                    <select
                      value={tempSelectedProviderName}
                      onChange={(e) => switchProvider(e.target.value)}
                      className="w-full px-3 py-2 text-sm border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
                    >
                      {Object.keys(PROVIDER_URLS).map((providerName) => (
                        <option key={providerName} value={providerName}>
                          {providerName.replace(' (Free Models)', '')}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      API Key
                    </label>
                    <input
                      type="password"
                      value={tempApiKey}
                      onChange={(e) => setTempApiKey(e.target.value)}
                      placeholder="Enter your API key"
                      className="w-full px-3 py-2 text-sm border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white dark:bg-gray-800 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400"
                    />
                  </div>

                  {tempSelectedProviderName === 'Custom API URL' && (
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                        Custom API URL
                      </label>
                      <input
                        type="url"
                        value={tempCustomApiUrl}
                        onChange={(e) => setTempCustomApiUrl(e.target.value)}
                        placeholder="https://your-api-endpoint.com/v1/chat/completions"
                        className="w-full px-3 py-2 text-sm border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white dark:bg-gray-800 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400"
                      />
                    </div>
                  )}

                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      API Endpoint
                    </label>
                    <div className="px-3 py-2 text-sm bg-gray-100 dark:bg-gray-700 rounded-md text-gray-600 dark:text-gray-400 font-mono">
                      {getApiUrl() || 'Not configured'}
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Provider Help & Stats */}
            <div className="space-y-6">
              <div className="bg-white dark:bg-gray-900 rounded-lg shadow p-6">
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
                  🔑 Get Your API Key
                </h3>
                
                {tempSelectedProviderName === 'OpenRouter' && (
                  <div className="space-y-3">
                    <p className="text-sm text-gray-600 dark:text-gray-400">
                      🌐 Access to 100+ AI models + $1 free credit
                    </p>
                    <div className="space-y-2">
                      <a
                        href="https://openrouter.ai/keys"
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 text-sm font-medium transition-colors w-full justify-center"
                      >
                        <Key className="w-4 h-4" />
                        Get API Key
                        <ExternalLink className="w-3 h-3" />
                      </a>
                      <a
                        href="https://openrouter.ai/docs/quick-start"
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-2 px-4 py-2 bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-md hover:bg-gray-200 dark:hover:bg-gray-600 text-sm transition-colors w-full justify-center"
                      >
                        📚 Documentation
                        <ExternalLink className="w-3 h-3" />
                      </a>
                    </div>
                    <div className="text-xs text-gray-500 dark:text-gray-400">
                      💡 Free models available + $1 bonus credit for premium models
                    </div>
                  </div>
                )}
                
                {tempSelectedProviderName === 'Together AI' && (
                  <div className="space-y-3">
                    <p className="text-sm text-gray-600 dark:text-gray-400">
                      🚀 Fast inference with top open-source models
                    </p>
                    <div className="space-y-2">
                      <a
                        href="https://api.together.xyz/settings/api-keys"
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-2 px-4 py-2 bg-purple-600 text-white rounded-md hover:bg-purple-700 text-sm font-medium transition-colors w-full justify-center"
                      >
                        <Key className="w-4 h-4" />
                        Get API Key
                        <ExternalLink className="w-3 h-3" />
                      </a>
                      <a
                        href="https://docs.together.ai/docs/quickstart"
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-2 px-4 py-2 bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-md hover:bg-gray-200 dark:hover:bg-gray-600 text-sm transition-colors w-full justify-center"
                      >
                        📚 Documentation
                        <ExternalLink className="w-3 h-3" />
                      </a>
                    </div>
                    <div className="text-xs text-gray-500 dark:text-gray-400">
                      ⚡ Competitive pricing • Best open-source models
                    </div>
                  </div>
                )}
                
                {tempSelectedProviderName === 'Groq' && (
                  <div className="space-y-3">
                    <p className="text-sm text-gray-600 dark:text-gray-400">
                      🆓 Ultra-fast inference • 14,400 free requests/day
                    </p>
                    <div className="space-y-2">
                      <a
                        href="https://console.groq.com/keys"
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-2 px-4 py-2 bg-orange-600 text-white rounded-md hover:bg-orange-700 text-sm font-medium transition-colors w-full justify-center"
                      >
                        <Key className="w-4 h-4" />
                        Get API Key
                        <ExternalLink className="w-3 h-3" />
                      </a>
                      <a
                        href="https://console.groq.com/docs/quickstart"
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-2 px-4 py-2 bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-md hover:bg-gray-200 dark:hover:bg-gray-600 text-sm transition-colors w-full justify-center"
                      >
                        📚 Documentation
                        <ExternalLink className="w-3 h-3" />
                      </a>
                    </div>
                    <div className="text-xs text-gray-500 dark:text-gray-400">
                      ⚡ Fastest inference available • Generous free tier
                    </div>
                  </div>
                )}

                {tempSelectedProviderName === 'Custom API URL' && (
                  <div className="space-y-3">
                    <p className="text-sm text-gray-600 dark:text-gray-400">
                      Connect to your own OpenAI-compatible API endpoint
                    </p>
                    <div className="text-xs text-gray-500 dark:text-gray-400">
                      🔧 Use your own OpenAI-compatible API endpoint. Make sure to include the full URL path to the chat completions endpoint.
                    </div>
                  </div>
                )}
              </div>

              <div className="bg-white dark:bg-gray-900 rounded-lg shadow p-6">
                <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
                  Provider Statistics
                </h2>
                
                <div className="space-y-3">
                  <div className="flex justify-between">
                    <span className="text-sm text-gray-600 dark:text-gray-400">Total Models</span>
                    <span className="text-sm font-medium text-gray-900 dark:text-white">
                      {availableModels.length}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm text-gray-600 dark:text-gray-400">Free Models</span>
                    <span className="text-sm font-medium text-emerald-600 dark:text-emerald-400">
                      {availableModels.filter(m => m.id.toLowerCase().includes('free') || (m.description?.toLowerCase().includes('free') ?? false)).length}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm text-gray-600 dark:text-gray-400">With Reasoning</span>
                    <span className="text-sm font-medium text-gray-900 dark:text-white">
                      {availableModels.filter(m => m.supportsReasoning).length}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm text-gray-600 dark:text-gray-400">With Vision</span>
                    <span className="text-sm font-medium text-gray-900 dark:text-white">
                      {availableModels.filter(m => m.supportsImages).length}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm text-gray-600 dark:text-gray-400">Web Search</span>
                    <span className="text-sm font-medium text-gray-900 dark:text-white">
                      {availableModels.filter(m => m.supportsWebSearch).length}
                    </span>
                  </div>
                </div>
              </div>

              <div className="bg-blue-50 dark:bg-gray-900 rounded-lg p-4 border border-blue-200 dark:border-gray-600">
                <h4 className="text-sm font-medium text-blue-800 dark:text-gray-200 mb-2">
                  💡 Quick Setup Tips
                </h4>
                <div className="text-xs text-blue-700 dark:text-gray-300 space-y-1">
                  <div>• <strong>Fastest setup:</strong> Groq (sign up → get key → paste)</div>
                  <div>• <strong>Most models:</strong> OpenRouter (100+ models + free options + $1 credit)</div>
                  <div>• <strong>Open source focus:</strong> Together AI (fast inference, competitive pricing)</div>
                  <div>• <strong>Custom endpoints:</strong> Use your own OpenAI-compatible API</div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Models Tab Content */}
        {activeTab === 'models' && (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Model Selection - Takes 2 columns */}
            <div className="lg:col-span-2">
              <div className="bg-white dark:bg-gray-900 rounded-lg shadow">
                {/* Header */}
                <div className="p-6 border-b border-gray-200 dark:border-gray-700">
                  <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center gap-3">
                      <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
                        Available Models
                      </h2>
                      <span className="px-2 py-1 bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-400 text-xs rounded-full">
                        {filteredModels.length} models
                      </span>
                    </div>
                    <div className="flex items-center gap-2">
                      {isLoadingModels && (
                        <RefreshCw className="w-5 h-5 animate-spin text-blue-600" />
                      )}
                      <div className="flex border border-gray-300 dark:border-gray-600 rounded-md">
                        <button
                          onClick={() => setViewMode('list')}
                          className={`p-2 text-sm ${
                            viewMode === 'list'
                              ? 'bg-blue-100 text-blue-600 dark:bg-blue-900/30 dark:text-blue-400'
                              : 'text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700'
                          }`}
                        >
                          <List className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => setViewMode('grid')}
                          className={`p-2 text-sm border-l border-gray-300 dark:border-gray-600 ${
                            viewMode === 'grid'
                              ? 'bg-blue-100 text-blue-600 dark:bg-blue-900/30 dark:text-blue-400'
                              : 'text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700'
                          }`}
                        >
                          <Grid className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  </div>

                  {/* Search Bar */}
                  <div className="relative mb-4">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                    <input
                      type="text"
                      placeholder="Search models by name, ID, or description..."
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      className="w-full pl-10 pr-4 py-2 text-sm border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white dark:bg-gray-800 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400"
                    />
                    {searchQuery && (
                      <button
                        onClick={() => setSearchQuery('')}
                        className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
                      >
                        <X className="w-4 h-4" />
                      </button>
                    )}
                  </div>

                  {/* Filters */}
                  <div className="flex flex-wrap items-center gap-2">
                    <Filter className="w-4 h-4 text-gray-500 dark:text-gray-400" />
                    <span className="text-sm text-gray-500 dark:text-gray-400 mr-2">Filter by:</span>
                    
                    <button
                      onClick={() => toggleFilter('reasoning')}
                      className={`inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-medium transition-colors ${
                        selectedFilters.includes('reasoning')
                          ? 'bg-purple-100 text-purple-700 dark:bg-gray-700 dark:text-purple-300'
                          : 'bg-gray-100 text-gray-600 dark:bg-gray-700 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-600'
                      }`}
                    >
                      <Brain className="w-3 h-3" />
                      Reasoning
                    </button>

                    <button
                      onClick={() => toggleFilter('vision')}
                      className={`inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-medium transition-colors ${
                        selectedFilters.includes('vision')
                          ? 'bg-green-100 text-green-700 dark:bg-gray-700 dark:text-green-300'
                          : 'bg-gray-100 text-gray-600 dark:bg-gray-700 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-600'
                      }`}
                    >
                      <ImageIcon className="w-3 h-3" />
                      Vision
                    </button>

                    <button
                      onClick={() => toggleFilter('search')}
                      className={`inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-medium transition-colors ${
                        selectedFilters.includes('search')
                          ? 'bg-blue-100 text-blue-700 dark:bg-gray-700 dark:text-blue-300'
                          : 'bg-gray-100 text-gray-600 dark:bg-gray-700 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-600'
                      }`}
                    >
                      <Search className="w-3 h-3" />
                      Web Search
                    </button>

                    <button
                      onClick={() => toggleFilter('free')}
                      className={`inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-medium transition-colors ${
                        selectedFilters.includes('free')
                          ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-300'
                          : 'bg-gray-100 text-gray-600 dark:bg-gray-700 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-600'
                      }`}
                    >
                      <Sparkles className="w-3 h-3" />
                      Free
                    </button>

                    {(searchQuery || selectedFilters.length > 0) && (
                      <button
                        onClick={clearFilters}
                        className="inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-medium bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-300 hover:bg-red-200 dark:hover:bg-red-900/50 transition-colors"
                      >
                        <X className="w-3 h-3" />
                        Clear All
                      </button>
                    )}
                  </div>
                </div>

                {/* Models Display */}
                <div className="p-6">
                  {modelsError && (
                    <div className="mb-4 p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-md">
                      <p className="text-sm text-red-800 dark:text-red-200">{modelsError}</p>
                    </div>
                  )}

                  {filteredModels.length === 0 ? (
                    <div className="text-center py-8">
                      <div className="text-gray-400 mb-2">
                        <Search className="w-8 h-8 mx-auto" />
                      </div>
                      <p className="text-gray-500 dark:text-gray-400 text-sm">
                        {searchQuery || selectedFilters.length > 0 
                          ? 'No models match your search criteria'
                          : 'No models available'
                        }
                      </p>
                      {(searchQuery || selectedFilters.length > 0) && (
                        <button
                          onClick={clearFilters}
                          className="mt-2 text-blue-600 dark:text-blue-400 text-sm hover:underline"
                        >
                          Clear filters
                        </button>
                      )}
                    </div>
                  ) : (
                    <div className={viewMode === 'grid' 
                      ? 'grid grid-cols-1 md:grid-cols-2 gap-4' 
                      : 'space-y-3'
                    }>
                      {filteredModels.map((model) => (
                        <div
                          key={model.id}
                          onClick={() => {
                            setTempSelectedModel(model.id); // Only update temp selection
                          }}
                          className={`p-4 rounded-lg border-2 cursor-pointer transition-all relative ${
                            tempSelectedModel === model.id
                              ? 'border-blue-500 bg-blue-50 dark:bg-gray-700'
                              : 'border-gray-200 dark:border-gray-600 hover:border-gray-300 dark:hover:border-gray-500 hover:shadow-sm'
                          }`}
                        >
                          {/* Currently active model indicator */}
                          {selectedModel === model.id && (
                            <div className="absolute top-2 right-2">
                              <div className="w-3 h-3 bg-green-500 rounded-full border-2 border-white shadow-sm" title="Currently active model"></div>
                            </div>
                          )}
                          
                          <div className="flex items-start justify-between">
                            <div className="flex-1 min-w-0">
                              <div className="flex items-start gap-2">
                                <div className="flex-1 min-w-0">
                                  <div className="flex items-center gap-2">
                                    <h3 className="font-medium text-gray-900 dark:text-white text-sm leading-tight">
                                      {model.name.replace(' (Free)', '').replace('(Free Tier)', '').split(' ').slice(0, 4).join(' ')}
                                      {model.name.split(' ').length > 4 && '...'}
                                    </h3>
                                    {(model.id.toLowerCase().includes('free') || (model.description?.toLowerCase().includes('free') ?? false)) && (
                                      <span className="px-1.5 py-0.5 bg-emerald-100 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-300 text-xs rounded font-medium">
                                        FREE
                                      </span>
                                    )}
                                    {selectedModel === model.id && (
                                      <span className="px-1.5 py-0.5 bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-300 text-xs rounded font-medium">
                                        ACTIVE
                                      </span>
                                    )}
                                  </div>
                                </div>
                                {tempSelectedModel === model.id && (
                                  <div className="flex-shrink-0">
                                    <div className="w-5 h-5 bg-blue-600 rounded-full flex items-center justify-center">
                                      <Check className="w-3 h-3 text-white" />
                                    </div>
                                  </div>
                                )}
                              </div>
                              <p className="text-xs text-gray-500 dark:text-gray-400 mt-1 font-mono">
                                {model.id}
                              </p>
                              <p className="text-xs text-gray-600 dark:text-gray-400 mt-1 line-clamp-2">
                                {model.description}
                              </p>
                              {!(model.id.toLowerCase().includes('free') || (model.description?.toLowerCase().includes('free') ?? false)) && model.pricing && (
                                <p className="text-xs text-gray-500 dark:text-gray-500 mt-1">
                                  ${model.pricing.prompt.toFixed(4)} / ${model.pricing.completion.toFixed(4)} per 1K tokens
                                </p>
                              )}
                              <div className="flex gap-1 mt-2 flex-wrap">
                                {model.supportsReasoning && (
                                  <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-purple-100 dark:bg-purple-900/30 text-purple-700 dark:text-purple-300 text-xs rounded">
                                    <Brain className="w-3 h-3" />
                                    {viewMode === 'list' && 'Reasoning'}
                                  </span>
                                )}
                                {model.supportsImages && (
                                  <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-300 text-xs rounded">
                                    <ImageIcon className="w-3 h-3" />
                                    {viewMode === 'list' && 'Vision'}
                                  </span>
                                )}
                                <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-blue-100 dark:bg-gray-700 text-blue-700 dark:text-blue-300 text-xs rounded">
                                  <Search className="w-3 h-3" />
                                  {viewMode === 'list' && 'Web Search'}
                                </span>
                              </div>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Model Details Sidebar */}
            <div className="space-y-6">
              {tempSelectedModel && (
                <div className="bg-white dark:bg-gray-900 rounded-lg shadow p-6">
                  <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
                    Selected Model {tempSelectedModel !== selectedModel && (
                      <span className="text-sm text-orange-600 dark:text-orange-400 font-normal">
                        (Not saved yet)
                      </span>
                    )}
                  </h2>
                  
                  {(() => {
                    const model = availableModels.find(m => m.id === tempSelectedModel);
                    if (!model) return null;
                    
                    return (
                      <div className="space-y-4">
                        <div>
                          <h3 className="font-medium text-gray-900 dark:text-white text-lg">
                            {model.name.replace(' (Free)', '').replace('(Free Tier)', '')}
                          </h3>
                          <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                            Model ID: <code className="bg-gray-100 dark:bg-gray-700 px-1 rounded">{model.id}</code>
                          </p>
                        </div>
                        
                        <div>
                          <h4 className="font-medium text-gray-900 dark:text-white mb-2">Description</h4>
                          <p className="text-sm text-gray-600 dark:text-gray-400">
                            {model.description}
                          </p>
                        </div>
                        
                        <div>
                          <h4 className="font-medium text-gray-900 dark:text-white mb-2">Capabilities</h4>
                          <div className="space-y-2">
                            <div className="flex items-center gap-2">
                              <Brain className={`w-4 h-4 ${model.supportsReasoning ? 'text-green-600' : 'text-gray-400'}`} />
                              <span className={`text-sm ${model.supportsReasoning ? 'text-green-600' : 'text-gray-400'}`}>
                                Advanced Reasoning
                              </span>
                            </div>
                            <div className="flex items-center gap-2">
                              <ImageIcon className={`w-4 h-4 ${model.supportsImages ? 'text-green-600' : 'text-gray-400'}`} />
                              <span className={`text-sm ${model.supportsImages ? 'text-green-600' : 'text-gray-400'}`}>
                                Image Analysis
                              </span>
                            </div>
                            <div className="flex items-center gap-2">
                              <Search className={`w-4 h-4 ${model.supportsWebSearch ? 'text-green-600' : 'text-gray-400'}`} />
                              <span className={`text-sm ${model.supportsWebSearch ? 'text-green-600' : 'text-gray-400'}`}>
                                Web Search
                              </span>
                            </div>
                          </div>
                        </div>
                      </div>
                    );
                  })()}
                </div>
              )}

              {/* Filtered Stats */}
              <div className="bg-white dark:bg-gray-900 rounded-lg shadow p-6">
                <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
                  Search Results
                </h2>
                
                <div className="space-y-3">
                  <div className="flex justify-between">
                    <span className="text-sm text-gray-600 dark:text-gray-400">Showing</span>
                    <span className="text-sm font-medium text-gray-900 dark:text-white">
                      {filteredModels.length} / {availableModels.length}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm text-gray-600 dark:text-gray-400">Free Models</span>
                    <span className="text-sm font-medium text-emerald-600 dark:text-emerald-400">
                      {filteredModels.filter(m => m.id.toLowerCase().includes('free') || (m.description?.toLowerCase().includes('free') ?? false)).length}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm text-gray-600 dark:text-gray-400">With Reasoning</span>
                    <span className="text-sm font-medium text-gray-900 dark:text-white">
                      {filteredModels.filter(m => m.supportsReasoning).length}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm text-gray-600 dark:text-gray-400">With Vision</span>
                    <span className="text-sm font-medium text-gray-900 dark:text-white">
                      {filteredModels.filter(m => m.supportsImages).length}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm text-gray-600 dark:text-gray-400">Web Search</span>
                    <span className="text-sm font-medium text-gray-900 dark:text-white">
                      {filteredModels.filter(m => m.supportsWebSearch).length}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Token Settings Tab Content */}
        {activeTab === 'tokens' && (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            {/* Token Configuration */}
            <div className="space-y-6">
              <div className="bg-white dark:bg-gray-900 rounded-lg shadow p-6">
                <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
                  Response Length Settings
                </h2>
                
                <div className="space-y-6">
                  <div>
                    <div className="flex items-center gap-3 mb-4">
                      <input
                        type="checkbox"
                        id="adaptive-tokens"
                        checked={tempUseAdaptiveTokens}
                        onChange={(e) => setTempUseAdaptiveTokens(e.target.checked)}
                        className="w-4 h-4 text-blue-600 bg-gray-100 border-gray-300 rounded focus:ring-blue-500 dark:focus:ring-blue-600 dark:ring-offset-gray-800 focus:ring-2 dark:bg-gray-700 dark:border-gray-600"
                      />
                      <label htmlFor="adaptive-tokens" className="text-sm font-medium text-gray-700 dark:text-gray-300">
                        Smart Token Management (Recommended)
                      </label>
                    </div>
                    <p className="text-xs text-gray-500 dark:text-gray-400 ml-7">
                      Automatically adjusts response length based on your input length and model context limits
                    </p>
                  </div>

                  <div className={`space-y-4 ${!tempUseAdaptiveTokens ? 'opacity-50' : ''}`}>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                        Maximum Response Length (tokens)
                      </label>
                      <input
                        type="number"
                        value={tempMaxTokens}
                        onChange={(e) => setTempMaxTokens(parseInt(e.target.value) || 500)}
                        disabled={!tempUseAdaptiveTokens}
                        placeholder="Enter number of tokens"
                        className="w-full px-3 py-2 text-sm border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white dark:bg-gray-800 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 disabled:opacity-50"
                      />
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Token Information */}
            <div className="space-y-6">
              <div className="bg-white dark:bg-gray-900 rounded-lg shadow p-6">
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
                  💡 Understanding Tokens
                </h3>
                
                <div className="space-y-4 text-sm text-gray-600 dark:text-gray-400">
                  <div>
                    <h4 className="font-medium text-gray-900 dark:text-white mb-2">What are tokens?</h4>
                    <p>Tokens are pieces of text that AI models process. Roughly:</p>
                    <ul className="list-disc ml-5 mt-2 space-y-1">
                      <li>1 token ≈ 4 characters</li>
                      <li>1 token ≈ 0.75 words</li>
                      <li>&quot;Hello world&quot; = ~3 tokens</li>
                    </ul>
                  </div>
                  
                  <div>
                    <h4 className="font-medium text-gray-900 dark:text-white mb-2">Response Length Guide</h4>
                    <ul className="space-y-2">
                      <li><strong>50-200 tokens:</strong> Brief answers (1-2 sentences)</li>
                      <li><strong>200-500 tokens:</strong> Short explanations (1 paragraph)</li>
                      <li><strong>500-1000 tokens:</strong> Detailed responses (2-3 paragraphs)</li>
                      <li><strong>1000+ tokens:</strong> Comprehensive explanations</li>
                    </ul>
                  </div>

                  <div>
                    <h4 className="font-medium text-gray-900 dark:text-white mb-2">Smart Token Management</h4>
                    <p>When enabled, the system automatically:</p>
                    <ul className="list-disc ml-5 mt-2 space-y-1">
                      <li>Calculates your input length</li>
                      <li>Adjusts output based on model limits</li>
                      <li>Prevents context overflow errors</li>
                      <li>Optimizes for complete responses</li>
                    </ul>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* About Tab Content */}
        {activeTab === 'about' && (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            {/* About Information */}
            <div className="space-y-6">
              <div className="bg-white dark:bg-gray-900 rounded-lg shadow p-6">
                <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
                  About RavenGPT
                </h2>
                
                <div className="space-y-4">
                  <div>
                    <h3 className="text-sm font-medium text-gray-900 dark:text-white mb-2">
                      Created by
                    </h3>
                    <div className="flex items-center gap-3 p-3 bg-gray-50 dark:bg-gray-700 rounded-lg">
                      <div className="w-10 h-10 bg-gradient-to-r from-blue-500 to-purple-600 rounded-full flex items-center justify-center">
                        <span className="text-white font-bold text-sm">W</span>
                      </div>
                      <div>
                        <div className="font-medium text-gray-900 dark:text-white">wh1sky02</div>
                        <div className="text-sm text-gray-500 dark:text-gray-400">Developer</div>
                      </div>
                    </div>
                  </div>

                  <div>
                    <h3 className="text-sm font-medium text-gray-900 dark:text-white mb-2">
                      Version & Status
                    </h3>
                    <div className="space-y-2">
                      <div className="flex items-center gap-2">
                        <span className="px-2 py-1 bg-blue-100 dark:bg-gray-700 text-blue-700 dark:text-blue-300 text-xs rounded-full font-medium">
                          v1.0.0-beta
                        </span>
                        <span className="px-2 py-1 bg-orange-100 dark:bg-orange-900/30 text-orange-700 dark:text-orange-300 text-xs rounded-full font-medium">
                          Development Phase
                        </span>
                      </div>
                      <p className="text-sm text-gray-600 dark:text-gray-400">
                        Built with Next.js 15, TypeScript, and Tailwind CSS
                      </p>
                    </div>
                  </div>

                  <div>
                    <h3 className="text-sm font-medium text-gray-900 dark:text-white mb-2">
                      Features
                    </h3>
                    <ul className="text-sm text-gray-600 dark:text-gray-400 space-y-1">
                      <li>• Multiple AI provider support (OpenRouter, Groq, Together AI)</li>
                      <li>• Advanced reasoning capabilities</li>
                      <li>• Vision analysis and image processing</li>
                      <li>• Web search integration</li>
                      <li>• Responsive dark/light themes</li>
                      <li>• Local storage and privacy-focused</li>
                    </ul>
                  </div>
                </div>
              </div>
            </div>

            {/* Development Notice & Support */}
            <div className="space-y-6">
              <div className="bg-yellow-50 dark:bg-yellow-900/20 rounded-lg shadow p-6 border border-yellow-200 dark:border-yellow-700">
                <h2 className="text-lg font-semibold text-yellow-800 dark:text-yellow-200 mb-4">
                  ⚠️ Development Notice
                </h2>
                
                <div className="space-y-4 text-sm text-yellow-700 dark:text-yellow-300">
                  <div>
                    <h4 className="font-medium mb-2">Current Status</h4>
                    <p>
                      This application is currently in the <strong>development phase</strong>. 
                      While we strive for stability and reliability, you may encounter:
                    </p>
                    <ul className="list-disc ml-5 mt-2 space-y-1">
                      <li>Occasional bugs or unexpected behavior</li>
                      <li>Features that are still being refined</li>
                      <li>UI/UX improvements in progress</li>
                      <li>API rate limiting or provider-specific issues</li>
                    </ul>
                  </div>

                  <div>
                    <h4 className="font-medium mb-2">What to Expect</h4>
                    <ul className="list-disc ml-5 space-y-1">
                      <li>Regular updates and improvements</li>
                      <li>New features and capabilities</li>
                      <li>Bug fixes and performance optimizations</li>
                      <li>Enhanced user experience</li>
                    </ul>
                  </div>

                  <div className="p-3 bg-yellow-100 dark:bg-yellow-900/40 rounded border border-yellow-300 dark:border-yellow-600">
                    <strong>Tip:</strong> If you encounter any issues, try refreshing the page, 
                    checking your API key, or switching to a different AI provider in the settings.
                  </div>
                </div>
              </div>

              <div className="bg-white dark:bg-gray-900 rounded-lg shadow p-6">
                <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
                  Technical Information
                </h2>
                
                <div className="space-y-3">
                  <div className="flex justify-between">
                    <span className="text-sm text-gray-600 dark:text-gray-400">Framework</span>
                    <span className="text-sm font-medium text-gray-900 dark:text-white">Next.js 15</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm text-gray-600 dark:text-gray-400">Language</span>
                    <span className="text-sm font-medium text-gray-900 dark:text-white">TypeScript</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm text-gray-600 dark:text-gray-400">Styling</span>
                    <span className="text-sm font-medium text-gray-900 dark:text-white">Tailwind CSS</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm text-gray-600 dark:text-gray-400">Icons</span>
                    <span className="text-sm font-medium text-gray-900 dark:text-white">Lucide React</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm text-gray-600 dark:text-gray-400">Storage</span>
                    <span className="text-sm font-medium text-gray-900 dark:text-white">Browser Local Storage</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm text-gray-600 dark:text-gray-400">Privacy</span>
                    <span className="text-sm font-medium text-emerald-600 dark:text-emerald-400">100% Local</span>
                  </div>
                </div>
              </div>

              <div className="bg-blue-50 dark:bg-gray-900 rounded-lg p-4 border border-blue-200 dark:border-gray-600">
                <h4 className="text-sm font-medium text-blue-800 dark:text-gray-200 mb-2">
                  🛡️ Privacy & Security
                </h4>
                <div className="text-xs text-blue-700 dark:text-gray-300 space-y-1">
                  <div>• Your API keys are stored locally in your browser only</div>
                  <div>• No data is sent to external servers except AI providers</div>
                  <div>• Chat history is saved locally and never uploaded</div>
                  <div>• Full control over your data and conversations</div>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}