import React from 'react';
import { ChatWindow } from './ChatWindow.tsx';
import { ChatMessage, UserSettings, StrategyKey, AnalysisResults, UploadedImageKeys, UserUsage, ActiveView, Trade, StrategyLogicData, SavedTrade, User, UserCourseProgress, SavedCoachingSession, UploadedImageData, ApiConfiguration, MarketDataCache } from '../types.ts';
import OracleIcon from './OracleIcon.tsx';

interface ChatbotBubbleProps {
  isChatWindowOpenGlobal: boolean; 
  onToggleChatWindow: () => void;
  chatMessages: ChatMessage[];
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
  userCourseProgress: UserCourseProgress;
  onNavigateToAcademy: (view: ActiveView) => void;
  isUnrestrictedMode: boolean;
  apiConfig: ApiConfiguration;
  onSaveCoachingSession: (title: string, chatHistory: ChatMessage[], sessionGoal: "learn_basics" | "build_setup" | "compare_assets" | null) => void;
  onSaveChatGeneratedTrade: (trade: Trade, chatHistory: ChatMessage[], coachingStrategyKey: StrategyKey | null) => void;
  savedCoachingSessions: SavedCoachingSession[];
  sessionToContinue: SavedCoachingSession | null;
  onContinueSessionHandled: () => void;
  startCoachingImmediately: boolean;
  onCoachingInitiationHandled: () => void;
  marketDataCache: MarketDataCache;
  onClearChatHistory: () => void;
}

const ChatbotBubble: React.FC<ChatbotBubbleProps> = (props) => {
  return (
    <>
      <ChatWindow
        isOpen={props.isChatWindowOpenGlobal}
        onClose={props.onToggleChatWindow}
        messages={props.chatMessages}
        savedTrades={props.savedTrades}
        onAddChatMessage={props.onAddChatMessage}
        onLogTokenUsage={props.onLogTokenUsage}
        userSettings={props.userSettings}
        onApplyChatbotSettingsChange={props.onApplyChatbotSettingsChange}
        selectedStrategies={props.selectedStrategies}
        originalAnalysisResults={props.originalAnalysisResults}
        modifiedAnalysisResults={props.modifiedAnalysisResults}
        onApplyTradeModification={props.onApplyTradeModification}
        uploadedImageKeys={props.uploadedImageKeys}
        userUsage={props.userUsage}
        currentUser={props.currentUser}
        currentActiveView={props.currentActiveView}
        dashboardSelectedStrategies={props.dashboardSelectedStrategies}
        strategyLogicData={props.strategyLogicData}
        viewedStrategy={props.viewedStrategy}
        chatContextTrade={props.chatContextTrade}
        isCoachingSessionActive={props.isCoachingSessionActive}
        setIsCoachingSessionActive={props.setIsCoachingSessionActive}
        userCourseProgress={props.userCourseProgress}
        onNavigateToAcademy={() => props.onNavigateToAcademy('academy')}
        isUnrestrictedMode={props.isUnrestrictedMode}
        apiConfig={props.apiConfig}
        onSaveCoachingSession={props.onSaveCoachingSession}
        onSaveChatGeneratedTrade={props.onSaveChatGeneratedTrade}
        savedCoachingSessions={props.savedCoachingSessions}
        sessionToContinue={props.sessionToContinue}
        onContinueSessionHandled={props.onContinueSessionHandled}
        startCoachingImmediately={props.startCoachingImmediately}
        onCoachingInitiationHandled={props.onCoachingInitiationHandled}
        marketDataCache={props.marketDataCache}
        onClearChatHistory={props.onClearChatHistory}
      />

      {/* Floating Action Button for Desktop */}
      {!props.isChatWindowOpenGlobal && (
          <button
              onClick={props.onToggleChatWindow}
              aria-label="Open Oracle Chat"
              className="hidden md:flex fixed bottom-6 right-6 z-40 w-24 h-24 bg-gray-800 rounded-full items-center justify-center border-4 shadow-lg transition-all duration-300 hover:scale-110 active:scale-100 hover:border-purple-400 animate-fadeIn"
              style={{ borderColor: '#c084fc' }}
              title="Open Oracle Chat"
          >
              <OracleIcon className="w-14 h-14" />
          </button>
      )}
       <style>{`
        @keyframes fadeIn { from { opacity: 0; transform: translateY(10px); } to { opacity: 1; transform: translateY(0); } }
        .animate-fadeIn { animation: fadeIn 0.3s ease-out forwards; }
      `}</style>
    </>
  );
};

export default ChatbotBubble;