import React from 'react';

interface FooterProps {
  onOpenLegal: (type: 'privacy' | 'terms') => void;
}

const Footer: React.FC<FooterProps> = ({ onOpenLegal }) => {
  return (
    <footer className="w-full text-center p-4 mt-auto border-t border-gray-700/50 flex-shrink-0">
      <div className="flex justify-center items-center space-x-4 text-xs text-gray-500">
        <span>© {new Date().getFullYear()} Chart Oracle. All Rights Reserved.</span>
        <div className="h-4 w-px bg-gray-600"></div>
        <button onClick={() => onOpenLegal('terms')} className="hover:text-yellow-400 transition-colors">
          Terms of Use
        </button>
        <div className="h-4 w-px bg-gray-600"></div>
        <button onClick={() => onOpenLegal('privacy')} className="hover:text-yellow-400 transition-colors">
          Privacy Policy
        </button>
      </div>
    </footer>
  );
};

export default Footer;
