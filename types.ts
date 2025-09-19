

// A type to represent the temporary, full-data format of an image before it's stored.
export interface UploadedImageData {
  name: string;
  type: string;
  dataUrl: string;
}

export type StrategyKey = string;


export type TradeDirection = 'Long' | 'Short';
export type EntryType = 'Limit Order' | 'Confirmation Entry';

export interface TradeManagement {
  move_to_breakeven_condition: string;
  partial_take_profit_1: string;
  partial_take_profit_2: string;
}

export interface Trade {
  type: string;
  direction: TradeDirection;
  symbol: string;
  entry: string;
  entryType: EntryType;
  entryExplanation: string;
  stopLoss: string;
  takeProfit1: string;
  takeProfit2: string;
  heat: number;
  explanation: string;
  isModified?: boolean; // Added for tracking modified trades
  tradeManagement?: TradeManagement;
}

export type TradeOutcome = 'TP1 & TP2' | 'TP1 -> B/E' | 'TP1' | 'B/E' | 'SL' | null;

export interface TradeFeedback {
    outcome: TradeOutcome;
    text: string;
}

export type UploadedImageKeys = Record<number, string | null>;

export interface SavedTrade extends Trade {
  id: string; // Unique ID for the saved trade instance
  savedDate: string; // ISO string for when it was saved
  feedback: TradeFeedback;
  strategiesUsed: StrategyKey[]; // Strategies that generated this trade
  uploadedImageKeys: UploadedImageKeys; // The keys to the chart images stored in IndexedDB
  postTradeImageKeys?: string[]; // Keys for images added after the trade was saved (e.g., entry, exit)
  analysisContext: {
    realTimeContextWasUsed: boolean;
  };
  isFromCoaching?: boolean;
  coachingSessionChat?: ChatMessage[]; // Store the chat history
}

export interface StrategySuggestion {
  suggestedStrategies: StrategyKey[];
  suggestedSettings: UserSettings;
  reasoning: string;
}

export type AnalysisResults = {
  "Top Longs": Trade[];
  "Top Shorts": Trade[];
  strategySuggestion: StrategySuggestion;
  [key: string]: any; // Allow for other keys like in modified results
};

export interface StrategyRequirementsData {
  title: string;
  items: string[];
}

export interface StrategyLogicData {
  name: string;
  status: 'live' | 'beta';
  description: string;
  prompt: string;
  requirements?: StrategyRequirementsData;
  summary?: string;
  confluence?: StrategyKey[];
  tags?: string[];
  requiredConfluence?: StrategyKey[];
  isEnabled?: boolean;
  creationTokenCost?: number;
  parentId?: StrategyKey; // For grouping sub-strategies under a core concept
  assetClasses?: string[]; // e.g., ['Forex', 'Crypto', 'Indices']
  timeZoneSpecificity?: string; // e.g., 'New York Killzone', 'None'
  tradingStyles?: string[]; // e.g., ['Scalping', 'Day Trading']
  courseModule?: CourseModule;
}

export type ActiveView = 'analyze' | 'logic' | 'subscription' | 'master-controls' | 'journal' | 'academy' | 'analyze_new' | 'profile';

export interface TimeFrameStep {
  step: number;
  title:string;
  subtitle: string;
}

// User Settings Types
export type RiskAppetite = 'Conservative' | 'Moderate' | 'Aggressive';
export type PreferredTradeDuration = 'Any' | 'Short-term' | 'Medium-term' | 'Long-term';
export type StopLossStrategy = 'Standard' | 'Structure-Buffered';

export interface UserSettings {
  riskAppetite: RiskAppetite;
  minRiskRewardRatio: number;
  preferredTradeDuration: PreferredTradeDuration;
  tradeAgainstTrend: boolean;
  ttsVoice: string; // The identifier for the selected TTS voice model, e.g., 'en-US-Wavenet-D'
  isTtsEnabled: boolean; // Controls whether TTS auto-plays in coaching
  stopLossStrategy: StopLossStrategy;
  preferredAssetClass: string;
  marketTiming: string;
  // Font sizes
  uiFontSize: number;
  headingFontSize: number;
  dataFontSize: number;
  chatFontSize: number;
  darknessLevel: number;
  aiProvider: 'gemini' | 'openai';
}

// For storing uploaded knowledge base documents
export interface KnowledgeBaseDocument {
  name: string;
  type: 'text/plain' | 'application/pdf' | 'image/jpeg' | 'image/png' | 'image/webp';
  content: string; // text content for text/pdf, base64 dataURL for images
  isEnabled?: boolean;
}

// Subscription and User Types
export type UserTier = 'Seeker' | 'Apprentice' | 'Master';

export interface User {
  name: string;
  tier: UserTier;
  anonymousUsername: string;
  avatar: string; // base64 data URL
}

export interface UserUsage {
  creditsRemaining: number;
  creditsTotal: number;
  purchasedCredits: number;
  creditRolloverMax: number;
  periodLabel: string;
  highResAnalysesRemaining: number;
  redosRemaining: number;
  redosTotal: number;
}

export interface SubscriptionPlan {
  id: UserTier;
  name: string;
  price: string;
  priceFrequency?: string;
  features: string[];
  credits: number;
  creditRollover: boolean;
  canPurchaseCredits: boolean;
  hasMasterControls: boolean;
  periodLabel: string;
  isCurrent?: boolean;
  actionButton?: {
    text: string;
    type: 'upgrade' | 'downgrade' | 'current';
  };
}

export interface CreditPack {
    name: string;
    credits: number;
    price: number;
    pricePerCredit: number;
    description: string;
}

// Chatbot Types
export interface ChatMessageSuggestionDetails {
  key: keyof UserSettings;
  value: UserSettings[keyof UserSettings];
  originalValue: UserSettings[keyof UserSettings];
  text?: string; // Pre-suggestion text
}

export interface TradeModificationDetails {
  tradeKey: string; // e.g., "Top Longs:Setup 1:Long:EURUSD" - needs to uniquely identify the trade
  modifications: {
    entry?: string;
    stopLoss?: string;
    takeProfit1?: string;
    takeProfit2?: string;
  };
  originalTrade: Trade; // For reference and display
  text?: string; // Oracle's textual suggestion for modification
}

export interface CoachingSuggestionDetails {
    topic: 'fundamentals' | 'strategy' | 'analysis' | 'navigation' | 'custom';
    text: string; // The button text
    prompt: string; // The prompt to send if the user clicks it
    navigateTo?: ActiveView;
}

export interface TimeframeCombination {
    name: string;
    timeframes: string;
    description: string;
    isPreferred?: boolean;
}

export type ChatMessageType = 'text' | 'image_query_request' | 'settings_suggestion' | 'settings_confirmation_request' | 'error' | 'image_upload' | 'trade_modification_suggestion' | 'trade_modification_confirmation_request' | 'coaching_suggestion' | 'coaching_invitation' | 'coaching_trade_plan' | 'coaching_start_prompt' | 'timeframe_combination_suggestion';


export interface ChatMessage {
  id: string;
  sender: 'user' | 'oracle';
  text: string;
  timestamp: Date;
  type?: ChatMessageType;
  suggestionDetails?: ChatMessageSuggestionDetails;
  tradeModificationDetails?: TradeModificationDetails;
  coachingSuggestionDetails?: CoachingSuggestionDetails[];
  imageKeys?: string[]; // Use keys instead of full data
  tradePlan?: Trade;
  coachingStartPromptDetails?: {
    options: ['learn_basics', 'build_setup'];
  };
  timeframeCombinationDetails?: {
      combinations: TimeframeCombination[];
  };
}

// Course & Academy Types
export interface LessonBlockText {
  type: 'text';
  content: string; // Markdown-supported string
}

export interface LessonBlockExercise {
  type: 'exercise';
  prompt: string; // The instruction for the user
  validationPrompt: string; // The system prompt for the AI to validate the user's submission
}

export type LessonBlock = LessonBlockText | LessonBlockExercise;

export interface QuizQuestion {
  question: string;
  options: string[];
  correctAnswer: string;
  explanationPrompt: string; // An AI prompt to explain the answer
}

export interface CourseLesson {
  id: string;
  title: string;
  estimatedTime: string;
  blocks: LessonBlock[];
}

export interface CourseModule {
  id: string;
  title: string;
  description: string;
  lessons: CourseLesson[];
  quiz: QuizQuestion[];
}

export type UserCourseProgress = {
  completedLessons: string[]; // Array of lesson IDs
  quizScores: Record<string, number>; // Module ID -> score percentage
  exerciseStates: Record<string, { // key: lessonId-blockIndex
      imageKey?: string; // Use key instead of full data
      feedback?: string;
      status: 'pending' | 'passed' | 'failed';
  }>;
};

// Visual Glossary Types
export interface GlossaryTerm {
  displayName: string;
  description: string;
  imageUrl: string;
}

// Saved Coaching Sessions
export interface SavedCoachingSession {
  id:string;
  title: string;
  savedDate: string;
  chatHistory: ChatMessage[];
  userNotes: string;
  sessionGoal?: 'learn_basics' | 'build_setup' | 'compare_assets';
}

// Token Usage
export interface TokenUsageRecord {
    date: string; // 'YYYY-MM-DD'
    tokens: number;
}

// Market Data Cache
export interface MarketDataCandle {
    symbol: string;
    date: string;
    open: number;
    high: number;
    low: number;
    close: number;
    volume: number;
}

export type MarketDataCache = Record<string, MarketDataCandle[]>; // Key is e.g., "EURUSD-Daily"}

export interface ApiConfiguration {
  eodhdApiKey: string;
  geminiApiKey: string;
  openaiApiKey: string;
}

export interface EodhdUsageStats {
    dailyLimit: number;
    usedCalls: number;
    remainingCalls: number;
    resetTimestamp: number;
}
