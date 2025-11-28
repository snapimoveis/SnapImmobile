import React, { useRef, useEffect, useState } from 'react';
import { X, Grid3X3, Image as ImageIcon, Settings2, Compass } from 'lucide-react';
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
  const [hasSensorPermission, setHasSensorPermission] = useState(false);
  
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

  // Handler de Orientação com pedido de permissão para iOS
  useEffect(() => {
    const handleOrientation = (event: DeviceOrientationEvent) => {
      if (event.beta !== null && event.gamma !== null) {
        setHasSensorPermission(true);
        setTilt(prev => ({
            beta: prev.beta * 0.8 + event.beta! * 0.2, // Smoothing
            gamma: prev.gamma * 0.8 + event.gamma! * 0.2
        }));
      }
    };

    // Tenta adicionar logo o listener (funciona em Android)
    window.addEventListener('deviceorientation', handleOrientation);
    
    return () => window.removeEventListener('deviceorientation', handleOrientation);
  }, []);

  // Função para pedir permissão (iOS 13+)
  const requestSensorAccess = async () => {
    if (typeof (DeviceOrientationEvent as any).requestPermission === 'function') {
        try {
            const permissionState = await (DeviceOrientationEvent as any).requestPermission();
            if (permissionState === 'granted') {
                setHasSensorPermission(true);
            } else {
                alert("Permissão de sensores negada. O nível não funcionará.");
            }
        } catch (e) {
            console.error(e);
        }
    }
  };

  // --- LÓGICA DE NIVELAMENTO CORRIGIDA ---
  // Landscape: Beta é o horizonte (roll). Gamma é a inclinação frente/trás (pitch).
  // Portrait: Gamma é o horizonte (roll). Beta é a inclinação frente/trás (pitch).
  
  const roll = isLandscape ? tilt.beta : tilt.gamma; 
  const pitch = isLandscape ? tilt.gamma : tilt.beta; 

  // Ajuste de "Zero" para o Pitch (depende de como se segura o telemóvel)
  // Em portrait, Beta ~90 graus é vertical. Em landscape, Gamma ~0 é vertical.
  const pitchOffset = isLandscape ? 0 : 90; 
  const normalizedPitch = pitch - pitchOffset;

  // Margens de erro para ficar verde
  const isLevelRoll = Math.abs(roll) < 1.5; // Horizonte
  const isLevelPitch = Math.abs(normalizedPitch) < 3; // Verticalidade

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
    const brightnessFallback = [0.2, 0.4, 0.6, 0.8, 1.0, 1.2, 1.5, 1.8, 2.2];
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
        const finalImage = await enhanceImage(fusionPayload, effectiveProfile);
        setProcessingStep('Salvo');
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
      
      {/* --- VISOR 4:3 (Centralizado) --- */}
      <div className="flex-1 relative bg-[#000] overflow-hidden flex items-center justify-center">
        <div className="relative w-full max-w-full aspect-[3/4] md:aspect-[4/3] overflow-hidden bg-black shadow-2xl">
            <video ref={videoRef} autoPlay playsInline className="absolute inset-0 w-full h-full object-cover" />
            <canvas ref={canvasRef} className="hidden" />
            
            <div className={`absolute inset-0 bg-white transition-opacity duration-75 pointer-events-none ${flashVisual ? 'opacity-80' : 'opacity-0'}`} />

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

                {/* --- NIVEL (CROSSHAIR) --- */}
                {/* O nível só aparece se tivermos dados do sensor. Se não, não engana o utilizador. */}
                {hasSensorPermission && (
                    <>
                        {/* Linha Horizontal (Roll - Horizonte) */}
                        {/* Fica VERMELHA se torta, VERDE se nivelada */}
                        <div className={`absolute top-1/2 left-[20%] right-[20%] h-[1px] transition-colors duration-200 
                            ${isLevelRoll ? 'bg-[#00ff00] shadow-[0_0_6px_#00ff00]' : 'bg-red-500 shadow-[0_0_4px_#ef4444]'}`} 
                            style={{ transform: `rotate(${roll}deg)` }} 
                        />
                        
                        {/* Linha Vertical (Pitch - Inclinação) */}
                        {/* Fica VERMELHA se inclinada, VERDE se a prumo */}
                        {/* Nota: Usamos isLevelPitch para a cor, não isLevelRoll */}
                        <div className={`absolute left-1/2 top-[20%] bottom-[20%] w-[1px] transition-colors duration-200 
                            ${isLevelPitch ? 'bg-[#00ff00] shadow-[0_0_6px_#00ff00]' : 'bg-red-500 shadow-[0_0_4px_#ef4444]'}`} 
                            style={{ transform: `rotate(${-roll}deg)` }} 
                        />
                        
                        {/* Centro Cruz (Branco Fixo) */}
                        <div className="absolute top-1/2 left-1/2 w-4 h-4 -mt-2 -ml-2 opacity-80">
                            <div className="w-full h-[2px] bg-white absolute top-1/2 -mt-[1px]"></div>
                            <div className="h-full w-[2px] bg-white absolute left-1/2 -ml-[1px]"></div>
                        </div>
                    </>
                )}
            </div>

            <div className="absolute bottom-8 left-1/2 -translate-x-1/2 flex gap-6 z-20 pointer-events-auto">
                <button onClick={() => setHdrProfile('interior')} 
                    className={`px-6 py-1.5 rounded-full text-xs font-bold tracking-widest transition-all ${hdrProfile === 'interior' ? 'bg-yellow-400 text-black shadow-lg shadow-yellow-400/20' : 'bg-black/40 text-white/80 border border-white/20'}`}>
                    INTERIOR
                </button>
                <button onClick={() => setHdrProfile('exterior')} 
                    className={`px-6 py-1.5 rounded-full text-xs font-bold tracking-widest transition-all ${hdrProfile === 'exterior' ? 'bg-yellow-400 text-black shadow-lg shadow-yellow-400/20' : 'bg-black/40 text-white/80 border border-white/20'}`}>
                    EXTERIOR
                </button>
            </div>
        </div>
      </div>

      {/* --- BARRA DE CONTROLO --- */}
      <div className="bg-black flex md:flex-col items-center justify-between p-6 md:w-[140px] md:h-full h-[160px] z-30 flex-shrink-0">
        
        <div className="flex md:flex-col gap-8 items-center justify-center order-1 md:order-1 w-1/3 md:w-auto">
            <button onClick={() => setShowGrid(!showGrid)} className={`transition-colors ${showGrid ? 'text-yellow-400' : 'text-white'}`}>
                <Grid3X3 size={28} strokeWidth={1.5} />
            </button>
            
            {/* Botão para pedir permissão de sensores no iOS (se ainda não tiver) */}
            {!hasSensorPermission && (
                <button onClick={requestSensorAccess} className="text-red-400 animate-pulse" title="Ativar Nível">
                    <Compass size={28} strokeWidth={1.5} />
                </button>
            )}
        </div>

        <div className="flex flex-col items-center gap-6 order-2 md:order-2 w-1/3 md:w-auto justify-center">
            <div className="flex flex-col gap-3 text-sm font-bold items-center">
                <button onClick={() => handleZoom(1)} className={`transition-all ${zoom === 1 ? 'text-yellow-400 text-base scale-110' : 'text-white/60'}`}>1x</button>
                <button onClick={() => handleZoom(0.5)} className={`transition-all ${zoom === 0.5 ? 'text-yellow-400 text-base scale-110' : 'text-white/60'}`}>0.5x</button>
            </div>

            <button 
                onClick={initiateCapture} 
                disabled={isProcessing} 
                className="relative w-[72px] h-[72px] rounded-full border-[4px] border-white flex items-center justify-center transition-transform active:scale-95 shadow-lg"
            >
                <div className={`w-[60px] h-[60px] rounded-full bg-white transition-all duration-200 ${isProcessing ? 'scale-75 bg-gray-400' : ''}`} />
            </button>
        </div>

        <div className="flex md:flex-col gap-8 items-center justify-center order-3 md:order-3 w-1/3 md:w-auto">
            <div className="w-12 h-12 bg-gray-800 rounded-lg overflow-hidden border border-white/20 relative">
                {lastSavedPhoto ? (
                    <img src={lastSavedPhoto} className="w-full h-full object-cover opacity-80" />
                ) : (
                    <div className="w-full h-full flex items-center justify-center text-white/30"><ImageIcon size={20}/></div>
                )}
            </div>
            
            <button onClick={onClose} className="p-2 text-white/50 hover:text-white border border-white/20 rounded-lg">
                <X size={24} />
            </button>
        </div>
      </div>

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
