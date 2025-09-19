import React, { useState, useRef, useEffect, useCallback, useMemo } from 'react';
import { GoogleGenAI, Part, Chat } from "@google/genai";
// FIX: Corrected import paths and removed unused types
import { 
    ChatMessage, UserSettings, StrategyKey, AnalysisResults, UploadedImageKeys, 
    SavedTrade, User, UserCourseProgress,
    SavedCoachingSession, TimeframeCombination,
    ApiConfiguration, MarketDataCache, ChatMessageType, Trade,
    UserUsage,
    ActiveView,
    StrategyLogicData,
    UploadedImageData
} from '../types.ts';
// FIX: Corrected import paths and removed unused constants
import { AVAILABLE_TIMEFRAMES } from '../constants.ts';
import { getImage } from '../idb.ts';
import OracleIcon from './OracleIcon.tsx';
import SpeechSynthesisButton from './SpeechSynthesisButton.tsx';
import TradeCard from './TradeCard.tsx';
import ConfirmationModal from './ConfirmationModal.tsx';
import Logo from './Logo.tsx';
import PermissionModal from './PermissionModal.tsx';

// --- PROPS ---
interface ChatWindowProps {
  isOpen: boolean;
  onClose: () => void;
  messages: ChatMessage[];
  savedTrades: SavedTrade[];
  onAddChatMessage: (message: Omit<ChatMessage, 'id' | 'timestamp'> & { imageData?: UploadedImageData[] }) => Promise<void>;
  onLogTokenUsage: (tokens: number) => void;
  userSettings: UserSettings;
  onApplyChatbotSettingsChange: (settingKey: keyof UserSettings, value: UserSettings[keyof UserSettings]) => void;
  selectedStrategies: StrategyKey[];
  originalAnalysisResults: AnalysisResults | null;
  modifiedAnalysisResults: AnalysisResults | null;
  onApplyTradeModification: (tradeKey: string, modifications: Partial<Omit<Trade, 'isModified'>>) => void;
  uploadedImageKeys: UploadedImageKeys | null;
  userUsage: UserUsage;
  currentUser: User | null;
  currentActiveView: ActiveView;
  dashboardSelectedStrategies: StrategyKey[];
  strategyLogicData: Record<StrategyKey, StrategyLogicData>;
  viewedStrategy: StrategyKey | null;
  chatContextTrade: SavedTrade | null;
  isCoachingSessionActive: boolean;
  setIsCoachingSessionActive: (isActive: boolean) => void;
  isUnrestrictedMode: boolean;
  apiConfig: ApiConfiguration;
  onSaveCoachingSession: (title: string, chatHistory: ChatMessage[], sessionGoal: 'learn_basics' | 'build_setup' | 'compare_assets' | null) => void;
  onSaveChatGeneratedTrade: (trade: Trade, chatHistory: ChatMessage[], coachingStrategyKey: StrategyKey | null) => void;
  onClearChatHistory: () => void;
  savedCoachingSessions: SavedCoachingSession[];
  sessionToContinue: SavedCoachingSession | null;
  onContinueSessionHandled: () => void;
  startCoachingImmediately: boolean;
  onCoachingInitiationHandled: () => void;
  marketDataCache: MarketDataCache;
  userCourseProgress: UserCourseProgress;
  onNavigateToAcademy: (view: ActiveView) => void;
}

// --- ICONS ---
const TrashIcon = (props:{className?:string}) => <svg {...props} xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M8.75 1A2.75 2.75 0 0 0 6 3.75v.443c-.795.077-1.58.22-2.365.468a.75.75 0 1 0 .214 1.482l.025.007c.786.246 1.573.393 2.37.468v6.618A2.75 2.75 0 0 0 8.75 18h2.5A2.75 2.75 0 0 0 14 15.25V5.162c.797-.075 1.585-.222 2.37-.468a.75.75 0 1 0-.214-1.482l-.025-.007a33.58 33.58 0 0 0-2.365-.468V3.75A2.75 2.75 0 0 0 11.25 1h-2.5ZM10 4c.84 0 1.673.025 2.5.075V15.25a1.25 1.25 0 0 1-1.25 1.25h-2.5A1.25 1.25 0 0 1 7.5 15.25V4.075C8.327 4.025 9.16 4 10 4Z" clipRule="evenodd" /></svg>;
const ExpandIcon = (props: { className?: string }) => <svg {...props} xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" d="M3.75 3.75v4.5m0-4.5h4.5m-4.5 0L9 9M20.25 20.25v-4.5m0 4.5h-4.5m4.5 0L15 15m-6 0L3.75 20.25m9-9l6.25-6.25" /></svg>;
const CompressIcon = (props: { className?: string }) => <svg {...props} xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" d="M9 9V4.5M9 9H4.5M9 9L3.75 3.75M9 15v4.5M9 15H4.5M9 15l-5.25 5.25M15 9h4.5M15 9V4.5M15 9l5.25-5.25M15 15h4.5M15 15v4.5M15 15l5.25 5.25" /></svg>;
const SaveIcon = (props: { className?: string }) => <svg {...props} xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor"><path d="M3.75 3.75A1.75 1.75 0 0 0 2 5.5v9A1.75 1.75 0 0 0 3.75 16.25h12.5A1.75 1.75 0 0 0 18 14.5v-7.5a.75.75 0 0 0-1.5 0v7.5a.25.25 0 0 1-.25-.25H3.75a.25.25 0 0 1-.25-.25v-9a.25.25 0 0 1 .25-.25h5a.75.75 0 0 0 0-1.5h-5Z" /><path d="M10.75 3.75a.75.75 0 0 0-1.5 0v3.5h-3.5a.75.75 0 0 0 0 1.5h3.5v3.5a.75.75 0 0 0 1.5 0v-3.5h3.5a.75.75 0 0 0 0-1.5h-3.5v-3.5Z" /><path d="M14.25 2a.75.75 0 0 0-.75.75v2.5a.75.75 0 0 0 1.5 0V2.75A.75.75 0 0 0 14.25 2Z" /></svg>;
const CoachingIcon = (props: { className?: string }) => <svg {...props} xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" d="M17.25 6.75 22.5 12l-5.25 5.25m-10.5 0L1.5 12l5.25-5.25m7.5-3-4.5 16.5" /></svg>;
const MicIcon = (props: {className?: string}) => <svg {...props} xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor"><path d="M7 4a3 3 0 0 1 6 0v6a3 3 0 1 1-6 0V4Z" /><path d="M5.5 4.75a.75.75 0 0 0-1.5 0v.5A5.002 5.002 0 0 0 9 10.25v2.336A2.25 2.25 0 0 1 6.75 15v.25a.75.75 0 0 0 1.5 0v-.25a.75.75 0 0 0-.75-.75h-.357A3.75 3.75 0 0 1 10 11.803v-1.129A5.002 5.002 0 0 0 16 5.25v-.5a.75.75 0 0 0-1.5 0v.5a3.5 3.5 0 0 1-7 0v-.5Z" /></svg>;
const UploadIcon = (props: {className?:string}) => <svg {...props} xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor"><path d="M9.25 13.25a.75.75 0 0 0 1.5 0V4.636l2.955 3.129a.75.75 0 0 0 1.09-1.03l-4.25-4.5a.75.75 0 0 0-1.09 0l-4.25 4.5a.75.75 0 0 0 1.09 1.03L9.25 4.636V13.25Z" /><path d="M3.5 12.75a.75.75 0 0 0-1.5 0v2.5A2.75 2.75 0 0 0 4.75 18h10.5A2.75 2.75 0 0 0 18 15.25v-2.5a.75.75 0 0 0-1.5 0v2.5c0 .69-.56 1.25-1.25 1.25H4.75c-.69 0-1.25-.56-1.25-1.25v-2.5Z" /></svg>;
const ScreenIcon = (props: { className?: string }) => <svg {...props} xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M3.25 3A2.25 2.25 0 0 0 1 5.25v9.5A2.25 2.25 0 0 0 3.25 17h13.5A2.25 2.25 0 0 0 19 14.75v-9.5A2.25 2.25 0 0 0 16.75 3H3.25Zm12.5 11.5H4.25a.75.75 0 0 1-.75-.75V6.25a.75.75 0 0 1 .75-.75h11.5a.75.75 0 0 1 .75 .75v8.5a.75.75 0 0 1-.75-.75Z" clipRule="evenodd" /></svg>;
const PasteIcon = (props: {className?: string}) => <svg {...props} xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M13.25 2.5a2.25 2.25 0 0 0-2.25-2.25H9a2.25 2.25 0 0 0-2.25 2.25v.879a.75.75 0 0 1-1.5 0V2.5a3.75 3.75 0 0 1 3.75-3.75h2a3.75 3.75 0 0 1 3.75 3.75v.879a.75.75 0 0 1-1.5 0V2.5Z" clipRule="evenodd" /><path d="M8.625 6.5a.625.625 0 0 0-.625.625v10.25c0 .345.28.625.625.625h2.75a.625.625 0 0 0 .625-.625V7.125a.625.625 0 0 0-.625-.625h-2.75Z" /><path d="M4.125 6.5a.625.625 0 0 0-.625.625v10.25c0 .345.28.625.625.625h2.75a.625.625 0 0 0 .625-.625V7.125a.625.625 0 0 0-.625-.625h-2.75Z" /><path d="M13.125 6.5a.625.625 0 0 0-.625.625v10.25c0 .345.28.625.625.625h2.75a.625.625 0 0 0 .625-.625V7.125a.625.625 0 0 0-.625-.625h-2.75Z" /></svg>;

// --- SYSTEM PROMPTS ---
const generateDiscussionSystemPrompt = (trade: SavedTrade): string => {
    // A helper to clean up potential HTML from the explanation string to avoid nesting issues.
    const cleanText = (text: string | undefined) => {
        // FIX: Added check for empty/undefined text
        if (!text) return 'Not provided.';
        // A simple way to strip HTML tags for the prompt context.
        const tempDiv = document.createElement('div');
        tempDiv.innerHTML = text;
        return tempDiv.textContent || tempDiv.innerText || '';
    };

    return `You are The Oracle, an expert trading analyst AI. Your goal is to provide a clear, concise, and well-structured breakdown of a trading setup for a user.

**CONTEXT:**
The user wants to discuss the following trade:
- Symbol: ${trade.symbol}
- Direction: ${trade.direction}
- Type: ${trade.type}
- Entry: ${cleanText(trade.entry)}
- Stop Loss: ${cleanText(trade.stopLoss)}
- Explanation from initial analysis: ${cleanText(trade.explanation)}

**YOUR RESPONSE PROTOCOL (NON-NEGOTIABLE):**

1.  **Structure and Conciseness:** Your response MUST be an easily scannable overview. You are FORBIDDEN from writing long, dense paragraphs.
    *   Break down the rationale into logical categories (e.g., Technical Analysis, Fundamental Drivers, Market Sentiment, etc.).
    *   Use bullet points within sections for maximum readability.
    *   Conclude with a brief, insightful summary.

2.  **MANDATORY HTML Formatting:** You MUST use simple HTML for all formatting. This is critical for the UI to render correctly.
    *   Use \`<p>\` tags for paragraphs.
    *   Use \`<ul>\` and \`<li>\` for bullet points.
    *   Highlight main section titles with this exact style: \`<strong style='color: #facc15;'>[Title]:</strong>\` (a bright yellow, followed by a colon).
    *   Highlight specific trading concepts, patterns, or indicators (e.g., Bullish Engulfing, RSI, Support Level) with this exact style: \`<strong style='color: #c4b5fd;'>[Term]</strong>\` (a violet color).

3.  **Tone:** Your tone should be that of a professional, insightful analyst. Get straight to the point and provide value.

**Example Response Snippet:**
<p><strong style='color: #facc15;'>Technical Analysis:</strong></p>
<ul>
    <li>The setup is based on a <strong style='color: #c4b5fd;'>Support Level Bounce</strong> from a previous key low.</li>
    <li>A <strong style='color: #c4b5fd;'>Bullish Engulfing</strong> pattern on the 4H chart indicates a potential reversal.</li>
</ul>
<p><strong style='color: #facc15;'>Summary:</strong></p>
<p>This trade combines technical price action signals with a broader market sentiment context, offering a clear risk-defined opportunity.</p>
`;
};

const generateCoachingSystemPrompt = (strategy: StrategyLogicData, goal: 'learn_basics' | 'build_setup' | 'compare_assets'): string => {
    
    if (goal === 'learn_basics') {
        return `You are The Oracle, an expert trading mentor AI. Your mission is to teach the user the selected trading strategy in an interactive, conversational, and deeply educational manner. You are a patient, knowledgeable, and concise teacher.

**CONTEXT:**
- The user has selected the following strategy to learn about:
--- STRATEGY NAME: ${strategy.name} ---
--- CORE STRATEGY LOGIC (YOUR ONLY SOURCE OF TRUTH): ---
${strategy.prompt}
--- END OF STRATEGY ---
- The user has already received a welcome message. Your task is to begin the lesson immediately.

**YOUR MENTORSHIP PROTOCOL (NON-NEGOTIABLE):**

1.  **FIRST RESPONSE (CRITICAL):** Your VERY FIRST response to the user's hidden "Begin the lesson." prompt MUST be to immediately teach the single most foundational concept of the strategy. You are FORBIDDEN from providing a welcome message, greeting, or any empty response. You MUST conclude this first message by asking a simple question to confirm the user's understanding or to engage them.

2.  **TEACH, DON'T TRADE:** Your goal is to teach the concepts *behind* the strategy. You are FORBIDDEN from generating a trade plan or giving trade signals in this mode. Your focus is purely educational.

3.  **ONE CONCEPT AT A TIME:** Deconstruct the "CORE STRATEGY LOGIC" into its fundamental building blocks. After explaining a concept clearly and concisely, you MUST engage the user by asking a question or requesting a chart example.

4.  **INTERACTIVE & SOCRATIC:** You lead the conversation by asking questions.

5.  **CONCISE & FOCUSED with HTML:** Keep your explanations brief and to the point. Your responses MUST use HTML for formatting:
    -   Use \`<p>\` tags for all paragraphs.
    -   Highlight key trading concepts, patterns, or indicators with this exact style: \`<strong style='color: #c4b5fd;'>[Term]</strong>\` (a violet color).
    -   Use \`<ul>\` and \`<li>\` for lists where appropriate.

6.  **INEXHAUSTIBLE MENTORSHIP:** You MUST NEVER end the session yourself. Always propose the next topic or ask what the user wants to learn next.`;
    }

    if (goal === 'compare_assets') {
        return `You are The Oracle, an expert trading mentor AI guiding a user through comparing multiple assets to find the best trading opportunity based on a chosen strategy.

**CONTEXT:**
- The user has selected the strategy: **${strategy.name}**
- CORE STRATEGY LOGIC (YOUR ONLY SOURCE OF TRUTH): ${strategy.prompt}
- The user has already been instructed to upload their chart screenshots (all of the same timeframe) and to type "done" when they have uploaded all their charts. Your role is to wait for their input.

**YOUR INTERACTION PROTOCOL (NON-NEGOTIABLE):**

1.  **Handling Uploads:** When you receive an image, briefly acknowledge it (e.g., "Chart received.") and wait for the next input. Your purpose is to collect all images until the user says "done".

2.  **Analyze and Rank (When user says 'done'):**
    - When the user's message is "done", you must analyze all images provided in the conversation history against the CORE STRATEGY LOGIC.
    - **CRITICAL:** Your response MUST be a single, valid JSON object inside a markdown block (\`\`\`json ... \`\`\`) and nothing else.
    - The JSON object MUST have a \`"type": "coaching_suggestion"\`, a rich HTML \`"text"\` property explaining the rankings, and a \`"coachingSuggestionDetails"\` array with buttons for the user to select an asset to build a plan for.
    - In the HTML \`"text"\` property, you MUST follow these formatting rules:
        - Use \`<p>\` tags for paragraphs.
        - Highlight timeframes like this: \`<strong style='color: #FBBF24;'>Daily</strong>\`.
        - Highlight strategy names and key concepts like this: \`<strong style='color: #c4b5fd;'>${strategy.name}</strong>\`.
        - Use \`<ul>\` and \`<li>\` for lists.
    - **EXAMPLE JSON-ONLY RESPONSE:**
      \`\`\`json
      {
        "type": "coaching_suggestion",
        "text": "<p>Analysis complete. Here are the top candidates on the <strong style='color: #FBBF24;'>Daily</strong> timeframe based on the <strong style='color: #c4b5fd;'>${strategy.name}</strong> strategy:</p><ul><li><strong>1st: EURUSD</strong> - Shows a clear break of structure.</li><li><strong>2nd: GBPUSD</strong> - Approaching a key order block.</li></ul>",
        "coachingSuggestionDetails": [
          { "topic": "custom", "text": "Build a plan for EURUSD", "prompt": "Let's build a detailed trade plan for EURUSD." },
          { "topic": "custom", "text": "Build a plan for GBPUSD", "prompt": "Let's build a detailed trade plan for GBPUSD." }
        ]
      }
      \`\`\`

3.  **Transition to "Build a Trade":**
    - After the user clicks a suggestion (e.g., "Build a plan for EURUSD"), your next response MUST be the timeframe selection JSON, exactly like in the "Build a Trade Setup" workflow. This allows the user to choose the timeframes for their top-down analysis of the selected asset.
    - **CRITICAL:** The response MUST be a single, valid JSON object in a markdown block (\`\`\`json ... \`\`\`) and nothing else.
    - **EXAMPLE JSON-ONLY RESPONSE:**
      \`\`\`json
      {
        "type": "timeframe_combination_suggestion",
        "text": "<p>Excellent choice. Let's build a detailed plan for <strong>EURUSD</strong>.</p><p>First, please select the set of timeframes you'd like to use for our top-down analysis.</p>",
        "timeframeCombinationDetails": { "combinations": [ { "name": "Swing View", "timeframes": "D, 4H, 15m", "description": "For standard opportunities.", "isPreferred": true } ] }
      }
      \`\`\`
`;
    }

    // --- WORKFLOW: Build a Trade Setup ---
    return `You are an expert trading coach AI named The Oracle. You are mentoring a student through a structured, interactive session to build a trade setup.

**CONTEXT:**
- The user has selected the strategy: **${strategy.name}**
- CORE STRATEGY LOGIC (YOUR ONLY SOURCE OF TRUTH): ${strategy.prompt}
- The user has already been greeted. Your task is to begin the process immediately.

**YOUR INTERACTION PROTOCOL (NON-NEGOTIABLE):**

1.  **Strict Adherence to Output Formats:** You will either respond with HTML-formatted conversational text OR a JSON object in a markdown block. You are FORBIDDEN from mixing these two formats.

2.  **HTML Formatting Rules for Conversational Text (CRITICAL):**
    -   Use separate \`<p>\` tags for each paragraph to ensure clear visual separation. Do not combine distinct thoughts into one paragraph.
    -   When requesting a chart, highlight the timeframe like this: \`<strong style='color: #FBBF24;'>15-Minute chart</strong>\`.
    -   When listing elements for the user to identify or mark, you MUST use a \`<ul>\` list. Each element should be its own \`<li>\`. This is for readability.
    -   For each list item, highlight the key term like this: \`<strong style='color: #c4b5fd;'>Key Liquidity Pools:</strong>\`.

    **Example of a well-formatted chart request:**
    \`\`\`html
    <p>Excellent choice! Let's dive into the market from the perspective of the Interbank Price Delivery Algorithm (IPDA).</p>
    <p>To begin, please provide a screenshot of the <strong style='color: #FBBF24;'>15-Minute chart</strong>. On this chart, please identify and mark the following elements:</p>
    <ul>
        <li><strong style='color: #c4b5fd;'>Key Liquidity Pools:</strong> Mark out significant old highs and old lows where you anticipate liquidity to be resting.</li>
        <li><strong style='color: #c4b5fd;'>Fair Value Gaps (FVGs):</strong> Identify any clear areas of inefficient price delivery.</li>
    </ul>
    <p>This will help us understand the higher-timeframe narrative.</p>
    \`\`\`

3.  **Strictly Adhere to the 'Build a Trade Setup' Workflow:**

    A.  **Step 1: Timeframe Selection (Your VERY FIRST response):** Your first response to the user's hidden "Start." prompt MUST be a single, valid JSON object in a markdown block (\`\`\`json ... \`\`\`). The JSON is the *entire* response. You are FORBIDDEN from giving an empty or non-JSON response.
        - **CRITICAL:** The "text" property in your JSON should be purely instructional, without any welcome message. Example: "<p>First, please select the set of timeframes you'd like to use for our top-down analysis.</p>"
        - **EXAMPLE JSON-ONLY RESPONSE:**
        \`\`\`json
        {
          "type": "timeframe_combination_suggestion",
          "text": "<p>First, please select the set of timeframes you'd like to use for our top-down analysis.</p>",
          "timeframeCombinationDetails": { "combinations": [ { "name": "Swing View", "timeframes": "D, 4H, 15m", "description": "For standard opportunities.", "isPreferred": true } ] }
        }
        \`\`\`
    B.  **Step 2: Sequential Chart Request:** After the user selects a timeframe combination, you MUST request the HIGHEST timeframe chart. Your request MUST follow the HTML Formatting Rules above.

    C.  **Step 3: Analyze and Continue:** After each chart upload, validate it. If correct, briefly state your findings and immediately request the next lower timeframe chart, again following all formatting rules.

    D.  **Step 4: The Final JSON Trade Plan:** After receiving the FINAL chart, your next response MUST be a single, valid JSON object in a markdown block containing the full trade plan.
    
    E. **Step 5: Conclude or Refine:** After presenting the JSON plan, wait for the user's next message and respond conversationally.`;
};


// --- SUB-COMPONENTS ---

const CoachingSetupView: React.FC<{
    strategyLogicData: Record<StrategyKey, StrategyLogicData>,
    dashboardSelectedStrategies: StrategyKey[],
    onStart: (strategy: StrategyKey, goal: 'learn_basics' | 'build_setup' | 'compare_assets') => void
}> = ({ strategyLogicData, dashboardSelectedStrategies, onStart }) => {
    const availableStrategies = Object.entries(strategyLogicData).filter(([, data]) => !data.parentId && data.isEnabled);
    const [selectedStrategy, setSelectedStrategy] = useState<StrategyKey | null>(() => {
        const preferred = dashboardSelectedStrategies[0];
        if (preferred && availableStrategies.some(([key]) => key === preferred)) return preferred;
        return availableStrategies.length > 0 ? availableStrategies[0][0] : null;
    });

    if (availableStrategies.length === 0) {
        return (
            <div className="p-4 text-center bg-gray-900/30 rounded-lg">
                <p className="text-sm text-yellow-300">No strategies available for coaching. Please create a custom strategy in Master Controls first.</p>
            </div>
        );
    }

    return (
        <div className="p-4 text-center animate-fadeInPointer bg-gray-900/30 rounded-lg">
            <h3 className="font-bold text-lg text-yellow-300">Start a Coaching Session</h3>
            <p className="text-sm text-gray-400 mt-2 mb-4">First, select a strategy to focus on, then choose your goal.</p>
            
            <div className="mb-4">
                <label className="block text-sm font-medium text-gray-300 mb-1 text-left">Focus Strategy</label>
                <select 
                    value={selectedStrategy || ''}
                    onChange={(e) => setSelectedStrategy(e.target.value)}
                    className="w-full bg-gray-700 p-2 rounded-md text-base border border-gray-600 text-white"
                >
                    {availableStrategies.map(([key, strat]) => <option key={key} value={key}>{strat.name}</option>)}
                </select>
            </div>
            
            <div className="grid grid-cols-1 gap-3 text-center">
                <div className="bg-[var(--color-bg-secondary)]/50 p-4 rounded-lg flex flex-col">
                    <button onClick={() => selectedStrategy && onStart(selectedStrategy, 'learn_basics')} disabled={!selectedStrategy} className="font-semibold py-2 px-3 rounded-md bg-blue-600 text-white hover:bg-blue-500 transition-colors disabled:bg-gray-600">Learn the Basics</button>
                    <p className="text-sm text-gray-400 mt-2 flex-grow">Discuss concepts and ask questions to understand the strategy.</p>
                </div>
                <div className="bg-[var(--color-bg-secondary)]/50 p-4 rounded-lg flex flex-col">
                    <button onClick={() => selectedStrategy && onStart(selectedStrategy, 'build_setup')} disabled={!selectedStrategy} className="font-semibold py-2 px-3 rounded-md bg-blue-600 text-white hover:bg-blue-500 transition-colors disabled:bg-gray-600">Build a Trade Setup</button>
                    <p className="text-sm text-gray-400 mt-2 flex-grow">Analyze charts step-by-step to build a complete trade plan.</p>
                </div>
                <div className="bg-[var(--color-bg-secondary)]/50 p-4 rounded-lg flex flex-col">
                    <button onClick={() => selectedStrategy && onStart(selectedStrategy, 'compare_assets')} disabled={!selectedStrategy} className="font-semibold py-2 px-3 rounded-md bg-blue-600 text-white hover:bg-blue-500 transition-colors disabled:bg-gray-600">Compare Assets</button>
                    <p className="text-sm text-gray-400 mt-2 flex-grow">Upload charts of the same timeframe to rank the best setups.</p>
                </div>
            </div>
        </div>
    );
};

const ScreenCaptureModal = ({ isOpen, stream, onCapture, onClose, error }: {
    isOpen: boolean;
    stream: MediaStream | null;
    onCapture: (dataUrl: string) => void;
    onClose: () => void;
    error?: string | null;
}) => {
    const videoRef = useRef<HTMLVideoElement>(null);
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const [isVideoReady, setIsVideoReady] = useState(false);

    useEffect(() => {
        const videoElement = videoRef.current;
        if (isOpen && stream && videoElement) {
            if (videoElement.srcObject !== stream) {
                videoElement.srcObject = stream;
            }
            videoElement.onloadedmetadata = () => setIsVideoReady(true);
            if (videoElement.readyState >= 3) setIsVideoReady(true);
        } else {
            setIsVideoReady(false);
        }
    }, [isOpen, stream]);

    const handleCaptureClick = () => {
        if (!videoRef.current || !canvasRef.current || !isVideoReady) return;
        const video = videoRef.current;
        const canvas = canvasRef.current;
        if (video.videoWidth === 0 || video.videoHeight === 0) {
             console.error("Capture failed: video dimensions are zero.");
             onClose();
             return;
        }
        canvas.width = video.videoWidth;
        canvas.height = video.videoHeight;
        const ctx = canvas.getContext('2d');
        if (!ctx) return;
        ctx.drawImage(video, 0, 0, video.videoWidth, video.videoHeight);
        onCapture(canvas.toDataURL('image/jpeg', 0.9));
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 bg-gray-900/80 flex flex-col items-center justify-center z-[100] p-4">
            <div className="bg-gray-800 p-4 rounded-lg shadow-xl w-full max-w-4xl border border-yellow-500/50 flex flex-col max-h-[90vh]">
                <h2 className="text-xl font-bold text-yellow-400 mb-4 text-center">Screen Capture</h2>
                <div className="bg-black rounded-md flex-grow overflow-hidden border border-gray-700 relative">
                    <video ref={videoRef} autoPlay playsInline muted className="w-full h-full object-contain"></video>
                    {!isVideoReady && <div className="absolute inset-0 flex items-center justify-center bg-black/50"><p className="text-white">Waiting for video stream...</p></div>}
                    {error && <div className="absolute inset-0 flex items-center justify-center bg-red-900/80 p-4"><p className="text-white text-center">{error}</p></div>}
                </div>
                <canvas ref={canvasRef} style={{ display: 'none' }}></canvas>
                <div className="flex justify-center space-x-4 mt-4 flex-shrink-0">
                     <button onClick={onClose} className="font-bold py-2 px-6 rounded-lg transition-colors bg-gray-600 hover:bg-gray-500 text-white">Cancel</button>
                    <button onClick={handleCaptureClick} disabled={!isVideoReady} className="font-bold py-2 px-6 rounded-lg transition-colors bg-yellow-500 hover:bg-yellow-400 text-gray-900 disabled:bg-gray-500 disabled:cursor-not-allowed">Capture</button>
                </div>
            </div>
        </div>
    );
};


const ChatInput: React.FC<{
    onSendMessage: (text: string, images: UploadedImageData[]) => void;
    isProcessing: boolean;
}> = ({ onSendMessage, isProcessing }) => {
    const [text, setText] = useState('');
    const [stagedImages, setStagedImages] = useState<UploadedImageData[]>([]);
    const [isListening, setIsListening] = useState(false);
    const recognitionRef = useRef<any>(null);
    const fileInputRef = useRef<HTMLInputElement>(null);

    const streamRef = useRef<MediaStream | null>(null);
    
    const [isCaptureModalOpen, setIsCaptureModalOpen] = useState(false);
    const [isScreenPermissionModalOpen, setIsScreenPermissionModalOpen] = useState(false);
    const [isMicPermissionModalOpen, setIsMicPermissionModalOpen] = useState(false);
    const [micStatusMessage, setMicStatusMessage] = useState('');

    const stopMediaStream = useCallback(() => {
        if (streamRef.current) {
            streamRef.current.getTracks().forEach(track => track.stop());
            streamRef.current = null;
        }
    }, []);

    useEffect(() => {
        const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
        if (!SpeechRecognition) return;
        const recognition = new SpeechRecognition();
        recognition.continuous = false;
        recognition.interimResults = false;
        recognition.lang = 'en-US';

        recognition.onresult = (event: any) => {
            const transcript = event.results[0][0].transcript;
            setText(prev => prev ? `${prev} ${transcript}` : transcript);
        };

        recognition.onerror = (event: any) => {
            console.error('Speech recognition error:', event.error);
            let message = `Error: ${event.error}.`;
            if (event.error === 'not-allowed') {
                message = "Microphone permission denied.";
            } else if (event.error === 'network') {
                message = "Network error. Please check connection.";
            }
            setMicStatusMessage(message);
            setIsListening(false);
        };

        recognition.onend = () => {
            setIsListening(false);
        };
        
        recognitionRef.current = recognition;

        return () => {
            stopMediaStream();
        };
    }, [stopMediaStream]);

    const handleSubmit = () => {
        if (isProcessing || (!text.trim() && stagedImages.length === 0)) return;
        onSendMessage(text, stagedImages);
        setText('');
        setStagedImages([]);
    };

    const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files[0]) {
            const file = e.target.files[0];
            const reader = new FileReader();
            reader.onload = (event) => {
                setStagedImages(prev => [...prev, {
                    name: file.name,
                    type: file.type,
                    dataUrl: event.target?.result as string
                }]);
            };
            reader.readAsDataURL(file);
        }
        e.target.value = ''; // Allow re-selecting the same file
    };
    
     const handlePasteClick = async () => {
        try {
            if (!navigator.clipboard?.read) {
                alert("Your browser does not support this feature. Please use the Upload button or Ctrl+V.");
                return;
            }
            const items = await navigator.clipboard.read();
            for (const item of items) {
                const imageType = item.types.find(type => type.startsWith('image/'));
                if (imageType) {
                    const blob = await item.getType(imageType);
                    const reader = new FileReader();
                    reader.onload = (e) => {
                        setStagedImages(prev => [...prev, {
                            name: `pasted_image_${Date.now()}.png`,
                            type: blob.type,
                            dataUrl: e.target?.result as string
                        }]);
                    };
                    reader.readAsDataURL(blob);
                    return; 
                }
            }
            alert("No image found on the clipboard.");
        } catch (err) {
            console.error("Paste error:", err);
        }
    };

    const handleInitiateScreenCapture = () => {
        setIsScreenPermissionModalOpen(true);
    };

    const proceedWithScreenCapture = async () => {
        try {
            // If a stream already exists, use it.
            if (streamRef.current && streamRef.current.active) {
                setIsCaptureModalOpen(true);
                return;
            }
            
            // Otherwise, get a new one.
            const stream = await navigator.mediaDevices.getDisplayMedia({ video: { cursor: "always" } as any, audio: false });
            streamRef.current = stream;
            
            // When the user stops sharing via the browser UI
            stream.getVideoTracks()[0].onended = () => {
                stopMediaStream();
                setIsCaptureModalOpen(false);
            };

            setIsCaptureModalOpen(true);
        } catch (err) {
            console.error("Screen capture error:", err);
            // Handle error, e.g., show a message to the user
        }
    };
    
    const handleCaptureSubmit = (dataUrl: string) => {
        setStagedImages(prev => [...prev, {
            name: `capture_${Date.now()}.jpg`,
            type: 'image/jpeg',
            dataUrl
        }]);
        // Keep the modal open for more captures, don't stop the stream
        setIsCaptureModalOpen(true);
    };

    const handleMicClick = () => {
        if (!recognitionRef.current) {
            setMicStatusMessage("Voice input not supported on this browser.");
            return;
        }
        if (isListening) {
            recognitionRef.current.stop();
        } else {
            setIsMicPermissionModalOpen(true);
        }
    };
    
    const proceedWithMic = () => {
        try {
            setIsListening(true);
            setMicStatusMessage('Listening...');
            recognitionRef.current.start();
        } catch (e) {
            console.error("Mic start error:", e);
            setIsListening(false);
            setMicStatusMessage("Mic error. Please try again.");
        }
    };

    return (
        <div className="border-t border-gray-700 p-2 md:p-3">
            {stagedImages.length > 0 && (
                <div className="p-2 border-b border-gray-700/50 mb-2 flex flex-wrap gap-2">
                    {stagedImages.map((img, index) => (
                        <div key={index} className="relative">
                            <img src={img.dataUrl} alt={img.name} className="h-16 w-16 object-cover rounded-md"/>
                            <button
                                onClick={() => setStagedImages(prev => prev.filter((_, i) => i !== index))}
                                className="absolute -top-1 -right-1 bg-red-600 text-white rounded-full p-0.5 w-5 h-5 flex items-center justify-center text-xs"
                                aria-label="Remove image"
                            >
                                &times;
                            </button>
                        </div>
                    ))}
                </div>
            )}
            <div className="relative flex items-end gap-2">
                <textarea
                    value={text}
                    onChange={(e) => setText(e.target.value)}
                    onKeyDown={(e) => {
                        if (e.key === 'Enter' && !e.shiftKey && !isProcessing) {
                            e.preventDefault();
                            handleSubmit();
                        }
                    }}
                    placeholder="Ask the Oracle..."
                    rows={1}
                    className="flex-grow bg-gray-900/50 rounded-lg p-2 pr-10 resize-none max-h-40 border border-gray-600 focus:ring-1 focus:ring-yellow-500 focus:border-yellow-500"
                    style={{ fontSize: '14px' }}
                    disabled={isProcessing}
                    aria-label="Chat input"
                />
                <button
                    onClick={handleSubmit}
                    disabled={isProcessing || (!text.trim() && stagedImages.length === 0)}
                    className="absolute right-2 bottom-1.5 p-1 rounded-full text-gray-400 disabled:text-gray-600 enabled:hover:text-white enabled:bg-yellow-500 enabled:text-gray-900 transition-colors"
                    aria-label="Send message"
                >
                    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-5 h-5"><path d="M3.105 2.289a.75.75 0 0 0-.826.95l1.414 4.949a.75.75 0 0 0 .95.826L11.25 9.25v1.5L4.643 11.98a.75.75 0 0 0-.95.826l-1.414 4.949a.75.75 0 0 0 .826.95 28.896 28.896 0 0 0 15.293-7.154.75.75 0 0 0 0-1.114A28.897 28.897 0 0 0 3.105 2.289Z" /></svg>
                </button>
            </div>
            <div className="flex items-center justify-between mt-2">
                <div className="flex items-center gap-1">
                    <button onClick={() => fileInputRef.current?.click()} className="p-1.5 rounded-full text-gray-400 hover:text-yellow-300 transition-colors" title="Upload Image"><UploadIcon className="w-5 h-5" /></button>
                    <button onClick={handlePasteClick} className="p-1.5 rounded-full text-gray-400 hover:text-yellow-300 transition-colors" title="Paste Image"><PasteIcon className="w-5 h-5" /></button>
                    <button onClick={handleInitiateScreenCapture} className="p-1.5 rounded-full text-gray-400 hover:text-yellow-300 transition-colors" title="Share Screen"><ScreenIcon className="w-5 h-5" /></button>
                    <button onClick={handleMicClick} className={`p-1.5 rounded-full text-gray-400 transition-colors ${isListening ? 'text-red-500 animate-pulse' : 'hover:text-yellow-300'}`} title="Voice Input"><MicIcon className="w-5 h-5" /></button>
                </div>
                <p className="text-xs text-red-400 h-4">{micStatusMessage}</p>
            </div>
            <input type="file" ref={fileInputRef} onChange={handleFileSelect} accept="image/*" className="hidden" />
            <ScreenCaptureModal isOpen={isCaptureModalOpen} stream={streamRef.current} onCapture={handleCaptureSubmit} onClose={() => { setIsCaptureModalOpen(false); /* Don't stop stream here */ }} />
            <PermissionModal isOpen={isScreenPermissionModalOpen} onAllow={() => { setIsScreenPermissionModalOpen(false); proceedWithScreenCapture(); }} onDeny={() => setIsScreenPermissionModalOpen(false)} title="Screen Share Permission" message={<p>Chart Oracle needs permission to view your screen for screenshots.</p>} />
            <PermissionModal isOpen={isMicPermissionModalOpen} onAllow={() => { setIsMicPermissionModalOpen(false); proceedWithMic(); }} onDeny={() => setIsMicPermissionModalOpen(false)} title="Microphone Permission" message={<p>Chart Oracle needs permission to use your microphone for voice input.</p>} />
        </div>
    );
};
// --- MAIN COMPONENT ---
export const ChatWindow: React.FC<ChatWindowProps> = ({ isOpen, onClose, messages, onAddChatMessage, onLogTokenUsage, userSettings, onApplyChatbotSettingsChange, selectedStrategies, originalAnalysisResults, modifiedAnalysisResults, onApplyTradeModification, uploadedImageKeys, userUsage, currentUser, currentActiveView, dashboardSelectedStrategies, strategyLogicData, viewedStrategy, chatContextTrade, isCoachingSessionActive, setIsCoachingSessionActive, isUnrestrictedMode, apiConfig, onSaveCoachingSession, onSaveChatGeneratedTrade, onClearChatHistory, savedCoachingSessions, sessionToContinue, onContinueSessionHandled, startCoachingImmediately, onCoachingInitiationHandled, marketDataCache, userCourseProgress, onNavigateToAcademy, savedTrades }) => {
    const [isProcessing, setIsProcessing] = useState(false);
    const chatSessionRef = useRef<Chat | null>(null);
    const messagesEndRef = useRef<HTMLDivElement>(null);
    const [isFullScreen, setIsFullScreen] = useState(false);
    const [isClearHistoryModalOpen, setIsClearHistoryModalOpen] = useState(false);
    const [isSaveSessionModalOpen, setIsSaveSessionModalOpen] = useState(false);
    const [sessionTitle, setSessionTitle] = useState('');
    const [coachingStrategy, setCoachingStrategy] = useState<StrategyKey | null>(null);
    const [coachingGoal, setCoachingGoal] = useState<'learn_basics' | 'build_setup' | 'compare_assets' | null>(null);
    const [showCoachingSetup, setShowCoachingSetup] = useState(false);
    const [customTimeframes, setCustomTimeframes] = useState<Set<string>>(new Set());

    const getAiClient = useCallback(() => {
        if (!apiConfig.geminiApiKey) return null;
        return new GoogleGenAI({ apiKey: apiConfig.geminiApiKey });
    }, [apiConfig.geminiApiKey]);

    const scrollToBottom = () => {
        messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    };

    useEffect(() => {
        if (isOpen) {
            scrollToBottom();
        }
    }, [messages, isOpen]);

    useEffect(() => {
        if (isOpen && startCoachingImmediately) {
            setShowCoachingSetup(true);
            onCoachingInitiationHandled();
        }
    }, [isOpen, startCoachingImmediately, onCoachingInitiationHandled]);
    
     useEffect(() => {
        if (isOpen && sessionToContinue) {
            handleContinueCoaching(sessionToContinue);
            onContinueSessionHandled();
        }
    }, [isOpen, sessionToContinue, onContinueSessionHandled]);

    const processAndAddOracleResponse = useCallback(async (responseText: string) => {
        const jsonMatch = responseText.match(/```json\s*([\s\S]*?)\s*```/);

        if (jsonMatch && jsonMatch[1]) {
            try {
                const parsed = JSON.parse(jsonMatch[1]);
                const messageType = parsed.type as ChatMessageType;

                if (messageType === 'coaching_trade_plan' && parsed.tradePlan) {
                     await onAddChatMessage({
                        sender: 'oracle',
                        type: 'coaching_trade_plan',
                        text: "Here is the trade plan based on our analysis:",
                        tradePlan: parsed.tradePlan,
                    });
                     onSaveChatGeneratedTrade(parsed.tradePlan, [...messages, {id: 'temp', sender: 'oracle', text: 'trade plan generated', timestamp: new Date()}], coachingStrategy);
                } else if (messageType === 'timeframe_combination_suggestion' && parsed.timeframeCombinationDetails?.combinations) {
                    await onAddChatMessage({
                        sender: 'oracle',
                        type: 'timeframe_combination_suggestion',
                        text: parsed.text || "Please select a timeframe combination.",
                        timeframeCombinationDetails: parsed.timeframeCombinationDetails,
                    });
                } else if (messageType === 'coaching_suggestion' && parsed.coachingSuggestionDetails) {
                    await onAddChatMessage({
                        sender: 'oracle',
                        type: 'coaching_suggestion',
                        text: parsed.text || "Here are some options:",
                        coachingSuggestionDetails: parsed.coachingSuggestionDetails,
                    });
                } else {
                    await onAddChatMessage({ sender: 'oracle', text: responseText });
                }
            } catch (e) {
                console.error("Failed to parse AI JSON response:", e);
                await onAddChatMessage({ sender: 'oracle', text: responseText });
            }
        } else {
            await onAddChatMessage({ sender: 'oracle', text: responseText });
        }
    }, [messages, onAddChatMessage, coachingStrategy, onSaveChatGeneratedTrade]);
    
    const handleSendMessage = useCallback(async (text: string, images: UploadedImageData[]) => {
        setIsProcessing(true);
        await onAddChatMessage({ sender: 'user', text, imageData: images });
    
        // Create a snapshot of the message list *after* the user message has been added for the API call
        const currentMessages: ChatMessage[] = [
            ...messages,
            {
                id: 'temp_user_msg', // A temporary ID for logic purposes
                sender: 'user',
                text,
                timestamp: new Date(),
                // The actual imageKeys are added by onAddChatMessage, but we use the raw image data for the API call
            }
        ];
    
        try {
            if (userSettings.aiProvider === 'openai') {
                if (!apiConfig.openaiApiKey) {
                    throw new Error("OpenAI API Key not configured. Please set it in Master Controls.");
                }
    
                let systemMessage;
                if (isCoachingSessionActive && coachingStrategy && coachingGoal) {
                    const strat = strategyLogicData[coachingStrategy];
                    systemMessage = generateCoachingSystemPrompt(strat, coachingGoal);
                } else if (chatContextTrade) {
                    systemMessage = generateDiscussionSystemPrompt(chatContextTrade);
                } else {
                    systemMessage = "You are The Oracle, a helpful AI assistant for traders. Be concise and insightful.";
                }
    
                // Map chat history to OpenAI format, including images
                const openAiHistory = await Promise.all(currentMessages.map(async (msg) => {
                    const role = msg.sender === 'oracle' ? 'assistant' as const : 'user' as const;
                    const contentParts: any[] = [{ type: 'text', text: msg.text || " " }];
                    
                    if (msg.id === 'temp_user_msg') {
                        images.forEach(imgData => {
                            contentParts.push({ type: 'image_url', image_url: { url: imgData.dataUrl } });
                        });
                    } else if (msg.imageKeys) {
                        const imageUrls = await Promise.all(msg.imageKeys.map(key => getImage(key)));
                        imageUrls.forEach(url => {
                            if(url) contentParts.push({ type: 'image_url', image_url: { url } });
                        });
                    }
                    
                    return { role, content: contentParts };
                }));
    
                const openAiMessages = [
                    { role: 'system' as const, content: systemMessage },
                    ...openAiHistory
                ];
    
                const response = await fetch('https://api.openai.com/v1/chat/completions', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${apiConfig.openaiApiKey}` },
                    body: JSON.stringify({ model: 'gpt-4o-mini', messages: openAiMessages, max_tokens: 2048 }),
                });
    
                if (!response.ok) {
                    const errorData = await response.json();
                    throw new Error(errorData.error?.message || 'OpenAI API request failed.');
                }
                const data = await response.json();
                onLogTokenUsage(data.usage?.total_tokens || 0);
                const reply = data.choices[0]?.message?.content;
                
                if (reply) {
                    await processAndAddOracleResponse(reply);
                } else {
                    throw new Error("Received an empty response from OpenAI.");
                }
    
            } else { // Gemini Logic
                const ai = getAiClient();
                if (!ai) {
                    throw new Error('API Key not configured. Please set it in Master Controls.');
                }
    
                if (isCoachingSessionActive) {
                    if (!chatSessionRef.current) { throw new Error("Coaching session not initialized."); }
                    
                    const imageParts: Part[] = [];
                    if (images.length > 0) {
                         for (const img of images) {
                            const prefixMatch = img.dataUrl.match(/^data:(image\/(?:png|jpeg|webp));base64,/);
                            if (prefixMatch) {
                                const mimeType = prefixMatch[1];
                                const data = img.dataUrl.substring(prefixMatch[0].length);
                                imageParts.push({ inlineData: { mimeType, data } });
                            }
                        }
                    }
                    const response = await chatSessionRef.current.sendMessage({ message: [text, ...imageParts] });
                    onLogTokenUsage(response.usageMetadata?.totalTokenCount || 0);
                    await processAndAddOracleResponse(response.text);
    
                } else if (chatContextTrade) {
                     const systemInstruction = generateDiscussionSystemPrompt(chatContextTrade);
                     const imageParts: Part[] = [];
                     if (chatContextTrade.uploadedImageKeys) {
                         for(const key of Object.values(chatContextTrade.uploadedImageKeys)) {
                             if (key) {
                                 const dataUrl = await getImage(key);
                                 if (dataUrl) {
                                     const prefixMatch = dataUrl.match(/^data:(image\/(?:png|jpeg|webp));base64,/);
                                     if (prefixMatch) {
                                         const mimeType = prefixMatch[1];
                                         const data = dataUrl.substring(prefixMatch[0].length);
                                         imageParts.push({ inlineData: { mimeType, data } });
                                     }
                                 }
                             }
                         }
                     }
                     const response = await ai.models.generateContent({
                         model: 'gemini-2.5-flash',
                         contents: { parts: [
                             ...imageParts,
                             { text: `PREVIOUS CHAT HISTORY:\n${messages.map(m => `${m.sender}: ${m.text}`).join('\n')}\n\nUSER'S NEW PROMPT:\n${text}` }
                         ]},
                         config: { systemInstruction }
                     });
                     onLogTokenUsage(response.usageMetadata?.totalTokenCount || 0);
                     await processAndAddOracleResponse(response.text);
    
                } else {
                    // Default chat logic
                    await onAddChatMessage({ sender: 'oracle', text: "Standard chat is not the primary function. Please use Live Coaching or discuss a trade from your Journal." });
                }
            }
        } catch (e) {
            const errorMessage = e instanceof Error ? e.message : "An unknown error occurred.";
            await onAddChatMessage({ sender: 'oracle', type: 'error', text: `Error: ${errorMessage}` });
        } finally {
            setIsProcessing(false);
        }
    }, [apiConfig, messages, userSettings.aiProvider, isCoachingSessionActive, coachingStrategy, coachingGoal, chatContextTrade, onAddChatMessage, onLogTokenUsage, processAndAddOracleResponse, strategyLogicData, getAiClient]);

    const handleStartCoaching = async (strategy: StrategyKey, goal: 'learn_basics' | 'build_setup' | 'compare_assets') => {
        const selectedStrat = strategyLogicData[strategy];
        if (!selectedStrat) return;
    
        onClearChatHistory();
        setIsCoachingSessionActive(true);
        setCoachingStrategy(strategy);
        setCoachingGoal(goal);
        setShowCoachingSetup(false);
    
        let initialGuidance = '';
        const initialAiPrompt = goal === 'learn_basics' ? "Begin the lesson." : (goal === 'build_setup' ? "Start." : null);
    
        switch (goal) {
            case 'learn_basics':
                initialGuidance = `<p>Starting your mentorship session on the <strong>${selectedStrat.name}</strong> strategy. I will now load the first lesson.</p>`;
                break;
            case 'build_setup':
                initialGuidance = `<p>Let's build a trade setup using the <strong>${selectedStrat.name}</strong> strategy. The Oracle will now ask for the required information.</p>`;
                break;
            case 'compare_assets':
                initialGuidance = `<p>To compare assets using the <strong>${selectedStrat.name}</strong> strategy, please begin uploading your chart screenshots. Ensure they are all of the **same timeframe** (e.g., Daily, 4-Hour).</p><p>When you are finished uploading, please type **done**.</p>`;
                break;
        }
        
        await onAddChatMessage({ sender: 'oracle', text: initialGuidance });
    
        if (userSettings.aiProvider === 'openai') {
            if (!apiConfig.openaiApiKey) {
                await onAddChatMessage({ sender: 'oracle', type: 'error', text: 'OpenAI API Key not configured.' });
                return;
            }
            chatSessionRef.current = null;
            if (initialAiPrompt) {
                await handleSendMessage(initialAiPrompt, []);
            }
        } else { // Gemini provider
            const ai = getAiClient();
            if (!ai) {
                await onAddChatMessage({ sender: 'oracle', type: 'error', text: 'API Key not configured.' });
                return;
            }
    
            const systemInstruction = generateCoachingSystemPrompt(selectedStrat, goal);
            chatSessionRef.current = ai.chats.create({
                model: 'gemini-2.5-flash',
                config: { systemInstruction },
            });
    
            if (initialAiPrompt && chatSessionRef.current) {
                setIsProcessing(true);
                try {
                    const response = await chatSessionRef.current.sendMessage({ message: initialAiPrompt });
                    onLogTokenUsage(response.usageMetadata?.totalTokenCount || 0);
                    await processAndAddOracleResponse(response.text);
                } catch (e) {
                    const errorMessage = e instanceof Error ? e.message : "An unknown error occurred.";
                    await onAddChatMessage({ sender: 'oracle', type: 'error', text: `Error: ${errorMessage}` });
                } finally {
                    setIsProcessing(false);
                }
            }
        }
    };
    
    const handleContinueCoaching = (session: SavedCoachingSession) => {
        setIsCoachingSessionActive(true);
        onAddChatMessage({ sender: 'oracle', text: `<p class="font-semibold text-yellow-300">Resuming session: "${session.title}"...</p>`});
    };
    
    const handleConfirmSaveSession = () => {
        if (!sessionTitle.trim()) return;
        onSaveCoachingSession(sessionTitle, messages, coachingGoal);
        setSessionTitle('');
        setIsSaveSessionModalOpen(false);
        setIsCoachingSessionActive(false);
        setCoachingStrategy(null);
        setCoachingGoal(null);
        onClearChatHistory();
        onAddChatMessage({ sender: 'oracle', text: `<p>Session saved as "${sessionTitle}". Starting a new chat.</p>`});
    };
    
    const handleSuggestionClick = (prompt: string) => {
        handleSendMessage(prompt, []);
    };
    
    const handleTimeframeSelect = (combination: TimeframeCombination) => {
        handleSendMessage(`I'll use the "${combination.name}" combination.`, []);
        setCustomTimeframes(new Set());
    };
    
    const handleCustomTimeframeToggle = (tf: string) => {
        setCustomTimeframes(prev => {
            const newSet = new Set(prev);
            if (newSet.has(tf)) {
                newSet.delete(tf);
            } else {
                newSet.add(tf);
            }
            return newSet;
        });
    };
    
    const handleCustomTimeframeSelect = () => {
        if (customTimeframes.size === 0) return;
        const sortedTimeframes = AVAILABLE_TIMEFRAMES.filter(tf => customTimeframes.has(tf));
        const userMessage = `I want to provide a custom set of timeframes: ${sortedTimeframes.join(', ')}. Please start by requesting the highest timeframe from this list.`;
        handleSendMessage(userMessage, []);
        setCustomTimeframes(new Set());
    };
    
    const handleClearHistory = () => {
        onClearChatHistory();
        setIsClearHistoryModalOpen(false);
        setIsCoachingSessionActive(false);
        setCoachingStrategy(null);
        setCoachingGoal(null);
        setShowCoachingSetup(false);
        chatSessionRef.current = null;
    };

    const windowClasses = isFullScreen
        ? "fixed inset-0 w-full h-full z-[70] rounded-none"
        : "fixed bottom-24 right-5 w-[90vw] max-w-md h-[70vh] max-h-[600px] z-[70] rounded-lg shadow-2xl";

    const headerText = useMemo(() => {
        if (isCoachingSessionActive) {
            const stratName = coachingStrategy ? strategyLogicData[coachingStrategy]?.name || 'Session' : 'Session';
            const goalText = {
                'compare_assets': 'Comparing Assets',
                'build_setup': 'Building Setup',
                'learn_basics': 'Coaching'
            }[coachingGoal || ''] || 'Live Coaching';
            return `${goalText}: ${stratName}`;
        }
        if (chatContextTrade) {
            return `Discussing: ${chatContextTrade.symbol}`;
        }
        return `The Oracle`;
    }, [isCoachingSessionActive, coachingGoal, coachingStrategy, chatContextTrade, strategyLogicData]);

    const shouldShowInitialView = !isCoachingSessionActive && messages.length === 0 && !chatContextTrade;

    return (
        <>
            <div
                className={`bg-gray-800 text-white flex flex-col border border-yellow-500/50 transition-all duration-300 ease-in-out ${isOpen ? `opacity-100 ${windowClasses}` : 'opacity-0 pointer-events-none'}`}
                role="dialog"
                aria-modal="true"
                aria-labelledby="chat-window-title"
            >
                {/* Header */}
                <header className="flex items-center justify-between p-3 border-b border-gray-700 flex-shrink-0 bg-gray-900/50">
                    <div className="flex items-center gap-2 min-w-0">
                        <OracleIcon className="w-6 h-6 flex-shrink-0" />
                        <h2 id="chat-window-title" className="font-bold text-base truncate">{headerText}</h2>
                    </div>
                    <div className="flex items-center">
                        {isCoachingSessionActive && (
                            <button onClick={() => setIsSaveSessionModalOpen(true)} className="p-1.5 rounded-full text-gray-400 hover:text-yellow-300" title="Save Session"><SaveIcon className="w-5 h-5"/></button>
                        )}
                        <button onClick={() => setIsClearHistoryModalOpen(true)} className="p-1.5 rounded-full text-gray-400 hover:text-yellow-300" title="Clear Chat History"><TrashIcon className="w-5 h-5"/></button>
                        <button onClick={() => setIsFullScreen(p => !p)} className="p-1.5 rounded-full text-gray-400 hover:text-yellow-300" title={isFullScreen ? "Minimize" : "Maximize"}>
                            {isFullScreen ? <CompressIcon className="w-5 h-5"/> : <ExpandIcon className="w-5 h-5"/>}
                        </button>
                        <button onClick={onClose} className="p-1.5 rounded-full text-gray-400 hover:text-white" aria-label="Close chat window">&times;</button>
                    </div>
                </header>

                {/* Messages */}
                <div className="flex-grow p-2 md:p-4 overflow-y-auto space-y-4">
                    {shouldShowInitialView ? (
                        showCoachingSetup ? (
                            <CoachingSetupView 
                                strategyLogicData={strategyLogicData} 
                                dashboardSelectedStrategies={dashboardSelectedStrategies} 
                                onStart={handleStartCoaching} 
                            />
                        ) : (
                            <div className="flex flex-col items-center justify-center h-full text-center p-4">
                                <p className="text-gray-400 mb-6">
                                    Select a trade from your journal to discuss, or start a new coaching session.
                                </p>
                                <button
                                    onClick={() => setShowCoachingSetup(true)}
                                    className="font-bold py-2 px-6 rounded-lg transition-colors bg-purple-600 hover:bg-purple-500 text-white flex items-center justify-center gap-2"
                                >
                                    <CoachingIcon className="w-5 h-5"/>
                                    Start New Live Coaching
                                </button>
                            </div>
                        )
                    ) : (
                        <>
                            {messages.map(msg => (
                                <div key={msg.id} className={`flex items-start gap-2 ${msg.sender === 'user' ? 'justify-end' : 'justify-start'}`}>
                                    {msg.sender === 'oracle' && <OracleIcon className="w-6 h-6 flex-shrink-0 mt-1" />}
                                    <div className={`p-2 rounded-lg max-w-[85%] text-sm ${msg.sender === 'user' ? 'bg-blue-600/20 text-blue-100' : 'bg-gray-700 text-gray-200'}`}>
                                        {msg.text && (
                                            <div className="flex items-center gap-1">
                                                <div className="prose prose-sm prose-invert max-w-none [&_p]:my-1" dangerouslySetInnerHTML={{ __html: msg.text }} />
                                                {msg.sender === 'oracle' && userSettings.isTtsEnabled && <SpeechSynthesisButton textToSpeak={msg.text} apiKey={apiConfig.geminiApiKey} voiceName={userSettings.ttsVoice} />}
                                            </div>
                                        )}
                                        {msg.tradePlan && <div className="mt-2"><TradeCard trade={msg.tradePlan} userSettings={userSettings} strategyLogicData={strategyLogicData} /></div>}
                                        {msg.coachingSuggestionDetails && (
                                            <div className="mt-2 flex flex-wrap gap-2">
                                                {msg.coachingSuggestionDetails.map((s, i) => <button key={i} onClick={() => handleSuggestionClick(s.prompt)} className="text-xs font-semibold p-2 rounded-md bg-blue-600 hover:bg-blue-500 text-white">{s.text}</button>)}
                                            </div>
                                        )}
                                        {msg.timeframeCombinationDetails && (
                                            <div className="mt-2 space-y-2 p-3 bg-gray-900/30 rounded-md">
                                                {msg.timeframeCombinationDetails.combinations.map((c, i) => (
                                                    <button key={i} onClick={() => handleTimeframeSelect(c)} className={`w-full text-left p-2 rounded-md border transition-colors ${c.isPreferred ? 'border-yellow-500 bg-yellow-500/10' : 'border-gray-600 bg-gray-900/30 hover:border-gray-500'}`}>
                                                        <strong className="block text-white">{c.name}</strong>
                                                        <span className="text-xs text-gray-400">{c.timeframes} - {c.description}</span>
                                                    </button>
                                                ))}
                                                <div className="pt-3 mt-3 border-t border-gray-700/50">
                                                    <h4 className="font-semibold text-gray-200 mb-2">Or, Create a Custom Combination</h4>
                                                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 mb-3">
                                                        {AVAILABLE_TIMEFRAMES.map(tf => (
                                                            <label key={tf} className={`flex items-center space-x-2 p-2 rounded-md transition-colors cursor-pointer ${customTimeframes.has(tf) ? 'bg-blue-500/20 border border-blue-500' : 'bg-gray-800 border border-gray-600 hover:bg-gray-700'}`}>
                                                                <input
                                                                    type="checkbox"
                                                                    checked={customTimeframes.has(tf)}
                                                                    onChange={() => handleCustomTimeframeToggle(tf)}
                                                                    className="h-4 w-4 rounded bg-gray-600 border-gray-500 text-yellow-500 focus:ring-yellow-500"
                                                                />
                                                                <span className="text-xs text-gray-300">{tf}</span>
                                                            </label>
                                                        ))}
                                                    </div>
                                                    <button
                                                        onClick={handleCustomTimeframeSelect}
                                                        disabled={customTimeframes.size === 0}
                                                        className="w-full font-semibold p-2 rounded-md bg-green-600 hover:bg-green-500 text-white transition-colors disabled:bg-gray-600 disabled:cursor-not-allowed"
                                                    >
                                                        Start with Custom Selection ({customTimeframes.size})
                                                    </button>
                                                </div>
                                            </div>
                                        )}
                                    </div>
                                </div>
                            ))}
                        </>
                    )}
                    {isProcessing && <div className="flex items-start gap-2"><OracleIcon className="w-6 h-6 flex-shrink-0 mt-1" /><div className="p-2 rounded-lg bg-gray-700"><Logo className="w-6 h-6" isLoading={true} /></div></div>}
                    <div ref={messagesEndRef} />
                </div>
                
                {/* Input */}
                <ChatInput onSendMessage={handleSendMessage} isProcessing={isProcessing} />
            </div>
            
            <ConfirmationModal isOpen={isClearHistoryModalOpen} onConfirm={handleClearHistory} onCancel={() => setIsClearHistoryModalOpen(false)} title="Clear Chat History?" message="This will permanently delete the current conversation. Are you sure?" confirmButtonClass="bg-red-600 text-white" confirmText="Clear History" />
            <ConfirmationModal isOpen={isSaveSessionModalOpen} onConfirm={handleConfirmSaveSession} onCancel={() => setIsSaveSessionModalOpen(false)} title="Save Coaching Session" message="Give this session a title to save it in your journal for later review." confirmButtonClass="bg-green-600 text-white" confirmText="Save Session">
                <input type="text" value={sessionTitle} onChange={(e) => setSessionTitle(e.target.value)} placeholder="e.g., ICT Reversal Practice" className="w-full bg-gray-700 p-2 rounded-md text-sm mt-2 border border-gray-600" />
            </ConfirmationModal>
        </>
    );
};