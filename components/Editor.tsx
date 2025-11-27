
import React, { useState, useRef, useEffect } from 'react';
import { Photo, ToolMode } from '../types';
import { Wand2, Sofa, Eraser, Check, X, Undo, Save, Sparkles, ScanEye, Trash2, Brush, Maximize, Minimize } from 'lucide-react';
import { editImageWithPrompt } from '../services/geminiService';

interface EditorProps {
  photo: Photo;
  onSave: (updatedPhoto: Photo) => void;
  onCancel: () => void;
}

export const Editor: React.FC<EditorProps> = ({ photo, onSave, onCancel }) => {
  const [currentImage, setCurrentImage] = useState(photo.url);
  const [mode, setMode] = useState<ToolMode>(ToolMode.NONE);
  const [promptText, setPromptText] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [processingStage, setProcessingStage] = useState('');
  const [isFullScreen, setIsFullScreen] = useState(false);
  
  // Brush State
  const [brushSize, setBrushSize] = useState(20);
  const [isDrawing, setIsDrawing] = useState(false);
  const [cursorPos, setCursorPos] = useState<{x: number, y: number} | null>(null);
  
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const imgRef = useRef<HTMLImageElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  // History stack for undo
  const [history, setHistory] = useState<string[]>([photo.url]);

  // Initialize Canvas Size on Image Load/Resize
  useEffect(() => {
    const updateCanvasSize = () => {
        if (containerRef.current && canvasRef.current && imgRef.current) {
            const img = imgRef.current;
            const canvas = canvasRef.current;
            // Match canvas resolution to displayed image size for accurate mouse tracking
            canvas.width = img.clientWidth;
            canvas.height = img.clientHeight;
        }
    };

    window.addEventListener('resize', updateCanvasSize);
    // Small timeout to ensure image has rendered layout
    setTimeout(updateCanvasSize, 100); 

    return () => window.removeEventListener('resize', updateCanvasSize);
  }, [currentImage, mode, isFullScreen]);

  // Handle Escape key to exit full screen
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isFullScreen) {
        setIsFullScreen(false);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isFullScreen]);

  const handleUndo = () => {
      if (history.length > 1) {
          const newHistory = [...history];
          newHistory.pop();
          setHistory(newHistory);
          setCurrentImage(newHistory[newHistory.length - 1]);
          clearMask(); // Clear any mask when undoing image
      }
  };

  const clearMask = () => {
      if (canvasRef.current) {
          const ctx = canvasRef.current.getContext('2d');
          if (ctx) ctx.clearRect(0, 0, canvasRef.current.width, canvasRef.current.height);
      }
  };

  // Drawing Handlers
  const startDrawing = (e: React.MouseEvent<HTMLCanvasElement> | React.TouchEvent<HTMLCanvasElement>) => {
      if (mode !== ToolMode.MAGIC_ERASE) return;
      setIsDrawing(true);
      handleMouseMove(e); // Update position immediately
      draw(e);
  };

  const stopDrawing = () => {
      setIsDrawing(false);
      if (canvasRef.current) {
          const ctx = canvasRef.current.getContext('2d');
          if (ctx) ctx.beginPath(); // Reset path
      }
  };

  const handleMouseMove = (e: React.MouseEvent<HTMLCanvasElement> | React.TouchEvent<HTMLCanvasElement>) => {
      // Track cursor position for visual indicator
      if (canvasRef.current) {
          const rect = canvasRef.current.getBoundingClientRect();
          let clientX, clientY;
          if ('touches' in e) {
              clientX = e.touches[0].clientX;
              clientY = e.touches[0].clientY;
          } else {
              clientX = (e as React.MouseEvent).clientX;
              clientY = (e as React.MouseEvent).clientY;
          }
          setCursorPos({ x: clientX - rect.left, y: clientY - rect.top });
      }

      // Continue drawing if active
      draw(e);
  };

  const handleMouseLeave = () => {
      setCursorPos(null);
      stopDrawing();
  };

  const draw = (e: React.MouseEvent<HTMLCanvasElement> | React.TouchEvent<HTMLCanvasElement>) => {
      if (!isDrawing || mode !== ToolMode.MAGIC_ERASE || !canvasRef.current) return;

      const canvas = canvasRef.current;
      const ctx = canvas.getContext('2d');
      if (!ctx) return;

      const rect = canvas.getBoundingClientRect();
      let clientX, clientY;

      if ('touches' in e) {
          clientX = e.touches[0].clientX;
          clientY = e.touches[0].clientY;
      } else {
          clientX = (e as React.MouseEvent).clientX;
          clientY = (e as React.MouseEvent).clientY;
      }

      const x = clientX - rect.left;
      const y = clientY - rect.top;

      ctx.lineWidth = brushSize;
      ctx.lineCap = 'round';
      ctx.strokeStyle = 'rgba(255, 0, 0, 0.8)'; // Stronger Red for better detection
      
      ctx.lineTo(x, y);
      ctx.stroke();
      ctx.beginPath();
      ctx.moveTo(x, y);
  };

  const getCompositedImage = async (): Promise<string> => {
      if (!imgRef.current || !canvasRef.current) return currentImage;

      const originalImg = imgRef.current;
      const maskCanvas = canvasRef.current;

      // Calculate scaling to limit max dimension to 1536px for AI performance
      // This prevents timeouts with 4K images while keeping enough detail for editing
      const MAX_DIM = 1536;
      let width = originalImg.naturalWidth;
      let height = originalImg.naturalHeight;
      
      if (width > MAX_DIM || height > MAX_DIM) {
          const ratio = Math.min(MAX_DIM / width, MAX_DIM / height);
          width = Math.round(width * ratio);
          height = Math.round(height * ratio);
      }

      // Create a temporary canvas
      const tempCanvas = document.createElement('canvas');
      tempCanvas.width = width;
      tempCanvas.height = height;
      const ctx = tempCanvas.getContext('2d');
      if (!ctx) return currentImage;

      // 1. Draw Original Image (Scaled)
      ctx.drawImage(originalImg, 0, 0, width, height);

      // 2. Draw Mask (Scaled)
      if (mode === ToolMode.MAGIC_ERASE) {
          ctx.drawImage(maskCanvas, 0, 0, width, height);
      }

      return tempCanvas.toDataURL('image/jpeg', 0.85);
  };

  const handleEdit = async () => {
      // For erase, we don't strictly need text if we have a mask, but a text hint helps
      // For staging, we need text.
      if (mode === ToolMode.VIRTUAL_STAGING && !promptText.trim()) return;
      
      setIsProcessing(true);
      
      const editMode = mode === ToolMode.MAGIC_ERASE ? 'ERASE' : 'STAGE';
      
      if (editMode === 'ERASE') {
          setProcessingStage('A Processar Máscara e Inpainting...');
      } else {
          setProcessingStage('A Ajustar Perspetiva e Renderização...');
      }

      // If we have a mask, we need to send the composited image
      let imageToSend = currentImage;
      let finalPrompt = promptText;

      if (editMode === 'ERASE') {
          imageToSend = await getCompositedImage();
          // If user didn't type anything but drew a mask, provide a default prompt
          const userInstruction = promptText.trim() ? promptText : "the red marked object";
          finalPrompt = `INPAINTING: Remove ${userInstruction}. It is highlighted in RED. Replace with natural background.`;
      } else {
          finalPrompt = `Add ${promptText}. Ensure it sits on the floor correctly with contact shadows consistent with the room's lighting direction.`;
      }

      try {
          const newImageUrl = await editImageWithPrompt(imageToSend, finalPrompt, editMode);
          setHistory(prev => [...prev, newImageUrl]);
          setCurrentImage(newImageUrl);
          setPromptText('');
          clearMask();
          setMode(ToolMode.NONE); 
      } catch (e) {
          console.error("Edit failed", e);
          alert("Falha no processamento IA. Por favor tente novamente.");
      } finally {
          setIsProcessing(false);
          setProcessingStage('');
      }
  };

  const handleSave = () => {
      onSave({
          ...photo,
          url: currentImage,
      });
  };

  return (
    <div className="flex flex-col h-screen bg-gray-950 text-white font-sans">
      {/* Toolbar - Hidden in Full Screen */}
      {!isFullScreen && (
        <div className="h-16 bg-gray-900 border-b border-gray-800 flex items-center justify-between px-4 shadow-md z-10">
            <div className="flex items-center gap-4">
                <button onClick={onCancel} className="text-gray-400 hover:text-white transition-colors">
                    <X className="w-6 h-6" />
                </button>
                <div className="flex flex-col">
                    <span className="font-semibold tracking-tight text-gray-100">Editor Snap</span>
                    <span className="text-[10px] font-medium text-blue-400 uppercase tracking-wider">Gemini Vision Pro</span>
                </div>
            </div>

            <div className="flex items-center gap-3">
                <button 
                    onClick={() => setIsFullScreen(true)}
                    className="p-2 rounded-lg hover:bg-gray-800 transition-colors text-gray-300"
                    title="Ecrã Inteiro"
                >
                    <Maximize className="w-5 h-5" />
                </button>
                <button 
                    onClick={handleUndo} 
                    disabled={history.length <= 1}
                    className="p-2 rounded-lg hover:bg-gray-800 disabled:opacity-30 transition-colors text-gray-300"
                    title="Desfazer"
                >
                    <Undo className="w-5 h-5" />
                </button>
                <button 
                    onClick={handleSave}
                    className="bg-blue-600 hover:bg-blue-50 text-white px-5 py-1.5 rounded-full text-sm font-medium flex items-center gap-2 shadow-lg shadow-blue-900/20 transition-all"
                >
                    <Save className="w-4 h-4" />
                    Guardar Alterações
                </button>
            </div>
        </div>
      )}

      {/* Main Canvas Area */}
      <div className={`flex-1 relative flex items-center justify-center bg-[url('https://www.transparenttextures.com/patterns/dark-matter.png')] bg-gray-950 p-6 overflow-hidden ${isFullScreen ? 'z-50' : ''}`}>
        
        {/* Floating Exit Full Screen Button */}
        {isFullScreen && (
            <button 
                onClick={() => setIsFullScreen(false)}
                className="absolute top-6 right-6 z-50 p-3 bg-black/50 backdrop-blur-md border border-white/10 rounded-full text-white hover:bg-black/70 transition-all"
                title="Sair do Ecrã Inteiro (Esc)"
            >
                <Minimize className="w-6 h-6" />
            </button>
        )}

        <div ref={containerRef} className="relative max-w-full max-h-full shadow-2xl shadow-black/50 rounded-lg overflow-hidden inline-block">
             <img 
                ref={imgRef}
                src={currentImage} 
                alt="Editing" 
                onLoad={() => {
                    // Trigger resize to match canvas
                    if(canvasRef.current && imgRef.current) {
                        canvasRef.current.width = imgRef.current.clientWidth;
                        canvasRef.current.height = imgRef.current.clientHeight;
                    }
                }}
                className="max-w-full max-h-full object-contain block select-none"
                draggable={false}
            />
            
            {/* Magic Erase Canvas Overlay */}
            <canvas
                ref={canvasRef}
                className={`absolute inset-0 touch-none ${mode === ToolMode.MAGIC_ERASE ? 'cursor-none' : 'pointer-events-none'}`}
                onMouseDown={startDrawing}
                onMouseMove={handleMouseMove}
                onMouseUp={stopDrawing}
                onMouseLeave={handleMouseLeave}
                onTouchStart={startDrawing}
                onTouchMove={handleMouseMove}
                onTouchEnd={stopDrawing}
            />
            
            {/* Brush Cursor Indicator */}
            {mode === ToolMode.MAGIC_ERASE && cursorPos && (
                <div 
                    className="pointer-events-none absolute rounded-full border border-white/80 bg-red-500/20 shadow-[0_0_10px_rgba(255,0,0,0.3)] z-50"
                    style={{
                        left: cursorPos.x,
                        top: cursorPos.y,
                        width: brushSize,
                        height: brushSize,
                        transform: 'translate(-50%, -50%)'
                    }}
                />
            )}

            {/* Simulated Grid Overlay for Staging Mode */}
            {mode === ToolMode.VIRTUAL_STAGING && !isProcessing && (
                <div className="absolute inset-0 pointer-events-none opacity-20 bg-[linear-gradient(rgba(66,153,225,0.2)_1px,transparent_1px),linear-gradient(90deg,rgba(66,153,225,0.2)_1px,transparent_1px)] bg-[size:40px_40px] [mask-image:linear-gradient(to_bottom,transparent,black)]"></div>
            )}
        </div>
        
        {isProcessing && (
            <div className="absolute inset-0 bg-black/70 backdrop-blur-sm flex flex-col items-center justify-center z-50">
                <div className="relative mb-6">
                    <div className="w-16 h-16 rounded-full border-t-2 border-l-2 border-blue-500 animate-spin"></div>
                    <div className="absolute inset-0 flex items-center justify-center">
                        <Sparkles className="w-6 h-6 text-yellow-400 animate-pulse" />
                    </div>
                </div>
                <p className="text-xl font-light tracking-wide text-white">{processingStage}</p>
                <p className="text-xs text-gray-500 mt-2 uppercase tracking-widest">Powered by Snap AI</p>
            </div>
        )}
      </div>

      {/* Tools Panel - Hidden in Full Screen */}
      {!isFullScreen && (
        <div className="bg-gray-900 border-t border-gray-800 p-6">
            {mode === ToolMode.NONE ? (
                <div className="flex justify-center gap-8 max-w-2xl mx-auto">
                    <button 
                        onClick={() => setMode(ToolMode.MAGIC_ERASE)}
                        className="group flex flex-col items-center gap-3 text-gray-400 hover:text-white transition-colors"
                    >
                        <div className="w-16 h-16 rounded-2xl bg-gray-800 group-hover:bg-gray-700 border border-gray-700 group-hover:border-gray-600 flex items-center justify-center transition-all shadow-lg">
                            <Eraser className="w-7 h-7 text-pink-500" />
                        </div>
                        <span className="text-sm font-medium">Apagar Mágico</span>
                    </button>
                    
                    <div className="w-px h-20 bg-gray-800 mx-4"></div>

                    <button 
                        onClick={() => setMode(ToolMode.VIRTUAL_STAGING)}
                        className="group flex flex-col items-center gap-3 text-gray-400 hover:text-white transition-colors"
                    >
                        <div className="w-16 h-16 rounded-2xl bg-gray-800 group-hover:bg-gray-700 border border-gray-700 group-hover:border-gray-600 flex items-center justify-center transition-all shadow-lg">
                            <Sofa className="w-7 h-7 text-blue-500" />
                        </div>
                        <span className="text-sm font-medium">Home Staging Virtual</span>
                    </button>
                </div>
            ) : (
                <div className="max-w-3xl mx-auto w-full animate-in slide-in-from-bottom-4 duration-300">
                    <div className="flex items-center justify-between mb-4">
                        <div className="flex items-center gap-3">
                            <div className={`p-2 rounded-lg ${mode === ToolMode.MAGIC_ERASE ? 'bg-pink-500/10 text-pink-400' : 'bg-blue-500/10 text-blue-400'}`}>
                                {mode === ToolMode.MAGIC_ERASE ? <Eraser className="w-5 h-5"/> : <Sofa className="w-5 h-5"/>}
                            </div>
                            <div>
                                <h3 className="text-sm font-medium text-white">
                                    {mode === ToolMode.MAGIC_ERASE ? 'Remoção de Objetos' : 'Home Staging Virtual'}
                                </h3>
                                <p className="text-xs text-gray-500">
                                    {mode === ToolMode.MAGIC_ERASE ? 'Pincele sobre os objetos a remover' : 'Descreva a mobília a adicionar'}
                                </p>
                            </div>
                        </div>
                        <div className="flex items-center gap-2">
                            {mode === ToolMode.MAGIC_ERASE && (
                                <button onClick={clearMask} className="text-xs font-medium text-gray-400 hover:text-white px-3 py-1.5">
                                    Limpar Máscara
                                </button>
                            )}
                            <button onClick={() => { setMode(ToolMode.NONE); clearMask(); }} className="text-xs font-medium text-gray-400 hover:text-white bg-gray-800 px-3 py-1.5 rounded-full transition-colors">Cancelar</button>
                        </div>
                    </div>
                    
                    {/* Specific Controls for Magic Erase */}
                    {mode === ToolMode.MAGIC_ERASE && (
                        <div className="mb-4 flex items-center gap-4 p-3 bg-gray-800/50 rounded-xl border border-gray-800">
                            <Brush className="w-4 h-4 text-gray-400" />
                            <input 
                                type="range" 
                                min="5" 
                                max="100" 
                                value={brushSize} 
                                onChange={(e) => setBrushSize(Number(e.target.value))}
                                className="flex-1 h-1 bg-gray-700 rounded-lg appearance-none cursor-pointer [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:w-4 [&::-webkit-slider-thumb]:h-4 [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:bg-pink-500"
                            />
                            <div className="w-8 text-center text-xs text-gray-400">{brushSize}px</div>
                        </div>
                    )}

                    <div className="relative flex gap-2">
                        <div className="relative flex-1">
                            <div className="absolute inset-y-0 left-3 flex items-center pointer-events-none">
                                {mode === ToolMode.MAGIC_ERASE ? <ScanEye className="w-5 h-5 text-gray-500"/> : <Wand2 className="w-5 h-5 text-gray-500"/>}
                            </div>
                            <input 
                                type="text" 
                                value={promptText}
                                onChange={(e) => setPromptText(e.target.value)}
                                placeholder={mode === ToolMode.MAGIC_ERASE ? "Opcional: Descreva a remoção (ou use o pincel)" : "Descreva a mobília (ex: sofá moderno cinzento)"}
                                className="w-full bg-gray-800 border border-gray-700 rounded-xl pl-10 pr-4 py-4 text-white placeholder-gray-500 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-all"
                                onKeyDown={(e) => e.key === 'Enter' && handleEdit()}
                                autoFocus={mode === ToolMode.VIRTUAL_STAGING} // Auto focus only for staging
                            />
                        </div>
                        <button 
                            onClick={handleEdit}
                            // For Magic Erase, allow empty prompt if user drew something (we assume they drew if mode is erase, simple check)
                            disabled={mode === ToolMode.VIRTUAL_STAGING && !promptText.trim()}
                            className="bg-gradient-to-r from-blue-600 to-indigo-600 text-white px-8 rounded-xl font-medium hover:shadow-lg hover:shadow-blue-500/25 disabled:opacity-50 disabled:shadow-none flex items-center gap-2 transition-all transform active:scale-95"
                        >
                            Gerar
                            <Sparkles className="w-4 h-4" />
                        </button>
                    </div>
                    <div className="mt-3 flex gap-4">
                        <span className="text-[10px] text-gray-500 flex items-center gap-1">
                            <Check className="w-3 h-3 text-green-500" /> Perspetiva
                        </span>
                        <span className="text-[10px] text-gray-500 flex items-center gap-1">
                            <Check className="w-3 h-3 text-green-500" /> Iluminação
                        </span>
                    </div>
                </div>
            )}
        </div>
      )}
    </div>
  );
};
