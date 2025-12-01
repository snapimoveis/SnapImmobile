import React, { useRef, useEffect, useState } from 'react';
import { X, Grid3X3, CheckCircle, Camera } from 'lucide-react';
import { enhanceImage } from '../services/geminiService';
import { Photo } from '../types';

interface CameraViewProps {
  onPhotoCaptured: (photo: Photo) => void;
  onClose: () => void;
}

export const CameraView: React.FC<CameraViewProps> = ({ onPhotoCaptured, onClose }) => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const streamRef = useRef<MediaStream | null>(null); 

  const [isStreaming, setIsStreaming] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [processingStep, setProcessingStep] = useState<string>('');
  const [processingProgress, setProcessingProgress] = useState(0);
  const [hasSaved, setHasSaved] = useState(false); // Novo estado para evitar múltiplos salvamentos

  const [hdrProfile, setHdrProfile] = useState<'interior' | 'exterior'>('interior');
  const [flashVisual, setFlashVisual] = useState(false);
  const [zoom, setZoom] = useState(1);
  const [isLandscape, setIsLandscape] = useState(false);
  const [countdown, setCountdown] = useState<number | null>(null);
  
  const [showGrid, setShowGrid] = useState(true);
  const [capturedPreviews, setCapturedPreviews] = useState<{ url: string; ev: string }[]>([]);
  const [previewImage, setPreviewImage] = useState<string | null>(null);
  const [focusPoint, setFocusPoint] = useState<{ x: number; y: number } | null>(null);

  useEffect(() => {
    const checkOrientation = () => {
      setIsLandscape(window.innerWidth > window.innerHeight);
    };
    checkOrientation();
    window.addEventListener('resize', checkOrientation);
    return () => window.removeEventListener('resize', checkOrientation);
  }, []);

  useEffect(() => {
    if (!previewImage) {
        startCamera();
        setHasSaved(false); // Resetar estado de salvo ao voltar para câmera
    }
    return () => {
        stopCamera();
    };
  }, [previewImage]);

  const startCamera = async () => {
    if (streamRef.current) return;

    try {
      const constraints = {
        video: { 
            facingMode: 'environment', 
            aspectRatio: { ideal: 1.333333 },
            width: { ideal: 4032 },
            height: { ideal: 3024 }
        }
      };

      // Tenta obter a câmera
      const stream = await navigator.mediaDevices.getUserMedia(constraints);

      if (stream) {
        streamRef.current = stream;
        if (videoRef.current) {
            videoRef.current.srcObject = stream;
            videoRef.current.onloadedmetadata = () => setIsStreaming(true);
        }
        
        // Tenta aplicar configurações avançadas se suportado
        const track = stream.getVideoTracks()[0];
        const capabilities: any = track.getCapabilities?.() || {};
        if (capabilities.colorTemperature) {
            try {
                await track.applyConstraints({ advanced: [{ colorTemperature: 5500 }] } as any);
            } catch (e) {}
        }
      }
    } catch (err) {
      console.error("Erro ao acessar câmera:", err);
      alert("Não foi possível acessar a câmera. Verifique as permissões.");
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

  const handleTapToFocus = async (e: React.MouseEvent<HTMLDivElement> | React.TouchEvent<HTMLDivElement>) => {
    if (!streamRef.current) return;
    const rect = e.currentTarget.getBoundingClientRect();
    const clientX = 'touches' in e ? e.touches[0].clientX : (e as React.MouseEvent).clientX;
    const clientY = 'touches' in e ? e.touches[0].clientY : (e as React.MouseEvent).clientY;
    
    setFocusPoint({ x: clientX - rect.left, y: clientY - rect.top });
    setTimeout(() => setFocusPoint(null), 1200);

    const track = streamRef.current.getVideoTracks()[0];
    const capabilities: any = track.getCapabilities?.() || {};

    try {
        if (capabilities.focusMode?.includes('continuous')) {
            await track.applyConstraints({ advanced: [{ focusMode: 'continuous' }] } as any);
        }
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
      if (videoWidth === 0 || videoHeight === 0) return;

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
      ctx.drawImage(video, sx, sy, w, h, 0, 0, w, h);
  };

  const capturePhotoSequence = async () => {
    if (!videoRef.current || !canvasRef.current || !streamRef.current) return;
    setIsProcessing(true);
    setCapturedPreviews([]);
    setHasSaved(false);

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

    setProcessingStep('Capturando (9)...');
    setProcessingProgress(0);

    for (let i = 0; i < 9; i++) {
        if (supportsEV) {
            const ev = Math.max(caps.exposureCompensation.min, Math.min(caps.exposureCompensation.max, evSequence[i]));
            try { await track.applyConstraints({ advanced: [{ exposureCompensation: ev }] } as any); } catch(e){}
        } 
        
        ctx.filter = `brightness(${brightnessValues[i]}) saturate(1.25) contrast(1.1)`; 
        
        setFlashVisual(true);
        setTimeout(() => setFlashVisual(false), 50);

        drawCroppedFrame(video, canvas, ctx);
        ctx.filter = 'none';

        // Alta qualidade para a IA
        const frameData = canvas.toDataURL('image/jpeg', 0.95);
        capturedBlobs.push(frameData);
        
        if (i % 2 === 0) {
            setCapturedPreviews(prev => [...prev, { url: frameData, ev: `${evSequence[i]}` }]);
        }
        
        setProcessingProgress(((i + 1) / 9) * 40);
        await new Promise(r => setTimeout(r, 100)); // Delay maior para estabilizar
    }

    // Reset EV
    if (supportsEV) try { await track.applyConstraints({ advanced: [{ exposureCompensation: 0 }] } as any); } catch(e){}

    setProcessingStep('Processando IA...');
    setProcessingProgress(50);

    try {
        // Usa as 3 melhores exposições (Escura, Média, Clara)
        const fusionPayload = [capturedBlobs[1], capturedBlobs[4], capturedBlobs[7]];
        
        const finalImage = await enhanceImage(fusionPayload, hdrProfile === 'interior' ? 'hp_hdr_interior' : 'hp_hdr_exterior');
        
        if (!finalImage || finalImage.length < 1000) {
            throw new Error("A IA retornou uma imagem inválida.");
        }

        setProcessingStep('Finalizando...');
        setProcessingProgress(100);
        
        // Define o preview para o usuário ver
        setPreviewImage(finalImage); 

        // Salva automaticamente após sucesso
        handleSavePhoto(finalImage, capturedBlobs[4]);

    } catch (e) {
        console.error("Erro na fusão:", e);
        alert("Erro ao processar a foto. Usando a captura original.");
        // Fallback: usa a foto média (exposição 0) se a IA falhar
        const original = capturedBlobs[4];
        setPreviewImage(original);
        handleSavePhoto(original, original);
    } finally {
        setIsProcessing(false);
        setProcessingProgress(0);
    }
  };

  const handleSavePhoto = async (finalUrl: string, originalUrl: string) => {
      if (hasSaved) return; // Evita duplo salvamento
      setHasSaved(true);
      
      console.log("Salvando foto no sistema...");
      
      try {
          await onPhotoCaptured({
              id: crypto.randomUUID(),
              url: finalUrl,
              originalUrl: originalUrl,
              name: `SNAP_${Date.now()}.jpg`,
              createdAt: Date.now(),
              type: 'hdr',
              timestamp: Date.now()
          });
          console.log("Foto enviada para o componente pai com sucesso.");
      } catch (error) {
          console.error("Erro ao chamar onPhotoCaptured:", error);
          alert("Erro ao salvar a foto na galeria.");
      }
  };

  const handleZoom = async (level: number) => {
    setZoom(level);
    if (!streamRef.current) return;
    const track = streamRef.current.getVideoTracks()[0];
    try { await track.applyConstraints({ advanced: [{ zoom: level }] } as any); } catch (e) {}
  };

  if (previewImage) {
      return (
        <div className="fixed inset-0 h-[100dvh] w-screen bg-black z-[100] flex flex-col items-center justify-center animate-in fade-in duration-300">
            <div className="relative w-full h-full flex items-center justify-center bg-[#121212]">
                <img src={previewImage} className="max-w-full max-h-full object-contain" alt="Resultado HDR" />
                
                <div className="absolute top-6 right-6">
                    <button 
                        onClick={() => setPreviewImage(null)} 
                        className="p-3 bg-black/50 backdrop-blur-md rounded-full text-white border border-white/20"
                    >
                        <X size={24} />
                    </button>
                </div>

                <div className="absolute bottom-10 bg-green-600/90 backdrop-blur-md text-white px-6 py-3 rounded-full flex items-center gap-3 shadow-2xl border border-green-400/30 animate-in slide-in-from-bottom-4">
                    <CheckCircle size={24} className="text-white" />
                    <span className="font-bold text-base tracking-wide">FOTO GUARDADA!</span>
                </div>
            </div>
        </div>
      );
  }

  return (
    <div className={`fixed inset-0 h-[100dvh] w-screen bg-black z-50 font-sans overflow-hidden flex text-white touch-none ${isLandscape ? 'flex-row' : 'flex-col'}`}>
      
      {/* FERRAMENTAS */}
      <div className={`bg-black z-30 flex items-center justify-between ${isLandscape ? 'flex-col w-20 h-full py-6 pl-safe' : 'flex-row h-20 w-full px-6 pt-safe'}`}>
         <button onClick={onClose} className="p-3 bg-gray-800/50 rounded-full"><X size={20} /></button>
         <button onClick={() => setShowGrid(!showGrid)} className={`p-3 rounded-full ${showGrid ? 'text-yellow-400 bg-yellow-400/10' : 'text-white/60'}`}><Grid3X3 size={20} /></button>
         {isLandscape && <div className="w-6 h-6 opacity-0"></div>}
      </div>

      {/* VIEWFINDER */}
      <div className="flex-1 relative bg-[#050505] flex items-center justify-center overflow-hidden">
        <div onClick={handleTapToFocus} className={`relative bg-black shadow-2xl rounded-lg overflow-hidden ${isLandscape ? 'h-full aspect-[4/3]' : 'w-full max-h-full aspect-[3/4]'}`}>
            <video ref={videoRef} autoPlay playsInline className="absolute inset-0 w-full h-full object-cover" />
            <canvas ref={canvasRef} className="hidden" />
            <div className={`absolute inset-0 bg-white transition-opacity duration-75 pointer-events-none ${flashVisual ? 'opacity-80' : 'opacity-0'}`} />

            {/* Mira de Foco */}
            {focusPoint && (
                <div className="absolute w-16 h-16 border-2 border-yellow-400 opacity-0 animate-ping pointer-events-none" style={{ left: focusPoint.x - 32, top: focusPoint.y - 32 }} />
            )}

            {/* Countdown */}
            {countdown !== null && (
                <div className="absolute inset-0 z-50 flex items-center justify-center bg-black/20 backdrop-blur-[2px]">
                    <span className="text-[100px] font-bold animate-ping">{countdown}</span>
                </div>
            )}

            {/* Grid */}
            {showGrid && (
                <div className="absolute inset-0 grid grid-cols-3 grid-rows-3 opacity-30 pointer-events-none">
                    <div className="border-r border-b border-white"></div>
                    <div className="border-r border-b border-white"></div>
                    <div className="border-b border-white"></div>
                    <div className="border-r border-b border-white"></div>
                    <div className="border-r border-b border-white"></div>
                    <div className="border-b border-white"></div>
                    <div className="border-r border-white"></div>
                    <div className="border-r border-white"></div>
                </div>
            )}

            {/* Previews Laterais */}
            {isProcessing && capturedPreviews.length > 0 && (
                <div className="absolute top-4 left-4 bottom-4 w-16 flex flex-col gap-2 overflow-hidden z-40">
                    {capturedPreviews.map((prev, idx) => (
                        <img key={idx} src={prev.url} className="w-full aspect-[4/3] object-cover rounded border border-white/50 shadow-md" />
                    ))}
                </div>
            )}

            {/* Botões Zoom */}
            <div className="absolute bottom-4 right-4 flex flex-col gap-2">
                <button onClick={(e) => {e.stopPropagation(); handleZoom(1)}} className={`w-10 h-10 rounded-full flex items-center justify-center text-sm font-bold ${zoom === 1 ? 'bg-yellow-400 text-black' : 'bg-black/50 text-white'}`}>1x</button>
                <button onClick={(e) => {e.stopPropagation(); handleZoom(0.5)}} className={`w-10 h-10 rounded-full flex items-center justify-center text-sm font-bold ${zoom === 0.5 ? 'bg-yellow-400 text-black' : 'bg-black/50 text-white'}`}>.5</button>
            </div>
        </div>
      </div>

      {/* DISPARADOR */}
      <div className={`bg-black z-30 flex items-center justify-center ${isLandscape ? 'flex-col w-32 h-full py-6 pr-safe' : 'flex-row h-36 w-full pb-safe'}`}>
        <button 
            onClick={handleShutterClick} 
            disabled={isProcessing || countdown !== null} 
            className="relative w-20 h-20 rounded-full border-[4px] border-white flex items-center justify-center active:scale-95 transition-transform"
        >
            <div className={`w-[68px] h-[68px] rounded-full bg-white ${isProcessing ? 'scale-75 bg-gray-400' : ''}`}>
                {countdown && <span className="flex items-center justify-center h-full text-black font-bold text-2xl">{countdown}</span>}
            </div>
        </button>
      </div>

      {/* LOADING OVERLAY */}
      {isProcessing && !previewImage && (
        <div className="absolute inset-0 z-50 flex flex-col items-center justify-center bg-black/80 backdrop-blur-sm">
            <div className="w-16 h-16 border-4 border-white/20 border-t-yellow-400 rounded-full animate-spin mb-4"></div>
            <div className="text-yellow-400 font-bold text-xl uppercase tracking-widest">{processingStep}</div>
            <div className="text-white/50 text-sm mt-2">{Math.round(processingProgress)}%</div>
        </div>
      )}
    </div>
  );
};
