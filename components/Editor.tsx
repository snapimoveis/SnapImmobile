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

  const [brushSize, setBrushSize] = useState(26);
  const [isDrawing, setIsDrawing] = useState(false);
  const [cursorPos, setCursorPos] = useState<{ x: number; y: number } | null>(
    null
  );

  const canvasRef = useRef<HTMLCanvasElement>(null);
  const imgRef = useRef<HTMLImageElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  const [history, setHistory] = useState<string[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);

  // -----------------------------
  // LOAD IMAGE
  // -----------------------------
  useEffect(() => {
    let active = true;

    const load = async () => {
      if (!photo.url) return;

      try {
        const res = await fetch(photo.url);
        const blob = await res.blob();
        const blobUrl = URL.createObjectURL(blob);

        if (active) {
          setCurrentImage(blobUrl);
          setHistory([blobUrl]);
        }
      } catch {
        if (active) {
          setCurrentImage(photo.url);
          setHistory([photo.url]);
        }
      }
    };

    load();

    return () => {
      active = false;
    };
  }, [photo.id]);

  // -----------------------------
  // SYNC CANVAS SIZE
  // -----------------------------
  useEffect(() => {
    const syncCanvas = () => {
      if (!canvasRef.current || !imgRef.current) return;
      const img = imgRef.current;

      const w = img.clientWidth;
      const h = img.clientHeight;

      if (w > 0 && h > 0) {
        canvasRef.current.width = w;
        canvasRef.current.height = h;
      }
    };

    syncCanvas();
    window.addEventListener("resize", syncCanvas);
    return () => window.removeEventListener("resize", syncCanvas);
  }, [currentImage, isFullScreen, mode]);

  // -----------------------------
  // COORDS
  // -----------------------------
  const getPoint = (e: any) => {
    const canvas = canvasRef.current;
    if (!canvas) return { x: 0, y: 0 };
    const rect = canvas.getBoundingClientRect();

    const cx = e.touches ? e.touches[0].clientX : e.clientX;
    const cy = e.touches ? e.touches[0].clientY : e.clientY;

    return { x: cx - rect.left, y: cy - rect.top };
  };

  // -----------------------------
  // DRAW
  // -----------------------------
  const startDrawing = (e: any) => {
    if (mode !== ToolMode.MAGIC_ERASE) return;
    if (e.touches && e.cancelable) e.preventDefault();

    setIsDrawing(true);
    const pt = getPoint(e);
    const ctx = canvasRef.current?.getContext("2d");
    if (!ctx) return;

    ctx.beginPath();
    ctx.arc(pt.x, pt.y, brushSize / 2, 0, Math.PI * 2);
    ctx.fillStyle = "rgba(255,0,0,0.6)";
    ctx.fill();
  };

  const draw = (e: any) => {
    if (!isDrawing || mode !== ToolMode.MAGIC_ERASE) return;

    if (!e.touches) setCursorPos(getPoint(e));
    if (e.touches && e.cancelable) e.preventDefault();

    const pt = getPoint(e);
    const ctx = canvasRef.current?.getContext("2d");
    if (!ctx) return;

    ctx.lineWidth = brushSize;
    ctx.lineCap = "round";
    ctx.strokeStyle = "rgba(255,0,0,0.6)";
    ctx.lineTo(pt.x, pt.y);
    ctx.stroke();

    ctx.beginPath();
    ctx.moveTo(pt.x, pt.y);
  };

  const stopDrawing = () => {
    setIsDrawing(false);
    canvasRef.current?.getContext("2d")?.beginPath();
  };

  const clearMask = () => {
    const ctx = canvasRef.current?.getContext("2d");
    if (ctx) ctx.clearRect(0, 0, canvasRef.current!.width, canvasRef.current!.height);
  };

  // -----------------------------
  // UNDO
  // -----------------------------
  const handleUndo = () => {
    if (currentIndex === 0) return;
    const newIndex = currentIndex - 1;
    setCurrentIndex(newIndex);
    setCurrentImage(history[newIndex]);
    clearMask();
  };

  // -----------------------------
  // MERGE IMAGE + MASK
  // -----------------------------
  const composite = async (): Promise<string> => {
    const img = imgRef.current;
    const mask = canvasRef.current;

    if (!img || !mask) return currentImage;

    const w = img.naturalWidth;
    const h = img.naturalHeight;

    const temp = document.createElement("canvas");
    temp.width = w;
    temp.height = h;

    const ctx = temp.getContext("2d")!;
    ctx.drawImage(img, 0, 0, w, h);
    ctx.drawImage(mask, 0, 0, w, h);

    return temp.toDataURL("image/jpeg", 0.88);
  };

  // -----------------------------
  // APPLY AI EDIT
  // -----------------------------
  const handleEdit = async () => {
    setIsProcessing(true);
    setProcessingStage("A processar...");

    try {
      let inputImage = currentImage;
      let finalPrompt = promptText;

      if (mode === ToolMode.MAGIC_ERASE) {
        inputImage = await composite();
        finalPrompt = finalPrompt
          ? `Remove ${finalPrompt}.`
          : "Remove the red marked object.";
      } else {
        finalPrompt = `Add ${promptText}. Realistic shadows and light.`;
      }

      const result = await editImageWithPrompt(inputImage, finalPrompt, mode);

      const newHistory = [...history.slice(0, currentIndex + 1), result];
      setHistory(newHistory);
      setCurrentIndex(newHistory.length - 1);
      setCurrentImage(result);
      clearMask();
      setPromptText("");
    } catch (err) {
      console.error(err);
      alert("Não foi possível processar a imagem.");
    }

    setIsProcessing(false);
  };

  // -----------------------------
  // SAVE
  // -----------------------------
  const handleSave = async () => {
    const updated: Photo = {
      ...photo,
      url: currentImage,
      timestamp: Date.now(),
    };
    onSave(updated);
  };

  // ------------------------------------
  // RENDER
  // ------------------------------------

  if (!currentImage) {
    return (
      <div className="flex h-screen items-center justify-center bg-black text-white">
        A carregar...
      </div>
    );
  }

  return (
    <div className="flex flex-col h-screen bg-black text-white overflow-hidden">

      {/* HEADER */}
      {!isFullScreen && (
        <div className="h-16 flex items-center justify-between px-4 bg-black/70 border-b border-white/10 backdrop-blur-md">
          <button onClick={onCancel} className="p-2 hover:bg-white/10 rounded-full">
            <X size={22} />
          </button>

          <span className="font-semibold text-sm">Editor AI</span>

          <div className="flex gap-2">
            <button
              onClick={() => setIsFullScreen(true)}
              className="p-2 hover:bg-white/10 rounded-full"
            >
              <Maximize size={18} />
            </button>

            <button
              onClick={handleSave}
              className="px-4 py-1.5 bg-blue-600 hover:bg-blue-700 rounded-full flex items-center gap-2 text-sm font-medium"
            >
              <Save size={16} />
              Guardar
            </button>
          </div>
        </div>
      )}

      {/* IMAGE AREA */}
      <div className="flex-1 flex items-center justify-center relative overflow-hidden bg-black">
        {isFullScreen && (
          <button
            onClick={() => setIsFullScreen(false)}
            className="absolute top-6 right-6 z-40 p-3 bg-black/60 rounded-full hover:bg-black/80"
          >
            <Minimize size={24} />
          </button>
        )}

        <div ref={containerRef} className="relative max-w-full max-h-full w-auto h-auto">
          <img
            ref={imgRef}
            src={currentImage}
            alt="Editor"
            className="max-w-full max-h-[80vh] md:max-h-[85vh] object-contain pointer-events-none select-none"
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

          {/* Cursor Brush preview (Desktop only) */}
          {mode === ToolMode.MAGIC_ERASE &&
            cursorPos &&
            !("ontouchstart" in window) && (
              <div
                className="absolute rounded-full border border-white/70 bg-red-500/20 pointer-events-none z-30"
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
            <div className="w-16 h-16 rounded-full border-t-2 border-blue-500 animate-spin"></div>
            <p className="mt-4 text-lg">{processingStage}</p>
          </div>
        )}
      </div>

      {/* TOOLBAR */}
      {!isFullScreen && (
        <div className="bg-black/80 backdrop-blur-md border-t border-white/10 p-4 pb-6">
          {mode === ToolMode.MAGIC_ERASE && (
            <div className="flex items-center gap-4 px-3 mb-4">
              <Brush size={18} className="text-gray-300" />
              <input
                type="range"
                min="10"
                max="80"
                value={brushSize}
                onChange={(e) => setBrushSize(Number(e.target.value))}
                className="flex-1"
              />
              <div
                className="rounded-full bg-red-500/40 border border-white/30"
                style={{ width: brushSize / 2, height: brushSize / 2 }}
              />
            </div>
          )}

          <div className="max-w-lg mx-auto flex justify-between items-center">
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
                  className="px-6 py-3 bg-blue-600 hover:bg-blue-700 rounded-full flex items-center gap-2 font-bold"
                >
                  <Wand2 size={18} /> Aplicar
                </button>
              ) : (
                <div className="flex gap-2 items-center bg-gray-800 p-1 rounded-full pl-3 pr-1">
                  <input
                    type="text"
                    value={promptText}
                    onChange={(e) => setPromptText(e.target.value)}
                    placeholder="Adicionar..."
                    className="bg-transparent border-none text-sm w-32 focus:outline-none"
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
