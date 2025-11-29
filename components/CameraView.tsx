import React, { useRef, useEffect, useState } from 'react';
import { X, Grid3X3, CheckCircle } from 'lucide-react';
import { enhanceImage } from '../services/geminiService';
import { Photo } from '../types';

interface CameraViewProps {
  onPhotoCaptured: (photo: Photo) => void;
  onClose: () => void;
}

export const CameraView: React.FC<CameraViewProps> = ({ onPhotoCaptured, onClose }) => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  // FIX: Armazenar o stream separadamente para garantir limpeza correta
  const streamRef = useRef<MediaStream | null>(null); 

  const [isStreaming, setIsStreaming] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [processingStep, setProcessingStep] = useState<string>('');
  const [processingProgress, setProcessingProgress] = useState(0);

  const [hdrProfile, setHdrProfile] = useState<'interior' | 'exterior'>('interior');
  const [flashVisual, setFlashVisual] = useState(false);
  const [zoom, setZoom] = useState(1);
  const [isLandscape, setIsLandscape] = useState(false);
  const [countdown, setCountdown] = useState<number | null>(null);
  
  const [showGrid, setShowGrid] = useState(true);
  const [capturedPreviews, setCapturedPreviews] = useState<{ url: string; ev: string }[]>([]);
  const [lastSavedPhoto, setLastSavedPhoto] = useState<string | null>(null);
  const [previewImage, setPreviewImage] = useState<string | null>(null);

  useEffect(() => {
    const checkOrientation = () => {
      setIsLandscape(window.innerWidth > window.innerHeight);
    };
    checkOrientation();
    window.addEventListener('resize', checkOrientation);
    return () => window.removeEventListener('resize', checkOrientation);
  }, []);

  // Monitora o preview para parar/reiniciar a câmera
  useEffect(() => {
    if (!previewImage) {
        startCamera();
    }
    return () => {
        stopCamera();
    };
  }, [previewImage]);

  const startCamera = async () => {
    if (streamRef.current) return;

    try {
      const advancedConstraints: any = {
         whiteBalanceMode: 'manual', 
         exposureMode: 'continuous',
         focusMode: 'continuous'
      };

      const constraints: any = {
        video: { 
            facingMode: 'environment', 
            aspectRatio: { exact: 1.333333 },
            width: { ideal: 4032 },
            height: { ideal: 3024 },
            advanced: [advancedConstraints] 
        }
      };

      const constraintsFallback: any = {
        video: { 
            facingMode: 'environment', 
            aspectRatio: { ideal: 1.333333 },
            width: { ideal: 1920 }, 
            height: { ideal: 1440 },
            advanced: [advancedConstraints]
        }
      };

      let stream;
      try {
          stream = await navigator.mediaDevices.getUserMedia(constraints as MediaStreamConstraints);
      } catch (e) {
          console.warn("4K falhou, tentando HD...", e);
          stream = await navigator.mediaDevices.getUserMedia(constraintsFallback as MediaStreamConstraints);
      }

      if (stream) {
        streamRef.current = stream;

        if (videoRef.current) {
            videoRef.current.srcObject = stream;
            videoRef.current.onloadedmetadata = () => setIsStreaming(true);
        }
        
        const track = stream.getVideoTracks()[0];
        const capabilities: any = track.getCapabilities?.() || {};
        
        if (capabilities.colorTemperature) {
            try {
                await track.applyConstraints({ advanced: [{ colorTemperature: 5500 }] } as any);
            } catch (e) {}
        }
      }
    } catch (err) {
      console.error(err);
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
    setIsStreaming(false);
  };

  const playShutterSound = () => {
    const audio = new Audio('/iphone-camera-capture-6448.mp3');
    audio.volume = 1.0;
    audio.play().catch(() => {});
  };

  const handleZoom = async (level: number) => {
    setZoom(level);
    if (!streamRef.current) return;
    const track = streamRef.current.getVideoTracks()[0];
    const caps: any = track.getCapabilities?.() || {};
    if (!caps.zoom) return;
    try {
      await track.applyConstraints({ advanced: [{ zoom: level }] } as any);
    } catch (e) {}
  };

  const handleShutterClick = () => {
      if (isProcessing) return;
      
      setCountdown(3);
      let count = 3;
      const timer = setInterval(() => {
          count--;
          if (count > 0) {
              setCountdown(count);
          } else {
              clearInterval(timer);
              setCountdown(null);
              capturePhotoSequence();
          }
      }, 1000);
  };

  const drawCroppedFrame = (video: HTMLVideoElement, canvas: HTMLCanvasElement, ctx: CanvasRenderingContext2D) => {
      const videoWidth = video.videoWidth;
      const videoHeight = video.videoHeight;
      const targetRatio = 4 / 3;
      const currentRatio = videoWidth / videoHeight;
      
      let w = videoWidth;
      let h = videoHeight;
      let sx = 0;
      let sy = 0;

      if (currentRatio > targetRatio) {
          w = videoHeight * targetRatio;
          sx = (videoWidth - w) / 2;
      } else {
          h = videoWidth / targetRatio;
          sy = (videoHeight - h) / 2;
      }
      
      canvas.width = w; 
      canvas.height = h;
      ctx.imageSmoothingEnabled = true;
      ctx.imageSmoothingQuality = 'high';
      ctx.drawImage(video, sx, sy, w, h, 0, 0, w, h);
  };

  const capturePhotoSequence = async () => {
    if (!videoRef.current || !canvasRef.current || !streamRef.current) return;
    setIsProcessing(true);
    setCapturedPreviews([]);

    const video = videoRef.current;
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const track = streamRef.current.getVideoTracks()[0];
    const caps: any = track.getCapabilities?.() || {};
    const supportsEV = !!caps.exposureCompensation;

    const evSequence = [-4, -3, -2, -1, 0, 1, 2, 3, 4];
    const brightnessValues = [0.4, 0.5, 0.6, 0.8, 1.0, 1.1, 1.2, 1.4, 1.6]; 
    const capturedBlobs: string[] = [];

    let effectiveProfile = hdrProfile === 'interior' ? 'hp_hdr_interior' : 'hp_hdr_exterior';
    
    if (hdrProfile === 'interior') {
      try {
        drawCroppedFrame(video, canvas, ctx);
        const topData = ctx.getImageData(0, 0, canvas.width, Math.floor(canvas.height * 0.35));
        let whites = 0;
        for (let i = 0; i < topData.data.length; i += 16) {
            if (topData.data[i] > 240) whites++;
        }
        if (whites / (topData.data.length/4) > 0.15) effectiveProfile = 'hp_hdr_window';
      } catch (e) {}
    }

    setProcessingStep('A Capturar (9)...');
    setProcessingProgress(0);

    for (let i = 0; i < 9; i++) {
        if (supportsEV) {
            const ev = Math.max(caps.exposureCompensation.min, Math.min(caps.exposureCompensation.max, evSequence[i]));
            try { await track.applyConstraints({ advanced: [{ exposureCompensation: ev }] } as any); } catch(e){}
        } 
        
        ctx.filter = `brightness(${brightnessValues[i]}) saturate(1.35) sepia(0.25) contrast(0.92)`; 

        playShutterSound();
        setFlashVisual(true);
        setTimeout(() => setFlashVisual(false), 50);

        drawCroppedFrame(video, canvas, ctx);
        
        ctx.filter = 'none';

        const frameData = canvas.toDataURL('image/jpeg', 0.95);
        capturedBlobs.push(frameData);
        
        if (i % 2 === 0) {
            setCapturedPreviews(prev => [...prev, { url: frameData, ev: `${evSequence[i]}` }]);
        }
        
        setProcessingProgress(((i + 1) / 9) * 40);
        await new Promise(r => setTimeout(r, 80));
    }

    if (supportsEV) try { await track.applyConstraints({ advanced: [{ exposureCompensation: 0 }] } as any); } catch(e){}

    const indicesToUse = [1, 4, 7]; 
    const fusionPayload = indicesToUse.map(i => capturedBlobs[i]);

    setProcessingStep('A Fundir IA...');
    setProcessingProgress(50);

    try {
        const finalImage = await enhanceImage(fusionPayload, effectiveProfile);
        setProcessingStep('Concluído');
        setProcessingProgress(100);
        setLastSavedPhoto(finalImage);
        setPreviewImage(finalImage); 

        onPhotoCaptured({
            id: crypto.randomUUID(),
            url: finalImage,
            originalUrl: capturedBlobs[4],
            name: `SNAP_FUSION_${Date.now()}`,
            timestamp: Date.now(),
            type: 'hdr'
        });
    } catch (e) {
        console.error(e);
        alert("Erro no processamento.");
    } finally {
        setIsProcessing(false);
        setProcessingProgress(0);
        setCapturedPreviews([]);
    }
  };

  if (previewImage) {
      return (
        <div className="fixed inset-0 h-[100dvh] w-screen bg-black z-[100] flex flex-col items-center justify-center animate-in fade-in zoom-in duration-300 touch-none">
            <div className="relative w-full h-full flex items-center justify-center bg-[#121212]">
                <img src={previewImage} className="max-w-full max-h-full object-contain" alt="Resultado HDR" />
                
                <div className="absolute top-0 left-0 right-0 p-6 flex justify-end bg-gradient-to-b from-black/60 to-transparent pt-[env(safe-area-inset-top)]">
                    <button 
                        onClick={() => setPreviewImage(null)} 
                        className="p-3 bg-white/10 backdrop-blur-md rounded-full text-white hover:bg-white/20 border border-white/20 shadow-lg"
                    >
                        <X size={28} />
                    </button>
                </div>

                <div className="absolute bottom-10 bg-green-600/90 backdrop-blur-md text-white px-6 py-3 rounded-full flex items-center gap-3 shadow-2xl border border-green-400/30 animate-in slide-in-from-bottom-4 mb-[env(safe-area-inset-bottom)]">
                    <CheckCircle size={24} className="text-white" />
                    <span className="font-bold text-base tracking-wide">FOTO GUARDADA</span>
                </div>
            </div>
        </div>
      );
  }

  return (
    // FIX: Layout fluido principal (flex-col em mobile, flex-row em desktop/landscape)
    <div className={`fixed inset-0 h-[100dvh] w-screen bg-black z-50 font-sans overflow-hidden select-none flex text-white touch-none
        ${isLandscape ? 'flex-row' : 'flex-col'}`}>
      
      {/* === ZONA 1: FERRAMENTAS (Barra Topo/Esquerda) === */}
      <div className={`bg-black z-30 flex items-center justify-between
        ${isLandscape 
            ? 'flex-col w-16 md:w-24 h-full border-r border-white/10 py-6 pl-[env(safe-area-inset-left)]' 
            : 'flex-row h-16 md:h-20 w-full border-b border-white/10 px-6 pt-[env(safe-area-inset-top)]'
        }`}>
         
         <button onClick={onClose} className="p-3 text-white/80 hover:text-white bg-gray-800/50 rounded-full backdrop-blur-sm active:scale-95 transition-transform">
            <X size={20} className="md:w-6 md:h-6" />
         </button>

         <button onClick={() => setShowGrid(!showGrid)} className={`p-3 rounded-full transition-colors active:scale-95 ${showGrid ? 'text-yellow-400 bg-yellow-400/10' : 'text-white/60 hover:text-white'}`}>
            <Grid3X3 size={20} className="md:w-6 md:h-6" />
         </button>

         {/* Espaçador para equilibrar o layout em landscape */}
         {isLandscape && <div className="w-6 h-6 opacity-0"></div>}
      </div>

      {/* === ZONA 2: VIEWFINDER (Centro Expansível) === */}
      <div className="flex-1 relative bg-[#050505] overflow-hidden flex items-center justify-center p-2 md:p-4">
        
        {/* Container que mantém a proporção mas nunca excede o espaço disponível */}
        <div className={`relative bg-black shadow-2xl rounded-lg overflow-hidden
            ${isLandscape ? 'h-full aspect-[4/3]' : 'w-full max-h-full aspect-[3/4]'} 
            max-w-full max-h-full`}>
            
            <video ref={videoRef} autoPlay playsInline className="absolute inset-0 w-full h-full object-cover" />
            <canvas ref={canvasRef} className="hidden" />
            
            <div className={`absolute inset-0 bg-white transition-opacity duration-75 pointer-events-none ${flashVisual ? 'opacity-80' : 'opacity-0'}`} />

            {/* Countdown Overlay */}
            {countdown !== null && (
                <div className="absolute inset-0 z-50 flex items-center justify-center bg-black/20 backdrop-blur-[2px]">
                    <span className="text-[80px] md:text-[120px] font-black text-white drop-shadow-2xl animate-ping">{countdown}</span>
                </div>
            )}

            {/* Grid Overlay */}
            {showGrid && (
                <div className="absolute inset-0 w-full h-full grid grid-cols-3 grid-rows-3 opacity-30 pointer-events-none">
                    <div className="border-r border-b border-white"></div>
                    <div className="border-r border-b border-white"></div>
                    <div className="border-b border-white"></div>
                    <div className="border-r border-b border-white"></div>
                    <div className="border-r border-b border-white"></div>
                    <div className="border-b border-white"></div>
                    <div className="border-r border-white"></div>
                    <div className="border-r border-white"></div>
                    <div></div>
                </div>
            )}
            
            {/* Crosshair Central */}
            <div className="absolute inset-0 flex items-center justify-center pointer-events-none opacity-60">
                <div className="w-4 h-4 relative">
                      <div className="absolute top-1/2 left-0 w-full h-[1px] bg-white/80"></div>
                      <div className="absolute left-1/2 top-0 h-full w-[1px] bg-white/80"></div>
                </div>
            </div>

            {/* Previews das Fotos (Lateral dentro do Viewfinder) */}
            {isProcessing && capturedPreviews.length > 0 && (
                <div className="absolute top-4 left-4 bottom-4 w-12 md:w-16 flex flex-col gap-2 overflow-hidden animate-in slide-in-from-left-4 z-40">
                    {capturedPreviews.map((prev, idx) => (
                        <div key={idx} className="aspect-[4/3] w-full rounded border border-white/50 overflow-hidden shadow-lg">
                            <img src={prev.url} className="w-full h-full object-cover" />
                        </div>
                    ))}
                </div>
            )}

            {/* Controles de Perfil (Fundo) */}
            <div className="absolute bottom-4 md:bottom-6 left-0 right-0 flex justify-center gap-4 md:gap-6 z-20 pointer-events-auto px-4">
                 <button onClick={() => setHdrProfile('interior')} 
                    className={`text-[10px] md:text-xs font-bold tracking-widest transition-all px-3 md:px-4 py-1.5 rounded-full shadow-lg border ${hdrProfile === 'interior' ? 'bg-yellow-400 text-black border-yellow-400' : 'bg-black/50 text-white/90 border-white/30 backdrop-blur-md'}`}>
                    INTERIOR
                </button>
                <button onClick={() => setHdrProfile('exterior')} 
                    className={`text-[10px] md:text-xs font-bold tracking-widest transition-all px-3 md:px-4 py-1.5 rounded-full shadow-lg border ${hdrProfile === 'exterior' ? 'bg-yellow-400 text-black border-yellow-400' : 'bg-black/50 text-white/90 border-white/30 backdrop-blur-md'}`}>
                    EXTERIOR
                </button>
            </div>

            {/* Botões Zoom */}
            <div className={`absolute z-20 flex gap-2 md:gap-3 p-1 bg-black/30 backdrop-blur-md rounded-full border border-white/10
                ${isLandscape 
                    ? 'right-2 md:right-4 top-1/2 -translate-y-1/2 flex-col' 
                    : 'bottom-16 md:bottom-20 left-1/2 -translate-x-1/2 flex-row mb-1'
                }`}>
                <button onClick={() => handleZoom(1)} className={`w-8 h-8 md:w-10 md:h-10 rounded-full flex items-center justify-center font-bold text-xs md:text-sm transition-all ${zoom === 1 ? 'bg-yellow-400 text-black shadow-lg scale-105' : 'text-white hover:bg-white/20'}`}>1x</button>
                <button onClick={() => handleZoom(0.5)} className={`w-8 h-8 md:w-10 md:h-10 rounded-full flex items-center justify-center font-bold text-xs md:text-sm transition-all ${zoom === 0.5 ? 'bg-yellow-400 text-black shadow-lg scale-105' : 'text-white hover:bg-white/20'}`}>.5</button>
            </div>

        </div>
      </div>

      {/* === ZONA 3: DISPARADOR (Barra Fundo/Direita) === */}
      <div className={`bg-black z-30 flex items-center justify-center relative
        ${isLandscape 
            ? 'flex-col w-24 md:w-32 h-full border-l border-white/10 pr-[env(safe-area-inset-right)]' 
            : 'flex-row h-24 md:h-36 w-full border-t border-white/10 pb-[env(safe-area-inset-bottom)]'
        }`}>
        
        {/* Botão Disparo Adaptável */}
        <button 
            onClick={handleShutterClick} 
            disabled={isProcessing || countdown !== null} 
            className="relative w-16 h-16 md:w-20 md:h-20 rounded-full border-[4px] border-white flex items-center justify-center transition-transform active:scale-95 shadow-[0_0_30px_rgba(255,255,255,0.15)]"
        >
            <div className={`w-[54px] h-[54px] md:w-[68px] md:h-[68px] rounded-full bg-white transition-all duration-200 flex items-center justify-center ${isProcessing ? 'scale-75 bg-gray-400' : ''}`}>
                {countdown && <span className="text-black font-bold text-xl md:text-2xl">{countdown}</span>}
            </div>
        </button>
      </div>

      {/* Processing Overlay */}
      {isProcessing && !previewImage && (
        <div className="absolute inset-0 z-50 flex items-center justify-center bg-black/90 backdrop-blur-sm">
            <div className="flex flex-col items-center">
                <div className="w-12 h-12 md:w-16 md:h-16 border-4 border-white/20 border-t-yellow-400 rounded-full animate-spin mb-4"></div>
                <div className="text-yellow-400 font-bold text-lg md:text-xl tracking-widest uppercase">{processingStep}</div>
                <div className="text-white/50 text-xs md:text-sm mt-1">{Math.round(processingProgress)}%</div>
            </div>
        </div>
      )}
    </div>
  );
};
