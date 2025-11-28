import React, { useRef, useEffect, useState } from 'react';
import { X, Grid3X3 } from 'lucide-react';
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

  const [capturedPreviews, setCapturedPreviews] = useState<{ url: string; ev: string }[]>([]);

  // Detecção de Orientação Robusta
  useEffect(() => {
    const checkOrientation = () => {
      const isLand = window.innerWidth > window.innerHeight;
      setIsLandscape(isLand);
    };

    checkOrientation();
    window.addEventListener('resize', checkOrientation);
    return () => window.removeEventListener('resize', checkOrientation);
  }, []);

  useEffect(() => { startCamera(); return () => stopCamera(); }, []);

  const startCamera = async () => {
    try {
      // Solicitamos a maior resolução possível em 4:3 para evitar desfoque
      const constraints = {
        video: { 
            facingMode: 'environment', 
            aspectRatio: { exact: 1.333333 }, // Tenta forçar 4:3 exato
            width: { ideal: 4032 }, // 12MP
            height: { ideal: 3024 }
        }
      };

      // Fallback se a câmara não suportar 4K
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

  const initiateCapture = async () => {
    if (isProcessing) return;
    capturePhotoSequence();
  };

  const drawCroppedFrame = (video: HTMLVideoElement, canvas: HTMLCanvasElement, ctx: CanvasRenderingContext2D) => {
      // GARANTIA DE NITIDEZ: Usar as dimensões REAIS do vídeo, não do ecrã
      const videoWidth = video.videoWidth;
      const videoHeight = video.videoHeight;
      
      // Força crop 4:3 centrado
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
      
      // Configuração crítica para qualidade
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
        // Analisa apenas a parte de cima da imagem (teto/janelas)
        const topData = ctx.getImageData(0, 0, canvas.width, Math.floor(canvas.height * 0.35));
        let whites = 0;
        for (let i = 0; i < topData.data.length; i += 16) {
            if (topData.data[i] > 240) whites++;
        }
        if (whites / (topData.data.length/4) > 0.15) effectiveProfile = 'hp_hdr_window';
      } catch (e) {}
    }

    setProcessingStep('Capturando (9)...');
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

        // Qualidade máxima para o processamento
        const frameData = canvas.toDataURL('image/jpeg', 0.95);
        capturedBlobs.push(frameData);
        
        if (i % 2 === 0) setCapturedPreviews(prev => [...prev, { url: frameData, ev: `${evSequence[i]}` }]);
        setProcessingProgress(((i + 1) / 9) * 40);
        
        await new Promise(r => setTimeout(r, 80));
    }

    if (supportsEV) try { await track.applyConstraints({ advanced: [{ exposureCompensation: 0 }] } as any); } catch(e){}

    // 5 fotos críticas para a IA
    const indicesToUse = [0, 2, 4, 6, 8]; 
    const fusionPayload = indicesToUse.map(i => capturedBlobs[i]);

    setProcessingStep('Processando IA...');
    setProcessingProgress(50);

    try {
        const finalImage = await enhanceImage(fusionPayload, effectiveProfile);
        setProcessingStep('Concluído');
        setProcessingProgress(100);

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
    // Container Principal - Flex para gerir layout responsivo
    <div className="fixed inset-0 h-[100dvh] w-screen bg-black z-50 font-sans overflow-hidden select-none flex flex-col md:flex-row text-white touch-none">
      
      {/* === BARRA SUPERIOR/ESQUERDA (Ferramentas) === */}
      {/* Mobile: Barra Topo fina. Desktop: Barra Esquerda fina. */}
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

         {/* Espaço vazio para equilíbrio em landscape */}
         {isLandscape && <div className="w-6 h-6"></div>}
      </div>


      {/* === VISOR CENTRAL (4:3 IMUTÁVEL) === */}
      <div className="flex-1 relative bg-[#050505] overflow-hidden flex items-center justify-center p-2">
        {/* O Video Container mantém 4:3 estrito */}
        <div className="relative w-full max-w-full aspect-[3/4] md:aspect-[4/3] overflow-hidden bg-black shadow-2xl rounded-lg md:rounded-none">
            <video ref={videoRef} autoPlay playsInline className="absolute inset-0 w-full h-full object-cover" />
            <canvas ref={canvasRef} className="hidden" />
            
            {/* Flash */}
            <div className={`absolute inset-0 bg-white transition-opacity duration-75 pointer-events-none ${flashVisual ? 'opacity-80' : 'opacity-0'}`} />

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

            {/* OVERLAYS DE INTERFACE (Dentro da foto) */}
            
            {/* 1. Botões Interior/Exterior (Fundo Centro) */}
            <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex gap-6 z-20 pointer-events-auto">
                 <button onClick={() => setHdrProfile('interior')} 
                    className={`text-xs font-bold tracking-widest transition-all px-3 py-1.5 rounded-full shadow-sm ${hdrProfile === 'interior' ? 'bg-yellow-400 text-black' : 'bg-black/40 text-white/90 backdrop-blur-sm'}`}>
                    INTERIOR
                </button>
                <button onClick={() => setHdrProfile('exterior')} 
                    className={`text-xs font-bold tracking-widest transition-all px-3 py-1.5 rounded-full shadow-sm ${hdrProfile === 'exterior' ? 'bg-yellow-400 text-black' : 'bg-black/40 text-white/90 backdrop-blur-sm'}`}>
                    EXTERIOR
                </button>
            </div>

            {/* 2. Botões Zoom (Canto Direito ou Inferior dependendo da orientação, perto do polegar) */}
            {/* Em Landscape, ficam à direita, perto da barra de disparo. Em Portrait, em baixo. */}
            <div className={`absolute z-20 flex gap-3 p-1 bg-black/20 backdrop-blur-md rounded-full
                ${isLandscape 
                    ? 'right-4 top-1/2 -translate-y-1/2 flex-col' 
                    : 'bottom-16 left-1/2 -translate-x-1/2 flex-row'
                }`}>
                <button onClick={() => handleZoom(1)} className={`w-10 h-10 rounded-full flex items-center justify-center font-bold text-sm transition-all ${zoom === 1 ? 'bg-yellow-400 text-black shadow-lg scale-110' : 'text-white hover:bg-white/20'}`}>1x</button>
                <button onClick={() => handleZoom(0.5)} className={`w-10 h-10 rounded-full flex items-center justify-center font-bold text-sm transition-all ${zoom === 0.5 ? 'bg-yellow-400 text-black shadow-lg scale-110' : 'text-white hover:bg-white/20'}`}>.5</button>
            </div>

            {/* Timer Display */}
            {timerValue && (
              <div className="absolute inset-0 bg-black/30 flex items-center justify-center z-40">
                <span className={`text-8xl font-extrabold text-white animate-ping ${isLandscape ? '-rotate-90' : ''}`}>{timerValue}</span>
              </div>
            )}
        </div>
      </div>


      {/* === BARRA INFERIOR/DIREITA (Disparo) - Maior === */}
      {/* Mobile: Barra Fundo Alta. Desktop: Barra Direita Larga. */}
      <div className={`bg-black z-30 flex items-center justify-center relative
        ${isLandscape 
            ? 'flex-col w-32 h-full border-l border-white/10' 
            : 'flex-row h-36 w-full border-t border-white/10 pb-6'
        }`}>
        
        {/* Botão Disparo */}
        <button 
            onClick={initiateCapture} 
            disabled={isProcessing} 
            className="relative w-20 h-20 rounded-full border-[4px] border-white flex items-center justify-center transition-transform active:scale-95 shadow-[0_0_30px_rgba(255,255,255,0.15)]"
        >
            <div className={`w-[68px] h-[68px] rounded-full bg-white transition-all duration-200 ${isProcessing ? 'scale-75 bg-gray-400' : ''}`} />
        </button>
      </div>

      {/* Processing Overlay */}
      {isProcessing && (
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
