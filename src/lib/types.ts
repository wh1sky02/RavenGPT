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
    };
}

export interface Message {
    id: string;
    role: 'user' | 'assistant';
    content: string | Array<{ type: string; text?: string; image_url?: { url: string } }>;
    timestamp: Date;
    reasoning?: string;
    citations?: Array<{
        url: string;
        title: string;
        content?: string;
    }>;
    attachments?: Array<{
        type: 'image' | 'document';
        name: string;
        url: string;
        size: number;
    }>;
}

export interface ChatSession {
    id: string;
    title: string;
    messages: Message[];
    createdAt: Date;
    updatedAt: Date;
    featureMode: FeatureMode;
    model: string;
}

export interface Model {
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

export type FeatureMode = 'standard' | 'reasoning' | 'web-search' | 'vision';

export const PROVIDER_URLS = {
    'OpenRouter': 'https://openrouter.ai/api/v1/chat/completions',
    'Together AI': 'https://api.together.xyz/v1/chat/completions',
    'Groq': 'https://api.groq.com/openai/v1/chat/completions',
    'Custom API URL': '' // User can enter their own
};
