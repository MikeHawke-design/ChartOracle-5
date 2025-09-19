import React from 'react';
import { ActiveView, User, UserSettings } from '../types.ts';
import { USER_TIERS } from '../constants.ts';
import Logo from './Logo.tsx';
import AuthDisplay from './AuthDisplay.tsx';
import OracleIcon from './OracleIcon.tsx';

interface HeaderProps {
  activeView: ActiveView;
  currentUser: User | null;
  onNavClick: (view: ActiveView) => void;
  onLogout: () => void;
  isPageScrolled: boolean;
  isAnalyzing: boolean;
  userSettings: UserSettings;
}

const NavButton: React.FC<{
    onClick: () => void;
    isActive: boolean;
    children: React.ReactNode;
    fontSize: number;
}> = ({ onClick, isActive, children, fontSize }) => (
    <button
        onClick={onClick}
        className={`px-3 py-2 font-semibold rounded-md transition-colors ${
            isActive
                ? 'bg-yellow-500/10 text-yellow-400'
                : 'text-gray-300 hover:bg-gray-700/50'
        }`}
        style={{ fontSize: `${fontSize}px`}}
    >
        {children}
    </button>
);

const Header: React.FC<HeaderProps> = ({ 
    activeView, 
    currentUser, 
    onNavClick, 
    onLogout, 
    isPageScrolled,
    isAnalyzing,
    userSettings,
}) => {
    
    const headerBaseClasses = "py-2 px-4 flex items-center justify-between border-b fixed top-0 left-0 right-0 z-50 transition-all duration-300 ease-in-out";
    const scrolledClasses = "bg-gray-800/70 backdrop-blur-md shadow-lg border-gray-700/50";
    const topClasses = "bg-gray-800 border-gray-700";

    return (
        <header className={`${headerBaseClasses} ${isPageScrolled ? scrolledClasses : topClasses}`}>
            {/* Left Section - Logo */}
            <div className="flex justify-start items-center">
                <button
                    onClick={() => onNavClick('analyze')}
                    aria-label="Go to homepage"
                    className="flex items-center space-x-3 bg-transparent border-none p-0 cursor-pointer text-left"
                >
                    <Logo className="w-20 h-20" isLoading={isAnalyzing} />
                    <h1 
                        className="font-bold text-white tracking-tight whitespace-nowrap"
                        style={{ fontSize: `${userSettings.headingFontSize + 8}px` }}
                    >
                        Chart Oracle
                    </h1>
                </button>
            </div>

            {/* Center Section - Navigation */}
            {currentUser && (
                <nav className="hidden md:flex flex-initial items-center justify-center space-x-2 bg-gray-900/50 p-1 rounded-lg border border-gray-700/50">
                    <NavButton onClick={() => onNavClick('analyze')} isActive={activeView.startsWith('analyze')} fontSize={userSettings.uiFontSize}>Oracle</NavButton>
                    <NavButton onClick={() => onNavClick('academy')} isActive={activeView === 'academy'} fontSize={userSettings.uiFontSize}>Academy</NavButton>
                    <NavButton onClick={() => onNavClick('journal')} isActive={activeView === 'journal'} fontSize={userSettings.uiFontSize}>Journal</NavButton>
                    {currentUser.tier === USER_TIERS.MASTER && (
                         <button
                            onClick={() => onNavClick('master-controls')}
                            className={`px-3 py-2 font-semibold rounded-md transition-colors ${
                                activeView === 'master-controls'
                                    ? 'bg-purple-500/10 text-purple-300 ring-1 ring-purple-500/50'
                                    : 'text-gray-300 hover:bg-gray-700/50'
                            }`}
                            style={{ fontSize: `${userSettings.uiFontSize}px`}}
                        >
                            Master Controls
                        </button>
                    )}
                </nav>
            )}

            {/* Right Section - User Info & Auth */}
            <div className="flex justify-end items-center">
                {currentUser ? (
                    <div className="flex items-center space-x-4">
                        <AuthDisplay 
                            currentUser={currentUser}
                            onLogout={onLogout}
                            onNavClick={onNavClick}
                        />
                    </div>
                ) : (
                    <div className="px-4 py-2 text-sm font-medium text-gray-400">
                        Please enter your access key.
                    </div>
                )}
            </div>
        </header>
    );
};

export default Header;