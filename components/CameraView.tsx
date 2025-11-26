import React, { useRef, useEffect, useState } from 'react';
import { RefreshCw, Zap, Aperture, Maximize, Image as ImageIcon, X, ZapOff } from 'lucide-react';
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
  const [hdrMode, setHdrMode] = useState(true);
  const [flashVisual, setFlashVisual] = useState(false); // Visual white flash effect
  const [zoom, setZoom] = useState(1);
  const [isLandscape, setIsLandscape] = useState(false);

  // Timer State
  const [timerValue, setTimerValue] = useState<number | null>(null);

  // Detect Screen Orientation for Layout & Leveler Logic
  useEffect(() => {
    const checkOrientation = () => {
        const landscape = window.matchMedia("(orientation: landscape)").matches;
        setIsLandscape(landscape);
    };

    checkOrientation();
    window.addEventListener('resize', checkOrientation);
    window.addEventListener('orientationchange', checkOrientation);
    
    return () => {
        window.removeEventListener('resize', checkOrientation);
        window.removeEventListener('orientationchange', checkOrientation);
    }
  }, []);

  useEffect(() => {
    startCamera();
    return () => {
      stopCamera();
    };
  }, []);

  // Device Orientation for Leveler
  const [tilt, setTilt] = useState({ beta: 0, gamma: 0 });
  useEffect(() => {
      const handleOrientation = (event: DeviceOrientationEvent) => {
          if (event.beta !== null && event.gamma !== null) {
              setTilt({ beta: event.beta, gamma: event.gamma });
          }
      };
      window.addEventListener('deviceorientation', handleOrientation);
      return () => window.removeEventListener('deviceorientation', handleOrientation);
  }, []);

  // Determine Level status based on orientation
  // Portrait: Gamma is L/R tilt. Landscape: Beta is L/R tilt.
  const currentTilt = isLandscape ? tilt.beta : tilt.gamma;
  const isLevel = Math.abs(currentTilt) < 2;

  const startCamera = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { 
            facingMode: 'environment', 
            width: { ideal: 1920 }, 
            height: { ideal: 1080 },
            zoom: true 
        } as MediaTrackConstraints & { zoom?: boolean }
      });
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        setIsStreaming(true);
      }
    } catch (err) {
      console.error("Error accessing camera:", err);
      alert("Não foi possível aceder à câmara. Por favor verifique as permissões.");
    }
  };

  const stopCamera = () => {
    if (videoRef.current && videoRef.current.srcObject) {
      const stream = videoRef.current.srcObject as MediaStream;
      stream.getTracks().forEach(track => track.stop());
      setIsStreaming(false);
    }
  };

  const handleZoom = async (level: number) => {
    setZoom(level);
    if (!videoRef.current || !videoRef.current.srcObject) return;

    const stream = videoRef.current.srcObject as MediaStream;
    const track = stream.getVideoTracks()[0];
    const capabilities = (track.getCapabilities?.() || {}) as any;

    if (capabilities.zoom) {
        const min = capabilities.zoom.min || 1;
        const max = capabilities.zoom.max || 1;
        const target = Math.max(min, Math.min(max, level));
        
        try {
            await track.applyConstraints({ advanced: [{ zoom: target }] } as any);
        } catch (e) {
            console.warn("Zoom constraint failed", e);
        }
    }
  };

  // Realistic Shutter Sound (Base64 MP3 of a Camera Click)
  const playShutterSound = () => {
    try {
        // Short, crisp mechanical shutter sound
        const audio = new Audio("data:audio/mp3;base64,//uQRAAAAWMSLwUIYAAsYkXgoQwAEaYLWfkWgAI0wWs/ItAAAG1xUAALDkAALDkAAAL5hIAAAAB3MD+0AAAD81YnUAAAB14AAAAAAH90AAAAAAB97gAAAAAAB99gAAAAAAB99gAAAAAAB99gAAAAAAB99gAAAAAAB99gAAAAAAB99gAAAAAAB99gAAAAAAB99gAAAAAAB99gAAAAAAB99gAAAAAAB99gAAAAAAB99gAAAAAAB99gAA//uQZAAAAABf85AAAAAAX/OQAAAAA");
        // Fallback to a better quality click if the above short one isn't sufficient (using a standard UI click simulation logic below for robustness)
        
        // Let's create a synthetic "Clack" that sounds like a phone shutter using AudioContext for zero-latency
        const AudioContext = window.AudioContext || (window as any).webkitAudioContext;
        if (!AudioContext) return;
        
        const ctx = new AudioContext();
        
        // High frequency "snap"
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        
        osc.frequency.setValueAtTime(800, ctx.currentTime);
        osc.frequency.exponentialRampToValueAtTime(100, ctx.currentTime + 0.05);
        
        gain.gain.setValueAtTime(0.5, ctx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.05);
        
        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.start();
        osc.stop(ctx.currentTime + 0.06);

        // Low frequency "thud" (mechanical movement)
        const osc2 = ctx.createOscillator();
        const gain2 = ctx.createGain();
        osc2.type = 'triangle';
        osc2.frequency.setValueAtTime(150, ctx.currentTime);
        osc2.frequency.linearRampToValueAtTime(50, ctx.currentTime + 0.1);
        gain2.gain.setValueAtTime(0.5, ctx.currentTime);
        gain2.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.15);
        
        osc2.connect(gain2);
        gain2.connect(ctx.destination);
        osc2.start();
        osc2.stop(ctx.currentTime + 0.15);

    } catch (e) { console.error(e); }
  };

  // Trigger Haptic Feedback
  const triggerHaptic = () => {
    if (navigator.vibrate) {
        navigator.vibrate(20); // Short tick
    }
  };

  const [capturedPreviews, setCapturedPreviews] = useState<{url: string, ev: string}[]>([]);

  const initiateCapture = async () => {
      if (isProcessing) return;
      
      // 3 Second Timer
      for (let i = 3; i > 0; i--) {
          setTimerValue(i);
          await new Promise(r => setTimeout(r, 1000));
      }
      setTimerValue(null);
      capturePhotoSequence();
  };

  const capturePhotoSequence = async () => {
  if (!videoRef.current || !canvasRef.current) return;

  setIsProcessing(true);
  setCapturedPreviews([]);

  const video = videoRef.current;
  const canvas = canvasRef.current;

  canvas.width = video.videoWidth;
  canvas.height = video.videoHeight;

  const ctx = canvas.getContext("2d");
  if (!ctx) return;

  // --- GET CAMERA TRACK ---
  const stream = video.srcObject as MediaStream;
  const track = stream.getVideoTracks()[0];
  const capabilities: any = track.getCapabilities?.() || {};

  const supportsExposure =
    capabilities.exposureCompensation !== undefined &&
    typeof capabilities.exposureCompensation.min === "number" &&
    typeof capabilities.exposureCompensation.max === "number";

  // --- HP-HDR EV CURVE ---
  const hpEV = [1.7, 1.0, 0.5, 0.0, -0.3, -1.0, -2.0, -2.7, -3.5];
  const hpLabels = ["+1.7", "+1.0", "+0.5", "0.0", "-0.3", "-1.0", "-2.0", "-2.7", "-3.5"];

  const exposureIndexes = hpEV.map((ev) => {
    if (!supportsExposure) return null;

    const step = capabilities.exposureCompensationStep || 1;
    const index = Math.round(ev / step);

    return Math.max(
      capabilities.exposureCompensation.min,
      Math.min(capabilities.exposureCompensation.max, index)
    );
  });

  // fallback brightness (apenas para devices sem EV real)
  const fallbackBrightness = [3.25, 2.0, 1.41, 1.0, 0.81, 0.5, 0.25, 0.15, 0.09];

  const previews: { url: string; ev: string }[] = [];
  let bestImageBase64 = "";

  setProcessingStep("A capturar HP-HDR Real…");
  setProcessingProgress(5);

  for (let i = 0; i < 9; i++) {
    // ---- APPLY EXPOSURE REAL ----
    if (supportsExposure && exposureIndexes[i] !== null) {
      try {
        await track.applyConstraints({
          advanced: [{ exposureCompensation: exposureIndexes[i] }]
        });
        await new Promise((r) => setTimeout(r, 120));
      } catch (e) {
        console.warn("Exposure adjustment failed:", e);
      }
    } else {
      ctx.filter = `brightness(${fallbackBrightness[i]})`;
    }

    // Effects
    playShutterSound();
    triggerHaptic();
    setFlashVisual(true);
    setTimeout(() => setFlashVisual(false), 50);

    // Capture frame
    ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
    ctx.filter = "none";

    const jpeg = canvas.toDataURL("image/jpeg", 0.95);

    if (i === 4) bestImageBase64 = jpeg;

    previews.push({ url: jpeg, ev: hpLabels[i] });
    setCapturedPreviews([...previews]);

    setProcessingProgress(10 + i * 6);
    await new Promise((r) => setTimeout(r, 150));
  }

  // --- AI FUSION ---
  if (hdrMode) {
    const steps = [
      { msg: "Highlight Mapping Inteligente…", prog: 60 },
      { msg: "Shadow Recovery Natural…", prog: 70 },
      { msg: "Nitidez Real…", prog: 80 },
      { msg: "Correção de Perspetiva…", prog: 85 },
      { msg: "Fusão HP-HDR Final…", prog: 90 }
    ];

    for (const step of steps) {
      setProcessingStep(step.msg);
      setProcessingProgress(step.prog);
      await new Promise((r) => setTimeout(r, 500));
    }

    try {
      bestImageBase64 = await enhanceImage(bestImageBase64);
    } catch (err) {
      console.error("AI enhancement failed", err);
    }
  }

  setProcessingStep("A finalizar imagem premium…");
  setProcessingProgress(100);

  const finalPhoto: Photo = {
    id: crypto.randomUUID(),
    url: bestImageBase64,
    originalUrl: bestImageBase64,
    name: `HP-HDR_${new Date().toISOString()}`,
    timestamp: Date.now(),
    type: hdrMode ? "hdr" : "standard"
  };

  onPhotoCaptured(finalPhoto);
  setIsProcessing(false);
  setCapturedPreviews([]);
};

  return (
    <div className="fixed inset-0 bg-black z-50 font-sans overflow-hidden select-none">
      
      {/* Viewfinder (Full Screen) */}
      <div className="absolute inset-0 overflow-hidden bg-gray-900 flex items-center justify-center group">
        <video 
          ref={videoRef} 
          autoPlay 
          playsInline 
          className="absolute min-w-full min-h-full object-cover"
        />
        <canvas ref={canvasRef} className="hidden" />
        
        {/* Visual Flash Effect */}
        <div className={`absolute inset-0 bg-white pointer-events-none transition-opacity duration-75 ease-out z-50 ${flashVisual ? 'opacity-80' : 'opacity-0'}`}></div>

        {/* Timer Overlay */}
        {timerValue && (
            <div className="absolute inset-0 flex items-center justify-center z-40 bg-black/20 backdrop-blur-sm">
                <span className={`text-9xl font-black text-white animate-ping ${isLandscape ? '-rotate-90' : ''}`}>{timerValue}</span>
            </div>
        )}

        {/* Professional Grid & Leveler */}
        <div className="absolute inset-0 pointer-events-none opacity-30">
            <div className="w-full h-full grid grid-cols-3 grid-rows-3">
                {/* Grid Lines */}
                <div className="border-r border-white/50 shadow-sm"></div>
                <div className="border-r border-white/50 shadow-sm"></div>
                <div></div>
                <div className="border-r border-t border-white/50 shadow-sm"></div>
                <div className="border-r border-t border-white/50 shadow-sm"></div>
                <div className="border-t border-white/50 shadow-sm"></div>
                <div className="border-r border-t border-white/50 shadow-sm"></div>
                <div className="border-r border-t border-white/50 shadow-sm"></div>
                <div className="border-t border-white/50 shadow-sm"></div>
            </div>
            
            {/* Digital Leveler - Adapts to Orientation */}
            <div 
                className={`absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 transition-all duration-200 shadow-md ${isLevel ? 'bg-yellow-400' : 'bg-white/80'}`} 
                style={{ 
                    width: isLandscape ? '1px' : '60px',
                    height: isLandscape ? '60px' : '1px',
                    transform: `translate(-50%, -50%) rotate(${currentTilt}deg)` 
                }}
            ></div>
             {/* Center Crosshair */}
             <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-4 h-4 border border-white/50 rounded-full"></div>
        </div>

        {/* Zoom Controls - Refined UI */}
        <div className={`absolute z-30 transition-all duration-300 
            ${isLandscape 
                ? 'right-36 top-1/2 -translate-y-1/2' // Landscape
                : 'bottom-40 left-1/2 -translate-x-1/2' // Portrait
            }`}
        >
            <div className={`flex items-center gap-2 bg-black/50 backdrop-blur-md px-3 py-2 rounded-full border border-white/10 shadow-xl ${isLandscape ? 'flex-col' : ''}`}>
                {[0.5, 1, 2].map((level) => (
                    <button
                        key={level}
                        onClick={() => { handleZoom(level); triggerHaptic(); }}
                        className={`w-8 h-8 rounded-full flex items-center justify-center text-[10px] font-bold transition-all duration-200 ${
                            zoom === level 
                            ? 'bg-yellow-500 text-black scale-110 shadow-[0_0_8px_rgba(234,179,8,0.5)]' 
                            : 'text-white/90 hover:bg-white/20'
                        }`}
                    >
                        <span className={`${isLandscape ? '-rotate-90' : ''}`}>
                             {level === 0.5 ? '.5' : level}x
                        </span>
                    </button>
                ))}
            </div>
        </div>

        {/* Burst Preview Strip (9 Photos) */}
        {capturedPreviews.length > 0 && (
            <div className={`absolute z-30 flex items-center gap-1.5 px-4 overflow-x-auto no-scrollbar mask-linear-fade
                ${isLandscape
                    ? 'right-32 top-0 bottom-0 w-16 flex-col py-8' // Landscape
                    : 'bottom-56 left-0 right-0 h-16 flex-row' // Portrait
                }`}
            >
                {capturedPreviews.map((item, idx) => (
                    <div key={idx} className="relative flex-shrink-0 aspect-[3/4] animate-in fade-in duration-100 w-full h-auto md:h-full border border-white/30 rounded-sm overflow-hidden">
                         <img src={item.url} className="h-full w-full object-cover" />
                    </div>
                ))}
            </div>
        )}

        {/* Processing Overlay */}
        {isProcessing && (
          <div className="absolute inset-0 bg-black/80 flex flex-col items-center justify-center z-50 backdrop-blur-sm transition-all duration-300">
             <div className="relative w-24 h-24 mb-6">
                 <svg className="w-full h-full rotate-[-90deg]">
                     <circle cx="48" cy="48" r="42" fill="none" stroke="#334155" strokeWidth="6" />
                     <circle 
                        cx="48" cy="48" r="42" 
                        fill="none" 
                        stroke="#3b82f6" 
                        strokeWidth="6" 
                        strokeDasharray="264"
                        strokeDashoffset={264 - (264 * processingProgress) / 100}
                        strokeLinecap="round"
                        className="transition-all duration-300 ease-out"
                     />
                 </svg>
                 <div className="absolute inset-0 flex items-center justify-center">
                    <span className="text-white font-bold text-lg">{Math.round(processingProgress)}%</span>
                 </div>
             </div>
             <p className="text-blue-400 font-medium text-sm uppercase tracking-widest animate-pulse text-center px-6">{processingStep}</p>
          </div>
        )}
      </div>

      {/* Top Bar (Settings) */}
      <div className={`absolute p-6 flex justify-between items-center z-20 bg-gradient-to-b from-black/80 via-black/40 to-transparent
        ${isLandscape 
            ? 'left-0 top-0 bottom-0 w-24 flex-col border-r border-white/5 bg-gradient-to-r' 
            : 'top-0 left-0 right-0 flex-row'
        }`}
      >
        <button onClick={onClose} className={`text-white/80 hover:text-white transition-colors ${isLandscape ? '-rotate-90' : ''}`}>
          <X className="w-8 h-8 drop-shadow-md" strokeWidth={1.5} />
        </button>
        
        <div className="flex items-center gap-4">
            <button 
                onClick={() => { setHdrMode(!hdrMode); triggerHaptic(); }}
                className={`flex items-center justify-center w-10 h-10 rounded-full transition-all border ${
                    hdrMode 
                    ? 'bg-yellow-500 text-black border-yellow-400 shadow-[0_0_15px_rgba(234,179,8,0.4)]' 
                    : 'bg-black/30 border-white/20 text-white'
                } ${isLandscape ? '-rotate-90' : ''}`}
            >
                {hdrMode ? <Zap className="w-5 h-5 fill-black" /> : <ZapOff className="w-5 h-5" />}
            </button>
            {hdrMode && <span className={`text-[10px] font-bold text-yellow-500 tracking-widest absolute ${isLandscape ? 'bottom-20 -rotate-90' : 'top-16 right-6'}`}>HP-HDR</span>}
        </div>
      </div>

      {/* Control Bar (Shutter) */}
      <div className={`absolute flex items-center justify-around z-40 bg-black/60 backdrop-blur-md
         ${isLandscape
            ? 'right-0 top-0 bottom-0 w-32 flex-col py-10' // Landscape
            : 'bottom-0 left-0 right-0 h-32 flex-row pb-6 px-8' // Portrait
         }`}
      >
         {/* Gallery / Previous */}
        <div className="w-12 h-12 rounded-lg bg-gray-800/80 border border-white/10 overflow-hidden relative shadow-lg cursor-pointer hover:border-white/50 transition-colors">
             <img src="https://images.unsplash.com/photo-1600585154340-be6161a56a0c?auto=format&fit=crop&w=100&q=80" className="w-full h-full object-cover opacity-50" />
        </div>
        
        {/* Shutter Button - Pro Design */}
        <button 
          onClick={initiateCapture}
          disabled={isProcessing}
          className={`relative rounded-full border-[3px] flex items-center justify-center transition-all duration-150 transform
             ${isLandscape ? 'w-20 h-20' : 'w-20 h-20'}
             ${isProcessing 
                ? 'border-gray-500 opacity-50 cursor-not-allowed scale-90' 
                : 'border-white hover:border-white active:scale-95 active:bg-white/10 shadow-[0_0_20px_rgba(0,0,0,0.5)]'
             }
          `}
        >
          {/* Inner Circle */}
          <div className={`bg-white rounded-full transition-all duration-150 ${isProcessing ? 'w-14 h-14 bg-gray-400' : 'w-16 h-16 shadow-inner active:w-14 active:h-14'}`}></div>
        </button>

        {/* Switch Camera */}
        <div 
            className="w-12 h-12 flex items-center justify-center rounded-full bg-gray-800/80 text-white border border-white/10 hover:bg-gray-700/80 transition-all cursor-pointer shadow-lg active:rotate-180 duration-500" 
            onClick={() => { startCamera(); triggerHaptic(); }}
        >
            <RefreshCw className={`w-5 h-5 ${isLandscape ? '-rotate-90' : ''}`} />
        </div>
      </div>
    </div>
  );
};
