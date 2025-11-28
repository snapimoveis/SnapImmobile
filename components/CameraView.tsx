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
  const [timerValue, setTimerValue] = useState<number | null>(null);
  const [showGrid, setShowGrid] = useState(true);

  // Sensores
  const [tilt, setTilt] = useState({ beta: 0, gamma: 0 });
  // Removido hasSensorPermission button (mas mantemos a lógica se já tiver permissão)
  const [hasSensorPermission, setHasSensorPermission] = useState(false);
  
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

  useEffect(() => { startCamera(); return () => stopCamera(); }, []);

  useEffect(() => {
    const handleOrientation = (event: DeviceOrientationEvent) => {
      if (event.beta !== null && event.gamma !== null) {
        setHasSensorPermission(true);
        setTilt(prev => ({
            beta: prev.beta * 0.8 + event.beta! * 0.2, 
            gamma: prev.gamma * 0.8 + event.gamma! * 0.2
        }));
      }
    };
    window.addEventListener('deviceorientation', handleOrientation);
    return () => window.removeEventListener('deviceorientation', handleOrientation);
  }, []);

  // Lógica de Nivelamento (Crosshair)
  const roll = isLandscape ? tilt.beta : tilt.gamma; 
  const pitch = isLandscape ? tilt.gamma : tilt.beta; 
  const pitchOffset = isLandscape ? 0 : 90; 
  const normalizedPitch = pitch - pitchOffset;

  const isLevelRoll = Math.abs(roll) < 2; 
  const isLevelPitch = Math.abs(normalizedPitch) < 10; 

  const startCamera = async () => {
    try {
      const constraints = {
        video: { facingMode: 'environment', aspectRatio: { ideal: 1.333 }, width: { ideal: 2560 }, height: { ideal: 1920 } }
      };
      const stream = await navigator.mediaDevices.getUserMedia(constraints);
      if (videoRef.current) {
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

  const initiateCapture = async () => {
    if (isProcessing) return;
    capturePhotoSequence();
  };

  const drawCroppedFrame = (video: HTMLVideoElement, canvas: HTMLCanvasElement, ctx: CanvasRenderingContext2D) => {
      const videoWidth = video.videoWidth;
      const videoHeight = video.videoHeight;
      const targetRatio = 4 / 3;
      const currentRatio = videoWidth / videoHeight;
      let w = videoWidth, h = videoHeight, sx = 0, sy = 0;

      if (currentRatio > targetRatio) {
          w = videoHeight * targetRatio;
          sx = (videoWidth - w) / 2;
      } else {
          h = videoWidth / targetRatio;
          sy = (videoHeight - h) / 2;
      }
      canvas.width = w; canvas.height = h;
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
    // Digital Bracketing para garantir contraste
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

    setProcessingStep('Snap Fusion (9)...');
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

        const frameData = canvas.toDataURL('image/jpeg', 0.90);
        capturedBlobs.push(frameData);
        
        if (i % 2 === 0) setCapturedPreviews(prev => [...prev, { url: frameData, ev: `${evSequence[i]}` }]);
        setProcessingProgress(((i + 1) / 9) * 40);
        
        await new Promise(r => setTimeout(r, 80));
    }

    if (supportsEV) try { await track.applyConstraints({ advanced: [{ exposureCompensation: 0 }] } as any); } catch(e){}

    const indicesToUse = [0, 2, 4, 6, 8]; 
    const fusionPayload = indicesToUse.map(i => capturedBlobs[i]);

    setProcessingStep('Fusão IA...');
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

  return (
    <div className="fixed inset-0 h-[100dvh] w-screen bg-black z-50 font-sans overflow-hidden select-none flex flex-row text-white touch-none">
      
      {/* --- BARRA ESQUERDA (Settings) - Menor --- */}
      {/* Em Portrait: Topo. Em Landscape: Esquerda. */}
      <div className={`bg-black z-30 flex ${isLandscape ? 'flex-col w-16 h-full border-r border-white/10 py-6' : 'flex-row h-16 w-full border-b border-white/10 px-6'} items-center justify-between`}>
         {/* Botão Fechar (agora à esquerda/topo) */}
         <button onClick={onClose} className="p-2 text-white/80 hover:text-white rounded-full bg-gray-800/50">
            <X size={24} />
         </button>

         {/* Grid Toggle */}
         <button onClick={() => setShowGrid(!showGrid)} className={`p-2 rounded-full transition-colors ${showGrid ? 'text-yellow-400 bg-yellow-400/10' : 'text-white/60 hover:text-white'}`}>
            <Grid3X3 size={24} />
         </button>

         {/* Spacer para equilíbrio se necessário */}
         <div className="w-6 h-6"></div>
      </div>

      {/* --- ÁREA CENTRAL (Viewfinder) --- */}
      <div className="flex-1 relative bg-[#121212] overflow-hidden flex items-center justify-center">
        {/* Container 4:3 Fixo */}
        <div className="relative w-full max-w-full aspect-[4/3] overflow-hidden bg-black shadow-2xl">
            <video ref={videoRef} autoPlay playsInline className="absolute inset-0 w-full h-full object-cover" />
            <canvas ref={canvasRef} className="hidden" />
            
            <div className={`absolute inset-0 bg-white transition-opacity duration-75 pointer-events-none ${flashVisual ? 'opacity-80' : 'opacity-0'}`} />

            {/* Overlays (Grid & Level) */}
            <div className="absolute inset-0 pointer-events-none">
                {showGrid && (
                    <div className="w-full h-full grid grid-cols-3 grid-rows-3 opacity-40">
                        <div className="border-r border-b border-white/30"></div>
                        <div className="border-r border-b border-white/30"></div>
                        <div className="border-b border-white/30"></div>
                        <div className="border-r border-b border-white/30"></div>
                        <div className="border-r border-b border-white/30"></div>
                        <div className="border-b border-white/30"></div>
                        <div className="border-r border-white/30"></div>
                        <div className="border-r border-white/30"></div>
                        <div></div>
                    </div>
                )}

                {hasSensorPermission && (
                    <div className="absolute inset-0 flex items-center justify-center opacity-80">
                        {/* Cruz Central - Estilo Fino */}
                        <div className="relative w-32 h-32 flex items-center justify-center">
                            <div 
                                className={`absolute w-full h-[1px] transition-colors duration-300 shadow-sm
                                ${isLevelRoll ? 'bg-[#00ff00] shadow-[0_0_4px_#00ff00]' : 'bg-white/50'}`}
                                style={{ transform: `rotate(${roll}deg)` }}
                            />
                            <div 
                                className={`absolute h-full w-[1px] transition-colors duration-300 shadow-sm
                                ${isLevelPitch ? 'bg-[#00ff00] shadow-[0_0_4px_#00ff00]' : 'bg-red-500 shadow-[0_0_4px_#ef4444]'}`}
                                style={{ transform: `rotate(${-roll}deg)` }} 
                            />
                        </div>
                    </div>
                )}
            </div>

            {/* --- BOTÕES INTERIOR/EXTERIOR --- */}
            {/* Posicionados na parte inferior da imagem 4:3 */}
            <div className="absolute bottom-4 left-0 right-0 flex justify-center gap-8 z-20">
                 <button onClick={() => setHdrProfile('interior')} 
                    className={`text-xs font-bold tracking-widest transition-all px-2 py-1 ${hdrProfile === 'interior' ? 'text-yellow-400 border-b-2 border-yellow-400' : 'text-white/70 hover:text-white'}`}>
                    INTERIOR
                </button>
                <button onClick={() => setHdrProfile('exterior')} 
                    className={`text-xs font-bold tracking-widest transition-all px-2 py-1 ${hdrProfile === 'exterior' ? 'text-yellow-400 border-b-2 border-yellow-400' : 'text-white/70 hover:text-white'}`}>
                    EXTERIOR
                </button>
            </div>
        </div>
      </div>

      {/* --- BARRA DIREITA (Controles) - Maior --- */}
      {/* Em Portrait: Fundo. Em Landscape: Direita. */}
      <div className={`bg-black z-30 flex ${isLandscape ? 'flex-col w-32 h-full border-l border-white/10' : 'flex-row h-32 w-full border-t border-white/10'} items-center justify-center relative`}>
        
        {/* Zoom - Vertical em Landscape, Horizontal em Portrait */}
        <div className={`flex ${isLandscape ? 'flex-col gap-6 mb-8' : 'flex-row gap-6 mr-8'} items-center justify-center`}>
            <button onClick={() => handleZoom(1)} className={`font-medium transition-all ${zoom === 1 ? 'text-yellow-400 text-base scale-110' : 'text-white/50 text-sm'}`}>1x</button>
            <button onClick={() => handleZoom(0.5)} className={`font-medium transition-all ${zoom === 0.5 ? 'text-yellow-400 text-base scale-110' : 'text-white/50 text-sm'}`}>0.5x</button>
        </div>

        {/* Botão Disparo */}
        <button 
            onClick={initiateCapture} 
            disabled={isProcessing} 
            className="relative w-[72px] h-[72px] rounded-full border-[4px] border-white flex items-center justify-center transition-transform active:scale-95 shadow-lg"
        >
            <div className={`w-[60px] h-[60px] rounded-full bg-white transition-all duration-200 ${isProcessing ? 'scale-75 bg-gray-400' : ''}`} />
        </button>
        
        {/* Espaço vazio onde antes estava a galeria */}
        {/* Se quiser recentrar o botão, podemos ajustar margens aqui */}
      </div>

      {/* Preview Overlay */}
      {previewImage && (
        <div className="absolute inset-0 z-[100] bg-black flex flex-col items-center justify-center animate-in fade-in zoom-in duration-300">
            <img src={previewImage} className="max-w-full max-h-full object-contain" alt="Resultado" />
            <div className="absolute top-6 right-6">
                <button onClick={() => setPreviewImage(null)} className="p-3 bg-black/50 backdrop-blur-md rounded-full text-white border border-white/20">
                    <X size={28} />
                </button>
            </div>
            <div className="absolute bottom-10 bg-green-500/90 backdrop-blur-sm text-white px-6 py-3 rounded-full flex items-center gap-3 shadow-xl">
                <CheckCircle size={24} />
                <span className="font-bold text-sm">GUARDADO</span>
            </div>
        </div>
      )}

      {/* Loading Overlay */}
      {isProcessing && (
        <div className="absolute inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm">
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
