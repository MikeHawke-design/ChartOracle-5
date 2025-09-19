import React, { useMemo, useState, useEffect } from 'react';
import { SavedTrade, TradeFeedback, StrategyLogicData, StrategyKey, SavedCoachingSession, UserSettings, UploadedImageData } from '../types.ts';
import TradeCard from './TradeCard.tsx';
import PerformanceChart from './PerformanceChart.tsx';
import ConfirmationModal from './ConfirmationModal.tsx';
import ImageViewerModal from './ImageViewerModal.tsx';
import OracleIcon from './OracleIcon.tsx';
import { getImage } from '../idb.ts';

interface JournalViewProps {
    savedTrades: SavedTrade[];
    onUpdateTradeFeedback: (tradeId: string, feedback: TradeFeedback) => void;
    onRemoveTrade: (tradeId:string) => void;
    onOpenChatWithTradeContext: (trade: SavedTrade) => void;
    strategyLogicData: Record<StrategyKey, StrategyLogicData>;
    savedCoachingSessions: SavedCoachingSession[];
    onUpdateCoachingSessionNotes: (sessionId: string, notes: string) => void;
    onContinueCoachingSession: (session: SavedCoachingSession) => void;
    onDeleteCoachingSession: (sessionId: string) => void;
    onStartNewCoachingSession: () => void;
    userSettings: UserSettings;
    onAddPostTradeImage: (tradeId: string, imageData: UploadedImageData) => Promise<void>;
}

const TrashIcon = (props:{className?:string}) => <svg {...props} xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M8.75 1A2.75 2.75 0 0 0 6 3.75v.443c-.795.077-1.58.22-2.365.468a.75.75 0 1 0 .214 1.482l.025.007c.786.246 1.573.393 2.37.468v6.618A2.75 2.75 0 0 0 8.75 18h2.5A2.75 2.75 0 0 0 14 15.25V5.162c.797-.075 1.585-.222 2.37-.468a.75.75 0 1 0-.214-1.482l-.025-.007a33.58 33.58 0 0 0-2.365-.468V3.75A2.75 2.75 0 0 0 11.25 1h-2.5ZM10 4c.84 0 1.673.025 2.5.075V15.25a1.25 1.25 0 0 1-1.25 1.25h-2.5A1.25 1.25 0 0 1 7.5 15.25V4.075C8.327 4.025 9.16 4 10 4Z" clipRule="evenodd" /></svg>;

const ChatMessageImage: React.FC<{ imageKey: string }> = ({ imageKey }) => {
    const [imageUrl, setImageUrl] = useState<string | null>(null);

    useEffect(() => {
        let isMounted = true;
        getImage(imageKey).then(url => {
            if (isMounted && url) setImageUrl(url);
        });
        return () => { isMounted = false; };
    }, [imageKey]);

    const handleImageClick = () => {
        if (!imageUrl) return;
        const win = window.open();
        win?.document.write(`<body style="margin:0; background: #111827;"><img src="${imageUrl}" style="max-width: 100%; max-height: 100vh; margin: auto; display: block;"></body>`);
    };

    if (!imageUrl) {
        return <div className="animate-pulse bg-gray-600 rounded-md w-full h-32 my-2"></div>;
    }

    return (
        <img
            src={imageUrl}
            alt="Chat image"
            className="max-w-xs rounded-md my-2 cursor-pointer transition-transform hover:scale-105"
            onClick={handleImageClick}
        />
    );
};

const ExpandIcon = (props: { className?: string }) => <svg {...props} xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" d="M3.75 3.75v4.5m0-4.5h4.5m-4.5 0L9 9M20.25 20.25v-4.5m0 4.5h-4.5m4.5 0L15 15m-6 0L3.75 20.25m9-9l6.25-6.25" /></svg>;
const CompressIcon = (props: { className?: string }) => <svg {...props} xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" d="M9 9V4.5M9 9H4.5M9 9L3.75 3.75M9 15v4.5M9 15H4.5M9 15l-5.25 5.25M15 9h4.5M15 9V4.5M15 9l5.25-5.25M15 15h4.5M15 15v4.5M15 15l5.25 5.25" /></svg>;


interface AnalyticsData {
    totalTrades: number;
    winCount: number;
    lossCount: number;
    breakevenCount: number;
    winRate: number;
    totalR: number;
    topStrategy: string;
}

const calculateRR = (trade: SavedTrade, target: 'TP1' | 'TP2'): number => {
    const entry = parseFloat(String(trade.entry).replace(/,/g, ''));
    const sl = parseFloat(String(trade.stopLoss).replace(/,/g, ''));
    const tp = parseFloat(String(target === 'TP1' ? trade.takeProfit1 : trade.takeProfit2).replace(/,/g, ''));

    if (isNaN(entry) || isNaN(sl) || isNaN(tp)) return 0;
    
    const risk = Math.abs(entry - sl);
    if (risk === 0) return 0;

    const reward = Math.abs(tp - entry);
    return reward / risk;
};

// Calculate the result of a single trade in "R" (risk units)
const calculateTradeResultInR = (trade: SavedTrade): number => {
    if (!trade.feedback.outcome) return 0;
    
    // A simplified model assuming 50% exit at TP1 and 50% at TP2 if tradeManagement is not specified.
    const partialExitPercentage = 0.5; 

    switch (trade.feedback.outcome) {
        case 'SL':
            return -1;
        case 'B/E':
            return 0;
        case 'TP1':
            return calculateRR(trade, 'TP1');
        case 'TP1 -> B/E':
             // Assumes partial profit was taken before the rest was closed at breakeven
            return calculateRR(trade, 'TP1') * partialExitPercentage;
        case 'TP1 & TP2':
            const r1 = calculateRR(trade, 'TP1');
            const r2 = calculateRR(trade, 'TP2');
            // Blended R-value based on partial exits
            return (r1 * partialExitPercentage) + (r2 * (1 - partialExitPercentage));
        default:
            return 0;
    }
};


const JournalView: React.FC<JournalViewProps> = ({ 
    savedTrades, 
    onUpdateTradeFeedback, 
    onRemoveTrade, 
    onOpenChatWithTradeContext,
    strategyLogicData,
    savedCoachingSessions,
    onUpdateCoachingSessionNotes,
    onContinueCoachingSession,
    onDeleteCoachingSession,
    onStartNewCoachingSession,
    userSettings,
    onAddPostTradeImage
}) => {
    const [activeTab, setActiveTab] = useState<'trades' | 'sessions'>('trades');
    
    const [tradeToRemove, setTradeToRemove] = useState<SavedTrade | null>(null);
    const [viewingImagesForTrade, setViewingImagesForTrade] = useState<SavedTrade | null>(null);
    const [viewingCoachingLogForTrade, setViewingCoachingLogForTrade] = useState<SavedTrade | null>(null);

    
    const [expandedSessionId, setExpandedSessionId] = useState<string | null>(null);
    const [sessionNotes, setSessionNotes] = useState<Record<string, string>>({});
    const [sessionToDelete, setSessionToDelete] = useState<SavedCoachingSession | null>(null);

    // New state for font size and full-screen view
    const [sessionFontSize, setSessionFontSize] = useState<number>(14);
    const [fullscreenSessionId, setFullscreenSessionId] = useState<string | null>(null);


    const handleOpenRemoveModal = (trade: SavedTrade) => {
        setTradeToRemove(trade);
    };

    const handleConfirmRemove = () => {
        if (tradeToRemove) {
            onRemoveTrade(tradeToRemove.id);
            setTradeToRemove(null);
        }
    };
    
    const handleConfirmSessionRemove = () => {
        if (sessionToDelete) {
            onDeleteCoachingSession(sessionToDelete.id);
            setSessionToDelete(null);
        }
    };

    const handleNotesChange = (sessionId: string, text: string) => {
        setSessionNotes(prev => ({...prev, [sessionId]: text}));
    };

    const handleSaveNotes = (sessionId: string) => {
        if (sessionNotes[sessionId] !== undefined) {
            onUpdateCoachingSessionNotes(sessionId, sessionNotes[sessionId]);
        }
    };
    
    const handleToggleExpandSession = (sessionId: string) => {
        setExpandedSessionId(prev => {
            if (prev === sessionId) {
                // If notes were being edited, save them on collapse
                handleSaveNotes(sessionId);
                return null;
            } else {
                // Pre-fill notes when expanding
                const session = savedCoachingSessions.find(s => s.id === sessionId);
                if (session) {
                    setSessionNotes(prev => ({...prev, [sessionId]: session.userNotes}));
                }
                return sessionId;
            }
        });
    };
    
    const analytics: AnalyticsData = useMemo(() => {
        const tradesWithOutcome = savedTrades.filter(t => t.feedback.outcome);
        
        const winCount = tradesWithOutcome.filter(t => (t.feedback.outcome?.startsWith('TP'))).length;
        const lossCount = tradesWithOutcome.filter(t => t.feedback.outcome === 'SL').length;
        const breakevenCount = tradesWithOutcome.filter(t => t.feedback.outcome === 'B/E').length;
        
        const totalRatedForWinRate = winCount + lossCount;
        
        const strategyFrequency: Record<string, number> = {};
        tradesWithOutcome
            .filter(t => t.feedback.outcome?.startsWith('TP')) // Only count wins for top strategy
            .forEach(t => {
                t.strategiesUsed.forEach(strategyKey => {
                    const stratName = strategyLogicData[strategyKey]?.name || strategyKey;
                    strategyFrequency[stratName] = (strategyFrequency[stratName] || 0) + 1;
                });
            });

        const topStrategyName = Object.keys(strategyFrequency).reduce((a, b) => strategyFrequency[a] > strategyFrequency[b] ? a : b, 'N/A');

        const totalRValue = tradesWithOutcome.reduce((sum, trade) => sum + calculateTradeResultInR(trade), 0);

        return {
            totalTrades: savedTrades.length,
            winCount,
            lossCount,
            breakevenCount,
            winRate: totalRatedForWinRate > 0 ? Math.round((winCount / totalRatedForWinRate) * 100) : 0,
            totalR: parseFloat(totalRValue.toFixed(2)),
            topStrategy: topStrategyName
        };
    }, [savedTrades, strategyLogicData]);

    const performanceData = useMemo(() => {
        const tradesForChart = [...savedTrades]
            .filter(t => t.feedback.outcome) // Only include trades with a logged outcome
            .sort((a, b) => new Date(a.savedDate).getTime() - new Date(b.savedDate).getTime());
        
        let cumulativeR = 0;
        const dataPoints = [{x:0, y:0}];

        tradesForChart.forEach((trade) => {
            cumulativeR += calculateTradeResultInR(trade);
            dataPoints.push({ x: dataPoints.length, y: parseFloat(cumulativeR.toFixed(2))});
        });

        return dataPoints.length > 1 ? dataPoints.map(p => p.y) : [0];
    }, [savedTrades]);
    
    const sortedTradesForDisplay = [...savedTrades].sort((a, b) => new Date(b.savedDate).getTime() - new Date(a.savedDate).getTime());
    const sortedSessionsForDisplay = [...savedCoachingSessions].sort((a, b) => new Date(b.savedDate).getTime() - new Date(a.savedDate).getTime());

    const renderCoachingLogModal = () => {
        if (!viewingCoachingLogForTrade) return null;

        const trade = viewingCoachingLogForTrade;
        const chatHistory = trade.coachingSessionChat || [];

        return (
             <div className="fixed inset-0 bg-gray-900/80 flex items-center justify-center z-[100] p-4" onClick={() => setViewingCoachingLogForTrade(null)}>
                <div className="bg-gray-800 p-4 md:p-6 rounded-lg shadow-xl max-w-2xl w-full border border-yellow-500/50 max-h-[90vh] flex flex-col" onClick={e => e.stopPropagation()}>
                    <div className="flex justify-between items-center pb-4 border-b border-gray-700">
                        <h2 className="text-xl font-bold text-yellow-400">Coaching Log: {trade.symbol} {trade.direction}</h2>
                        <button onClick={() => setViewingCoachingLogForTrade(null)} className="p-1 rounded-full text-gray-400 hover:text-white">&times;</button>
                    </div>
                    <div className="flex-grow overflow-y-auto pt-4 space-y-4 pr-2">
                        {chatHistory.length > 0 ? chatHistory.map(msg => (
                            <div key={msg.id} className={`flex items-start gap-2 ${msg.sender === 'user' ? 'justify-end' : 'justify-start'}`}>
                                {msg.sender === 'oracle' && <OracleIcon className="w-6 h-6 flex-shrink-0 mt-1" />}
                                <div className={`p-2 rounded-lg max-w-[85%] text-sm ${msg.sender === 'user' ? 'bg-blue-600/20 text-blue-100' : 'bg-gray-700 text-gray-200'}`}>
                                    {msg.imageKeys && msg.imageKeys.map((key, idx) => <ChatMessageImage key={idx} imageKey={key} />)}
                                    {msg.text && <div dangerouslySetInnerHTML={{ __html: msg.text }} />}
                                </div>
                            </div>
                        )) : (
                            <p className="text-gray-500 text-center">No chat history was saved for this trade.</p>
                        )}
                    </div>
                </div>
            </div>
        );
    };

    const renderTradeLog = () => (
        <div className="space-y-8">
            {savedTrades.length > 0 && (
                <div className="bg-gray-800 rounded-lg p-4 md:p-6 border border-gray-700">
                     <h3 className="font-bold text-yellow-400 mb-4 text-center" style={{ fontSize: `${userSettings.headingFontSize}px` }}>Performance Curve (in R units)</h3>
                     <PerformanceChart data={performanceData} />
                </div>
            )}
            <div className="bg-gray-800 rounded-lg p-6 border border-gray-700">
                <h3 className="font-bold text-yellow-400 mb-4 text-center" style={{ fontSize: `${userSettings.headingFontSize}px` }}>Performance Analytics</h3>
                <div className="grid grid-cols-2 md:grid-cols-5 gap-4 text-center">
                     <div className="bg-gray-900/50 p-4 rounded-lg"><p className="font-bold text-white" style={{ fontSize: `${userSettings.dataFontSize + 4}px` }}>{analytics.totalTrades}</p><p className="text-gray-400" style={{ fontSize: `${userSettings.uiFontSize}px` }}>Total Logged</p></div>
                     <div className="bg-gray-900/50 p-4 rounded-lg"><p className={`font-bold ${analytics.winRate >= 50 ? 'text-green-400' : 'text-red-400'}`} style={{ fontSize: `${userSettings.dataFontSize + 4}px` }}>{analytics.winRate}%</p><p className="text-gray-400" style={{ fontSize: `${userSettings.uiFontSize}px` }}>Win Rate</p></div>
                     <div className="bg-gray-900/50 p-4 rounded-lg"><p className="font-bold" style={{ fontSize: `${userSettings.dataFontSize + 4}px` }}><span className="text-green-400">{analytics.winCount}</span>/<span className="text-red-400">{analytics.lossCount}</span>/<span className="text-blue-400">{analytics.breakevenCount}</span></p><p className="text-gray-400" style={{ fontSize: `${userSettings.uiFontSize}px` }}>W/L/BE</p></div>
                     <div className="bg-gray-900/50 p-4 rounded-lg"><p className="font-bold text-yellow-300" style={{ fontSize: `${userSettings.dataFontSize + 4}px` }}>{analytics.totalR}R</p><p className="text-gray-400" style={{ fontSize: `${userSettings.uiFontSize}px` }}>Total R</p></div>
                     <div className="bg-gray-900/50 p-4 rounded-lg"><p className="font-bold text-purple-400 truncate" title={analytics.topStrategy} style={{ fontSize: `${userSettings.dataFontSize + 4}px` }}>{analytics.topStrategy}</p><p className="text-gray-400" style={{ fontSize: `${userSettings.uiFontSize}px` }}>Top Strategy (Wins)</p></div>
                </div>
                <p className="text-xs text-gray-500 mt-4 text-center">Metrics based on trades with a logged outcome. Win rate excludes break-even trades.</p>
            </div>
            <div>
                <h3 className="font-semibold text-white mb-4 text-center" style={{ fontSize: `${userSettings.headingFontSize}px` }}>Logged Trade History</h3>
                {sortedTradesForDisplay.length > 0 ? (
                    <div className="grid grid-cols-1 lg:grid-cols-2 2xl:grid-cols-3 gap-4">
                        {sortedTradesForDisplay.map(trade => (
                            <TradeCard 
                                key={trade.id} 
                                trade={trade} 
                                userSettings={userSettings} 
                                feedback={trade.feedback} 
                                onFeedbackChange={(newFeedback) => onUpdateTradeFeedback(trade.id, newFeedback)} 
                                onRemove={() => handleOpenRemoveModal(trade)} 
                                onViewAndDiscussTrade={() => setViewingImagesForTrade(trade)}
                                onViewCoachingLog={() => setViewingCoachingLogForTrade(trade)} 
                                strategyLogicData={strategyLogicData}
                            />
                        ))}
                    </div>
                ) : (
                    <div className="text-center bg-gray-800/50 rounded-lg py-12"><svg className="mx-auto h-12 w-12 text-gray-500" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.042A8.967 8.967 0 0 0 6 3.75c-1.052 0-2.062.18-3 .512v14.25A8.987 8.987 0 0 1 6 18c2.305 0 4.408.867 6 2.292m0-14.25a8.966 8.966 0 0 1 6-2.292c1.052 0 2.062.18 3 .512v14.25A8.987 8.987 0 0 0 18 18a8.967 8.967 0 0 0-6 2.292m0-14.25v14.25" /></svg><h3 className="mt-2 font-medium text-white" style={{ fontSize: `${userSettings.uiFontSize}px` }}>No saved trades</h3><p className="mt-1 text-gray-500" style={{ fontSize: `${userSettings.uiFontSize}px` }}>Get started by saving a trade from an analysis.</p></div>
                )}
            </div>
        </div>
    );
    
    const renderSessionContent = (session: SavedCoachingSession, isFullscreenView: boolean) => (
         <>
            <div className={`flex items-center gap-4 p-2 bg-gray-900/30 rounded-t-md mb-2 ${isFullscreenView ? 'flex-shrink-0' : ''}`}>
                 <label htmlFor="font-size" className="text-xs text-gray-400">Font Size: {sessionFontSize}px</label>
                 <input type="range" id="font-size" min="12" max="20" step="1" value={sessionFontSize} onChange={(e) => setSessionFontSize(Number(e.target.value))} className="w-32 h-1 bg-gray-600 rounded-lg appearance-none cursor-pointer accent-yellow-400" />
                 <div className="flex-grow"></div>
                 <button onClick={() => isFullscreenView ? setFullscreenSessionId(null) : setFullscreenSessionId(session.id)} className="p-1 text-gray-400 hover:text-yellow-300 transition-colors" title={isFullscreenView ? "Compress View" : "Expand View"}>
                    {isFullscreenView ? <CompressIcon className="w-5 h-5"/> : <ExpandIcon className="w-5 h-5" />}
                 </button>
            </div>
             <div className="space-y-2 max-h-96 overflow-y-auto bg-gray-900/50 p-3 rounded-md flex-grow" style={{fontSize: `${sessionFontSize}px`}}>
                {session.chatHistory.map(msg => (
                    <div key={msg.id} className={`flex items-start gap-2 ${msg.sender === 'user' ? 'justify-end' : 'justify-start'}`}>
                        {msg.sender === 'oracle' && <OracleIcon className="w-6 h-6 flex-shrink-0" />}
                        <div className={`p-2 rounded-lg max-w-[85%] ${msg.sender === 'user' ? 'bg-yellow-500/20' : 'bg-gray-700'}`}>
                            {msg.imageKeys && msg.imageKeys.map((key, idx) => <ChatMessageImage key={idx} imageKey={key} />)}
                            {msg.text && <div dangerouslySetInnerHTML={{ __html: msg.text }} />}
                        </div>
                    </div>
                ))}
            </div>
            <div className={`space-y-2 mt-2 ${isFullscreenView ? 'flex-shrink-0 w-full' : ''}`}>
                 <label htmlFor={`notes-${session.id}`} className="block font-medium text-gray-300" style={{ fontSize: `${userSettings.uiFontSize}px` }}>Your Notes & Reflections:</label>
                 <textarea id={`notes-${session.id}`} value={sessionNotes[session.id] || ''} onChange={e => handleNotesChange(session.id, e.target.value)} onBlur={() => handleSaveNotes(session.id)} rows={4} className="w-full bg-gray-900 p-2 rounded-md text-gray-200 border border-gray-600 focus:ring-yellow-500 focus:border-yellow-500" placeholder="e.g., This trade worked well because..." style={{ fontSize: `${userSettings.uiFontSize}px` }} />
            </div>
            <button onClick={() => onContinueCoachingSession(session)} className={`w-full font-bold py-2 px-4 rounded-lg bg-blue-600 hover:bg-blue-500 text-white transition-colors mt-2 ${isFullscreenView ? 'flex-shrink-0' : ''}`}>
                Continue This Coaching Session
            </button>
         </>
    );

    const renderMentorshipSessions = () => (
        <div className="space-y-4">
             <div className="text-center p-4 bg-gray-800 rounded-lg border border-gray-700">
                <h3 className="font-bold text-yellow-400 mb-2" style={{ fontSize: `${userSettings.headingFontSize}px` }}>Saved Mentorship Sessions</h3>
                <p className="text-gray-400" style={{ fontSize: `${userSettings.uiFontSize}px` }}>Review your past coaching sessions, add notes, and continue the conversation right where you left off.</p>
                <button
                    onClick={onStartNewCoachingSession}
                    className="mt-4 w-full sm:w-auto font-bold py-2 px-6 rounded-lg bg-purple-600 hover:bg-purple-500 text-white transition-colors flex items-center justify-center gap-2 mx-auto"
                >
                    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5"><path strokeLinecap="round" strokeLinejoin="round" d="M17.25 6.75 22.5 12l-5.25 5.25m-10.5 0L1.5 12l5.25-5.25m7.5-3-4.5 16.5" /></svg>
                    Start New Live Coaching
                </button>
            </div>
            {sortedSessionsForDisplay.length > 0 ? (
                sortedSessionsForDisplay.map(session => (
                    <div key={session.id} className="bg-gray-800 rounded-lg border border-gray-700 group">
                        <div className="w-full p-4 text-left flex justify-between items-center">
                            <div className="flex-grow cursor-pointer" onClick={() => handleToggleExpandSession(session.id)}>
                                <p className="font-bold text-white" style={{ fontSize: `${userSettings.headingFontSize - 2}px` }}>{session.title}</p>
                                <p className="text-xs text-gray-500">Saved: {new Date(session.savedDate).toLocaleString()}</p>
                            </div>
                             <div className="flex items-center gap-1">
                                <button
                                    onClick={(e) => { e.stopPropagation(); setSessionToDelete(session); }}
                                    className="p-2 rounded-full text-gray-500 hover:text-red-400 hover:bg-red-500/10 opacity-0 group-hover:opacity-100 transition-opacity"
                                    title="Delete Session"
                                >
                                    <TrashIcon className="w-5 h-5"/>
                                </button>
                                <button onClick={() => handleToggleExpandSession(session.id)} className="p-1">
                                    <span className={`transition-transform duration-300 ${expandedSessionId === session.id ? 'rotate-180' : ''}`}>
                                        <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" /></svg>
                                    </span>
                                </button>
                             </div>
                        </div>
                        {expandedSessionId === session.id && (
                             <div className="p-4 border-t border-gray-700 space-y-4">
                                {renderSessionContent(session, false)}
                             </div>
                        )}
                    </div>
                ))
            ) : (
                 <div className="text-center bg-gray-800/50 rounded-lg py-12"><svg className="mx-auto h-12 w-12 text-gray-500" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" /></svg><h3 className="mt-2 font-medium text-white" style={{ fontSize: `${userSettings.uiFontSize}px` }}>No saved sessions</h3><p className="mt-1 text-gray-500" style={{ fontSize: `${userSettings.uiFontSize}px` }}>Complete a Live Coaching session to save it here.</p></div>
            )}
        </div>
    );

    const FullscreenSessionView = () => {
        const session = sortedSessionsForDisplay.find(s => s.id === fullscreenSessionId);
        if (!session) return null;

        return (
            <div className="fixed inset-0 bg-gray-900/90 z-[100] flex flex-col p-4 md:p-8">
                <div className="bg-gray-800 rounded-lg border border-yellow-500/50 flex flex-col flex-grow p-4 md:p-6 h-full overflow-hidden">
                    <h3 className="text-xl font-bold text-yellow-300 mb-2 flex-shrink-0">{session.title}</h3>
                    {renderSessionContent(session, true)}
                </div>
            </div>
        );
    };

    return (
        <div className="p-4 md:p-6 space-y-8 mx-auto">
            <div className="text-center">
                <h2 className="font-bold text-white" style={{ fontSize: `${userSettings.headingFontSize + 12}px` }}>Journal</h2>
                <p className="text-gray-400 mt-1" style={{ fontSize: `${userSettings.uiFontSize}px` }}>Review your logged trades, mentorship sessions, and track your performance.</p>
            </div>
            
            <div className="border-b border-gray-700">
                <nav className="-mb-px flex space-x-8 justify-center" aria-label="Tabs">
                    <button onClick={() => setActiveTab('trades')} className={`whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm ${activeTab === 'trades' ? 'border-yellow-400 text-yellow-300' : 'border-transparent text-gray-400 hover:text-gray-200'}`}>Trade Log</button>
                    <button onClick={() => setActiveTab('sessions')} className={`whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm ${activeTab === 'sessions' ? 'border-yellow-400 text-yellow-300' : 'border-transparent text-gray-400 hover:text-gray-200'}`}>Mentorship Sessions</button>
                </nav>
            </div>

            {activeTab === 'trades' ? renderTradeLog() : renderMentorshipSessions()}
            
            <ConfirmationModal isOpen={!!tradeToRemove} onConfirm={handleConfirmRemove} onCancel={() => setTradeToRemove(null)} title="Confirm Removal" message={tradeToRemove ? `Are you sure you want to remove the ${tradeToRemove.symbol} ${tradeToRemove.direction} ${tradeToRemove.type}? This will be permanently removed from your journal and analytics.` : ''} />
            <ConfirmationModal 
                isOpen={!!sessionToDelete} 
                onConfirm={handleConfirmSessionRemove} 
                onCancel={() => setSessionToDelete(null)} 
                title="Confirm Session Deletion" 
                message={sessionToDelete ? `Are you sure you want to delete the session titled "${sessionToDelete.title}"? This cannot be undone.` : ''} 
            />
            {viewingImagesForTrade && (
                <ImageViewerModal
                    trade={viewingImagesForTrade}
                    onClose={() => setViewingImagesForTrade(null)}
                    onAddImage={onAddPostTradeImage}
                    onDiscuss={onOpenChatWithTradeContext}
                />
            )}
            {renderCoachingLogModal()}
            <FullscreenSessionView />
        </div>
    );
};

// FIX: Add default export to resolve import error.
export default JournalView;
