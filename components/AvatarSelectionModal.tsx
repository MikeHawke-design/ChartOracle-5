import React, { useState } from 'react';
import { GoogleGenAI } from "@google/genai";
import Logo from './Logo.tsx';
import { ApiConfiguration } from '../types.ts';


interface AvatarSelectionModalProps {
    isOpen: boolean;
    onClose: () => void;
    onAvatarSelect: (avatarDataUrl: string) => void;
    apiConfig: ApiConfiguration;
}

const AvatarSelectionModal: React.FC<AvatarSelectionModalProps> = ({ isOpen, onClose, onAvatarSelect, apiConfig }) => {
    const [generatedAvatars, setGeneratedAvatars] = useState<string[]>([]);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState('');
    const [selectedIndex, setSelectedIndex] = useState<number | null>(null);
    const [regenAttempts, setRegenAttempts] = useState(3);

    const getAiClient = () => {
        if (!apiConfig.geminiApiKey) return null;
        return new GoogleGenAI({ apiKey: apiConfig.geminiApiKey });
    };

    const generateAvatars = async (isRegen: boolean = false) => {
        if (isRegen) {
            if (regenAttempts <= 0) {
                setError("No more re-generation attempts remaining.");
                return;
            }
            setRegenAttempts(prev => prev - 1);
        }

        const ai = getAiClient();
        if (!ai) {
            setError('API Key is not set. Cannot generate avatars.');
            return;
        }

        setIsLoading(true);
        setError('');
        setGeneratedAvatars([]);
        setSelectedIndex(null);

        try {
            const response = await ai.models.generateImages({
                model: 'imagen-4.0-generate-001',
                prompt: "Generate a single, high-detail, artistic portrait of a cyberpunk cyborg's head. The image must contain only one character. The style should be consistent across all generated images: futuristic, intricate mechanical details, glowing neon accents, and a moody, atmospheric tone. Each generated image should feature a different, unique cyborg character, but all should belong to the same visual universe. The background should be a dark, abstract, tech-inspired pattern. Ensure the composition is a focused headshot portrait.",
                config: {
                    numberOfImages: 4,
                    outputMimeType: 'image/png',
                },
            });
            const base64Images = response.generatedImages?.map(img => img.image ? `data:image/png;base64,${img.image.imageBytes}` : null).filter(Boolean) as string[] || [];
            setGeneratedAvatars(base64Images);
        } catch (e) {
            setError(`Failed to generate avatars: ${e instanceof Error ? e.message : "Unknown error"}`);
            console.error(e);
        } finally {
            setIsLoading(false);
        }
    };
    
    const handleSelectAndClose = () => {
        if (selectedIndex !== null && generatedAvatars[selectedIndex]) {
            onAvatarSelect(generatedAvatars[selectedIndex]);
        }
    };
    
    // Auto-generate on open if no avatars exist and API key is present
    React.useEffect(() => {
        if (isOpen && generatedAvatars.length === 0 && !isLoading && apiConfig.geminiApiKey) {
            generateAvatars(false);
        }
    }, [isOpen, generatedAvatars.length, isLoading, apiConfig.geminiApiKey]);

    if (!isOpen) return null;

    return (
        <div
            className="fixed inset-0 bg-gray-900/80 flex items-center justify-center z-[110] p-4 animate-fadeIn"
            aria-modal="true"
            role="dialog"
        >
            <div
                className="bg-gray-800 p-6 rounded-lg shadow-xl max-w-2xl w-full border border-yellow-500/50 flex flex-col"
            >
                <div className="text-center">
                    <h2 className="text-2xl font-bold text-yellow-400">Choose Your Avatar</h2>
                    <p className="text-gray-400 mt-1">Select an AI-generated avatar to represent you on the platform.</p>
                </div>

                <div className="my-6 min-h-[124px] flex items-center justify-center">
                    {isLoading ? (
                        <div className="text-center">
                            <Logo className="w-16 h-16 mx-auto" isLoading={true} />
                            <p className="mt-2 text-gray-300 animate-pulse">Generating avatars...</p>
                        </div>
                    ) : error ? (
                        <p className="text-red-400 text-center">{error}</p>
                    ) : generatedAvatars.length > 0 ? (
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                            {generatedAvatars.map((src, index) => (
                                <button
                                    key={index}
                                    onClick={() => setSelectedIndex(index)}
                                    className={`rounded-full p-1 border-4 transition-all duration-200 ${selectedIndex === index ? 'border-yellow-400 scale-110' : 'border-transparent hover:border-gray-600'}`}
                                >
                                    <img
                                        src={src}
                                        alt={`Avatar option ${index + 1}`}
                                        className="w-24 h-24 rounded-full object-cover"
                                    />
                                </button>
                            ))}
                        </div>
                    ) : (
                         <button
                            onClick={() => generateAvatars(false)}
                            disabled={isLoading || !apiConfig.geminiApiKey}
                            className="font-bold py-3 px-6 rounded-lg transition-colors bg-blue-600 hover:bg-blue-500 text-white disabled:bg-gray-600"
                            title={!apiConfig.geminiApiKey ? "Set your API key first" : "Generate avatars"}
                        >
                            Generate Avatars
                        </button>
                    )}
                </div>

                <div className="flex flex-col sm:flex-row justify-center items-center gap-4 mt-auto pt-4 border-t border-gray-700">
                     <button
                        onClick={onClose}
                        className="w-full sm:w-auto font-bold py-2 px-6 rounded-lg transition-colors bg-gray-600 hover:bg-gray-500 text-white"
                    >
                        Skip
                    </button>
                    <button
                        onClick={() => generateAvatars(true)}
                        disabled={isLoading || regenAttempts <= 0 || !apiConfig.geminiApiKey}
                        className="w-full sm:w-auto font-bold py-2 px-6 rounded-lg transition-colors bg-blue-600 hover:bg-blue-500 text-white disabled:bg-gray-600"
                    >
                        Re-generate ({regenAttempts} left)
                    </button>
                    <button
                        onClick={handleSelectAndClose}
                        disabled={isLoading || selectedIndex === null}
                        className="w-full sm:w-auto font-bold py-2 px-6 rounded-lg transition-colors bg-yellow-500 hover:bg-yellow-400 text-gray-900 disabled:bg-gray-600"
                    >
                        Confirm Selection
                    </button>
                </div>
            </div>
            <style>{`
                @keyframes fadeIn { from { opacity: 0; transform: scale(0.95); } to { opacity: 1; transform: scale(1); } }
                .animate-fadeIn { animation: fadeIn 0.2s ease-out; }
            `}</style>
        </div>
    );
};

export default AvatarSelectionModal;