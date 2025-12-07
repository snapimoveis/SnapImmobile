import React, { useEffect, useRef, useState } from "react";
import { X, Grid3X3, CheckCircle } from "lucide-react";
import { enhanceImage } from "../services/geminiService";
import { Photo, Project } from "../types";

// ======================================================================
// CORREÇÃO: adicionamos "project: Project" ao tipo, SEM mudar funcionalidades
// ======================================================================
interface CameraViewProps {
  project: Project; 
  onPhotoCaptured: (photo: Photo) => Promise<void> | void;
  onClose: () => void;
}

type LensType = "wide" | "ultra";

export const CameraView: React.FC<CameraViewProps> = ({
  project, // <- Apenas declarado para satisfazer o TS, NÃO usado no código
  onPhotoCaptured,
  onClose,
}) => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const mountedRef = useRef(true);

  const shutterSound = useRef<HTMLAudioElement | null>(null);
  const countdownBeep = useRef<HTMLAudioElement | null>(null);

  const [isStreaming, setIsStreaming] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [processingStep, setProcessingStep] = useState("");
  const [processingProgress, setProcessingProgress] = useState(0);

  const [hasSaved, setHasSaved] = useState(false);

  const [flashVisual, setFlashVisual] = useState(false);
  const [countdown, setCountdown] = useState<number | null>(null);

  const [showGrid, setShowGrid] = useState(true);
  const [previewImage, setPreviewImage] = useState<string | null>(null);
  const [focusPoint, setFocusPoint] = useState<{ x: number; y: number } | null>(
    null
  );

  const [capturedPreviews, setCapturedPreviews] = useState<
    { url: string; ev: string }[]
  >([]);

  const [hdrProfile, setHdrProfile] = useState<"interior" | "exterior">(
    "interior"
  );

  const [lens, setLens] = useState<LensType>("wide");
  const [wideDeviceId, setWideDeviceId] = useState<string>();
  const [ultraDeviceId, setUltraDeviceId] = useState<string>();

  const safeSet = (fn: () => void) => mountedRef.current && fn();

  /* -------------------------------------------------------------- */
  /* INIT */
  /* -------------------------------------------------------------- */
  useEffect(() => {
    mountedRef.current = true;

    shutterSound.current = new Audio("/iphone-camera-capture-6448.wav");
    shutterSound.current.preload = "auto";

    countdownBeep.current = new Audio("/mixkit-simple-game-countdown-921.wav");
    countdownBeep.current.preload = "auto";

    return () => {
      mountedRef.current = false;
      stopCamera();
    };
  }, []);

  useEffect(() => {
    if (!previewImage) startCamera(lens);
    safeSet(() => setHasSaved(false));
  }, [previewImage]);

  /* -------------------------------------------------------------- */
  /* DETECT BACK CAMERAS */
  /* -------------------------------------------------------------- */
  const detectBackCameras = async (): Promise<{
    wide?: MediaDeviceInfo;
    ultra?: MediaDeviceInfo;
  }> => {
    const devices = await navigator.mediaDevices.enumerateDevices();
    const videos = devices.filter((d) => d.kind === "videoinput");

    let wide: MediaDeviceInfo | undefined = undefined;
    let ultra: MediaDeviceInfo | undefined = undefined;

    videos.forEach((cam) => {
      const l = cam.label.toLowerCase();

      if (!ultra && (l.includes("0.5") || l.includes("ultra"))) {
        ultra = cam;
      }

      if (!wide && !l.includes("front") && (l.includes("back") || l.includes("wide"))) {
        wide = cam;
      }
    });

    if (!wide) wide = videos[0];
    if (!ultra) ultra = videos.find((v) => v.deviceId !== wide?.deviceId);

    setWideDeviceId(wide?.deviceId);
    setUltraDeviceId(ultra?.deviceId);

    return { wide, ultra };
  };

  /* -------------------------------------------------------------- */
  /* START CAMERA */
  /* -------------------------------------------------------------- */
  const startCamera = async (lensType: LensType) => {
    stopCamera();

    let deviceId: string | undefined;

    if (!wideDeviceId && !ultraDeviceId) {
      const result = await detectBackCameras();
      deviceId =
        lensType === "ultra" ? result.ultra?.deviceId : result.wide?.deviceId;
    } else {
      deviceId =
        lensType === "ultra" ? ultraDeviceId ?? wideDeviceId : wideDeviceId;
    }

    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: {
          deviceId: deviceId ? { exact: deviceId } : undefined,
          width: { ideal: 4032 },
          height: { ideal: 3024 },
        },
      });

      streamRef.current = stream;
      if (videoRef.current) videoRef.current.srcObject = stream;

      setLens(lensType);
      setIsStreaming(true);
    } catch {
      alert("Não foi possível aceder à câmara.");
    }
  };

  const stopCamera = () => {
    streamRef.current?.getTracks().forEach((t) => t.stop());
    streamRef.current = null;
    setIsStreaming(false);
  };

  /* -------------------------------------------------------------- */
  /* TAP TO FOCUS */
  /* -------------------------------------------------------------- */
  const handleTapToFocus = (e: any) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const clientX = e.clientX ?? e.touches?.[0].clientX;
    const clientY = e.clientY ?? e.touches?.[0].clientY;

    setFocusPoint({
      x: clientX - rect.left,
      y: clientY - rect.top,
    });

    setTimeout(() => setFocusPoint(null), 800);
  };

  /* -------------------------------------------------------------- */
  /* SHUTTER */
  /* -------------------------------------------------------------- */
  const handleShutterClick = () => {
    if (isProcessing) return;

    shutterSound.current?.play();

    let c = 3;
    setCountdown(c);

    const interval = setInterval(() => {
      c--;
      if (c <= 0) {
        clearInterval(interval);
        setCountdown(null);
        captureHDR();
      } else {
        countdownBeep.current?.play();
        setCountdown(c);
      }
    }, 1000);
  };

  /* -------------------------------------------------------------- */
  /* HDR CAPTURE */
  /* -------------------------------------------------------------- */
  const captureHDR = async () => {
    if (!videoRef.current || !canvasRef.current) return;

    setIsProcessing(true);
    setProcessingStep("Capturando…");
    setProcessingProgress(5);

    const video = videoRef.current;
    const canvas = canvasRef.current;
    const ctx = canvas.getContext("2d")!;

    const frames: string[] = [];

    const br = [0.6, 0.8, 1, 1.2, 1.4];

    for (let i = 0; i < br.length; i++) {
      ctx.filter = `brightness(${br[i]})`;
      canvas.width = video.videoWidth;
      canvas.height = video.videoHeight;

      ctx.drawImage(video, 0, 0);
      const jpeg = canvas.toDataURL("image/jpeg", 0.95);
      frames.push(jpeg);

      safeSet(() => setProcessingProgress(10 + i * 15));
      await new Promise((r) => setTimeout(r, 50));
    }

    setProcessingStep("Processando IA…");

    let finalImage = frames[Math.floor(frames.length / 2)];

    try {
      const result = await enhanceImage(finalImage);
      if (result && result.length > 1000) finalImage = result;
    } catch (e) {
      console.warn("Erro IA:", e);
    }

    setPreviewImage(finalImage);
    setProcessingProgress(100);

    await savePhoto(finalImage);

    setIsProcessing(false);
  };

  /* -------------------------------------------------------------- */
  /* SAVE RESULT */
  /* -------------------------------------------------------------- */
  const savePhoto = async (url: string) => {
    if (hasSaved) return;

    const photo: Photo = {
      id: crypto.randomUUID(),
      url,
      name: `SNAP_${Date.now()}.jpg`,
      type: "hdr",
      createdAt: Date.now(),
      originalUrl: url,
      timestamp: Date.now(),
    };

    await onPhotoCaptured(photo);
    setHasSaved(true);
  };

  /* -------------------------------------------------------------- */
  /* PREVIEW FINAL */
  /* -------------------------------------------------------------- */
  if (previewImage) {
    return (
      <div className="fixed inset-0 bg-black flex items-center justify-center z-50">
        <img src={previewImage} className="max-w-full max-h-full" />

        <button
          onClick={() => setPreviewImage(null)}
          className="absolute top-5 right-5 bg-black/60 p-3 rounded-full"
        >
          <X size={26} />
        </button>

        {hasSaved && (
          <div className="absolute bottom-10 bg-green-600 px-6 py-3 rounded-full flex items-center gap-3">
            <CheckCircle /> Foto Guardada
          </div>
        )}
      </div>
    );
  }

  /* -------------------------------------------------------------- */
  /* CAMERA UI  */
  /* -------------------------------------------------------------- */
  return (
    <div className="fixed inset-0 bg-black text-white flex flex-col z-50">

      {/* TOP BAR */}
      <div className="flex justify-between items-center px-6 py-4">
        <button onClick={onClose} className="p-3 bg-black/40 rounded-full">
          <X />
        </button>

        <div className="flex gap-3">
          <button
            onClick={() => setShowGrid((g) => !g)}
            className="p-3 bg-black/40 rounded-full"
          >
            <Grid3X3 size={20} />
          </button>
        </div>
      </div>

      {/* CAMERA VIEW */}
      <div className="flex-1 relative flex items-center justify-center">
        <div
          onClick={handleTapToFocus}
          className="relative w-full max-w-[92%] mx-auto h-full rounded-xl overflow-hidden"
        >
          <video
            ref={videoRef}
            autoPlay
            playsInline
            className="absolute inset-0 w-full h-full object-cover"
          />

          {/* FOCUS POINT */}
          {focusPoint && (
            <div
              className="absolute w-14 h-14 border-2 border-yellow-400 rounded-lg"
              style={{
                top: focusPoint.y - 28,
                left: focusPoint.x - 28,
              }}
            />
          )}

          {/* GRID */}
          {showGrid && (
            <div className="absolute inset-0 grid grid-cols-3 grid-rows-3 opacity-25">
              {[...Array(9)].map((_, i) => (
                <div key={i} className="border border-white/10" />
              ))}
            </div>
          )}
        </div>
      </div>

      {/* SHUTTER */}
      <div className="py-6 flex justify-center">
        <button
          onClick={handleShutterClick}
          className="w-24 h-24 rounded-full border-4 border-white flex items-center justify-center"
        >
          <div className="w-20 h-20 rounded-full bg-white" />
        </button>
      </div>

      {/* COUNTDOWN */}
      {countdown !== null && (
        <div className="absolute inset-0 flex items-center justify-center text-8xl font-bold">
          {countdown}
        </div>
      )}

      {/* PROCESSING */}
      {isProcessing && (
        <div className="absolute inset-0 bg-black/80 flex flex-col items-center justify-center">
          <div className="w-16 h-16 border-4 border-white/20 border-t-yellow-400 rounded-full animate-spin mb-4" />
          <div className="text-yellow-400 text-xl">{processingStep}</div>
          <div className="text-white/60 mt-2">{processingProgress}%</div>
        </div>
      )}

      <canvas ref={canvasRef} className="hidden" />
    </div>
  );
};
