import React, { useState } from 'react';
import Logo from './Logo.tsx';
import { BETA_ACCESS_KEYS } from '../constants.ts';

interface AccessGateProps {
  onAuthSuccess: () => void;
  onOpenLegal: (type: 'privacy' | 'terms') => void;
}

const EyeIcon: React.FC<{className?: string}> = (props) => (
  <svg {...props} xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" d="M2.036 12.322a1.012 1.012 0 010-.639C3.423 7.51 7.36 4.5 12 4.5c4.638 0 8.573 3.007 9.963 7.178.07.207.07.431 0 .639C20.577 16.49 16.64 19.5 12 19.5c-4.638 0-8.573-3.007-9.963-7.178z" />
    <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
  </svg>
);

const EyeSlashIcon: React.FC<{className?: string}> = (props) => (
  <svg {...props} xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" d="M3.98 8.223A10.477 10.477 0 001.934 12C3.226 16.338 7.244 19.5 12 19.5c.993 0 1.953-.138 2.863-.395M6.228 6.228A10.45 10.45 0 0112 4.5c4.756 0 8.773 3.162 10.065 7.498a10.523 10.523 0 01-4.293 5.774M6.228 6.228L3 3m3.228 3.228l3.65 3.65m7.894 7.894L21 21m-3.228-3.228l-3.65-3.65m0 0a3 3 0 10-4.243-4.243m4.243 4.243l-4.243-4.243" />
  </svg>
);


const AccessGate: React.FC<AccessGateProps> = ({ onAuthSuccess, onOpenLegal }) => {
  const [inputKey, setInputKey] = useState('');
  const [error, setError] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [isKeyVisible, setIsKeyVisible] = useState(false);
  const [agreedToTerms, setAgreedToTerms] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!agreedToTerms) {
        setError("You must agree to the Terms and Privacy Policy to continue.");
        return;
    }
    setError('');
    setIsProcessing(true);

    // Add a slight delay for better UX
    setTimeout(() => {
      if (BETA_ACCESS_KEYS.includes(inputKey)) {
        onAuthSuccess();
      } else {
        setError('Incorrect Beta Access Key. Please try again.');
        setIsProcessing(false);
      }
    }, 500);
  };
  
  const loadingSpinner = (
    <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
    </svg>
  );

  return (
    <div className="min-h-screen bg-gray-900 flex flex-col items-center justify-center p-4">
       <style>{`
        @keyframes fadeIn { from { opacity: 0; transform: translateY(10px); } to { opacity: 1; transform: translateY(0); } }
        .animate-fadeIn { animation: fadeIn 0.3s ease-out forwards; }
      `}</style>
      <div className="max-w-md w-full text-center animate-fadeIn">
        <div className="mx-auto mb-4">
          <Logo className="w-24 h-24 mx-auto" />
        </div>
        <h1 className="text-3xl font-bold text-white tracking-wider">Chart Oracle</h1>
        <p className="text-gray-400 mt-2 mb-8">Beta Access Key Required</p>
        
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="relative">
            <label htmlFor="master-key" className="sr-only">Beta Access Key</label>
            <input
              id="master-key"
              name="master-key"
              type={isKeyVisible ? 'text' : 'password'}
              autoComplete="current-password"
              required
              value={inputKey}
              onChange={(e) => setInputKey(e.target.value)}
              className="w-full bg-gray-800 border border-gray-600 text-white rounded-lg py-3 px-4 focus:outline-none focus:ring-2 focus:ring-yellow-500 text-center"
              placeholder="Enter Beta Access Key"
              disabled={isProcessing}
            />
            <button
              type="button"
              onClick={() => setIsKeyVisible(prev => !prev)}
              className="absolute inset-y-0 right-0 flex items-center px-4 text-gray-400 hover:text-yellow-300 transition-colors"
              aria-label={isKeyVisible ? "Hide key" : "Show key"}
            >
              {isKeyVisible ? <EyeSlashIcon className="h-5 w-5" /> : <EyeIcon className="h-5 w-5" />}
            </button>
          </div>

          <div className="flex items-start space-x-3 text-left p-1">
              <input 
                id="terms-agreement"
                type="checkbox"
                checked={agreedToTerms}
                onChange={(e) => { setAgreedToTerms(e.target.checked); setError(''); }}
                className="h-5 w-5 mt-0.5 rounded bg-gray-700 border-gray-500 text-yellow-500 focus:ring-yellow-500 flex-shrink-0"
              />
              <label htmlFor="terms-agreement" className="text-sm text-gray-400">
                I have read and agree to the 
                <button type="button" onClick={() => onOpenLegal('terms')} className="text-yellow-400 hover:underline mx-1 font-semibold">Terms of Use</button> 
                and 
                <button type="button" onClick={() => onOpenLegal('privacy')} className="text-yellow-400 hover:underline ml-1 font-semibold">Privacy Policy</button>.
              </label>
          </div>

          {error && <p className="text-red-400 text-sm animate-fadeIn">{error}</p>}
          
          <button
            type="submit"
            disabled={isProcessing || !agreedToTerms}
            className="w-full font-bold py-3 px-8 rounded-lg transition-colors text-lg disabled:cursor-not-allowed flex items-center justify-center mx-auto
            bg-yellow-500 hover:bg-yellow-400 text-gray-900 disabled:bg-gray-700 disabled:text-gray-400"
          >
            {isProcessing ? <>{loadingSpinner} Unlocking...</> : 'Unlock'}
          </button>
        </form>

        <div className="mt-8 text-xs text-gray-500 text-center border-t border-gray-700 pt-4">
            <p><strong>Disclaimer: Not Financial Advice.</strong> Chart Oracle is an AI tool for educational and paper trading purposes only. All analysis is hypothetical and should not be used for live trading decisions. Trading involves significant risk.</p>
        </div>
      </div>
    </div>
  );
};

export default AccessGate;