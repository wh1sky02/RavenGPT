'use client';

import { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import { Model, FeatureMode, PROVIDER_URLS, Message } from '@/lib/types';
import { fetchOpenRouterModels, fetchGroqModels, fetchTogetherAIModels } from '@/lib/api';
import { useChatSessions } from '@/hooks/useChatSessions';
import { Sidebar } from '@/components/Sidebar';
import { Header } from '@/components/Header';
import { FeatureModeSelector } from '@/components/FeatureModeSelector';
import { ChatArea } from '@/components/ChatArea';
import { ChatInput } from '@/components/ChatInput';

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

  // Dark mode toggle function
  const toggleDarkMode = useCallback(() => {
    const newDarkMode = !isDarkMode;
    setIsDarkMode(newDarkMode);

    if (newDarkMode) {
      document.documentElement.classList.add('dark');
      localStorage.setItem('dark-mode', 'true');
    } else {
      document.documentElement.classList.remove('dark');
      localStorage.setItem('dark-mode', 'false');
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
    // Messages and UploadedFiles will be cleared via useEffect or explicit set
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
      if (chat && messages.length === 0 && chat.messages.length > 0) {
        setMessages(chat.messages);
        setFeatureMode(chat.featureMode);
        setSelectedModel(chat.model);
      } else if (chat && messages.length === 0 && chat.messages.length === 0) {
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

      switch (selectedProviderName) {
        case 'OpenRouter':
          try {
            models = await fetchOpenRouterModels();
          } catch (error) {
            console.error('OpenRouter fetch failed:', error);
            setModelsError('Could not fetch OpenRouter models.');
            models = [];
          }
          break;
        case 'Together AI':
          try {
            models = await fetchTogetherAIModels(apiKey);
          } catch (error) {
            console.error('Together AI fetch failed:', error);
            setModelsError('Could not fetch Together AI models.');
            models = [];
          }
          break;
        case 'Groq':
          try {
            models = await fetchGroqModels(apiKey);
          } catch (error) {
            console.error('Groq fetch failed:', error);
            setModelsError('Could not fetch Groq models.');
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

        const savedModel = localStorage.getItem('selected-model');

        setSelectedModel(currentSelectedModel => {
          const modelToValidate = savedModel || currentSelectedModel;
          const modelExists = models.find(m => m.id === modelToValidate);

          if (!initialModelLoadRef.current) {
            initialModelLoadRef.current = true;
          }

          if (savedModel && modelExists) {
            return savedModel;
          }

          if (!modelExists || !savedModel) {
            const fallbackModel = models[0].id;
            localStorage.setItem('selected-model', fallbackModel);
            return fallbackModel;
          }

          return modelToValidate;
        });
      } else {
        setAvailableModels([]);
        setSelectedModel('');
        localStorage.removeItem('selected-model');
      }
    } catch (error) {
      console.error('Unexpected error fetching models:', error);
      setModelsError(`Unexpected error loading models.`);
      setAvailableModels([]);
      setSelectedModel('');
      localStorage.removeItem('selected-model');
    } finally {
      setIsLoadingModels(false);
    }
  }, [selectedProviderName, apiKey]);

  // Function to load settings from localStorage
  const loadSettings = useCallback(() => {
    const savedApiKey = localStorage.getItem('openrouter-api-key');
    const savedProvider = localStorage.getItem('selected-provider');
    const savedProviderUrl = localStorage.getItem('selected-provider-url');
    const savedCustomUrl = localStorage.getItem('custom-api-url');
    const savedModel = localStorage.getItem('selected-model');
    const savedMode = localStorage.getItem('feature-mode') as FeatureMode;
    const savedMaxTokens = localStorage.getItem('max-tokens');
    const savedUseAdaptive = localStorage.getItem('use-adaptive-tokens');

    if (savedApiKey) setApiKey(savedApiKey);
    if (savedProvider && PROVIDER_URLS[savedProvider as keyof typeof PROVIDER_URLS]) {
      setSelectedProviderName(savedProvider);
      setSelectedProviderUrl(PROVIDER_URLS[savedProvider as keyof typeof PROVIDER_URLS]);
    }
    if (savedProviderUrl) setSelectedProviderUrl(savedProviderUrl);
    if (savedCustomUrl) setCustomApiUrl(savedCustomUrl);
    if (savedModel) {
      setSelectedModel(() => savedModel);
    }
    if (savedMode) setFeatureMode(savedMode);
    if (savedMaxTokens) setUserMaxTokens(parseInt(savedMaxTokens));
    if (savedUseAdaptive !== null) setUseAdaptiveTokens(savedUseAdaptive === 'true');
  }, []);

  useEffect(() => {
    loadSettings();
    // Double call removed, not needed
  }, [loadSettings]);

  // Listen for localStorage changes
  useEffect(() => {
    const handleStorageChange = (e: StorageEvent) => {
      if (e.key === 'selected-model' && e.newValue) {
        setSelectedModel(e.newValue);
      }
      if (e.key === 'selected-provider' && e.newValue) {
        setSelectedProviderName(e.newValue);
        if (PROVIDER_URLS[e.newValue as keyof typeof PROVIDER_URLS]) {
          setSelectedProviderUrl(PROVIDER_URLS[e.newValue as keyof typeof PROVIDER_URLS]);
        }
      }
      if (e.key === 'openrouter-api-key' && e.newValue) {
        setApiKey(e.newValue);
      }
    };

    const handleFocus = () => {
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
      initialModelLoadRef.current = false;
      const timeoutId = setTimeout(() => {
        fetchAvailableModels();
      }, 100);
      return () => clearTimeout(timeoutId);
    }
  }, [selectedProviderName, isSessionsInitialized, fetchAvailableModels]);

  // Dark mode initialization
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

  const setMode = (mode: FeatureMode) => {
    setFeatureMode(mode);
    localStorage.setItem('feature-mode', mode);

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
        if (selectedProviderName === 'OpenRouter') {
          return availableModels.filter(model => model.supportsWebSearch);
        } else {
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

    const assistantMessageId = (Date.now() + 1).toString();
    let hasCreatedAssistantMessage = false;

    try {
      const model = selectedModel;
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

      let maxTokens = userMaxTokens;

      if (useAdaptiveTokens) {
        if (model.includes('DialoGPT') || model.includes('medium')) {
          maxTokens = Math.max(150, 700 - estimatedInputTokens);
        } else if (model.includes('free') && (model.includes('distill') || model.includes('DeepSeek'))) {
          maxTokens = Math.max(150, 450 - estimatedInputTokens);
        } else if (selectedProviderName === 'Groq') {
          if (model.includes('instant') || model.includes('8b')) {
            maxTokens = Math.max(150, Math.min(userMaxTokens, 800 - estimatedInputTokens));
          } else {
            maxTokens = Math.max(200, Math.min(userMaxTokens, 1200 - estimatedInputTokens));
          }
        } else if (selectedProviderName === 'OpenRouter') {
          maxTokens = Math.max(300, Math.min(userMaxTokens, 2000 - estimatedInputTokens));
        } else if (selectedProviderName === 'Together AI') {
          if (model.includes('8b') || model.includes('7B')) {
            maxTokens = Math.max(200, Math.min(userMaxTokens, 1000 - estimatedInputTokens));
          } else {
            maxTokens = Math.max(300, Math.min(userMaxTokens, 1500 - estimatedInputTokens));
          }
        }
        maxTokens = Math.min(Math.max(maxTokens, 150), Math.min(userMaxTokens, 4000));
      } else {
        maxTokens = Math.max(150, userMaxTokens);
      }

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
        const reasoningMaxTokens = Math.min(maxTokens * 1.5, maxTokens + 300);
        requestBody.max_tokens = Math.max(50, reasoningMaxTokens);
      }

      if (featureMode === 'web-search') {
        if (selectedProviderName === 'OpenRouter') {
          requestBody.plugins = [{
            id: 'web',
            max_results: 5
          }];

          if (!model.includes(':online')) {
            requestBody.model = `${model}:online`;
          }
        } else {
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
          // Fallback
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
                  // This is common with streaming chunks
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
          errorMessage = '⏳ Rate limit exceeded. Try switching providers in settings or wait a moment.';
        } else if (error.message.includes('500') || error.message.includes('502') || error.message.includes('503')) {
          errorMessage = '🔧 Server error. Try switching providers in settings.';
        } else if (error.message.includes('Network')) {
          errorMessage = '🌐 Network error. Please check your internet connection.';
        } else if (error.message.includes('max_new_tokens') || error.message.includes('context')) {
          errorMessage = '📏 Context length error. This model has limited context. Try a shorter message or switch to a different model in settings.';
        } else {
          errorMessage = `❌ Error: ${error.message}`;
        }
      }

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

  // Memoized filtered sessions
  const filteredChatSessions = useMemo(() => {
    return chatSessions.filter(chat => {
      if (!searchQuery.trim()) return true;

      const query = searchQuery.toLowerCase().trim();

      if (chat.title.toLowerCase().includes(query)) {
        return true;
      }

      return chat.messages.some(msg => {
        if (typeof msg.content === 'string') {
          return msg.content.toLowerCase().includes(query);
        }

        if (Array.isArray(msg.content)) {
          return msg.content.some(item => {
            if (item.type === 'text' && item.text) {
              return item.text.toLowerCase().includes(query);
            }
            return false;
          });
        }

        if (msg.reasoning && msg.reasoning.toLowerCase().includes(query)) {
          return true;
        }

        if (msg.citations) {
          return msg.citations.some(citation =>
            citation.title.toLowerCase().includes(query) ||
            (citation.content && citation.content.toLowerCase().includes(query))
          );
        }

        return false;
      });
    });
  }, [chatSessions, searchQuery]);

  return (
    <div className="h-screen flex bg-white dark:bg-dark-950">
      <Sidebar
        showSidebar={showSidebar}
        searchQuery={searchQuery}
        setSearchQuery={setSearchQuery}
        chatSessions={chatSessions}
        filteredChatSessions={filteredChatSessions}
        createNewChat={createNewChat}
        switchToChat={switchToChat}
        currentChatId={currentChatId}
        editingChatId={editingChatId}
        setEditingChatId={setEditingChatId}
        editingTitle={editingTitle}
        setEditingTitle={setEditingTitle}
        renameChat={renameChat}
        deleteChat={deleteChat}
      />

      <div className="flex-1 flex flex-col">
        <Header
          showSidebar={showSidebar}
          setShowSidebar={setShowSidebar}
          isLoadingModels={isLoadingModels}
          availableModels={availableModels}
          selectedModel={selectedModel}
          isDarkMode={isDarkMode}
          toggleDarkMode={toggleDarkMode}
          filteredModels={filteredModels}
        />

        <FeatureModeSelector
          featureMode={featureMode}
          setMode={setMode}
          showReasoning={showReasoning}
          setShowReasoning={setShowReasoning}
        />

        <ChatArea
          messages={messages}
          isLoading={isLoading}
          currentChatId={currentChatId}
          featureMode={featureMode}
          showReasoning={showReasoning}
          currentStreamingReasoning={currentStreamingReasoning}
          messagesEndRef={messagesEndRef}
        />

        <ChatInput
          input={input}
          setInput={setInput}
          sendMessage={sendMessage}
          isLoading={isLoading}
          apiKey={apiKey}
          uploadedFiles={uploadedFiles}
          removeUploadedFile={removeUploadedFile}
          handleFileUpload={handleFileUpload}
          fileInputRef={fileInputRef}
          featureMode={featureMode}
          currentChatId={currentChatId}
        />
      </div>
    </div>
  );
}