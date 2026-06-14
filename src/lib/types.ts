// ============================================================
// RavenGPT - Enhanced Type Definitions
// ============================================================

export interface OpenRouterModel {
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
        tokenizer?: string;
    };
    top_provider?: {
        context_length?: number;
        max_completion_tokens?: number;
    };
}

// Tool call types (OpenAI-compatible function calling)
export interface ToolFunction {
    name: string;
    description: string;
    parameters: {
        type: 'object';
        properties: Record<string, {
            type: string;
            description: string;
            enum?: string[];
        }>;
        required?: string[];
    };
}

export interface Tool {
    type: 'function';
    function: ToolFunction;
}

export interface ToolCall {
    id: string;
    type: 'function';
    function: {
        name: string;
        arguments: string;
    };
}

export interface ToolResult {
    tool_call_id: string;
    role: 'tool';
    name: string;
    content: string;
}

// MCP (Model Context Protocol) types
export interface MCPServer {
    id: string;
    name: string;
    url: string;
    transport: 'sse' | 'stdio' | 'http' | 'websocket';
    enabled: boolean;
    apiKey?: string;
    description?: string;
    tools?: MCPTool[];
    status: 'connected' | 'disconnected' | 'connecting' | 'error';
    lastError?: string;
}

export interface MCPTool {
    name: string;
    description: string;
    inputSchema: {
        type: 'object';
        properties: Record<string, {
            type: string;
            description: string;
        }>;
        required?: string[];
    };
    serverId: string;
    serverName: string;
}

export interface MCPToolResult {
    toolName: string;
    serverId: string;
    result: unknown;
    error?: string;
    duration?: number;
}

// Message types
export type MessageRole = 'user' | 'assistant' | 'system' | 'tool';

export interface MessageAttachment {
    type: 'image' | 'document' | 'audio';
    name: string;
    url: string;
    size: number;
    mimeType?: string;
}

export interface MessageContentPart {
    type: 'text' | 'image_url';
    text?: string;
    image_url?: { url: string; detail?: 'low' | 'high' | 'auto' };
}

export interface Message {
    id: string;
    role: MessageRole;
    content: string | MessageContentPart[];
    timestamp: Date;
    reasoning?: string;
    citations?: Array<{
        url: string;
        title: string;
        content?: string;
    }>;
    attachments?: MessageAttachment[];
    toolCalls?: ToolCall[];
    toolResults?: ToolResult[];
    mcpResults?: MCPToolResult[];
    isEdited?: boolean;
    parentId?: string; // for branching
    branchIndex?: number;
    model?: string; // which model generated this
    tokens?: {
        prompt: number;
        completion: number;
        total: number;
    };
    generationTime?: number; // ms
    isError?: boolean;
    isStreaming?: boolean;
}

// Chat session types
export interface ChatSession {
    id: string;
    title: string;
    messages: Message[];
    createdAt: Date;
    updatedAt: Date;
    featureMode: FeatureMode;
    model: string;
    systemPrompt?: string;
    persona?: string;
    temperature?: number;
    maxTokens?: number;
    tags?: string[];
    isPinned?: boolean;
    totalTokens?: number;
}

// Model types
export interface Model {
    id: string;
    name: string;
    description?: string;
    supportsReasoning?: boolean;
    supportsImages?: boolean;
    supportsWebSearch?: boolean;
    supportsTools?: boolean;
    isFree?: boolean;
    contextLength?: number;
    pricing?: {
        prompt: number;
        completion: number;
    };
    provider?: string;
    maxOutputTokens?: number;
}

// Feature modes
export type FeatureMode = 'standard' | 'reasoning' | 'web-search' | 'vision' | 'tools' | 'mcp';

// Provider configuration
export const PROVIDER_URLS: Record<string, string> = {
    'OpenRouter': 'https://openrouter.ai/api/v1/chat/completions',
    'Together AI': 'https://api.together.xyz/v1/chat/completions',
    'Groq': 'https://api.groq.com/openai/v1/chat/completions',
    'Custom API URL': ''
};

export const PROVIDER_MODELS_URLS: Record<string, string> = {
    'OpenRouter': 'https://openrouter.ai/api/v1/models',
    'Together AI': 'https://api.together.xyz/v1/models',
    'Groq': 'https://api.groq.com/openai/v1/models',
};

// Settings types
export interface AppSettings {
    apiKey: string;
    providerName: string;
    providerUrl: string;
    customApiUrl: string;
    selectedModel: string;
    maxTokens: number;
    useAdaptiveTokens: boolean;
    temperature: number;
    topP: number;
    systemPrompt: string;
    isDarkMode: boolean;
    language: 'en' | 'my'; // English or Burmese
    showTokenCount: boolean;
    showModelInfo: boolean;
    enableSoundEffects: boolean;
    mcpServers: MCPServer[];
    enabledTools: string[];
    streamingEnabled: boolean;
    autoSave: boolean;
    exportFormat: 'markdown' | 'json' | 'txt';
    personas?: Persona[];
    activePersonaId?: string;
}

export const DEFAULT_SETTINGS: AppSettings = {
    apiKey: '',
    providerName: 'OpenRouter',
    providerUrl: PROVIDER_URLS['OpenRouter'],
    customApiUrl: '',
    selectedModel: '',
    maxTokens: 2000,
    useAdaptiveTokens: true,
    temperature: 0.7,
    topP: 1.0,
    systemPrompt: '',
    isDarkMode: false,
    language: 'en',
    showTokenCount: true,
    showModelInfo: true,
    enableSoundEffects: false,
    mcpServers: [],
    enabledTools: [],
    streamingEnabled: true,
    autoSave: true,
    exportFormat: 'markdown',
    personas: [],
    activePersonaId: 'default',
};

// Built-in tools
export const BUILTIN_TOOLS: Tool[] = [
    {
        type: 'function',
        function: {
            name: 'get_current_time',
            description: 'Get the current date and time',
            parameters: {
                type: 'object',
                properties: {
                    timezone: {
                        type: 'string',
                        description: 'The timezone to get the time in (e.g., UTC, America/New_York)',
                    }
                },
                required: []
            }
        }
    },
    {
        type: 'function',
        function: {
            name: 'calculate',
            description: 'Perform mathematical calculations',
            parameters: {
                type: 'object',
                properties: {
                    expression: {
                        type: 'string',
                        description: 'The mathematical expression to evaluate',
                    }
                },
                required: ['expression']
            }
        }
    },
    {
        type: 'function',
        function: {
            name: 'web_search',
            description: 'Search the web for current information',
            parameters: {
                type: 'object',
                properties: {
                    query: {
                        type: 'string',
                        description: 'The search query',
                    },
                    num_results: {
                        type: 'string',
                        description: 'Number of results to return (1-10)',
                    }
                },
                required: ['query']
            }
        }
    },
    {
        type: 'function',
        function: {
            name: 'generate_image',
            description: 'Generate an image from a text description',
            parameters: {
                type: 'object',
                properties: {
                    prompt: {
                        type: 'string',
                        description: 'The image description',
                    },
                    style: {
                        type: 'string',
                        description: 'The image style',
                        enum: ['realistic', 'artistic', 'cartoon', 'sketch']
                    }
                },
                required: ['prompt']
            }
        }
    }
];

// Persona presets
export interface Persona {
    id: string;
    name: string;
    description: string;
    systemPrompt: string;
    icon: string;
    isCustom?: boolean;
}

export const PERSONAS: Persona[] = [
    {
        id: 'default',
        name: 'Default Assistant',
        description: 'Helpful, harmless, and honest AI assistant',
        systemPrompt: 'You are a helpful, harmless, and honest AI assistant. Answer questions accurately and concisely.',
        icon: '🤖'
    },
    {
        id: 'coder',
        name: 'Expert Coder',
        description: 'Senior software engineer with deep technical knowledge',
        systemPrompt: 'You are an expert software engineer with 15+ years of experience. You write clean, efficient, well-documented code. Always explain your reasoning and suggest best practices. When writing code, include comments and handle edge cases.',
        icon: '💻'
    },
    {
        id: 'teacher',
        name: 'Patient Teacher',
        description: 'Explains complex topics in simple terms',
        systemPrompt: 'You are a patient and knowledgeable teacher. Break down complex topics into simple, understandable explanations. Use analogies, examples, and step-by-step explanations. Encourage questions and adapt to the student\'s level.',
        icon: '📚'
    },
    {
        id: 'analyst',
        name: 'Data Analyst',
        description: 'Analytical thinker focused on data and insights',
        systemPrompt: 'You are a skilled data analyst. Approach problems analytically, use data-driven reasoning, and provide structured insights. When analyzing information, consider multiple perspectives and highlight key findings.',
        icon: '📊'
    },
    {
        id: 'creative',
        name: 'Creative Writer',
        description: 'Imaginative storyteller and content creator',
        systemPrompt: 'You are a creative writer with a vivid imagination. Help with storytelling, creative writing, brainstorming, and generating imaginative content. Be expressive, use rich language, and think outside the box.',
        icon: '✍️'
    },
    {
        id: 'burmese',
        name: 'Burmese Assistant (မြန်မာ)',
        description: 'Assistant that responds in Burmese language',
        systemPrompt: 'You are a helpful AI assistant. Always respond in Burmese (မြန်မာဘာသာ) unless the user explicitly asks for another language. Be respectful and use appropriate Burmese honorifics. You can understand both English and Burmese input.',
        icon: '🇲🇲'
    }
];

// Keyboard shortcuts
export interface KeyboardShortcut {
    key: string;
    ctrl?: boolean;
    shift?: boolean;
    alt?: boolean;
    description: string;
    action: string;
}

// MCP Server Presets
export const MCP_SERVER_PRESETS: Array<{ name: string; url: string; transport: 'sse' | 'stdio' | 'websocket'; description?: string }> = [
    { name: 'Filesystem', url: 'npx @modelcontextprotocol/server-filesystem /tmp', transport: 'stdio', description: 'Local file access' },
    { name: 'Brave Search', url: 'https://mcp.brave.com/sse', transport: 'sse', description: 'Web search' },
    { name: 'GitHub', url: 'npx @modelcontextprotocol/server-github', transport: 'stdio', description: 'GitHub repos' },
    { name: 'SQLite', url: 'npx @modelcontextprotocol/server-sqlite', transport: 'stdio', description: 'Database queries' },
    { name: 'Puppeteer', url: 'npx @modelcontextprotocol/server-puppeteer', transport: 'stdio', description: 'Browser automation' },
    { name: 'Memory', url: 'npx @modelcontextprotocol/server-memory', transport: 'stdio', description: 'Persistent memory' },
    { name: 'Slack', url: 'npx @modelcontextprotocol/server-slack', transport: 'stdio', description: 'Slack integration' },
    { name: 'Google Drive', url: 'npx @modelcontextprotocol/server-gdrive', transport: 'stdio', description: 'Google Drive access' },
];

export const KEYBOARD_SHORTCUTS: KeyboardShortcut[] = [
    { key: 'Enter', ctrl: true, description: 'Send message', action: 'send' },
    { key: 'Escape', description: 'Stop generation', action: 'stop' },
    { key: 'k', ctrl: true, description: 'New chat', action: 'new_chat' },
    { key: 'b', ctrl: true, description: 'Toggle sidebar', action: 'toggle_sidebar' },
    { key: '/', ctrl: true, description: 'Focus input', action: 'focus_input' },
    { key: 'e', ctrl: true, description: 'Export chat', action: 'export_chat' },
    { key: ',', ctrl: true, description: 'Open settings', action: 'open_settings' },
    { key: 'r', ctrl: true, shift: true, description: 'Regenerate response', action: 'regenerate' },
];
