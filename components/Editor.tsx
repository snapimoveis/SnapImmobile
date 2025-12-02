import React, { useState, useRef, useEffect } from "react";
import { Photo, ToolMode } from "../types";
import {
  Wand2,
  Sofa,
  Eraser,
  X,
  Undo,
  Save,
  Sparkles,
  Maximize,
  Minimize,
  Brush,
} from "lucide-react";
import { editImageWithPrompt } from "../services/geminiService";

interface EditorProps {
  photo: Photo;
  onSave: (updatedPhoto: Photo) => void;
  onCancel: () => void;
}

export const Editor: React.FC<EditorProps> = ({
  photo,
  onSave,
  onCancel,
}) => {
  const [currentImage, setCurrentImage] = useState<string>("");
  const [mode, setMode] = useState<ToolMode>(ToolMode.MAGIC_ERASE);
  const [promptText, setPromptText] = useState("");
  const [isProcessing, setIsProcessing] = useState(false);
  const [processingStage, setProcessingStage] = useState("");
  const [isFullScreen, setIsFullScreen] = useState(false);

  const [brushSize, setBrushSize] = useState(25);
  const [isDrawing, setIsDrawing] = useState(false);
  const [cursorPos, setCursorPos] = useState<{ x: number; y: number } | null>(
    null
  );

  const canvasRef = useRef<HTMLCanvasElement>(null);
  const imgRef = useRef<HTMLImageElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  const [history, setHistory] = useState<string[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);

  // ----------- LOAD IMAGE -----------
  useEffect(() => {
    let mounted = true;

    const prepare = async () => {
      if (!photo.url) return;

      if (photo.url.startsWith("data:") || photo.url.startsWith("blob:")) {
        if (mounted) {
          setCurrentImage(photo.url);
          setHistory([photo.url]);
        }
        return;
      }

      try {
        const urlFixed =
          photo.url + (photo.url.includes("?") ? "&t=" : "?t=") + Date.now();

        const res = await fetch(urlFixed, { mode: "cors" });
        const blob = await res.blob();
        const blobUrl = URL.createObjectURL(blob);

        if (mounted) {
          setCurrentImage(blobUrl);
          setHistory([blobUrl]);
        }
      } catch {
        if (mounted) {
          setCurrentImage(photo.url);
          setHistory([photo.url]);
        }
      }
    };

    prepare();

    return () => {
      mounted = false;
      history.forEach((h) => {
        if (h.startsWith("blob:")) URL.revokeObjectURL(h);
      });
    };
  }, [photo.id]);

  // ----------- CANVAS SYNC -----------
  useEffect(() => {
    const sync = () => {
      if (!canvasRef.current || !imgRef.current) return;
      const img = imgRef.current;
      if (img.clientWidth <= 0) return;
      canvasRef.current.width = img.clientWidth;
      canvasRef.current.height = img.clientHeight;
    };
    const timer = setTimeout(sync, 80);
    window.addEventListener("resize", sync);
    return () => {
      window.removeEventListener("resize", sync);
      clearTimeout(timer);
    };
  }, [currentImage, isFullScreen, mode]);

  // --------- COORDINATES ----------
  const getCoordinates = (e: any) => {
    const canvas = canvasRef.current;
    if (!canvas) return { x: 0, y: 0 };
    const rect = canvas.getBoundingClientRect();
    let cx, cy;
    if (e.touches) {
      cx = e.touches[0].clientX;
      cy = e.touches[0].clientY;
    } else {
      cx = e.clientX;
      cy = e.clientY;
    }
    return { x: cx - rect.left, y: cy - rect.top };
  };

  // ---------- DRAW ----------
  const startDrawing = (e: any) => {
    if (mode !== ToolMode.MAGIC_ERASE) return;
    if (e.cancelable && e.touches) e.preventDefault();

    setIsDrawing(true);
    const p = getCoordinates(e);
    const ctx = canvasRef.current?.getContext("2d");
    if (!ctx) return;

    ctx.beginPath();
    ctx.fillStyle = "rgba(255,0,0,0.6)";
    ctx.arc(p.x, p.y, brushSize / 2, 0, Math.PI * 2);
    ctx.fill();
    ctx.beginPath();
    ctx.moveTo(p.x, p.y);
  };

  const draw = (e: any) => {
    if (!isDrawing || mode !== ToolMode.MAGIC_ERASE) return;

    if (!e.touches) setCursorPos(getCoordinates(e));
    if (e.cancelable && e.touches) e.preventDefault();

    const p = getCoordinates(e);
    const ctx = canvasRef.current?.getContext("2d");
    if (!ctx) return;

    ctx.lineWidth = brushSize;
    ctx.lineCap = "round";
    ctx.lineJoin = "round";
    ctx.strokeStyle = "rgba(255,0,0,0.6)";
    ctx.lineTo(p.x, p.y);
    ctx.stroke();

    ctx.beginPath();
    ctx.moveTo(p.x, p.y);
  };

  const stopDrawing = () => {
    setIsDrawing(false);
    const ctx = canvasRef.current?.getContext("2d");
    if (ctx) ctx.beginPath();
  };

  const clearMask = () => {
    const c = canvasRef.current;
    if (!c) return;
    c.getContext("2d")?.clearRect(0, 0, c.width, c.height);
  };

  // ---------- UNDO ----------
  const handleUndo = () => {
    if (currentIndex === 0) return;
    const newIndex = currentIndex - 1;
    setCurrentIndex(newIndex);
    setCurrentImage(history[newIndex]);
    clearMask();
  };

  // ---------- COMPOSE IMAGE ----------
  const composite = async (): Promise<string> => {
    if (!imgRef.current || !canvasRef.current) return currentImage;

    const original = imgRef.current;
    const mask = canvasRef.current;

    if (!original.src.startsWith("data:") && !original.src.startsWith("blob:")) {
      original.crossOrigin = "anonymous";
    }

    const MAX = 1536;
    let w = original.naturalWidth;
    let h = original.naturalHeight;

    if (w > MAX || h > MAX) {
      const r = Math.min(MAX / w, MAX / h);
      w = Math.round(w * r);
      h = Math.round(h * r);
    }

    const temp = document.createElement("canvas");
    temp.width = w;
    temp.height = h;
    const ctx = temp.getContext("2d")!;
    ctx.drawImage(original, 0, 0, w, h);
    ctx.drawImage(mask, 0, 0, w, h);

    return temp.toDataURL("image/jpeg", 0.88);
  };

  // ----------- APPLY AI EDIT ----------
  const handleEdit = async () => {
    if (mode === ToolMode.VIRTUAL_STAGING && !promptText.trim()) return;

    setIsProcessing(true);
    setProcessingStage(
      mode === ToolMode.MAGIC_ERASE ? "A remover objetos..." : "A adicionar mobília..."
    );

    try {
      let imgToSend = currentImage;
      let finalPrompt = promptText;

      if (mode === ToolMode.MAGIC_ERASE) {
        imgToSend = await composite();
        finalPrompt = promptText
          ? `Remove ${promptText}.`
          : "Remove the red marked object.";
      } else {
        finalPrompt = `Add ${promptText}. Ultra realistic light.`;
      }

      // CORREÇÃO DEFINITIVA
      const result = await editImageWithPrompt(
        imgToSend,
        finalPrompt,
        mode
      );

      const newHist = [...history.slice(0, currentIndex + 1), result];
      setHistory(newHist);
      setCurrentIndex(newHist.length - 1);
      setCurrentImage(result);
      clearMask();
      setPromptText("");
    } catch (e: any) {
      alert(e.message || "Falha no processamento.");
    } finally {
      setIsProcessing(false);
      setProcessingStage("");
    }
  };

  // ---------- SAVE ----------
  const convertBlobIfNeeded = async (img: string): Promise<string> => {
    if (!img.startsWith("blob:")) return img;

    const res = await fetch(img);
    const blob = await res.blob();
    return await new Promise((resolve) => {
      const reader = new FileReader();
      reader.onloadend = () => resolve(reader.result as string);
      reader.readAsDataURL(blob);
    });
  };

  const handleSave = async () => {
    const finalUrl = await convertBlobIfNeeded(currentImage);

    const updated: Photo = {
      ...photo,
      url: finalUrl,
      timestamp: photo.timestamp ?? Date.now(),
      createdAt: photo.createdAt ?? Date.now(),
    };

    onSave(updated);
  };

  // ---------- RENDER ----------
  if (!currentImage) {
    return (
      <div className="flex h-screen items-center justify-center bg-black text-white">
        A preparar imagem...
      </div>
    );
  }

  return (
    <div className="flex flex-col h-screen bg-black text-white font-sans overscroll-none">

      {!isFullScreen && (
        <div className="h-16 bg-gray-900 border-b border-gray-800 flex items-center justify-between px-4">
          <button onClick={onCancel} className="p-2 hover:bg-gray-800 rounded-full">
            <X size={24} />
          </button>
          <span className="font-semibold">Editor AI</span>

          <div className="flex gap-2">
            <button
              onClick={() => setIsFullScreen(true)}
              className="p-2 hover:bg-gray-800 rounded-full"
            >
              <Maximize size={20} />
            </button>

            <button
              onClick={handleSave}
              className="bg-blue-600 hover:bg-blue-700 px-4 py-1.5 rounded-full text-sm font-medium flex items-center gap-2"
            >
              <Save size={16} /> Guardar
            </button>
          </div>
        </div>
      )}

      <div className="flex-1 relative flex items-center justify-center bg-black overflow-hidden">
        {isFullScreen && (
          <button
            onClick={() => setIsFullScreen(false)}
            className="absolute top-6 right-6 z-50 p-3 bg-black/50 hover:bg-black/70 rounded-full"
          >
            <Minimize size={24} />
          </button>
        )}

        <div ref={containerRef} className="relative shadow-xl inline-block">
          <img
            ref={imgRef}
            src={currentImage}
            alt="Editor"
            crossOrigin="anonymous"
            className="max-w-full max-h-full object-contain select-none pointer-events-none"
          />

          <canvas
            ref={canvasRef}
            className={`absolute inset-0 ${
              mode === ToolMode.MAGIC_ERASE ? "cursor-crosshair" : "pointer-events-none"
            }`}
            onMouseDown={startDrawing}
            onMouseMove={draw}
            onMouseUp={stopDrawing}
            onMouseLeave={stopDrawing}
            onTouchStart={startDrawing}
            onTouchMove={draw}
            onTouchEnd={stopDrawing}
          />

          {mode === ToolMode.MAGIC_ERASE &&
            cursorPos &&
            !("ontouchstart" in window) && (
              <div
                className="absolute rounded-full border border-white/80 bg-red-500/20 pointer-events-none z-10"
                style={{
                  left: cursorPos.x,
                  top: cursorPos.y,
                  width: brushSize,
                  height: brushSize,
                  transform: "translate(-50%, -50%)",
                }}
              />
            )}
        </div>

        {isProcessing && (
          <div className="absolute inset-0 bg-black/80 flex flex-col items-center justify-center z-50">
            <div className="w-16 h-16 rounded-full border-t-2 border-blue-500 animate-spin mb-6"></div>
            <p className="text-xl">{processingStage}</p>
          </div>
        )}
      </div>

      {!isFullScreen && (
        <div className="bg-gray-900 border-t border-gray-800 p-4 pb-8">
          {mode === ToolMode.MAGIC_ERASE && (
            <div className="mb-6 flex items-center gap-4 px-4 max-w-md mx-auto">
              <Brush size={16} className="text-gray-400" />
              <input
                type="range"
                min="10"
                max="80"
                value={brushSize}
                onChange={(e) => setBrushSize(Number(e.target.value))}
                className="flex-1"
              />
              <div
                className="rounded-full bg-red-500/40 border border-white/20"
                style={{
                  width: brushSize / 2,
                  height: brushSize / 2,
                }}
              />
            </div>
          )}

          <div className="flex justify-between items-center max-w-lg mx-auto">
            <div className="flex gap-2 bg-gray-800 p-1 rounded-xl">
              <button
                onClick={() => setMode(ToolMode.MAGIC_ERASE)}
                className={`flex flex-col items-center px-4 py-2 rounded-lg ${
                  mode === ToolMode.MAGIC_ERASE
                    ? "bg-gray-700 text-blue-400"
                    : "text-gray-400"
                }`}
              >
                <Eraser size={20} />
                <span className="text-[10px] mt-1">Apagar</span>
              </button>

              <button
                onClick={() => setMode(ToolMode.VIRTUAL_STAGING)}
                className={`flex flex-col items-center px-4 py-2 rounded-lg ${
                  mode === ToolMode.VIRTUAL_STAGING
                    ? "bg-gray-700 text-blue-400"
                    : "text-gray-400"
                }`}
              >
                <Sofa size={20} />
                <span className="text-[10px] mt-1">Decorar</span>
              </button>
            </div>

            <div className="flex items-center gap-3">
              <button
                onClick={handleUndo}
                disabled={currentIndex === 0}
                className={`p-3 rounded-full ${
                  currentIndex === 0
                    ? "opacity-30 cursor-not-allowed"
                    : "bg-gray-800 hover:bg-gray-700"
                }`}
              >
                <Undo size={20} />
              </button>

              {mode === ToolMode.MAGIC_ERASE ? (
                <button
                  onClick={handleEdit}
                  className="px-6 py-3 bg-blue-600 hover:bg-blue-700 rounded-full font-bold flex items-center gap-2"
                >
                  <Wand2 size={18} /> Aplicar
                </button>
              ) : (
                <div className="flex gap-2 items-center bg-gray-800 p-1 rounded-full pl-4 pr-1">
                  <input
                    type="text"
                    value={promptText}
                    onChange={(e) => setPromptText(e.target.value)}
                    placeholder="Adicionar..."
                    className="bg-transparent border-none text-sm w-32"
                  />
                  <button
                    onClick={handleEdit}
                    disabled={!promptText.trim()}
                    className="p-2 bg-blue-600 hover:bg-blue-700 rounded-full disabled:opacity-50"
                  >
                    <Sparkles size={18} />
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
