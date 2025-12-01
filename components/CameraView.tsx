import React, { useRef, useEffect, useState, useCallback } from 'react';
import { X, Grid3X3, CheckCircle, Camera, Zap, ZapOff } from 'lucide-react';
import { enhanceImage } from '../services/geminiService';
import { Photo } from '../types';

interface CameraViewProps {
  onPhotoCaptured: (photo: Photo) => Promise<void>;
  onClose: () => void;
}

export const CameraView: React.FC<CameraViewProps> = ({ onPhotoCaptured, onClose }) => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const mountedRef = useRef(true);

  // Soms (Opcional - carregados apenas se existirem)
  const shutterSound = useRef<HTMLAudioElement | null>(null);

  // Estados de UI
  const [isStreaming, setIsStreaming] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [processingStep, setProcessingStep] = useState('');
  const [processingProgress, setProcessingProgress] = useState(0);
  const [hasSaved, setHasSaved] = useState(false);
  const [flashVisual, setFlashVisual] = useState(false);
  const [zoom, setZoom] = useState<number>(1);
  const [maxZoom, setMaxZoom] = useState<number>(1);
  const [isLandscape, setIsLandscape] = useState(false);
  const [countdown, setCountdown] = useState<number | null>(null);
  const [showGrid, setShowGrid] = useState(true);
  const [capturedPreviews, setCapturedPreviews] = useState<{ url: string; ev: string }[]>([]);
  const [previewImage, setPreviewImage] = useState<string | null>(null);
  const [focusPoint, setFocusPoint] = useState<{ x: number; y: number } | null>(null);
  const [hdrProfile, setHdrProfile] = useState<'interior' | 'exterior'>('interior');
  const [showHoldSteady, setShowHoldSteady] = useState(false);

  // Função segura para atualizar estado apenas se montado
  const safeSetState = useCallback((fn: any) => {
    if (mountedRef.current) {
        if (typeof fn === 'function') {
            fn();
        }
    }
  }, []);

  useEffect(() => {
    mountedRef.current = true;
    // Carregar som se existir
    try { shutterSound.current = new Audio("/iphone-camera-capture-6448.mp3"); } catch (e) {}

    const checkOrientation = () => {
        if (mountedRef.current) setIsLandscape(window.innerWidth > window.innerHeight);
    };
    checkOrientation();
    window.addEventListener('resize', checkOrientation);
    
    return () => {
      mountedRef.current = false;
      window.removeEventListener('resize', checkOrientation);
      stopCamera();
      // Limpeza de memória de blobs se existirem
      if (previewImage && previewImage.startsWith('blob:')) {
          URL.revokeObjectURL(previewImage);
      }
    };
  }, []);

  // Iniciar/Parar Câmera baseado no Preview
  useEffect(() => {
    if (!previewImage) {
      startCamera();
      setHasSaved(false);
    } else {
      stopCamera();
    }
  }, [previewImage]);

  const startCamera = async () => {
    if (streamRef.current) return;

    try {
      const constraints: MediaStreamConstraints = {
        video: {
          facingMode: 'environment',
          // Tenta resolução alta (4K), faz fallback automático se não suportado
          width: { ideal: 4096 }, 
          height: { ideal: 2160 },
          aspectRatio: { ideal: 4 / 3 } 
        },
        audio: false
      };

      const stream = await navigator.mediaDevices.getUserMedia(constraints);
      streamRef.current = stream;

      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        videoRef.current.onloadedmetadata = () => {
            safeSetState(() => setIsStreaming(true));
        };
      }

      // Ler capacidades da câmara (Zoom, Foco, etc.)
      const track = stream.getVideoTracks()[0];
      const capabilities: any = track.getCapabilities?.() || {};
      
      if (capabilities.zoom) {
          safeSetState(() => {
              setMaxZoom(capabilities.zoom.max || 5);
              setZoom(capabilities.zoom.min || 1);
          });
      }

    } catch (err) {
      console.error("Erro na câmara:", err);
      alert("Não foi possível aceder à câmara. Verifique as permissões.");
      onClose();
    }
  };

  const stopCamera = () => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(t => t.stop());
      streamRef.current = null;
    }
    if (videoRef.current) {
      videoRef.current.srcObject = null;
    }
    safeSetState(() => setIsStreaming(false));
  };

  const handleTapToFocus = async (e: React.MouseEvent | React.TouchEvent) => {
    if (!streamRef.current) return;

    const rect = e.currentTarget.getBoundingClientRect();
    let clientX, clientY;
    
    if ('touches' in e) {
        clientX = e.touches[0].clientX;
        clientY = e.touches[0].clientY;
    } else {
        clientX = (e as React.MouseEvent).clientX;
        clientY = (e as React.MouseEvent).clientY;
    }

    const x = clientX - rect.left;
    const y = clientY - rect.top;

    safeSetState(() => setFocusPoint({ x, y }));
    setTimeout(() => safeSetState(() => setFocusPoint(null)), 1500);

    const track = streamRef.current.getVideoTracks()[0];
    const capabilities: any = track.getCapabilities?.() || {};

    // Tenta focar no ponto (se o hardware suportar)
    if (capabilities.focusMode?.includes('continuous')) {
        try {
            await track.applyConstraints({ advanced: [{ focusMode: 'continuous' }] } as any);
        } catch (err) {}
    }
  };

  const handleZoom = async (newZoom: number) => {
      if (!streamRef.current) return;
      const track = streamRef.current.getVideoTracks()[0];
      const clampedZoom = Math.min(Math.max(newZoom, 1), maxZoom);
      
      safeSetState(() => setZoom(clampedZoom));
      try {
          await track.applyConstraints({ advanced: [{ zoom: clampedZoom }] } as any);
      } catch (e) {}
  };

  const drawFrame = (video: HTMLVideoElement, canvas: HTMLCanvasElement, ctx: CanvasRenderingContext2D, filter: string) => {
    if (!video.videoWidth) return;
    
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    
    // Alta qualidade para o processamento
    ctx.imageSmoothingEnabled = true;
    ctx.imageSmoothingQuality = 'high';
    
    if (filter) ctx.filter = filter;
    ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
    ctx.filter = 'none';
  };

  const capturePhotoSequence = async () => {
    if (!videoRef.current || !canvasRef.current || !streamRef.current) return;

    safeSetState(() => {
        setIsProcessing(true);
        setCapturedPreviews([]);
        setProcessingStep('Capturando (HDR)...');
        setShowHoldSteady(true);
    });

    const video = videoRef.current;
    const canvas = canvasRef.current;
    // 'willReadFrequently' otimiza leitura de pixels
    const ctx = canvas.getContext('2d', { willReadFrequently: true });
    
    if (!ctx) return;

    const track = streamRef.current.getVideoTracks()[0];
    const capabilities: any = track.getCapabilities?.() || {};
    const supportsEV = !!capabilities.exposureCompensation;

    // Sequência de exposições (-2, -1, 0, +1, +2)
    const evSequence = [-2, -1, 0, 1, 2]; 
    // Simulação de brilho via filtro CSS se EV não suportado
    const brightnessValues = [0.6, 0.8, 1.0, 1.2, 1.4]; 
    
    const capturedBlobs: string[] = [];
    const totalShots = evSequence.length;

    try {
        for (let i = 0; i < totalShots; i++) {
            // Ajustar EV Hardware
            if (supportsEV) {
                try {
                    await track.applyConstraints({ 
                        advanced: [{ exposureCompensation: evSequence[i] }] 
                    } as any);
                } catch (e) {}
            }

            // Efeito visual de obturador
            safeSetState(() => setFlashVisual(true));
            try { shutterSound.current?.play(); } catch {}
            await new Promise(r => setTimeout(r, 50)); 
            safeSetState(() => setFlashVisual(false));

            // Capturar frame com filtro simulado
            const filter = `brightness(${brightnessValues[i]}) contrast(1.1) saturate(1.2)`;
            drawFrame(video, canvas, ctx, filter);
            
            // Exportar (0.9 quality para bom equilíbrio)
            const frameData = canvas.toDataURL('image/jpeg', 0.90);
            capturedBlobs.push(frameData);

            // Atualizar UI
            safeSetState(() => {
                setCapturedPreviews(prev => [...prev, { url: frameData, ev: evSequence[i].toString() }]);
                setProcessingProgress(((i + 1) / totalShots) * 50);
            });
            
            // Delay para estabilizar exposição
            await new Promise(r => setTimeout(r, 150));
        }

        // Reset EV
        if (supportsEV) {
            try { await track.applyConstraints({ advanced: [{ exposureCompensation: 0 }] } as any); } catch (e) {}
        }

        safeSetState(() => {
            setProcessingStep('Processando IA...');
            setProcessingProgress(60);
            setShowHoldSteady(false);
        });

        // Fusão IA (Usa a mais escura, média e clara)
        let finalImage = capturedBlobs[2]; // Default: foto do meio (EV 0)
        try {
            const aiResult = await enhanceImage(
                [capturedBlobs[0], capturedBlobs[2], capturedBlobs[4]], 
                hdrProfile === 'interior' ? 'hp_hdr_interior' : 'hp_hdr_exterior'
            );
            if (aiResult && aiResult.length > 1000) {
                finalImage = aiResult;
            }
        } catch (aiError) {
            console.warn("IA Falhou, usando original:", aiError);
        }

        safeSetState(() => {
            setProcessingStep('Finalizando...');
            setProcessingProgress(100);
            setPreviewImage(finalImage);
        });

        // Salvar
        await handleSavePhoto(finalImage, capturedBlobs[2]);

    } catch (error) {
        console.error("Erro fatal na captura:", error);
        alert("Ocorreu um erro ao capturar. Tente novamente.");
        safeSetState(() => setIsProcessing(false));
    }
  };

  const handleSavePhoto = async (finalUrl: string, originalUrl: string) => {
    if (hasSaved) return;
    
    try {
        const newPhoto: Photo = {
            id: crypto.randomUUID(),
            url: finalUrl,
            originalUrl: originalUrl,
            name: `SNAP_${Date.now()}.jpg`,
            createdAt: Date.now(),
            type: 'hdr',
            timestamp: Date.now()
        };

        await onPhotoCaptured(newPhoto);
        safeSetState(() => setHasSaved(true));
    } catch (err) {
        console.error("Erro ao salvar:", err);
        alert("Erro ao guardar a foto na base de dados.");
    } finally {
        safeSetState(() => setIsProcessing(false));
    }
  };

  const handleShutterClick = () => {
    if (isProcessing) return;
    safeSetState(() => setCountdown(3));
    
    let count = 3;
    const timer = setInterval(() => {
        count--;
        if (count > 0) {
            safeSetState(() => setCountdown(count));
        } else {
            clearInterval(timer);
            safeSetState(() => {
                setCountdown(null);
                capturePhotoSequence();
            });
        }
    }, 1000);
  };

  if (previewImage) {
    return (
      <div className="fixed inset-0 z-[100] bg-black flex items-center justify-center animate-in fade-in duration-300">
        <img src={previewImage} className="max-w-full max-h-full object-contain" alt="Preview" />
        
        <button 
            onClick={() => setPreviewImage(null)} 
            className="absolute top-6 right-6 p-3 bg-black/50 rounded-full text-white backdrop-blur-md border border-white/20"
        >
            <X size={24} />
        </button>

        {hasSaved && (
            <div className="absolute bottom-10 bg-green-600/90 backdrop-blur-md text-white px-6 py-3 rounded-full flex items-center gap-3 shadow-2xl border border-green-400/30 animate-in slide-in-from-bottom-4">
                <CheckCircle size={24} />
                <span className="font-bold text-sm tracking-wide">FOTO GUARDADA</span>
            </div>
        )}
      </div>
    );
  }

  return (
    <div className={`fixed inset-0 z-50 bg-black text-white flex overflow-hidden touch-none ${isLandscape ? 'flex-row' : 'flex-col'}`}>
      
      {/* BARRA DE FERRAMENTAS */}
      <div className={`bg-black/80 backdrop-blur-sm z-30 flex items-center justify-between ${isLandscape ? 'flex-col w-20 h-full py-6 pl-safe' : 'flex-row h-20 w-full px-6 pt-safe'}`}>
         <button onClick={onClose} className="p-3 bg-gray-800/80 rounded-full hover:bg-gray-700 transition-colors"><X size={20} /></button>
         
         <div className={`flex gap-4 items-center ${isLandscape ? 'flex-col' : 'flex-row'}`}>
            <button 
                onClick={() => setHdrProfile(p => p === 'interior' ? 'exterior' : 'interior')} 
                className="px-3 py-1.5 rounded-full bg-gray-800/80 text-[10px] font-bold uppercase border border-white/20 tracking-wider min-w-[80px]"
            >
                {hdrProfile}
            </button>
            <button onClick={() => setShowGrid(!showGrid)} className={`p-3 rounded-full transition-colors ${showGrid ? 'text-brand-orange bg-brand-orange/10' : 'text-white/60 bg-gray-800/80'}`}>
                <Grid3X3 size={20} />
            </button>
         </div>
      </div>

      {/* VISOR */}
      <div className="flex-1 relative bg-[#050505] flex items-center justify-center overflow-hidden">
        <div 
            onClick={handleTapToFocus} 
            className={`relative bg-black shadow-2xl overflow-hidden ${isLandscape ? 'h-full aspect-[4/3] rounded-l-2xl' : 'w-full max-h-full aspect-[3/4] rounded-b-2xl'}`}
        >
            <video ref={videoRef} autoPlay playsInline className="absolute inset-0 w-full h-full object-cover" />
            <canvas ref={canvasRef} className="hidden" />
            
            <div className={`absolute inset-0 bg-white pointer-events-none transition-opacity duration-75 ${flashVisual ? 'opacity-80' : 'opacity-0'}`} />

            {focusPoint && (
                <div 
                    className="absolute w-16 h-16 border-2 border-brand-orange rounded-full opacity-0 animate-ping pointer-events-none" 
                    style={{ left: focusPoint.x - 32, top: focusPoint.y - 32 }} 
                />
            )}

            {showGrid && (
                <div className="absolute inset-0 grid grid-cols-3 grid-rows-3 pointer-events-none">
                    <div className="border-r border-b border-white/20"></div>
                    <div className="border-r border-b border-white/20"></div>
                    <div className="border-b border-white/20"></div>
                    <div className="border-r border-b border-white/20"></div>
                    <div className="border-r border-b border-white/20"></div>
                    <div className="border-b border-white/20"></div>
                    <div className="border-r border-white/20"></div>
                    <div className="border-r border-white/20"></div>
                </div>
            )}

            {countdown !== null && (
                <div className="absolute inset-0 z-40 flex items-center justify-center bg-black/30 backdrop-blur-[2px]">
                    <span className="text-[120px] font-black text-white drop-shadow-lg animate-pulse">{countdown}</span>
                </div>
            )}
            
            {/* Controles Zoom Flutuantes */}
            {maxZoom > 1 && (
                <div className="absolute bottom-6 right-6 flex flex-col gap-3 bg-black/40 backdrop-blur-md p-1.5 rounded-full border border-white/10">
                    <button onClick={(e) => {e.stopPropagation(); handleZoom(1)}} className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold transition-all ${zoom === 1 ? 'bg-white text-black' : 'text-white hover:bg-white/20'}`}>1x</button>
                    <button onClick={(e) => {e.stopPropagation(); handleZoom(2)}} className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold transition-all ${zoom === 2 ? 'bg-white text-black' : 'text-white hover:bg-white/20'}`}>2x</button>
                    <button onClick={(e) => {e.stopPropagation(); handleZoom(0.5)}} className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold transition-all ${zoom === 0.5 ? 'bg-white text-black' : 'text-white hover:bg-white/20'}`}>.5</button>
                </div>
            )}

            {/* Aviso de Estabilidade */}
            {showHoldSteady && (
               <div className="absolute top-10 left-0 right-0 flex justify-center pointer-events-none">
                  <div className="bg-black/60 backdrop-blur-md px-4 py-2 rounded-full text-sm font-bold animate-pulse border border-white/10">
                     Segure firme...
                  </div>
               </div>
            )}
        </div>
      </div>

      {/* DISPARADOR */}
      <div className={`bg-black z-30 flex items-center justify-center ${isLandscape ? 'flex-col w-32 h-full py-6 pr-safe' : 'flex-row h-32 w-full pb-safe pt-4'}`}>
        <button 
            onClick={handleShutterClick} 
            disabled={isProcessing || countdown !== null} 
            className="relative w-20 h-20 rounded-full border-[5px] border-white/90 flex items-center justify-center active:scale-95 transition-transform shadow-lg"
        >
            <div className={`w-[66px] h-[66px] rounded-full bg-white transition-all duration-200 ${isProcessing ? 'scale-75 bg-gray-400 animate-pulse' : ''}`} />
        </button>
      </div>

      {/* LOADING OVERLAY */}
      {isProcessing && (
        <div className="absolute inset-0 z-50 flex flex-col items-center justify-center bg-black/90 backdrop-blur-sm">
            <div className="relative">
                <div className="w-20 h-20 border-4 border-white/10 border-t-brand-orange rounded-full animate-spin"></div>
                <div className="absolute inset-0 flex items-center justify-center text-xs font-bold">{Math.round(processingProgress)}%</div>
            </div>
            <div className="mt-6 text-white font-bold text-lg tracking-widest uppercase animate-pulse">{processingStep}</div>
            
            {/* Mini Previews */}
            <div className="mt-8 flex gap-2 h-16 justify-center">
                {capturedPreviews.slice(-3).map((prev, i) => (
                    <img key={i} src={prev.url} className="h-full aspect-[3/4] object-cover rounded border border-white/20 animate-in fade-in slide-in-from-bottom-2" alt={`Frame ${i}`} />
                ))}
            </div>
        </div>
      )}
    </div>
  );
};
