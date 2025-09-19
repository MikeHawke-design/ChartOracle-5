import React, { useState, useRef, useEffect, useCallback, useMemo } from 'react';
import { GoogleGenAI, Part, GenerateContentResponse } from "@google/genai";
import { StrategyKey, StrategyLogicData, User, UserSettings, TokenUsageRecord, ApiConfiguration, MarketDataCache, EodhdUsageStats, CourseModule, MarketDataCandle } from '../types.ts';
import * as pdfjsLib from 'pdfjs-dist/build/pdf.mjs';
import JSZip from 'jszip';
import ConfirmationModal from './ConfirmationModal.tsx';
import Logo from './Logo.tsx';
import { TTS_VOICE_OPTIONS, EXOTIC_VOICE_COST_THRESHOLD, BETA_ACCESS_KEYS, ALL_PERSISTENT_STORAGE_KEYS, DEMO_TICKERS, EODHD_SYMBOLS } from '../constants.ts';
import { synthesizeSpeech } from '../tts.ts';
import { getAllEntries, clearStore, setItem } from '../idb.ts';
import InteractiveChartModal from './InteractiveChartModal.tsx';

pdfjsLib.GlobalWorkerOptions.workerSrc = `https://esm.sh/pdfjs-dist@4.4.168/build/pdf.worker.mjs`;

interface MasterControlsViewProps {
    strategyLogicData: Record<StrategyKey, StrategyLogicData>;
    setStrategyLogicData: React.Dispatch<React.SetStateAction<Record<StrategyKey, StrategyLogicData>>>;
    apiConfig: ApiConfiguration;
    setApiConfig: React.Dispatch<React.SetStateAction<ApiConfiguration>>;
    userSettings: UserSettings;
    onUserSettingsChange: (key: keyof UserSettings, value: any) => void;
    currentUser: User | null;
    tokenUsageHistory: TokenUsageRecord[];
    onLogTokenUsage: (tokens: number) => void;
    onOpenLegal: (type: 'privacy' | 'terms') => void;
    marketDataCache: MarketDataCache;
    onFetchAndLoadData: (symbol: string, timeframe: string, from: string, to: string) => Promise<{ count: number; key: string; }>;
    onRemoveMarketData: (cacheKey: string) => void;
    onRestoreData: (data: Record<string, any>) => void;
    eodhdUsage: EodhdUsageStats | null;
    onFetchEodhdUsage: () => void;
}

// Helper function for retrying API calls with exponential backoff
async function retryWithBackoff<T>(
  fn: () => Promise<T>,
  retries: number = 3,
  delay: number = 2000,
  onRetry: (attempt: number, delay: number, error: any) => void
): Promise<T> {
  let attempt = 1;
  while (true) {
    try {
      return await fn();
    } catch (error: any) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      const isOverloaded = errorMessage.includes('503') || errorMessage.toLowerCase().includes('overloaded') || errorMessage.toLowerCase().includes('unavailable');

      if (!isOverloaded || attempt >= retries) {
        throw error;
      }
      
      const currentDelay = delay * Math.pow(2, attempt - 1);
      onRetry(attempt, currentDelay, error);
      
      await new Promise(resolve => setTimeout(resolve, currentDelay));
      attempt++;
    }
  }
}

// --- ICONS ---
const ViewIcon = (props:{className?:string}) => <svg {...props} xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor"><path d="M10 12.5a2.5 2.5 0 1 0 0-5 2.5 2.5 0 0 0 0 5Z" /><path fillRule="evenodd" d="M.664 10.59a1.651 1.651 0 0 1 0-1.18l.88-1.473a1.65 1.65 0 0 1 1.505-.882H16.95a1.65 1.65 0 0 1 1.505.882l.88 1.473c.447.746.447 1.613 0 2.358l-.88 1.473a1.65 1.65 0 0 1-1.505.882H3.05a1.65 1.65 0 0 1-1.505-.882l-.88-1.473ZM2.65 9.7a.15.15 0 0 1 .136.08l.88 1.473a.15.15 0 0 0 .137.08H16.19a.15.15 0 0 0 .136-.08l.88-1.473a.15.15 0 0 1 0-.16l-.88-1.473a.15.15 0 0 0-.136-.08H3.05a.15.15 0 0 0-.136.08l-.88 1.473a.15.15 0 0 1 0 .16Z" clipRule="evenodd" /></svg>;
const EditIcon = (props:{className?:string}) => <svg {...props} xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor"><path d="M2.695 14.763l-1.262 3.154a.5.5 0 0 0 .65.65l3.155-1.262a4 4 0 0 0 1.343-.885L17.5 5.5a2.121 2.121 0 0 0-3-3L3.58 13.42a4 4 0 0 0-.885 1.343Z" /></svg>;
const TrashIcon = (props:{className?:string}) => <svg {...props} xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M8.75 1A2.75 2.75 0 0 0 6 3.75v.443c-.795.077-1.58.22-2.365.468a.75.75 0 1 0 .214 1.482l.025.007c.786.246 1.573.393 2.37.468v6.618A2.75 2.75 0 0 0 8.75 18h2.5A2.75 2.75 0 0 0 14 15.25V5.162c.797-.075 1.585-.222 2.37-.468a.75.75 0 1 0-.214-1.482l-.025-.007a33.58 33.58 0 0 0-2.365-.468V3.75A2.75 2.75 0 0 0 11.25 1h-2.5ZM10 4c.84 0 1.673.025 2.5.075V15.25a1.25 1.25 0 0 1-1.25 1.25h-2.5A1.25 1.25 0 0 1 7.5 15.25V4.075C8.327 4.025 9.16 4 10 4Z" clipRule="evenodd" /></svg>;
const PlusIcon = (props:{className?:string}) => <svg {...props} xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor"><path d="M10.75 4.75a.75.75 0 0 0-1.5 0v4.5h-4.5a.75.75 0 0 0 0 1.5h4.5v4.5a.75.75 0 0 0 1.5 0v-4.5h4.5a.75.75 0 0 0 0-1.5h-4.5v-4.5Z" /></svg>;
const PlayIcon = (props:{className?:string}) => <svg {...props} xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor"><path d="M6.3 2.841A1.5 1.5 0 0 0 4 4.11V15.89a1.5 1.5 0 0 0 2.3 1.269l9.344-5.89a1.5 1.5 0 0 0 0-2.538L6.3 2.84Z" /></svg>;
const LoadingIcon = (props: { className?: string }) => (
     <svg {...props} className={`animate-spin ${props.className}`} xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
    </svg>
);
const ChevronDownIcon = (props:{className?:string}) => <svg {...props} xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M5.22 8.22a.75.75 0 0 1 1.06 0L10 11.94l3.72-3.72a.75.75 0 1 1 1.06 1.06l-4.25 4.25a.75.75 0 0 1-1.06 0L5.22 9.28a.75.75 0 0 1 0-1.06Z" clipRule="evenodd" /></svg>;
const DataManagementIcon = (props:{className?:string}) => <svg {...props} xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M10 2a8 8 0 1 0 0 16 8 8 0 0 0 0-16ZM8.5 4.5a.5.5 0 0 0-1 0v3.75a.5.5 0 0 0 1 0V4.5Zm3.5.5a.5.5 0 0 1 .5.5v2.75a.5.5 0 0 1-1 0V5.5a.5.5 0 0 1 .5-.5Zm-5.5 5.5a.5.5 0 0 0-1 0v3.75a.5.5 0 0 0 1 0V10.5Zm3.5.5a.5.5 0 0 1 .5.5v2.75a.5.5 0 0 1-1 0v-2.75a.5.5 0 0 1 .5-.5Z" clipRule="evenodd" /></svg>;
const ChartIcon = (props:{className?:string}) => <svg {...props} xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor"><path d="M2 3.5A1.5 1.5 0 0 1 3.5 2h1.148a1.5 1.5 0 0 1 1.465 1.175l.716 3.223a1.5 1.5 0 0 1-1.052 1.767l-.933.267c-.41.117-.643.555-.48.95a11.542 11.542 0 0 0 6.254 6.254c.395.163.833-.07.95-.48l.267-.933a1.5 1.5 0 0 1 1.767-1.052l3.223.716A1.5 1.5 0 0 1 18 15.352V16.5A1.5 1.5 0 0 1 16.5 18h-13A1.5 1.5 0 0 1 2 16.5v-13Z" /></svg>;
const MemoryBankIcon = (props:{className?:string}) => <svg {...props} xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor"><path d="M8.75 3.75a.75.75 0 0 0-1.5 0v3.5h-3.5a.75.75 0 0 0 0 1.5h3.5v3.5a.75.75 0 0 0 1.5 0v-3.5h3.5a.75.75 0 0 0 0-1.5h-3.5v-3.5Z" /><path fillRule="evenodd" d="M10 18a8 8 0 1 0 0-16 8 8 0 0 0 0-16ZM8 10a2 2 0 1 1 4 0 2 2 0 0 1-4 0Z" clipRule="evenodd" /></svg>;
const RefreshIcon = (props: {className?: string}) => <svg {...props} xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M15.312 11.342a1.25 1.25 0 0 1 .938 1.252v2.156a.75.75 0 0 1-1.5 0v-2.156a.25.25 0 0 0-.25-.25h-5.5a.25.25 0 0 0-.25.25v6.5a.25.25 0 0 0 .25.25h5.5a.25.25 0 0 0 .25-.25v-2.156a.75.75 0 0 1 1.5 0v2.156A1.75 1.75 0 0 1 11 19.25h-5.5A1.75 1.75 0 0 1 3.75 17.5v-6.5A1.75 1.75 0 0 1 5.5 9.25h5.5A1.75 1.75 0 0 1 12.75 11v.592a1.25 1.25 0 0 1 2.562-.75ZM8.697.992a.75.75 0 0 1 .83.578l.422 2.108a.75.75 0 0 1-1.458.291l-.422-2.108a.75.75 0 0 1 .628-.869ZM6.5 3.25a.75.75 0 0 0-1.5 0v2.5a.75.75 0 0 0 1.5 0v-2.5Zm9-2.25a.75.75 0 0 1 .75.75v2.5a.75.75 0 0 1-1.5 0v-2.5a.75.75 0 0 1 .75-.75ZM11.303.992a.75.75 0 0 1 .628.869l-.422 2.108a.75.75 0 1 1-1.458-.291l.422-2.108a.75.75 0 0 1 .83-.578Z" clipRule="evenodd" /></svg>;
const KeyIcon = (props:{className?:string}) => <svg {...props} xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M18 8a6 6 0 0 1-7.743 5.743L10 14l-1 1-1 1H6v2H2v-4l4.257-4.257A6 6 0 1 1 18 8zm-6-4a1 1 0 1 0 0 2 1 1 0 0 0 0-2z" clipRule="evenodd" /></svg>;
const DataFeedIcon = (props:{className?:string}) => <svg {...props} xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor"><path d="M10 3.5a1.5 1.5 0 0 1 3 0V4a1 1 0 0 0 1 1h3a1 1 0 0 1 1 1v3a1 1 0 0 1-1 1h-1a1 1 0 1 0 0 2h1a1 1 0 0 1 1 1v3a1 1 0 0 1-1 1h-3a1 1 0 0 1-1-1v-.5a1.5 1.5 0 0 0-3 0v.5a1 1 0 0 1-1 1H6a1 1 0 0 1-1-1v-3a1 1 0 0 0-1-1H3a1 1 0 0 1-1-1V6a1 1 0 0 1 1-1h3a1 1 0 0 0 1-1v-.5a1.5 1.5 0 0 1 1.5-1.5zM10 5a1 1 0 0 0-1 1v3a1 1 0 0 0 1 1h1a1 1 0 0 0 1-1V6a1 1 0 0 0-1-1h-1z" /></svg>;

async function generateCourseForStrategy(
  strategy: Omit<StrategyLogicData, 'courseModule'>,
  apiKey: string,
  onLogTokenUsage: (tokens: number) => void
): Promise<CourseModule | null> {
    if (!apiKey) return null;
    const ai = new GoogleGenAI({ apiKey });

    const systemPrompt = `You are an expert trading curriculum designer AI. Your task is to transform a detailed, machine-readable trading strategy logic into a complete, interactive, and educational course module. The user will provide the strategy's name, description, and its core logic (which is a prompt intended for another AI analyst).

Your output MUST be a single, valid JSON object that strictly adheres to the 'CourseModule' TypeScript interface provided below. Absolutely no conversational text or markdown formatting outside of the JSON object.

**TypeScript Interface for CourseModule:**
\`\`\`typescript
export interface CourseModule {
  id: string; // You should generate a placeholder like "temp_id"
  title: string;
  description: string;
  lessons: {
    id: string; // Placeholder "temp_lesson_id_1"
    title: string;
    estimatedTime: string; // e.g., "15 min"
    blocks: ({
      type: 'text';
      content: string; // Markdown-supported string
    } | {
      type: 'exercise';
      prompt: string; // The instruction for the user
      validationPrompt: string; // The system prompt for the AI to validate the user's submission
    })[];
  }[];
  quiz: {
    question: string;
    options: string[];
    correctAnswer: string;
    explanationPrompt: string; // An AI prompt to explain the answer
  }[];
}
\`\`\`

**Your Process:**
1.  **Deconstruct Core Logic:** Deeply analyze the provided "Core Logic/Prompt for AI Analyst". This is your source material. Identify 2 to 3 primary, teachable concepts or sequential steps. These will become your lessons.
2.  **Create Lessons:** For each concept, create a \`CourseLesson\` object.
    *   \`title\`: A clear, descriptive title for the lesson.
    *   \`estimatedTime\`: A realistic time estimate in minutes (e.g., "15 min").
    *   \`blocks\`:
        *   Create \`LessonBlockText\` blocks to explain the concept in simple, clear language. Use markdown (\`<strong>\`, \`<em>\`) for emphasis.
        *   CRITICAL: After explaining each core concept, you MUST create a \`LessonBlockExercise\`. This is non-negotiable.
3.  **Design Exercises:** For each \`LessonBlockExercise\`:
    *   \`prompt\`: Write a clear, practical instruction for the user. It must always involve them finding an example on a chart, marking it, and uploading a screenshot.
    *   \`validationPrompt\`: This is the most critical part. You must write a "meta-prompt" for another AI. This prompt will be used to validate the user's submitted chart image. It must be extremely precise. Follow the structure of the \`createValidationPrompt\` function from the user's codebase: provide the original instruction, a detailed evaluation protocol, specific rules for the AI to check on the image, and examples of "PASS" and "FAIL" feedback.
4.  **Create Quiz:** Generate 2-4 high-quality \`QuizQuestion\` objects based on the most important aspects of the strategy.
    *   \`question\`: The question text.
    *   \`options\`: An array of 3-4 strings for the multiple-choice options.
    *   \`correctAnswer\`: The exact string of the correct option.
    *   \`explanationPrompt\`: A prompt for an AI to explain WHY the correct answer is right.

Your generated JSON must be perfect and ready for direct consumption by the application.`;

    try {
        const response = await ai.models.generateContent({
            model: 'gemini-2.5-flash',
            contents: `Here is the strategy to build a course from:\n\nName: ${strategy.name}\nDescription: ${strategy.description}\nCore Logic/Prompt for AI Analyst:\n${strategy.prompt}`,
            config: {
                systemInstruction: systemPrompt,
                responseMimeType: "application/json",
            }
        });

        onLogTokenUsage(response.usageMetadata?.totalTokenCount || 0);
        
        const jsonText = response.text.trim();
        const courseModule = JSON.parse(jsonText) as CourseModule;
        
        // Post-processing to ensure IDs are unique client-side
        courseModule.id = `course_${strategy.name.replace(/\s+/g, '_')}_${Date.now()}`;
        courseModule.lessons.forEach((lesson, lIndex) => {
            lesson.id = `${courseModule.id}_L${lIndex + 1}`;
        });

        return courseModule;
    } catch (e) {
        console.error("Failed to generate course module for strategy:", strategy.name, e);
        return null; // Return null on failure
    }
}

const CountdownTimer: React.FC<{ timestamp: number; onRefresh: () => void; }> = ({ timestamp, onRefresh }) => {
    const [timeLeft, setTimeLeft] = useState('');

    useEffect(() => {
        const calculateTimeLeft = () => {
            const now = new Date().getTime();
            const resetTime = timestamp * 1000;
            const distance = resetTime - now;

            if (distance < 0) {
                setTimeLeft('Ready to Reset');
                return;
            }

            const hours = String(Math.floor((distance % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60))).padStart(2, '0');
            const minutes = String(Math.floor((distance % (1000 * 60 * 60)) / (1000 * 60))).padStart(2, '0');
            const seconds = String(Math.floor((distance % (1000 * 60)) / 1000)).padStart(2, '0');

            setTimeLeft(`${hours}:${minutes}:${seconds}`);
        };

        calculateTimeLeft(); // Initial calculation
        const interval = setInterval(calculateTimeLeft, 1000);
        return () => clearInterval(interval);
    }, [timestamp]);

    return (
        <div className="flex items-center gap-1 text-xs font-mono text-gray-400">
            <span>{timeLeft}</span>
            {timeLeft === 'Ready to Reset' && (
                <button onClick={onRefresh} className="p-1 rounded-full hover:bg-gray-700 text-yellow-300" title="Refresh Usage Stats">
                    <RefreshIcon className="w-3 h-3"/>
                </button>
            )}
        </div>
    );
};

const ApiUsageTracker: React.FC<{ usage: EodhdUsageStats | null; onRefresh: () => void; }> = ({ usage, onRefresh }) => {
    if (!usage) {
        return (
            <div className="bg-gray-900/50 p-3 rounded-lg text-center">
                <p className="text-sm text-gray-500">API usage stats are unavailable. Check your EODHD key.</p>
            </div>
        );
    }

    const { dailyLimit, usedCalls, remainingCalls, resetTimestamp } = usage;
    const usagePercent = dailyLimit > 0 ? (usedCalls / dailyLimit) * 100 : 0;
    
    let progressBarColor = 'bg-green-500';
    if (usagePercent > 80) { // < 20% remaining
        progressBarColor = 'bg-red-500';
    } else if (usagePercent > 50) { // 20-50% remaining
        progressBarColor = 'bg-orange-500';
    }

    return (
        <div className="bg-gray-900/50 p-4 rounded-lg space-y-3">
            <div className="flex justify-between items-center">
                <h4 className="font-semibold text-gray-200 text-sm">EODHD API Usage</h4>
                <CountdownTimer timestamp={resetTimestamp} onRefresh={onRefresh}/>
            </div>
            <div>
                <div className="flex justify-between text-xs font-mono text-gray-300 mb-1">
                    <span>{usedCalls.toLocaleString()} / {dailyLimit.toLocaleString()}</span>
                    <span>{remainingCalls.toLocaleString()} left</span>
                </div>
                <div className="w-full bg-gray-700 rounded-full h-2.5">
                    <div className={`${progressBarColor} h-2.5 rounded-full transition-all duration-500`} style={{ width: `${usagePercent}%` }}></div>
                </div>
            </div>
        </div>
    );
};


export const MasterControlsView: React.FC<MasterControlsViewProps> = ({
    strategyLogicData,
    setStrategyLogicData,
    apiConfig,
    setApiConfig,
    userSettings,
    onUserSettingsChange,
    currentUser,
    tokenUsageHistory,
    onLogTokenUsage,
    onOpenLegal,
    marketDataCache,
    onFetchAndLoadData,
    onRemoveMarketData,
    onRestoreData,
    eodhdUsage,
    onFetchEodhdUsage,
}) => {
    const [status, setStatus] = useState<'idle' | 'summarizing' | 'error'>('idle');
    const [statusMessage, setStatusMessage] = useState('');

    const [isAddSourceModalOpen, setIsAddSourceModalOpen] = useState(false);
    const [addSourceMode, setAddSourceMode] = useState<'upload' | 'paste'>('upload');
    const [pastedText, setPastedText] = useState('');
    const fileInputRef = useRef<HTMLInputElement>(null);

    const [strategyToDelete, setStrategyToDelete] = useState<StrategyKey | null>(null);

    const [selectedCustomStrategyForEditing, setSelectedCustomStrategyForEditing] = useState<StrategyKey | null>(null);
    const [viewedCustomStrategy, setViewedCustomStrategy] = useState<StrategyKey | null>(null);

    const [editedName, setEditedName] = useState('');
    const [editedDescription, setEditedDescription] = useState('');
    const [editedPrompt, setEditedPrompt] = useState('');
    const [isPromptVisible, setIsPromptVisible] = useState(false);
    
    const [voiceSampleStatus, setVoiceSampleStatus] = useState<'idle' | 'loading' | 'playing' | 'error'>('idle');
    const sampleAudioRef = useRef<HTMLAudioElement | null>(null);
    
    const [voiceToConfirm, setVoiceToConfirm] = useState<{name: string, cost: number} | null>(null);
    const [masterKeyInput, setMasterKeyInput] = useState('');
    const [masterKeyError, setMasterKeyError] = useState('');

    const [isImportModalOpen, setIsImportModalOpen] = useState(false);
    const [fileToImport, setFileToImport] = useState<File | null>(null);
    const importFileRef = useRef<HTMLInputElement>(null);
    const [isImporting, setIsImporting] = useState(false);

    const [expandedStrategies, setExpandedStrategies] = useState<Record<StrategyKey, boolean>>({});

    // State for Market Data Bank
    const [dataSymbol, setDataSymbol] = useState('EURUSD.FOREX');
    const [symbolSuggestions, setSymbolSuggestions] = useState<string[]>([]);
    const [isSymbolDropdownVisible, setIsSymbolDropdownVisible] = useState(false);
    const [dataTimeframe, setDataTimeframe] = useState('Daily');
    const [dataFrom, setDataFrom] = useState(new Date(new Date().setFullYear(new Date().getFullYear() - 1)).toISOString().split('T')[0]);
    const [dataTo, setDataTo] = useState(new Date().toISOString().split('T')[0]);
    const [isFetchingData, setIsFetchingData] = useState(false);
    const [fetchStatusMessage, setFetchStatusMessage] = useState('');
    const [viewingChartData, setViewingChartData] = useState<{ title: string; data: MarketDataCandle[] } | null>(null);
    const [isMarketDataBankOpen, setIsMarketDataBankOpen] = useState(false);
    
    // State for API Key inputs and edit mode
    const [isEditingGeminiKey, setIsEditingGeminiKey] = useState(false);
    const [geminiApiKeyInput, setGeminiApiKeyInput] = useState(apiConfig.geminiApiKey || '');
    const [isEditingOpenaiKey, setIsEditingOpenaiKey] = useState(false);
    const [openaiApiKeyInput, setOpenaiApiKeyInput] = useState(apiConfig.openaiApiKey || '');
    const [isEditingEodhdKey, setIsEditingEodhdKey] = useState(false);
    const [eodhdApiKeyInput, setEodhdApiKeyInput] = useState(apiConfig.eodhdApiKey || '');

    const handleAppearanceInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const { name, value } = e.target;
        const processedValue = parseFloat(value);
        if (!isNaN(processedValue)) {
            onUserSettingsChange(name as keyof UserSettings, processedValue);
        }
    };
    
    useEffect(() => {
        const hasGemini = !!apiConfig.geminiApiKey;
        const hasOpenAI = !!apiConfig.openaiApiKey;
    
        if (hasGemini && !hasOpenAI) {
            if (userSettings.aiProvider !== 'gemini') {
                onUserSettingsChange('aiProvider', 'gemini');
            }
        } else if (!hasGemini && hasOpenAI) {
            if (userSettings.aiProvider !== 'openai') {
                onUserSettingsChange('aiProvider', 'openai');
            }
        }
    }, [apiConfig.geminiApiKey, apiConfig.openaiApiKey, userSettings.aiProvider, onUserSettingsChange]);

    useEffect(() => {
        if (apiConfig.geminiApiKey) {
            setGeminiApiKeyInput(apiConfig.geminiApiKey);
        }
    }, [apiConfig.geminiApiKey]);

    useEffect(() => {
        if (apiConfig.openaiApiKey) {
            setOpenaiApiKeyInput(apiConfig.openaiApiKey);
        }
    }, [apiConfig.openaiApiKey]);

    useEffect(() => {
        if (apiConfig.eodhdApiKey) {
            setEodhdApiKeyInput(apiConfig.eodhdApiKey);
        }
    }, [apiConfig.eodhdApiKey]);

    const tokenUsageAnalytics = useMemo(() => {
        const now = new Date();
        const oneWeekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
        const currentMonthStr = now.toISOString().slice(0, 7); // 'YYYY-MM'

        const weeklyTokens = tokenUsageHistory
            .filter(record => new Date(record.date) >= oneWeekAgo)
            .reduce((sum, record) => sum + record.tokens, 0);
            
        const monthlyTokens = tokenUsageHistory
            .filter(record => record.date.startsWith(currentMonthStr))
            .reduce((sum, record) => sum + record.tokens, 0);

        return { weeklyTokens, monthlyTokens };
    }, [tokenUsageHistory]);

    const getAiClient = useCallback(() => {
        if (!apiConfig.geminiApiKey) return null;
        return new GoogleGenAI({ apiKey: apiConfig.geminiApiKey });
    }, [apiConfig.geminiApiKey]);

    useEffect(() => {
        setIsPromptVisible(false);
    }, [viewedCustomStrategy]);

    useEffect(() => {
        if (selectedCustomStrategyForEditing && strategyLogicData[selectedCustomStrategyForEditing]) {
            const data = strategyLogicData[selectedCustomStrategyForEditing];
            setEditedName(data.name);
            setEditedDescription(data.description);
            setEditedPrompt(data.prompt);
        } else {
            setEditedName('');
            setEditedDescription('');
            setEditedPrompt('');
        }
    }, [selectedCustomStrategyForEditing, strategyLogicData]);
    
    const handleSaveEditedStrategy = () => {
        if (!selectedCustomStrategyForEditing) return;
        setStrategyLogicData(prev => ({
            ...prev,
            [selectedCustomStrategyForEditing]: {
                ...prev[selectedCustomStrategyForEditing],
                name: editedName,
                description: editedDescription,
                prompt: editedPrompt,
            }
        }));
        setSelectedCustomStrategyForEditing(null); // Close editor
    };

    const generateStrategyFromKnowledgeSource = async (source: { text?: string; images?: string[]; sourceName: string }) => {
        const ai = getAiClient();
        if (!ai) {
            setStatus('error');
            setStatusMessage("API Key not set. Please set your key before creating strategies.");
            return;
        }

        if ((!source.text || !source.text.trim()) && (!source.images || source.images.length === 0)) {
            setStatus('error');
            setStatusMessage("The provided source is empty. Please upload a file or paste text.");
            return;
        }

        // Status is already set to 'summarizing' by the caller
        setStatusMessage(`Analyzing "${source.sourceName}"... This may take a moment.`);

        const systemPrompt = `You are an expert prompt engineer and trading system designer. Your task is to analyze the provided knowledge source (text and/or images) and deconstruct it into an immensely intricate, machine-executable logical framework. Your goal is to capture every nuance, rule, and parameter with the highest possible fidelity.

**PRIMARY DIRECTIVE: DECONSTRUCT & SYSTEMATIZE**
1.  **Analyze Holistically:** Synthesize information from ALL provided parts (text and images). Images are not just illustrations; they contain critical, actionable information about chart setups, indicators, and patterns.
2.  **Identify Core Philosophy:** Distill the overarching philosophy or market perspective of the system (e.g., "market is algorithmic and seeks liquidity," "markets move between consolidation and expansion").
3.  **Extract Non-Negotiable Rules:** Identify all absolute, non-negotiable conditions for a trade to be valid (e.g., "price MUST be above the 200 EMA," "volume MUST be declining," "entry MUST be within a Killzone").
4.  **Define a Step-by-Step Process:** Structure the logic into a clear, sequential, step-by-step process that an analysis AI can follow without deviation. Use hierarchical steps (e.g., Step 1: HTF Analysis, Step 1.1: Identify DOL, Step 1.2: Check Market Structure).
5.  **Structure into Core & Sub-Strategies:**
    - Identify the main, overarching concept (the "Core Concept").
    - Identify distinct, actionable setups or models as "Sub-Strategies" (e.g., "The Reversal Model," "The Continuation Model"). If no clear sub-strategies exist, create a single comprehensive strategy.

**OUTPUT REQUIREMENTS:**
- Your entire output MUST be a single, valid JSON object with NO markdown formatting. CRITICAL: Ensure all string values within the JSON are properly escaped (e.g., double quotes inside a string should be represented as \\"). Failure to do so will break the application.
- The root object MUST have a key \`"extractedStrategies"\` (an array of strategy objects) and a key \`"coreConceptIndex"\` (the integer index of the Core Concept within the array).
- Each strategy object in the array MUST have the following keys:
    - \`"name"\`: A short, descriptive name (e.g., "Core ICT Philosophy", "ICT Judas Swing Entry"). Max 40 characters.
    - \`"description"\`: A professional, 2-4 sentence summary of the strategy's methodology, informed by all source material.
    - \`"summary"\`: A concise, one-sentence summary.
    - \`"prompt"\`: This is the most critical part. It must be a professional-grade, detailed, step-by-step prompt for an AI analyst. Use clear headings, bullet points, and explicit, unambiguous language. This prompt is the final "source code" for the strategy. Sub-strategy prompts should reference and build upon the Core Concept's logic.
    - \`"assetClasses"\`: An array of strings representing compatible asset classes (e.g., ["Forex", "Crypto"]). Infer this from context.
    - \`"timeZoneSpecificity"\`: A string describing any time-based requirements (e.g., "New York Killzone", "None"). Infer this from context.
    - \`"tradingStyles"\`: An array of strings representing compatible trading styles (e.g., ["Scalping", "Swing Trading"]). Infer this from the context.`;
        
        const requestParts: Part[] = [];

        if (source.text && source.text.trim()) {
            requestParts.push({ text: `Analyze the following content from a document named "${source.sourceName}".\n\n--- DOCUMENT TEXT ---\n${source.text}` });
        }

        if (source.images && source.images.length > 0) {
            source.images.forEach(base64Data => {
                const match = base64Data.match(/^data:(image\/(?:png|jpeg|webp));base64,/);
                if (match) {
                    const mimeType = match[1];
                    const data = base64Data.substring(match[0].length);
                    requestParts.push({ inlineData: { mimeType, data } });
                }
            });
        }

        try {
            const apiCall = () => ai.models.generateContent({
                model: 'gemini-2.5-flash',
                contents: [{ parts: requestParts }],
                config: {
                    responseMimeType: "application/json",
                    systemInstruction: systemPrompt
                }
            });

            const response: GenerateContentResponse = await retryWithBackoff(apiCall, 3, 3000, (attempt, delay) => {
                setStatusMessage(`Model is busy. Retrying in ${Math.round(delay/1000)}s... (Attempt ${attempt + 1}/3)`);
            });

            const totalTokenCount = response.usageMetadata?.totalTokenCount || 0;
            onLogTokenUsage(totalTokenCount);

            let jsonText = response.text.trim();
            const fenceRegex = /^```(\w*)?\s*\n?(.*?)\n?\s*```$/s;
            const match = jsonText.match(fenceRegex);
            if (match && match[2]) jsonText = match[2].trim();
            
            const parsedData = JSON.parse(jsonText);
            const aiStrategies = parsedData.extractedStrategies;

            if (!aiStrategies || !Array.isArray(aiStrategies) || aiStrategies.length === 0) {
                throw new Error("AI response was not in the expected format or found no strategies.");
            }

            const coreIndex = parsedData.coreConceptIndex ?? 0;
            const parentAiData = aiStrategies[coreIndex];
            
            const newStrategies: Record<StrategyKey, StrategyLogicData> = {};
            const newStrategyNames: string[] = [];
            let parentKey: StrategyKey | null = null;
            
            if (aiStrategies.length > 1) {
                parentKey = `custom_${Date.now()}_${Math.random()}`;
                
                const parentStratData: Omit<StrategyLogicData, 'courseModule'> = {
                    name: parentAiData.name, status: 'live', description: parentAiData.description,
                    prompt: parentAiData.prompt, summary: parentAiData.summary,
                    tags: ['Custom', source.sourceName.replace(/\.[^/.]+$/, "")], isEnabled: true,
                    creationTokenCost: 0, assetClasses: parentAiData.assetClasses || [],
                    timeZoneSpecificity: parentAiData.timeZoneSpecificity || 'None',
                    tradingStyles: parentAiData.tradingStyles || [],
                };

                setStatusMessage(`Generating course materials for "${parentStratData.name}"...`);
                const course = await generateCourseForStrategy(parentStratData, apiConfig.geminiApiKey, onLogTokenUsage);
                
                newStrategies[parentKey] = { ...parentStratData, courseModule: course || undefined };
                newStrategyNames.push(`- ${parentAiData.name} (Core Concept)`);
            }

            for (const [index, strat] of aiStrategies.entries()) {
                const isParentBeingProcessed = (index === coreIndex && aiStrategies.length > 1);
                if (isParentBeingProcessed) continue;

                const key: StrategyKey = `custom_${Date.now()}_${Math.random()}`;
                const stratData: Omit<StrategyLogicData, 'courseModule'> = {
                    name: strat.name, status: 'live', description: strat.description,
                    prompt: strat.prompt, summary: strat.summary,
                    tags: ['Custom', source.sourceName.replace(/\.[^/.]+$/, "")], isEnabled: true,
                    creationTokenCost: 0, parentId: parentKey || undefined,
                    assetClasses: strat.assetClasses || [],
                    timeZoneSpecificity: strat.timeZoneSpecificity || 'None',
                    tradingStyles: strat.tradingStyles || [],
                };
                
                setStatusMessage(`Generating course materials for "${stratData.name}"...`);
                const course = await generateCourseForStrategy(stratData, apiConfig.geminiApiKey, onLogTokenUsage);

                newStrategies[key] = { ...stratData, courseModule: course || undefined };
                newStrategyNames.push(parentKey ? `  - ${strat.name}` : `- ${strat.name}`);
            }
            
            if (newStrategyNames.length > 0) {
                setStrategyLogicData(prev => ({ ...prev, ...newStrategies }));
                setStatus('idle');
                setIsAddSourceModalOpen(false);
                setPastedText('');
                if (fileInputRef.current) fileInputRef.current.value = '';
                alert(`Success! Created ${newStrategyNames.length} new strategies and corresponding academy courses from "${source.sourceName}".\n\nCreated:\n${newStrategyNames.join('\n')}\n\nYou can now manage them below and use them in the Academy.`);
            } else {
                throw new Error("The AI did not find any actionable strategies in the provided document.");
            }
        } catch (e) {
            console.error("Error generating strategy:", e);
            setStatus('error');
            let errorMessage = `Failed to generate strategy from "${source.sourceName}". `;
            if (e instanceof Error && (e.message.includes('503') || e.message.toLowerCase().includes('overloaded'))) {
                errorMessage += "The AI model is currently overloaded. Please try again later.";
            } else {
                errorMessage += "The AI could not parse the document or there was a connection error. Please try again with a clearer source.";
            }
            setStatusMessage(errorMessage);
        }
    };
    
    const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
        const file = event.target.files?.[0];
        if (!file) return;

        setStatus('summarizing');
        setStatusMessage(`Reading file: "${file.name}"...`);

        setTimeout(async () => {
            try {
                if (file.type.startsWith('image/')) {
                    const base64Image = await new Promise<string>((resolve, reject) => {
                        const reader = new FileReader();
                        reader.onloadend = () => resolve(reader.result as string);
                        reader.onerror = () => reject(new Error("Failed to read the image file."));
                        reader.readAsDataURL(file);
                    });
                    await generateStrategyFromKnowledgeSource({ images: [base64Image], sourceName: file.name });
                    return;
                }

                if (file.type === 'application/pdf') {
                    const arrayBuffer = await file.arrayBuffer();
                    const pdf = await pdfjsLib.getDocument(arrayBuffer).promise;
                    let combinedText = '';
                    const pageImages: string[] = [];

                    setStatusMessage(`Processing PDF: 0/${pdf.numPages} pages...`);

                    for (let i = 1; i <= pdf.numPages; i++) {
                        const page = await pdf.getPage(i);
                        
                        const textContent = await page.getTextContent();
                        combinedText += textContent.items.map(item => ('str' in item ? item.str : '')).join(' ') + '\n\n';
                        
                        const viewport = page.getViewport({ scale: 1.5 });
                        const canvas = document.createElement('canvas');
                        const context = canvas.getContext('2d');
                        canvas.height = viewport.height;
                        canvas.width = viewport.width;

                        if (context) {
                            await page.render({ canvasContext: context, viewport: viewport }).promise;
                            pageImages.push(canvas.toDataURL('image/jpeg', 0.85));
                        }
                        setStatusMessage(`Processing PDF: ${i}/${pdf.numPages} pages...`);
                    }
                    await generateStrategyFromKnowledgeSource({ text: combinedText, images: pageImages, sourceName: file.name });
                    return;
                }

                if (file.type === 'text/plain') {
                    const textContent = await file.text();
                    await generateStrategyFromKnowledgeSource({ text: textContent, sourceName: file.name });
                    return;
                }
                
                throw new Error("Unsupported file type. Please upload a PDF, TXT, JPG, or PNG file.");

            } catch (error) {
                setStatus('error');
                const message = error instanceof Error ? error.message : "An unknown error occurred while processing the file.";
                setStatusMessage(message);
            } finally {
                if (fileInputRef.current) fileInputRef.current.value = '';
            }
        }, 0);
    };
    
    const handlePasteSubmit = () => {
        if (!pastedText.trim()) return;
        setStatus('summarizing');
        setStatusMessage('Analyzing pasted text...');
        setTimeout(async () => {
            try {
                await generateStrategyFromKnowledgeSource({ text: pastedText, sourceName: "pasted text" });
            } catch (error) {
                setStatus('error');
                const message = error instanceof Error ? error.message : "An unknown error occurred while analyzing the text.";
                setStatusMessage(message);
            }
        }, 0);
    };

    const handleToggleStrategy = (key: StrategyKey) => {
        setStrategyLogicData(prev => ({
            ...prev,
            [key]: { ...prev[key], isEnabled: !prev[key].isEnabled }
        }));
    };
    
    const handleConfirmDelete = () => {
        if (!strategyToDelete) return;
        setStrategyLogicData(prev => {
            const newState = { ...prev };
            // Also delete children if a parent is deleted
            Object.keys(newState).forEach(key => {
                if (newState[key].parentId === strategyToDelete) {
                    delete newState[key];
                }
            });
            delete newState[strategyToDelete];
            return newState;
        });
        if (selectedCustomStrategyForEditing === strategyToDelete) {
            setSelectedCustomStrategyForEditing(null); // Close editor if deleted
        }
        if (viewedCustomStrategy === strategyToDelete) {
            setViewedCustomStrategy(null);
        }
        setStrategyToDelete(null);
    };

    const handleVoiceSelectionChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
        const newVoiceName = e.target.value;
        const voiceOption = TTS_VOICE_OPTIONS.find(v => v.name === newVoiceName);
        if (!voiceOption) return;

        if (voiceOption.cost > EXOTIC_VOICE_COST_THRESHOLD) {
            setVoiceToConfirm({ name: voiceOption.name, cost: voiceOption.cost });
        } else {
            onUserSettingsChange('ttsVoice', newVoiceName);
        }
    };

    const handleConfirmExoticVoice = () => {
        if (!BETA_ACCESS_KEYS.includes(masterKeyInput)) {
            setMasterKeyError('Incorrect Beta Access Key.');
            return;
        }

        if (voiceToConfirm) {
            onUserSettingsChange('ttsVoice', voiceToConfirm.name);
        }
        
        setVoiceToConfirm(null);
        setMasterKeyInput('');
        setMasterKeyError('');
    };

    const handleCancelExoticVoice = () => {
        setVoiceToConfirm(null);
        setMasterKeyInput('');
        setMasterKeyError('');
    };

    const playVoiceSample = async (voiceName: string) => {
        if (voiceSampleStatus === 'loading' || voiceSampleStatus === 'playing') return;

        setVoiceSampleStatus('loading');
        try {
            const audioContent = await synthesizeSpeech(
              "This is a sample of my voice.", 
              apiConfig.geminiApiKey, 
              voiceName
            );
            
            if (!sampleAudioRef.current) {
                sampleAudioRef.current = new Audio();
                sampleAudioRef.current.onended = () => setVoiceSampleStatus('idle');
                sampleAudioRef.current.onerror = () => setVoiceSampleStatus('error');
            }
            
            sampleAudioRef.current.src = `data:audio/mp3;base64,${audioContent}`;
            await sampleAudioRef.current.play();
            setVoiceSampleStatus('playing');

        } catch (error) {
            console.error('Voice sample failed:', error);
            setVoiceSampleStatus('error');
            setTimeout(() => setVoiceSampleStatus('idle'), 2000);
        }
    };

    const handleExportData = async () => {
        try {
            // 1. Get localStorage data
            const localStorageData: Record<string, any> = {};
            ALL_PERSISTENT_STORAGE_KEYS.forEach(key => {
                const item = localStorage.getItem(key);
                if (item) {
                    try {
                        localStorageData[key] = JSON.parse(item);
                    } catch (e) {
                         console.error(`Could not parse localStorage item ${key}:`, e);
                    }
                }
            });
            
            // 2. Get IndexedDB data
            const imageStoreEntries = await getAllEntries();
            const imageStoreData: Record<string, string> = {};
            imageStoreEntries.forEach(([key, value]) => {
                if (typeof key === 'string') {
                    imageStoreData[key] = value;
                }
            });
    
            // 3. Combine into a single export object
            const fullExportData = {
                localStorage: localStorageData,
                imageStore: imageStoreData,
            };
    
            const dataStr = JSON.stringify(fullExportData, null, 2);
            
            // 4. Create a zip file
            const zip = new JSZip();
            zip.file("chart-oracle-backup.json", dataStr);
            
            const blob = await zip.generateAsync({ type: "blob" });
    
            // 5. Trigger download
            const url = URL.createObjectURL(blob);
            const link = document.createElement('a');
            link.href = url;
            const timestamp = new Date().toISOString().split('T')[0];
            link.download = `chart-oracle-backup-${timestamp}.zip`;
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
            URL.revokeObjectURL(url);
        } catch(error) {
            alert(`Failed to export data: ${error instanceof Error ? error.message : "Unknown error"}`);
        }
    };

    const handleImportFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
        const file = event.target.files?.[0];
        if (file) {
            setFileToImport(file);
            setIsImportModalOpen(true);
        }
    };
    
    const handleConfirmImport = () => {
        if (!fileToImport) return;
        setIsImporting(true);
        const reader = new FileReader();
    
        reader.onload = async (e) => {
            try {
                const buffer = e.target?.result as ArrayBuffer;
                if (!buffer) throw new Error('Could not read file buffer.');
    
                let jsonText: string;
    
                // Check if it's a ZIP file by inspecting the first few bytes (PK signature)
                const view = new Uint8Array(buffer, 0, 4);
                if (view.length >= 2 && view[0] === 0x50 && view[1] === 0x4B) {
                    // It's a ZIP file
                    const zip = await JSZip.loadAsync(buffer);
                    // Find the first .json file in the zip archive.
                    const jsonFile = Object.values(zip.files).find(file => (file as any).name.endsWith('.json'));
    
                    if (!jsonFile) {
                        throw new Error("No '.json' backup file found inside the ZIP archive.");
                    }
                    
                    jsonText = await (jsonFile as any).async('string');
                } else {
                    // Assume it's a JSON file
                    jsonText = new TextDecoder().decode(buffer);
                }
    
                const data = JSON.parse(jsonText);
                onRestoreData(data); // This will cause a reload
                
            } catch (error) {
                console.error("Error importing data:", error);
                const errorMessage = error instanceof Error ? error.message : "The file is not a valid backup file.";
                alert(`Failed to import data: ${errorMessage}`);
                setIsImporting(false);
                setIsImportModalOpen(false);
                if (importFileRef.current) importFileRef.current.value = '';
            }
        };
        reader.onerror = () => {
            setIsImporting(false);
            alert("Failed to read the selected file.");
        };
        
        reader.readAsArrayBuffer(fileToImport);
    };

    const { parentCustomStrategies, childStrategiesMap } = useMemo(() => {
        const allCustom = Object.entries(strategyLogicData);
        const parents: [StrategyKey, StrategyLogicData][] = [];
        const childrenMap: Record<StrategyKey, [StrategyKey, StrategyLogicData][]> = {};

        allCustom.forEach(([key, data]) => {
            if (data.parentId && strategyLogicData[data.parentId]) {
                if (!childrenMap[data.parentId]) {
                    childrenMap[data.parentId] = [];
                }
                childrenMap[data.parentId].push([key, data]);
            } else {
                parents.push([key, data]);
            }
        });
        return { parentCustomStrategies: parents, childStrategiesMap: childrenMap };
    }, [strategyLogicData]);

    const handleToggleExpand = (key: StrategyKey) => {
        setExpandedStrategies(prev => ({ ...prev, [key]: !prev[key] }));
    };
    
    const handleSaveGeminiKey = () => {
        setApiConfig(prev => ({ ...prev, geminiApiKey: geminiApiKeyInput }));
        setIsEditingGeminiKey(false);
    };

    const handleSaveOpenaiKey = () => {
        setApiConfig(prev => ({ ...prev, openaiApiKey: openaiApiKeyInput }));
        setIsEditingOpenaiKey(false);
    };

    const handleSaveEodhdKey = () => {
        setApiConfig(prev => ({ ...prev, eodhdApiKey: eodhdApiKeyInput }));
        setIsEditingEodhdKey(false);
    };

    const maskApiKey = (key: string) => {
        if (!key) return '';
        if (key.length <= 8) return '****';
        return `${key.slice(0, 4)}...${key.slice(-4)}`;
    };

    const renderStrategyItem = (key: StrategyKey, data: StrategyLogicData, isChild = false) => {
        const children = childStrategiesMap[key];
        const isExpanded = !!expandedStrategies[key];

        return (
            <div key={key} className={`bg-gray-900/50 rounded-md ${isChild ? 'ml-6 border-l-2 border-gray-700' : ''}`}>
                 <div className={`flex items-center justify-between p-2 rounded-md transition-colors ${selectedCustomStrategyForEditing === key || viewedCustomStrategy === key ? 'bg-gray-600' : ''}`}>
                    <div className="flex items-center gap-2 flex-grow min-w-0">
                        {children && (
                             <button onClick={() => handleToggleExpand(key)} className="p-1 text-gray-400 hover:text-white">
                                <ChevronDownIcon className={`w-5 h-5 transition-transform duration-200 ${isExpanded ? 'rotate-180' : ''}`} />
                            </button>
                        )}
                         <button
                            type="button"
                            role="switch"
                            aria-checked={data.isEnabled}
                            onClick={() => handleToggleStrategy(key)}
                            className={`relative inline-flex h-6 w-11 flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none focus:ring-2 focus:ring-yellow-500 focus:ring-offset-2 focus:ring-offset-gray-800 ${data.isEnabled ? 'bg-green-500' : 'bg-gray-600'}`}
                        >
                            <span aria-hidden="true" className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${data.isEnabled ? 'translate-x-5' : 'translate-x-0'}`} />
                        </button>
                        <div className='truncate'>
                            <p className="text-sm text-gray-200 truncate font-semibold">{data.name}</p>
                            {data.creationTokenCost && data.creationTokenCost > 0 && <p className="text-xs text-gray-500">Creation Cost: {data.creationTokenCost.toLocaleString()} tokens</p>}
                        </div>
                    </div>
                    <div className="flex items-center gap-1 flex-shrink-0">
                        <button onClick={() => { setViewedCustomStrategy(key); setSelectedCustomStrategyForEditing(null); }} className="p-1.5 text-green-400 hover:text-green-300 rounded-full hover:bg-gray-700" title="View Details"><ViewIcon className="w-4 h-4" /></button>
                        <button onClick={() => { setSelectedCustomStrategyForEditing(key); setViewedCustomStrategy(null); }} className="p-1.5 text-blue-400 hover:text-blue-300 rounded-full hover:bg-gray-700" title="Edit Strategy"><EditIcon className="w-4 h-4" /></button>
                        <button onClick={() => setStrategyToDelete(key)} className="p-1.5 text-red-400 hover:text-red-300 rounded-full hover:bg-gray-700" title="Delete Strategy"><TrashIcon className="w-4 h-4" /></button>
                    </div>
                </div>
                {children && (
                     <div className={`grid transition-all duration-300 ease-in-out ${isExpanded ? 'grid-rows-[1fr]' : 'grid-rows-[0fr]'}`}>
                        <div className="overflow-hidden">
                             <div className="pt-1 pb-2 pr-2 space-y-1">
                                {children.map(([childKey, childData]) => renderStrategyItem(childKey, childData, true))}
                             </div>
                        </div>
                    </div>
                )}
            </div>
        );
    };

    const hasGeminiApiKey = !!apiConfig.geminiApiKey;

    const handleCancelModal = () => {
        setIsAddSourceModalOpen(false);
        setPastedText('');
        if (fileInputRef.current) {
            fileInputRef.current.value = '';
        }
        // Only reset status if it's not idle, to avoid flicker
        if (status !== 'idle') {
            // Add a small delay to allow the modal to fade out before content reset
            setTimeout(() => {
                setStatus('idle');
                setStatusMessage('');
            }, 300);
        }
    };

    const handleFetchDataClick = async () => {
        if (isFetchingData) return;

        setFetchStatusMessage('');
        const isDemoTicker = DEMO_TICKERS.includes(dataSymbol.toUpperCase());
        if (isDemoTicker) {
            setFetchStatusMessage("Info: Using 'demo' key for this ticker. API calls will not be deducted.");
        }

        const isIntraday = ['1m', '5m', '15m', '30m', '1h', '4h'].includes(dataTimeframe);
        if (isIntraday) {
            const fromDate = new Date(dataFrom);
            const toDate = new Date(dataTo);
            const diffTime = Math.abs(toDate.getTime() - fromDate.getTime());
            const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

            if (diffDays > 100) {
                setFetchStatusMessage('Error: Date range for intraday data cannot exceed 100 days.');
                return;
            }
        }

        setIsFetchingData(true);
        if (!isDemoTicker) {
            setFetchStatusMessage('Fetching data...');
        }
        try {
            const { count, key } = await onFetchAndLoadData(dataSymbol, dataTimeframe, dataFrom, dataTo);
            setFetchStatusMessage(`Success! Loaded ${count.toLocaleString()} candles for ${key}.`);
        } catch (error) {
            setFetchStatusMessage(`Error: ${error instanceof Error ? error.message : 'Unknown error'}`);
        } finally {
            setIsFetchingData(false);
        }
    };

    const handleSymbolChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const value = e.target.value.toUpperCase();
        setDataSymbol(value);
        if (value) {
            setSymbolSuggestions(
                EODHD_SYMBOLS.filter(pair => pair.startsWith(value))
            );
            if (!isSymbolDropdownVisible) setIsSymbolDropdownVisible(true);
        } else {
            setSymbolSuggestions([]);
            setIsSymbolDropdownVisible(false);
        }
    };

    const handleSuggestionClick = (suggestion: string) => {
        setDataSymbol(suggestion);
        setIsSymbolDropdownVisible(false);
    };

    return (
        <div className="p-4 md:p-6 space-y-8 mx-auto">
            <input type="file" id="strategy-file-upload" ref={fileInputRef} onChange={handleFileUpload} accept="application/pdf,text/plain,image/*" className="hidden" />
            <input type="file" accept=".json,.zip" ref={importFileRef} onChange={handleImportFileSelect} className="hidden" />

            <div className="text-center">
                <h2 className="text-3xl font-bold text-white">Master Controls</h2>
                <p className="text-gray-400 mt-1">Fine-tune the Oracle's logic and provide it with custom knowledge.</p>
            </div>
            
            {/* API Key Management */}
            <div className="bg-gray-800 rounded-lg p-6 border-2 border-yellow-500 space-y-6">
                <div>
                    <h3 className="text-xl font-bold text-yellow-400 mb-2">BYOA: Bring Your Own API Key</h3>
                    <p className="text-sm text-gray-400">
                        This platform requires a personal AI API key. You can use either Google Gemini or OpenAI. If you provide keys for both, you can select the active provider below.
                    </p>
                </div>

                {/* Gemini API Key */}
                <div className="space-y-2">
                    <label htmlFor="gemini-key-input" className="text-sm font-bold text-yellow-300">Google Gemini API Key</label>
                    <p className="text-xs text-gray-400">Get a key from <a href="https://aistudio.google.com/app/apikey" target="_blank" rel="noopener noreferrer" className="text-blue-400 underline">Google AI Studio</a>.</p>
                    {isEditingGeminiKey || !apiConfig.geminiApiKey ? (
                        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2">
                            <input id="gemini-key-input" type="password" value={geminiApiKeyInput} onChange={e => setGeminiApiKeyInput(e.target.value)} placeholder="Paste your Gemini key here" className="flex-grow bg-gray-700 p-2 rounded-md text-sm text-white border border-gray-600 focus:ring-yellow-500 focus:border-yellow-500"/>
                            <div className="flex gap-2">
                                {apiConfig.geminiApiKey && <button onClick={() => {setGeminiApiKeyInput(apiConfig.geminiApiKey || ''); setIsEditingGeminiKey(false);}} className="font-semibold py-2 px-4 rounded-md bg-gray-600 hover:bg-gray-500 text-white">Cancel</button>}
                                <button onClick={handleSaveGeminiKey} disabled={!geminiApiKeyInput} className="font-semibold py-2 px-4 rounded-md bg-green-600 hover:bg-green-500 text-white disabled:bg-gray-500 disabled:cursor-not-allowed">Save Key</button>
                            </div>
                        </div>
                    ) : (
                        <div className="flex items-center justify-between bg-gray-900/50 p-3 rounded-md border border-gray-700">
                            <div className="flex items-center gap-3">
                                <KeyIcon className="w-5 h-5 text-green-400"/>
                                <p className="font-mono text-white">{maskApiKey(apiConfig.geminiApiKey)}</p>
                            </div>
                            <button onClick={() => setIsEditingGeminiKey(true)} className="font-semibold py-2 px-4 rounded-md bg-blue-600 hover:bg-blue-500 text-white">Change Key</button>
                        </div>
                    )}
                </div>

                {/* OpenAI API Key */}
                <div className="space-y-2 pt-4 border-t border-gray-700/50">
                    <label htmlFor="openai-key-input" className="text-sm font-bold text-blue-300">OpenAI API Key</label>
                    <p className="text-xs text-gray-400">
                        Powers all features using ChatGPT models. Get a key from <a href="https://platform.openai.com/api-keys" target="_blank" rel="noopener noreferrer" className="text-blue-400 underline">OpenAI Platform</a>.
                    </p>
                    {isEditingOpenaiKey || !apiConfig.openaiApiKey ? (
                        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2">
                            <input id="openai-key-input" type="password" value={openaiApiKeyInput} onChange={e => setOpenaiApiKeyInput(e.target.value)} placeholder="Paste your OpenAI key here" className="flex-grow bg-gray-700 p-2 rounded-md text-sm text-white border border-gray-600 focus:ring-blue-500 focus:border-blue-500"/>
                            <div className="flex gap-2">
                                {apiConfig.openaiApiKey && <button onClick={() => {setOpenaiApiKeyInput(apiConfig.openaiApiKey || ''); setIsEditingOpenaiKey(false);}} className="font-semibold py-2 px-4 rounded-md bg-gray-600 hover:bg-gray-500 text-white">Cancel</button>}
                                <button onClick={handleSaveOpenaiKey} disabled={!openaiApiKeyInput} className="font-semibold py-2 px-4 rounded-md bg-green-600 hover:bg-green-500 text-white disabled:bg-gray-500 disabled:cursor-not-allowed">Save Key</button>
                            </div>
                        </div>
                    ) : (
                        <div className="flex items-center justify-between bg-gray-900/50 p-3 rounded-md border border-gray-700">
                            <div className="flex items-center gap-3">
                                <KeyIcon className="w-5 h-5 text-green-400"/>
                                <p className="font-mono text-white">{maskApiKey(apiConfig.openaiApiKey)}</p>
                            </div>
                            <button onClick={() => setIsEditingOpenaiKey(true)} className="font-semibold py-2 px-4 rounded-md bg-blue-600 hover:bg-blue-500 text-white">Change Key</button>
                        </div>
                    )}
                </div>

                {apiConfig.geminiApiKey && apiConfig.openaiApiKey && (
                    <div className="pt-6 border-t border-gray-700/50">
                        <h3 className="text-lg font-bold text-white mb-2 text-center">Select Active AI Provider</h3>
                        <p className="text-sm text-gray-400 mb-4 text-center">You've provided keys for both providers. Choose which one to use for all AI features.</p>
                        <div className="flex items-center justify-center p-1 rounded-lg bg-gray-900/50 w-fit mx-auto border border-gray-700">
                            <button 
                                onClick={() => onUserSettingsChange('aiProvider', 'gemini')}
                                className={`px-4 py-2 text-sm font-semibold rounded-md transition-colors ${userSettings.aiProvider === 'gemini' ? 'bg-yellow-500 text-gray-900' : 'text-gray-300 hover:bg-gray-700/50'}`}
                            >
                                Google Gemini
                            </button>
                            <button
                                onClick={() => onUserSettingsChange('aiProvider', 'openai')}
                                className={`px-4 py-2 text-sm font-semibold rounded-md transition-colors ${userSettings.aiProvider === 'openai' ? 'bg-blue-500 text-white' : 'text-gray-300 hover:bg-gray-700/50'}`}
                            >
                                OpenAI ChatGPT
                            </button>
                        </div>
                    </div>
                )}

                 {/* Live Data Feed Configuration */}
                 <div className="pt-6 border-t border-gray-700/50">
                    <h3 className="text-xl font-bold text-teal-400 mb-2">EODHD Live Data API Key</h3>
                    <p className="text-sm text-gray-400 mb-4">
                        (Optional) Enter an API key from EODHD to enable the Market Data Memory Bank.
                    </p>
                     {isEditingEodhdKey || !apiConfig.eodhdApiKey ? (
                        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2">
                            <DataFeedIcon className="w-5 h-5 text-gray-400 hidden sm:block"/>
                            <input
                                type="password"
                                value={eodhdApiKeyInput}
                                onChange={e => setEodhdApiKeyInput(e.target.value)}
                                placeholder="Enter your Live Data API Key (e.g., EODHD)"
                                className="flex-grow bg-gray-700 p-2 rounded-md text-sm text-white border border-gray-600 focus:ring-teal-500 focus:border-teal-500"
                            />
                            <div className="flex gap-2">
                                {apiConfig.eodhdApiKey && <button onClick={() => {setEodhdApiKeyInput(apiConfig.eodhdApiKey || ''); setIsEditingEodhdKey(false);}} className="font-semibold py-2 px-4 rounded-md bg-gray-600 hover:bg-gray-500 text-white">Cancel</button>}
                                <button onClick={handleSaveEodhdKey} disabled={!eodhdApiKeyInput} className="font-semibold py-2 px-4 rounded-md bg-green-600 hover:bg-green-500 text-white disabled:bg-gray-500 disabled:cursor-not-allowed">Save Key</button>
                            </div>
                        </div>
                    ) : (
                        <div className="flex items-center justify-between bg-gray-900/50 p-3 rounded-md border border-gray-700">
                            <div className="flex items-center gap-3">
                                <DataFeedIcon className="w-5 h-5 text-green-400"/>
                                <div>
                                    <p className="text-sm text-gray-400">Current Live Data API Key</p>
                                    <p className="font-mono text-white">{maskApiKey(apiConfig.eodhdApiKey)}</p>
                                </div>
                            </div>
                            <button onClick={() => setIsEditingEodhdKey(true)} className="font-semibold py-2 px-4 rounded-md bg-blue-600 hover:bg-blue-500 text-white">
                                Change Key
                            </button>
                        </div>
                    )}
                </div>
            </div>

            {/* Knowledge Base / Strategy Creator */}
             <div className="bg-gray-800 rounded-lg p-6 border border-gray-700">
                <div>
                    <h3 className="text-xl font-bold text-yellow-400 mb-2">Knowledge Base Manager</h3>
                    <p className="text-sm text-gray-400 mb-4 md:mb-0">Add new custom strategies by uploading a document (PDF, TXT) or an image (JPG, PNG) containing its rules. The AI will analyze it and create new, usable strategies.</p>
                </div>
                
                <button
                    onClick={() => setIsAddSourceModalOpen(true)}
                    disabled={!hasGeminiApiKey}
                    title={!hasGeminiApiKey ? "Set your API key to enable this feature" : ""}
                    className="w-full mt-4 font-bold py-3 px-4 rounded-lg transition-colors bg-teal-600 hover:bg-teal-500 text-white flex items-center justify-center gap-2 disabled:bg-gray-600 disabled:cursor-not-allowed"
                >
                   <PlusIcon className="h-5 w-5"/> Add New Strategy via Knowledge
                </button>
            </div>
            
            <div className={`bg-gray-800 rounded-lg p-6 border border-gray-700 transition-all duration-300`}>
                <button
                    onClick={() => setIsMarketDataBankOpen(prev => !prev)}
                    className="w-full flex justify-between items-start text-left"
                    aria-expanded={isMarketDataBankOpen}
                    aria-controls="market-data-bank-content"
                >
                    <div className="flex-grow">
                        <h3 className="text-xl font-bold text-yellow-400 mb-2">Market Data Memory Bank</h3>
                        <p className="text-sm text-gray-400 max-w-prose">
                            Fetch and permanently store historical market data for the Oracle to use in its analysis. This data will persist until you remove it.
                        </p>
                    </div>
                    <ChevronDownIcon className={`w-6 h-6 text-gray-400 transition-transform duration-300 flex-shrink-0 ml-4 ${isMarketDataBankOpen ? 'rotate-180' : ''}`} />
                </button>

                <div
                    id="market-data-bank-content"
                    className={`transition-all duration-500 ease-in-out overflow-hidden ${isMarketDataBankOpen ? 'max-h-[1000px] mt-6 pt-6 border-t border-gray-700/50' : 'max-h-0'}`}
                >
                    <div className="mb-4">
                        <ApiUsageTracker usage={eodhdUsage} onRefresh={onFetchEodhdUsage} />
                    </div>
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                        {/* Controls */}
                        <div className="space-y-4 bg-gray-900/50 p-4 rounded-lg">
                            <h4 className="font-semibold text-gray-200">Fetch New Data</h4>
                             <div className="relative">
                                <label className="text-xs font-medium text-gray-400">Asset Symbol (e.g., EURUSD.FOREX, BTC-USD.CC)</label>
                                <input 
                                    type="text" 
                                    value={dataSymbol} 
                                    onChange={handleSymbolChange}
                                    onFocus={() => setIsSymbolDropdownVisible(true)}
                                    onBlur={() => setTimeout(() => setIsSymbolDropdownVisible(false), 200)}
                                    className="mt-1 w-full bg-gray-700 p-2 rounded-md text-sm border border-gray-600" 
                                />
                                {isSymbolDropdownVisible && symbolSuggestions.length > 0 && (
                                    <div className="absolute z-10 w-full bg-gray-600 border border-gray-500 rounded-md mt-1 max-h-40 overflow-y-auto">
                                        {symbolSuggestions.map(suggestion => (
                                            <div 
                                                key={suggestion} 
                                                onMouseDown={() => handleSuggestionClick(suggestion)}
                                                className="p-2 text-sm text-white hover:bg-gray-500 cursor-pointer"
                                            >
                                                {suggestion}
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </div>
                            <div>
                                 <label className="text-xs font-medium text-gray-400">Timeframe</label>
                                 <select value={dataTimeframe} onChange={e => setDataTimeframe(e.target.value)} className="mt-1 w-full bg-gray-700 p-2 rounded-md text-base border border-gray-600">
                                    <option>1m</option>
                                    <option>5m</option>
                                    <option>15m</option>
                                    <option>30m</option>
                                    <option>1h</option>
                                    <option>4h</option>
                                    <option>Daily</option>
                                    <option>Weekly</option>
                                 </select>
                            </div>
                            <div className="grid grid-cols-2 gap-2">
                                 <div>
                                    <label className="text-xs font-medium text-gray-400">From</label>
                                    <input type="date" value={dataFrom} onChange={e => setDataFrom(e.target.value)} className="mt-1 w-full bg-gray-700 p-2 rounded-md text-sm border border-gray-600" />
                                </div>
                                 <div>
                                    <label className="text-xs font-medium text-gray-400">To</label>
                                    <input type="date" value={dataTo} onChange={e => setDataTo(e.target.value)} className="mt-1 w-full bg-gray-700 p-2 rounded-md text-sm border border-gray-600" />
                                </div>
                            </div>
                            <button onClick={handleFetchDataClick} disabled={isFetchingData || !apiConfig.eodhdApiKey} className="w-full flex items-center justify-center font-semibold py-2 px-4 rounded-md bg-green-600 hover:bg-green-500 text-white disabled:bg-gray-500 disabled:cursor-not-allowed">
                                {isFetchingData ? <LoadingIcon className="w-5 h-5 mr-2" /> : <MemoryBankIcon className="w-5 h-5 mr-2" />}
                                Fetch & Load to Memory
                            </button>
                             {fetchStatusMessage && <p className={`text-xs text-center h-4 ${fetchStatusMessage.startsWith('Error') ? 'text-red-400' : 'text-yellow-300'}`}>{fetchStatusMessage}</p>}
                        </div>
                        {/* Cache List */}
                         <div className="space-y-2">
                            <h4 className="font-semibold text-gray-200">Cached Data</h4>
                             <div className="space-y-2 max-h-64 overflow-y-auto pr-2 bg-gray-900/30 p-2 rounded-lg">
                                 {Object.keys(marketDataCache).length > 0 ? (
                                    Object.entries(marketDataCache).map(([key, data]) => (
                                        <div key={key} className="bg-gray-700/50 p-2 rounded-md flex justify-between items-center">
                                            <div>
                                                <p className="text-sm font-semibold text-white">{key}</p>
                                                <p className="text-xs text-gray-400">{data.length.toLocaleString()} candles</p>
                                            </div>
                                            <div className="flex items-center gap-1">
                                                <button onClick={() => setViewingChartData({ title: key, data })} className="p-1.5 text-blue-400 hover:text-blue-300 rounded-full hover:bg-gray-600" title="View Chart">
                                                    <ChartIcon className="w-4 h-4" />
                                                </button>
                                                <button onClick={() => onRemoveMarketData(key)} className="p-1.5 text-red-400 hover:text-red-300 rounded-full hover:bg-gray-600" title="Remove from Memory">
                                                    <TrashIcon className="w-4 h-4"/>
                                                </button>
                                            </div>
                                        </div>
                                    ))
                                 ) : (
                                    <p className="text-sm text-gray-500 text-center py-8">No market data cached yet.</p>
                                 )}
                             </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* Strategy Editor / Viewer */}
            <div className="bg-gray-800 rounded-lg p-6 border border-gray-700">
                <h3 className="text-xl font-bold text-yellow-400 mb-4">Custom Strategy Library</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-2">
                        {parentCustomStrategies.length > 0 ? parentCustomStrategies.map(([key, data]) => renderStrategyItem(key, data)) : <p className="text-sm text-gray-500 text-center py-8">No custom strategies yet.</p>}
                    </div>
                    
                    <div className="sticky top-28 h-fit">
                        {selectedCustomStrategyForEditing && (
                             <div className="bg-gray-900/50 p-4 rounded-lg border border-blue-500/50 space-y-3">
                                <h4 className="font-bold text-blue-300">Editing: {strategyLogicData[selectedCustomStrategyForEditing].name}</h4>
                                <div><label className="text-xs font-medium text-gray-400">Strategy Name</label><input type="text" value={editedName} onChange={e => setEditedName(e.target.value)} className="mt-1 w-full bg-gray-700 p-2 rounded-md text-sm" /></div>
                                <div><label className="text-xs font-medium text-gray-400">Description</label><textarea value={editedDescription} onChange={e => setEditedDescription(e.target.value)} rows={3} className="mt-1 w-full bg-gray-700 p-2 rounded-md text-sm" /></div>
                                <div><label className="text-xs font-medium text-gray-400">Core AI Logic</label><textarea value={editedPrompt} onChange={e => setEditedPrompt(e.target.value)} rows={8} className="mt-1 w-full bg-gray-700 p-2 rounded-md text-sm font-mono" /></div>
                                <div className="flex gap-2 justify-end">
                                    <button onClick={() => setSelectedCustomStrategyForEditing(null)} className="font-semibold py-2 px-4 rounded-md bg-gray-600 hover:bg-gray-500 text-white">Cancel</button>
                                    <button onClick={handleSaveEditedStrategy} className="font-semibold py-2 px-4 rounded-md bg-green-600 hover:bg-green-500 text-white">Save Changes</button>
                                </div>
                             </div>
                        )}
                         {viewedCustomStrategy && strategyLogicData[viewedCustomStrategy] && (
                             <div className="bg-gray-900/50 p-4 rounded-lg border border-green-500/50">
                                <h4 className="font-bold text-green-300">{strategyLogicData[viewedCustomStrategy].name}</h4>
                                <p className="text-sm text-gray-300 my-2">{strategyLogicData[viewedCustomStrategy].description}</p>
                                 <button onClick={() => setIsPromptVisible(p => !p)} className="text-sm font-semibold text-purple-300 hover:text-purple-200 w-full text-left flex items-center justify-between">
                                    <span>View Core AI Logic</span>
                                    <ChevronDownIcon className={`w-5 h-5 transition-transform ${isPromptVisible ? 'rotate-180' : ''}`} />
                                </button>
                                {isPromptVisible && (
                                     <pre className="mt-2 bg-gray-900/70 p-3 rounded-md text-xs text-gray-300 whitespace-pre-wrap font-mono border border-gray-700/50 max-h-96 overflow-y-auto">
                                        {strategyLogicData[viewedCustomStrategy].prompt}
                                    </pre>
                                )}
                             </div>
                        )}
                    </div>
                </div>
            </div>
            
            <div className="bg-gray-800 rounded-lg p-6 border border-gray-700">
                <h3 className="text-xl font-bold text-yellow-400 mb-4">Appearance</h3>
                <p className="text-sm text-gray-400 mb-6">Adjust the visual theme and font sizes across the entire platform.</p>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                        <label htmlFor="uiFontSize" className="block text-sm font-medium text-gray-300 mb-1">General UI ({userSettings.uiFontSize}px)</label>
                        <input
                            type="range"
                            id="uiFontSize"
                            name="uiFontSize"
                            value={userSettings.uiFontSize}
                            onChange={handleAppearanceInputChange}
                            min="12"
                            max="18"
                            step="1"
                            className="w-full h-2 bg-[var(--color-border-secondary)] rounded-lg appearance-none cursor-pointer accent-yellow-500"
                        />
                        <p className="text-xs text-gray-500 mt-1">Labels, descriptions, and body text.</p>
                    </div>
                    <div>
                        <label htmlFor="headingFontSize" className="block text-sm font-medium text-gray-300 mb-1">Headings ({userSettings.headingFontSize}px)</label>
                        <input
                            type="range"
                            id="headingFontSize"
                            name="headingFontSize"
                            value={userSettings.headingFontSize}
                            onChange={handleAppearanceInputChange}
                            min="16"
                            max="24"
                            step="1"
                            className="w-full h-2 bg-[var(--color-border-secondary)] rounded-lg appearance-none cursor-pointer accent-yellow-500"
                        />
                        <p className="text-xs text-gray-500 mt-1">Section and card titles.</p>
                    </div>
                    <div>
                        <label htmlFor="dataFontSize" className="block text-sm font-medium text-gray-300 mb-1">Data &amp; Prices ({userSettings.dataFontSize}px)</label>
                        <input
                            type="range"
                            id="dataFontSize"
                            name="dataFontSize"
                            value={userSettings.dataFontSize}
                            onChange={handleAppearanceInputChange}
                            min="14"
                            max="22"
                            step="1"
                            className="w-full h-2 bg-[var(--color-border-secondary)] rounded-lg appearance-none cursor-pointer accent-yellow-500"
                        />
                        <p className="text-xs text-gray-500 mt-1">Numerical data like trade entries and stops.</p>
                    </div>
                    <div>
                        <label htmlFor="chatFontSize" className="block text-sm font-medium text-gray-300 mb-1">Chat Text ({userSettings.chatFontSize}px)</label>
                        <input
                            type="range"
                            id="chatFontSize"
                            name="chatFontSize"
                            value={userSettings.chatFontSize}
                            onChange={handleAppearanceInputChange}
                            min="12"
                            max="18"
                            step="1"
                            className="w-full h-2 bg-[var(--color-border-secondary)] rounded-lg appearance-none cursor-pointer accent-yellow-500"
                        />
                        <p className="text-xs text-gray-500 mt-1">Text size in chats and explanations.</p>
                    </div>
                    <div className="md:col-span-2">
                        <label htmlFor="darknessLevel" className="block text-sm font-medium text-gray-300 mb-1">UI Darkness ({userSettings.darknessLevel})</label>
                        <input
                            type="range"
                            id="darknessLevel"
                            name="darknessLevel"
                            value={userSettings.darknessLevel}
                            onChange={handleAppearanceInputChange}
                            min="0"
                            max="10"
                            step="1"
                            className="w-full h-2 bg-[var(--color-border-secondary)] rounded-lg appearance-none cursor-pointer accent-yellow-500"
                        />
                        <p className="text-xs text-gray-500 mt-1">Increases contrast by making dark tones blacker.</p>
                    </div>
                </div>
            </div>
            
            {/* Data Management */}
            <div className="bg-gray-800 rounded-lg p-6 border border-gray-700">
                <div className="flex items-center gap-3 mb-4">
                    <DataManagementIcon className="w-6 h-6 text-yellow-400"/>
                    <h3 className="text-xl font-bold text-yellow-400">Data Management</h3>
                </div>
                <p className="text-sm text-gray-400 mb-4">
                    Backup your entire application state, including all strategies, journal entries, and settings, or restore from a previous backup file.
                </p>
                <div className="flex flex-col sm:flex-row gap-4">
                    <button 
                        onClick={handleExportData}
                        className="flex-1 font-semibold py-2 px-4 rounded-lg bg-blue-600 hover:bg-blue-500 text-white flex items-center justify-center gap-2"
                    >
                         <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-5 h-5"><path d="M10.75 2.75a.75.75 0 0 0-1.5 0v8.614L6.295 8.235a.75.75 0 1 0-1.09 1.03l4.25 4.5a.75.75 0 0 0 1.09 0l4.25-4.5a.75.75 0 0 0-1.09-1.03L10.75 11.364V2.75Z" /><path d="M3.5 12.75a.75.75 0 0 0-1.5 0v2.5A2.75 2.75 0 0 0 4.75 18h10.5A2.75 2.75 0 0 0 18 15.25v-2.5a.75.75 0 0 0-1.5 0v2.5c0 .69-.56 1.25-1.25 1.25H4.75c-.69 0-1.25-.56-1.25-1.25v-2.5Z" /></svg>
                        Backup All Data
                    </button>
                    <button 
                        onClick={() => importFileRef.current?.click()}
                        className="flex-1 font-semibold py-2 px-4 rounded-lg bg-blue-600 hover:bg-blue-500 text-white flex items-center justify-center gap-2"
                    >
                         <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-5 h-5"><path d="M10.75 17.25a.75.75 0 0 0 1.5 0V8.636l2.955 3.129a.75.75 0 1 0 1.09-1.03l-4.25-4.5a.75.75 0 0 0-1.09 0l-4.25 4.5a.75.75 0 1 0 1.09 1.03L9.25 8.636v8.614Z" /><path d="M3.5 12.75a.75.75 0 0 0-1.5 0v2.5A2.75 2.75 0 0 0 4.75 18h10.5A2.75 2.75 0 0 0 18 15.25v-2.5a.75.75 0 0 0-1.5 0v2.5c0 .69-.56 1.25-1.25 1.25H4.75c-.69 0-1.25-.56-1.25-1.25v-2.5Z" /></svg>
                        Restore from Backup
                    </button>
                </div>
            </div>

            {viewingChartData && (
                <InteractiveChartModal 
                    isOpen={true}
                    onClose={() => setViewingChartData(null)}
                    chartData={viewingChartData.data}
                    title={viewingChartData.title}
                />
            )}

            <ConfirmationModal 
                isOpen={!!strategyToDelete}
                onConfirm={handleConfirmDelete}
                onCancel={() => setStrategyToDelete(null)}
                title="Confirm Deletion"
                message={`Are you sure you want to delete "${strategyToDelete ? strategyLogicData[strategyToDelete]?.name : ''}"? This will also delete any of its sub-strategies and cannot be undone.`}
            />
            
            <ConfirmationModal
                isOpen={isImportModalOpen}
                onConfirm={handleConfirmImport}
                onCancel={() => {
                    setIsImportModalOpen(false);
                    if (importFileRef.current) importFileRef.current.value = '';
                }}
                isProcessing={isImporting}
                title="Confirm Restore from Backup"
                message="Restoring from a backup will completely overwrite all your current strategies, journal entries, and settings. This action is irreversible. Are you sure you want to proceed?"
                confirmText="Restore & Overwrite"
                confirmButtonClass="bg-red-600 hover:bg-red-500 focus:ring-red-500 text-white"
            />

            {/* Modal for adding knowledge source */}
             <div className={`fixed inset-0 bg-gray-900/80 flex items-center justify-center z-50 p-4 ${isAddSourceModalOpen ? 'opacity-100' : 'opacity-0 pointer-events-none'} transition-opacity`}>
                 <div className="bg-gray-800 p-6 rounded-lg shadow-xl max-w-lg w-full border border-gray-700 min-h-[300px] flex flex-col justify-center"
                     onClick={e => e.stopPropagation()}
                 >
                     {status === 'summarizing' ? (
                        <div className="text-center">
                            <Logo className="w-16 h-16 mx-auto" isLoading={true} />
                            <p className="mt-4 text-lg text-gray-300 animate-pulse">{statusMessage}</p>
                            <p className="text-sm text-gray-500 mt-2">Please keep this window open. This process can take up to a minute for large documents.</p>
                        </div>
                    ) : status === 'error' ? (
                        <div className="text-center">
                            <h3 className="text-xl font-bold text-red-400 mb-4">Generation Failed</h3>
                            <p className="text-sm text-red-200 mb-4">{statusMessage}</p>
                            <button onClick={handleCancelModal} className="font-semibold py-2 px-4 rounded-md bg-yellow-500 text-gray-900">
                                OK
                            </button>
                        </div>
                    ) : (
                        <div className="w-full">
                            <h3 className="text-xl font-bold text-yellow-400 mb-4">Add New Knowledge Source</h3>
                            <div className="border-b border-gray-600 mb-4">
                                <nav className="-mb-px flex space-x-4" aria-label="Tabs">
                                    <button onClick={() => setAddSourceMode('upload')} className={`whitespace-nowrap py-3 px-1 border-b-2 font-medium text-sm ${addSourceMode === 'upload' ? 'border-yellow-400 text-yellow-300' : 'border-transparent text-gray-400 hover:text-gray-200'}`}>Upload File</button>
                                    <button onClick={() => setAddSourceMode('paste')} className={`whitespace-nowrap py-3 px-1 border-b-2 font-medium text-sm ${addSourceMode === 'paste' ? 'border-yellow-400 text-yellow-300' : 'border-transparent text-gray-400 hover:text-gray-200'}`}>Paste Text</button>
                                </nav>
                            </div>
                            {addSourceMode === 'upload' ? (
                                <div>
                                    <p className="text-sm text-gray-400 mb-4">Select a PDF, TXT, or image file (JPG, PNG) from your device.</p>
                                    <button onClick={() => fileInputRef.current?.click()} className="w-full font-semibold py-2 px-4 rounded-md bg-blue-600 hover:bg-blue-500 text-white">Choose File</button>
                                </div>
                            ) : (
                                <div>
                                    <textarea value={pastedText} onChange={e => setPastedText(e.target.value)} rows={8} className="w-full bg-gray-700 p-2 rounded-md text-sm" placeholder="Paste your strategy text here..."></textarea>
                                    <button onClick={handlePasteSubmit} disabled={!pastedText.trim()} className="w-full mt-2 font-semibold py-2 px-4 rounded-md bg-blue-600 hover:bg-blue-500 text-white disabled:bg-gray-500">Submit Text</button>
                                </div>
                            )}
                            <button onClick={handleCancelModal} className="w-full mt-4 text-sm text-gray-400 hover:text-white">Cancel</button>
                        </div>
                    )}
                 </div>
             </div>
        </div>
    );
};