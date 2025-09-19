import React from 'react';
import { useState, useEffect, useMemo, useRef } from 'react';
import { Trade, TradeFeedback, SavedTrade, TradeOutcome, UserSettings, StrategyKey, StrategyLogicData } from '../types.ts';
import HeatMeter from './HeatMeter.tsx';
import OracleIcon from './OracleIcon.tsx';

interface TradeCardProps {
  trade: Trade | SavedTrade;
  userSettings: UserSettings;
  isModified?: boolean;
  strategyLogicData: Record<StrategyKey, StrategyLogicData>;
  
  // For saving trades from AnalysisView
  onSave?: (trade: Trade) => void;
  isSaved?: boolean;

  // For handling feedback in JournalView
  feedback?: TradeFeedback;
  onFeedbackChange?: (feedback: TradeFeedback) => void;
  isSubmittingFeedback?: boolean; // To disable buttons during submission

  // For removing trades from JournalView
  onRemove?: () => void;

  // For opening chat and image viewer in JournalView
  onViewAndDiscussTrade?: () => void;
  
  // For coaching-specific actions
  onViewCoachingLog?: () => void;
}

const TRADE_CARD_ANIMATION_STYLE_ID = 'tradecard-animations';

// Inject styles once
const ensureAnimationStyles = () => {
  if (typeof document === 'undefined' || document.getElementById(TRADE_CARD_ANIMATION_STYLE_ID)) {
    return;
  }

  const styleElement = document.createElement('style');
  styleElement.id = TRADE_CARD_ANIMATION_STYLE_ID;
  styleElement.innerHTML = `
    @keyframes fadeIn {
      from { opacity: 0; transform: translateY(-5px); }
      to { opacity: 1; transform: translateY(0); }
    }
    .animate-fadeIn {
      animation: fadeIn 0.3s ease-out;
    }
  `;
  document.head.appendChild(styleElement);
};

const extractPrice = (priceString: string | number): number => {
    if (typeof priceString === 'number') return priceString;
    if (!priceString) return NaN;
    // First, strip any HTML tags to get the raw text content.
    const textContent = String(priceString).replace(/<[^>]*>/g, ' ');
    // This regex will find all numbers, possibly with commas or decimals.
    const matches = textContent.match(/(\d{1,3}(,\d{3})*(\.\d+)?|\d+(\.\d+)?)/g);
    if (matches && matches.length > 0) {
        // Use the last number found in the string, as it's most likely the intended price.
        const lastMatch = matches[matches.length - 1];
        return parseFloat(lastMatch.replace(/,/g, ''));
    }
    return NaN;
};


const InfoIcon = (props: {className?: string}) => (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" {...props}>
        <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
    </svg>
);

const OUTCOME_BUTTONS: { outcome: TradeOutcome; label: string; color: string }[] = [
    { outcome: 'TP1 & TP2', label: 'TP1 & TP2', color: 'green' },
    { outcome: 'TP1 -> B/E', label: 'TP1 > B/E', color: 'green' },
    { outcome: 'TP1', label: 'TP1', color: 'green' },
    { outcome: 'B/E', label: 'B/E', color: 'blue' },
    { outcome: 'SL', label: 'SL', color: 'red' },
];

const TradeCard: React.FC<TradeCardProps> = ({ 
    trade, 
    userSettings,
    isModified, 
    onSave, 
    isSaved, 
    feedback, 
    onFeedbackChange,
    isSubmittingFeedback,
    onRemove,
    onViewAndDiscussTrade,
    onViewCoachingLog,
    strategyLogicData,
}) => {
    const isLong = trade.direction === 'Long';
    const [isExplanationOpen, setIsExplanationOpen] = useState(false);
    const [isEntryExplanationVisible, setIsEntryExplanationVisible] = useState(false);
    const explanationTooltipRef = useRef<HTMLDivElement>(null);
    
    // Local state for feedback input text, driven by the feedback prop
    const [feedbackText, setFeedbackText] = useState(feedback?.text || '');
    const isCoachingTrade = 'isFromCoaching' in trade && trade.isFromCoaching;

    const rr = useMemo(() => {
        const entry = extractPrice(trade.entry);
        const sl = extractPrice(trade.stopLoss);
        const tp1 = extractPrice(trade.takeProfit1);

        if (isNaN(entry) || isNaN(sl) || isNaN(tp1)) {
            return 0;
        }

        const risk = Math.abs(entry - sl);
        const reward = Math.abs(tp1 - entry);

        if (risk === 0) {
            return 0;
        }

        return reward / risk;
    }, [trade.entry, trade.stopLoss, trade.takeProfit1]);

    const rrColor = useMemo(() => {
        if (rr >= 2) return 'text-green-400';
        if (rr >= 1) return 'text-yellow-400';
        return 'text-red-400';
    }, [rr]);

    const isEntryDescriptive = useMemo(() => String(trade.entry || '').includes(' '), [trade.entry]);
    const isSlDescriptive = useMemo(() => String(trade.stopLoss || '').includes(' '), [trade.stopLoss]);

    const explanationHtml = useMemo(() => {
        if (!trade.explanation) return '';

        // Special formatting for informational "no entry" cards.
        if (isEntryDescriptive) {
            // Regex to find the first sentence.
            const firstSentenceRegex = /^(.*?[.?!])(\s*)/;
            const match = trade.explanation.match(firstSentenceRegex);

            if (match) {
                const firstSentence = match[1];
                // Apply backtick styling to the first sentence as well
                const styledFirstSentence = firstSentence.replace(/`([^`]+)`/g, '<strong style="color: #FBBF24; font-weight: 600;">$1</strong>');
                const restOfText = trade.explanation.substring(match[0].length);

                const formattedRest = restOfText
                    .replace(/`([^`]+)`/g, '<strong style="color: #FBBF24; font-weight: 600;">$1</strong>')
                    .split(/\n+/) // Split by one or more newlines
                    .map(p => p.trim()) // Trim whitespace from each potential paragraph
                    .filter(p => p) // Remove empty paragraphs
                    .map(p => `<p>${p}</p>`)
                    .join('');

                return `<p class="text-yellow-300 font-semibold mb-2">${styledFirstSentence}</p>${formattedRest}`;
            }
        }

        // Standard formatting for regular trade explanations
        return trade.explanation
            .replace(/`([^`]+)`/g, '<strong style="color: #FBBF24; font-weight: 600;">$1</strong>')
            .split(/\n+/)
            .map(p => p.trim())
            .filter(p => p)
            .map(p => `<p>${p}</p>`)
            .join('');
    }, [trade.explanation, isEntryDescriptive]);

    useEffect(() => {
        ensureAnimationStyles();
    }, []);
    
    // Sync local text state if the prop changes from outside
    useEffect(() => {
        setFeedbackText(feedback?.text || '');
    }, [feedback?.text]);

    // This effect repositions the tooltip to stay within the viewport if it overflows.
    useEffect(() => {
        if (isEntryExplanationVisible && explanationTooltipRef.current) {
            const tooltip = explanationTooltipRef.current;
            const rect = tooltip.getBoundingClientRect();
            const screenPadding = 16; // 1rem

            // Reset any previous transform before recalculating
            tooltip.style.transform = 'translateX(-50%)';

            // Check right boundary
            const overflowRight = rect.right - (window.innerWidth - screenPadding);
            if (overflowRight > 0) {
                tooltip.style.transform = `translateX(calc(-50% - ${overflowRight}px))`;
            }

            // Check left boundary
            const overflowLeft = screenPadding - rect.left;
            if (overflowLeft > 0) {
                tooltip.style.transform = `translateX(calc(-50% + ${overflowLeft}px))`;
            }
        }
    }, [isEntryExplanationVisible]);


    const handleToggleExplanation = () => setIsExplanationOpen(prev => !prev);
    
    const handleOutcomeChange = (newOutcome: TradeOutcome) => {
        if (!onFeedbackChange || isSubmittingFeedback) return;
        onFeedbackChange({ outcome: newOutcome, text: feedbackText });
    };

    const handleSubmitFeedback = () => {
        if (!onFeedbackChange || !feedback?.outcome || isSubmittingFeedback) return;
        
        // The parent component will handle the logic of marking as 'submitted'
        // and persisting the data.
        onFeedbackChange({ outcome: feedback.outcome, text: feedbackText });
    };

    const titleSymbol = trade.symbol && trade.symbol !== "N/A" ? `${trade.symbol} - ` : "";
    const showFeedbackSection = !!onFeedbackChange; // Show feedback only in Journal view

    return (
        <div className="bg-[var(--color-bg-secondary)] border border-[var(--color-border-primary)] rounded-lg p-4 flex flex-col h-full">
            {/* Main card content */}
            <div className="space-y-4">
                <div className="flex justify-between items-start">
                    <div className="flex-grow space-y-1">
                        <div className="flex items-center space-x-2 flex-wrap">
                            <h3 
                                className={`font-bold ${isLong ? 'text-teal-400' : 'text-red-400'}`}
                                style={{ fontSize: `${userSettings.headingFontSize}px` }}
                            >
                                {titleSymbol}{trade.direction} {trade.type}
                            </h3>
                            {isModified && (
                                <span className="px-2 py-0.5 text-xs font-semibold bg-purple-600 text-purple-100 rounded-full">
                                    MODIFIED
                                </span>
                            )}
                        </div>
                         {'savedDate' in trade && (
                             <p className="text-xs text-gray-500">
                                 Journaled: {new Date(trade.savedDate).toLocaleString()}
                             </p>
                         )}
                    </div>
                    {onSave && (
                        <button
                            onClick={() => onSave(trade)}
                            disabled={isSaved}
                            className={`px-3 py-1 text-sm font-semibold rounded-md transition-colors ${
                                isSaved 
                                ? 'bg-green-600 text-white cursor-default' 
                                : 'bg-blue-600 text-white hover:bg-blue-500'
                            }`}
                        >
                            {isSaved ? 'Saved ✔' : 'Save Trade'}
                        </button>
                    )}
                </div>

                <HeatMeter level={trade.heat} />

                {'savedDate' in trade && (
                    <div className="p-2 bg-[var(--color-bg-primary)]/50 rounded-md border border-[var(--color-border-primary)]/50 text-xs">
                        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-1 text-gray-400">
                            <span className="truncate">
                                <span className="font-semibold text-gray-300">Strategies: </span>
                                <span className="text-purple-300" title={(trade as SavedTrade).strategiesUsed.map(s => strategyLogicData[s]?.name || s).join(', ')}>
                                    {(trade as SavedTrade).strategiesUsed.map(s => strategyLogicData[s]?.name || s).join(', ')}
                                </span>
                            </span>
                            {(trade as SavedTrade).analysisContext.realTimeContextWasUsed && (
                                <span className="text-green-400 flex items-center flex-shrink-0">
                                    <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-1" viewBox="0 0 20 20" fill="currentColor">
                                        <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                                    </svg>
                                    Real-Time Context
                                </span>
                            )}
                        </div>
                    </div>
                )}

                <div className="grid grid-cols-2 gap-x-4 gap-y-3">
                    <div className="col-span-2 text-left">
                        <p className="text-gray-400 uppercase font-semibold" style={{ fontSize: `${userSettings.uiFontSize - 2}px` }}>Entry</p>
                        <div
                            className={`${isEntryDescriptive ? '' : 'font-mono text-center'} font-bold text-white mt-1`}
                            style={{ fontSize: `${isEntryDescriptive ? userSettings.dataFontSize - 2 : userSettings.dataFontSize}px`, lineHeight: isEntryDescriptive ? '1.5' : '1' }}
                            dangerouslySetInnerHTML={{ __html: trade.entry || '-' }}
                        />
                         <div className={`mt-1 flex items-center ${isEntryDescriptive ? 'justify-start' : 'justify-center'} space-x-2`}>
                             <span className={`px-2 py-0.5 text-xs font-semibold rounded-full ${trade.entryType === 'Limit Order' ? 'bg-blue-600 text-blue-100' : 'bg-orange-600 text-orange-100'}`}>
                                {trade.entryType}
                            </span>
                            {trade.entryType === 'Confirmation Entry' && trade.entryExplanation && (
                                <div className="relative">
                                    <button 
                                        onMouseEnter={() => setIsEntryExplanationVisible(true)} 
                                        onMouseLeave={() => setIsEntryExplanationVisible(false)}
                                        onClick={() => setIsEntryExplanationVisible(p => !p)}
                                        className="text-gray-400 hover:text-yellow-300"
                                    >
                                        <InfoIcon className="w-4 h-4" />
                                    </button>
                                    {isEntryExplanationVisible && (
                                        <div 
                                            ref={explanationTooltipRef}
                                            className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 w-64 bg-[var(--color-bg-primary)] text-white rounded-lg py-2 px-3 z-10 border border-[var(--color-border-secondary)] shadow-lg text-left animate-fadeIn prose prose-sm prose-invert max-w-none" 
                                            style={{ fontSize: `${userSettings.chatFontSize - 1}px` }}
                                            dangerouslySetInnerHTML={{ __html: trade.entryExplanation }}
                                        />
                                    )}
                                </div>
                            )}
                        </div>
                    </div>
                    <div className="col-span-2 text-left">
                        <p className="text-red-400 uppercase font-semibold" style={{ fontSize: `${userSettings.uiFontSize - 2}px` }}>Stop Loss</p>
                         <div
                            className={`${isSlDescriptive ? '' : 'font-mono text-center'} font-bold text-white mt-1`}
                            style={{ fontSize: `${isSlDescriptive ? userSettings.dataFontSize - 2 : userSettings.dataFontSize}px`, lineHeight: isSlDescriptive ? '1.5' : '1' }}
                            dangerouslySetInnerHTML={{ __html: trade.stopLoss || '-' }}
                        />
                    </div>

                    <div className="col-span-2 text-center py-2 my-1 border-y-2 border-[var(--color-border-primary)]/50">
                        <p className={`font-mono font-bold ${rrColor}`} style={{ fontSize: `${userSettings.dataFontSize + 8}px` }}>{rr.toFixed(2)} : 1</p>
                        <p className="text-gray-400 uppercase font-semibold" style={{ fontSize: `${userSettings.uiFontSize - 2}px` }}>Risk / Reward Ratio <span className="normal-case">(to TP1)</span></p>
                    </div>

                    <div className="text-center">
                        <p className="text-green-400 uppercase font-semibold" style={{ fontSize: `${userSettings.uiFontSize - 2}px` }}>TP 1</p>
                        <p 
                            className="font-mono font-bold text-white" 
                            style={{ fontSize: `${userSettings.dataFontSize}px` }}
                            dangerouslySetInnerHTML={{ __html: trade.takeProfit1 || '-' }}
                        />
                    </div>
                    <div className="text-center">
                        <p className="text-green-400 uppercase font-semibold" style={{ fontSize: `${userSettings.uiFontSize - 2}px` }}>TP 2</p>
                        <p 
                            className="font-mono font-bold text-white" 
                            style={{ fontSize: `${userSettings.dataFontSize}px` }}
                             dangerouslySetInnerHTML={{ __html: trade.takeProfit2 || '-' }}
                        />
                    </div>
                </div>

                {trade.tradeManagement && (
                    <div className="text-gray-300 bg-[var(--color-bg-primary)]/50 p-3 rounded-md border border-[var(--color-border-primary)]/50 mt-1" style={{ fontSize: `${userSettings.uiFontSize}px` }}>
                        <h5 className="font-semibold text-gray-200 mb-1">Trade Management Plan:</h5>
                        <ul className="list-disc list-inside space-y-1 text-xs">
                           <li dangerouslySetInnerHTML={{ __html: trade.tradeManagement.partial_take_profit_1 }}></li>
                           <li dangerouslySetInnerHTML={{ __html: trade.tradeManagement.move_to_breakeven_condition }}></li>
                        </ul>
                    </div>
                )}

                <div>
                    <div 
                        className="flex items-center cursor-pointer select-none"
                        onClick={handleToggleExplanation}
                        role="button"
                        tabIndex={0}
                        aria-expanded={isExplanationOpen}
                    >
                        <p className="text-xs text-gray-400 font-semibold mb-1">AI Explanation:</p>
                        <span className="ml-2 text-yellow-400 transition-transform duration-200" style={{ transform: isExplanationOpen ? 'rotate(90deg)' : 'rotate(0deg)' }}>
                            ▶
                        </span>
                    </div>
                    {isExplanationOpen && (
                        <div 
                            className="text-gray-300 bg-[var(--color-bg-primary)]/50 p-3 rounded-md border border-[var(--color-border-primary)]/50 mt-1 animate-fadeIn prose prose-sm prose-invert max-w-none" 
                            style={{ fontSize: `${userSettings.chatFontSize}px` }}
                            dangerouslySetInnerHTML={{ __html: explanationHtml }}
                        ></div>
                    )}
                </div>
            </div>

            {/* Spacer to push feedback to the bottom */}
            <div className="flex-grow"></div>

            {/* Feedback Section (only for Journal) */}
            {showFeedbackSection && (
                <div className="pt-4 mt-4 border-t border-[var(--color-border-primary)]/50">
                    <div className="space-y-3">
                        <h4 className="font-semibold text-gray-300 text-center" style={{ fontSize: `${userSettings.uiFontSize}px` }}>Log Trade Outcome</h4>
                        
                        <div className="flex flex-wrap gap-2 justify-center">
                            {OUTCOME_BUTTONS.map(({ outcome, label, color }) => {
                                const isSelected = feedback?.outcome === outcome;
                                const colorClasses = {
                                    green: `bg-green-500/20 border-green-500 text-green-300`,
                                    red: `bg-red-500/20 border-red-500 text-red-300`,
                                    blue: `bg-blue-500/20 border-blue-500 text-blue-300`,
                                };
                                const hoverClasses = {
                                    green: 'hover:border-green-500',
                                    red: 'hover:border-red-500',
                                    blue: 'hover:border-blue-500',
                                }
                                return (
                                     <button
                                        key={outcome}
                                        onClick={() => handleOutcomeChange(outcome)}
                                        disabled={isSubmittingFeedback}
                                        className={`flex-grow p-2 rounded-md border-2 transition-colors text-xs font-semibold disabled:opacity-50 ${
                                            isSelected
                                            ? colorClasses[color as keyof typeof colorClasses]
                                            : `bg-[var(--color-bg-tertiary)]/50 border-[var(--color-border-secondary)] text-gray-400 ${hoverClasses[color as keyof typeof hoverClasses]}`
                                        }`}
                                        aria-pressed={isSelected}
                                    >
                                        {label}
                                    </button>
                                );
                            })}
                        </div>

                        {feedback?.outcome && (
                            <div className="space-y-2 animate-fadeIn">
                                <textarea
                                    value={feedbackText}
                                    onChange={(e) => setFeedbackText(e.target.value)}
                                    onBlur={handleSubmitFeedback} // Save text on blur
                                    placeholder="Optional: Add journaling notes..."
                                    rows={2}
                                    className="w-full bg-[var(--color-bg-primary)]/70 p-2 rounded-md text-gray-300 border border-[var(--color-border-secondary)] focus:ring-yellow-500 focus:border-yellow-500 transition-colors disabled:opacity-50"
                                    style={{ fontSize: `${userSettings.uiFontSize}px` }}
                                    aria-label="Feedback comment"
                                    disabled={isSubmittingFeedback}
                                />
                            </div>
                        )}
                        
                        <div className="flex justify-between items-center pt-3 mt-3 border-t border-[var(--color-border-primary)]/50">
                            {isCoachingTrade ? (
                                onViewCoachingLog && (
                                    <button onClick={onViewCoachingLog} className="flex items-center gap-2 text-sm text-purple-300 hover:text-purple-200">
                                        <OracleIcon className="w-5 h-5"/> View Coaching Log
                                    </button>
                                )
                            ) : (
                                onViewAndDiscussTrade && (
                                    <button 
                                        onClick={onViewAndDiscussTrade} 
                                        className="flex items-center gap-3 p-2 pr-4 rounded-lg text-yellow-400 bg-[var(--color-bg-primary)]/50 hover:bg-yellow-400/20 transition-all duration-200"
                                        aria-label="View charts and discuss this trade" 
                                        title="View Charts & Discuss with Oracle"
                                    >
                                        <OracleIcon className="w-10 h-10" />
                                        <span className="font-bold">View & Discuss</span>
                                    </button>
                                )
                            )}
                            
                            {onRemove && (
                                <button
                                    onClick={onRemove}
                                    className="p-2 rounded-full text-gray-500 hover:text-red-400 hover:bg-red-500/10 transition-colors"
                                    aria-label="Remove from journal"
                                    title="Remove from Journal"
                                >
                                     <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                                       <path strokeLinecap="round" strokeLinejoin="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                                    </svg>
                                </button>
                            )}
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default TradeCard;