import React, { useState, useEffect, useRef } from 'react';
import { SavedTrade, UploadedImageData } from '../types.ts';
import { TIME_FRAMES_STEPS } from '../constants.ts';
import { getImage } from '../idb.ts';
import OracleIcon from './OracleIcon.tsx';

interface ImageViewerModalProps {
  trade: SavedTrade;
  onClose: () => void;
  onAddImage: (tradeId: string, imageData: UploadedImageData) => Promise<void>;
  onDiscuss: (trade: SavedTrade) => void;
}

const ImageDisplay: React.FC<{ imageKey: string; onZoom: (src: string) => void }> = ({ imageKey, onZoom }) => {
    const [imageSrc, setImageSrc] = useState<string | null>(null);

    useEffect(() => {
        let isMounted = true;
        getImage(imageKey).then(url => {
            if (isMounted && url) setImageSrc(url);
        });
        return () => { isMounted = false; };
    }, [imageKey]);

    if (!imageSrc) return <div className="aspect-video w-full bg-gray-700/50 rounded-md animate-pulse"></div>;

    return (
        <img
            src={imageSrc}
            alt="Saved chart"
            className="max-w-full h-auto rounded-md border-2 border-gray-700 mx-auto transition-transform duration-200 hover:scale-105 cursor-zoom-in"
            onClick={() => onZoom(imageSrc)}
        />
    );
};

const ImageViewerModal: React.FC<ImageViewerModalProps> = ({ trade, onClose, onAddImage, onDiscuss }) => {
  const [zoomedImage, setZoomedImage] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isUploading, setIsUploading] = useState(false);

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
        const file = e.target.files[0];
        const reader = new FileReader();
        reader.onload = async (event) => {
            const dataUrl = event.target?.result as string;
            if (dataUrl) {
                setIsUploading(true);
                await onAddImage(trade.id, {
                    name: file.name,
                    type: file.type,
                    dataUrl: dataUrl
                });
                setIsUploading(false);
            }
        };
        reader.readAsDataURL(file);
    }
    e.target.value = '';
  };

  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        if (zoomedImage) setZoomedImage(null);
        else onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [onClose, zoomedImage]);

  const hasAnalysisImages = trade.uploadedImageKeys && Object.keys(trade.uploadedImageKeys).length > 0;
  const hasPostTradeImages = trade.postTradeImageKeys && trade.postTradeImageKeys.length > 0;

  return (
    <div 
      className="fixed inset-0 bg-gray-900/80 flex items-center justify-center z-[100] p-4 animate-fadeIn"
      aria-modal="true"
      role="dialog"
      onClick={onClose}
    >
      <div 
        className="bg-gray-800 p-4 md:p-6 rounded-lg shadow-xl max-w-6xl w-full border border-yellow-500/50 max-h-[90vh] flex flex-col"
        onClick={e => e.stopPropagation()}
      >
        <div className="flex justify-between items-start pb-4 border-b border-gray-700">
            <div className="flex-grow">
                <h2 className="text-xl md:text-2xl font-bold text-yellow-400">
                    Media Viewer & Discussion
                </h2>
                <p className="text-sm text-gray-400 mt-1">
                    {trade.symbol} {trade.direction} {trade.type}
                </p>
            </div>
            <button onClick={onClose} className="p-1 rounded-full text-gray-400 hover:bg-gray-700 hover:text-white" aria-label="Close">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
            </button>
        </div>

        <div className="flex-grow overflow-y-auto pt-4 space-y-6">
            {/* Analysis Charts */}
            <div>
                <h3 className="text-lg font-semibold text-gray-200 mb-3">Original Analysis Charts</h3>
                {hasAnalysisImages ? (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {TIME_FRAMES_STEPS.map((step, index) => {
                            const imageKey = trade.uploadedImageKeys[index];
                            if (!imageKey) return null;
                            return (
                                <div key={step.step} className="bg-gray-900/30 p-2 rounded-md">
                                    <h4 className="text-sm font-semibold text-gray-300 mb-2 text-center">{step.title}</h4>
                                    <ImageDisplay imageKey={imageKey} onZoom={setZoomedImage} />
                                </div>
                            );
                        })}
                    </div>
                ) : (
                    <div className="col-span-full aspect-video flex items-center justify-center bg-gray-700/50 rounded-md">
                        <p className="text-gray-500">No analysis images were saved with this trade.</p>
                    </div>
                )}
            </div>

            {/* Post-Trade Journal Images */}
            <div>
                <h3 className="text-lg font-semibold text-gray-200 mb-3">Post-Trade Journal Images</h3>
                <div className="bg-gray-900/30 p-4 rounded-md space-y-4">
                    {hasPostTradeImages ? (
                        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                            {trade.postTradeImageKeys?.map((key, index) => (
                                <div key={index} className="p-1 bg-gray-700/50 rounded">
                                    <ImageDisplay imageKey={key} onZoom={setZoomedImage} />
                                </div>
                            ))}
                        </div>
                    ) : (
                        <p className="text-sm text-gray-500 text-center">No post-trade images uploaded yet. Add images of your entry, exit, or trade management.</p>
                    )}
                    <div>
                        <input type="file" ref={fileInputRef} onChange={handleFileSelect} accept="image/*" className="hidden" />
                        <button onClick={() => fileInputRef.current?.click()} disabled={isUploading} className="w-full font-semibold py-2 px-4 rounded-md bg-blue-600 hover:bg-blue-500 text-white flex items-center justify-center gap-2 disabled:bg-gray-600">
                            {isUploading ? 'Uploading...' : 'Add Journal Image'}
                        </button>
                    </div>
                </div>
            </div>
        </div>
        
        <div className="flex-shrink-0 pt-4 mt-auto border-t border-gray-700">
            <button onClick={() => { onDiscuss(trade); onClose(); }} className="w-full font-bold py-2 px-6 rounded-lg transition-colors bg-purple-600 hover:bg-purple-500 text-white flex items-center justify-center gap-2">
                <OracleIcon className="w-5 h-5"/>
                Discuss with Oracle
            </button>
        </div>

        {zoomedImage && (
            <div className="fixed inset-0 z-[110] bg-black/80 flex items-center justify-center p-4 animate-fadeIn cursor-zoom-out" onClick={() => setZoomedImage(null)}>
                <img src={zoomedImage} alt="Zoomed chart" className="max-w-full max-h-full object-contain shadow-2xl rounded-lg" onClick={e => e.stopPropagation()} />
            </div>
        )}
      </div>
      <style>{`
        @keyframes fadeIn { from { opacity: 0; } to { opacity: 1; } }
        .animate-fadeIn { animation: fadeIn 0.2s ease-out; }
      `}</style>
    </div>
  );
};

export default ImageViewerModal;