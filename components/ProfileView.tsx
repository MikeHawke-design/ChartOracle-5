import React from 'react';
import { User, UserSettings, ApiConfiguration } from '../types.ts';
import Avatar from './Avatar.tsx';

interface ProfileViewProps {
    currentUser: User;
    apiConfig: ApiConfiguration;
    onOpenAvatarSelection: () => void;
    userSettings: UserSettings;
}

const AvatarIcon = (props:{className?:string}) => <svg {...props} xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor"><path d="M10 8a3 3 0 1 0 0-6 3 3 0 0 0 0 6ZM3.465 14.493a1.25 1.25 0 0 0 .41 1.412A9.957 9.957 0 0 0 10 18.25a9.957 9.957 0 0 0 6.125-2.345a1.25 1.25 0 0 0 .41-1.412A9.99 9.99 0 0 0 10 12.5a9.99 9.99 0 0 0-6.535 1.993Z" /></svg>;

const ProfileView: React.FC<ProfileViewProps> = ({ currentUser, apiConfig, onOpenAvatarSelection, userSettings }) => {
    
    const hasApiKey = !!apiConfig.geminiApiKey;
    const hasAvatar = !!currentUser?.avatar;

    return (
        <div className="p-4 md:p-6 mx-auto space-y-8">
            <div className="text-center">
                <h2 className="font-bold text-white" style={{ fontSize: `${userSettings.headingFontSize + 12}px` }}>Your Profile</h2>
                <p className="text-gray-400 mt-1" style={{ fontSize: `${userSettings.uiFontSize}px` }}>Manage your account settings and subscription.</p>
            </div>

            {/* Avatar Setup */}
            {hasApiKey && !hasAvatar && (
                 <div className="bg-gray-800 rounded-lg p-6 border border-purple-700 flex flex-col md:flex-row items-center justify-between gap-4">
                    <div>
                        <h3 className="font-bold text-purple-400" style={{ fontSize: `${userSettings.headingFontSize}px` }}>Set Up Your Profile</h3>
                        <p className="mt-1 text-gray-400" style={{ fontSize: `${userSettings.uiFontSize}px` }}>Your API key is set! Now, let's generate your unique AI avatar.</p>
                    </div>
                     <button onClick={onOpenAvatarSelection} className="w-full md:w-auto font-bold py-2 px-6 rounded-lg bg-purple-600 hover:bg-purple-500 text-white flex items-center justify-center gap-2">
                        <AvatarIcon className="w-5 h-5"/> Generate Avatar
                    </button>
                 </div>
            )}
            
            {/* User Info Card */}
            <div className="bg-gray-800 rounded-lg p-6 border border-gray-700 flex flex-col md:flex-row items-center gap-6">
                <Avatar avatar={currentUser.avatar} tier={currentUser.tier} size="lg" />
                <div className="flex-grow text-center md:text-left">
                    <h2 className="font-bold text-white" style={{ fontSize: `${userSettings.headingFontSize + 8}px` }}>{currentUser.anonymousUsername}</h2>
                    <p className="font-semibold text-purple-400" style={{ fontSize: `${userSettings.headingFontSize}px` }}>{currentUser.tier} Tier</p>
                </div>
            </div>
            
            {/* Account Settings Placeholder */}
            <div className="bg-gray-800 rounded-lg p-6 border border-gray-700">
                <h3 className="font-bold text-yellow-400 mb-4" style={{ fontSize: `${userSettings.headingFontSize}px` }}>Account Settings</h3>
                <div className="space-y-4 opacity-50 cursor-not-allowed">
                    <div>
                        <label className="block font-medium text-gray-400" style={{ fontSize: `${userSettings.uiFontSize}px` }}>Username</label>
                        <input type="text" value={currentUser.anonymousUsername} disabled className="mt-1 block w-full bg-gray-700 border border-gray-600 rounded-md shadow-sm py-2 px-3 text-white"/>
                    </div>
                    <div>
                        <label className="block font-medium text-gray-400" style={{ fontSize: `${userSettings.uiFontSize}px` }}>Email Address (for recovery)</label>
                        <input type="email" placeholder="Not set" disabled className="mt-1 block w-full bg-gray-700 border border-gray-600 rounded-md shadow-sm py-2 px-3 text-white"/>
                    </div>
                    <button disabled className="font-bold py-2 px-4 rounded-lg bg-blue-600 text-white">Change Password</button>
                </div>
                 <p className="text-xs text-gray-500 mt-4">Account settings will be enabled in a future update.</p>
            </div>

            {/* Subscription Management Placeholder */}
            <div className="bg-gray-800 rounded-lg p-6 border border-gray-700">
                <h3 className="font-bold text-yellow-400 mb-4" style={{ fontSize: `${userSettings.headingFontSize}px` }}>Subscription</h3>
                 <div className="opacity-50 cursor-not-allowed">
                    <p className="text-gray-300" style={{ fontSize: `${userSettings.uiFontSize}px` }}>You are currently on the <span className="font-bold text-purple-300">{currentUser.tier} Tier</span> plan.</p>
                    <button disabled className="mt-4 font-bold py-2 px-4 rounded-lg bg-blue-600 text-white">Manage Subscription</button>
                </div>
                 <p className="text-xs text-gray-500 mt-4">Subscription management will be available when the platform goes live.</p>
            </div>

        </div>
    );
};

export default ProfileView;