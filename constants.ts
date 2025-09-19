

import { TimeFrameStep, UserSettings, RiskAppetite, PreferredTradeDuration, User, UserTier, UserUsage, SubscriptionPlan, CreditPack, GlossaryTerm, StopLossStrategy, ApiConfiguration, CourseModule } from './types.ts';

export const TIME_FRAMES_STEPS: TimeFrameStep[] = [
  { step: 1, title: 'Weekly Chart', subtitle: 'Long-term Macro View' },
  { step: 2, title: 'Daily Chart', subtitle: 'Overall Structure, Key OBs/Liquidity' },
  { step: 3, title: '4H Chart', subtitle: 'Refined Zones, Intermediate Trend' },
  { step: 4, title: '15m Chart', subtitle: 'Entry Confirmation, FVG, LTF Shift' },
  { step: 5, title: '1m Chart', subtitle: 'Scalp Entry Precision' },
];

export const DEFAULT_USER_SETTINGS: UserSettings = {
  riskAppetite: 'Moderate',
  minRiskRewardRatio: 2,
  preferredTradeDuration: 'Any',
  tradeAgainstTrend: false,
  ttsVoice: 'en-US-Standard-C',
  isTtsEnabled: true,
  stopLossStrategy: 'Standard',
  preferredAssetClass: 'Any',
  marketTiming: 'Any',
  // Font sizes
  uiFontSize: 14,
  headingFontSize: 18,
  dataFontSize: 16,
  chatFontSize: 14,
  darknessLevel: 0,
  aiProvider: 'gemini',
};

export const DEFAULT_API_CONFIGURATION: ApiConfiguration = {
    eodhdApiKey: '',
    geminiApiKey: '',
    openaiApiKey: '',
};

export const RISK_APPETITE_OPTIONS: RiskAppetite[] = ['Conservative', 'Moderate', 'Aggressive'];
export const PREFERRED_TRADE_DURATION_OPTIONS: PreferredTradeDuration[] = ['Any', 'Short-term', 'Medium-term', 'Long-term'];
export const PREFERRED_TRADE_DURATION_DETAILS: Record<PreferredTradeDuration, string> = {
    'Any': 'No preference, consider all types.',
    'Short-term': 'Focus on Scalps and quick Day Trades.',
    'Medium-term': 'Focus on Day Trades and shorter Swing Trades.',
    'Long-term': 'Focus on Swing Trades and longer-term positions.'
};

export const STOP_LOSS_STRATEGY_OPTIONS: StopLossStrategy[] = ['Standard', 'Structure-Buffered'];
export const STOP_LOSS_STRATEGY_DETAILS: Record<StopLossStrategy, string> = {
    'Standard': 'AI places stop-loss based on direct strategy rules.',
    'Structure-Buffered': 'AI places stop-loss with an extra buffer outside key market structure levels, useful for volatile assets.'
};

export const ASSET_CLASS_OPTIONS: string[] = ['Any', 'Forex', 'Crypto', 'Indices', 'Commodities', 'Stocks'];
export const MARKET_TIMING_OPTIONS: string[] = ['Any', 'Market Open (General)', 'London Session', 'New York Session', 'Asia Session', 'London Killzone', 'New York Killzone', 'Weekend (Crypto)'];

export const AVAILABLE_TIMEFRAMES = ['Weekly', 'Daily', '4-Hour', '1-Hour', '15-Minute', '5-Minute', '1-Minute'];


export const EXOTIC_VOICE_COST_THRESHOLD = 16.00; // Price per 1M characters

export const TTS_VOICE_OPTIONS: { name: string; displayName: string; type: string; gender: string; description: string; cost: number; }[] = [
    // Note: Cost is per 1 million characters, based on Google Cloud TTS pricing.
    { name: 'en-US-Standard-C', displayName: 'Standard (Female C)', type: 'Standard', gender: 'Female', description: 'Cost-effective, standard quality.', cost: 4.00 },
    { name: 'en-US-Standard-E', displayName: 'Standard (Male E)', type: 'Standard', gender: 'Male', description: 'Cost-effective, standard quality.', cost: 4.00 },
    { name: 'en-US-Wavenet-D', displayName: 'WaveNet (Male D)', type: 'WaveNet', gender: 'Male', description: 'Premium, realistic voice.', cost: 16.00 },
    { name: 'en-US-Wavenet-F', displayName: 'WaveNet (Female F)', type: 'WaveNet', gender: 'Female', description: 'Premium, realistic voice.', cost: 16.00 },
    { name: 'en-US-Journey-F', displayName: 'Journey (Female F)', type: 'Journey', gender: 'Female', description: 'New, highly conversational voice.', cost: 16.00 },
    { name: 'en-US-Journey-D', displayName: 'Journey (Male D)', type: 'Journey', gender: 'Male', description: 'New, highly conversational voice.', cost: 16.00 },
    { name: 'en-GB-News-K', displayName: 'News (Male K, UK)', type: 'Standard', gender: 'Male', description: 'Crisp, clear news-style voice.', cost: 16.00 },
];

// --- Gamification Constants ---
export const ADJECTIVES = ['Nimble', 'Sharp', 'Clever', 'Wise', 'Quantum', 'Zen', 'Alpha', 'Stealthy', 'Dynamic', 'Fluid'];
export const NOUNS = ['Trader', 'Fox', 'Lynx', 'Oracle', 'Voyager', 'Specter', 'Edge', 'Nexus', 'Pioneer', 'Catalyst'];

// --- Subscription Constants ---
export const USER_TIERS: Record<string, UserTier> = {
  SEEKER: 'Seeker',
  APPRENTICE: 'Apprentice',
  MASTER: 'Master',
};

export const ORACLE_CREDITS_COST = {
    BASIC_ANALYSIS: 1, // 1-3 strategies
    CONFLUENT_ANALYSIS: 2, // 4-5 strategies
    COACHING_SESSION: 15, // per 15-min block
};

export const REDO_COUNTS: Record<UserTier, number> = {
    'Seeker': 1,
    'Apprentice': 3,
    'Master': 5,
};

export const DEFAULT_LOGGED_OUT_USER: User | null = null;

export const SEEKER_USAGE: UserUsage = {
  creditsRemaining: 5,
  creditsTotal: 5,
  purchasedCredits: 0,
  creditRolloverMax: 0,
  periodLabel: 'per month',
  highResAnalysesRemaining: 0,
  redosRemaining: 0,
  redosTotal: 0,
};

export const APPRENTICE_USAGE: UserUsage = {
  creditsRemaining: 35,
  creditsTotal: 35,
  purchasedCredits: 0,
  creditRolloverMax: 70,
  periodLabel: 'per month',
  highResAnalysesRemaining: 0,
  redosRemaining: 0,
  redosTotal: 0,
};

export const MASTER_USAGE: UserUsage = {
  creditsRemaining: 300,
  creditsTotal: 300,
  purchasedCredits: 0,
  creditRolloverMax: 600,
  periodLabel: 'per month',
  highResAnalysesRemaining: 50,
  redosRemaining: 0,
  redosTotal: 0,
};

export const DEFAULT_LOGGED_OUT_USAGE: UserUsage = {
  creditsRemaining: 0,
  creditsTotal: 0,
  purchasedCredits: 0,
  creditRolloverMax: 0,
  periodLabel: 'N/A',
  highResAnalysesRemaining: 0,
  redosRemaining: 0,
  redosTotal: 0,
};


export const SUBSCRIPTION_PLANS: SubscriptionPlan[] = [
  {
    id: USER_TIERS.SEEKER as UserTier,
    name: 'The Seeker',
    price: '$0',
    priceFrequency: '',
    credits: 5,
    features: [
      '5 Credits / month for AI Analysis',
      '1 Redo per analysis',
      'Analysis from 3 timeframes (D, 4H, 15m)',
      'Access to 1 randomly rotating Trading Strategy',
      'Trade Journal (up to 10 setups, text only)',
      'Full Gamification & Profile access',
    ],
    creditRollover: false,
    canPurchaseCredits: true,
    hasMasterControls: false,
    periodLabel: 'credits per month',
  },
  {
    id: USER_TIERS.APPRENTICE as UserTier,
    name: 'The Apprentice',
    price: '$9.95',
    priceFrequency: '/ month',
    credits: 35,
    features: [
      '35 Credits / month for AI Analysis & Oracle Chat',
      '3 Redos per analysis',
      'Analysis from 4 timeframes (D, 4H, 15m, 1m)',
      'Access to ALL 9 Trading Strategies',
      'Full Academy access (All Modules & Courses)',
      'Trade Journal (up to 100 setups total)',
      '8 setups include low-res chart images',
      'Unused credits roll over (up to 70)',
    ],
    creditRollover: true,
    canPurchaseCredits: true,
    hasMasterControls: false,
    periodLabel: 'credits per month',
  },
  {
    id: USER_TIERS.MASTER as UserTier,
    name: 'The Master',
    price: '$49.95',
    priceFrequency: '/ month',
    credits: 300,
    features: [
      '300 Credits / month (Rollover up to 600)',
      '5 Redos per analysis',
      'Analysis from 5 timeframes (Weekly, etc.)',
      '50 Higher-Resolution Analyses / month',
      'Live AI Coaching & AI Deep Dive Reports',
      'Full Access to Master Controls (Custom Logic)',
      'Trade Journal (up to 750 setups total)',
      '50 setups include full-res chart images',
      'Activate BYOA (Bring Your Own API) Add-on',
    ],
    creditRollover: true,
    canPurchaseCredits: true,
    hasMasterControls: true,
    periodLabel: 'credits per month',
  },
];

export const CREDIT_PACKS: CreditPack[] = [
    { name: 'Spark Pack', credits: 10, price: 2.99, pricePerCredit: 0.30, description: 'Perfect for a few extra analyses.' },
    { name: 'Booster Pack', credits: 40, price: 9.99, pricePerCredit: 0.25, description: 'Great value for active traders.' },
    { name: 'Pro Pack', credits: 100, price: 19.99, pricePerCredit: 0.20, description: 'Best value for power users.' },
];

// --- Beta Access Keys ---
export const BETA_ACCESS_KEYS = [
    'oracle-master-key-alpha-7',
    'beta-test-01',
    'friend-of-oracle',
    'dev-access-2024'
];


// --- LocalStorage Keys ---
export const SAVED_TRADES_LOCALSTORAGE_KEY = 'chartOracle_savedTrades';
export const USER_SETTINGS_LOCALSTORAGE_KEY = 'chartOracle_userSettings';
export const DASHBOARD_STRATEGIES_LOCALSTORAGE_KEY = 'chartOracle_dashboardStrategies';
export const DASHBOARD_MARKET_DATA_LOCALSTORAGE_KEY = 'chartOracle_dashboardMarketData';
export const STRATEGY_LOGIC_LOCALSTORAGE_KEY = 'chartOracle_strategyLogicData';
export const KB_DOCS_LOCALSTORAGE_KEY = 'chartOracle_knowledgeBaseDocuments';
export const CHAT_MESSAGES_LOCALSTORAGE_KEY = 'chartOracle_chatMessages';
export const AUTH_SESSION_LOCALSTORAGE_KEY = 'chartOracle_sessionActive';
export const COURSE_PROGRESS_LOCALSTORAGE_KEY = 'chartOracle_courseProgress';
export const COACHING_ONBOARDING_LOCALSTORAGE_KEY = 'chartOracle_coachingOnboardingComplete';
export const COACHING_SESSIONS_LOCALSTORAGE_KEY = 'chartOracle_coachingSessions';
export const TOKEN_USAGE_HISTORY_LOCALSTORAGE_KEY = 'chartOracle_tokenUsageHistory';
export const MARKET_DATA_CACHE_LOCALSTORAGE_KEY = 'chartOracle_marketDataCache';
export const API_CONFIG_SESSIONSTORAGE_KEY = 'chartOracle_apiConfig';
export const USER_USAGE_LOCALSTORAGE_KEY = 'chartOracle_userUsage';


// For the backup/restore feature
export const ALL_PERSISTENT_STORAGE_KEYS = [
  SAVED_TRADES_LOCALSTORAGE_KEY,
  USER_SETTINGS_LOCALSTORAGE_KEY,
  DASHBOARD_STRATEGIES_LOCALSTORAGE_KEY,
  DASHBOARD_MARKET_DATA_LOCALSTORAGE_KEY,
  STRATEGY_LOGIC_LOCALSTORAGE_KEY,
  KB_DOCS_LOCALSTORAGE_KEY,
  CHAT_MESSAGES_LOCALSTORAGE_KEY,
  AUTH_SESSION_LOCALSTORAGE_KEY,
  COURSE_PROGRESS_LOCALSTORAGE_KEY,
  COACHING_ONBOARDING_LOCALSTORAGE_KEY,
  COACHING_SESSIONS_LOCALSTORAGE_KEY,
  TOKEN_USAGE_HISTORY_LOCALSTORAGE_KEY,
  MARKET_DATA_CACHE_LOCALSTORAGE_KEY,
  USER_USAGE_LOCALSTORAGE_KEY,
];

export const DEMO_TICKERS: string[] = [
    'AAPL.US', 'MSFT.US', 'TSLA.US', 'MCD.US', 'VTI.US', 'SWPPX.US', 'EURUSD.FOREX', 'BTC-USD.CC'
];

export const EODHD_SYMBOLS: string[] = [
    // Forex
    'EURUSD.FOREX', 'GBPUSD.FOREX', 'USDJPY.FOREX', 'AUDUSD.FOREX', 'USDCAD.FOREX', 'USDCHF.FOREX', 'NZDUSD.FOREX',
    // Crypto
    'BTC-USD.CC', 'ETH-USD.CC', 'SOL-USD.CC', 'XRP-USD.CC', 'DOGE-USD.CC',
    // Stocks
    'AAPL.US', 'MSFT.US', 'GOOGL.US', 'AMZN.US', 'TSLA.US', 'NVDA.US', 'META.US',
    // Indices
    'SPY.US', 'QQQ.US', 'DIA.US', 'IWM.US',
    // Commodities
    'XAUUSD.COMM', 'XAGUSD.COMM', 'USOIL.COMM', 'UKOIL.COMM'
];


// --- Glossary for Interactive Tooltips ---
export const GLOSSARY: Record<string, Omit<GlossaryTerm, 'imageUrl'>> = {
    BULLISH_PIN_BAR: {
        displayName: 'Bullish Pin Bar',
        description: 'A candlestick with a long lower wick and a small body, signaling potential bullish reversal as buyers rejected lower prices.',
    },
    BULLISH_ENGULFING: {
        displayName: 'Bullish Engulfing',
        description: 'A two-candle pattern where a small bearish candle is completely "engulfed" by a larger bullish candle, indicating a strong shift to buying pressure.',
    },
    INSIDE_BAR_BREAKOUT: {
        displayName: 'Inside Bar False Breakout',
        description: 'An "inside bar" forms within the range of the previous candle. A false breakout occurs when price briefly breaks one way (e.g., down) and then strongly reverses, trapping traders.',
    },
    HEAD_AND_SHOULDERS: {
        displayName: 'Head and Shoulders',
        description: 'A bearish reversal pattern with three peaks: a central "head" higher than the two "shoulders". A break of the "neckline" confirms the pattern.',
    },
    FAIR_VALUE_GAP: {
        displayName: 'Fair Value Gap',
        description: 'An inefficient 3-candle price move, leaving a gap between the wicks of the 1st and 3rd candles. These gaps often act as magnets for price to return to.',
    },
     ORDER_BLOCK: {
        displayName: 'Order Block',
        description: 'The last up or down candle before an impulsive move that breaks market structure. These zones are often revisited by price, offering potential entry points.',
    },
};

// --- Academy Course Content ---

// Shared validation prompt function to reduce redundancy
const createValidationPrompt = (instruction: string, passExample: string, failExample: string, specificRules: string): string => {
    return `You are an expert trading coach AI with advanced computer vision, tasked with evaluating a student's chart homework.

**The user was given this instruction:** "${instruction}"

**Your Evaluation Protocol (Follow these steps PRECISELY):**

1.  **CRITICAL DIRECTIVE: FIND THE USER'S MARKINGS.** Your first and most important job is to find what the user has drawn on the chart. Meticulously scrutinize the entire image for ANY user-added annotations like lines, boxes, circles, arrows, or text. They may be subtle or low-contrast. Do not conclude the chart is "clean" until you are absolutely certain there are no markings.
    - **CRITICAL RULE:** The standard 'current price line' (often dotted/dashed) is NOT a user annotation. IGNORE IT.
    - **If you find ANY markings:** You MUST proceed to Step 2 to evaluate them.
    - **Only if you are 100% certain the image is a raw, unmarked chart,** should you use the "FAIL: ... no markings" response. Your response in this case MUST be: "FAIL: It looks like you've uploaded a clean chart, but I don't see any markings to evaluate. Please use your trading platform's drawing tools to mark your answer as instructed. **For best results, use a bright color (like yellow or blue) and make your lines reasonably thick.** Then resubmit the chart!"

2.  **Evaluate Markings Against Rules:** If you identified annotations in Step 1, now you must evaluate them against the specific rules for this exercise.
    **Specific Rules:**
    ${specificRules}

3.  **Formulate Final Response:** Based on your evaluation in Step 2, your response MUST begin with "PASS:" or "FAIL:".
    - **If COMPLETELY correct:** Start with "PASS:". Congratulate the user and briefly confirm why their markings are correct. Example: "PASS: ${passExample}"
    - **If INCORRECT:** Start with "FAIL:". Provide clear, constructive, and specific feedback based on the rules. Explain the error precisely. Example: "FAIL: ${failExample}"`;
};

export const FOUNDATIONAL_MODULES: CourseModule[] = [
    {
        id: 'M1',
        title: 'Module 1: The Foundations',
        description: 'Start your journey here. Learn the absolute basics of reading a chart, understanding market movements, and identifying simple trends.',
        lessons: [
            {
                id: 'M1_L1', title: 'What is a Candlestick?', estimatedTime: '8 min',
                blocks: [{
                    type: 'text',
                    content: `Welcome to your first lesson! A candlestick chart is the most common way traders visualize price. Think of each candle as a story of a battle between buyers (bulls) and sellers (bears) over a specific time period (e.g., 15 minutes, 1 day).\n\nA candle has four key price points:\n- <strong>Open:</strong> The price at the beginning of the period.\n- <strong>High:</strong> The highest price reached during the period.\n- <strong>Low:</strong> The lowest price reached during the period.\n- <strong>Close:</strong> The price at the end of the period.\n\nThe 'body' of the candle is the rectangular part, representing the range between the open and close. The thin lines, called 'wicks' or 'shadows', show the full range from high to low.\n\n- If the <strong class="text-green-400">close is higher than the open</strong>, it's a <em>bullish</em> (up) candle, usually colored green or white. Buyers won the session.\n- If the <strong class="text-red-400">close is lower than the open</strong>, it's a <em>bearish</em> (down) candle, usually colored red or black. Sellers won the session.\n\nThe length of the wicks tells a story of the battle. A long upper wick on a bearish candle means buyers tried to push the price up, but sellers overwhelmed them and pushed it back down, showing strong selling pressure. A long lower wick on a bullish candle means sellers tried to push price down, but buyers stepped in forcefully, showing strong buying pressure. Analyzing these wicks is crucial for understanding momentum.`
                },
                {
                    type: 'exercise',
                    prompt: `<strong class="text-yellow-200">Exercise: Identify a Bullish Candle.</strong> Find a bullish (up) candle on any chart. Please mark the candle's <strong>body</strong> and its <strong>lower wick</strong>.`,
                    validationPrompt: createValidationPrompt(
                        "Find a bullish (up) candle on any chart. Mark the candle's body and its lower wick.",
                        "That's perfect. You've correctly identified the body (the range between the open and close) and the lower wick, showing where sellers tried to push the price before buyers took over.",
                        "Good start, but there's a small correction needed. Remember, the 'body' of the candle is the thicker, rectangular part. The 'wick' is the thin line extending from it. Make sure you've marked those two distinct parts on a bullish (up) candle.",
                        `1.  **Check for Bullish Candle:** Confirm the user has selected a candle where the close price is higher than the open price (typically green or white).
2.  **Validate Body Marking:** Has the user clearly marked the rectangular part of the candle?
3.  **Validate Wick Marking:** Has the user clearly marked the thin line extending from the bottom of the body?`
                    )
                }]
            },
            {
                id: 'M1_L2', title: 'Understanding Timeframes', estimatedTime: '10 min',
                blocks: [{
                    type: 'text',
                    content: `Price action unfolds across different timeframes simultaneously. What looks like a strong uptrend on a 15-minute chart might just be a small upward bounce (a pullback) within a larger downtrend on the Daily chart. This concept, known as multi-timeframe analysis, is critical for successful trading.\n\nWe generally categorize timeframes into:\n- <strong>Higher Timeframes (HTF):</strong> Daily, Weekly, Monthly. These show the big picture, the main trend, and major areas of interest (major support and resistance). Your overall bias (are you generally looking to buy or sell?) should always be determined by the HTF.\n- <strong>Medium Timeframes (MTF):</strong> 4-hour, 1-hour. These help you refine the HTF bias and observe the more immediate trend.\n- <strong>Lower Timeframes (LTF):</strong> 15-minute, 5-minute, 1-minute. These are used for execution. You use the LTF to find precise, low-risk entry points that align with your HTF bias.\n\nThink of it like planning a road trip. The HTF is your map showing the final destination (e.g., New York to Los Angeles). The MTF is your regional map for the current state you're in. The LTF is your GPS giving you turn-by-turn directions for the next few miles. You need all three to navigate effectively. A common mistake for new traders is to get lost on the LTF, trading every small wiggle without understanding the larger context, which leads to trading against the dominant market flow.`
                },
                {
                    type: 'exercise',
                    prompt: `<strong class="text-yellow-200">Exercise: Contextualize Timeframes.</strong> Find any chart. In your trading platform's text tool, write "Higher Timeframe (HTF)" on the main part of the chart. Then, find a smaller pullback or consolidation within the larger trend and write "Lower Timeframe (LTF) detail" pointing to it. This demonstrates understanding the relationship between them.`,
                    validationPrompt: createValidationPrompt(
                        "On any chart, label the main trend as 'HTF' and a smaller, internal price move as 'LTF detail'.",
                        "Exactly right! You've correctly shown that a smaller price move on a lower timeframe exists within the context of the larger, higher-timeframe trend. This is the core concept of multi-timeframe analysis.",
                        "That's a good attempt, but the labels seem to be reversed. The Higher Timeframe (HTF) should point to the overall, dominant trend on the chart, while the Lower Timeframe (LTF) detail should point to a smaller fluctuation within that main trend.",
                        `1.  **Check for Two Labels:** Confirm the user has added two text labels: 'HTF' and 'LTF detail' (or similar).
2.  **Validate HTF Label:** Is the 'HTF' label pointing to the main, large-scale trend visible on the chart?
3.  **Validate LTF Label:** Is the 'LTF detail' label pointing to a smaller pullback, consolidation, or minor trend *within* the larger trend?`
                    )
                }]
            },
            {
                id: 'M1_L3', title: 'Introduction to Market Structure', estimatedTime: '25 min',
                blocks: [
                    {
                        type: 'text',
                        content: `Market Structure is the absolute backbone of technical analysis. It's how we define and track the flow of money and sentiment. Mastering this is non-negotiable.\n\n<strong class="text-green-400">Uptrend (Bullish Market):</strong> An uptrend is characterized by a series of <strong class="text-green-400">Higher Highs (HH)</strong> and <strong class="text-green-400">Higher Lows (HL)</strong>. This indicates that buyers are in control, consistently pushing the price to new heights and defending pullbacks at progressively higher levels.\n\n- <strong class="text-green-400">Higher High (HH):</strong> A swing high price point that is higher than the previous swing high.\n- <strong class="text-green-400">Higher Low (HL):</strong> A swing low price point that is higher than the previous swing low.\n\n<strong class="text-yellow-400">Critical Rule for Confirmation:</strong> For a new Higher High to be truly confirmed, the <strong>candle body</strong> must close above the previous Higher High. A mere 'wick' above the previous high is not a confirmed break; it's often a sign of a '<strong class="text-yellow-400">liquidity sweep</strong>' where price spikes up to grab orders before potentially reversing. A body close shows true strength and acceptance of higher prices.`
                    },
                    {
                        type: 'exercise',
                        prompt: `<strong class="text-yellow-200">Exercise: Identify an Uptrend.</strong>\nFind a clear example of an uptrend on a 15-minute chart. Upload a screenshot and, using your platform's drawing tools, clearly mark at least two consecutive Higher Highs (HH) and the Higher Low (HL) between them.`,
                        validationPrompt: createValidationPrompt(
                            "Find a clear example of an uptrend on a 15-minute chart. Upload a screenshot and, using your platform's drawing tools, clearly mark at least two consecutive Higher Highs (HH) and the Higher Low (HL) between them.",
                            "Perfect. You've correctly identified two consecutive Higher Highs, confirmed by body closes, and you've marked the correct Higher Low that formed between them. This is a textbook example.",
                            "This is a good attempt, and you've correctly identified a clear uptrend segment and two valid consecutive Higher Highs. However, the low point you marked is not the Higher Low that occurred *between* these two specific Higher Highs. The correct Higher Low must form chronologically *after* the first HH and *before* the second HH. Please review the relationship and re-mark this section correctly.",
                            `1.  **Identify the Trend:** Confirm the user has marked a clear uptrend.
2.  **Validate the Higher Highs (HH):** Did the price action for the second HH include a **candle body close** above the peak of the first HH?
3.  **Validate the Higher Low (HL):** Is the low the user marked the swing low that formed *between* the two Higher Highs they identified? It must occur chronologically *after* HH1 and *before* HH2.`
                        )
                    },
                    {
                        type: 'text',
                        content: `<strong class="text-red-400">Downtrend (Bearish Market):</strong> A downtrend is the opposite, characterized by a series of <strong class="text-red-400">Lower Lows (LL)</strong> and <strong class="text-red-400">Lower Highs (LH)</strong>. This shows sellers are in control.\n\n- <strong class="text-red-400">Lower Low (LL):</strong> A swing low price point that is lower than the previous swing low.\n- <strong class="text-red-400">Lower High (LH):</strong> A swing high price point that is lower than the previous swing high.\n\n<strong class="text-yellow-400">Confirmation Rule:</strong> Just like in an uptrend, a Lower Low is only confirmed by a <strong>candle body close</strong> below the previous low.`
                    },
                    {
                        type: 'exercise',
                        prompt: `<strong class="text-yellow-200">Exercise: Identify a Downtrend.</strong>\nNow find an example of a clear downtrend on a 1H (1-hour) chart. Upload a screenshot and mark at least two consecutive Lower Lows (LL) and the Lower High (LH) between them.`,
                        validationPrompt: createValidationPrompt(
                            "Find an example of a clear downtrend on a 1H (1-hour) chart. Upload a screenshot and mark at least two consecutive Lower Lows (LL) and the Lower High (LH) between them.",
                            "That's a textbook downtrend. You've correctly marked two consecutive Lower Lows confirmed by body closes, and the corresponding Lower High between them.",
                            "You're on the right track with finding a downtrend. However, make sure the Lower High you mark is the peak that forms chronologically *between* the two Lower Lows.",
                            `1.  **Identify the Trend:** Confirm the user has marked a clear downtrend.
2.  **Validate the Lower Lows (LL):** Did the price action for the second LL include a **candle body close** below the low of the first LL?
3.  **Validate the Lower High (LH):** Is the high the user marked the swing high that formed *between* the two Lower Lows they identified? It must occur chronologically *after* LL1 and *before* LL2.`
                        )
                    }
                ]
            }
        ],
        quiz: []
    }
];
