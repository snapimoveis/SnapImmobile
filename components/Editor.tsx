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

    ctx.lineWidth =
