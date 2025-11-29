import React, { useState, useRef, useEffect } from 'react';
// IMPORTAÇÃO CORRETA: Garantir que ToolMode é importado como valor (não apenas como tipo)
import { Photo, ToolMode } from '../types';
import { Wand2, Sofa, Eraser, X, Undo, Save, Sparkles, Maximize, Minimize, Brush } from 'lucide-react';
import { editImageWithPrompt } from '../services/geminiService';

interface EditorProps {
  photo: Photo;
  onSave: (updatedPhoto: Photo) => void;
  onCancel: () => void;
}

export const Editor: React.FC<EditorProps> = ({ photo, onSave, onCancel }) => {
  const [currentImage, setCurrentImage] = useState<string>(''); 
  // Define o modo inicial usando o Enum
  const [mode, setMode] = useState<ToolMode>(ToolMode.MAGIC_ERASE); 
  const [promptText, setPromptText] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [processingStage, setProcessingStage] = useState('');
  const [isFullScreen, setIsFullScreen] = useState(false);
  
  // Estado do Pincel
  const [brushSize, setBrushSize] = useState(25); 
  const [isDrawing, setIsDrawing] = useState(false);
  const [cursorPos, setCursorPos] = useState<{x: number, y: number} | null>(null);
  
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const imgRef = useRef<HTMLImageElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  // Pilha de Histórico
  const [history, setHistory] = useState<string[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);

  // Carregar Imagem de forma Segura
  useEffect(() => {
      let isMounted = true;
      const prepareImage = async () => {
          if (!photo.url) return;

          // Se já for base64 ou blob, usa direto
          if (photo.url.startsWith('data:') || photo.url.startsWith('blob:')) {
              if (isMounted) {
                  setCurrentImage(photo.url);
                  setHistory([photo.url]);
              }
              return;
          }

          try {
              // Adiciona timestamp para evitar cache de CORS
              const urlWithCacheBust = photo.url.includes('?') 
                ? `${photo.url}&t=${Date.now()}` 
                : `${photo.url}?t=${Date.now()}`;

              const response = await fetch(urlWithCacheBust, { mode: 'cors' });
              const blob = await response.blob();
              const objectUrl = URL.createObjectURL(blob);
              
              if (isMounted) {
                  setCurrentImage(objectUrl);
                  setHistory([objectUrl]);
              }
          } catch (e) {
              console.error("Falha ao carregar imagem:", e);
              // Fallback: tenta usar a URL original se o fetch falhar
              if (isMounted) {
                  setCurrentImage(photo.url);
                  setHistory([photo.url]);
              }
          }
      };

      prepareImage();

      return () => {
          isMounted = false;
          // Limpa blobs criados apenas se não for a URL original
          history.forEach(url => {
              if (url.startsWith('blob:') && url !== photo.url) URL.revokeObjectURL(url);
          });
      };
      // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [photo.id]); 

  // Sincronizar Tamanho do Canvas
  useEffect(() => {
    const updateCanvasSize = () => {
        if (containerRef.current && canvasRef.current && imgRef.current) {
            const img = imgRef.current;
            const canvas = canvasRef.current;
            if (img.clientWidth > 0 && img.clientHeight > 0) {
                canvas.width = img.clientWidth;
                canvas.height = img.clientHeight;
            }
        }
    };

    // Pequeno delay para garantir que a imagem carregou o layout
    const timer = setTimeout(updateCanvasSize, 100);
    window.addEventListener('resize', updateCanvasSize);

    return () => {
        window.removeEventListener('resize', updateCanvasSize);
        clearTimeout(timer);
    };
  }, [currentImage, mode, isFullScreen]);

  // Helper: Obter Coordenadas (Compatível com Mobile e Desktop)
  const getCoordinates = (e: React.MouseEvent | React.TouchEvent) => {
      const canvas = canvasRef.current;
      if (!canvas) return { x: 0, y: 0 };
      
      const rect = canvas.getBoundingClientRect();
      let clientX, clientY;

      if ('touches' in e) {
          clientX = e.touches[0].clientX;
          clientY = e.touches[0].clientY;
      } else {
          clientX = (e as React.MouseEvent).clientX;
          clientY = (e as React.MouseEvent).clientY;
      }

      return {
          x: clientX - rect.left,
          y: clientY - rect.top
      };
  };

  // Funções de Desenho
  const startDrawing = (e: React.MouseEvent<HTMLCanvasElement> | React.TouchEvent<HTMLCanvasElement>) => {
      if (mode !== ToolMode.MAGIC_ERASE) return;
      
      if (e.cancelable && 'touches' in e) e.preventDefault();

      setIsDrawing(true);
      const coords = getCoordinates(e);
      
      const ctx = canvasRef.current?.getContext('2d');
      if (ctx) {
          ctx.beginPath();
          ctx.moveTo(coords.x, coords.y);
          ctx.fillStyle = 'rgba(255, 0, 0, 0.6)';
          ctx.arc(coords.x, coords.y, brushSize / 2, 0, Math.PI * 2);
          ctx.fill();
          ctx.beginPath(); 
          ctx.moveTo(coords.x, coords.y);
      }
  };

  const draw = (e: React.MouseEvent<HTMLCanvasElement> | React.TouchEvent<HTMLCanvasElement>) => {
      if (!('touches' in e)) {
          const coords = getCoordinates(e);
          setCursorPos(coords);
      }

      if (!isDrawing || mode !== ToolMode.MAGIC_ERASE || !canvasRef.current) return;
      
      if (e.cancelable && 'touches' in e) e.preventDefault();

      const ctx = canvasRef.current.getContext('2d');
      if (!ctx) return;

      const coords = getCoordinates(e);

      ctx.lineWidth = brushSize;
      ctx.lineCap = 'round';
      ctx.lineJoin = 'round';
      ctx.strokeStyle = 'rgba(255, 0, 0, 0.6)'; 
      
      ctx.lineTo(coords.x, coords.y);
      ctx.stroke();
      
      ctx.beginPath();
      ctx.moveTo(coords.x, coords.y);
  };

  const stopDrawing = () => {
      setIsDrawing(false);
      const ctx = canvasRef.current?.getContext('2d');
      if (ctx) ctx.beginPath(); 
  };

  const clearMask = () => {
      if (canvasRef.current) {
          const ctx = canvasRef.current.getContext('2d');
          if (ctx) ctx.clearRect(0, 0, canvasRef.current.width, canvasRef.current.height);
      }
  };

  const handleUndo = () => {
      if (currentIndex > 0) {
          const newIndex = currentIndex - 1;
          setCurrentIndex(newIndex);
          setCurrentImage(history[newIndex]);
          clearMask();
      }
  };

  const getCompositedImage = async (): Promise<string> => {
      if (!imgRef.current || !canvasRef.current) return currentImage;

      const originalImg = imgRef.current;
      const maskCanvas = canvasRef.current;

      if (!originalImg.src.startsWith('data:') && !originalImg.src.startsWith('blob:')) {
          originalImg.crossOrigin = "anonymous";
      }

      const MAX_DIM = 1536;
      let width = originalImg.naturalWidth;
      let height = originalImg.naturalHeight;
      
      if (width > MAX_DIM || height > MAX_DIM) {
          const ratio = Math.min(MAX_DIM / width, MAX_DIM / height);
          width = Math.round(width * ratio);
          height = Math.round(height * ratio);
      }

      const tempCanvas = document.createElement('canvas');
      tempCanvas.width = width;
      tempCanvas.height = height;
      const ctx = tempCanvas.getContext('2d');
      if (!ctx) throw new Error("Could not create context");

      try {
          ctx.drawImage(originalImg, 0, 0, width, height);

          if (mode === ToolMode.MAGIC_ERASE) {
              ctx.drawImage(maskCanvas, 0, 0, width, height);
          }

          return tempCanvas.toDataURL('image/jpeg', 0.85);
      } catch (e) {
          console.error("Canvas Security Error:", e);
          throw new Error("Erro de Segurança: Não é possível editar esta imagem.");
      }
  };

  const handleEdit = async () => {
      // Validação para Virtual Staging
      if (mode === ToolMode.VIRTUAL_STAGING && !promptText.trim()) return;
      
      setIsProcessing(true);
      const editMode = mode === ToolMode.MAGIC_ERASE ? 'ERASE' : 'STAGE';
      
      setProcessingStage(editMode === 'ERASE' ? 'A remover objetos...' : 'A adicionar mobília...');

      try {
          let imageToSend = currentImage;
          let finalPrompt = promptText;

          if (editMode === 'ERASE') {
              imageToSend = await getCompositedImage();
              const userInstruction = promptText.trim() ? promptText : "the red marked object";
              finalPrompt = `Remove ${userInstruction}. It is covered by red strokes.`;
          } else {
              finalPrompt = `Add ${promptText}. Realistic lighting.`;
          }

          const newImageUrl = await editImageWithPrompt(imageToSend, finalPrompt, editMode);
          
          const newHistory = history.slice(0, currentIndex + 1);
          newHistory.push(newImageUrl);
          
          setHistory(newHistory);
          setCurrentIndex(newHistory.length - 1);
          setCurrentImage(newImageUrl);
          
          setPromptText('');
          clearMask();
      } catch (e: any) {
          console.error("Edit failed", e);
          alert(e.message || "Falha no processamento. Tente novamente.");
      } finally {
          setIsProcessing(false);
          setProcessingStage('');
      }
  };

  const handleSave = () => {
      onSave({ ...photo, url: currentImage });
  };

  if (!currentImage) {
      return (
          <div className="flex flex-col h-screen bg-gray-950 text-white items-center justify-center">
              <div className="w-10 h-10 border-t-2 border-blue-500 rounded-full animate-spin mb-4"></div>
              <p>A preparar imagem...</p>
          </div>
      );
  }

  return (
    <div className="flex flex-col h-screen bg-gray-950 text-white font-sans overscroll-none">
      {/* Header */}
      {!isFullScreen && (
        <div className="h-16 bg-gray-900 border-b border-gray-800 flex items-center justify-between px-4 z-20">
            <button onClick={onCancel} className="p-2 hover:bg-gray-800 rounded-full transition-colors"><X size={24} /></button>
            <span className="font-semibold">Editor AI</span>
            <div className="flex gap-2">
                <button onClick={() => setIsFullScreen(true)} className="p-2 hover:bg-gray-800 rounded-full transition-colors"><Maximize size={20} /></button>
                <button 
                    onClick={handleSave}
                    className="bg-blue-600 hover:bg-blue-700 px-4 py-1.5 rounded-full text-sm font-medium flex items-center gap-2 transition-colors"
                >
                    <Save size={16} /> Guardar
                </button>
            </div>
        </div>
      )}

      {/* Canvas Container */}
      <div className="flex-1 relative flex items-center justify-center bg-gray-950 overflow-hidden touch-none">
        
        {isFullScreen && (
            <button 
                onClick={() => setIsFullScreen(false)}
                className="absolute top-6 right-6 z-50 p-3 bg-black/50 hover:bg-black/70 rounded-full transition-colors backdrop-blur-sm"
            >
                <Minimize size={24} />
            </button>
        )}

        <div ref={containerRef} className="relative shadow-2xl inline-block max-w-full max-h-full">
              <img 
                ref={imgRef}
                src={currentImage} 
                alt="Edit Target" 
                crossOrigin="anonymous"
                className="max-w-full max-h-full object-contain block pointer-events-none select-none"
            />
            
            {/* Drawing Layer */}
            <canvas
                ref={canvasRef}
                className={`absolute inset-0 touch-none ${mode === ToolMode.MAGIC_ERASE ? 'cursor-crosshair' : 'pointer-events-none'}`}
                onMouseDown={startDrawing}
                onMouseMove={draw}
                onMouseUp={stopDrawing}
                onMouseLeave={stopDrawing}
                onTouchStart={startDrawing}
                onTouchMove={draw}
                onTouchEnd={stopDrawing}
            />
            
            {/* Desktop Brush Cursor */}
            {mode === ToolMode.MAGIC_ERASE && cursorPos && !('ontouchstart' in window) && (
                <div 
                    className="pointer-events-none absolute rounded-full border border-white/80 bg-red-500/20 z-10"
                    style={{
                        left: cursorPos.x,
                        top: cursorPos.y,
                        width: brushSize,
                        height: brushSize,
                        transform: 'translate(-50%, -50%)'
                    }}
                />
            )}
        </div>
        
        {isProcessing && (
            <div className="absolute inset-0 bg-black/80 backdrop-blur-sm flex flex-col items-center justify-center z-50">
                <div className="w-16 h-16 rounded-full border-t-2 border-l-2 border-blue-500 animate-spin mb-6"></div>
                <p className="text-xl font-light mt-4">{processingStage}</p>
            </div>
        )}
      </div>

      {/* Controls */}
      {!isFullScreen && (
        <div className="bg-gray-900 border-t border-gray-800 p-4 pb-8 md:pb-6 z-20 safe-area-pb">
            
            {/* Brush Size Slider */}
            {mode === ToolMode.MAGIC_ERASE && (
                <div className="mb-6 flex items-center gap-4 px-4 max-w-md mx-auto">
                    <Brush size={16} className="text-gray-400" />
                    <input 
                        type="range" min="10" max="80" 
                        value={brushSize} onChange={(e) => setBrushSize(Number(e.target.value))}
                        className="flex-1 h-1 bg-gray-700 rounded-lg appearance-none accent-blue-500 cursor-pointer"
                    />
                    <div className="w-6 h-6 rounded-full bg-red-500/50 border border-white/20" style={{ width: brushSize/2, height: brushSize/2 }}></div>
                </div>
            )}

            <div className="flex justify-between items-center max-w-lg mx-auto">
                {/* Tool Selection */}
                <div className="flex gap-2 bg-gray-800 p-1 rounded-xl">
                    <button 
                        onClick={() => setMode(ToolMode.MAGIC_ERASE)}
                        className={`flex flex-col items-center px-4 py-2 rounded-lg transition-all ${mode === ToolMode.MAGIC_ERASE ? 'bg-gray-700 text-blue-400 shadow-sm' : 'text-gray-400 hover:text-gray-200'}`}
                    >
                        <Eraser size={20} />
                        <span className="text-[10px] mt-1 font-medium">Apagar</span>
                    </button>
                    <button 
                        onClick={() => setMode(ToolMode.VIRTUAL_STAGING)}
                        className={`flex flex-col items-center px-4 py-2 rounded-lg transition-all ${mode === ToolMode.VIRTUAL_STAGING ? 'bg-gray-700 text-blue-400 shadow-sm' : 'text-gray-400 hover:text-gray-200'}`}
                    >
                        <Sofa size={20} />
                        <span className="text-[10px] mt-1 font-medium">Decorar</span>
                    </button>
                </div>

                {/* Actions */}
                <div className="flex items-center gap-3">
                    <button 
                        onClick={handleUndo} 
                        disabled={currentIndex === 0} 
                        className="p-3 bg-gray-800 hover:bg-gray-700 rounded-full disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
                    >
                        <Undo size={20} />
                    </button>
                    
                    {mode === ToolMode.MAGIC_ERASE ? (
                        <button 
                            onClick={handleEdit} 
                            className="px-6 py-3 bg-blue-600 hover:bg-blue-700 rounded-full font-bold flex items-center gap-2 transition-transform active:scale-95 shadow-lg shadow-blue-900/20"
                        >
                            <Wand2 size={18} /> 
                            <span>Aplicar</span>
                        </button>
                    ) : (
                        <div className="flex gap-2 items-center bg-gray-800 p-1 rounded-full pl-4 pr-1">
                            <input 
                                type="text" 
                                value={promptText}
                                onChange={(e) => setPromptText(e.target.value)}
                                placeholder="O que adicionar?"
                                className="bg-transparent border-none text-sm w-32 focus:ring-0 text-white placeholder-gray-500"
                            />
                            <button 
                                onClick={handleEdit} 
                                disabled={!promptText.trim()} 
                                className="p-2 bg-blue-600 hover:bg-blue-700 rounded-full disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
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
