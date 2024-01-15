'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import { Send, Settings, Bot, Menu, Sidebar, Moon, Sun, Plus, Edit3, Trash2, Upload, Search, Brain, X, FileText, Image as ImageIcon } from 'lucide-react';
import Link from 'next/link';
import { Model, FeatureMode, PROVIDER_URLS, Message } from '@/lib/types';
import { fetchOpenRouterModels, fetchGroqModels, fetchTogetherAIModels } from '@/lib/api';
import { useChatSessions } from '@/hooks/useChatSessions';
import { MessageBubble } from '@/components/MessageBubble';





export default function Home() {
  // Chat session management
  const {
    chatSessions,
    currentChatId,
    setCurrentChatId: setHookCurrentChatId,
    createNewChat: createNewChatSession,
    deleteChat: deleteChatSession,
    renameChat: renameChatSession,
    updateChatMessages,
    isInitialized: isSessionsInitialized
  } = useChatSessions();

  const [showSidebar, setShowSidebar] = useState(true);
  const [editingChatId, setEditingChatId] = useState<string | null>(null);
  const [editingTitle, setEditingTitle] = useState('');
  const [searchQuery, setSearchQuery] = useState('');

  // Current chat state
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [apiKey, setApiKey] = useState('');
  const [selectedProviderUrl, setSelectedProviderUrl] = useState(PROVIDER_URLS['OpenRouter']);
  const [selectedProviderName, setSelectedProviderName] = useState('OpenRouter');
  const [customApiUrl, setCustomApiUrl] = useState('');
  const [availableModels, setAvailableModels] = useState<Model[]>([]);
  const [selectedModel, setSelectedModel] = useState('');
  const [isLoadingModels, setIsLoadingModels] = useState(false);
  const [, setModelsError] = useState<string | null>(null);

  // Dark mode state
  const [isDarkMode, setIsDarkMode] = useState(false);

  // New feature states
  const [featureMode, setFeatureMode] = useState<FeatureMode>('standard');
  const [showReasoning, setShowReasoning] = useState(true);
  const [currentStreamingReasoning, setCurrentStreamingReasoning] = useState<string>('');
  const [uploadedFiles, setUploadedFiles] = useState<Array<{
    type: 'image' | 'document';
    name: string;
    url: string;
    size: number;
  }>>([]);

  // Token settings
  const [userMaxTokens, setUserMaxTokens] = useState(500);
  const [useAdaptiveTokens, setUseAdaptiveTokens] = useState(true);

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const initialModelLoadRef = useRef<boolean>(false);

  // Get the actual API URL to use
  const getApiUrl = () => {
    if (selectedProviderName === 'Custom API URL') {
      return customApiUrl;
    }
    return selectedProviderUrl;
  };

  // Switch provider helper - handled by settings page

  // Dark mode toggle function
  const toggleDarkMode = useCallback(() => {
    const newDarkMode = !isDarkMode;
    setIsDarkMode(newDarkMode);

    if (newDarkMode) {
      document.documentElement.classList.add('dark');
      localStorage.setItem('dark-mode', 'true');
      console.log('Dark mode enabled');
    } else {
      document.documentElement.classList.remove('dark');
      localStorage.setItem('dark-mode', 'false');
      console.log('Dark mode disabled');
    }
  }, [isDarkMode]);

  // Chat Management Functions
  const generateChatTitle = (firstMessage: string): string => {
    if (firstMessage.length > 50) {
      return firstMessage.substring(0, 50) + '...';
    }
    return firstMessage || 'New Chat';
  };

  const createNewChat = () => {
    createNewChatSession(featureMode, selectedModel);
    setMessages([]);
    setUploadedFiles([]);
  };

  const switchToChat = (chatId: string) => {
    const chat = chatSessions.find(c => c.id === chatId);
    if (chat) {
      setHookCurrentChatId(chatId);
      setMessages(chat.messages);
      setFeatureMode(chat.featureMode);
      setSelectedModel(chat.model);
      setUploadedFiles([]);
    }
  };

  const updateCurrentChat = useCallback((updatedMessages: Message[]) => {
    if (!currentChatId) return;

    updateChatMessages(currentChatId, updatedMessages, (currentTitle) => {
      if (currentTitle === 'New Chat' && updatedMessages.length > 0) {
        const firstContent = updatedMessages[0].content;
        const contentString = typeof firstContent === 'string' ? firstContent : 'Multimodal Message';
        return generateChatTitle(contentString);
      }
      return currentTitle;
    });
  }, [currentChatId, updateChatMessages]);

  const deleteChat = (chatId: string) => {
    const remaining = chatSessions.filter(c => c.id !== chatId);
    deleteChatSession(chatId);

    if (currentChatId === chatId) {
      if (remaining.length > 0) {
        switchToChat(remaining[0].id);
      } else {
        setHookCurrentChatId('');
        setMessages([]);
        setUploadedFiles([]);
      }
    }
  };

  const renameChat = (chatId: string, newTitle: string) => {
    renameChatSession(chatId, newTitle);
    setEditingChatId(null);
    setEditingTitle('');
  };

  // Sync state on initialization
  useEffect(() => {
    if (isSessionsInitialized && currentChatId) {
      const chat = chatSessions.find(c => c.id === currentChatId);
      // Only sync if local messages are empty but stored session has messages (restoration)
      // or if we just initialized and need to set the initial state
      if (chat && messages.length === 0 && chat.messages.length > 0) {
        setMessages(chat.messages);
        setFeatureMode(chat.featureMode);
        setSelectedModel(chat.model);
      } else if (chat && messages.length === 0 && chat.messages.length === 0) {
        // Sync empty chat state (e.g. initial load of new chat)
        setFeatureMode(chat.featureMode);
        setSelectedModel(chat.model);
      }
    }
  }, [isSessionsInitialized, currentChatId, chatSessions, messages.length]);

  const fetchAvailableModels = useCallback(async () => {
    setIsLoadingModels(true);
    setModelsError(null);

    try {
      let models: Model[] = [];

      console.log(`🔍 Fetching models for provider: ${selectedProviderName}`);

      switch (selectedProviderName) {
        case 'OpenRouter':
          try {
            models = await fetchOpenRouterModels();
          } catch (error) {
            console.error('OpenRouter fetch failed:', error);
            setModelsError('Could not fetch OpenRouter models. Please check your internet connection.');
            models = [];
          }
          break;
        case 'Together AI':
          try {
            models = await fetchTogetherAIModels(apiKey);
          } catch (error) {
            console.error('Together AI fetch failed:', error);
            setModelsError('Could not fetch Together AI models. Please check your internet connection.');
            models = [];
          }
          break;
        case 'Groq':
          try {
            models = await fetchGroqModels(apiKey);
          } catch (error) {
            console.error('Groq fetch failed:', error);
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

      console.log(`📋 Available models for ${selectedProviderName}:`, models.map(m => m.id));

      if (models.length > 0) {
        setAvailableModels(models);

        // Always prioritize localStorage over potentially stale React state
        const savedModel = localStorage.getItem('selected-model');

        setSelectedModel(currentSelectedModel => {
          // Always use saved model if available, regardless of current state
          const modelToValidate = savedModel || currentSelectedModel;
          const modelExists = models.find(m => m.id === modelToValidate);

          console.log(`🔎 === MODEL VALIDATION ===`);
          console.log(`Provider: ${selectedProviderName}`);
          console.log(`Current state model: "${currentSelectedModel}"`);
          console.log(`Saved localStorage model: "${savedModel}"`);
          console.log(`Model to validate: "${modelToValidate}"`);
          console.log(`Model exists in fetched models: ${!!modelExists}`);
          console.log(`Initial load completed: ${initialModelLoadRef.current}`);
          console.log(`Available model IDs:`, models.map(m => m.id));

          // Mark initial load as complete
          if (!initialModelLoadRef.current) {
            initialModelLoadRef.current = true;
          }

          // If saved model exists in the fetched models, use it
          if (savedModel && modelExists) {
            console.log(`✅ Using saved model "${savedModel}" (confirmed exists)`);
            return savedModel;
          }

          // If saved model doesn't exist, or no saved model, use first available
          if (!modelExists || !savedModel) {
            const fallbackModel = models[0].id;
            console.log(`⚠️  ${savedModel ? `Saved model "${savedModel}" not found` : 'No saved model'}, switching to "${fallbackModel}"`);
            localStorage.setItem('selected-model', fallbackModel);
            return fallbackModel;
          }

          console.log(`✅ Model "${modelToValidate}" confirmed for ${selectedProviderName}`);
          return modelToValidate;
        });

        console.log(`✅ Loaded ${models.length} models from ${selectedProviderName}`);
      } else {
        console.warn(`No models found for ${selectedProviderName}`);
        setAvailableModels([]);
        setSelectedModel('');
        localStorage.removeItem('selected-model');
      }
    } catch (error) {
      console.error('Unexpected error fetching models:', error);
      setModelsError(`Unexpected error loading models from ${selectedProviderName}.`);
      setAvailableModels([]);
      setSelectedModel('');
      localStorage.removeItem('selected-model');
    } finally {
      setIsLoadingModels(false);
    }
  }, [selectedProviderName, apiKey]);



  // Function to load settings from localStorage
  const loadSettings = useCallback(() => {
    console.log('🔄 === LOADING SETTINGS FROM LOCALSTORAGE ===');
    const savedApiKey = localStorage.getItem('openrouter-api-key');
    const savedProvider = localStorage.getItem('selected-provider');
    const savedProviderUrl = localStorage.getItem('selected-provider-url');
    const savedCustomUrl = localStorage.getItem('custom-api-url');
    const savedModel = localStorage.getItem('selected-model');
    const savedMode = localStorage.getItem('feature-mode') as FeatureMode;
    const savedMaxTokens = localStorage.getItem('max-tokens');
    const savedUseAdaptive = localStorage.getItem('use-adaptive-tokens');

    console.log(`📦 Saved settings:`, {
      provider: savedProvider,
      model: savedModel,
      hasApiKey: !!savedApiKey
    });

    if (savedApiKey) setApiKey(savedApiKey);
    if (savedProvider && PROVIDER_URLS[savedProvider as keyof typeof PROVIDER_URLS]) {
      console.log(`🔧 Setting provider to: ${savedProvider}`);
      setSelectedProviderName(savedProvider);
      setSelectedProviderUrl(PROVIDER_URLS[savedProvider as keyof typeof PROVIDER_URLS]);
    }
    if (savedProviderUrl) setSelectedProviderUrl(savedProviderUrl);
    if (savedCustomUrl) setCustomApiUrl(savedCustomUrl);
    if (savedModel) {
      console.log(`🎯 Setting selected model to: ${savedModel}`);
      setSelectedModel(current => {
        console.log(`🔄 Model state change: "${current}" -> "${savedModel}"`);
        return savedModel;
      });
    }
    if (savedMode) setFeatureMode(savedMode);
    if (savedMaxTokens) setUserMaxTokens(parseInt(savedMaxTokens));
    if (savedUseAdaptive !== null) setUseAdaptiveTokens(savedUseAdaptive === 'true');

    console.log('✅ === SETTINGS LOADING COMPLETE ===');
  }, []);

  useEffect(() => {
    loadSettings();
    loadSettings();
  }, [loadSettings]);

  // Listen for localStorage changes (from settings page)
  useEffect(() => {
    const handleStorageChange = (e: StorageEvent) => {
      console.log(`📡 Storage change event:`, { key: e.key, oldValue: e.oldValue, newValue: e.newValue });

      if (e.key === 'selected-model' && e.newValue) {
        console.log(`🔄 Storage change detected - Model changed to: ${e.newValue}`);
        setSelectedModel(e.newValue);
      }
      if (e.key === 'selected-provider' && e.newValue) {
        console.log(`🔄 Storage change detected - Provider changed to: ${e.newValue}`);
        setSelectedProviderName(e.newValue);
        if (PROVIDER_URLS[e.newValue as keyof typeof PROVIDER_URLS]) {
          setSelectedProviderUrl(PROVIDER_URLS[e.newValue as keyof typeof PROVIDER_URLS]);
        }
      }
      if (e.key === 'openrouter-api-key' && e.newValue) {
        console.log(`🔄 Storage change detected - API key updated`);
        setApiKey(e.newValue);
      }
    };

    const handleFocus = () => {
      // When user returns to main page (e.g., from settings), reload settings
      console.log(`🔄 Window focus detected - Reloading settings`);
      loadSettings();
    };

    window.addEventListener('storage', handleStorageChange);
    window.addEventListener('focus', handleFocus);

    return () => {
      window.removeEventListener('storage', handleStorageChange);
      window.removeEventListener('focus', handleFocus);
    };
  }, [loadSettings]);

  // Fetch models when provider changes
  useEffect(() => {
    if (isSessionsInitialized) {
      // Reset initial model load flag when provider changes
      initialModelLoadRef.current = false;

      // Add a small delay to ensure localStorage is fully loaded first
      const timeoutId = setTimeout(() => {
        console.log(`🚀 Fetching models for ${selectedProviderName} after initialization`);
        fetchAvailableModels();
      }, 100);

      return () => clearTimeout(timeoutId);
    }
  }, [selectedProviderName, isSessionsInitialized, fetchAvailableModels]);

  // Dark mode initialization - runs immediately on mount
  useEffect(() => {
    const savedDarkMode = localStorage.getItem('dark-mode');
    const systemPrefersDark = window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches;

    let shouldUseDarkMode = false;

    if (savedDarkMode !== null) {
      shouldUseDarkMode = savedDarkMode === 'true';
    } else {
      shouldUseDarkMode = systemPrefersDark;
    }

    setIsDarkMode(shouldUseDarkMode);

    if (shouldUseDarkMode) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, []);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  useEffect(() => {
    if (currentChatId && messages.length > 0) {
      updateCurrentChat(messages);
    }
  }, [messages, currentChatId, updateCurrentChat]);

  useEffect(() => {
    // Cleanup duplicates handled by hook
  }, [isSessionsInitialized]);

  const setMode = (mode: FeatureMode) => {
    setFeatureMode(mode);
    localStorage.setItem('feature-mode', mode);

    // When switching to reasoning mode, ensure showReasoning is enabled by default
    if (mode === 'reasoning') {
      setShowReasoning(true);
    }

    const filteredModels = getFilteredModels(mode);
    if (filteredModels.length > 0 && !filteredModels.find(m => m.id === selectedModel)) {
      if (mode === 'web-search') {
        const newModel = filteredModels[0].id;
        setSelectedModel(newModel);
        localStorage.setItem('selected-model', newModel);
      }
    }
  };

  const getFilteredModels = (mode: FeatureMode) => {
    switch (mode) {
      case 'reasoning':
        const reasoningModels = availableModels.filter(model => model.supportsReasoning);
        return reasoningModels.length > 0 ? reasoningModels : availableModels;
      case 'vision':
        const visionModels = availableModels.filter(model => model.supportsImages);
        return visionModels.length > 0 ? visionModels : availableModels;
      case 'web-search':
        // Only OpenRouter models support true web search
        if (selectedProviderName === 'OpenRouter') {
          return availableModels.filter(model => model.supportsWebSearch);
        } else {
          // For other providers, show all models but indicate web search is simulated
          return availableModels;
        }
      default:
        return availableModels;
    }
  };

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = event.target.files;
    if (!files) return;

    for (const file of Array.from(files)) {
      const isImage = file.type.startsWith('image/');

      if (isImage) {
        const reader = new FileReader();
        reader.onload = (e) => {
          const dataUrl = e.target?.result as string;
          setUploadedFiles(prev => [...prev, {
            type: 'image',
            name: file.name,
            url: dataUrl,
            size: file.size
          }]);
        };
        reader.readAsDataURL(file);
      } else {
        const reader = new FileReader();
        reader.onload = (e) => {
          const content = e.target?.result as string;
          setUploadedFiles(prev => [...prev, {
            type: 'document',
            name: file.name,
            url: content,
            size: file.size
          }]);
        };
        reader.readAsText(file);
      }
    }
  };

  const removeUploadedFile = (index: number) => {
    setUploadedFiles(prev => prev.filter((_, i) => i !== index));
  };

  const sendMessage = async () => {
    if (!input.trim() || !apiKey) return;

    if (!currentChatId) {
      const newChatId = createNewChatSession(featureMode, selectedModel);
      setHookCurrentChatId(newChatId);
    }

    let messageContent: string | Array<{ type: string; text?: string; image_url?: { url: string } }>;

    if (uploadedFiles.length > 0 && uploadedFiles.some(f => f.type === 'image')) {
      messageContent = [
        { type: 'text', text: input.trim() },
        ...uploadedFiles
          .filter(f => f.type === 'image')
          .map(f => ({ type: 'image_url', image_url: { url: f.url } }))
      ];
    } else {
      let textContent = input.trim();

      uploadedFiles.forEach(file => {
        if (file.type === 'document') {
          textContent += `\n\n[Attached document: ${file.name}]\n${file.url}`;
        }
      });

      messageContent = textContent;
    }

    const userMessage: Message = {
      id: Date.now().toString(),
      role: 'user',
      content: messageContent,
      timestamp: new Date(),
      attachments: uploadedFiles.length > 0 ? [...uploadedFiles] : undefined,
    };

    setMessages(prev => [...prev, userMessage]);
    setInput('');
    setUploadedFiles([]);
    setIsLoading(true);
    setCurrentStreamingReasoning('');

    // Don't create initial assistant message - let the loading animation show instead
    const assistantMessageId = (Date.now() + 1).toString();
    let hasCreatedAssistantMessage = false;

    try {
      const model = selectedModel;

      // Calculate input tokens (rough estimation: 1 token ≈ 4 characters)
      const allMessagesForTokens = [
        ...messages.map(msg => ({
          role: msg.role,
          content: typeof msg.content === 'string' ? msg.content : JSON.stringify(msg.content),
        })),
        {
          role: 'user',
          content: typeof messageContent === 'string' ? messageContent : JSON.stringify(messageContent),
        },
      ];
      const inputText = allMessagesForTokens.map(msg => `${msg.role}: ${msg.content}`).join('\n');
      const estimatedInputTokens = Math.ceil(inputText.length / 4);

      // Determine max_tokens based on user settings and model limits
      let maxTokens = userMaxTokens; // Start with user preference

      // If adaptive tokens is enabled, adjust based on model and context
      if (useAdaptiveTokens) {
        // Model-specific context limits
        if (model.includes('DialoGPT') || model.includes('medium')) {
          // Very small models - total context ~1K tokens
          maxTokens = Math.max(150, 700 - estimatedInputTokens);
        } else if (model.includes('free') && (model.includes('distill') || model.includes('DeepSeek'))) {
          // DeepSeek and similar free models often have small contexts (like 532 total)
          // Be more generous but still safe
          maxTokens = Math.max(150, 450 - estimatedInputTokens);
        } else if (selectedProviderName === 'Groq') {
          // Groq models have TPM limits - be more conservative to avoid rate limiting
          if (model.includes('instant') || model.includes('8b')) {
            // These models have stricter TPM limits (6000/min)
            maxTokens = Math.max(150, Math.min(userMaxTokens, 800 - estimatedInputTokens));
          } else {
            // Other Groq models
            maxTokens = Math.max(200, Math.min(userMaxTokens, 1200 - estimatedInputTokens));
          }
        } else if (selectedProviderName === 'OpenRouter') {
          // OpenRouter varies by model
          maxTokens = Math.max(300, Math.min(userMaxTokens, 2000 - estimatedInputTokens));
        } else if (selectedProviderName === 'Together AI') {
          // Together AI - be conservative
          if (model.includes('8b') || model.includes('7B')) {
            maxTokens = Math.max(200, Math.min(userMaxTokens, 1000 - estimatedInputTokens));
          } else {
            maxTokens = Math.max(300, Math.min(userMaxTokens, 1500 - estimatedInputTokens));
          }
        }

        // Ensure we don't exceed reasonable limits or go below minimum
        maxTokens = Math.min(Math.max(maxTokens, 150), Math.min(userMaxTokens, 4000));
      } else {
        // Fixed tokens mode - use user setting but respect model minimums
        maxTokens = Math.max(150, userMaxTokens);
      }

      console.log(`📊 Token allocation - Input: ~${estimatedInputTokens}, Max output: ${maxTokens}, Model: ${model}`);

      const requestBody: Record<string, unknown> = {
        model: model,
        messages: [
          ...messages.map(msg => ({
            role: msg.role,
            content: typeof msg.content === 'string' ? msg.content : msg.content,
          })),
          {
            role: 'user',
            content: messageContent,
          },
        ],
        temperature: 0.7,
        max_tokens: maxTokens,
        stream: true,
      };

      if (featureMode === 'reasoning') {
        requestBody.reasoning = {
          effort: 'medium',
          exclude: !showReasoning
        };
        // For reasoning, increase tokens but respect the calculated limits
        const reasoningMaxTokens = Math.min(maxTokens * 1.5, maxTokens + 300);
        requestBody.max_tokens = Math.max(50, reasoningMaxTokens);
      }

      if (featureMode === 'web-search') {
        // Web search handling varies by provider
        if (selectedProviderName === 'OpenRouter') {
          requestBody.plugins = [{
            id: 'web',
            max_results: 5
          }];

          if (!model.includes(':online')) {
            requestBody.model = `${model}:online`;
          }
        } else {
          // For Together AI and other providers, add web search instructions to the system message
          const systemMessage = {
            role: 'system',
            content: 'You are a helpful AI assistant. When users ask questions that would benefit from current information, please let them know that you don\'t have access to real-time web search and suggest they verify current information from reliable sources.'
          };

          requestBody.messages = [
            systemMessage,
            ...(requestBody.messages as Array<{ role: string; content: unknown }>)
          ];
        }
      }

      const headers: Record<string, string> = {
        'Content-Type': 'application/json',
      };

      headers['Authorization'] = `Bearer ${apiKey}`;

      if (selectedProviderName.includes('OpenRouter')) {
        headers['HTTP-Referer'] = window.location.origin;
        headers['X-Title'] = 'RavenGPT';
      }

      const apiUrl = getApiUrl();
      const response = await fetch(apiUrl, {
        method: 'POST',
        headers,
        body: JSON.stringify(requestBody),
      });

      if (!response.ok) {
        let errorDetails = `HTTP ${response.status}`;
        try {
          const errorData = await response.json();
          if (errorData.error?.message) {
            errorDetails = errorData.error.message;
          }
        } catch {
          // Could not parse error response
        }
        throw new Error(`${response.status}: ${errorDetails}`);
      }

      const reader = response.body?.getReader();
      const decoder = new TextDecoder();

      let accumulatedReasoning = '';
      let accumulatedContent = '';
      let citations: Array<{ url: string; title: string; content?: string }> = [];

      if (reader) {
        try {
          while (true) {
            const { done, value } = await reader.read();
            if (done) break;

            const chunk = decoder.decode(value);
            const lines = chunk.split('\n');

            for (const line of lines) {
              if (line.startsWith('data: ')) {
                const data = line.slice(6);
                if (data === '[DONE]') continue;

                try {
                  const parsed = JSON.parse(data);
                  const delta = parsed.choices?.[0]?.delta;

                  if (delta) {
                    if (delta.reasoning && showReasoning && featureMode === 'reasoning') {
                      accumulatedReasoning += delta.reasoning;
                      setCurrentStreamingReasoning(accumulatedReasoning);
                    }

                    if (delta.content) {
                      accumulatedContent += delta.content;

                      // Create the assistant message only when first content arrives
                      if (!hasCreatedAssistantMessage) {
                        const initialAssistantMessage: Message = {
                          id: assistantMessageId,
                          role: 'assistant',
                          content: accumulatedContent,
                          timestamp: new Date(),
                          reasoning: undefined,
                          citations: undefined,
                        };
                        setMessages(prev => [...prev, initialAssistantMessage]);
                        hasCreatedAssistantMessage = true;
                      } else {
                        // Update existing message
                        setMessages(prev => prev.map(msg =>
                          msg.id === assistantMessageId
                            ? { ...msg, content: accumulatedContent }
                            : msg
                        ));
                      }
                    }

                    if (parsed.choices?.[0]?.message?.annotations) {
                      const annotations = parsed.choices[0].message.annotations;
                      citations = annotations
                        .filter((ann: { type: string }) => ann.type === 'url_citation')
                        .map((ann: { url_citation: { url: string; title: string; content?: string } }) => ({
                          url: ann.url_citation.url,
                          title: ann.url_citation.title,
                          content: ann.url_citation.content
                        }));

                      setMessages(prev => prev.map(msg =>
                        msg.id === assistantMessageId
                          ? { ...msg, citations: citations.length > 0 ? citations : undefined }
                          : msg
                      ));
                    }
                  }
                } catch (parseError) {
                  console.log('Parse error (likely incomplete JSON):', parseError);
                }
              }
            }
          }
        } finally {
          reader.releaseLock();
        }
      }

    } catch (error) {
      console.error('Error sending message:', error);

      let errorMessage = 'Sorry, I encountered an error while processing your request.';

      if (error instanceof Error) {
        if (error.message.includes('401') || error.message.includes('Unauthorized')) {
          errorMessage = '❌ Invalid API key. Please check your API key in settings.';
        } else if (error.message.includes('429')) {
          if (error.message.includes('model-specific') || error.message.includes('maximum rate limit for this model')) {
            errorMessage = '⚡ Model rate limit exceeded. This model has strict limits (6 queries/minute). Please wait a minute or switch to a different model in settings.';
          } else if (error.message.includes('tokens per minute') || error.message.includes('TPM')) {
            // Extract wait time if available
            const waitTimeMatch = error.message.match(/try again in ([\d.]+)s/);
            const waitTime = waitTimeMatch ? Math.ceil(parseFloat(waitTimeMatch[1])) : 30;
            errorMessage = `⏱️ Groq rate limit hit! Please wait ${waitTime} seconds or:\n• Switch to a different Groq model (llama-3.2-3b-preview, mixtral-8x7b-32768)\n• Switch to Together AI or OpenRouter\n• Reduce message length to use fewer tokens`;
          } else {
            errorMessage = '⏳ Rate limit exceeded. Try switching providers in settings or wait a moment.';
          }
        } else if (error.message.includes('500') || error.message.includes('502') || error.message.includes('503')) {
          errorMessage = '🔧 Server error. Try switching providers in settings.';
        } else if (error.message.includes('Network')) {
          errorMessage = '🌐 Network error. Please check your internet connection.';
        } else if (error.message.includes('max_new_tokens') || error.message.includes('context') || error.message.includes('tokens') || error.message.includes('Input validation error')) {
          if (error.message.includes('532') || error.message.includes('400') || selectedModel.includes('free')) {
            errorMessage = '📏 Model context limit exceeded. This model has a very small context window. Try a much shorter message or switch to a different model with larger context in settings.';
          } else {
            errorMessage = '📏 Context length error. This model has limited context. Try a shorter message or switch to a different model in settings.';
          }
        } else {
          errorMessage = `❌ Error: ${error.message}`;
        }
      }

      // Create assistant message if it doesn't exist yet (error before any content)
      if (!hasCreatedAssistantMessage) {
        const errorAssistantMessage: Message = {
          id: assistantMessageId,
          role: 'assistant',
          content: errorMessage,
          timestamp: new Date(),
          reasoning: undefined,
          citations: undefined,
        };
        setMessages(prev => [...prev, errorAssistantMessage]);
      } else {
        // Update existing message with error
        setMessages(prev => prev.map(msg =>
          msg.id === assistantMessageId
            ? {
              ...msg,
              content: errorMessage,
              reasoning: undefined
            }
            : msg
        ));
      }
    } finally {
      setIsLoading(false);
      setCurrentStreamingReasoning('');
    }
  };

  const filteredModels = getFilteredModels(featureMode);

  // Filter chat sessions based on search query
  const filteredChatSessions = chatSessions.filter(chat => {
    if (!searchQuery.trim()) return true;

    const query = searchQuery.toLowerCase().trim();

    // Search in chat title
    if (chat.title.toLowerCase().includes(query)) {
      return true;
    }

    // Search in all messages
    return chat.messages.some(msg => {
      // Handle string content
      if (typeof msg.content === 'string') {
        return msg.content.toLowerCase().includes(query);
      }

      // Handle array content (multimodal messages)
      if (Array.isArray(msg.content)) {
        return msg.content.some(item => {
          if (item.type === 'text' && item.text) {
            return item.text.toLowerCase().includes(query);
          }
          return false;
        });
      }

      // Search in reasoning if available
      if (msg.reasoning && msg.reasoning.toLowerCase().includes(query)) {
        return true;
      }

      // Search in citations if available
      if (msg.citations) {
        return msg.citations.some(citation =>
          citation.title.toLowerCase().includes(query) ||
          (citation.content && citation.content.toLowerCase().includes(query))
        );
      }

      return false;
    });
  });

  return (
    <div className="h-screen flex bg-white dark:bg-dark-950">
      {/* Sidebar */}
      <div className={`${showSidebar ? 'w-64' : 'w-0'} transition-all duration-200 overflow-hidden bg-gray-50 dark:bg-dark-925 border-r border-gray-200 dark:border-dark-800 flex flex-col`}>
        {/* Sidebar Header */}
        <div className="p-3">
          {/* Search Box */}
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

          {/* New Chat Button */}
          <button
            onClick={createNewChat}
            className="w-full flex items-center gap-3 px-3 py-2.5 text-gray-700 dark:text-dark-100 border border-gray-300 dark:border-dark-800 rounded-md hover:bg-gray-100 dark:hover:bg-dark-850 transition-colors text-sm"
          >
            <Plus className="w-4 h-4" />
            New chat
          </button>
        </div>

        {/* Chat List */}
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
                    onKeyPress={(e) => {
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

      {/* Main Content */}
      <div className="flex-1 flex flex-col">
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
            {/* Current Model Display */}
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
                    console.log(`🎯 Displaying model - Selected: "${selectedModel}", Found: ${!!currentModel}, Available models:`, filteredModels.map(m => m.id));
                    return currentModel
                      ? currentModel.name.replace(' (Free)', '').replace('Llama', 'llama').replace('Instruct', '').trim()
                      : selectedModel ? `Model not found (${selectedModel})` : 'No model selected';
                  })()
                )}
              </span>
            </div>

            {/* Dark Mode Toggle */}
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

        {/* Feature Mode Selector - Simplified */}
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

        {/* Chat Area */}
        <div className="flex-1 overflow-y-auto">
          {/* Real-time Reasoning Display */}
          {featureMode === 'reasoning' && isLoading && currentStreamingReasoning && (
            <div className="border-b border-gray-200 dark:border-dark-800 bg-gray-50 dark:bg-dark-925">
              <div className="max-w-3xl mx-auto px-4 py-6">
                <div className="flex gap-4">
                  <div className="w-8 h-8 rounded-full bg-green-600 flex items-center justify-center flex-shrink-0">
                    <Brain className="w-5 h-5 text-white" />
                  </div>
                  <div className="flex-1">
                    <div className="text-sm font-medium text-gray-700 dark:text-dark-300 mb-2">
                      Thinking...
                    </div>
                    <div className="text-sm text-gray-600 dark:text-dark-400 whitespace-pre-wrap">
                      {currentStreamingReasoning}
                      <span className="inline-block w-2 h-4 bg-gray-500 ml-1 animate-pulse"></span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {messages.length === 0 ? (
            <div className="flex-1 flex items-center justify-center min-h-[60vh]">
              <div className="text-center max-w-md mx-auto px-4">
                {!currentChatId ? (
                  <>
                    <h2 className="text-3xl font-semibold text-gray-900 dark:text-dark-100 mb-4">
                      Welcome to RavenGPT
                    </h2>
                    <p className="text-lg text-gray-500 dark:text-dark-400 mb-6">
                      Start typing below to begin a new conversation.
                    </p>
                  </>
                ) : (
                  <>
                    <h2 className="text-3xl font-semibold text-gray-900 dark:text-dark-100 mb-4">
                      How can I help you today?
                    </h2>
                    <p className="text-lg text-gray-500 dark:text-dark-400">
                      {featureMode === 'reasoning' && 'Advanced reasoning mode enabled'}
                      {featureMode === 'web-search' && 'Web search enabled'}
                      {featureMode === 'vision' && 'Vision analysis ready'}
                      {featureMode === 'standard' && 'Ready to chat'}
                    </p>
                  </>
                )}
              </div>
            </div>
          ) : (
            <div>
              {messages.map((message, index) => (
                <MessageBubble
                  key={message.id}
                  message={message}
                  featureMode={featureMode}
                  showReasoning={showReasoning}
                  isLoading={isLoading}
                  isLast={index === messages.length - 1}
                />
              ))}

              {isLoading && messages.length > 0 && messages[messages.length - 1].role === 'user' && (
                <div className="border-b border-gray-200 dark:border-dark-800 bg-gray-50 dark:bg-dark-925">
                  <div className="max-w-3xl mx-auto px-4 py-6">
                    <div className="flex gap-4">
                      <div className="w-8 h-8 rounded-full bg-green-600 flex items-center justify-center">
                        <Bot className="w-5 h-5 text-white" />
                      </div>
                      <div className="flex-1">
                        <div className="font-semibold text-gray-900 dark:text-dark-100 text-sm mb-2">
                          RavenGPT
                        </div>
                        <div className="flex space-x-1">
                          <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce"></div>
                          <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0.1s' }}></div>
                          <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}
          <div ref={messagesEndRef} />
        </div>

        {/* File Upload Area */}
        {uploadedFiles.length > 0 && (
          <div className="px-4 py-3 bg-gray-50 dark:bg-dark-925 border-t border-gray-200 dark:border-dark-800">
            <div className="max-w-3xl mx-auto">
              <div className="flex flex-wrap gap-2">
                {uploadedFiles.map((file, index) => (
                  <div key={index} className="flex items-center gap-2 bg-white dark:bg-dark-900 px-3 py-2 rounded-lg text-sm border border-gray-200 dark:border-dark-800">
                    {file.type === 'image' ? <ImageIcon className="w-4 h-4" /> : <FileText className="w-4 h-4" />}
                    <span className="max-w-32 truncate">{file.name}</span>
                    <button
                      onClick={() => removeUploadedFile(index)}
                      className="text-gray-400 dark:text-dark-400 hover:text-red-500 dark:hover:text-red-400"
                    >
                      <X className="w-3 h-3" />
                    </button>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        <div className="p-4">
          <div className="max-w-3xl mx-auto">
            <div className="relative bg-white dark:bg-dark-900 border border-gray-300 dark:border-dark-800 rounded-xl shadow-sm">
              <div className="flex items-end">
                <div className="flex-1">
                  <textarea
                    value={input}
                    onChange={(e) => setInput(e.target.value)}
                    onKeyPress={(e) => {
                      if (e.key === 'Enter' && !e.shiftKey) {
                        e.preventDefault();
                        sendMessage();
                      }
                    }}
                    placeholder={!currentChatId ? "Start a new chat or select an existing one..." : "Message RavenGPT..."}
                    disabled={!apiKey || isLoading}
                    className="w-full resize-none border-none outline-none bg-transparent text-gray-900 dark:text-dark-100 placeholder-gray-500 dark:placeholder-dark-400 p-4 max-h-32"
                    rows={1}
                    style={{
                      minHeight: '24px',
                      height: 'auto',
                    }}
                  />
                </div>

                <div className="flex items-end p-2 gap-2">
                  {(featureMode === 'vision' || featureMode === 'standard') && (
                    <button
                      onClick={() => fileInputRef.current?.click()}
                      disabled={!apiKey || isLoading}
                      className="p-2 text-gray-400 dark:text-dark-400 hover:text-gray-600 dark:hover:text-dark-200 disabled:opacity-50 rounded-md hover:bg-gray-100 dark:hover:bg-dark-800"
                    >
                      <Upload className="w-5 h-5" />
                    </button>
                  )}

                  <button
                    onClick={sendMessage}
                    disabled={!input.trim() || !apiKey || isLoading}
                    className="p-2 bg-gray-200 dark:bg-dark-800 text-gray-500 dark:text-dark-300 rounded-md hover:bg-gray-300 dark:hover:bg-dark-750 disabled:opacity-50 disabled:hover:bg-gray-200 dark:disabled:hover:bg-dark-800 transition-colors"
                    title={!currentChatId && input.trim() ? "Start new chat" : "Send message"}
                  >
                    <Send className="w-5 h-5" />
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Hidden File Input */}
        <input
          ref={fileInputRef}
          type="file"
          multiple
          accept="image/*,.pdf,.txt,.md,.doc,.docx"
          onChange={handleFileUpload}
          className="hidden"
        />
      </div>
    </div>
  );
}