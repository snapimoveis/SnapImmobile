import React, { useState, useEffect } from 'react';
import { ArrowLeft, Camera, Video, Settings, Check, Download, Trash2, X, CheckSquare, Square } from 'lucide-react';
import { Project, Photo } from '../types';
import JSZip from 'jszip';
import { saveAs } from 'file-saver';

interface ProjectDetailProps {
  initialProject: Project;
  onBack: () => void;
  onAddPhoto: () => void;
  onEditPhoto: (photo: Photo) => void;
  onUpdateProject: (project: Project) => void;
  onViewTour: () => void;
}

const ProjectDetailComponent: React.FC<ProjectDetailProps> = ({ 
  initialProject, 
  onBack, 
  onAddPhoto, 
  onEditPhoto,
  onUpdateProject // Necessário para salvar a remoção de fotos
}) => {
  const [project, setProject] = useState<Project>(initialProject);
  const [isSelectionMode, setIsSelectionMode] = useState(false);
  const [selectedPhotoIds, setSelectedPhotoIds] = useState<Set<string>>(new Set());
  const [isDownloading, setIsDownloading] = useState(false);

  useEffect(() => {
    setProject(initialProject);
  }, [initialProject]);

  const displayPhotos = project.photos || [];

  // === GESTÃO DE SELEÇÃO ===
  const toggleSelectionMode = () => {
      setIsSelectionMode(!isSelectionMode);
      setSelectedPhotoIds(new Set()); // Limpa seleção ao sair
  };

  const togglePhotoSelection = (photoId: string) => {
      const newSelection = new Set(selectedPhotoIds);
      if (newSelection.has(photoId)) {
          newSelection.delete(photoId);
      } else {
          newSelection.add(photoId);
      }
      setSelectedPhotoIds(newSelection);
  };

  const selectAll = () => {
      if (selectedPhotoIds.size === displayPhotos.length) {
          setSelectedPhotoIds(new Set());
      } else {
          const allIds = new Set(displayPhotos.map(p => p.id));
          setSelectedPhotoIds(allIds);
      }
  };

  // === DOWNLOAD ===
  const handleDownloadSelected = async () => {
      if (selectedPhotoIds.size === 0) return;
      setIsDownloading(true);

      try {
          const selectedPhotos = displayPhotos.filter(p => selectedPhotoIds.has(p.id));

          // Se for apenas 1 foto, baixa direto sem ZIP
          if (selectedPhotos.length === 1) {
              const photo = selectedPhotos[0];
              const response = await fetch(photo.url, { mode: 'cors' });
              const blob = await response.blob();
              const fileName = `snap_${project.title}_${Date.now()}.jpg`.replace(/\s+/g, '_');
              saveAs(blob, fileName);
          } else {
              // Múltiplas fotos -> ZIP
              const zip = new JSZip();
              const folder = zip.folder(project.title.replace(/[^a-z0-9]/gi, '_')) || zip;

              const promises = selectedPhotos.map(async (photo, index) => {
                  try {
                      const response = await fetch(photo.url, { mode: 'cors' });
                      const blob = await response.blob();
                      const name = `foto_${index + 1}.jpg`;
                      folder.file(name, blob);
                  } catch (e) {
                      console.error("Erro ao baixar foto", e);
                  }
              });

              await Promise.all(promises);
              const content = await zip.generateAsync({ type: "blob" });
              saveAs(content, `${project.title}_selecao.zip`);
          }
          
          // Opcional: Sair do modo de seleção após download
          setIsSelectionMode(false);
          setSelectedPhotoIds(new Set());

      } catch (error) {
          alert("Erro ao fazer download. Tente novamente.");
          console.error(error);
      } finally {
          setIsDownloading(false);
      }
  };

  // === APAGAR SELECIONADAS (Bónus útil) ===
  const handleDeleteSelected = () => {
      if (confirm(`Tem certeza que deseja apagar ${selectedPhotoIds.size} fotos?`)) {
          const remainingPhotos = displayPhotos.filter(p => !selectedPhotoIds.has(p.id));
          const updatedProject = { ...project, photos: remainingPhotos };
          
          setProject(updatedProject);
          onUpdateProject(updatedProject); // Salva no Firebase através do App.tsx
          
          setIsSelectionMode(false);
          setSelectedPhotoIds(new Set());
      }
  };

  return (
    <div className="min-h-screen bg-brand-gray-50 dark:bg-black flex flex-col transition-colors duration-300 pb-24 md:pb-0">
      
      {/* HEADER */}
      <header className="bg-white dark:bg-[#121212] px-4 py-4 sticky top-0 z-30 shadow-sm border-b border-gray-200 dark:border-white/5">
        <div className="max-w-7xl mx-auto">
            <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2">
                    <button onClick={onBack} className="p-2 -ml-2 rounded-full hover:bg-gray-100 dark:hover:bg-white/10 transition-colors text-gray-600 dark:text-gray-300">
                        <ArrowLeft size={24} />
                    </button>
                    {isSelectionMode && (
                        <span className="text-sm font-bold text-brand-purple ml-2">
                            {selectedPhotoIds.size} selecionada(s)
                        </span>
                    )}
                </div>
                
                <div className="text-center">
                    <h1 className="text-base font-bold text-gray-900 dark:text-white truncate max-w-[150px]">{project.title}</h1>
                    {!isSelectionMode && <p className="text-xs text-gray-500 dark:text-gray-400 truncate max-w-[150px]">{project.address}</p>}
                </div>

                <button 
                    onClick={toggleSelectionMode}
                    className={`p-2 -mr-2 rounded-full hover:bg-gray-100 dark:hover:bg-white/10 transition-colors ${isSelectionMode ? 'text-brand-purple bg-brand-purple/10' : 'text-gray-600 dark:text-white'}`}
                >
                    {isSelectionMode ? <Check size={24} /> : <CheckSquare size={24} />}
                </button>
            </div>

            {/* BARRA DE AÇÕES RÁPIDAS (Escondida em modo de seleção) */}
            {!isSelectionMode && (
                <div className="grid grid-cols-3 gap-3">
                    <button className="bg-brand-orange hover:bg-brand-orange-hover text-white rounded-xl py-3 flex items-center justify-center shadow-md transition-transform active:scale-95">
                        <Settings size={20} fill="currentColor" />
                    </button>
                    <button 
                        onClick={onAddPhoto}
                        className="bg-brand-orange hover:bg-brand-orange-hover text-white rounded-xl py-3 flex items-center justify-center shadow-md transition-transform active:scale-95"
                    >
                        <Camera size={20} fill="currentColor" />
                    </button>
                    <button className="bg-brand-orange hover:bg-brand-orange-hover text-white rounded-xl py-3 flex items-center justify-center shadow-md transition-transform active:scale-95">
                        <Video size={20} fill="currentColor" />
                    </button>
                </div>
            )}

            {/* BARRA DE AÇÕES DE SELEÇÃO */}
            {isSelectionMode && (
                <div className="flex justify-between items-center gap-3 animate-in fade-in slide-in-from-top-2">
                    <button 
                        onClick={selectAll} 
                        className="flex-1 bg-gray-100 dark:bg-white/10 text-gray-700 dark:text-white py-3 rounded-xl text-sm font-medium flex items-center justify-center gap-2"
                    >
                        {selectedPhotoIds.size === displayPhotos.length ? <CheckSquare size={18} /> : <Square size={18} />}
                        Todos
                    </button>
                    
                    <button 
                        onClick={handleDeleteSelected}
                        disabled={selectedPhotoIds.size === 0}
                        className="flex-1 bg-red-100 text-red-600 py-3 rounded-xl text-sm font-medium flex items-center justify-center gap-2 disabled:opacity-50"
                    >
                        <Trash2 size={18} />
                        Apagar
                    </button>
                    
                    <button 
                        onClick={handleDownloadSelected}
                        disabled={selectedPhotoIds.size === 0 || isDownloading}
                        className="flex-1 bg-brand-purple text-white py-3 rounded-xl text-sm font-medium flex items-center justify-center gap-2 disabled:opacity-50"
                    >
                        {isDownloading ? (
                             <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                        ) : (
                             <Download size={18} />
                        )}
                        Baixar
                    </button>
                </div>
            )}
        </div>
      </header>

      {/* GRID DE CONTEÚDO */}
      <main className="flex-1 p-4 max-w-7xl mx-auto w-full">
          {displayPhotos.length === 0 ? (
             <div className="flex flex-col items-center justify-center py-20 text-center">
                <div className="w-20 h-20 bg-gray-200 dark:bg-white/10 rounded-full flex items-center justify-center mb-4">
                    <Camera size={32} className="text-gray-400" />
                </div>
                <p className="text-gray-500 dark:text-gray-400 font-medium">Ainda não há fotos.</p>
                <p className="text-xs text-gray-400 mt-1">Toque no botão de câmera acima para começar.</p>
             </div>
          ) : (
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                {displayPhotos.map((photo: Photo) => {
                    const isSelected = selectedPhotoIds.has(photo.id);
                    return (
                        <div 
                            key={photo.id}
                            onClick={() => {
                                if (isSelectionMode) {
                                    togglePhotoSelection(photo.id);
                                } else {
                                    onEditPhoto(photo);
                                }
                            }}
                            className={`
                                relative aspect-square bg-gray-200 dark:bg-white/5 rounded-xl overflow-hidden cursor-pointer group shadow-sm transition-all
                                ${isSelectionMode && isSelected ? 'ring-4 ring-brand-purple ring-offset-2 dark:ring-offset-black' : ''}
                            `}
                        >
                            <img 
                                src={photo.url} 
                                alt="thumb" 
                                className={`w-full h-full object-cover transition-transform duration-500 ${isSelectionMode && !isSelected ? 'opacity-50 scale-95' : 'group-hover:scale-110'}`} 
                                loading="lazy" 
                            />
                            
                            {/* Indicador de Seleção */}
                            {isSelectionMode && (
                                <div className={`absolute top-2 right-2 w-6 h-6 rounded-full flex items-center justify-center ${isSelected ? 'bg-brand-purple text-white' : 'bg-black/40 text-white/50 border-2 border-white'}`}>
                                    {isSelected && <Check size={14} strokeWidth={3} />}
                                </div>
                            )}
                            
                            {!isSelectionMode && <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-colors" />}
                        </div>
                    );
                })}
            </div>
          )}
      </main>

      {/* Botão Flutuante (Esconder em modo de seleção para não atrapalhar) */}
      {!isSelectionMode && (
          <div className="fixed bottom-8 left-0 right-0 flex justify-center px-4 z-20 pointer-events-none">
            <button 
                onClick={onAddPhoto}
                className="pointer-events-auto bg-brand-orange hover:bg-brand-orange-hover text-white px-8 py-3.5 rounded-full font-bold text-sm shadow-lg shadow-orange-500/30 active:scale-95 transition-transform flex items-center gap-2"
            >
                Iniciar Captura
            </button>
          </div>
      )}

    </div>
  );
};

// Exportação dupla para compatibilidade
export const ProjectDetail = ProjectDetailComponent;
export default ProjectDetailComponent;
