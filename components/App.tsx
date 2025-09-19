import React, { useState, useEffect } from 'react';
// FIX: Added missing TradeFeedback import
import { 
    ActiveView, AnalysisResults, StrategyKey, UserSettings, UploadedImageKeys, User, 
    UserUsage, ChatMessage, Trade, StrategyLogicData, SavedTrade, 
    KnowledgeBaseDocument, UserCourseProgress, SavedCoachingSession, UploadedImageData, TokenUsageRecord, 
    ApiConfiguration,
    EodhdUsageStats,
    MarketDataCache,
    TradeFeedback
} from './types.ts';
import { 
    DEFAULT_USER_SETTINGS, DEFAULT_LOGGED_OUT_USER,
    DASHBOARD_STRATEGIES_LOCALSTORAGE_KEY, USER_SETTINGS_LOCALSTORAGE_KEY, SAVED_TRADES_LOCALSTORAGE_KEY, 
    STRATEGY_LOGIC_LOCALSTORAGE_KEY, AUTH_SESSION_LOCALSTORAGE_KEY, KB_DOCS_LOCALSTORAGE_KEY, 
    CHAT_MESSAGES_LOCALSTORAGE_KEY, COURSE_PROGRESS_LOCALSTORAGE_KEY, 
    API_CONFIG_SESSIONSTORAGE_KEY, DEFAULT_API_CONFIGURATION, MARKET_DATA_CACHE_LOCALSTORAGE_KEY,
    DASHBOARD_MARKET_DATA_LOCALSTORAGE_KEY,
    ADJECTIVES, NOUNS,
    COACHING_SESSIONS_LOCALSTORAGE_KEY, TOKEN_USAGE_HISTORY_LOCALSTORAGE_KEY, ALL_PERSISTENT_STORAGE_KEYS,
    USER_USAGE_LOCALSTORAGE_KEY
} from './constants.ts';
import useLocalStorage from './hooks/useLocalStorage.ts';
import { storeImage, deleteImage, clearStore, setItem } from './idb.ts';

// Components
import Header from './components/Header.tsx';
// FIX: Changed to a named import to resolve module resolution errors.
import { Dashboard } from './components/Dashboard.tsx';
import AnalysisView from './components/AnalysisView.tsx';
import SubscriptionView from './components/SubscriptionView.tsx';
import JournalView from './components/JournalView.tsx';
import { MasterControlsView } from './components/MasterControlsView.tsx';
import AcademyView from './components/AcademyView.tsx';
import BottomNavigationBar from './components/BottomNavigationBar.tsx';
import AccessGate from './components/AccessGate.tsx';
import ChatbotBubble from './components/ChatbotBubble.tsx';
import PrivacyPolicyModal from './components/PrivacyPolicyModal.tsx';
import TermsOfUseModal from './components/TermsOfUseModal.tsx';
import Footer from './components/Footer.tsx';
import AvatarSelectionModal from './components/AvatarSelectionModal.tsx';
import ProfileView from './components/ProfileView.tsx';
import ApiKeyOnboardingModal from './components/ApiKeyOnboardingModal.tsx';


const UNLIMITED_USAGE: UserUsage = {
  creditsRemaining: 9999,
  creditsTotal: 9999,
  purchasedCredits: 0,
  creditRolloverMax: 9999,
  periodLabel: 'Unrestricted Access',
  highResAnalysesRemaining: 9999,
  redosRemaining: 9999,
  redosTotal: 9999,
};


// FIX: Explicitly type the App component as a React.FC to resolve the type inference error.
const App: React.FC = () => {
    // --- State Management ---
    const [currentUser, setCurrentUser] = useLocalStorage<User | null>(AUTH_SESSION_LOCALSTORAGE_KEY, DEFAULT_LOGGED_OUT_USER);
    const [userUsage, _setUserUsage] = useLocalStorage<UserUsage>(USER_USAGE_LOCALSTORAGE_KEY, UNLIMITED_USAGE);
    const [apiConfig, setApiConfig] = useLocalStorage<ApiConfiguration>(API_CONFIG_SESSIONSTORAGE_KEY, DEFAULT_API_CONFIGURATION, 'sessionStorage');
    
    // Derived state for authentication. A user is authenticated if there is a currentUser object.
    const isAuthenticated = !!currentUser;

    const [activeView, setActiveView] = useState<ActiveView>('analyze');
    const [analysisResults, setAnalysisResults] = useState<AnalysisResults | null>(null);
    const [modifiedAnalysisResults, setModifiedAnalysisResults] = useState<AnalysisResults | null>(null);
    const [uploadedImageKeys, setUploadedImageKeys] = useState<UploadedImageKeys | null>(null);
    const [selectedStrategies, setSelectedStrategies] = useState<StrategyKey[]>([]);
    const [useRealTimeContextLastAnalysis, setUseRealTimeContextLastAnalysis] = useState<boolean>(false);
    
    const [dashboardSelectedStrategies, setDashboardSelectedStrategies] = useLocalStorage<StrategyKey[]>(DASHBOARD_STRATEGIES_LOCALSTORAGE_KEY, []);
    const [dashboardSelectedMarketData, setDashboardSelectedMarketData] = useLocalStorage<string[]>(DASHBOARD_MARKET_DATA_LOCALSTORAGE_KEY, []);
    const [userSettings, setUserSettings] = useLocalStorage<UserSettings>(USER_SETTINGS_LOCALSTORAGE_KEY, DEFAULT_USER_SETTINGS);
    const [strategyLogicData, setStrategyLogicData] = useLocalStorage<Record<StrategyKey, StrategyLogicData>>(STRATEGY_LOGIC_LOCALSTORAGE_KEY, {});
    const [savedTrades, setSavedTrades] = useLocalStorage<SavedTrade[]>(SAVED_TRADES_LOCALSTORAGE_KEY, []);
    const [_knowledgeBaseDocuments, _setKnowledgeBaseDocuments] = useLocalStorage<KnowledgeBaseDocument[]>(KB_DOCS_LOCALSTORAGE_KEY, []);
    const [chatMessages, setChatMessages] = useLocalStorage<ChatMessage[]>(CHAT_MESSAGES_LOCALSTORAGE_KEY, []);
    const [courseProgress, setUserCourseProgress] = useLocalStorage<UserCourseProgress>(COURSE_PROGRESS_LOCALSTORAGE_KEY, { completedLessons: [], quizScores: {}, exerciseStates: {} });
    const [savedCoachingSessions, setSavedCoachingSessions] = useLocalStorage<SavedCoachingSession[]>(COACHING_SESSIONS_LOCALSTORAGE_KEY, []);
    const [_tokenUsageHistory, _setTokenUsageHistory] = useLocalStorage<TokenUsageRecord[]>(TOKEN_USAGE_HISTORY_LOCALSTORAGE_KEY, []);
    const [marketDataCache, setMarketDataCache] = useLocalStorage<MarketDataCache>(MARKET_DATA_CACHE_LOCALSTORAGE_KEY, {});
    
    // Non-persistent state
    const [_isPageScrolled, _setIsPageScrolled] = useState(false);
    const [isAnalyzing, setIsAnalyzing] = useState(false);
    const [isLegalModalOpen, setIsLegalModalOpen] = useState<'privacy' | 'terms' | null>(null);
    const [isAvatarModalOpen, setIsAvatarModalOpen] = useState(false);
    const [isApiKeyModalOpen, setIsApiKeyModalOpen] = useState(false);
    const [chatContextTrade, setChatContextTrade] = useState<SavedTrade | null>(null);
    const [isChatWindowOpen, setIsChatWindowOpen] = useState(false);
    const [isCoachingSessionActive, setIsCoachingSessionActive] = useState(false);
    const [sessionToContinue, setSessionToContinue] = useState<SavedCoachingSession | null>(null);
    const [startCoachingImmediately, setStartCoachingImmediately] = useState(false);
    const [viewedStrategy, setViewedStrategy] = useState<StrategyKey | null>(null);
    const [eodhdUsage, _setEodhdUsage] = useState<EodhdUsageStats | null>(null);
    const [isRedoTriggered, setIsRedoTriggered] = useState(false);

    useEffect(() => {
        const darknessOffset = userSettings.darknessLevel || 0;
        document.documentElement.style.setProperty('--darkness-offset', `${darknessOffset}`);
    }, [userSettings.darknessLevel]);

    useEffect(() => {
        // Sync selected strategies with available strategies.
        // This prevents a bug where a deleted strategy's key remains in localStorage.
        const availableStrategyKeys = Object.keys(strategyLogicData);
        setDashboardSelectedStrategies((prev: StrategyKey[]) => prev.filter((key: StrategyKey) => availableStrategyKeys.includes(key)));
    }, [strategyLogicData, setDashboardSelectedStrategies]);

     const handleNavClick = (view: ActiveView) => {
        if (view === 'analyze' && analysisResults) {
            // This is the "New Analysis" button case
            setAnalysisResults(null);
            setModifiedAnalysisResults(null);
            setUploadedImageKeys(null);
        }
        setActiveView(view);
        window.scrollTo(0, 0); // Scroll to top on view change
    };

    const handleAuthSuccess = () => {
        const randomAdj = ADJECTIVES[Math.floor(Math.random() * ADJECTIVES.length)];
        const randomNoun = NOUNS[Math.floor(Math.random() * NOUNS.length)];
        const randomNum = Math.floor(Math.random() * 900) + 100;

        setCurrentUser({
            name: 'Beta User',
            tier: 'Master',
            anonymousUsername: `${randomAdj}${randomNoun}${randomNum}`,
            avatar: ''
        });

        // Prompt for API key if not set
        if (!apiConfig.geminiApiKey) {
            setIsApiKeyModalOpen(true);
        }
    };

    const handleAnalysisComplete = (
        results: AnalysisResults,
        strategies: StrategyKey[],
        images: UploadedImageKeys,
        useRealTimeContext: boolean
    ) => {
        setAnalysisResults(results);
        setSelectedStrategies(strategies);
        setUploadedImageKeys(images);
        setUseRealTimeContextLastAnalysis(useRealTimeContext);
        setModifiedAnalysisResults(null); // Clear previous modifications
        setIsAnalyzing(false);
    };

    const handlePerformRedo = (newStrategies?: StrategyKey[], newSettings?: UserSettings) => {
        // If new strategies/settings are provided (from suggestion card), update the dashboard state
        if (newStrategies && newStrategies.length > 0) {
            setDashboardSelectedStrategies(newStrategies);
        }
        if (newSettings && Object.keys(newSettings).length > 0) {
            setUserSettings((prev: UserSettings) => ({...prev, ...newSettings}));
        }
        
        // Trigger the redo flow
        setActiveView('analyze'); // Go to the analyze page to show the dashboard
        setAnalysisResults(null);
        setModifiedAnalysisResults(null);
        setIsRedoTriggered(true); // This flag will be caught by Dashboard
    };

    const handleSaveTrade = async (trade: Trade, strategiesUsed: StrategyKey[]) => {
        const imageKeys: UploadedImageKeys = {};
        if (uploadedImageKeys) {
            for (const key in uploadedImageKeys) {
                const dataUrl = uploadedImageKeys[key as any];
                if (dataUrl) {
                    // Storing the image again creates a new copy with a new key.
                    // This is intended to decouple journaled images from analysis images.
                    const newImageKey = await storeImage(dataUrl);
                    imageKeys[key as any] = newImageKey;
                }
            }
        }

        const newSavedTrade: SavedTrade = {
            ...trade,
            id: `trade_${Date.now()}`,
            savedDate: new Date().toISOString(),
            feedback: { outcome: null, text: '' },
            strategiesUsed,
            uploadedImageKeys: imageKeys,
            analysisContext: {
                realTimeContextWasUsed: useRealTimeContextLastAnalysis,
            }
        };

        setSavedTrades((prev: SavedTrade[]) => [...prev, newSavedTrade]);
    };

    const handleSaveChatGeneratedTrade = async (trade: Trade, chatHistory: ChatMessage[], coachingStrategyKey: StrategyKey | null) => {
        if (!coachingStrategyKey) {
            console.error("Cannot save coached trade without a strategy key.");
            // Optionally, inform the user with a chat message.
            return;
        }

        // The image keys are already on the user messages from the chat flow.
        // We just need to collect them in the `UploadedImageKeys` format.
        const imageKeys: UploadedImageKeys = {};
        const uniqueImageKeysFromChat = new Set<string>();
        chatHistory.forEach(msg => {
            if (msg.sender === 'user' && msg.imageKeys) {
                msg.imageKeys.forEach(key => uniqueImageKeysFromChat.add(key));
            }
        });

        let imageIndex = 0;
        uniqueImageKeysFromChat.forEach(key => {
            imageKeys[imageIndex] = key;
            imageIndex++;
        });

        const newSavedTrade: SavedTrade = {
            ...trade,
            id: `trade_${Date.now()}`,
            savedDate: new Date().toISOString(),
            feedback: { outcome: null, text: '' },
            strategiesUsed: [coachingStrategyKey],
            uploadedImageKeys: imageKeys,
            analysisContext: {
                realTimeContextWasUsed: false, // Coaching context is manual, not real-time API.
            },
            isFromCoaching: true,
            coachingSessionChat: chatHistory, // Save the full conversation for review.
        };

        setSavedTrades((prev: SavedTrade[]) => [...prev, newSavedTrade]);
    };

    const handleAddChatMessage = async (message: Omit<ChatMessage, 'id' | 'timestamp'> & { imageData?: UploadedImageData[] }) => {
        const { imageData, ...restOfMessage } = message;
        let imageKeys: string[] | undefined;

        if (imageData && imageData.length > 0) {
            imageKeys = await Promise.all(
                imageData.map(imgData => storeImage(imgData.dataUrl))
            );
        }

        const fullMessage: ChatMessage = {
            ...restOfMessage,
            imageKeys,
            id: `msg_${Date.now()}`,
            timestamp: new Date(),
        };
        setChatMessages((prev: ChatMessage[]) => [...prev, fullMessage]);
    };

    const handleAddPostTradeImage = async (tradeId: string, imageData: UploadedImageData) => {
        const imageKey = await storeImage(imageData.dataUrl);
        setSavedTrades((prevTrades: SavedTrade[]) =>
            prevTrades.map((trade: SavedTrade) => {
                if (trade.id === tradeId) {
                    const updatedPostTradeKeys = [...(trade.postTradeImageKeys || []), imageKey];
                    return { ...trade, postTradeImageKeys: updatedPostTradeKeys };
                }
                return trade;
            })
        );
    };
    
    // Render logic
    const renderContent = () => {
        if (analysisResults) {
            return (
                <AnalysisView
                    analysisResults={analysisResults}
                    modifiedAnalysis={modifiedAnalysisResults}
                    selectedStrategies={selectedStrategies}
                    uploadedImages={uploadedImageKeys}
                    onReset={() => {
                        setAnalysisResults(null);
                        setModifiedAnalysisResults(null);
                        setUploadedImageKeys(null);
                    }}
                    onPerformRedo={handlePerformRedo}
                    currentUser={currentUser}
                    userUsage={userUsage}
                    savedTrades={savedTrades}
                    onSaveTrade={handleSaveTrade}
                    strategyLogicData={strategyLogicData}
                    userSettings={userSettings}
                />
            );
        }

        switch (activeView) {
            case 'analyze':
                return <Dashboard 
                  onAnalysisComplete={handleAnalysisComplete} 
                  userSettings={userSettings}
                  onUserSettingsChange={(key: keyof UserSettings, value: any) => setUserSettings((prev: UserSettings) => ({ ...prev, [key]: value }))}
                  initialImages={uploadedImageKeys}
                  currentUser={currentUser}
                  userUsage={userUsage}
                  dashboardSelectedStrategies={dashboardSelectedStrategies}
                  onDashboardStrategyChange={(key: StrategyKey) => {
                      setDashboardSelectedStrategies((prev: StrategyKey[]) => 
                          prev.includes(key) ? prev.filter((k: StrategyKey) => k !== key) : [...prev, key]
                      )
                  }}
                  onSetDashboardStrategies={setDashboardSelectedStrategies}
                  dashboardSelectedMarketData={dashboardSelectedMarketData}
                  setDashboardSelectedMarketData={setDashboardSelectedMarketData}
                  strategyLogicData={strategyLogicData}
                  isAnalyzing={isAnalyzing}
                  setIsAnalyzing={setIsAnalyzing}
                  onLogTokenUsage={() => { /* Placeholder */}}
                  apiConfig={apiConfig}
                  onInitiateCoaching={() => setStartCoachingImmediately(true)}
                  viewedStrategy={viewedStrategy}
                  setViewedStrategy={setViewedStrategy}
                  marketDataCache={marketDataCache}
                  isRedoTriggered={isRedoTriggered}
                  setIsRedoTriggered={setIsRedoTriggered}
                  setApiConfig={setApiConfig}
                  onFetchAndLoadData={async () => ({ count: 0, key: ''})}
                  onRemoveMarketData={(key: string) => {
                    setMarketDataCache((prev: MarketDataCache) => {
                        const newCache = {...prev};
                        delete newCache[key];
                        return newCache;
                    })
                  }}
                  eodhdUsage={eodhdUsage}
                  onFetchEodhdUsage={() => {/* Placeholder */}}
                />;
            case 'subscription':
                return <SubscriptionView currentUser={currentUser} onUpgradeTier={() => { /* Placeholder */}} />;
            case 'journal':
                 return <JournalView 
                    savedTrades={savedTrades} 
                    onUpdateTradeFeedback={(tradeId: string, feedback: TradeFeedback) => {
                        setSavedTrades((prev: SavedTrade[]) => prev.map((t: SavedTrade) => t.id === tradeId ? {...t, feedback} : t));
                    }}
                    onRemoveTrade={async (tradeId: string) => {
                         const tradeToRemove = savedTrades.find((t: SavedTrade) => t.id === tradeId);
                         if (tradeToRemove) {
                            if (tradeToRemove.uploadedImageKeys) {
                                await Promise.all(Object.values(tradeToRemove.uploadedImageKeys).map(key => key && deleteImage(key)));
                            }
                            if (tradeToRemove.postTradeImageKeys) {
                                await Promise.all(tradeToRemove.postTradeImageKeys.map(key => key && deleteImage(key)));
                            }
                         }
                         setSavedTrades((prev: SavedTrade[]) => prev.filter((t: SavedTrade) => t.id !== tradeId));
                    }}
                    onOpenChatWithTradeContext={(trade: SavedTrade) => {
                        // Override logic: end coaching, clear chat, set new context, open window.
                        setIsCoachingSessionActive(false);
                        setChatMessages([]);
                        setChatContextTrade(trade);
                        setIsChatWindowOpen(true);
                    }}
                    strategyLogicData={strategyLogicData}
                    savedCoachingSessions={savedCoachingSessions}
                    onUpdateCoachingSessionNotes={(sessionId: string, notes: string) => {
                         setSavedCoachingSessions((prev: SavedCoachingSession[]) => prev.map((s: SavedCoachingSession) => s.id === sessionId ? {...s, userNotes: notes} : s));
                    }}
                    onContinueCoachingSession={(session: SavedCoachingSession) => {
                        // Override logic: end other sessions, load history, set session to continue, open window.
                        setIsCoachingSessionActive(false); 
                        setChatMessages(session.chatHistory);
                        setSessionToContinue(session);
                        setIsChatWindowOpen(true);
                    }}
                    onDeleteCoachingSession={(sessionId: string) => {
                        setSavedCoachingSessions((prev: SavedCoachingSession[]) => prev.filter((s: SavedCoachingSession) => s.id !== sessionId));
                    }}
                    onStartNewCoachingSession={() => setStartCoachingImmediately(true)}
                    userSettings={userSettings}
                    onAddPostTradeImage={handleAddPostTradeImage}
                 />;
            case 'master-controls':
                return <MasterControlsView 
                    strategyLogicData={strategyLogicData}
                    setStrategyLogicData={setStrategyLogicData}
                    apiConfig={apiConfig}
                    setApiConfig={setApiConfig}
                    userSettings={userSettings}
                    onUserSettingsChange={(key: keyof UserSettings, value: any) => setUserSettings((prev: UserSettings) => ({ ...prev, [key]: value }))}
                    currentUser={currentUser}
                    tokenUsageHistory={_tokenUsageHistory}
                    onLogTokenUsage={() => { /* Placeholder */}}
                    onOpenLegal={setIsLegalModalOpen}
                    marketDataCache={marketDataCache}
                    onFetchAndLoadData={async () => ({ count: 0, key: ''})} // Placeholder
                    onRemoveMarketData={(key: string) => {
                        setMarketDataCache((prev: MarketDataCache) => {
                            const newCache = {...prev};
                            delete newCache[key];
                            return newCache;
                        })
                    }}
                    onRestoreData={(data: any) => {
                        if (data.localStorage) {
                            for (const key in data.localStorage) {
                                if (ALL_PERSISTENT_STORAGE_KEYS.includes(key)) {
                                    localStorage.setItem(key, JSON.stringify(data.localStorage[key]));
                                }
                            }
                        }
                        if (data.imageStore) {
                            clearStore().then(() => {
                                for(const key in data.imageStore) {
                                    setItem(key, data.imageStore[key]);
                                }
                            }).finally(() => {
                                alert("Data restored successfully. The application will now reload.");
                                window.location.reload();
                            });
                        } else {
                           alert("Data restored successfully. The application will now reload.");
                           window.location.reload();
                        }
                    }}
                    eodhdUsage={eodhdUsage}
                    onFetchEodhdUsage={() => {/* Placeholder */}}
                />;
            case 'academy':
                return <AcademyView 
                    userCourseProgress={courseProgress}
                    setUserCourseProgress={setUserCourseProgress}
                    apiConfig={apiConfig}
                    userSettings={userSettings}
                    strategyLogicData={strategyLogicData}
                />;
             case 'profile':
                return <ProfileView 
                    currentUser={currentUser!} 
                    apiConfig={apiConfig}
                    onOpenAvatarSelection={() => setIsAvatarModalOpen(true)} 
                    userSettings={userSettings}
                />;
            default:
                return <p>Not Implemented</p>;
        }
    };

    return (
        <div className="flex flex-col min-h-screen text-gray-200 bg-[var(--color-bg-primary)]">
            {!isAuthenticated ? (
                <AccessGate onAuthSuccess={handleAuthSuccess} onOpenLegal={setIsLegalModalOpen} />
            ) : (
                <>
                    <Header
                        activeView={activeView}
                        currentUser={currentUser}
                        onNavClick={handleNavClick}
                        onLogout={() => setCurrentUser(null)}
                        isPageScrolled={_isPageScrolled}
                        isAnalyzing={isAnalyzing}
                        userSettings={userSettings}
                    />
                    <main className="flex-grow pt-28 md:pt-32">
                        {renderContent()}
                    </main>
                    <Footer onOpenLegal={setIsLegalModalOpen} />
                    {/* FIX: Add missing onOracleChatClick prop to satisfy BottomNavigationBarProps */}
                    <BottomNavigationBar
                        activeView={activeView}
                        onNavClick={handleNavClick}
                        currentUser={currentUser}
                        onOracleChatClick={() => {
                            setIsChatWindowOpen(prev => !prev);
                            // If window is closed, clear any lingering trade context
                            if (isChatWindowOpen) {
                                setChatContextTrade(null);
                            }
                        }}
                    />
                    <ChatbotBubble 
                        isChatWindowOpenGlobal={isChatWindowOpen}
                        onToggleChatWindow={() => {
                            setIsChatWindowOpen(prev => !prev);
                            // If window is closed, clear any lingering trade context
                            if (isChatWindowOpen) {
                                setChatContextTrade(null);
                            }
                        }}
                        chatMessages={chatMessages}
                        savedTrades={savedTrades}
                        onAddChatMessage={handleAddChatMessage}
                        onLogTokenUsage={() => {}}
                        userSettings={userSettings}
                        onApplyChatbotSettingsChange={() => {}}
                        selectedStrategies={selectedStrategies}
                        originalAnalysisResults={analysisResults}
                        modifiedAnalysisResults={modifiedAnalysisResults}
                        onApplyTradeModification={() => {}}
                        uploadedImageKeys={uploadedImageKeys}
                        userUsage={userUsage}
                        currentUser={currentUser}
                        currentActiveView={activeView}
                        dashboardSelectedStrategies={dashboardSelectedStrategies}
                        strategyLogicData={strategyLogicData}
                        viewedStrategy={viewedStrategy}
                        chatContextTrade={chatContextTrade}
                        isCoachingSessionActive={isCoachingSessionActive}
                        setIsCoachingSessionActive={setIsCoachingSessionActive}
                        userCourseProgress={courseProgress}
                        onNavigateToAcademy={handleNavClick}
                        isUnrestrictedMode={true}
                        apiConfig={apiConfig}
                        onSaveCoachingSession={(title: string, chatHistory: ChatMessage[], sessionGoal: "learn_basics" | "build_setup" | "compare_assets" | null) => {
                             const newSession: SavedCoachingSession = {
                                id: `session_${Date.now()}`,
                                title,
                                savedDate: new Date().toISOString(),
                                chatHistory,
                                userNotes: '',
                                sessionGoal: sessionGoal || undefined
                            };
                            setSavedCoachingSessions((prev: SavedCoachingSession[]) => [...prev, newSession]);
                        }}
                        onSaveChatGeneratedTrade={handleSaveChatGeneratedTrade}
                        savedCoachingSessions={savedCoachingSessions}
                        sessionToContinue={sessionToContinue}
                        onContinueSessionHandled={() => setSessionToContinue(null)}
                        startCoachingImmediately={startCoachingImmediately}
                        onCoachingInitiationHandled={() => {
                             setIsChatWindowOpen(true);
                             setStartCoachingImmediately(false);
                        }}
                        marketDataCache={marketDataCache}
                        onClearChatHistory={() => setChatMessages([])}
                    />
                    <ApiKeyOnboardingModal 
                        isOpen={isApiKeyModalOpen}
                        onSave={(key: string) => {
                            setApiConfig((prev: ApiConfiguration) => ({...prev, geminiApiKey: key}));
                            setIsApiKeyModalOpen(false);
                            if (currentUser && !currentUser.avatar) {
                                setIsAvatarModalOpen(true);
                            }
                        }}
                        onClose={() => setIsApiKeyModalOpen(false)}
                    />
                    <AvatarSelectionModal 
                        isOpen={isAvatarModalOpen}
                        onClose={() => setIsAvatarModalOpen(false)}
                        onAvatarSelect={(avatarDataUrl: string) => {
                            setCurrentUser((prev: User | null) => prev ? {...prev, avatar: avatarDataUrl} : null);
                            setIsAvatarModalOpen(false);
                        }}
                        apiConfig={apiConfig}
                    />
                </>
            )}
            <PrivacyPolicyModal isOpen={isLegalModalOpen === 'privacy'} onClose={() => setIsLegalModalOpen(null)} />
            <TermsOfUseModal isOpen={isLegalModalOpen === 'terms'} onClose={() => setIsLegalModalOpen(null)} />
        </div>
    );
};

export default App;
