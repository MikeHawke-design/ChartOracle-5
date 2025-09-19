

import React from 'react';

interface LegalModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const PrivacyPolicyModal: React.FC<LegalModalProps> = ({ isOpen, onClose }) => {
  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 bg-gray-900/80 flex items-center justify-center z-[110] p-4 animate-fadeIn"
      aria-modal="true"
      role="dialog"
      onClick={onClose}
    >
      <div
        className="bg-gray-800 p-6 rounded-lg shadow-xl max-w-3xl w-full border border-gray-700 max-h-[90vh] flex flex-col"
        onClick={e => e.stopPropagation()}
      >
        <div className="flex justify-between items-center pb-4 border-b border-gray-600 flex-shrink-0">
          <h2 className="text-xl font-bold text-yellow-400">Privacy Policy</h2>
          <button onClick={onClose} className="p-1 rounded-full text-gray-400 hover:text-white">&times;</button>
        </div>
        <div className="prose prose-sm prose-invert max-w-none text-gray-300 mt-4 overflow-y-auto pr-2">
            <p><em>Last Updated: {new Date().toLocaleDateString()}</em></p>
            <p>Your privacy is critically important to us. This policy outlines how Chart Oracle handles your data.</p>
            
            <h4>1. Data We Collect and Store</h4>
            <p>Chart Oracle is designed with privacy as a core principle. All of your personal and usage data is stored locally on your device within your web browser's <code>localStorage</code>. We do not operate a central server that collects or stores your personal information.</p>
            <ul>
                <li><strong>Locally Stored Data Includes:</strong> Your saved trades, user settings, custom strategy logic, course progress, chat messages, and knowledge base documents. This data remains in your browser and is not transmitted to us.</li>
                <li><strong>Data Sent for Analysis:</strong> When you perform an analysis, the chart images you upload, your selected strategies, and user preferences are sent to the Google Gemini API for processing. We do not store this information after the analysis is complete; it is used ephemerally to generate your result.</li>
            </ul>

            <h4>2. How We Use Your Information</h4>
            <ul>
                <li><strong>To Provide Functionality:</strong> Your locally stored data is used to provide the application's features, such as populating your trade journal, remembering your settings, and saving your course progress.</li>
                <li><strong>To Perform AI Analysis:</strong> Your chart images and strategy selections are used exclusively to generate AI-driven trade analysis via the Google Gemini API. Please refer to <a href="https://policies.google.com/privacy" target="_blank" rel="noopener noreferrer">Google's Privacy Policy</a> for information on how they handle data.</li>
            </ul>
            
            <h4>3. Data Sharing and Third Parties</h4>
            <p>We do not sell, trade, or otherwise transfer your personally identifiable information to outside parties. The only exception is the data sent to the Google Gemini API as required to perform an analysis. We do not have access to the specific data you send during your sessions.</p>

            <h4>4. Data Security</h4>
            <p>Because your data is stored on your own device, its security is intrinsically linked to the security of your computer and web browser. We recommend using a secure, up-to-date browser and following standard security best practices.</p>

            <h4>5. Your Rights and Control Over Data</h4>
            <p>You have complete control over your data. You can:</p>
            <ul>
                <li><strong>Export Your Data:</strong> Use the "Export All Data" feature in the Admin Panel to save a complete backup of your locally stored information at any time.</li>
                <li><strong>Delete Your Data:</strong> You can clear your data by clearing your browser's site data for Chart Oracle. This action is irreversible unless you have an exported backup. The Admin Panel also provides tools to clear specific sets of data.</li>
            </ul>

            <h4>6. Children's Privacy</h4>
            <p>Our service does not address anyone under the age of 18. We do not knowingly collect personal information from children.</p>

            <h4>7. Changes to This Privacy Policy</h4>
            <p>We may update our Privacy Policy from time to time. We will notify you of any changes by posting the new Privacy Policy on this page. You are advised to review this Privacy Policy periodically for any changes.</p>
        </div>
        <div className="flex-shrink-0 pt-4 mt-auto border-t border-gray-600">
            <button onClick={onClose} className="w-full font-bold py-2 px-6 rounded-lg transition-colors bg-yellow-500 hover:bg-yellow-400 text-gray-900">
                Close
            </button>
        </div>
      </div>
       <style>{`
        @keyframes fadeIn { from { opacity: 0; } to { opacity: 1; } }
        .animate-fadeIn { animation: fadeIn 0.2s ease-out; }
      `}</style>
    </div>
  );
};

export default PrivacyPolicyModal;