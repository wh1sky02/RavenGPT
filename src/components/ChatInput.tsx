import { Send, Upload, X, FileText, Image as ImageIcon } from 'lucide-react';
import { FeatureMode } from '@/lib/types';

interface ChatInputProps {
    input: string;
    setInput: (value: string) => void;
    sendMessage: () => void;
    isLoading: boolean;
    apiKey: string;
    uploadedFiles: Array<{
        type: 'image' | 'document';
        name: string;
        url: string;
        size: number;
    }>;
    removeUploadedFile: (index: number) => void;
    handleFileUpload: (event: React.ChangeEvent<HTMLInputElement>) => void;
    fileInputRef: React.RefObject<HTMLInputElement | null>;
    featureMode: FeatureMode;
    currentChatId: string;
}

export function ChatInput({
    input,
    setInput,
    sendMessage,
    isLoading,
    apiKey,
    uploadedFiles,
    removeUploadedFile,
    handleFileUpload,
    fileInputRef,
    featureMode,
    currentChatId
}: ChatInputProps) {
    return (
        <div className="flex-col">
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
                                    onKeyDown={(e) => {
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
    );
}
