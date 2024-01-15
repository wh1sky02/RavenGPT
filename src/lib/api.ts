import { Model, OpenRouterModel } from './types';

export const fetchOpenRouterModels = async (): Promise<Model[]> => {
    try {
        const response = await fetch('https://openrouter.ai/api/v1/models');
        if (!response.ok) throw new Error(`OpenRouter API error: ${response.status}`);

        const data = await response.json();
        const models: OpenRouterModel[] = data.data;

        console.log(`Found ${models.length} models on OpenRouter`);

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
                    model.supported_parameters?.includes('reasoning') ||
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

export const fetchGroqModels = async (apiKey: string): Promise<Model[]> => {
    console.log('🔍 === FETCHING GROQ MODELS ===');
    // Known free models available on Groq (all models are free with daily limits)
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

    // If no API key, return known free models
    if (!apiKey) {
        console.log('🔑 No Groq API key provided, returning known free models');
        console.log('🎯 Known free models:', knownFreeModels.map(m => m.id));
        return knownFreeModels;
    }

    try {
        const response = await fetch('https://api.groq.com/openai/v1/models', {
            headers: { 'Authorization': `Bearer ${apiKey}` }
        });

        if (!response.ok) {
            if (response.status === 401) {
                console.warn('Groq API key invalid, showing known free models');
                return knownFreeModels;
            }
            throw new Error(`Groq API error: ${response.status}`);
        }

        const data = await response.json();

        // All Groq models are free (up to daily limits), so return all available models
        const models = data.data || [];

        console.log(`Found ${models.length} free models on Groq:`, models.map((m: { id: string }) => m.id));

        if (models.length === 0) {
            console.warn('No models found via Groq API, using known free models');
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

        const mappedModels = chatModels.map((model: { id: string }) => {
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

        console.log('🔧 Groq API models fetched:', models.map((m: { id: string }) => m.id));
        console.log('🔧 Groq models mapped:', mappedModels.map((m: Model) => `${m.id} -> ${m.name}`));
        console.log('✅ === GROQ MODELS FETCH COMPLETE ===');
        return mappedModels;
    } catch (error) {
        console.error('Groq API error:', error);
        console.log('Falling back to known free models');
        return knownFreeModels;
    }
};

export const fetchTogetherAIModels = async (apiKey: string): Promise<Model[]> => {
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
