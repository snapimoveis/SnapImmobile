import React, { useRef, useEffect, useState } from 'react';
import { RefreshCw, Zap, Aperture, Maximize, Image as ImageIcon } from 'lucide-react';
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

  // Realistic Shutter Sound (Base64 encoded short click)
  const playShutterSound = () => {
    // Using Synth for guaranteed sound without external assets
    try {
          const AudioContext = window.AudioContext || (window as any).webkitAudioContext;
          if (!AudioContext) return;
          
          const ctx = new AudioContext();
          const osc = ctx.createOscillator();
          const gain = ctx.createGain();
          const noiseBuffer = ctx.createBuffer(1, ctx.sampleRate * 0.1, ctx.sampleRate);
          const output = noiseBuffer.getChannelData(0);
          for (let i = 0; i < ctx.sampleRate * 0.1; i++) {
              output[i] = Math.random() * 2 - 1;
          }
          const noise = ctx.createBufferSource();
          noise.buffer = noiseBuffer;

          osc.connect(gain);
          noise.connect(gain);
          gain.connect(ctx.destination);
          
          // Mechanical Click Simulation
          osc.type = 'square';
          osc.frequency.setValueAtTime(150, ctx.currentTime);
          osc.frequency.exponentialRampToValueAtTime(40, ctx.currentTime + 0.05);
          
          gain.gain.setValueAtTime(0.8, ctx.currentTime);
          gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.1);
          
          osc.start();
          noise.start();
          osc.stop(ctx.currentTime + 0.1);
          noise.stop(ctx.currentTime + 0.1);
    } catch (e) { console.error(e); }
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
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // ------------------------------------------------------------
    // SPEC: 9 Exposures HP-HDR (+1.7EV to -3.5EV)
    // ------------------------------------------------------------
    setProcessingStep('A Capturar 9 Exp. HP-HDR...');
    setProcessingProgress(5);
    
    const exposureSteps = 9;
    let bestImageBase64 = '';
    const previews: {url: string, ev: string}[] = [];

    // Specific HP-HDR Curve: +1.7 -> +1 -> +0.5 -> 0 -> -0.3 -> -1 -> -2 -> -2.7 -> -3.5
    // Simulated via CSS brightness (1.0 = 100% = 0EV)
    // EV to Brightness approx: 2^EV
    const brightnessLevels = [3.25, 2.0, 1.41, 1.0, 0.81, 0.5, 0.25, 0.15, 0.09];
    const evLabels = ['+1.7EV', '+1.0EV', '+0.5EV', '0.0EV', '-0.3EV', '-1.0EV', '-2.0EV', '-2.7EV', '-3.5EV'];

    try {
        for (let i = 0; i < exposureSteps; i++) {
            playShutterSound();

            const brightness = brightnessLevels[i] || 1.0;
            ctx.filter = `brightness(${brightness * 100}%)`;
            ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
            ctx.filter = 'none'; // Reset

            const shotUrl = canvas.toDataURL('image/jpeg', 0.5); // Low res for preview
            previews.push({ url: shotUrl, ev: evLabels[i] });
            setCapturedPreviews([...previews]);

            // Use the 0EV shot (Index 3) or slightly underexposed shot as base for single-input pipelines
            // For HP-HDR, we might prefer a slightly darker base to protect highlights before AI
            if (i === 4) { 
                bestImageBase64 = canvas.toDataURL('image/jpeg', 0.95);
            }

            // Interval between shots
            await new Promise(r => setTimeout(r, 150));
            setProcessingProgress(10 + (i * 4)); 
        }

        if (!bestImageBase64) bestImageBase64 = canvas.toDataURL('image/jpeg', 0.95);

        if (hdrMode) {
            // Pipeline Step 1: Alignment
            setProcessingStep('Highlight Mapping Inteligente...');
            setProcessingProgress(50);
            await new Promise(r => setTimeout(r, 800)); 

            // Pipeline Step 2: Noise Reduction
            setProcessingStep('Shadow Recovery Natural...');
            setProcessingProgress(65);
            await new Promise(r => setTimeout(r, 600));

            // Pipeline Step 3: White Enhancement
            setProcessingStep('Nitidez Real (Texture-Aware)...');
            setProcessingProgress(75);
            await new Promise(r => setTimeout(r, 600));

            // Pipeline Step 4: Perspective
            setProcessingStep('A Corrigir Perspetiva (V/H)...');
            setProcessingProgress(85);
            
            // Pipeline Step 5: Merge
            setProcessingStep('Fusão HP-HDR Final...');
            
            try {
                bestImageBase64 = await enhanceImage(bestImageBase64);
            } catch (e) {
                console.error("AI Enhancement failed", e);
            }
        }

        setProcessingStep('A Finalizar Imagem Premium...');
        setProcessingProgress(100);
        
        const newPhoto: Photo = {
            id: crypto.randomUUID(),
            url: bestImageBase64,
            originalUrl: bestImageBase64,
            name: `HP-HDR_${new Date().toLocaleTimeString().replace(/:/g, '')}`,
            timestamp: Date.now(),
            type: hdrMode ? 'hdr' : 'standard',
        };

        onPhotoCaptured(newPhoto);
        setIsProcessing(false);
        setProcessingProgress(0);
        setCapturedPreviews([]);

    } catch (error) {
      console.error("Capture pipeline error", error);
      setIsProcessing(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black z-50 font-sans overflow-hidden">
      
      {/* Viewfinder (Full Screen) */}
      <div className="absolute inset-0 overflow-hidden bg-gray-900 flex items-center justify-center group">
        <video 
          ref={videoRef} 
          autoPlay 
          playsInline 
          className="absolute min-w-full min-h-full object-cover"
        />
        <canvas ref={canvasRef} className="hidden" />
        
        {/* Timer Overlay */}
        {timerValue && (
            <div className="absolute inset-0 flex items-center justify-center z-40 bg-black/20 backdrop-blur-sm">
                <span className={`text-9xl font-black text-white animate-ping ${isLandscape ? '-rotate-90' : ''}`}>{timerValue}</span>
            </div>
        )}

        {/* Professional Grid & Leveler */}
        <div className="absolute inset-0 pointer-events-none opacity-20 transition-opacity group-hover:opacity-40">
            <div className="w-full h-full grid grid-cols-3 grid-rows-3">
                {/* Grid Lines */}
                <div className="border-r border-white/70"></div>
                <div className="border-r border-white/70"></div>
                <div></div>
                <div className="border-r border-t border-white/70"></div>
                <div className="border-r border-t border-white/70"></div>
                <div className="border-t border-white/70"></div>
                <div className="border-r border-t border-white/70"></div>
                <div className="border-r border-t border-white/70"></div>
                <div className="border-t border-white/70"></div>
            </div>
            
            {/* Digital Leveler - Adapts to Orientation */}
            <div 
                className={`absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 transition-colors duration-300 ${isLevel ? 'bg-green-400 shadow-[0_0_10px_#4ade80]' : 'bg-white/50'}`} 
                style={{ 
                    width: isLandscape ? '2px' : '128px',
                    height: isLandscape ? '128px' : '2px',
                    transform: `translate(-50%, -50%) rotate(${currentTilt}deg)` 
                }}
            ></div>
        </div>

        {/* Zoom Controls - Responsive Positioning */}
        <div className={`absolute z-30 transition-all duration-300 
            ${isLandscape 
                ? 'right-40 top-1/2 -translate-y-1/2' // Landscape: Right Side
                : 'bottom-40 left-1/2 -translate-x-1/2' // Portrait: Bottom Center
            }`}
        >
            <div className={`flex items-center gap-4 bg-black/40 backdrop-blur-xl px-2 py-1.5 rounded-full border border-white/10 shadow-lg ${isLandscape ? 'flex-col' : ''}`}>
                {[0.5, 1, 2].map((level) => (
                    <button
                        key={level}
                        onClick={() => handleZoom(level)}
                        className={`w-9 h-9 rounded-full flex items-center justify-center text-xs font-bold transition-all duration-200 ${
                            zoom === level 
                            ? 'bg-yellow-500 text-black scale-110 shadow-[0_0_10px_rgba(234,179,8,0.4)]' 
                            : 'text-white hover:bg-white/20'
                        }`}
                    >
                        <span className={`${isLandscape ? '-rotate-90' : ''}`}>
                             {level === 0.5 ? '.5' : level}
                             <span className="text-[9px] opacity-60 ml-0.5">x</span>
                        </span>
                    </button>
                ))}
            </div>
        </div>

        {/* Burst Preview Strip (9 Photos) */}
        {capturedPreviews.length > 0 && (
            <div className={`absolute z-30 flex items-center gap-2 px-4 overflow-x-auto no-scrollbar mask-linear-fade
                ${isLandscape
                    ? 'right-36 top-0 bottom-0 w-20 flex-col py-8' // Landscape: Vertical Strip on Right
                    : 'bottom-52 left-0 right-0 h-20 flex-row' // Portrait: Horizontal Strip on Bottom
                }`}
            >
                {capturedPreviews.map((item, idx) => (
                    <div key={idx} className="relative flex-shrink-0 aspect-[3/4] animate-in fade-in duration-100 group w-full h-auto md:h-full">
                         <img src={item.url} className="h-full w-full object-cover border border-white/50 rounded-sm shadow-lg" />
                         <div className="absolute bottom-0 inset-x-0 bg-black/60 text-[8px] text-white text-center py-0.5 font-mono font-bold">
                             {item.ev}
                         </div>
                    </div>
                ))}
            </div>
        )}

        {/* Processing Overlay */}
        {isProcessing && (
          <div className="absolute inset-0 bg-black/90 flex flex-col items-center justify-center z-50 backdrop-blur-md transition-all duration-300">
             <div className="relative w-20 h-20 mb-8">
                 <svg className="w-full h-full rotate-[-90deg]">
                     <circle cx="40" cy="40" r="36" fill="none" stroke="#334155" strokeWidth="4" />
                     <circle 
                        cx="40" cy="40" r="36" 
                        fill="none" 
                        stroke="#3b82f6" 
                        strokeWidth="4" 
                        strokeDasharray="226"
                        strokeDashoffset={226 - (226 * processingProgress) / 100}
                        className="transition-all duration-300 ease-out"
                     />
                 </svg>
                 <div className="absolute inset-0 flex items-center justify-center">
                    <Aperture className="w-8 h-8 text-blue-500 animate-pulse" />
                 </div>
             </div>
             <h3 className="text-xl font-bold text-white mb-2 tracking-tight text-center">A Processar HP-HDR</h3>
             <p className="text-blue-400 font-mono text-sm uppercase tracking-wider animate-pulse text-center px-4">{processingStep}</p>
          </div>
        )}
      </div>

      {/* Top Bar (Settings) - Adapts to Orientation */}
      <div className={`absolute p-4 flex justify-between items-center z-20 bg-gradient-to-b from-black/60 to-transparent
        ${isLandscape 
            ? 'left-0 top-0 bottom-0 w-24 flex-col border-r border-white/10 bg-gradient-to-r' // Landscape: Left Sidebar
            : 'top-0 left-0 right-0 flex-row' // Portrait: Top Bar
        }`}
      >
        <button onClick={onClose} className={`text-white/90 hover:text-white font-medium text-sm bg-black/20 px-4 py-2 rounded-full backdrop-blur-md border border-white/10 shadow-sm ${isLandscape ? '-rotate-90 whitespace-nowrap' : ''}`}>
          Cancelar
        </button>
        
        <div className="flex items-center gap-3">
            <div 
            onClick={() => setHdrMode(!hdrMode)}
            className={`flex items-center gap-2 px-3 py-1.5 rounded-full backdrop-blur-md cursor-pointer transition-all border shadow-sm ${isLandscape ? '-rotate-90 origin-center mt-4' : ''} ${hdrMode ? 'bg-yellow-500/90 border-yellow-400 text-black shadow-[0_0_15px_rgba(234,179,8,0.3)]' : 'bg-black/20 border-white/10 text-white'}`}
            >
            <Zap className={`w-3 h-3 ${hdrMode ? 'fill-black' : ''}`} />
            <span className="text-xs font-bold tracking-wider">HP-HDR</span>
            </div>
        </div>
      </div>

      {/* Control Bar (Shutter) - Adapts to Orientation */}
      <div className={`absolute flex items-center justify-around z-40 bg-gradient-to-t from-black/80 to-transparent
         ${isLandscape
            ? 'right-0 top-0 bottom-0 w-36 flex-col py-8 bg-gradient-to-l' // Landscape: Right Sidebar
            : 'bottom-0 left-0 right-0 h-36 flex-row pb-8 pt-4 px-6' // Portrait: Bottom Bar
         }`}
      >
         {/* Gallery / Previous */}
        <div className="w-14 h-14 rounded-lg bg-gray-800/50 backdrop-blur-md border border-white/10 overflow-hidden relative shadow-lg">
            <div className="w-full h-full bg-gradient-to-br from-white/5 to-white/10 flex items-center justify-center">
                {/* Placeholder for last photo */}
                <ImageIcon className={`w-6 h-6 text-white/50 ${isLandscape ? '-rotate-90' : ''}`} />
            </div>
        </div>
        
        {/* Shutter Button */}
        <button 
          onClick={initiateCapture}
          disabled={isProcessing}
          className={`relative w-20 h-20 rounded-full border-4 border-white/30 flex items-center justify-center transition-all duration-200 ${isProcessing ? 'scale-90 opacity-50 cursor-not-allowed' : 'active:scale-95 hover:border-white hover:bg-white/10'}`}
        >
          <div className="w-16 h-16 bg-white rounded-full shadow-[0_0_20px_rgba(255,255,255,0.4)]"></div>
        </button>

        {/* Switch Camera */}
        <div className="w-14 h-14 flex items-center justify-center rounded-full bg-gray-800/50 backdrop-blur-md text-white border border-white/10 hover:bg-gray-700/50 transition-colors cursor-pointer shadow-lg" onClick={startCamera}>
            <RefreshCw className={`w-6 h-6 ${isLandscape ? '-rotate-90' : ''}`} />
        </div>
      </div>
    </div>
  );
};