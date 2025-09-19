import React from 'react';
import { StrategySuggestion, UserSettings, StrategyKey, StrategyLogicData } from '../types.ts';

interface AISuggestionCardProps {
  suggestion: StrategySuggestion;
  onApply: (strategies: StrategyKey[], settings: UserSettings) => void;
  strategyLogicData: Record<StrategyKey, StrategyLogicData>;
  userSettings: UserSettings;
}

const AISuggestionCard: React.FC<AISuggestionCardProps> = ({ suggestion, onApply, strategyLogicData, userSettings }) => {
  const { suggestedStrategies, suggestedSettings, reasoning } = suggestion;
  
  const buttonText = "Apply & Redo Analysis";

  return (
    <div className="bg-purple-900/20 border border-purple-500/50 rounded-lg p-6 my-6 text-left mx-auto">
      <div className="flex items-center mb-4">
        <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-purple-300 mr-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
          <path strokeLinecap="round" strokeLinejoin="round" d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
        </svg>
        <h3 className="font-bold text-purple-300" style={{ fontSize: `${userSettings.headingFontSize}px` }}>Oracle's Suggestion</h3>
      </div>
      <p className="text-purple-200 italic mb-4" style={{ fontSize: `${userSettings.uiFontSize}px` }}>"{reasoning}"</p>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-5">
        <div>
          <h4 className="font-semibold text-purple-200 mb-2" style={{ fontSize: `${userSettings.uiFontSize}px` }}>Suggested Strategies:</h4>
          <div className="flex flex-wrap gap-2">
            {suggestedStrategies.map((key: StrategyKey) => (
              <span key={key} className="px-3 py-1 text-sm font-bold bg-purple-600 text-purple-100 rounded-full" style={{ fontSize: `${userSettings.uiFontSize - 1}px` }}>
                {strategyLogicData[key]?.name || key}
              </span>
            ))}
          </div>
        </div>
        <div>
          <h4 className="font-semibold text-purple-200 mb-2" style={{ fontSize: `${userSettings.uiFontSize}px` }}>Suggested Preferences:</h4>
          <ul className="text-purple-200/90 space-y-1" style={{ fontSize: `${userSettings.uiFontSize}px` }}>
            <li><strong>Risk Appetite:</strong> {suggestedSettings.riskAppetite}</li>
            <li><strong>Min. R:R Ratio:</strong> {suggestedSettings.minRiskRewardRatio}:1</li>
            <li><strong>Trade Duration:</strong> {suggestedSettings.preferredTradeDuration}</li>
            <li><strong>Allow Counter-Trend:</strong> {suggestedSettings.tradeAgainstTrend ? 'Yes' : 'No'}</li>
          </ul>
        </div>
      </div>

      <button
        onClick={() => onApply(suggestedStrategies, suggestedSettings)}
        className="w-full bg-yellow-500 text-gray-900 font-bold py-3 px-6 rounded-lg hover:bg-yellow-400 transition-colors disabled:bg-gray-600 disabled:text-gray-400 disabled:cursor-not-allowed flex items-center justify-center"
      >
        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" viewBox="0 0 20 20" fill="currentColor">
            <path fillRule="evenodd" d="M4 2a1 1 0 011 1v2.101a7.002 7.002 0 0111.601 2.566 1 1 0 11-1.885.666A5.002 5.002 0 005.999 7H9a1 1 0 010 2H4a1 1 0 01-1-1V3a1 1 0 011-1zm.008 9.057a1 1 0 011.276.61A5.002 5.002 0 0014.001 13H11a1 1 0 110-2h5a1 1 0 011 1v5a1 1 0 11-2 0v-2.101a7.002 7.002 0 01-11.601-2.566 1 1 0 01.61-1.276z" clipRule="evenodd" />
        </svg>
        {buttonText}
      </button>
    </div>
  );
};

export default AISuggestionCard;