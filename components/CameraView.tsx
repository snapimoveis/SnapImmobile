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

  // Sons
  const shutterSound = useRef<HTMLAudioElement | null>(null);
  const countdownBeep = useRef<HTMLAudioElement | null>(null);

  const safeSet = (fn: () => void) => {
    if (mountedRef.current) fn();
  };

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
  const [capturedPreviews, setCapturedPreviews] = useState<
    { url: string; ev: string }[]
  >([]);
  const [focusPoint, setFocusPoint] = useState<{ x: number; y: number } | null>(
    null
  );

  const [showHoldSteady, setShowHoldSteady] = useState(false);
  const [hdrProfile, setHdrProfile] = useState<"interior" | "exterior">(
    "interior"
  );

  // Lentes (0.5x / 1x)
  const [lens, setLens] = useState<LensType>("wide");
  const [wideDeviceId, setWideDeviceId] = useState<string | null>(null);
  const [ultraDeviceId, setUltraDeviceId] = useState<string | null>(null);

  // ─────────────────────────────────────
  // MOUNT / UNMOUNT
  // ─────────────────────────────────────
  useEffect(() => {
    mountedRef.current = true;

    // sons
    shutterSound.current = new Audio("/iphone-camera-capture-6448.mp3");
    shutterSound.current.preload = "auto";
    shutterSound.current.load();

    countdownBeep.current = new Audio("/countdown-beep.mp3");
    countdownBeep.current.preload = "auto";
    countdownBeep.current.load();

    const updateOrientation = () =>
      safeSet(() => setIsLandscape(window.innerWidth > window.innerHeight));
    updateOrientation();
    window.addEventListener("resize", updateOrientation);

    return () => {
      mountedRef.current = false;
      window.removeEventListener("resize", updateOrientation);
      stopCamera();
    };
  }, []);

  // Começar câmara sempre que não há preview
  useEffect(() => {
    if (!previewImage) {
      startCamera(lens);
      safeSet(() => setHasSaved(false));
    }
  }, [previewImage]);

  // ─────────────────────────────────────
  // DETECTAR CÂMERAS TRASEIRAS (0.5 / 1x)
  // ─────────────────────────────────────
  const detectBackCameras = async () => {
    try {
      const devices = await navigator.mediaDevices.enumerateDevices();
      const videos = devices.filter((d) => d.kind === "videoinput");

      if (!videos.length) return;

      let ultra: MediaDeviceInfo | undefined;
      let wide: MediaDeviceInfo | undefined;

      videos.forEach((cam) => {
        const label = cam.label.toLowerCase();

        // ultra-wide (0.5x)
        if (!ultra && (label.includes("0.5") || label.includes("ultra"))) {
          ultra = cam;
        }

        // wide (1x) traseira
        if (
          !wide &&
          (label.includes("back") ||
            label.includes("wide") ||
            label.includes("1.") ||
            label.includes("main")) &&
          !label.includes("front")
        ) {
          wide = cam;
        }
      });

      // fallbacks seguros
      if (!wide) {
        // prefere qualquer que não seja "front"
        wide =
          videos.find((v) => !v.label.toLowerCase().includes("front")) ||
          videos[0];
      }
      if (!ultra && videos.length > 1) {
        ultra = videos.find((c) => c.deviceId !== wide!.deviceId);
      }

      safeSet(() => {
        setWideDeviceId(wide ? wide.deviceId : null);
        setUltraDeviceId(ultra ? ultra.deviceId : null);
      });

      return { wide, ultra };
    } catch (e) {
      console.warn("Erro a detectar lentes:", e);
    }
  };

  // ─────────────────────────────────────
  // START / STOP CAMERA
  // ─────────────────────────────────────
  const startCamera = async (targetLens: LensType) => {
    try {
      await stopCamera();

      let deviceId: string | undefined;

      // Garante que temos IDs
      if (!wideDeviceId && !ultraDeviceId) {
        const result = await detectBackCameras();
        deviceId =
          targetLens === "ultra"
            ? result?.ultra?.deviceId || result?.wide?.deviceId
            : result?.wide?.deviceId;
      } else {
        if (targetLens === "ultra" && ultraDeviceId) deviceId = ultraDeviceId;
        else if (wideDeviceId) deviceId = wideDeviceId;
      }

      const constraints: MediaStreamConstraints = {
        video: {
          ...(deviceId
            ? { deviceId: { exact: deviceId } }
            : { facingMode: { exact: "environment" } }),
          width: { ideal: 4032 },
          height: { ideal: 3024 },
          aspectRatio: { ideal: 4 / 3 },
        },
      };

      const stream = await navigator.mediaDevices.getUserMedia(constraints);
      streamRef.current = stream;

      const video = videoRef.current;
      if (video) {
        video.srcObject = stream;
        video.onloadedmetadata = () =>
          safeSet(() => setIsStreaming(true));
      }

      safeSet(() => setLens(targetLens));
    } catch (err) {
      console.error("Erro ao iniciar câmara:", err);
      alert("Não foi possível aceder à câmara.");
    }
  };

  const stopCamera = async () => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((t) => t.stop());
      streamRef.current = null;
    }
    if (videoRef.current) videoRef.current.srcObject = null;
    safeSet(() => setIsStreaming(false));
  };

  // ─────────────────────────────────────
  // TAP-TO-FOCUS (modo híbrido)
  // ─────────────────────────────────────
  const handleTapToFocus = async (
    e: React.MouseEvent<HTMLDivElement> | React.TouchEvent<HTMLDivElement>
  ) => {
    if (!streamRef.current) return;

    const rect = e.currentTarget.getBoundingClientRect();
    const clientX =
      "touches" in e
        ? e.touches[0].clientX
        : (e as React.MouseEvent<HTMLDivElement>).clientX;
    const clientY =
      "touches" in e
        ? e.touches[0].clientY
        : (e as React.MouseEvent<HTMLDivElement>).clientY;

    const x = clientX - rect.left;
    const y = clientY - rect.top;

    safeSet(() => setFocusPoint({ x, y }));
    setTimeout(() => safeSet(() => setFocusPoint(null)), 1500);

    const track = streamRef.current.getVideoTracks()[0];
    const caps: any = track.getCapabilities?.() || {};
    const settings: any = track.getSettings?.() || {};

    try {
      // foco single-shot se existir
      if (caps.focusMode && caps.focusMode.includes("single-shot")) {
        await track.applyConstraints({
          advanced: [{ focusMode: "single-shot" }],
        } as any);
      } else if (caps.focusMode && caps.focusMode.includes("continuous")) {
        await track.applyConstraints({
          advanced: [{ focusMode: "continuous" }],
        } as any);
      }

      // ajuste suave de exposição (estilo Samsung)
      if (caps.exposureCompensation) {
        const mid =
          (caps.exposureCompensation.max + caps.exposureCompensation.min) /
          2;
        const current = settings.exposureCompensation || 0;
        const newEv = current > mid ? mid - 0.5 : mid + 0.5;

        await track.applyConstraints({
          advanced: [{ exposureCompensation: newEv }],
        } as any);
      }
    } catch (error) {
      console.warn("Tap-to-focus não suportado, fallback automático.", error);
    }
  };

  // ─────────────────────────────────────
  // SHUTTER (som + contagem + Segure firme)
  // ─────────────────────────────────────
  const handleShutterClick = () => {
    if (!isStreaming || isProcessing) return;

    safeSet(() => setShowHoldSteady(true));
    setTimeout(() => safeSet(() => setShowHoldSteady(false)), 1400);

    try {
      shutterSound.current?.play();
    } catch {}

    let count = 3;
    safeSet(() => setCountdown(count));

    const timer = setInterval(() => {
      count--;
      if (count > 0) {
        try {
          countdownBeep.current?.play();
        } catch {}
        safeSet(() => setCountdown(count));
      } else {
        clearInterval(timer);
        safeSet(() => setCountdown(null));
        captureHDRSequence();
      }
    }, 1000);
  };

  // ─────────────────────────────────────
  // DESENHAR FRAME 4:3
  // ─────────────────────────────────────
  const drawFrame = (
    video: HTMLVideoElement,
    canvas: HTMLCanvasElement,
    ctx: CanvasRenderingContext2D,
    filter?: string
  ) => {
    const vw = video.videoWidth;
    const vh = video.videoHeight;
    if (!vw || !vh) return;

    const ratio = 4 / 3;
    let w = vw,
      h = vh,
      sx = 0,
      sy = 0;

    if (vw / vh > ratio) {
      w = vh * ratio;
      sx = (vw - w) / 2;
    } else {
      h = vw / ratio;
      sy = (vh - h) / 2;
    }

    canvas.width = w;
    canvas.height = h;

    if (filter) ctx.filter = filter;
    ctx.drawImage(video, sx, sy, w, h, 0, 0, w, h);
    ctx.filter = "none";
  };

  // ─────────────────────────────────────
  // HDR SEQUENCE + IA
  // ─────────────────────────────────────
  const captureHDRSequence = async () => {
    if (!videoRef.current || !canvasRef.current || !streamRef.current) return;

    safeSet(() => {
      setIsProcessing(true);
      setCapturedPreviews([]);
      setProcessingStep("Capturando…");
      setProcessingProgress(0);
      setHasSaved(false);
    });

    const video = videoRef.current;
    const canvas = canvasRef.current;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const track = streamRef.current.getVideoTracks()[0];
    const caps: any = track.getCapabilities?.() || {};
    const supportsEV = !!caps.exposureCompensation;

    const evSeq = [-4, -3, -2, -1, 0, 1, 2, 3, 4];
    const brightness = [0.4, 0.5, 0.6, 0.8, 1, 1.1, 1.2, 1.4, 1.6];

    const frames: string[] = [];

    for (let i = 0; i < 9; i++) {
      if (supportsEV) {
        const evVal = Math.min(
          caps.exposureCompensation.max,
          Math.max(caps.exposureCompensation.min, evSeq[i])
        );
        try {
          await track.applyConstraints({
            advanced: [{ exposureCompensation: evVal }],
          } as any);
        } catch {}
      }

      const filter = `brightness(${brightness[i]}) saturate(1.15) contrast(1.08)`;

      safeSet(() => setFlashVisual(true));
      await new Promise((r) => setTimeout(r, 40));
      safeSet(() => setFlashVisual(false));

      drawFrame(video, canvas, ctx, filter);
      const jpeg = canvas.toDataURL("image/jpeg", 0.9);
      frames.push(jpeg);

      if (i % 2 === 0) {
        safeSet(() =>
          setCapturedPreviews((prev) => [
            ...prev,
            { url: jpeg, ev: evSeq[i].toString() },
          ])
        );
      }

      safeSet(() => setProcessingProgress(((i + 1) / 9) * 45));
      await new Promise((r) => setTimeout(r, 50));
    }

    if (supportsEV) {
      try {
        await track.applyConstraints({
          advanced: [{ exposureCompensation: 0 }],
        } as any);
      } catch {}
    }

    safeSet(() => {
      setProcessingStep("Processando IA…");
      setProcessingProgress(65);
    });

    let best = frames[4];
    try {
      const aiResult = await enhanceImage(
        [frames[1], frames[4], frames[7]],
        hdrProfile === "interior" ? "hp_hdr_interior" : "hp_hdr_exterior"
      );
      if (aiResult && aiResult.length > 1000) {
        best = aiResult;
      }
    } catch (e) {
      console.warn("Falha na IA, usando exposição média:", e);
    }

    safeSet(() => {
      setProcessingStep("Finalizando…");
      setProcessingProgress(100);
      setPreviewImage(best);
    });

    await savePhoto(best, frames[4]);
    safeSet(() => setIsProcessing(false));
  };

  // ─────────────────────────────────────
  // GUARDAR FOTO (objeto compatível Firestore)
  // ─────────────────────────────────────
  const savePhoto = async (finalUrl: string, originalUrl: string) => {
    if (hasSaved) return;

    const newPhoto: Photo = {
      id: crypto.randomUUID(),
      url: finalUrl,
      originalUrl: originalUrl || "",
      name: `SNAP_${Date.now()}.jpg`,
      createdAt: Date.now(),
      type: "hdr",
      // se o teu tipo Photo tiver timestamp opcional, isto é seguro
      timestamp: Date.now(),
    };

    try {
      await onPhotoCaptured(newPhoto);
      safeSet(() => setHasSaved(true));
    } catch (e: any) {
      console.error("Erro ao guardar foto:", e);
      alert("Erro ao guardar foto: " + (e?.message || "desconhecido"));
    }
  };

  // ─────────────────────────────────────
  // TROCA DE LENTE 0.5x / 1x
  // ─────────────────────────────────────
  const handleLensChange = async (target: LensType) => {
    if (target === lens || isProcessing || countdown !== null) return;
    await startCamera(target);
  };

  // ─────────────────────────────────────
  // PREVIEW
  // ─────────────────────────────────────
  if (previewImage) {
    return (
      <div className="fixed inset-0 bg-black flex items-center justify-center z-[200]">
        <img
          src={previewImage}
          className="max-w-full max-h-full object-contain"
          alt="Resultado HDR"
        />

        <button
          onClick={() => setPreviewImage(null)}
          className="absolute top-6 right-6 p-3 bg-black/60 rounded-full"
        >
          <X size={26} />
        </button>

        {hasSaved && (
          <div className="absolute bottom-10 px-6 py-3 rounded-full bg-green-600 text-white flex items-center gap-3 shadow-xl">
            <CheckCircle size={22} />
            <span className="font-bold">FOTO GUARDADA</span>
          </div>
        )}
      </div>
    );
  }

  // ─────────────────────────────────────
  // UI PRINCIPAL DA CÂMERA
  // ─────────────────────────────────────
  return (
    <div
      className={`fixed inset-0 bg-black text-white flex ${
        isLandscape ? "flex-row" : "flex-col"
      } z-50`}
    >
      {/* Aviso Segure firme */}
      {showHoldSteady && (
        <div className="absolute top-24 left-0 right-0 flex justify-center z-40">
          <div className="px-6 py-3 bg-black/70 text-white rounded-full text-base font-bold animate-pulse shadow-lg border border-white/10">
            Segure firme…
          </div>
        </div>
      )}

      {/* Barra superior */}
      <div
        className={`flex items-center justify-between px-6 py-4 z-30 ${
          isLandscape ? "flex-col w-20" : "w-full h-20"
        }`}
      >
        <button
          onClick={onClose}
          className="p-3 bg-black/40 rounded-full shadow-md"
        >
          <X size={20} />
        </button>

        <div className="flex gap-3 items-center">
          <button
            onClick={() =>
              setHdrProfile((p) => (p === "interior" ? "exterior" : "interior"))
            }
            className="px-3 py-1 border border-white/20 bg-black/40 rounded-full text-[11px] font-bold uppercase"
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
      <div className="flex-1 relative flex items-center justify-center overflow-hidden">
        <div
          onClick={handleTapToFocus}
          className={`relative bg-black rounded-lg overflow-hidden shadow-xl ${
            isLandscape ? "h-full aspect-[4/3]" : "w-full aspect-[3/4]"
          }`}
        >
          <video
            ref={videoRef}
            autoPlay
            playsInline
            className="absolute inset-0 w-full h-full object-cover"
          />

          <canvas ref={canvasRef} className="hidden" />

          {flashVisual && (
            <div className="absolute inset-0 bg-white opacity-80 pointer-events-none" />
          )}

          {focusPoint && (
            <div
              className="absolute w-16 h-16 border-2 border-yellow-400 rounded-lg animate-ping pointer-events-none"
              style={{
                left: focusPoint.x - 32,
                top: focusPoint.y - 32,
              }}
            />
          )}

          {countdown !== null && (
            <div className="absolute inset-0 flex items-center justify-center bg-black/20 backdrop-blur-sm z-20">
              <span className="text-[100px] font-bold">{countdown}</span>
            </div>
          )}

          {showGrid && (
            <div className="absolute inset-0 grid grid-cols-3 grid-rows-3 opacity-25 pointer-events-none">
              {[...Array(9)].map((_, i) => (
                <div key={i} className="border border-white/20" />
              ))}
            </div>
          )}

          {/* Previews laterais durante HDR */}
          {isProcessing && capturedPreviews.length > 0 && (
            <div className="absolute top-4 left-4 bottom-4 w-16 flex flex-col gap-2 overflow-hidden z-30">
              {capturedPreviews.map((prev, idx) => (
                <img
                  key={idx}
                  src={prev.url}
                  className="w-full aspect-[4/3] object-cover rounded border border-white/40 shadow"
                />
              ))}
            </div>
          )}

          {/* Botões de lente 1x / 0.5x */}
          <div className="absolute bottom-4 right-4 flex flex-col gap-2 z-30">
            <button
              onClick={() => handleLensChange("wide")}
              className={`w-12 h-12 rounded-full flex items-center justify-center text-sm font-bold ${
                lens === "wide"
                  ? "bg-white text-black"
                  : "bg-black/60 text-white"
              }`}
            >
              1x
            </button>
            <button
              onClick={() => handleLensChange("ultra")}
              className={`w-12 h-12 rounded-full flex items-center justify-center text-sm font-bold ${
                lens === "ultra"
                  ? "bg-white text-black"
                  : "bg-black/60 text-white"
              }`}
            >
              0.5x
            </button>
          </div>
        </div>
      </div>

      {/* DISPARADOR */}
      <div
        className={`flex items-center justify-center ${
          isLandscape ? "w-32 h-full flex-col" : "w-full h-32"
        }`}
      >
        <button
          onClick={handleShutterClick}
          disabled={isProcessing || countdown !== null}
          className="w-20 h-20 rounded-full border-4 border-white flex items-center justify-center active:scale-95 transition-transform"
        >
          <div className="w-[68px] h-[68px] rounded-full bg-white" />
        </button>
      </div>

      {/* OVERLAY DE PROCESSAMENTO */}
      {isProcessing && (
        <div className="absolute inset-0 flex flex-col items-center justify-center bg-black/80 z-40">
          <div className="w-16 h-16 border-4 border-white/20 border-t-yellow-400 rounded-full animate-spin mb-4" />
          <div className="text-yellow-400 font-bold text-xl uppercase">
            {processingStep}
          </div>
          <div className="text-white/60 mt-2">
            {Math.round(processingProgress)}%
          </div>
          <div className="text-white/70 text-sm mt-1 animate-pulse">
            Segure firme…
          </div>
        </div>
      )}
    </div>
  );
};
