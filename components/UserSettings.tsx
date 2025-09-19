import React from 'react';
import { UserSettings } from '../types.ts';
import { 
  RISK_APPETITE_OPTIONS, 
  PREFERRED_TRADE_DURATION_OPTIONS, 
  PREFERRED_TRADE_DURATION_DETAILS, 
  STOP_LOSS_STRATEGY_OPTIONS, 
  STOP_LOSS_STRATEGY_DETAILS,
  ASSET_CLASS_OPTIONS,
  MARKET_TIMING_OPTIONS
} from '../constants.ts';

interface UserSettingsProps {
  userSettings: UserSettings;
  onUserSettingsChange: (settingKey: keyof UserSettings, value: any) => void;
}

const UserSettingsEditor: React.FC<UserSettingsProps> = ({ userSettings, onUserSettingsChange }) => {
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value, type } = e.target;
    let processedValue: string | number | boolean = value;

    if (type === 'checkbox') {
      processedValue = (e.target as HTMLInputElement).checked;
    } else if (type === 'number' || type === 'range') {
      processedValue = parseFloat(value);
      if (isNaN(processedValue)) processedValue = 14; 
    }
    onUserSettingsChange(name as keyof UserSettings, processedValue);
  };

  return (
    <div className="bg-[var(--color-bg-secondary)]/70 p-4 rounded-lg border border-[var(--color-border-primary)] space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Risk Appetite */}
        <div>
          <label htmlFor="riskAppetite" className="block text-sm font-medium text-gray-300 mb-1">Risk Appetite</label>
          <select
            id="riskAppetite"
            name="riskAppetite"
            value={userSettings.riskAppetite}
            onChange={handleInputChange}
            className="w-full bg-[var(--color-bg-tertiary)] border border-[var(--color-border-secondary)] text-white rounded-md shadow-sm focus:outline-none focus:ring-1 focus:ring-yellow-500 py-2 px-3 text-base"
          >
            {RISK_APPETITE_OPTIONS.map(option => (
              <option key={option} value={option}>{option}</option>
            ))}
          </select>
          <p className="text-xs text-gray-500 mt-1">Conservative prefers higher probability, Aggressive seeks higher reward.</p>
        </div>

        {/* Min Risk/Reward Ratio */}
        <div>
          <label htmlFor="minRiskRewardRatio" className="block text-sm font-medium text-gray-300 mb-1">Min. Risk/Reward Ratio (R:R)</label>
          <input
            type="number"
            id="minRiskRewardRatio"
            name="minRiskRewardRatio"
            value={userSettings.minRiskRewardRatio}
            onChange={handleInputChange}
            min="0.5"
            step="0.1"
            className="w-full bg-[var(--color-bg-tertiary)] border border-[var(--color-border-secondary)] text-white rounded-md shadow-sm focus:outline-none focus:ring-1 focus:ring-yellow-500 py-2 px-3 text-sm"
          />
          <p className="text-xs text-gray-500 mt-1">E.g., 2 means Take Profit is at least 2x Stop Loss distance.</p>
        </div>

        {/* Preferred Trade Duration */}
        <div>
          <label htmlFor="preferredTradeDuration" className="block text-sm font-medium text-gray-300 mb-1">Preferred Trade Duration</label>
          <select
            id="preferredTradeDuration"
            name="preferredTradeDuration"
            value={userSettings.preferredTradeDuration}
            onChange={handleInputChange}
            className="w-full bg-[var(--color-bg-tertiary)] border border-[var(--color-border-secondary)] text-white rounded-md shadow-sm focus:outline-none focus:ring-1 focus:ring-yellow-500 py-2 px-3 text-base"
          >
            {PREFERRED_TRADE_DURATION_OPTIONS.map(option => (
              <option key={option} value={option}>{option}</option>
            ))}
          </select>
           <p className="text-xs text-gray-500 mt-1">{PREFERRED_TRADE_DURATION_DETAILS[userSettings.preferredTradeDuration]}</p>
        </div>
        
        {/* Trade Against Trend */}
        <div className="flex items-center pt-5">
          <input
            id="tradeAgainstTrend"
            name="tradeAgainstTrend"
            type="checkbox"
            checked={userSettings.tradeAgainstTrend}
            onChange={handleInputChange}
            className="h-4 w-4 text-yellow-500 border-[var(--color-border-secondary)] rounded focus:ring-yellow-400 bg-[var(--color-bg-tertiary)]"
          />
          <label htmlFor="tradeAgainstTrend" className="ml-2 block text-sm font-medium text-gray-300">
            Allow Counter-Trend Trades?
          </label>
        </div>

        {/* New: Preferred Asset Class */}
        <div>
          <label htmlFor="preferredAssetClass" className="block text-sm font-medium text-gray-300 mb-1">Preferred Asset Class</label>
          <select
            id="preferredAssetClass"
            name="preferredAssetClass"
            value={userSettings.preferredAssetClass}
            onChange={handleInputChange}
            className="w-full bg-[var(--color-bg-tertiary)] border border-[var(--color-border-secondary)] text-white rounded-md shadow-sm focus:outline-none focus:ring-1 focus:ring-yellow-500 py-2 px-3 text-base"
          >
            {ASSET_CLASS_OPTIONS.map(option => (
              <option key={option} value={option}>{option}</option>
            ))}
          </select>
          <p className="text-xs text-gray-500 mt-1">Tells the AI which asset you primarily trade to adjust for volatility.</p>
        </div>

        {/* New: Market Timing */}
        <div>
          <label htmlFor="marketTiming" className="block text-sm font-medium text-gray-300 mb-1">Market Timing / Session</label>
          <select
            id="marketTiming"
            name="marketTiming"
            value={userSettings.marketTiming}
            onChange={handleInputChange}
            className="w-full bg-[var(--color-bg-tertiary)] border border-[var(--color-border-secondary)] text-white rounded-md shadow-sm focus:outline-none focus:ring-1 focus:ring-yellow-500 py-2 px-3 text-base"
          >
            {MARKET_TIMING_OPTIONS.map(option => (
              <option key={option} value={option}>{option}</option>
            ))}
          </select>
          <p className="text-xs text-gray-500 mt-1">Guides the AI on session-specific behaviors like killzones or market opens.</p>
        </div>
        
        {/* Stop-Loss Strategy */}
        <div className="md:col-span-2">
          <label htmlFor="stopLossStrategy" className="block text-sm font-medium text-gray-300 mb-1">Stop-Loss Placement Logic</label>
          <select
            id="stopLossStrategy"
            name="stopLossStrategy"
            value={userSettings.stopLossStrategy}
            onChange={handleInputChange}
            className="w-full bg-[var(--color-bg-tertiary)] border border-[var(--color-border-secondary)] text-white rounded-md shadow-sm focus:outline-none focus:ring-1 focus:ring-yellow-500 py-2 px-3 text-base"
          >
            {STOP_LOSS_STRATEGY_OPTIONS.map(option => (
              <option key={option} value={option}>{option}</option>
            ))}
          </select>
          <p className="text-xs text-gray-500 mt-1">{STOP_LOSS_STRATEGY_DETAILS[userSettings.stopLossStrategy]}</p>
        </div>
      </div>
    </div>
  );
};

export default UserSettingsEditor;