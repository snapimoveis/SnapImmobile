import React, { useState, useEffect } from 'react';
import { ArrowLeft, Camera, Video, Settings, Share2, MoreHorizontal, Pencil, Check } from 'lucide-react';
import { Project, Photo } from '../types';
// Certifique-se de que o componente Button existe em ui/index.tsx
import { Button } from './ui'; 

interface ProjectDetailProps {
  initialProject: Project;
  onBack: () => void;
  onAddPhoto: () => void;
  onEditPhoto: (photo: Photo) => void;
  onUpdateProject: (project: Project) => void;
  onViewTour: () => void;
}

// AQUI ESTÁ A EXPORTAÇÃO CORRETA
export const ProjectDetail: React.FC<ProjectDetailProps> = ({ 
  initialProject, 
  onBack, 
  onAddPhoto, 
  onEditPhoto
}) => {
  const [project, setProject] = useState<Project>(initialProject);

  useEffect(() => {
    setProject(initialProject);
  }, [initialProject]);

  const displayPhotos = project.photos || [];

  return (
    <div className="min-h-screen bg-brand-gray-50 dark:bg-black flex flex-col transition-colors duration-300 pb-24 md:pb-0">
      
      {/* HEADER */}
      <header className="bg-white dark:bg-[#121212] px-4 py-4 sticky top-0 z-30 shadow-sm border-b border-gray-200 dark:border-white/5">
        <div className="max-w-7xl mx-auto">
            <div className="flex items-center justify-between mb-4">
                <button onClick={onBack} className="p-2 -ml-2 rounded-full hover:bg-gray-100 dark:hover:bg-white/10 transition-colors text-gray-600 dark:text-gray-300">
                    <ArrowLeft size={24} />
                </button>
                
                <div className="text-center">
                    <h1 className="text-base font-bold text-gray-900 dark:text-white">{project.title}</h1>
                    <p className="text-xs text-gray-500 dark:text-gray-400">{project.address}</p>
                </div>

                <button className="p-2 -mr-2 rounded-full hover:bg-gray-100 dark:hover:bg-white/10 transition-colors text-brand-orange">
                    <Check size={24} />
                </button>
            </div>

            {/* BARRA DE AÇÕES RÁPIDAS */}
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
                {displayPhotos.map((photo: Photo) => (
                    <div 
                        key={photo.id}
                        onClick={() => onEditPhoto(photo)}
                        className="relative aspect-square bg-gray-200 dark:bg-white/5 rounded-xl overflow-hidden cursor-pointer group shadow-sm hover:shadow-md transition-all"
                    >
                    <img 
                        src={photo.url} 
                        alt="thumb" 
                        className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110" 
                        loading="lazy" 
                    />
                    <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-colors" />
                    </div>
                ))}
            </div>
          )}
      </main>

      {/* Botão Flutuante */}
      <div className="fixed bottom-8 left-0 right-0 flex justify-center px-4 z-20 pointer-events-none">
        <button 
            onClick={onAddPhoto}
            className="pointer-events-auto bg-brand-orange hover:bg-brand-orange-hover text-white px-8 py-3.5 rounded-full font-bold text-sm shadow-lg shadow-orange-500/30 active:scale-95 transition-transform flex items-center gap-2"
        >
            Iniciar Captura
        </button>
      </div>

    </div>
  );
};
