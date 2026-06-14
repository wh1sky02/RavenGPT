import { Model, OpenRouterModel, Tool, ToolCall, MCPServer, MCPTool, MCPToolResult } from './types';

// ============================================================
// OpenRouter Model Fetching
// ============================================================

export const fetchOpenRouterModels = async (apiKey?: string): Promise<Model[]> => {
    try {
        const headers: Record<string, string> = {};
        if (apiKey) {
            headers['Authorization'] = `Bearer ${apiKey}`;
        }

        const response = await fetch('https://openrouter.ai/api/v1/models', { headers });
        if (!response.ok) throw new Error(`OpenRouter API error: ${response.status}`);

        const data = await response.json();
        const models: OpenRouterModel[] = data.data;

        return models
            .filter(model => {
                // Filter out non-chat models
                const id = model.id.toLowerCase();
                return !id.includes('embed') && !id.includes('moderation');
            })
            .map(model => {
                const promptPrice = parseFloat(model.pricing?.prompt || '0');
                const completionPrice = parseFloat(model.pricing?.completion || '0');
                const isFree = promptPrice === 0 && completionPrice === 0;

                const id = model.id.toLowerCase();
                const params = model.supported_parameters || [];

                const supportsReasoning =
                    id.includes('reasoning') ||
                    id.includes('thinking') ||
                    id.includes('r1') ||
                    id.includes('qwq') ||
                    id.includes('o1') ||
                    id.includes('o3') ||
                    id.includes('o4') ||
                    (id.includes('deepseek') && (id.includes('r1') || id.includes('reason'))) ||
                    params.includes('reasoning') ||
                    params.includes('thinking');

                const supportsImages =
                    model.architecture?.input_modalities?.includes('image') ||
                    id.includes('vision') ||
                    id.includes('llava') ||
                    id.includes('pixtral') ||
                    id.includes('claude-3') ||
                    id.includes('gpt-4o') ||
                    id.includes('gemini') ||
                    id.includes('qwen-vl') ||
                    false;

                const supportsTools =
                    params.includes('tools') ||
                    id.includes('gpt-4') ||
                    id.includes('claude-3') ||
                    id.includes('claude-3.5') ||
                    id.includes('claude-3.7') ||
                    id.includes('gemini') ||
                    id.includes('llama-3') ||
                    id.includes('mistral') ||
                    id.includes('qwen') ||
                    false;

                return {
                    id: model.id,
                    name: `${model.name}${isFree ? ' (Free)' : ''}`,
                    description: `${model.description || 'AI model'} • Context: ${(model.context_length || 0).toLocaleString()}`,
                    supportsReasoning,
                    supportsImages,
                    supportsWebSearch: true, // OpenRouter supports web search via :online suffix
                    supportsTools,
                    isFree,
                    contextLength: model.context_length,
                    maxOutputTokens: model.top_provider?.max_completion_tokens,
                    pricing: {
                        prompt: promptPrice,
                        completion: completionPrice
                    },
                    provider: 'OpenRouter'
                };
            })
            .sort((a, b) => {
                // Sort: free first, then by name
                if (a.isFree && !b.isFree) return -1;
                if (!a.isFree && b.isFree) return 1;
                return a.name.localeCompare(b.name);
            });
    } catch (error) {
        console.error('OpenRouter API error:', error);
        throw error;
    }
};

// ============================================================
// Groq Model Fetching
// ============================================================

export const fetchGroqModels = async (apiKey: string): Promise<Model[]> => {
    const knownFreeModels: Model[] = [
        {
            id: 'llama-3.3-70b-versatile',
            name: 'Llama 3.3 70B Versatile (Free)',
            description: 'Most capable Llama model • Context: 128K • Free tier',
            supportsReasoning: false,
            supportsImages: false,
            supportsWebSearch: false,
            supportsTools: true,
            isFree: true,
            contextLength: 128000,
            pricing: { prompt: 0, completion: 0 },
            provider: 'Groq'
        },
        {
            id: 'llama-3.1-8b-instant',
            name: 'Llama 3.1 8B Instant (Free)',
            description: 'Ultra-fast inference • Context: 128K • Free tier',
            supportsReasoning: false,
            supportsImages: false,
            supportsWebSearch: false,
            supportsTools: true,
            isFree: true,
            contextLength: 128000,
            pricing: { prompt: 0, completion: 0 },
            provider: 'Groq'
        },
        {
            id: 'mixtral-8x7b-32768',
            name: 'Mixtral 8x7B (Free)',
            description: 'Mixture of experts • Context: 32K • Free tier',
            supportsReasoning: false,
            supportsImages: false,
            supportsWebSearch: false,
            supportsTools: true,
            isFree: true,
            contextLength: 32768,
            pricing: { prompt: 0, completion: 0 },
            provider: 'Groq'
        },
        {
            id: 'gemma2-9b-it',
            name: 'Gemma 2 9B IT (Free)',
            description: 'Google Gemma 2 • Context: 8K • Free tier',
            supportsReasoning: false,
            supportsImages: false,
            supportsWebSearch: false,
            supportsTools: false,
            isFree: true,
            contextLength: 8192,
            pricing: { prompt: 0, completion: 0 },
            provider: 'Groq'
        },
        {
            id: 'deepseek-r1-distill-llama-70b',
            name: 'DeepSeek R1 Distill Llama 70B (Free)',
            description: 'Reasoning model • Context: 128K • Free tier',
            supportsReasoning: true,
            supportsImages: false,
            supportsWebSearch: false,
            supportsTools: false,
            isFree: true,
            contextLength: 128000,
            pricing: { prompt: 0, completion: 0 },
            provider: 'Groq'
        }
    ];

    if (!apiKey) return knownFreeModels;

    try {
        const response = await fetch('https://api.groq.com/openai/v1/models', {
            headers: { 'Authorization': `Bearer ${apiKey}` }
        });

        if (!response.ok) {
            if (response.status === 401) return knownFreeModels;
            throw new Error(`Groq API error: ${response.status}`);
        }

        const data = await response.json();
        const models = data.data || [];

        if (models.length === 0) return knownFreeModels;

        const chatModels = models.filter((model: { id: string }) => {
            const id = model.id.toLowerCase();
            return !id.includes('tts') &&
                !id.includes('whisper') &&
                !id.includes('transcrib') &&
                !id.includes('speech') &&
                !id.includes('audio') &&
                !id.includes('guard') &&
                !id.includes('distil-whisper');
        });

        return chatModels.map((model: { id: string; context_window?: number }) => {
            const id = model.id.toLowerCase();
            const contextLength = model.context_window ||
                (id.includes('128k') ? 131072 :
                    id.includes('32768') ? 32768 :
                        id.includes('8192') ? 8192 : 8192);

            return {
                id: model.id,
                name: `${model.id.replace(/-/g, ' ').replace(/\b\w/g, (l: string) => l.toUpperCase())} (Free)`,
                description: `Groq fast inference • Context: ${(contextLength / 1000).toFixed(0)}K • Free tier`,
                supportsReasoning: id.includes('r1') || id.includes('reason') || id.includes('deepseek'),
                supportsImages: id.includes('vision') || id.includes('llava'),
                supportsWebSearch: false,
                supportsTools: id.includes('llama-3') || id.includes('mixtral') || id.includes('gemma'),
                isFree: true,
                contextLength,
                pricing: { prompt: 0, completion: 0 },
                provider: 'Groq'
            };
        });
    } catch (error) {
        console.error('Groq API error:', error);
        return knownFreeModels;
    }
};

// ============================================================
// Together AI Model Fetching
// ============================================================

export const fetchTogetherAIModels = async (apiKey: string): Promise<Model[]> => {
    const knownModels: Model[] = [
        {
            id: 'meta-llama/Meta-Llama-3.1-70B-Instruct-Turbo',
            name: 'Llama 3.1 70B Instruct Turbo',
            description: 'Fast and capable • Context: 131K',
            supportsReasoning: false,
            supportsImages: false,
            supportsWebSearch: false,
            supportsTools: true,
            isFree: false,
            contextLength: 131072,
            pricing: { prompt: 0.00088, completion: 0.00088 },
            provider: 'Together AI'
        },
        {
            id: 'meta-llama/Meta-Llama-3.1-8B-Instruct-Turbo',
            name: 'Llama 3.1 8B Instruct Turbo',
            description: 'Fast and efficient • Context: 131K',
            supportsReasoning: false,
            supportsImages: false,
            supportsWebSearch: false,
            supportsTools: true,
            isFree: false,
            contextLength: 131072,
            pricing: { prompt: 0.00018, completion: 0.00018 },
            provider: 'Together AI'
        },
        {
            id: 'Qwen/Qwen2.5-72B-Instruct-Turbo',
            name: 'Qwen 2.5 72B Instruct Turbo',
            description: 'High-performance • Context: 32K',
            supportsReasoning: false,
            supportsImages: false,
            supportsWebSearch: false,
            supportsTools: true,
            isFree: false,
            contextLength: 32768,
            pricing: { prompt: 0.0008, completion: 0.0008 },
            provider: 'Together AI'
        },
        {
            id: 'deepseek-ai/DeepSeek-R1-Distill-Llama-70B-free',
            name: 'DeepSeek R1 Distill Llama 70B (Free)',
            description: 'Strong reasoning • Context: 8K • Free (rate limited)',
            supportsReasoning: true,
            supportsImages: false,
            supportsWebSearch: false,
            supportsTools: false,
            isFree: true,
            contextLength: 8192,
            pricing: { prompt: 0, completion: 0 },
            provider: 'Together AI'
        }
    ];

    if (!apiKey) return knownModels;

    try {
        const response = await fetch('https://api.together.xyz/v1/models', {
            headers: { 'Authorization': `Bearer ${apiKey}` }
        });

        if (!response.ok) {
            if (response.status === 401) return knownModels;
            throw new Error(`Together AI API error: ${response.status}`);
        }

        const models = await response.json();
        if (!models || models.length === 0) return knownModels;

        return models
            .filter((model: { type?: string }) => model.type === 'chat' || !model.type)
            .map((model: {
                id: string;
                display_name?: string;
                description?: string;
                context_length?: number;
                pricing?: { input?: number; output?: number };
                type?: string;
            }) => {
                const inputPrice = model.pricing?.input || 0;
                const outputPrice = model.pricing?.output || 0;
                const isFree = inputPrice === 0 && outputPrice === 0;
                const id = model.id.toLowerCase();

                return {
                    id: model.id,
                    name: model.display_name || model.id.split('/').pop()?.replace(/[-_]/g, ' ') || model.id,
                    description: `${model.description || 'Together AI model'} • Context: ${(model.context_length || 0).toLocaleString()}`,
                    supportsReasoning: id.includes('r1') || id.includes('reason') || id.includes('deepseek'),
                    supportsImages: id.includes('vision') || id.includes('llava') || id.includes('pixtral'),
                    supportsWebSearch: false,
                    supportsTools: id.includes('instruct') || id.includes('chat'),
                    isFree,
                    contextLength: model.context_length,
                    pricing: { prompt: inputPrice, completion: outputPrice },
                    provider: 'Together AI'
                };
            });
    } catch (error) {
        console.error('Together AI API error:', error);
        return knownModels;
    }
};

// ============================================================
// Built-in Tool Execution
// ============================================================

export const executeBuiltinTool = async (
    toolName: string,
    args: Record<string, unknown>
): Promise<string> => {
    switch (toolName) {
        case 'get_current_time': {
            const timezone = (args.timezone as string) || 'UTC';
            try {
                const now = new Date();
                const formatted = now.toLocaleString('en-US', {
                    timeZone: timezone,
                    weekday: 'long',
                    year: 'numeric',
                    month: 'long',
                    day: 'numeric',
                    hour: '2-digit',
                    minute: '2-digit',
                    second: '2-digit',
                    timeZoneName: 'short'
                });
                return JSON.stringify({ time: formatted, timezone, iso: now.toISOString() });
            } catch {
                return JSON.stringify({ time: new Date().toISOString(), timezone: 'UTC' });
            }
        }

        case 'calculate': {
            const expression = args.expression as string;
            try {
                // Safe math evaluation using Function constructor with restricted scope
                const sanitized = expression.replace(/[^0-9+\-*/().%\s^]/g, '');
                if (!sanitized) return JSON.stringify({ error: 'Invalid expression' });
                // eslint-disable-next-line no-new-func
                const result = new Function(`"use strict"; return (${sanitized})`)();
                return JSON.stringify({ expression, result, formatted: result.toLocaleString() });
            } catch (e) {
                return JSON.stringify({ error: `Calculation error: ${e}` });
            }
        }

        case 'web_search': {
            // This is a placeholder - in production you'd call a real search API
            const query = args.query as string;
            return JSON.stringify({
                query,
                note: 'Web search is handled by the AI model via the :online suffix on OpenRouter. For direct search, configure a search API in MCP settings.',
                suggestion: 'Use web-search mode for real-time web access'
            });
        }

        case 'generate_image': {
            const prompt = args.prompt as string;
            return JSON.stringify({
                prompt,
                note: 'Image generation requires a separate image generation API. Configure one in MCP settings.',
                suggestion: 'Connect an image generation MCP server to enable this feature'
            });
        }

        default:
            return JSON.stringify({ error: `Unknown tool: ${toolName}` });
    }
};

// ============================================================
// MCP Client
// ============================================================

export class MCPClient {
    private server: MCPServer;
    private eventSource: EventSource | null = null;
    private requestId = 0;
    private pendingRequests: Map<number, { resolve: (v: unknown) => void; reject: (e: Error) => void }> = new Map();

    constructor(server: MCPServer) {
        this.server = server;
    }

    async connect(): Promise<MCPTool[]> {
        if (this.server.transport === 'sse') {
            return this.connectSSE();
        } else if (this.server.transport === 'http') {
            return this.connectHTTP();
        }
        throw new Error(`Transport ${this.server.transport} not supported in browser`);
    }

    private async connectHTTP(): Promise<MCPTool[]> {
        try {
            const headers: Record<string, string> = {
                'Content-Type': 'application/json',
            };
            if (this.server.apiKey) {
                headers['Authorization'] = `Bearer ${this.server.apiKey}`;
            }

            // Initialize MCP session
            const initResponse = await fetch(this.server.url, {
                method: 'POST',
                headers,
                body: JSON.stringify({
                    jsonrpc: '2.0',
                    id: ++this.requestId,
                    method: 'initialize',
                    params: {
                        protocolVersion: '2024-11-05',
                        capabilities: { tools: {} },
                        clientInfo: { name: 'RavenGPT', version: '2.0.0' }
                    }
                })
            });

            if (!initResponse.ok) {
                throw new Error(`MCP server error: ${initResponse.status}`);
            }

            // List tools
            const toolsResponse = await fetch(this.server.url, {
                method: 'POST',
                headers,
                body: JSON.stringify({
                    jsonrpc: '2.0',
                    id: ++this.requestId,
                    method: 'tools/list',
                    params: {}
                })
            });

            if (!toolsResponse.ok) {
                throw new Error(`MCP tools list error: ${toolsResponse.status}`);
            }

            const toolsData = await toolsResponse.json();
            const tools: MCPTool[] = (toolsData.result?.tools || []).map((tool: {
                name: string;
                description: string;
                inputSchema: MCPTool['inputSchema'];
            }) => ({
                name: tool.name,
                description: tool.description,
                inputSchema: tool.inputSchema,
                serverId: this.server.id,
                serverName: this.server.name
            }));

            return tools;
        } catch (error) {
            throw new Error(`Failed to connect to MCP server: ${error}`);
        }
    }

    private async connectSSE(): Promise<MCPTool[]> {
        // SSE-based MCP connection
        return new Promise((resolve, reject) => {
            const timeout = setTimeout(() => {
                reject(new Error('MCP SSE connection timeout'));
            }, 10000);

            try {
                this.eventSource = new EventSource(this.server.url);

                this.eventSource.onopen = async () => {
                    clearTimeout(timeout);
                    try {
                        const tools = await this.listToolsSSE();
                        resolve(tools);
                    } catch (e) {
                        reject(e);
                    }
                };

                this.eventSource.onerror = () => {
                    clearTimeout(timeout);
                    reject(new Error('MCP SSE connection failed'));
                };
            } catch (error) {
                clearTimeout(timeout);
                reject(error);
            }
        });
    }

    private async listToolsSSE(): Promise<MCPTool[]> {
        // Simplified SSE tool listing - in production this would use proper SSE messaging
        return [];
    }

    async callTool(toolName: string, args: Record<string, unknown>): Promise<MCPToolResult> {
        const startTime = Date.now();

        try {
            const headers: Record<string, string> = {
                'Content-Type': 'application/json',
            };
            if (this.server.apiKey) {
                headers['Authorization'] = `Bearer ${this.server.apiKey}`;
            }

            const response = await fetch(this.server.url, {
                method: 'POST',
                headers,
                body: JSON.stringify({
                    jsonrpc: '2.0',
                    id: ++this.requestId,
                    method: 'tools/call',
                    params: { name: toolName, arguments: args }
                })
            });

            if (!response.ok) {
                throw new Error(`MCP tool call error: ${response.status}`);
            }

            const data = await response.json();
            const duration = Date.now() - startTime;

            if (data.error) {
                return {
                    toolName,
                    serverId: this.server.id,
                    result: null,
                    error: data.error.message,
                    duration
                };
            }

            return {
                toolName,
                serverId: this.server.id,
                result: data.result,
                duration
            };
        } catch (error) {
            return {
                toolName,
                serverId: this.server.id,
                result: null,
                error: `${error}`,
                duration: Date.now() - startTime
            };
        }
    }

    disconnect() {
        if (this.eventSource) {
            this.eventSource.close();
            this.eventSource = null;
        }
    }
}

// MCP Server connection manager
export const mcpClients: Map<string, MCPClient> = new Map();

export const connectMCPServer = async (server: MCPServer): Promise<MCPTool[]> => {
    const client = new MCPClient(server);
    const tools = await client.connect();
    mcpClients.set(server.id, client);
    return tools;
};

export const disconnectMCPServer = (serverId: string) => {
    const client = mcpClients.get(serverId);
    if (client) {
        client.disconnect();
        mcpClients.delete(serverId);
    }
};

export const callMCPTool = async (
    serverId: string,
    toolName: string,
    args: Record<string, unknown>
): Promise<MCPToolResult> => {
    const client = mcpClients.get(serverId);
    if (!client) {
        return {
            toolName,
            serverId,
            result: null,
            error: 'MCP server not connected'
        };
    }
    return client.callTool(toolName, args);
};

// ============================================================
// Chat Export Utilities
// ============================================================

import { Message, ChatSession } from './types';

export const exportChatToMarkdown = (session: ChatSession): string => {
    const lines: string[] = [
        `# ${session.title}`,
        ``,
        `**Date:** ${session.createdAt.toLocaleDateString()}`,
        `**Model:** ${session.model}`,
        `**Mode:** ${session.featureMode}`,
        ``,
        `---`,
        ``
    ];

    for (const msg of session.messages) {
        const role = msg.role === 'user' ? '**You**' : '**Assistant**';
        const time = msg.timestamp.toLocaleTimeString();
        lines.push(`### ${role} *(${time})*`);
        lines.push(``);

        const content = typeof msg.content === 'string'
            ? msg.content
            : msg.content.map(p => p.type === 'text' ? p.text || '' : '[Image]').join('\n');

        lines.push(content);

        if (msg.reasoning) {
            lines.push(``);
            lines.push(`<details><summary>Reasoning</summary>`);
            lines.push(``);
            lines.push(msg.reasoning);
            lines.push(`</details>`);
        }

        if (msg.citations && msg.citations.length > 0) {
            lines.push(``);
            lines.push(`**Sources:**`);
            msg.citations.forEach((c, i) => {
                lines.push(`${i + 1}. [${c.title}](${c.url})`);
            });
        }

        lines.push(``);
        lines.push(`---`);
        lines.push(``);
    }

    return lines.join('\n');
};

export const exportChatToJSON = (session: ChatSession): string => {
    return JSON.stringify(session, null, 2);
};

export const importChatFromJSON = (json: string): ChatSession | null => {
    try {
        const data = JSON.parse(json);
        return {
            ...data,
            createdAt: new Date(data.createdAt),
            updatedAt: new Date(data.updatedAt),
            messages: data.messages.map((msg: Message & { timestamp: string }) => ({
                ...msg,
                timestamp: new Date(msg.timestamp)
            }))
        };
    } catch {
        return null;
    }
};

// ============================================================
// Token Estimation
// ============================================================

export const estimateTokens = (text: string): number => {
    // Rough estimation: ~4 chars per token for English, ~2 chars for CJK/Burmese
    const cjkPattern = /[\u3000-\u9fff\uac00-\ud7af\u1000-\u109f]/g;
    const cjkMatches = text.match(cjkPattern) || [];
    const cjkChars = cjkMatches.length;
    const latinChars = text.length - cjkChars;
    return Math.ceil(latinChars / 4) + Math.ceil(cjkChars / 2);
};

export const estimateMessagesTokens = (messages: Array<{ role: string; content: unknown }>): number => {
    return messages.reduce((total, msg) => {
        const content = typeof msg.content === 'string'
            ? msg.content
            : JSON.stringify(msg.content);
        return total + estimateTokens(content) + 4; // 4 tokens overhead per message
    }, 0);
};
