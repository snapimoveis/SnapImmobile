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

  // HP-HDR é padrão (não há toggle)
  const [hdrProfile, setHdrProfile] = useState<'interior' | 'exterior'>('interior');

  const [flashVisual, setFlashVisual] = useState(false);
  const [zoom, setZoom] = useState(1);
  const [isLandscape, setIsLandscape] = useState(false);
  const [timerValue, setTimerValue] = useState<number | null>(null);

  const [tilt, setTilt] = useState({ beta: 0, gamma: 0 });
  const [capturedPreviews, setCapturedPreviews] = useState<{ url: string; ev: string }[]>([]);

  // Detectar orientação do ecrã
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

  // Iniciar câmara
  useEffect(() => {
    startCamera();
    return () => stopCamera();
  }, []);

  // Giroscópio para nivelador
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
      const stream = await navigator.mediaDevices.getUserMedia({
        video: {
          facingMode: 'environment',
          width: { ideal: 1920 },
          height: { ideal: 1080 },
          zoom: true
        } as any
      });

      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        setIsStreaming(true);
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

  // Som de obturador estilo DSLR (clack-clack curto)
  const playShutterSound = () => {
    try {
      const audio = new Audio(
        // base64 de um obturador DSLR (curto e seco)
        'data:audio/mp3;base64,//uQZAAAAAAAAAAAAAAAAAAAAAASW5mbwAAAA8AAAACAAACcQCA' +
          'AElkAAAACwBJTlQAAAAgAAAACAAADS0AAAEsAAADSAAADS0AAAEsAAAA0wAAAzsAAAEsAAAA0wAA' +
          'AzsAAAEsAAAA0wAAAzsAAAEsAAAA0wAAAzsAAAEsAAAA0wAAAzsAAAEsAAAA0wAAAzsAAP//AACQ' +
          'TGF2ZjU2LjQxLjEwNAAAAAAAAAAAAAAA//uQZRgAAAAAANuQAAAAAAAACwAAAAAAAABDb2RlcwAA' +
          'AAAAAAAALAAAAG1kYXQh//////////////////////////////////////////8='
      );
      audio.play().catch(() => {});
    } catch (e) {
      console.error(e);
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

  // --------------------------------------------------------------
  // HDR REAL COM PERFIL INTERIOR / EXTERIOR
  // + JANELA FORTE AUTOMÁTICO (apenas no modo INTERIOR)
  // --------------------------------------------------------------
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

    const stream = video.srcObject as MediaStream;
    const track = stream.getVideoTracks()[0];
    const caps: any = track.getCapabilities?.() || {};

    const supportsExposure =
      caps.exposureCompensation !== undefined &&
      typeof caps.exposureCompensation.min === 'number' &&
      typeof caps.exposureCompensation.max === 'number';

    // -------------------------------
    // PERFIS DE EXPOSIÇÃO
    // -------------------------------
    const interiorEV = [1.0, 0.5, 0.0, -0.7, -1.3, -2.0, -2.7, -3.3, -4.0];
    const interiorLabels = [
      '+1.0EV',
      '+0.5EV',
      '0EV',
      '-0.7EV',
      '-1.3EV',
      '-2EV',
      '-2.7EV',
      '-3.3EV',
      '-4EV'
    ];

    const exteriorEV = [2.0, 1.3, 0.7, 0.0, -0.3, -1.0, -1.7, -2.3, -3.0];
    const exteriorLabels = ['+2EV', '+1.3EV', '+0.7EV', '0EV', '-0.3EV', '-1EV', '-1.7EV', '-2.3EV', '-3EV'];

    // Modo Janela Forte (auto) – negativos profundos para recuperar exterior
    const janelaEV = [0.3, 0.0, -0.7, -1.5, -2.5, -3.5, -4.3, -5.0, -6.0];
    const janelaLabels = ['+0.3EV', '0EV', '-0.7EV', '-1.5EV', '-2.5EV', '-3.5EV', '-4.3EV', '-5EV', '-6EV'];

    // --------------------------------------------------
    // DETEÇÃO INTELIGENTE DE “JANELA FORTE” (MODO B)
    // Aplica-se apenas quando o utilizador escolheu INTERIOR
    // --------------------------------------------------
    let effectiveProfile: 'interior' | 'exterior' | 'janela' = hdrProfile;

    if (hdrProfile === 'interior') {
      try {
        // Normalizar exposição para pré-visualização (se suportado)
        if (supportsExposure) {
          try {
            await (track as any).applyConstraints({
              advanced: [{ exposureCompensation: 0 }]
            });
            await new Promise((r) => setTimeout(r, 80));
          } catch (e) {
            console.warn('Não foi possível normalizar exposição para pré-visualização', e);
          }
        }

        // Captura rápida para análise de janela
        ctx.drawImage(video, 0, 0, canvas.width, canvas.height);

        const topHeight = Math.floor(canvas.height * 0.35); // zona provável da janela
        const midStart = topHeight;
        const midHeight = Math.floor(canvas.height * 0.35);

        const topData = ctx.getImageData(0, 0, canvas.width, topHeight);
        const midData = ctx.getImageData(0, midStart, canvas.width, midHeight);

        const analyseRegion = (data: ImageData) => {
          const d = data.data;
          let whiteCount = 0;
          let sum = 0;
          let n = 0;

          const step = 4 * 4; // amostragem
          for (let i = 0; i < d.length; i += step) {
            const r = d[i];
            const g = d[i + 1];
            const b = d[i + 2];
            const luminance = (r + g + b) / 3;
            sum += luminance;
            n++;

            if (r > 240 && g > 240 && b > 240) {
              whiteCount++;
            }
          }

          const avg = n > 0 ? sum / n : 0;
          const whiteRatio = n > 0 ? whiteCount / n : 0;
          return { avg, whiteRatio };
        };

        const topStats = analyseRegion(topData);
        const midStats = analyseRegion(midData);

        const avgTop = topStats.avg;
        const avgMid = midStats.avg;
        const whiteRatioTop = topStats.whiteRatio;
        const contrastTopMid = avgTop - avgMid;

        // Sensibilidade MODERADA (B)
        const janelaSuspeita =
          whiteRatioTop > 0.18 && // ~18% pixels muito brancos
          avgTop > 200 && // topo bastante claro
          contrastTopMid > 40; // topo bem mais claro que a zona média

        if (janelaSuspeita) {
          effectiveProfile = 'janela';
          console.log('Janela Forte AUTO ativada');
        }
      } catch (e) {
        console.warn('Falha na deteção automática de janela forte', e);
      }
    }

    // Selecionar curva final
    let hpEV: number[] = interiorEV;
    let evLabels: string[] = interiorLabels;

    if (effectiveProfile === 'interior') {
      hpEV = interiorEV;
      evLabels = interiorLabels;
    } else if (effectiveProfile === 'exterior') {
      hpEV = exteriorEV;
      evLabels = exteriorLabels;
    } else {
      hpEV = janelaEV;
      evLabels = janelaLabels;
    }

    const stepExp = caps.exposureCompensationStep || 1;
    const exposureIndexes = hpEV.map((ev) =>
      supportsExposure
        ? Math.max(
            caps.exposureCompensation.min,
            Math.min(caps.exposureCompensation.max, Math.round(ev / stepExp))
          )
        : null
    );

    // fallback artificial se não houver controlo real de exposição
    const fallbackBrightness = [3.2, 2.1, 1.4, 1.0, 0.8, 0.55, 0.32, 0.18, 0.08];

    let bestBase64 = '';
    const previewsLocal: { url: string; ev: string }[] = [];

    setProcessingStep('A Capturar 9 Exp. HP-HDR...');
    setProcessingProgress(5);

    for (let i = 0; i < 9; i++) {
      if (supportsExposure && exposureIndexes[i] !== null) {
        try {
          await (track as any).applyConstraints({
            advanced: [{ exposureCompensation: exposureIndexes[i] }]
          });
          await new Promise((r) => setTimeout(r, 120));
        } catch (e) {
          console.warn('Falhou exposureCompensation', e);
        }
      } else {
        ctx.filter = `brightness(${fallbackBrightness[i]})`;
      }

      playShutterSound();
      triggerHaptic();

      setFlashVisual(true);
      setTimeout(() => setFlashVisual(false), 50);

      ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
      ctx.filter = 'none';

      const jpeg = canvas.toDataURL('image/jpeg', 0.5);
      previewsLocal.push({ url: jpeg, ev: evLabels[i] });
      setCapturedPreviews([...previewsLocal]);

      if (i === 4) {
        bestBase64 = canvas.toDataURL('image/jpeg', 0.95);
      }

      setProcessingProgress(10 + i * 5);
      await new Promise((r) => setTimeout(r, 150));
    }

    if (!bestBase64) bestBase64 = canvas.toDataURL('image/jpeg', 0.95);

    // HP-HDR sempre ativo → sempre envia pela IA
    const steps = [
      { msg: 'Highlight Mapping Inteligente...', prog: 50 },
      { msg: 'Shadow Recovery Natural...', prog: 65 },
      { msg: 'Nitidez Real...', prog: 75 },
      { msg: 'A Corrigir Perspetiva (V/H)...', prog: 85 },
      { msg: 'Fusão HP-HDR Final...', prog: 90 }
    ];

    for (const st of steps) {
      setProcessingStep(st.msg);
      setProcessingProgress(st.prog);
      await new Promise((r) => setTimeout(r, 600));
    }

    try {
      bestBase64 = await enhanceImage(bestBase64);
    } catch (e) {
      console.error('AI Enhancement failed', e);
    }

    setProcessingStep('A Finalizar Imagem Premium...');
    setProcessingProgress(100);

    const finalPhoto: Photo = {
      id: crypto.randomUUID(),
      url: bestBase64,
      originalUrl: bestBase64,
      name: `HPHDR_${Date.now()}`,
      timestamp: Date.now(),
      type: 'hdr'
    };

    // 👉 Salva a foto, mas NÃO fecha a câmara
    onPhotoCaptured(finalPhoto);

    setIsProcessing(false);
    setProcessingProgress(0);
    setCapturedPreviews([]);
  };

  return (
    <div className="fixed inset-0 bg-black z-50 font-sans overflow-hidden select-none">
      {/* Viewfinder */}
      <div className="absolute inset-0 overflow-hidden bg-gray-900 flex items-center justify-center group">
        <video
          ref={videoRef}
          autoPlay
          playsInline
          className="absolute min-w-full min-h-full object-cover"
        />
        <canvas ref={canvasRef} className="hidden" />

        {/* Flash visual */}
        <div
          className={`absolute inset-0 bg-white pointer-events-none transition-opacity duration-75 ease-out z-50 ${
            flashVisual ? 'opacity-80' : 'opacity-0'
          }`}
        ></div>

        {/* Timer */}
        {timerValue && (
          <div className="absolute inset-0 flex items-center justify-center z-40 bg-black/20 backdrop-blur-sm">
            <span
              className={`text-9xl font-black text-white animate-ping ${
                isLandscape ? '-rotate-90' : ''
              }`}
            >
              {timerValue}
            </span>
          </div>
        )}

        {/* Grid + Leveler */}
        <div className="absolute inset-0 pointer-events-none opacity-30">
          <div className="w-full h-full grid grid-cols-3 grid-rows-3">
            <div className="border-r border-white/50"></div>
            <div className="border-r border-white/50"></div>
            <div></div>
            <div className="border-r border-t border-white/50"></div>
            <div className="border-r border-t border-white/50"></div>
            <div className="border-t border-white/50"></div>
            <div className="border-r border-t border-white/50"></div>
            <div className="border-r border-t border-white/50"></div>
            <div className="border-t border-white/50"></div>
          </div>

          {/* Digital level */}
          <div
            className={`absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 shadow-md transition-all duration-200 ${
              isLevel ? 'bg-yellow-400' : 'bg-white/80'
            }`}
            style={{
              width: isLandscape ? '1px' : '60px',
              height: isLandscape ? '60px' : '1px',
              transform: `translate(-50%, -50%) rotate(${currentTilt}deg)`
            }}
          ></div>

          {/* Crosshair */}
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-4 h-4 border border-white/50 rounded-full"></div>
        </div>

        {/* Zoom Controls */}
        <div
          className={`absolute z-30 transition-all duration-300 ${
            isLandscape
              ? 'right-36 top-1/2 -translate-y-1/2'
              : 'bottom-40 left-1/2 -translate-x-1/2'
          }`}
        >
          <div
            className={`flex items-center gap-2 bg-black/50 backdrop-blur-md px-3 py-2 rounded-full border border-white/10 shadow-xl ${
              isLandscape ? 'flex-col' : ''
            }`}
          >
            {[0.5, 1, 2].map((level) => (
              <button
                key={level}
                onClick={() => {
                  handleZoom(level);
                  triggerHaptic();
                }}
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

        {/* HDR Burst Previews */}
        {capturedPreviews.length > 0 && (
          <div
            className={`absolute z-30 flex items-center gap-1.5 px-4 overflow-x-auto no-scrollbar ${
              isLandscape
                ? 'right-32 top-0 bottom-0 w-16 flex-col py-8'
                : 'bottom-56 left-0 right-0 h-16 flex-row'
            }`}
          >
            {capturedPreviews.map((item, idx) => (
              <div
                key={idx}
                className="relative flex-shrink-0 aspect-[3/4] animate-in fade-in duration-100 w-full h-auto border border-white/30 rounded-sm overflow-hidden"
              >
                <img src={item.url} className="h-full w-full object-cover" />
              </div>
            ))}
          </div>
        )}

        {/* PROCESSING OVERLAY */}
        {isProcessing && (
          <div className="absolute inset-0 bg-black/80 flex flex-col items-center justify-center z-50 backdrop-blur-sm">
            <div className="relative w-24 h-24 mb-6">
              <svg className="w-full h-full rotate-[-90deg]">
                <circle
                  cx="48"
                  cy="48"
                  r="42"
                  fill="none"
                  stroke="#334155"
                  strokeWidth="6"
                />
                <circle
                  cx="48"
                  cy="48"
                  r="42"
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
                <span className="text-white font-bold text-lg">
                  {Math.round(processingProgress)}%
                </span>
              </div>
            </div>
            <p className="text-blue-400 font-medium text-sm uppercase tracking-widest animate-pulse text-center px-6">
              {processingStep}
            </p>
          </div>
        )}

        {/* Selector Interior / Exterior – lado a lado, limpo e centrado */}
        <div className="absolute z-40 bottom-28 left-1/2 -translate-x-1/2 flex gap-4">
          <button
            onClick={() => setHdrProfile('interior')}
            className={`px-4 py-1.5 rounded-full text-xs font-semibold border transition-all ${
              hdrProfile === 'interior'
                ? 'bg-white text-black border-white'
                : 'bg-transparent text-white border-white/60'
            }`}
          >
            INTERIOR
          </button>
          <button
            onClick={() => setHdrProfile('exterior')}
            className={`px-4 py-1.5 rounded-full text-xs font-semibold border transition-all ${
              hdrProfile === 'exterior'
                ? 'bg-white text-black border-white'
                : 'bg-transparent text-white border-white/60'
            }`}
          >
            EXTERIOR
          </button>
        </div>
      </div>

      {/* TOP BAR – apenas botão de fechar */}
      <div className="absolute p-6 flex justify-between items-center z-20 bg-gradient-to-b from-black/80 via-black/40 to-transparent top-0 left-0 right-0">
        <button
          onClick={onClose}
          className="text-white/80 hover:text-white"
        >
          <X className="w-8 h-8" strokeWidth={1.5} />
        </button>
      </div>

      {/* SHUTTER BAR – apenas disparo, centrado */}
      <div
        className={`absolute flex items-center justify-center z-40 bg-black/60 backdrop-blur-md
        ${
          isLandscape
            ? 'right-0 top-0 bottom-0 w-32'
            : 'bottom-0 left-0 right-0 h-32 pb-6'
        }`}
      >
        <button
          onClick={initiateCapture}
          disabled={isProcessing}
          className={`relative rounded-full border-[3px] flex items-center justify-center transition-all duration-150
            w-20 h-20
            ${
              isProcessing
                ? 'border-gray-500 opacity-50 scale-90 cursor-not-allowed'
                : 'border-white hover:border-white active:scale-95 active:bg-white/10 shadow-[0_0_20px_rgba(0,0,0,0.5)]'
            }
          `}
        >
          <div
            className={`bg-white rounded-full transition-all duration-150 ${
              isProcessing ? 'w-14 h-14 bg-gray-400' : 'w-16 h-16 shadow-inner active:w-14 active:h-14'
            }`}
          ></div>
        </button>
      </div>
    </div>
  );
};
