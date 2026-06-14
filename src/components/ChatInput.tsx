'use client';

import React, { useEffect, useRef, useCallback } from 'react';
import { Send, Upload, X, Square, ImageIcon, FileText, Mic, MicOff } from 'lucide-react';
import { FeatureMode } from '@/lib/types';

interface UploadedFile {
    name: string;
    type: 'image' | 'document';
    url?: string;
    size: number;
    mimeType?: string;
}

interface ChatInputProps {
    input: string;
    setInput: (value: string) => void;
    sendMessage: () => void;
    stopGeneration?: () => void;
    isLoading: boolean;
    apiKey: string;
    uploadedFiles: UploadedFile[];
    removeUploadedFile: (index: number) => void;
    handleFileUpload: (event: React.ChangeEvent<HTMLInputElement>) => void;
    fileInputRef: React.RefObject<HTMLInputElement | null>;
    featureMode: FeatureMode;
    currentChatId: string;
    onFocusRef?: (focus: () => void) => void;
}

export function ChatInput({
    input,
    setInput,
    sendMessage,
    stopGeneration,
    isLoading,
    apiKey,
    uploadedFiles,
    removeUploadedFile,
    handleFileUpload,
    fileInputRef,
    featureMode,
    currentChatId,
    onFocusRef
}: ChatInputProps) {
    const textareaRef = useRef<HTMLTextAreaElement>(null);
    const isListeningRef = useRef(false);
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const recognitionRef = useRef<any>(null);
    const [isListening, setIsListening] = React.useState(false);

    // Auto-resize textarea
    useEffect(() => {
        const textarea = textareaRef.current;
        if (textarea) {
            textarea.style.height = 'auto';
            textarea.style.height = Math.min(textarea.scrollHeight, 200) + 'px';
        }
    }, [input]);

    // Expose focus function to parent
    useEffect(() => {
        if (onFocusRef) {
            onFocusRef(() => textareaRef.current?.focus());
        }
    }, [onFocusRef]);

    // Listen for fill-input events from suggested prompts
    useEffect(() => {
        const handler = (e: CustomEvent<string>) => {
            setInput(e.detail);
            setTimeout(() => textareaRef.current?.focus(), 50);
        };
        window.addEventListener('fill-input', handler as EventListener);
        return () => window.removeEventListener('fill-input', handler as EventListener);
    }, [setInput]);

    // Keyboard shortcuts
    const handleKeyDown = useCallback((e: React.KeyboardEvent<HTMLTextAreaElement>) => {
        if (e.key === 'Enter' && !e.shiftKey && !e.ctrlKey) {
            e.preventDefault();
            if (!isLoading && input.trim() && apiKey) {
                sendMessage();
            }
        }
        if (e.key === 'Enter' && e.ctrlKey) {
            e.preventDefault();
            if (!isLoading && input.trim() && apiKey) {
                sendMessage();
            }
        }
        if (e.key === 'Escape' && isLoading && stopGeneration) {
            stopGeneration();
        }
    }, [isLoading, input, apiKey, sendMessage, stopGeneration]);

    // Voice input
    const toggleVoiceInput = useCallback(() => {
        if (!('webkitSpeechRecognition' in window) && !('SpeechRecognition' in window)) {
            alert('Voice input is not supported in this browser. Please use Chrome or Edge.');
            return;
        }

        if (isListeningRef.current) {
            recognitionRef.current?.stop();
            setIsListening(false);
            isListeningRef.current = false;
            return;
        }

        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
        const recognition = new SpeechRecognition();
        recognition.continuous = true;
        recognition.interimResults = true;
        recognition.lang = 'en-US';

        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        recognition.onresult = (event: any) => {
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            const transcript = Array.from(event.results as any[])
                .map((result: any) => result[0].transcript)
                .join('');
            setInput(transcript);
        };

        recognition.onend = () => {
            setIsListening(false);
            isListeningRef.current = false;
        };

        recognition.onerror = () => {
            setIsListening(false);
            isListeningRef.current = false;
        };

        recognitionRef.current = recognition;
        recognition.start();
        setIsListening(true);
        isListeningRef.current = true;
    }, [setInput]);

    const canSend = input.trim() && apiKey && !isLoading;
    const showFileUpload = featureMode === 'vision' || featureMode === 'standard';
    const placeholder = !apiKey
        ? 'Set your API key in Settings to start chatting...'
        : isLoading
            ? 'Generating response... (Esc to stop)'
            : `Message RavenGPT... (Enter to send, Shift+Enter for new line)`;

    return (
        <div className="border-t border-gray-200 dark:border-dark-800 bg-white dark:bg-dark-950">
            {/* Uploaded files preview */}
            {uploadedFiles.length > 0 && (
                <div className="px-4 pt-3">
                    <div className="max-w-3xl mx-auto">
                        <div className="flex flex-wrap gap-2">
                            {uploadedFiles.map((file, index) => (
                                <div
                                    key={index}
                                    className="flex items-center gap-2 bg-gray-100 dark:bg-dark-800 px-3 py-2 rounded-lg text-sm border border-gray-200 dark:border-dark-700 max-w-48"
                                >
                                    {file.type === 'image'
                                        ? <ImageIcon className="w-4 h-4 text-blue-500 flex-shrink-0" />
                                        : <FileText className="w-4 h-4 text-orange-500 flex-shrink-0" />
                                    }
                                    <span className="truncate text-gray-700 dark:text-dark-200 text-xs">{file.name}</span>
                                    <button
                                        onClick={() => removeUploadedFile(index)}
                                        className="text-gray-400 hover:text-red-500 dark:hover:text-red-400 flex-shrink-0 transition-colors"
                                    >
                                        <X className="w-3.5 h-3.5" />
                                    </button>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
            )}

            {/* Input area */}
            <div className="p-4">
                <div className="max-w-3xl mx-auto">
                    <div className={`relative bg-white dark:bg-dark-900 border rounded-2xl shadow-sm transition-all ${isLoading
                        ? 'border-orange-300 dark:border-orange-700'
                        : 'border-gray-300 dark:border-dark-700 focus-within:border-blue-500 dark:focus-within:border-blue-500'
                        }`}>
                        <textarea
                            ref={textareaRef}
                            value={input}
                            onChange={(e) => setInput(e.target.value)}
                            onKeyDown={handleKeyDown}
                            placeholder={placeholder}
                            disabled={!apiKey}
                            className="w-full resize-none border-none outline-none bg-transparent text-gray-900 dark:text-dark-100 placeholder-gray-400 dark:placeholder-dark-500 px-4 pt-4 pb-2 text-sm leading-relaxed"
                            style={{ minHeight: '56px', maxHeight: '200px' }}
                            rows={1}
                        />

                        {/* Action buttons row */}
                        <div className="flex items-center justify-between px-3 pb-3">
                            <div className="flex items-center gap-1">
                                {/* File upload */}
                                {showFileUpload && (
                                    <button
                                        onClick={() => fileInputRef.current?.click()}
                                        disabled={!apiKey || isLoading}
                                        className="p-2 text-gray-400 hover:text-gray-600 dark:hover:text-dark-200 disabled:opacity-40 rounded-lg hover:bg-gray-100 dark:hover:bg-dark-800 transition-colors"
                                        title="Upload image or document"
                                    >
                                        <Upload className="w-4 h-4" />
                                    </button>
                                )}

                                {/* Voice input */}
                                <button
                                    onClick={toggleVoiceInput}
                                    disabled={!apiKey}
                                    className={`p-2 rounded-lg transition-colors disabled:opacity-40 ${isListening
                                        ? 'text-red-500 bg-red-50 dark:bg-red-900/20 hover:bg-red-100 dark:hover:bg-red-900/30'
                                        : 'text-gray-400 hover:text-gray-600 dark:hover:text-dark-200 hover:bg-gray-100 dark:hover:bg-dark-800'
                                        }`}
                                    title={isListening ? 'Stop voice input' : 'Start voice input'}
                                >
                                    {isListening ? <MicOff className="w-4 h-4" /> : <Mic className="w-4 h-4" />}
                                </button>
                            </div>

                            <div className="flex items-center gap-2">
                                {/* Character count */}
                                {input.length > 500 && (
                                    <span className={`text-xs ${input.length > 4000 ? 'text-red-500' : 'text-gray-400 dark:text-dark-500'}`}>
                                        {input.length.toLocaleString()}
                                    </span>
                                )}

                                {/* Stop / Send button */}
                                {isLoading && stopGeneration ? (
                                    <button
                                        onClick={stopGeneration}
                                        className="flex items-center gap-1.5 px-3 py-1.5 bg-red-100 dark:bg-red-900/30 text-red-600 dark:text-red-400 hover:bg-red-200 dark:hover:bg-red-900/50 rounded-lg text-xs font-medium transition-colors"
                                        title="Stop generation (Esc)"
                                    >
                                        <Square className="w-3.5 h-3.5 fill-current" />
                                        Stop
                                    </button>
                                ) : (
                                    <button
                                        onClick={sendMessage}
                                        disabled={!canSend}
                                        className="flex items-center gap-1.5 px-3 py-1.5 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-200 dark:disabled:bg-dark-800 text-white disabled:text-gray-400 dark:disabled:text-dark-500 rounded-lg text-xs font-medium transition-colors disabled:cursor-not-allowed"
                                        title="Send message (Enter)"
                                    >
                                        <Send className="w-3.5 h-3.5" />
                                        Send
                                    </button>
                                )}
                            </div>
                        </div>
                    </div>

                    {/* Keyboard shortcut hint */}
                    <p className="text-center text-xs text-gray-400 dark:text-dark-600 mt-2">
                        Enter to send · Shift+Enter for new line · Esc to stop
                    </p>
                </div>
            </div>

            {/* Hidden File Input */}
            <input
                ref={fileInputRef}
                type="file"
                multiple
                accept="image/*,.pdf,.txt,.md,.doc,.docx,.csv,.json"
                onChange={handleFileUpload}
                className="hidden"
            />
        </div>
    );
}
