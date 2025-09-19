import React, { useState, useRef, useEffect, useMemo } from 'react';
import { createPortal } from 'react-dom';
import { AnalysisResults, StrategyKey, UserSettings, UploadedImageKeys, User, StrategyLogicData, ApiConfiguration, MarketDataCache, EodhdUsageStats, UserUsage } from '../types.ts';
// FIX: Changed import to a named import to match the corrected export from ImageUploader.
import { ImageUploader, ImageUploaderHandles } from './ImageUploader.tsx';
import StrategyRequirements from './StrategyRequirements.tsx';
import UserSettingsEditor from './UserSettings.tsx';
import Logo from './Logo.tsx';

interface DashboardProps {
  onAnalysisComplete: (results: AnalysisResults, strategies: StrategyKey[], images: UploadedImageKeys, useRealTimeContext: boolean) => void;
  userSettings: UserSettings;
  onUserSettingsChange: (settingKey: keyof UserSettings, value: any) => void;
  initialImages?: UploadedImageKeys | null;
  currentUser: User | null;
  userUsage: UserUsage;
  dashboardSelectedStrategies: StrategyKey[];
  onDashboardStrategyChange: (key: StrategyKey) => void;
  onSetDashboardStrategies: (keys: StrategyKey[]) => void;
  dashboardSelectedMarketData: string[];
  setDashboardSelectedMarketData: React.Dispatch<React.SetStateAction<string[]>>;
  strategyLogicData: Record<StrategyKey, StrategyLogicData>;
  isAnalyzing: boolean;
  setIsAnalyzing: (isAnalyzing: boolean) => void;
  onLogTokenUsage: (tokens: number) => void;
  apiConfig: ApiConfiguration;
  onInitiateCoaching: () => void;
  viewedStrategy: StrategyKey | null;
  setViewedStrategy: (key: StrategyKey | null) => void;
  marketDataCache: MarketDataCache;
  isRedoTriggered: boolean;
  setIsRedoTriggered: (isTriggered: boolean) => void;
  setApiConfig: React.Dispatch<React.SetStateAction<ApiConfiguration>>;
  onFetchAndLoadData: (symbol: string, timeframe: string, from: string, to: string) => Promise<{ count: number; key: string; }>;
  onRemoveMarketData: (cacheKey: string) => void;
  eodhdUsage: EodhdUsageStats | null;
  onFetchEodhdUsage: () => void;
}

const LockIcon: React.FC<{className?: string}> = (props) => <svg {...props} xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M10 1a4.5 4.5 0 00-4.5 4.5V9H5a2 2 0 00-2 2v6a2 2 0 002 2h10a2 2 0 002 2v-6a2 2 0 00-2-2h-.5V5.5A4.5 4.5 0 0010 1zm3 8V5.5a3 3 0 10-6 0V9h6z" clipRule="evenodd" /></svg>;
const CheckIcon: React.FC<{className?: string}> = (props) => <svg {...props} xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" /></svg>;
const WarningIcon: React.FC<{className?: string}> = (props) => <svg {...props} xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M8.257 3.099c.636-1.1 2.29-1.1 2.926 0l5.578 9.663c.636 1.1-.18 2.488-1.463 2.488H4.142c-1.282 0-2.098-1.387-1.463-2.488l5.578-9.663zM10 5a.75.75 0 01.75.75v3.5a.75.75 0 01-1.5 0v-3.5A.75.75 0 0110 5zm0 9a1 1 0 100-2 1 1 0 000 2z" clipRule="evenodd" /></svg>;
const CoachingIcon = (props: { className?: string }) => <svg {...props} xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" d="M17.25 6.75 22.5 12l-5.25 5.25m-10.5 0L1.5 12l5.25-5.25m7.5-3-4.5 16.5" /></svg>;
const ChevronDownIcon = (props:{className?:string}) => <svg {...props} xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M5.22 8.22a.75.75 0 0 1 1.06 0L10 11.94l3.72-3.72a.75.75 0 1 1 1.06 1.06l-4.25 4.25a.75.75 0 0 1-1.06 0L5.22 9.28a.75.75 0 0 1 0-1.06Z" clipRule="evenodd" /></svg>;


const Section: React.FC<{ number: number, title: string, children: React.ReactNode, disabled?: boolean, fontSize: number }> = ({ number, title, children, disabled, fontSize }) => (
    <div className={`transition-opacity ${disabled ? 'opacity-50' : 'opacity-100'}`}>
        <div className="flex items-center gap-4 mb-4">
            <div className="flex items-center justify-center w-8 h-8 rounded-full bg-yellow-500 text-gray-900 font-bold text-lg flex-shrink-0">{number}</div>
            <h3 className="font-bold text-white" style={{ fontSize: `${fontSize}px` }}>{title}</h3>
        </div>
        <div className="pl-12">
            {children}
        </div>
    </div>
);

// FIX: Changed to a named export to resolve module conflicts.
export const Dashboard: React.FC<DashboardProps> = ({ 
    onAnalysisComplete, userSettings, onUserSettingsChange, initialImages, currentUser,
    dashboardSelectedStrategies, onDashboardStrategyChange, onSetDashboardStrategies, 
    dashboardSelectedMarketData, setDashboardSelectedMarketData,
    strategyLogicData, isAnalyzing, setIsAnalyzing, onLogTokenUsage, 
    apiConfig, onInitiateCoaching,
    viewedStrategy, setViewedStrategy, marketDataCache, isRedoTriggered, setIsRedoTriggered
}) => {
    
    const uploaderRef = useRef<ImageUploaderHandles>(null);
    const [uploaderPhase, setUploaderPhase] = useState<'idle' | 'gathering' | 'validating' | 'ready' | 'analyzing'>('idle');
    const [useRealTimeContext, setUseRealTimeContext] = useState<boolean>(true);
    const [useHighRes, setUseHighRes] = useState<boolean>(true); // For Master tier toggle
    const [expandedConcepts, setExpandedConcepts] = useState<Record<StrategyKey, boolean>>({});
    const [tooltipState, setTooltipState] = useState<{ content: string; top: number; left: number } | null>(null);
    const [isPromptVisible, setIsPromptVisible] = useState(false);

    useEffect(() => {
      if (isRedoTriggered) {
        handleTriggerAnalysis();
        setIsRedoTriggered(false);
      }
    }, [isRedoTriggered]);

    useEffect(() => {
        setIsPromptVisible(false);
    }, [viewedStrategy]);

    const handleMouseEnter = (e: React.MouseEvent<HTMLSpanElement>, content: string) => {
        const span = e.currentTarget;
        if (span.scrollWidth > span.clientWidth) {
            const rect = span.getBoundingClientRect();
            setTooltipState({
                content,
                top: rect.top,
                left: rect.left + rect.width / 2,
            });
        }
    };

    const handleMouseLeave = () => {
        setTooltipState(null);
    };

    const handleToggleExpand = (key: StrategyKey) => {
        setExpandedConcepts(prev => ({...prev, [key]: !prev[key]}));
    };
    
    const info = viewedStrategy ? strategyLogicData[viewedStrategy] : null;

    const handleTriggerAnalysis = () => {
        if (!uploaderRef.current) return;
        setIsAnalyzing(true);
        uploaderRef.current.triggerAnalysis(useRealTimeContext);
    }
    
    const canAnalyze = !!apiConfig.geminiApiKey || !!apiConfig.openaiApiKey;
    
    const isSubmitDisabled = (uploaderPhase !== 'ready' && dashboardSelectedMarketData.length === 0) || isAnalyzing || !canAnalyze || dashboardSelectedStrategies.length === 0;

    let submitButtonTooltip = "";
    if (!canAnalyze) {
        submitButtonTooltip = "Please set an API key in Master Controls.";
    } else if (dashboardSelectedStrategies.length === 0) {
        submitButtonTooltip = "Please select at least one strategy.";
    } else if (uploaderPhase !== 'ready' && dashboardSelectedMarketData.length === 0) {
        submitButtonTooltip = "Please complete the guided chart upload or select a cached dataset to enable analysis.";
    }

    const { parentStrategies, childrenByParent } = useMemo(() => {
        const parents: [StrategyKey, StrategyLogicData][] = [];
        const childrenMap: Record<StrategyKey, [StrategyKey, StrategyLogicData][]> = {};

        Object.entries(strategyLogicData).forEach(([key, data]) => {
            if (!data.isEnabled) return;

            if (data.parentId && strategyLogicData[data.parentId]) {
                if (!childrenMap[data.parentId]) {
                    childrenMap[data.parentId] = [];
                }
                childrenMap[data.parentId].push([key, data]);
            } else {
                parents.push([key, data]);
            }
        });
        return { parentStrategies: parents, childrenByParent: childrenMap };
    }, [strategyLogicData]);

    const groupedMarketData = useMemo(() => {
        const grouped: Record<string, { key: string; timeframe: string; count: number; dateRange: string; }[]> = {};
        Object.entries(marketDataCache).forEach(([key, candles]) => {
            if (!candles || candles.length === 0) return;
            
            const lastDashIndex = key.lastIndexOf('-');
            const symbol = lastDashIndex > -1 ? key.substring(0, lastDashIndex) : key;
            const timeframe = lastDashIndex > -1 ? key.substring(lastDashIndex + 1) : 'Unknown';
    
            if (!grouped[symbol]) {
                grouped[symbol] = [];
            }
    
            const sortedDates = candles.map((c: any) => new Date(c.date)).sort((a: any, b: any) => a.getTime() - b.getTime());
            const startDate = sortedDates[0].toLocaleDateString(undefined, { year: '2-digit', month: 'short', day: 'numeric' });
            const endDate = sortedDates[sortedDates.length - 1].toLocaleDateString(undefined, { year: '2-digit', month: 'short', day: 'numeric' });
            
            grouped[symbol].push({
                key,
                timeframe,
                count: candles.length,
                dateRange: `${startDate} to ${endDate}`
            });
        });
        return grouped;
    }, [marketDataCache]);


    const handleMarketDataSelectionChange = (key: string) => {
        setDashboardSelectedMarketData(prev => {
            const newSet = new Set(prev);
            if (newSet.has(key)) {
                newSet.delete(key);
            } else {
                newSet.add(key);
            }
            return Array.from(newSet);
        });
    };

    return (
        <div className="p-4 md:p-6">
             {tooltipState && createPortal(
                <div
                    className="fixed z-[100] py-1 px-3 font-semibold text-white bg-gray-900 rounded-md shadow-lg border border-gray-700 pointer-events-none"
                    style={{
                        top: tooltipState.top,
                        left: tooltipState.left,
                        transform: 'translate(-50%, -120%)',
                        fontSize: `${userSettings.uiFontSize - 2}px`
                    }}
                >
                    {tooltipState.content}
                </div>,
                document.body
            )}
            {!currentUser && (
                <div className="max-w-3xl mx-auto bg-red-800/30 border border-red-600 rounded-lg p-6 mb-6 text-center">
                    <h3 className="text-xl font-bold text-red-300">Login Required</h3>
                    <p className="text-red-200 mt-2">Please log in to analyze charts and access your dashboard.</p>
                </div>
            )}

            <div className="grid grid-cols-1 lg:grid-cols-5 gap-8">
                <div className={`lg:col-span-3 space-y-8 ${(!currentUser) ? 'opacity-50 pointer-events-none' : ''}`}>
                    <Section number={1} title="Select Your Strategies" fontSize={userSettings.headingFontSize}>
                        <p className="text-gray-400 mb-3" style={{ fontSize: `${userSettings.uiFontSize}px` }}>Build your analysis by selecting your custom-built strategies.</p>
                        
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                            <div className="md:col-span-1 space-y-2">
                                <h4 className="font-semibold text-gray-400 text-xs uppercase tracking-wider">Your Strategies</h4>
                                {parentStrategies.length > 0 ? parentStrategies.map(([key, strategy]) => {
                                    const children = childrenByParent[key];
                                    const isExpanded = !!expandedConcepts[key];

                                    if (children && children.length > 0) {
                                        const childrenKeys = children.map(([childKey]) => childKey);
                                        const allKeysInGroup = [key, ...childrenKeys];
                                        const selectedCount = allKeysInGroup.filter(k => dashboardSelectedStrategies.includes(k)).length;
                                        const isAllSelected = selectedCount === allKeysInGroup.length;
                                        const isPartiallySelected = selectedCount > 0 && !isAllSelected;

                                        const handleMasterCheckboxChange = () => {
                                            const currentStrategies = new Set(dashboardSelectedStrategies);
                                            if (isAllSelected) {
                                                allKeysInGroup.forEach(k => currentStrategies.delete(k));
                                            } else {
                                                allKeysInGroup.forEach(k => currentStrategies.add(k));
                                            }
                                            onSetDashboardStrategies(Array.from(currentStrategies));
                                        };

                                        return (
                                            <div key={key} className="bg-gray-700/20 rounded-md">
                                                <div className="flex items-center p-3 gap-3">
                                                    <input
                                                        type="checkbox"
                                                        className="h-5 w-5 rounded bg-gray-600 border-gray-500 text-yellow-500 focus:ring-yellow-500/50 focus:ring-offset-2 focus:ring-offset-gray-800"
                                                        ref={el => { if (el) { el.indeterminate = isPartiallySelected; } }}
                                                        checked={isAllSelected}
                                                        onChange={handleMasterCheckboxChange}
                                                        title={isAllSelected ? "Deselect all" : "Select all"}
                                                    />
                                                    <div className="flex-grow cursor-pointer min-w-0" onClick={() => setViewedStrategy(key)}>
                                                        <span className={`block font-bold truncate ${viewedStrategy === key ? 'text-yellow-400' : 'text-white'}`} style={{ fontSize: `${userSettings.uiFontSize}px` }}>
                                                            {strategy.name}
                                                        </span>
                                                    </div>
                                                    <button onClick={() => handleToggleExpand(key)} className="p-1 text-gray-400 hover:text-white" title={isExpanded ? "Collapse" : "Expand"}>
                                                        <ChevronDownIcon className={`w-5 h-5 transition-transform duration-200 ${isExpanded ? 'rotate-180' : ''}`} />
                                                    </button>
                                                </div>

                                                <div className={`grid transition-all duration-300 ease-in-out ${isExpanded ? 'grid-rows-[1fr]' : 'grid-rows-[0fr]'}`}>
                                                    <div className="overflow-hidden">
                                                        <div className="pt-1 pb-2 pr-2 pl-6 space-y-1">
                                                            {children.map(([childKey, childData]) => {
                                                                const isChildSelected = dashboardSelectedStrategies.includes(childKey);
                                                                return (
                                                                    <div 
                                                                        key={childKey} 
                                                                        className={`flex items-center p-2 rounded-md border-l-2 transition-colors ${viewedStrategy === childKey ? 'bg-yellow-500/10 border-yellow-500' : 'border-gray-600 hover:bg-gray-700/50'}`}
                                                                    >
                                                                        <input
                                                                            type="checkbox"
                                                                            className="h-4 w-4 rounded bg-gray-600 border-gray-500 text-yellow-500 focus:ring-yellow-500/50"
                                                                            checked={isChildSelected}
                                                                            onChange={() => onDashboardStrategyChange(childKey)}
                                                                            disabled={!currentUser}
                                                                        />
                                                                        <div className="flex-grow mx-2 cursor-pointer min-w-0" onClick={() => setViewedStrategy(childKey)}>
                                                                            <span 
                                                                                className={`block truncate italic ${viewedStrategy === childKey ? 'text-yellow-300' : 'text-gray-300'}`}
                                                                                style={{ fontSize: `${userSettings.uiFontSize}px` }}
                                                                                onMouseEnter={(e) => handleMouseEnter(e, childData.name)}
                                                                                onMouseLeave={handleMouseLeave}
                                                                            >
                                                                                {childData.name}
                                                                            </span>
                                                                        </div>
                                                                    </div>
                                                                );
                                                            })}
                                                        </div>
                                                    </div>
                                                </div>
                                            </div>
                                        );
                                    } else {
                                        const isSelected = dashboardSelectedStrategies.includes(key);
                                        return (
                                            <div key={key} className={`flex items-center gap-3 p-3 rounded-md border transition-colors cursor-pointer ${viewedStrategy === key ? 'bg-yellow-500/10 border-yellow-500' : 'border-gray-700 hover:bg-gray-700/50'}`} onClick={() => setViewedStrategy(key)}>
                                                <input type="checkbox" className="h-5 w-5 rounded bg-gray-600 border-gray-500 text-yellow-500 focus:ring-yellow-500/50 focus:ring-offset-gray-800 disabled:opacity-50 flex-shrink-0" checked={isSelected} onChange={() => onDashboardStrategyChange(key)} disabled={!currentUser} onClick={(e) => e.stopPropagation()} />
                                                <span 
                                                    className={`block font-bold flex-grow truncate`}
                                                    style={{ fontSize: `${userSettings.uiFontSize}px` }}
                                                    onMouseEnter={(e) => handleMouseEnter(e, strategy.name)}
                                                    onMouseLeave={handleMouseLeave}
                                                >
                                                    {strategy.name}
                                                </span>
                                            </div>
                                        );
                                    }
                                }) : (
                                    <p className="italic p-2" style={{ fontSize: `${userSettings.uiFontSize}px` }}>No custom strategies added yet. Go to Master Controls to create one.</p>
                                )}
                            </div>
                            <div className="md:col-span-2">
                                <div className="sticky top-32">
                                    {info ? (
                                        <div className="bg-gray-800 p-4 rounded-lg border border-gray-700 flex flex-col h-full">
                                            <h4 className="font-bold text-yellow-400 mb-2" style={{ fontSize: `${userSettings.headingFontSize}px` }}>{info.name}</h4>
                                            <p className="text-gray-300 mb-4 flex-grow" style={{ fontSize: `${userSettings.uiFontSize}px` }}>{info.description}</p>
                                            
                                            <div className="space-y-4">
                                                <div>
                                                    <h5 className="text-xs font-semibold text-gray-400 uppercase mb-2">BEST FOR</h5>
                                                    <div className="flex flex-wrap gap-2">
                                                        {info.assetClasses?.map((asset: string) => (
                                                            <span key={asset} className="px-2 py-1 text-xs font-semibold bg-blue-600/50 text-blue-200 rounded-full border border-blue-500/50">
                                                                {asset}
                                                            </span>
                                                        ))}
                                                        {info.tradingStyles?.map((style: string) => (
                                                            <span key={style} className="px-2 py-1 text-xs font-semibold bg-purple-600/50 text-purple-200 rounded-full border border-purple-500/50">
                                                                {style}
                                                            </span>
                                                        ))}
                                                        {info.timeZoneSpecificity && info.timeZoneSpecificity !== 'None' && (
                                                            <span key={info.timeZoneSpecificity} className="px-2 py-1 text-xs font-semibold bg-red-600/50 text-red-200 rounded-full border border-red-500/50">
                                                                {info.timeZoneSpecificity}
                                                            </span>
                                                        )}
                                                    </div>
                                                    {(!info.assetClasses || info.assetClasses.length === 0) &&
                                                    (!info.tradingStyles || info.tradingStyles.length === 0) &&
                                                    (!info.timeZoneSpecificity || info.timeZoneSpecificity === 'None') && (
                                                        <p className="text-xs text-gray-500 italic">No specific recommendations provided.</p>
                                                    )}
                                                </div>
                                                
                                                {info.confluence && info.confluence.length > 0 && <div><h5 className="text-xs font-semibold text-gray-400 uppercase mb-2">High-Confluence Pairings:</h5><div className="flex flex-wrap gap-2">{info.confluence?.map((confluenceKey: StrategyKey) => { const isSelected = dashboardSelectedStrategies.includes(confluenceKey); return (<button key={confluenceKey} onClick={() => onDashboardStrategyChange(confluenceKey)} className={`px-3 py-1 text-sm font-semibold rounded-full transition-colors flex items-center gap-1 ${isSelected ? 'bg-blue-500/20 border border-blue-500 text-blue-300' : 'bg-blue-900/30 border border-blue-700/50 hover:border-blue-500 text-blue-300/80'}`}>{strategyLogicData[confluenceKey]?.name || confluenceKey} {isSelected ? '✓' : '+'}</button>)})}</div></div>}
                                                {info.requiredConfluence && info.requiredConfluence.length > 0 && <div><h5 className="text-xs font-semibold text-gray-400 uppercase mb-2 flex items-center"><LockIcon className="w-4 h-4 mr-1.5 text-red-400" /> Required Confirmation</h5><div className="flex flex-wrap gap-2">{info.requiredConfluence.map((reqKey: StrategyKey) => { const isSelected = dashboardSelectedStrategies.includes(reqKey); const handleClick = () => { if (!isSelected) { onDashboardStrategyChange(reqKey); } }; return (<button key={reqKey} onClick={handleClick} className={`px-3 py-1 text-sm font-semibold rounded-full transition-colors flex items-center gap-2 border ${isSelected ? 'bg-green-900/50 border-green-700 text-green-300 cursor-default' : 'bg-red-900/50 border-red-700 hover:border-red-500 text-red-300'}`} title={isSelected ? `${strategyLogicData[reqKey]?.name} is selected.` : `Click to add required strategy: ${strategyLogicData[reqKey]?.name}`} >{isSelected ? <CheckIcon className="w-4 h-4"/> : <WarningIcon className="w-4 h-4"/>} {strategyLogicData[reqKey]?.name} </button>)})}</div><p className="text-xs text-gray-500 mt-2">The AI's logic requires these for high-quality signal validation.</p></div>}
                                                
                                                <div className="border-t border-gray-700 pt-4">
                                                     <button onClick={() => setIsPromptVisible(p => !p)} className="text-sm font-semibold text-purple-300 hover:text-purple-200 w-full text-left flex items-center justify-between">
                                                        <span>View Core AI Logic</span>
                                                        <ChevronDownIcon className={`w-5 h-5 transition-transform ${isPromptVisible ? 'rotate-180' : ''}`} />
                                                    </button>
                                                    {isPromptVisible && (
                                                         <pre className="mt-2 bg-gray-900/70 p-3 rounded-md text-xs text-gray-300 whitespace-pre-wrap font-mono border border-gray-700/50 max-h-48 overflow-y-auto">
                                                            {info.prompt}
                                                        </pre>
                                                    )}
                                                </div>
                                            </div>
                                        </div>
                                    ) : ( <div className="bg-gray-800 p-4 rounded-lg border border-gray-700 flex items-center justify-center min-h-[360px]"><p className="text-gray-500">Click a strategy on the left.</p></div> )}
                                </div>
                            </div>
                        </div>
                    </Section>

                    <Section number={2} title="Adjust Your Preferences" disabled={dashboardSelectedStrategies.length === 0} fontSize={userSettings.headingFontSize}>
                         <UserSettingsEditor userSettings={userSettings} onUserSettingsChange={onUserSettingsChange} />
                    </Section>

                    <Section number={3} title="Provide Analysis Context" disabled={dashboardSelectedStrategies.length === 0} fontSize={userSettings.headingFontSize}>
                        <div className="space-y-4">
                            <div>
                                <h4 className="font-bold text-gray-200">Select Cached Data for Context</h4>
                                <p className="text-sm text-gray-400 mb-2">Select multiple timeframes of the same asset to enhance AI analysis resolution.</p>
                                <div className="space-y-3 bg-gray-800/70 p-4 rounded-lg border border-gray-700 max-h-60 overflow-y-auto">
                                    {Object.keys(groupedMarketData).length > 0 ? Object.entries(groupedMarketData).map(([symbol, dataEntries]) => (
                                        <div key={symbol}>
                                            <p className="font-semibold text-yellow-300 text-sm">{symbol}</p>
                                            <div className="pl-4 mt-1 grid grid-cols-1 sm:grid-cols-2 gap-2">
                                                {dataEntries.map(entry => (
                                                    <label key={entry.key} className="flex items-start space-x-3 p-2 rounded-md bg-gray-700/50 hover:bg-gray-700 cursor-pointer">
                                                        <input 
                                                            type="checkbox" 
                                                            checked={dashboardSelectedMarketData.includes(entry.key)} 
                                                            onChange={() => handleMarketDataSelectionChange(entry.key)} 
                                                            className="h-4 w-4 mt-1 rounded bg-gray-600 border-gray-500 text-yellow-500 focus:ring-yellow-500/50 flex-shrink-0" 
                                                        />
                                                        <div>
                                                            <span className="text-sm font-semibold text-gray-200">{entry.timeframe}</span>
                                                            <p className="text-xs text-gray-400">{entry.count.toLocaleString()} candles</p>
                                                            <p className="text-xs text-gray-500">{entry.dateRange}</p>
                                                        </div>
                                                    </label>
                                                ))}
                                            </div>
                                        </div>
                                    )) : <p className="text-sm text-gray-500 text-center py-4">No cached data available. Go to Master Controls to fetch data.</p>}
                                </div>
                            </div>
                             <div>
                                <ImageUploader 
                                    ref={uploaderRef}
                                    onAnalysisComplete={(results, strats, imgs, useRealTimeContext) => onAnalysisComplete(results, strats.length > 0 ? strats : dashboardSelectedStrategies, imgs, useRealTimeContext)}
                                    selectedStrategies={dashboardSelectedStrategies} 
                                    userSettings={userSettings}
                                    initialImages={initialImages}
                                    strategyLogicData={strategyLogicData}
                                    isAnalyzing={isAnalyzing}
                                    setIsAnalyzing={setIsAnalyzing}
                                    onPhaseChange={setUploaderPhase}
                                    apiConfig={apiConfig}
                                    onLogTokenUsage={onLogTokenUsage}
                                    marketDataCache={marketDataCache}
                                    dashboardSelectedMarketData={dashboardSelectedMarketData}
                                />
                            </div>
                        </div>
                    </Section>
                </div>

                <div className="lg:col-span-2">
                    <div className="sticky top-32">
                        <div className="bg-gray-800 rounded-lg border border-gray-700 shadow-lg overflow-y-auto max-h-[calc(100vh-9rem)]">
                            <div className="p-6">
                                <h3 className="font-bold text-yellow-400 mb-4 border-b border-gray-700 pb-3" style={{ fontSize: `${userSettings.headingFontSize}px` }}>Live Setup Summary</h3>
                                
                                <div className="space-y-4 mb-6">
                                    <div>
                                        <h4 className="font-semibold text-gray-300 mb-2" style={{ fontSize: `${userSettings.uiFontSize}px` }}>Selected Strategies:</h4>
                                        {dashboardSelectedStrategies.length > 0 ? (
                                            <div className="flex flex-wrap gap-2">
                                                {dashboardSelectedStrategies.map(key => (
                                                    <span key={key} className="px-3 py-1 font-semibold bg-blue-600 text-blue-100 rounded-full" style={{ fontSize: `${userSettings.uiFontSize - 1}px` }}>{strategyLogicData[key]?.name || key}</span>
                                                ))}
                                            </div>
                                        ) : (
                                            <p className="text-gray-500" style={{ fontSize: `${userSettings.uiFontSize}px` }}>No strategies selected.</p>
                                        )}
                                    </div>
                                </div>
                                
                                {dashboardSelectedStrategies.length > 0 && <StrategyRequirements selectedStrategies={dashboardSelectedStrategies} strategyLogicData={strategyLogicData} />}
                                
                                <div className="mt-6 mb-4 flex items-center justify-between p-3 bg-gray-900/50 rounded-md border border-gray-700/50">
                                    <label htmlFor="real-time-context-toggle" className="font-medium text-gray-300 flex-grow pr-2" style={{ fontSize: `${userSettings.uiFontSize}px` }}>Add Real-Time Context</label>
                                    <button type="button" id="real-time-context-toggle" role="switch" aria-checked={useRealTimeContext} onClick={() => setUseRealTimeContext(p => !p)} className={`relative inline-flex h-6 w-11 flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none focus:ring-2 focus:ring-yellow-500 focus:ring-offset-2 focus:ring-offset-gray-800 ${useRealTimeContext ? 'bg-yellow-500' : 'bg-gray-600'}`}>
                                        <span aria-hidden="true" className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${useRealTimeContext ? 'translate-x-5' : 'translate-x-0'}`} />
                                    </button>
                                </div>
                                
                                <div className="mb-4 flex items-center justify-between p-3 bg-gray-900/50 rounded-md border border-gray-700/50">
                                    <label htmlFor="high-res-toggle" className="font-medium text-gray-300 flex-grow pr-2" style={{ fontSize: `${userSettings.uiFontSize}px` }}>Use High-Res Analysis</label>
                                    <button type="button" id="high-res-toggle" role="switch" aria-checked={useHighRes} onClick={() => setUseHighRes(p => !p)} className={`relative inline-flex h-6 w-11 flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none focus:ring-2 focus:ring-yellow-500 focus:ring-offset-2 focus:ring-offset-gray-800 ${useHighRes ? 'bg-purple-500' : 'bg-gray-600'}`}>
                                        <span aria-hidden="true" className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${useHighRes ? 'translate-x-5' : 'translate-x-0'}`} />
                                    </button>
                                </div>
                                
                                <div className="space-y-3">
                                     <button
                                        onClick={onInitiateCoaching}
                                        disabled={!canAnalyze}
                                        className="w-full font-bold py-2 px-4 rounded-lg transition-colors text-base flex items-center justify-center gap-2 bg-purple-600 hover:bg-purple-500 text-white disabled:bg-gray-600 disabled:cursor-not-allowed"
                                        title={!canAnalyze ? "Please set your API key in Master Controls." : "Get step-by-step guidance from the Oracle."}
                                    >
                                        <CoachingIcon className="w-5 h-5"/>
                                        Start Live Coaching
                                    </button>
                                    <button 
                                        onClick={handleTriggerAnalysis} 
                                        disabled={isSubmitDisabled} 
                                        className={`w-full font-bold py-3 px-8 rounded-lg transition-colors flex items-center justify-center mx-auto
                                            ${isSubmitDisabled ? 'bg-gray-600 text-gray-400 cursor-not-allowed' : 'bg-yellow-500 hover:bg-yellow-400 text-gray-900'}`}
                                        style={{ fontSize: `${userSettings.headingFontSize}px`}}
                                        title={submitButtonTooltip}
                                    >
                                        {isAnalyzing ? <><Logo className="-ml-1 mr-3 h-5 w-5" isLoading={true} />Analyzing...</> : `Analyze`}
                                    </button>
                                </div>

                                <p className="text-xs text-yellow-300/80 mt-2 text-center h-4">
                                     {isSubmitDisabled && submitButtonTooltip}
                                </p>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};