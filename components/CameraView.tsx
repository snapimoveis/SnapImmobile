import React, { useRef, useEffect, useState } from 'react';
import { X } from 'lucide-react';
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

  const [tilt, setTilt] = useState({ beta: 0, gamma: 0 });
  const [capturedPreviews, setCapturedPreviews] = useState<{ url: string; ev: string }[]>([]);
  const [lastSavedPhoto, setLastSavedPhoto] = useState<string | null>(null);

  useEffect(() => {
    const checkOrientation = () => {
      const landscape = window.matchMedia('(orientation: landscape)').matches;
      setIsLandscape(landscape);
    };

    checkOrientation();
    window.addEventListener('resize', checkOrientation);
    window.addEventListener('orientationchange', checkOrientation);

    return () => {
      window.removeEventListener('resize', checkOrientation);
      window.removeEventListener('orientationchange', checkOrientation);
    };
  }, []);

  useEffect(() => {
    startCamera();
    return () => stopCamera();
  }, []);

  useEffect(() => {
    const handleOrientation = (event: DeviceOrientationEvent) => {
      if (event.beta !== null && event.gamma !== null) {
        setTilt({ beta: event.beta, gamma: event.gamma });
      }
    };
    window.addEventListener('deviceorientation', handleOrientation);
    return () => window.removeEventListener('deviceorientation', handleOrientation);
  }, []);

  const currentTilt = isLandscape ? tilt.beta : tilt.gamma;
  const isLevel = Math.abs(currentTilt) < 2;

  const startCamera = async () => {
    try {
      // 1. Try High-Quality 4:3 first
      const constraintsHQ = {
        video: {
          facingMode: 'environment',
          aspectRatio: { ideal: 1.333333 }, 
          width: { ideal: 2560 }, 
          height: { ideal: 1920 }
        }
      };

      let stream;
      try {
          stream = await navigator.mediaDevices.getUserMedia(constraintsHQ);
      } catch (e) {
          console.warn("HQ Camera failed, trying fallback...", e);
          // 2. Fallback: Basic camera
          stream = await navigator.mediaDevices.getUserMedia({
              video: { facingMode: 'environment' }
          });
      }

      if (videoRef.current && stream) {
        videoRef.current.srcObject = stream;
        
        videoRef.current.onloadedmetadata = async () => {
            setIsStreaming(true);
            const track = stream.getVideoTracks()[0];
            const caps: any = track.getCapabilities?.() || {};
            if (caps.zoom) {
                try { await track.applyConstraints({ advanced: [{ zoom: 1 }] } as any); } catch(e){}
            }
        };
      }
    } catch (err) {
      console.error(err);
      alert('Não foi possível aceder à câmara. Verifique as permissões.');
    }
  };

  const stopCamera = () => {
    if (videoRef.current?.srcObject) {
      const stream = videoRef.current.srcObject as MediaStream;
      stream.getTracks().forEach((t) => t.stop());
      setIsStreaming(false);
    }
  };

  const triggerHaptic = () => {
    if (navigator.vibrate) navigator.vibrate(20);
  };

  // --- SISTEMA DE SOM HÍBRIDO ---
  // Tenta tocar o arquivo MP3 específico.
  // Se falhar (arquivo não existe), usa o oscilador digital.
  const playShutterSound = () => {
    // 1. Tentar tocar o arquivo atualizado
    const audio = new Audio('/iphone-camera-capture-6448.mp3'); 
    audio.volume = 1.0;
    
    const playPromise = audio.play();

    if (playPromise !== undefined) {
      playPromise.catch(() => {
        // 2. Fallback: Se der erro (arquivo não encontrado), usa o som digital
        playDigitalBeep();
      });
    }
  };

  const playDigitalBeep = () => {
    try {
      const AudioContext = window.AudioContext || (window as any).webkitAudioContext;
      if (!AudioContext) return;

      const ctx = new AudioContext();
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();

      osc.connect(gain);
      gain.connect(ctx.destination);

      osc.type = 'square';
      osc.frequency.setValueAtTime(800, ctx.currentTime);
      osc.frequency.exponentialRampToValueAtTime(100, ctx.currentTime + 0.1);

      gain.gain.setValueAtTime(0.1, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.1);

      osc.start();
      osc.stop(ctx.currentTime + 0.1);
    } catch (e) {
      console.error("Audio error", e);
    }
  };

  const handleZoom = async (level: number) => {
    setZoom(level);
    if (!videoRef.current?.srcObject) return;

    const track = (videoRef.current.srcObject as MediaStream).getVideoTracks()[0];
    const caps: any = track.getCapabilities?.() || {};

    if (!caps.zoom) return;

    try {
      await track.applyConstraints({ advanced: [{ zoom: level }] } as any);
    } catch (e) {
      console.warn('Zoom constraint failed', e);
    }
  };

  const initiateCapture = async () => {
    if (isProcessing) return;

    for (let i = 3; i > 0; i--) {
      setTimerValue(i);
      await new Promise((r) => setTimeout(r, 1000));
    }
    setTimerValue(null);

    capturePhotoSequence();
  };

  const drawCroppedFrame = (video: HTMLVideoElement, canvas: HTMLCanvasElement, ctx: CanvasRenderingContext2D) => {
      const videoWidth = video.videoWidth;
      const videoHeight = video.videoHeight;
      const targetRatio = 4 / 3;
      const currentRatio = videoWidth / videoHeight;

      let drawWidth = videoWidth;
      let drawHeight = videoHeight;
      let startX = 0;
      let startY = 0;

      if (currentRatio > targetRatio) {
          drawWidth = videoHeight * targetRatio;
          startX = (videoWidth - drawWidth) / 2;
      } else if (currentRatio < targetRatio) {
          drawHeight = videoWidth / targetRatio;
          startY = (videoHeight - drawHeight) / 2;
      }

      canvas.width = drawWidth;
      canvas.height = drawHeight;

      ctx.drawImage(video, startX, startY, drawWidth, drawHeight, 0, 0, drawWidth, drawHeight);
  };

  const capturePhotoSequence = async () => {
    if (!videoRef.current || !canvasRef.current) return;

    setIsProcessing(true);
    setCapturedPreviews([]);

    const video = videoRef.current;
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const stream = video.srcObject as MediaStream;
    const track = stream.getVideoTracks()[0];
    const caps: any = track.getCapabilities?.() || {};

    const supportsExposure =
      caps.exposureCompensation !== undefined &&
      typeof caps.exposureCompensation.min === 'number' &&
      typeof caps.exposureCompensation.max === 'number';

    const interiorEV = [1, 0.5, 0, -0.7, -1.3, -2, -2.7, -3.3, -4];
    const exteriorEV = [2, 1.3, 0.7, 0, -0.3, -1, -1.7, -2.3, -3];
    const janelaEV = [0.3, 0, -0.7, -1.5, -2.5, -3.5, -4.3, -5, -6];

    let effectiveProfile: 'hp_hdr_interior' | 'hp_hdr_exterior' | 'hp_hdr_window' =
      hdrProfile === 'interior' ? 'hp_hdr_interior' : 'hp_hdr_exterior';

    if (hdrProfile === 'interior') {
      try {
        drawCroppedFrame(video, canvas, ctx);
        const topHeight = Math.floor(canvas.height * 0.35);
        const topData = ctx.getImageData(0, 0, canvas.width, topHeight);
        
        let whites = 0;
        let total = topData.data.length / 4;
        for (let i = 0; i < topData.data.length; i += 16) {
            if (topData.data[i] > 240 && topData.data[i+1] > 240 && topData.data[i+2] > 240) whites++;
        }
        if (whites / (total/4) > 0.15) effectiveProfile = 'hp_hdr_window';
      } catch (e) { console.warn(e); }
    }

    const chosenEV = effectiveProfile === 'hp_hdr_interior' ? interiorEV : (effectiveProfile === 'hp_hdr_exterior' ? exteriorEV : janelaEV);
    const stepExp = caps.exposureCompensationStep || 1;
    const exposureIndexes = chosenEV.map((ev) =>
      supportsExposure
        ? Math.max(caps.exposureCompensation.min, Math.min(caps.exposureCompensation.max, Math.round(ev / stepExp)))
        : null
    );
    
    const fallbackBrightness = [3.2, 2.1, 1.4, 1, 0.8, 0.55, 0.32, 0.18, 0.08];
    let bestBase64 = '';

    setProcessingStep('A Capturar HP-HDR (9 Exp)...');
    setProcessingProgress(5);

    for (let i = 0; i < 9; i++) {
      if (supportsExposure && exposureIndexes[i] !== null) {
        await track.applyConstraints({ advanced: [{ exposureCompensation: exposureIndexes[i] }] } as any);
      } else {
        ctx.filter = `brightness(${fallbackBrightness[i]})`;
      }

      playShutterSound();
      triggerHaptic();
      setFlashVisual(true);
      setTimeout(() => setFlashVisual(false), 50);

      drawCroppedFrame(video, canvas, ctx);
      ctx.filter = 'none';

      const url = canvas.toDataURL('image/jpeg', 0.6);
      setCapturedPreviews(prev => [...prev, { url, ev: `${chosenEV[i]}EV` }]);

      if (i === 4) bestBase64 = canvas.toDataURL('image/jpeg', 0.95);
      setProcessingProgress(10 + i * 6);
      await new Promise((r) => setTimeout(r, 120));
    }

    if (!bestBase64) bestBase64 = canvas.toDataURL('image/jpeg', 0.95);

    const steps = [
      { msg: 'Highlight Mapping...', prog: 50 },
      { msg: 'Shadow Recovery...', prog: 65 },
      { msg: 'Nitidez (Pro)...', prog: 75 },
      { msg: 'Geometria 4:3...', prog: 85 },
      { msg: 'Fusão Final...', prog: 90 }
    ];

    for (const st of steps) {
      setProcessingStep(st.msg);
      setProcessingProgress(st.prog);
      await new Promise((r) => setTimeout(r, 400));
    }

    try {
        bestBase64 = await enhanceImage(bestBase64, effectiveProfile);
    } catch (e) {
        console.error("AI Failed", e);
    }

    setProcessingStep('Finalizando...');
    setProcessingProgress(100);

    setLastSavedPhoto(bestBase64);

    onPhotoCaptured({
      id: crypto.randomUUID(),
      url: bestBase64,
      originalUrl: bestBase64,
      name: `HPHDR_PRO_${Date.now()}`,
      timestamp: Date.now(),
      type: 'hdr'
    });

    setIsProcessing(false);
    setProcessingProgress(0);
    setCapturedPreviews([]);
  };

  return (
    <div className="fixed inset-0 bg-black z-50 font-sans overflow-hidden select-none flex flex-col">
      
      {/* Viewfinder */}
      <div className="flex-1 relative flex items-center justify-center bg-black overflow-hidden">
        <video ref={videoRef} autoPlay playsInline className="max-w-full max-h-full aspect-[4/3] object-cover shadow-2xl" />
        
        <canvas ref={canvasRef} className="hidden" />

        <div className={`absolute inset-0 bg-white transition-opacity duration-75 z-50 pointer-events-none ${flashVisual ? 'opacity-80' : 'opacity-0'}`} />

        {timerValue && (
          <div className="absolute inset-0 bg-black/30 flex items-center justify-center z-40">
            <span className={`text-8xl font-extrabold text-white animate-ping ${isLandscape ? '-rotate-90' : ''}`}>{timerValue}</span>
          </div>
        )}

        {/* GRID + LEVEL */}
        <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
            <div className="w-full h-full max-h-full aspect-[4/3] relative border border-white/10">
                <div className="grid grid-cols-3 grid-rows-3 w-full h-full opacity-40">
                    <div className="border-r border-white/40"></div><div className="border-r border-white/40"></div><div></div>
                    <div className="border-t border-r border-white/40"></div><div className="border-t border-r border-white/40"></div><div className="border-t border-white/40"></div>
                    <div className="border-t border-r border-white/40"></div><div className="border-t border-r border-white/40"></div><div className="border-t border-white/40"></div>
                </div>
                <div className={`absolute top-1/2 left-1/2 transition-all -translate-x-1/2 -translate-y-1/2 shadow ${isLevel ? 'bg-[#623aa2]' : 'bg-white'}`}
                    style={{ width: isLandscape ? '1px' : '70px', height: isLandscape ? '70px' : '1px', transform: `translate(-50%, -50%) rotate(${currentTilt}deg)` }} />
            </div>
        </div>

        {/* ZOOM CONTROLS */}
        <div className={`absolute z-40 ${isLandscape ? 'right-36 top-1/2 -translate-y-1/2' : 'bottom-40 left-1/2 -translate-x-1/2'}`}>
          <div className={`flex gap-2 bg-black/50 px-3 py-2 rounded-full border border-white/10 shadow-xl ${isLandscape ? 'flex-col' : ''}`}>
            {[0.5, 1, 2].map((level) => (
              <button key={level} onClick={() => { handleZoom(level); triggerHaptic(); }}
                className={`w-8 h-8 rounded-full flex items-center justify-center font-bold text-xs ${zoom === level ? 'bg-[#623aa2] text-white scale-110 shadow' : 'text-white/90 hover:bg-white/20'}`}>
                <span className={`${isLandscape ? '-rotate-90' : ''}`}>{level === 0.5 ? '.5' : level}x</span>
              </button>
            ))}
          </div>
        </div>

        {/* LAST PHOTO THUMBNAIL */}
        {lastSavedPhoto && !isProcessing && (
            <div className={`absolute z-40 ${isLandscape ? 'right-8 bottom-8' : 'left-8 bottom-8'} w-14 h-14 rounded-lg border-2 border-white overflow-hidden shadow-lg bg-black animate-in zoom-in`}>
                <img src={lastSavedPhoto} className="w-full h-full object-cover opacity-80" alt="Last shot" />
            </div>
        )}

        {/* BURST PREVIEWS */}
        {capturedPreviews.length > 0 && (
          <div className={`absolute z-40 flex gap-1 px-4 overflow-x-auto ${isLandscape ? 'right-32 top-0 bottom-0 flex-col w-16 py-6' : 'bottom-56 left-0 right-0 flex-row h-16'}`}>
            {capturedPreviews.map((p, i) => (
              <div key={i} className="aspect-[4/3] border border-white/40 rounded-sm overflow-hidden w-full h-full">
                <img src={p.url} className="object-cover w-full h-full" />
              </div>
            ))}
          </div>
        )}

        {/* PROCESSING OVERLAY */}
        {isProcessing && (
          <div className="absolute inset-0 bg-black/80 backdrop-blur-md flex flex-col items-center justify-center z-50">
            <div className="relative w-24 h-24 mb-6">
              <svg className="w-full h-full rotate-[-90deg]">
                <circle cx="48" cy="48" r="42" fill="none" stroke="#334155" strokeWidth="6" />
                <circle cx="48" cy="48" r="42" fill="none" stroke="#623aa2" strokeWidth="6" strokeDasharray="264" strokeDashoffset={264 - (264 * processingProgress) / 100} strokeLinecap="round" />
              </svg>
              <div className="absolute inset-0 flex justify-center items-center"><span className="text-white text-lg font-bold">{Math.round(processingProgress)}%</span></div>
            </div>
            <p className="text-[#623aa2] font-medium text-sm animate-pulse">{processingStep}</p>
          </div>
        )}

        {/* INTERIOR/EXTERIOR TOGGLE */}
        <div className={`absolute z-40 flex gap-4 ${isLandscape ? 'bottom-8 left-1/2 -translate-x-1/2' : 'bottom-28 left-1/2 -translate-x-1/2'}`}>
          <button onClick={() => setHdrProfile('interior')} className={`px-5 py-2 rounded-full text-xs font-semibold border ${hdrProfile === 'interior' ? 'bg-white text-black border-white' : 'bg-transparent text-white border-white/60'}`}>INTERIOR</button>
          <button onClick={() => setHdrProfile('exterior')} className={`px-5 py-2 rounded-full text-xs font-semibold border ${hdrProfile === 'exterior' ? 'bg-white text-black border-white' : 'bg-transparent text-white border-white/60'}`}>EXTERIOR</button>
        </div>
      </div>

      {/* TOP CONTROLS */}
      <div className="absolute top-0 left-0 right-0 p-6 flex justify-between items-center bg-gradient-to-b from-black/80 to-transparent z-40 pointer-events-none">
        <button onClick={onClose} className="text-white/80 hover:text-white pointer-events-auto"><X className="w-8 h-8" strokeWidth={1.5} /></button>
      </div>

      {/* SHUTTER BUTTON AREA */}
      <div className={`absolute z-40 flex justify-center items-center ${isLandscape ? 'right-0 top-0 bottom-0 w-32 bg-black' : 'bottom-0 left-0 right-0 h-32 pb-6 bg-black'}`}>
        <button onClick={initiateCapture} disabled={isProcessing} className={`relative w-20 h-20 rounded-full border-[3px] flex justify-center items-center transition-all ${isProcessing ? 'border-gray-500 opacity-50 scale-90' : 'border-white hover:bg-white/10 active:scale-95'}`}>
          <div className={`rounded-full bg-white transition-all ${isProcessing ? 'w-14 h-14 bg-gray-400' : 'w-16 h-16'}`} />
        </button>
      </div>
    </div>
  );
};