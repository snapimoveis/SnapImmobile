
import React, { useState, useEffect } from 'react';
import { X, Sliders, ArrowDownToLine, LayoutTemplate } from 'lucide-react';
import { WatermarkPosition, applyWatermarkToImage } from '../services/watermarkService';

interface WatermarkModalProps {
    photoUrl: string;
    watermarkUrl: string;
    onClose: () => void;
    onDownload: (finalUrl: string) => void;
}

export const WatermarkModal: React.FC<WatermarkModalProps> = ({ photoUrl, watermarkUrl, onClose, onDownload }) => {
    const [opacity, setOpacity] = useState(0.8);
    const [position, setPosition] = useState<WatermarkPosition>('bottom-right');
    const [previewUrl, setPreviewUrl] = useState<string>(photoUrl);
    const [isProcessing, setIsProcessing] = useState(true);
    const [useWatermark, setUseWatermark] = useState(true);

    useEffect(() => {
        const updatePreview = async () => {
            if (!useWatermark) {
                setPreviewUrl(photoUrl);
                setIsProcessing(false);
                return;
            }

            setIsProcessing(true);
            try {
                const result = await applyWatermarkToImage(photoUrl, watermarkUrl, {
                    opacity,
                    position,
                    scale: 0.25, // 25% width of image
                    margin: 20
                });
                setPreviewUrl(result);
            } catch (e) {
                console.error(e);
            } finally {
                setIsProcessing(false);
            }
        };

        const debounce = setTimeout(updatePreview, 300); // Debounce slider changes
        return () => clearTimeout(debounce);
    }, [photoUrl, watermarkUrl, opacity, position, useWatermark]);

    const handleDownloadClick = () => {
        onDownload(previewUrl);
    };

    const positions: { id: WatermarkPosition, label: string }[] = [
        { id: 'top-left', label: 'Sup. Esq.' },
        { id: 'top-right', label: 'Sup. Dir.' },
        { id: 'center', label: 'Centro' },
        { id: 'bottom-left', label: 'Inf. Esq.' },
        { id: 'bottom-right', label: 'Inf. Dir.' },
    ];

    return (
        <div className="fixed inset-0 z-[60] bg-black/90 backdrop-blur-sm flex items-center justify-center p-4 font-sans">
            <div className="bg-gray-900 border border-white/10 rounded-2xl w-full max-w-4xl max-h-[90vh] flex flex-col overflow-hidden">
                
                {/* Header */}
                <div className="flex justify-between items-center p-4 border-b border-white/10 bg-gray-900">
                    <h2 className="text-lg font-bold text-white flex items-center gap-2">
                        <LayoutTemplate className="w-5 h-5 text-[#623aa2]" />
                        Marca d'Água
                    </h2>
                    <button onClick={onClose} className="p-2 rounded-full hover:bg-white/10 text-white">
                        <X className="w-6 h-6" />
                    </button>
                </div>

                <div className="flex-1 flex flex-col md:flex-row overflow-hidden">
                    
                    {/* Preview Area */}
                    <div className="flex-1 bg-black relative flex items-center justify-center p-4 overflow-hidden">
                        <div className="relative shadow-2xl border border-white/10 max-w-full max-h-full">
                            <img 
                                src={previewUrl} 
                                alt="Preview" 
                                className="max-w-full max-h-full object-contain"
                            />
                            {isProcessing && (
                                <div className="absolute inset-0 flex items-center justify-center bg-black/50 backdrop-blur-sm">
                                    <div className="w-8 h-8 border-2 border-[#623aa2] border-t-transparent rounded-full animate-spin"></div>
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Controls Area */}
                    <div className="w-full md:w-80 bg-gray-800/50 border-l border-white/5 p-6 flex flex-col gap-6 overflow-y-auto">
                        
                        {/* Toggle */}
                        <div className="flex items-center justify-between">
                            <span className="text-white font-medium">Aplicar Marca d'Água?</span>
                            <button 
                                onClick={() => setUseWatermark(!useWatermark)}
                                className={`w-12 h-6 rounded-full transition-colors relative ${useWatermark ? 'bg-[#623aa2]' : 'bg-gray-600'}`}
                            >
                                <div className={`absolute top-1 w-4 h-4 rounded-full bg-white transition-all ${useWatermark ? 'left-7' : 'left-1'}`}></div>
                            </button>
                        </div>

                        {useWatermark && (
                            <>
                                {/* Position Grid */}
                                <div>
                                    <label className="text-xs uppercase text-gray-400 font-bold tracking-wider mb-3 block">Posição</label>
                                    <div className="grid grid-cols-2 gap-2">
                                        {positions.map((pos) => (
                                            <button
                                                key={pos.id}
                                                onClick={() => setPosition(pos.id)}
                                                className={`py-2 px-3 rounded-lg text-xs font-medium transition-all border ${
                                                    position === pos.id 
                                                    ? 'bg-[#623aa2]/20 border-[#623aa2] text-white' 
                                                    : 'bg-gray-700 border-transparent text-gray-300 hover:bg-gray-600'
                                                }`}
                                            >
                                                {pos.label}
                                            </button>
                                        ))}
                                    </div>
                                </div>

                                {/* Opacity Slider */}
                                <div>
                                    <div className="flex justify-between mb-2">
                                        <label className="text-xs uppercase text-gray-400 font-bold tracking-wider">Transparência</label>
                                        <span className="text-xs text-white">{Math.round(opacity * 100)}%</span>
                                    </div>
                                    <input 
                                        type="range" 
                                        min="0.1" 
                                        max="1.0" 
                                        step="0.05" 
                                        value={opacity}
                                        onChange={(e) => setOpacity(parseFloat(e.target.value))}
                                        className="w-full h-2 bg-gray-700 rounded-lg appearance-none cursor-pointer accent-[#623aa2]"
                                    />
                                </div>
                            </>
                        )}

                        <div className="mt-auto pt-4 border-t border-white/10">
                            <button 
                                onClick={handleDownloadClick}
                                className="w-full py-3 rounded-full bg-[#623aa2] hover:bg-[#502d85] text-white font-bold flex items-center justify-center gap-2 shadow-lg transition-all active:scale-95"
                            >
                                <ArrowDownToLine className="w-5 h-5" />
                                Descarregar Final
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};
