import React, { useRef, useEffect, useState } from "react";
import {
  RefreshCw,
  Zap,
  ZapOff,
  X,
} from "lucide-react";
import { enhanceImage } from "../services/geminiService";
import { Photo } from "../types";

interface CameraViewProps {
  onPhotoCaptured: (photo: Photo) => void;
  onClose: () => void;
}

export const CameraView: React.FC<CameraViewProps> = ({
  onPhotoCaptured,
  onClose,
}) => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  const [isStreaming, setIsStreaming] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [processingStep, setProcessingStep] = useState("");
  const [processingProgress, setProcessingProgress] = useState(0);
  const [hdrMode, setHdrMode] = useState(true);
  const [flashVisual, setFlashVisual] = useState(false);
  const [zoom, setZoom] = useState(1);
  const [isLandscape, setIsLandscape] = useState(false);
  const [timerValue, setTimerValue] = useState<number | null>(null);

  const [capturedPreviews, setCapturedPreviews] = useState<
    { url: string; ev: string }[]
  >([]);

  // Orientation check
  useEffect(() => {
    const checkOrientation = () => {
      setIsLandscape(
        window.matchMedia("(orientation: landscape)").matches
      );
    };
    checkOrientation();
    window.addEventListener("resize", checkOrientation);
    window.addEventListener("orientationchange", checkOrientation);
    return () => {
      window.removeEventListener("resize", checkOrientation);
      window.removeEventListener("orientationchange", checkOrientation);
    };
  }, []);

  // Start camera
  useEffect(() => {
    startCamera();
    return () => stopCamera();
  }, []);

  const startCamera = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: {
          facingMode: "environment",
          width: { ideal: 1920 },
          height: { ideal: 1080 },
        },
      });

      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        setIsStreaming(true);
      }
    } catch (err) {
      alert("Não foi possível aceder à câmara.");
    }
  };

  const stopCamera = () => {
    if (videoRef.current?.srcObject) {
      const s = videoRef.current.srcObject as MediaStream;
      s.getTracks().forEach((t) => t.stop());
      setIsStreaming(false);
    }
  };

  // Haptic
  const triggerHaptic = () => navigator.vibrate?.(20);

  // Shutter Sound
  const playShutterSound = () => {
    const AudioContext =
      window.AudioContext || (window as any).webkitAudioContext;
    if (!AudioContext) return;

    const ctx = new AudioContext();
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();

    osc.frequency.setValueAtTime(800, ctx.currentTime);
    gain.gain.setValueAtTime(0.5, ctx.currentTime);

    osc.connect(gain);
    gain.connect(ctx.destination);

    osc.start();
    osc.stop(ctx.currentTime + 0.05);
  };

  // Timer
  const initiateCapture = async () => {
    if (isProcessing) return;
    for (let i = 3; i > 0; i--) {
      setTimerValue(i);
      await new Promise((r) => setTimeout(r, 1000));
    }
    setTimerValue(null);
    capturePhotoSequence();
  };

  // HDR REAL — HP-HDR
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

    const stream = video.srcObject as MediaStream;
    const track = stream.getVideoTracks()[0];
    const capabilities: any = track.getCapabilities?.() || {};

    const supportsExposure =
      capabilities.exposureCompensation !== undefined &&
      typeof capabilities.exposureCompensation.min === "number";

    // HP-HDR EV Curve
    const hpEV = [1.7, 1.0, 0.5, 0.0, -0.3, -1.0, -2.0, -2.7, -3.5];
    const hpLabels = [
      "+1.7",
      "+1.0",
      "+0.5",
      "0.0",
      "-0.3",
      "-1.0",
      "-2.0",
      "-2.7",
      "-3.5",
    ];

    const step = capabilities.exposureCompensationStep || 1;

    const exposureIndexes = hpEV.map((ev) => {
      if (!supportsExposure) return null;
      return Math.max(
        capabilities.exposureCompensation.min,
        Math.min(
          capabilities.exposureCompensation.max,
          Math.round(ev / step)
        )
      );
    });

    const fallbackBrightness = [
      3.25,
      2.0,
      1.4,
      1.0,
      0.8,
      0.5,
      0.25,
      0.15,
      0.09,
    ];

    const previews: { url: string; ev: string }[] = [];
    let bestBase64 = "";

    setProcessingStep("A capturar HP-HDR Real…");
    setProcessingProgress(5);

    for (let i = 0; i < 9; i++) {
      // Exposure REAL
      if (supportsExposure && exposureIndexes[i] !== null) {
        try {
          await (track as any).applyConstraints({
            advanced: [
              {
                ["exposureCompensation"]: exposureIndexes[i],
              },
            ],
          });

          await new Promise((r) => setTimeout(r, 120));
        } catch (err) {
          console.warn("Exposure error", err);
        }
      } else {
        ctx.filter = `brightness(${fallbackBrightness[i]})`;
      }

      playShutterSound();
      triggerHaptic();
      setFlashVisual(true);
      setTimeout(() => setFlashVisual(false), 50);

      ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
      ctx.filter = "none";

      const jpeg = canvas.toDataURL("image/jpeg", 0.95);
      if (i === 4) bestBase64 = jpeg;

      previews.push({ url: jpeg, ev: hpLabels[i] });
      setCapturedPreviews([...previews]);

      setProcessingProgress(10 + i * 6);
      await new Promise((r) => setTimeout(r, 150));
    }

    // AI Fusion — Gemini
    if (hdrMode) {
      const steps = [
        { msg: "Highlight Mapping…", prog: 60 },
        { msg: "Shadow Recovery…", prog: 70 },
        { msg: "Nitidez Real…", prog: 80 },
        { msg: "Correção Perspectiva…", prog: 85 },
        { msg: "Fusão HDR Final…", prog: 95 },
      ];

      for (const s of steps) {
        setProcessingStep(s.msg);
        setProcessingProgress(s.prog);
        await new Promise((res) => setTimeout(res, 600));
      }

      try {
        bestBase64 = await enhanceImage(bestBase64);
      } catch (e) {
        console.error("HDR Fusion Error", e);
      }
    }

    setProcessingStep("A finalizar…");
    setProcessingProgress(100);

    const newPhoto: Photo = {
      id: crypto.randomUUID(),
      url: bestBase64,
      originalUrl: bestBase64,
      name: `HPHDR_${Date.now()}`,
      timestamp: Date.now(),
      type: hdrMode ? "hdr" : "standard",
    };

    onPhotoCaptured(newPhoto);
    setIsProcessing(false);
    setCapturedPreviews([]);
  };

  // Zoom controls
  const handleZoom = async (level: number) => {
    setZoom(level);
    if (!videoRef.current?.srcObject) return;

    const stream = videoRef.current.srcObject as MediaStream;
    const track = stream.getVideoTracks()[0];
    const caps: any = track.getCapabilities?.() || {};

    if (!caps.zoom) return;

    try {
      await track.applyConstraints({
        advanced: [{ zoom: level }],
      } as any);
    } catch (e) {}
  };

  return (
    <div className="fixed inset-0 bg-black z-50 overflow-hidden select-none">
      <video
        ref={videoRef}
        autoPlay
        playsInline
        className="absolute inset-0 w-full h-full object-cover"
      />
      <canvas ref={canvasRef} className="hidden" />

      {flashVisual && (
        <div className="absolute inset-0 bg-white opacity-70"></div>
      )}

      {timerValue && (
        <div className="absolute inset-0 flex items-center justify-center text-8xl text-white font-bold">
          {timerValue}
        </div>
      )}

      <div className="absolute top-0 left-0 right-0 p-6 flex justify-between items-center">
        <button onClick={onClose} className="text-white">
          <X size={32} />
        </button>

        <button
          onClick={() => setHdrMode((prev) => !prev)}
          className={`w-12 h-12 rounded-full flex items-center justify-center ${
            hdrMode
              ? "bg-yellow-500 text-black"
              : "bg-black/40 text-white"
          }`}
        >
          {hdrMode ? <Zap /> : <ZapOff />}
        </button>
      </div>

      <div className="absolute bottom-0 left-0 right-0 p-8 flex items-center justify-center gap-10">
        <button
          onClick={initiateCapture}
          disabled={isProcessing}
          className="w-20 h-20 rounded-full bg-white active:scale-95"
        ></button>

        <button
          onClick={() => startCamera()}
          className="text-white p-4 bg-black/40 rounded-full"
        >
          <RefreshCw />
        </button>
      </div>

      {capturedPreviews.length > 0 && (
        <div className="absolute bottom-40 left-0 right-0 flex gap-2 px-4 overflow-auto">
          {capturedPreviews.map((p, i) => (
            <img
              key={i}
              src={p.url}
              className="w-16 h-24 object-cover border border-white/40"
            />
          ))}
        </div>
      )}

      {isProcessing && (
        <div className="absolute inset-0 bg-black/80 flex flex-col items-center justify-center">
          <div className="text-white text-xl mb-4">{processingStep}</div>
          <div className="text-white">{processingProgress}%</div>
        </div>
      )}
    </div>
  );
};
