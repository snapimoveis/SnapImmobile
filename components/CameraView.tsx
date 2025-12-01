import React, { useEffect, useRef, useState } from "react";
import { X, Grid3X3, CheckCircle } from "lucide-react";
import { enhanceImage } from "../services/geminiService";
import { Photo } from "../types";

interface CameraViewProps {
  onPhotoCaptured: (photo: Photo) => Promise<void> | void;
  onClose: () => void;
}

type LensType = "wide" | "ultra";

export const CameraView: React.FC<CameraViewProps> = ({
  onPhotoCaptured,
  onClose,
}) => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const mountedRef = useRef(true);

  // Sons WAV
  const shutterSound = useRef<HTMLAudioElement | null>(null);
  const countdownBeep = useRef<HTMLAudioElement | null>(null);

  const safeSet = (fn: () => void) => mountedRef.current && fn();

  // Estado principal
  const [isStreaming, setIsStreaming] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [processingStep, setProcessingStep] = useState("");
  const [processingProgress, setProcessingProgress] = useState(0);
  const [hasSaved, setHasSaved] = useState(false);

  const [flashVisual, setFlashVisual] = useState(false);
  const [isLandscape, setIsLandscape] = useState(false);
  const [countdown, setCountdown] = useState<number | null>(null);

  const [showGrid, setShowGrid] = useState(true);
  const [previewImage, setPreviewImage] = useState<string | null>(null);
  const [focusPoint, setFocusPoint] = useState<{ x: number; y: number } | null>(
    null
  );
  const [capturedPreviews, setCapturedPreviews] = useState<
    { url: string; ev: string }[]
  >([]);

  const [showHoldSteady, setShowHoldSteady] = useState(false);
  const [hdrProfile, setHdrProfile] = useState<"interior" | "exterior">(
    "interior"
  );

  // Lentes corrigidas
  const [lens, setLens] = useState<LensType>("wide");
  const [wideDeviceId, setWideDeviceId] = useState<string | undefined>(
    undefined
  );
  const [ultraDeviceId, setUltraDeviceId] = useState<string | undefined>(
    undefined
  );

  // =====================================
  // INIT
  // =====================================
  useEffect(() => {
    mountedRef.current = true;

    // carregar sons WAV
    shutterSound.current = new Audio("/iphone-camera-capture-6448.wav");
    shutterSound.current.preload = "auto";

    countdownBeep.current = new Audio("/mixkit-simple-game-countdown-921.wav");
    countdownBeep.current.preload = "auto";

    const handleResize = () =>
      safeSet(() => setIsLandscape(window.innerWidth > window.innerHeight));

    handleResize();
    window.addEventListener("resize", handleResize);

    return () => {
      mountedRef.current = false;
      stopCamera();
      window.removeEventListener("resize", handleResize);
    };
  }, []);

  useEffect(() => {
    if (!previewImage) {
      startCamera(lens);
      safeSet(() => setHasSaved(false));
    }
  }, [previewImage]);

  // =====================================
  // DETECTAR CÂMERAS
  // =====================================
  const detectBackCameras = async () => {
    const devices = await navigator.mediaDevices.enumerateDevices();
    const videos = devices.filter((d) => d.kind === "videoinput");

    let wide: MediaDeviceInfo | undefined;
    let ultra: MediaDeviceInfo | undefined;

    videos.forEach((cam) => {
      const label = cam.label.toLowerCase();

      if (!ultra && (label.includes("0.5") || label.includes("ultra"))) {
        ultra = cam;
      }

      if (
        !wide &&
        !label.includes("front") &&
        (label.includes("back") ||
          label.includes("main") ||
          label.includes("wide") ||
          label.includes("1."))
      ) {
        wide = cam;
      }
    });

    if (!wide) wide = videos.find((v) => !v.label.includes("front"));
    if (!ultra) ultra = videos.find((v) => v.deviceId !== wide?.deviceId);

    setWideDeviceId(wide?.deviceId);
    setUltraDeviceId(ultra?.deviceId);

    return { wide, ultra };
  };

  // =====================================
  // START/STOP CAMERA
  // =====================================
  const startCamera = async (targetLens: LensType) => {
    stopCamera();

    let deviceId: string | undefined;

    if (!wideDeviceId && !ultraDeviceId) {
      const result = await detectBackCameras();
      deviceId =
        targetLens === "ultra"
          ? result?.ultra?.deviceId
          : result?.wide?.deviceId;
    } else {
      deviceId =
        targetLens === "ultra" ? ultraDeviceId || wideDeviceId : wideDeviceId;
    }

    const constraints: MediaStreamConstraints = {
      video: {
        deviceId: deviceId ? { exact: deviceId } : undefined,
        width: { ideal: 4032 },
        height: { ideal: 3024 },
        aspectRatio: { ideal: 4 / 3 },
      },
    };

    try {
      const stream = await navigator.mediaDevices.getUserMedia(constraints);
      streamRef.current = stream;

      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        videoRef.current.onloadedmetadata = () => safeSet(() => setIsStreaming(true));
      }

      setLens(targetLens);
    } catch (error) {
      console.error("Erro ao iniciar câmera:", error);
      alert("Não foi possível aceder à câmara.");
    }
  };

  const stopCamera = () => {
    streamRef.current?.getTracks().forEach((t) => t.stop());
    streamRef.current = null;
    if (videoRef.current) videoRef.current.srcObject = null;
    setIsStreaming(false);
  };

  // =====================================
  // TAP-TO-FOCUS (sem "focusMode" ilegal)
  // =====================================
  const handleTapToFocus = async (
    e: React.MouseEvent<HTMLDivElement> | React.TouchEvent<HTMLDivElement>
  ) => {
    if (!streamRef.current) return;

    const rect = e.currentTarget.getBoundingClientRect();

    const clientX = "touches" in e ? e.touches[0].clientX : (e as any).clientX;
    const clientY = "touches" in e ? e.touches[0].clientY : (e as any).clientY;

    const x = clientX - rect.left;
    const y = clientY - rect.top;

    setFocusPoint({ x, y });
    setTimeout(() => setFocusPoint(null), 1200);
  };

  // =====================================
  // SHUTTER
  // =====================================
  const handleShutterClick = () => {
    if (isProcessing) return;

    try {
      shutterSound.current?.play();
    } catch {}

    setShowHoldSteady(true);
    setTimeout(() => setShowHoldSteady(false), 1200);

    let c = 3;
    setCountdown(c);

    const timer = setInterval(() => {
      c--;
      if (c > 0) {
        countdownBeep.current?.play();
        setCountdown(c);
      } else {
        clearInterval(timer);
        setCountdown(null);
        captureHDR();
      }
    }, 1000);
  };

  // =====================================
  // CAPTURAR HDR
  // =====================================
  const captureHDR = async () => {
    if (!videoRef.current || !canvasRef.current) return;

    setIsProcessing(true);
    setProcessingStep("Capturando…");
    setCapturedPreviews([]);
    setProcessingProgress(5);

    const video = videoRef.current;
    const canvas = canvasRef.current;
    const ctx = canvas.getContext("2d")!;
    const frames: string[] = [];

    const brightnessSeq = [0.5, 0.7, 0.9, 1, 1.15, 1.3];

    for (let i = 0; i < brightnessSeq.length; i++) {
      ctx.filter = `brightness(${brightnessSeq[i]})`;
      canvas.width = video.videoWidth;
      canvas.height = video.videoHeight;
      ctx.drawImage(video, 0, 0);

      const jpeg = canvas.toDataURL("image/jpeg", 0.95);
      frames.push(jpeg);

      if (i % 2 === 0) {
        setCapturedPreviews((prev) => [...prev, { url: jpeg, ev: String(i) }]);
      }

      setProcessingProgress((i + 1) * 7);
      safeSet(() => setFlashVisual(true));
      await new Promise((r) => setTimeout(r, 60));
      safeSet(() => setFlashVisual(false));
    }

    setProcessingStep("Processando IA…");
    setProcessingProgress(75);

    let finalImage = frames[Math.floor(frames.length / 2)];

    try {
      const ai = await enhanceImage(frames);
      if (ai && ai.length > 1000) finalImage = ai;
    } catch (e) {
      console.warn("Falha IA:", e);
    }

    setPreviewImage(finalImage);
    setProcessingProgress(100);

    await savePhoto(finalImage);

    setIsProcessing(false);
  };

  // =====================================
  // SALVAR FOTO
  // =====================================
  const savePhoto = async (url: string) => {
    if (hasSaved) return;

    const newPhoto: Photo = {
      id: crypto.randomUUID(),
      url,
      name: `SNAP_${Date.now()}.jpg`,
      type: "hdr",
      createdAt: Date.now(),
      originalUrl: url,
      timestamp: Date.now(),
    };

    await onPhotoCaptured(newPhoto);
    setHasSaved(true);
  };

  // =====================================
  // PREVIEW FINAL
  // =====================================
  if (previewImage) {
    return (
      <div className="fixed inset-0 bg-black flex items-center justify-center z-[200]">
        <img src={previewImage} className="max-w-full max-h-full" />

        <button
          onClick={() => setPreviewImage(null)}
          className="absolute top-6 right-6 p-3 bg-black/60 rounded-full"
        >
          <X size={26} />
        </button>

        {hasSaved && (
          <div className="absolute bottom-10 bg-green-600 text-white px-6 py-3 rounded-full flex items-center gap-3">
            <CheckCircle size={22} />
            FOTO GUARDADA
          </div>
        )}
      </div>
    );
  }

  // =====================================
  // UI CAMARA
  // =====================================
  return (
    <div className="fixed inset-0 bg-black text-white flex flex-col z-50">

      {/* Segure firme */}
      {showHoldSteady && (
        <div className="absolute top-24 left-0 right-0 flex justify-center z-40">
          <div className="px-6 py-3 bg-black/70 text-white font-bold rounded-full animate-pulse">
            Segure firme…
          </div>
        </div>
      )}

      {/* TOP BAR */}
      <div className="flex items-center justify-between px-6 py-4">
        <button onClick={onClose} className="p-3 bg-black/40 rounded-full">
          <X size={22} />
        </button>

        <div className="flex gap-3">
          <button
            onClick={() =>
              setHdrProfile((p) => (p === "interior" ? "exterior" : "interior"))
            }
            className="px-3 py-1 bg-black/40 rounded-full text-xs uppercase font-bold"
          >
            {hdrProfile}
          </button>

          <button
            onClick={() => setShowGrid((g) => !g)}
            className="p-3 bg-black/40 rounded-full"
          >
            <Grid3X3 size={20} />
          </button>
        </div>
      </div>

      {/* VISOR */}
      <div className="flex-1 relative flex items-center justify-center">
        <div
          onClick={handleTapToFocus}
          className="relative w-full h-full max-w-[90%] mx-auto bg-black overflow-hidden rounded-xl"
        >
          <video
            ref={videoRef}
            autoPlay
            playsInline
            className="absolute inset-0 w-full h-full object-cover"
          />

          {flashVisual && (
            <div className="absolute inset-0 bg-white opacity-80" />
          )}

          {focusPoint && (
            <div
              className="absolute w-16 h-16 border-2 border-yellow-400 rounded-lg animate-ping"
              style={{ left: focusPoint.x - 32, top: focusPoint.y - 32 }}
            />
          )}

          {countdown !== null && (
            <div className="absolute inset-0 flex items-center justify-center">
              <span className="text-7xl font-bold">{countdown}</span>
            </div>
          )}

          {/* GRID */}
          {showGrid && (
            <div className="absolute inset-0 grid grid-cols-3 grid-rows-3 opacity-25">
              {[...Array(9)].map((_, i) => (
                <div key={i} className="border border-white/20" />
              ))}
            </div>
          )}

          {/* PREVIEWS HDR */}
          {isProcessing && capturedPreviews.length > 0 && (
            <div className="absolute top-4 left-4 bottom-4 w-16 flex flex-col gap-2 overflow-hidden z-30">
              {capturedPreviews.map((item, idx) => (
                <img
                  key={idx}
                  src={item.url}
                  className="w-full object-cover rounded border border-white/40 shadow"
                />
              ))}
            </div>
          )}

          {/* LENTES 1x / 0.5x */}
          <div className="absolute bottom-4 right-4 flex flex-col gap-2 z-30">
            <button
              onClick={() => startCamera("wide")}
              className={`w-12 h-12 rounded-full ${
                lens === "wide"
                  ? "bg-white text-black"
                  : "bg-black/70 text-white"
              }`}
            >
              1x
            </button>

            <button
              onClick={() => startCamera("ultra")}
              className={`w-12 h-12 rounded-full ${
                lens === "ultra"
                  ? "bg-white text-black"
                  : "bg-black/70 text-white"
              }`}
            >
              0.5x
            </button>
          </div>
        </div>
      </div>

      {/* SHUTTER */}
      <div className="flex justify-center py-6">
        <button
          onClick={handleShutterClick}
          disabled={isProcessing}
          className="w-24 h-24 rounded-full border-4 border-white flex items-center justify-center"
        >
          <div className="w-20 h-20 bg-white rounded-full" />
        </button>
      </div>

      {/* PROCESSAMENTO */}
      {isProcessing && (
        <div className="absolute inset-0 bg-black/80 flex flex-col items-center justify-center">
          <div className="w-16 h-16 border-4 border-white/20 border-t-yellow-400 rounded-full animate-spin mb-4" />
          <div className="text-yellow-400 text-xl font-bold">
            {processingStep}
          </div>
          <div className="text-white/60 mt-2">
            {Math.round(processingProgress)}%
          </div>
        </div>
      )}

      <canvas ref={canvasRef} className="hidden" />
    </div>
  );
};
