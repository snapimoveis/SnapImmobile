import React, { useRef, useEffect, useState } from 'react';
import { X, Grid3X3, Image as ImageIcon } from 'lucide-react';
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

  const [tilt, setTilt] = useState({ beta: 0, gamma: 0 });
  const [capturedPreviews, setCapturedPreviews] = useState<{ url: string; ev: string }[]>([]);
  const [lastSavedPhoto, setLastSavedPhoto] = useState<string | null>(null);

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
        setTilt(prev => ({
            beta: prev.beta * 0.8 + event.beta! * 0.2,
            gamma: prev.gamma * 0.8 + event.gamma! * 0.2
        }));
      }
    };
    window.addEventListener('deviceorientation', handleOrientation);
    return () => window.removeEventListener('deviceorientation', handleOrientation);
  }, []);

  const horizontalTilt = isLandscape ? tilt.beta : tilt.gamma;
  const verticalTilt = isLandscape ? tilt.gamma : tilt.beta;
  
  const isLevelH = Math.abs(horizontalTilt) < 2;

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
      const ratio = video.videoWidth / video.videoHeight;
      const targetRatio = 4 / 3;
      let w = video.videoWidth, h = video.videoHeight, sx = 0, sy = 0;

      if (ratio > targetRatio) {
          w = h * targetRatio;
          sx = (video.videoWidth - w) / 2;
      } else {
          h = w / targetRatio;
          sy = (video.videoHeight - h) / 2;
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
    const brightnessFallback = [0.2, 0.4, 0.6, 0.8, 1.0, 1.2, 1.5, 1.8, 2.2];
    const capturedBlobs: string[] = [];

    // Determina o perfil efetivo (incluindo deteção de janela)
    let effectiveProfile = hdrProfile === 'interior' ? 'hp_hdr_interior' : 'hp_hdr_exterior';
    
    if (hdrProfile === 'interior') {
      try {
        drawCroppedFrame(video, canvas, ctx);
        const topHeight = Math.floor(canvas.height * 0.35);
        const topData = ctx.getImageData(0, 0, canvas.width, topHeight);
        let whites = 0;
        let total = topData.data.length / 4;
        for (let i = 0; i < topData.data.length; i += 16) {
            if (topData.data[i] > 240) whites++;
        }
        if (whites / (total/4) > 0.15) effectiveProfile = 'hp_hdr_window';
      } catch (e) {}
    }

    setProcessingStep('Snap Fusion (9)...');
    setProcessingProgress(0);

    for (let i = 0; i < evSequence.length; i++) {
        if (supportsEV) {
            const ev = Math.max(caps.exposureCompensation.min, Math.min(caps.exposureCompensation.max, evSequence[i]));
            try { await track.applyConstraints({ advanced: [{ exposureCompensation: ev }] } as any); } catch(e){}
        } else {
            ctx.filter = `brightness(${brightnessFallback[i]})`;
        }

        await new Promise(r => setTimeout(r, 100));
        playShutterSound();
        setFlashVisual(true);
        setTimeout(() => setFlashVisual(false), 50);

        drawCroppedFrame(video, canvas, ctx);
        ctx.filter = 'none';

        const frameData = canvas.toDataURL('image/jpeg', 0.85);
        capturedBlobs.push(frameData);
        
        if (i % 2 === 0) setCapturedPreviews(prev => [...prev, { url: frameData, ev: `${evSequence[i]}` }]);
        setProcessingProgress(((i + 1) / 9) * 40);
    }

    if (supportsEV) try { await track.applyConstraints({ advanced: [{ exposureCompensation: 0 }] } as any); } catch(e){}

    const indicesToUse = [0, 2, 4, 6, 8]; 
    const fusionPayload = indicesToUse.map(i => capturedBlobs[i]);

    setProcessingStep('A Processar IA...');
    setProcessingProgress(50);

    try {
        // CORREÇÃO: Usamos effectiveProfile aqui, que foi calculado acima
        const finalImage = await enhanceImage(fusionPayload, effectiveProfile);
        setProcessingStep('Concluído');
        setProcessingProgress(100);
        setLastSavedPhoto(finalImage);

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
    <div className="fixed inset-0 h-[100dvh] w-screen bg-black z-50 font-sans overflow-hidden select-none flex flex-col md:flex-row text-white touch-none">
      
      {/* --- VISOR (ESQUERDA/TOPO) --- */}
      <div className="flex-1 relative bg-[#121212] overflow-hidden flex items-center justify-center">
        <div className="relative w-full max-w-[100%] aspect-[3/4] md:aspect-[4/3] overflow-hidden bg-black shadow-2xl">
            <video ref={videoRef} autoPlay playsInline className="absolute inset-0 w-full h-full object-cover" />
            <canvas ref={canvasRef} className="hidden" />
            
            <div className={`absolute inset-0 bg-white transition-opacity duration-75 pointer-events-none ${flashVisual ? 'opacity-80' : 'opacity-0'}`} />

            <div className="absolute inset-0 pointer-events-none">
                {showGrid && (
                    <div className="w-full h-full grid grid-cols-3 grid-rows-3 opacity-30">
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

                <div className={`absolute top-1/2 left-1/4 right-1/4 h-[1px] transition-colors duration-300 ${isLevelH ? 'bg-green-500 shadow-[0_0_4px_#22c55e]' : 'bg-white/50'}`} 
                     style={{ transform: `rotate(${horizontalTilt}deg)` }} />
                
                <div className={`absolute left-1/2 top-1/4 bottom-1/4 w-[1px] transition-colors duration-300 ${isLevelH ? 'bg-green-500 shadow-[0_0_4px_#22c55e]' : 'bg-red-500 shadow-[0_0_4px_#ef4444]'}`} 
                     style={{ transform: `rotate(${horizontalTilt * -1}deg)` }} />
                
                <div className="absolute top-1/2 left-1/2 w-4 h-4 -mt-2 -ml-2">
                    <div className="w-full h-[1px] bg-white absolute top-1/2"></div>
                    <div className="h-full w-[1px] bg-white absolute left-1/2"></div>
                </div>
            </div>

            <div className="absolute bottom-6 left-1/2 -translate-x-1/2 flex gap-4 z-20">
                <button onClick={() => setHdrProfile('interior')} 
                    className={`px-4 py-1 rounded-full text-xs font-bold tracking-wide backdrop-blur-md border transition-all ${hdrProfile === 'interior' ? 'bg-yellow-400/20 border-yellow-400 text-yellow-300' : 'bg-black/30 border-white/30 text-white/70'}`}>
                    INTERIOR
                </button>
                <button onClick={() => setHdrProfile('exterior')} 
                    className={`px-4 py-1 rounded-full text-xs font-bold tracking-wide backdrop-blur-md border transition-all ${hdrProfile === 'exterior' ? 'bg-blue-400/20 border-blue-400 text-blue-300' : 'bg-black/30 border-white/30 text-white/70'}`}>
                    EXTERIOR
                </button>
            </div>
        </div>
      </div>

      {/* --- BARRA DE CONTROLO LATERAL --- */}
      <div className="bg-black flex md:flex-col items-center justify-between p-6 md:w-32 md:h-full h-32 md:border-l border-white/10 z-30">
        <div className="flex md:flex-col gap-6 items-center order-1 md:order-1">
            <button onClick={() => setShowGrid(!showGrid)} className={`p-2 rounded-full ${showGrid ? 'text-yellow-400' : 'text-gray-400'}`}>
                <Grid3X3 size={24} />
            </button>
            <button onClick={onClose} className="p-2 text-white/80 hover:text-white md:hidden">
                <X size={28} />
            </button>
        </div>

        <div className="flex md:flex-col items-center gap-6 order-2 md:order-2 flex-1 justify-center">
            <div className="flex md:flex-col gap-4 text-sm font-medium text-gray-400">
                <button onClick={() => handleZoom(1)} className={`transition-colors ${zoom === 1 ? 'text-yellow-400 font-bold scale-110' : 'hover:text-white'}`}>1x</button>
                <button onClick={() => handleZoom(0.5)} className={`transition-colors ${zoom === 0.5 ? 'text-yellow-400 font-bold scale-110' : 'hover:text-white'}`}>0.5x</button>
            </div>

            <button 
                onClick={initiateCapture} 
                disabled={isProcessing} 
                className="relative w-16 h-16 md:w-20 md:h-20 rounded-full border-[4px] border-white flex items-center justify-center transition-transform active:scale-95 shadow-[0_0_20px_rgba(255,255,255,0.2)]"
            >
                <div className={`w-14 h-14 md:w-[68px] md:h-[68px] rounded-full bg-white transition-all duration-200 ${isProcessing ? 'scale-75 bg-gray-400' : ''}`} />
            </button>
        </div>

        <div className="flex md:flex-col gap-6 items-center order-3 md:order-3">
            <div className="w-10 h-10 md:w-12 md:h-12 bg-gray-800 rounded-md overflow-hidden border border-white/20 relative">
                {lastSavedPhoto ? (
                    <img src={lastSavedPhoto} className="w-full h-full object-cover" />
                ) : (
                    <div className="w-full h-full flex items-center justify-center text-gray-500"><ImageIcon size={16}/></div>
                )}
            </div>
            
            <button onClick={onClose} className="hidden md:block p-2 text-white/80 hover:text-white border border-white/20 rounded-md">
                <X size={20} />
            </button>
        </div>
      </div>

      {isProcessing && (
        <div className="absolute inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm">
            <div className="flex flex-col items-center">
                <div className="w-16 h-16 border-4 border-white/20 border-t-white rounded-full animate-spin mb-4"></div>
                <div className="text-white font-medium text-lg tracking-wide">{processingStep}</div>
                <div className="text-white/50 text-sm mt-1">{Math.round(processingProgress)}%</div>
            </div>
        </div>
      )}
    </div>
  );
};
