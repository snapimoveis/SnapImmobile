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

  // Detecção de Orientação
  useEffect(() => {
    const checkOrientation = () => {
      setIsLandscape(window.innerWidth > window.innerHeight);
    };
    checkOrientation();
    window.addEventListener('resize', checkOrientation);
    return () => window.removeEventListener('resize', checkOrientation);
  }, []);

  // Inicializar Câmara
  useEffect(() => { startCamera(); return () => stopCamera(); }, []);

  const startCamera = async () => {
    try {
      // Tenta 4K 4:3 primeiro para máxima nitidez
      const constraints = {
        video: { 
            facingMode: 'environment', 
            aspectRatio: { exact: 1.333333 },
            width: { ideal: 4032 },
            height: { ideal: 3024 }
        }
      };

      const constraintsFallback = {
        video: { 
            facingMode: 'environment', 
            aspectRatio: { ideal: 1.333333 },
            width: { ideal: 1920 }, 
            height: { ideal: 1440 }
        }
      };

      let stream;
      try {
          stream = await navigator.mediaDevices.getUserMedia(constraints);
      } catch (e) {
          console.warn("4K falhou, tentando HD...", e);
          stream = await navigator.mediaDevices.getUserMedia(constraintsFallback);
      }

      if (videoRef.current && stream) {
        videoRef.current.srcObject = stream;
        videoRef.current.onloadedmetadata = () => setIsStreaming(true);
      }
    } catch (err) {
      console.error(err);
      alert('Erro ao aceder à câmara.');
    }
  };

  const stopCamera = () => {
    if (videoRef.current?.srcObject) {
      (videoRef.current.srcObject as MediaStream).getTracks().forEach(t => t.stop());
      setIsStreaming(false);
    }
  };

  const playShutterSound = () => {
    const audio = new Audio('/iphone-camera-capture-6448.mp3');
    audio.volume = 1.0;
    audio.play().catch(() => {});
  };

  const handleZoom = async (level: number) => {
    setZoom(level);
    if (!videoRef.current?.srcObject) return;
    const track = (videoRef.current.srcObject as MediaStream).getVideoTracks()[0];
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
    if (!videoRef.current || !canvasRef.current) return;
    setIsProcessing(true);
    setCapturedPreviews([]);

    const video = videoRef.current;
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const track = (video.srcObject as MediaStream).getVideoTracks()[0];
    const caps: any = track.getCapabilities?.() || {};
    const supportsEV = !!caps.exposureCompensation;

    const evSequence = [-4, -3, -2, -1, 0, 1, 2, 3, 4];
    const brightnessValues = [0.1, 0.3, 0.5, 0.8, 1.0, 1.5, 2.5, 4.0, 6.0];
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
        
        ctx.filter = `brightness(${brightnessValues[i]}) saturate(1.1)`; 

        playShutterSound();
        setFlashVisual(true);
        setTimeout(() => setFlashVisual(false), 50);

        drawCroppedFrame(video, canvas, ctx);
        ctx.filter = 'none';

        const frameData = canvas.toDataURL('image/jpeg', 0.95);
        capturedBlobs.push(frameData);
        
        // Preview visual das capturas
        if (i % 2 === 0) {
            setCapturedPreviews(prev => [...prev, { url: frameData, ev: `${evSequence[i]}` }]);
        }
        
        setProcessingProgress(((i + 1) / 9) * 40);
        await new Promise(r => setTimeout(r, 80));
    }

    if (supportsEV) try { await track.applyConstraints({ advanced: [{ exposureCompensation: 0 }] } as any); } catch(e){}

    // Enviar 3 fotos para a IA (Escura, Normal, Clara)
    const indicesToUse = [1, 4, 7]; 
    const fusionPayload = indicesToUse.map(i => capturedBlobs[i]);

    setProcessingStep('A Fundir IA...');
    setProcessingProgress(50);

    try {
        const finalImage = await enhanceImage(fusionPayload, effectiveProfile);
        setProcessingStep('Concluído');
        setProcessingProgress(100);
        setLastSavedPhoto(finalImage);
        setPreviewImage(finalImage); // Abre Preview

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

  // Ecrã de Preview/Confirmação
  if (previewImage) {
      return (
        <div className="fixed inset-0 h-[100dvh] w-screen bg-black z-[100] flex flex-col items-center justify-center animate-in fade-in zoom-in duration-300 touch-none">
            <div className="relative w-full h-full flex items-center justify-center bg-[#121212]">
                <img src={previewImage} className="max-w-full max-h-full object-contain" alt="Resultado HDR" />
                
                <div className="absolute top-0 left-0 right-0 p-6 flex justify-end bg-gradient-to-b from-black/60 to-transparent">
                    <button onClick={() => setPreviewImage(null)} className="p-3 bg-white/10 backdrop-blur-md rounded-full text-white hover:bg-white/20 border border-white/20 shadow-lg">
                        <X size={28} />
                    </button>
                </div>

                <div className="absolute bottom-10 bg-green-600/90 backdrop-blur-md text-white px-6 py-3 rounded-full flex items-center gap-3 shadow-2xl border border-green-400/30 animate-in slide-in-from-bottom-4">
                    <CheckCircle size={24} className="text-white" />
                    <span className="font-bold text-base tracking-wide">FOTO GUARDADA</span>
                </div>
            </div>
        </div>
      );
  }

  return (
    <div className="fixed inset-0 h-[100dvh] w-screen bg-black z-50 font-sans overflow-hidden select-none flex flex-col md:flex-row text-white touch-none">
      
      {/* === BARRA DE FERRAMENTAS (Esquerda/Topo) === */}
      <div className={`bg-black z-30 flex items-center justify-between px-6
        ${isLandscape 
            ? 'flex-col w-20 h-full border-r border-white/10 py-8' 
            : 'flex-row h-20 w-full border-b border-white/10'
        }`}>
         
         <button onClick={onClose} className="p-3 text-white/80 hover:text-white bg-gray-800/50 rounded-full backdrop-blur-sm">
            <X size={24} />
         </button>

         <button onClick={() => setShowGrid(!showGrid)} className={`p-3 rounded-full transition-colors ${showGrid ? 'text-yellow-400 bg-yellow-400/10' : 'text-white/60 hover:text-white'}`}>
            <Grid3X3 size={24} />
         </button>

         {isLandscape && <div className="w-6 h-6"></div>}
      </div>

      {/* === VISOR CENTRAL (4:3) === */}
      <div className="flex-1 relative bg-[#050505] overflow-hidden flex items-center justify-center p-2">
        {/* Container 4:3 Fixo */}
        <div className="relative w-full max-w-full aspect-[3/4] md:aspect-[4/3] overflow-hidden bg-black shadow-2xl rounded-lg md:rounded-none">
            <video ref={videoRef} autoPlay playsInline className="absolute inset-0 w-full h-full object-cover" />
            <canvas ref={canvasRef} className="hidden" />
            
            {/* Flash */}
            <div className={`absolute inset-0 bg-white transition-opacity duration-75 pointer-events-none ${flashVisual ? 'opacity-80' : 'opacity-0'}`} />

            {/* Countdown Overlay */}
            {countdown !== null && (
                <div className="absolute inset-0 z-50 flex items-center justify-center bg-black/20 backdrop-blur-[2px]">
                    <span className="text-[120px] font-black text-white drop-shadow-2xl animate-ping">{countdown}</span>
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

            {/* === BOTÕES INTERIOR/EXTERIOR (Overlay) === */}
            <div className="absolute bottom-6 left-0 right-0 flex justify-center gap-6 z-20 pointer-events-auto">
                 <button onClick={() => setHdrProfile('interior')} 
                    className={`text-xs font-bold tracking-widest transition-all px-4 py-1.5 rounded-full shadow-lg border ${hdrProfile === 'interior' ? 'bg-yellow-400 text-black border-yellow-400' : 'bg-black/50 text-white/90 border-white/30 backdrop-blur-md'}`}>
                    INTERIOR
                </button>
                <button onClick={() => setHdrProfile('exterior')} 
                    className={`text-xs font-bold tracking-widest transition-all px-4 py-1.5 rounded-full shadow-lg border ${hdrProfile === 'exterior' ? 'bg-yellow-400 text-black border-yellow-400' : 'bg-black/50 text-white/90 border-white/30 backdrop-blur-md'}`}>
                    EXTERIOR
                </button>
            </div>

            {/* === ZOOM (Overlay - Fora da caixa preta) === */}
            {/* Posicionado perto do disparador mas DENTRO da imagem */}
            <div className={`absolute z-20 flex gap-3 p-1 bg-black/30 backdrop-blur-md rounded-full border border-white/10
                ${isLandscape 
                    ? 'right-4 top-1/2 -translate-y-1/2 flex-col' 
                    : 'bottom-20 left-1/2 -translate-x-1/2 flex-row mb-2'
                }`}>
                <button onClick={() => handleZoom(1)} className={`w-10 h-10 rounded-full flex items-center justify-center font-bold text-sm transition-all ${zoom === 1 ? 'bg-yellow-400 text-black shadow-lg scale-105' : 'text-white hover:bg-white/20'}`}>1x</button>
                <button onClick={() => handleZoom(0.5)} className={`w-10 h-10 rounded-full flex items-center justify-center font-bold text-sm transition-all ${zoom === 0.5 ? 'bg-yellow-400 text-black shadow-lg scale-105' : 'text-white hover:bg-white/20'}`}>.5</button>
            </div>

            {/* Previews */}
            {isProcessing && capturedPreviews.length > 0 && (
                <div className="absolute top-4 left-4 bottom-4 w-16 flex flex-col gap-2 overflow-hidden animate-in slide-in-from-left-4 z-40">
                    {capturedPreviews.map((prev, idx) => (
                        <div key={idx} className="aspect-[4/3] w-full rounded border border-white/50 overflow-hidden shadow-lg">
                            <img src={prev.url} className="w-full h-full object-cover" />
                        </div>
                    ))}
                </div>
            )}
        </div>
      </div>

      {/* === BARRA DE DISPARO (Direita/Fundo) - Limpa === */}
      <div className={`bg-black z-30 flex items-center justify-center relative
        ${isLandscape 
            ? 'flex-col w-32 h-full border-l border-white/10' 
            : 'flex-row h-36 w-full border-t border-white/10 pb-6'
        }`}>
        
        {/* Botão Disparo */}
        <button 
            onClick={handleShutterClick} 
            disabled={isProcessing || countdown !== null} 
            className="relative w-20 h-20 rounded-full border-[4px] border-white flex items-center justify-center transition-transform active:scale-95 shadow-[0_0_30px_rgba(255,255,255,0.15)]"
        >
            <div className={`w-[68px] h-[68px] rounded-full bg-white transition-all duration-200 flex items-center justify-center ${isProcessing ? 'scale-75 bg-gray-400' : ''}`}>
                {countdown && <span className="text-black font-bold text-2xl">{countdown}</span>}
            </div>
        </button>
      </div>

      {/* Processing Overlay */}
      {isProcessing && !previewImage && (
        <div className="absolute inset-0 z-50 flex items-center justify-center bg-black/90 backdrop-blur-sm">
            <div className="flex flex-col items-center">
                <div className="w-16 h-16 border-4 border-white/20 border-t-yellow-400 rounded-full animate-spin mb-4"></div>
                <div className="text-yellow-400 font-bold text-xl tracking-widest uppercase">{processingStep}</div>
                <div className="text-white/50 text-sm mt-1">{Math.round(processingProgress)}%</div>
            </div>
        </div>
      )}
    </div>
  );
};
