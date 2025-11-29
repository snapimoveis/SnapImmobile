import React, { useState, useEffect } from 'react';
import { 
  ArrowLeft, 
  Menu, // Icone de Hamburguer/Lista
  Camera, 
  Play
} from 'lucide-react';
import { Project, Photo } from '../types';

interface ProjectDetailProps {
  initialProject: Project;
  onBack: () => void;
  onAddPhoto: () => void;
  onEditPhoto: (photo: Photo) => void;
  onUpdateProject: (project: Project) => void;
  onViewTour: () => void;
}

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

  // Formatação de data estilo "08 outubro, 2025"
  const dateStr = new Date(project.createdAt).toLocaleDateString('pt-PT', { day: 'numeric', month: 'long', year: 'numeric' });

  return (
    <div className="min-h-screen bg-white dark:bg-[#121212] flex flex-col transition-colors duration-300">
      
      {/* --- HEADER --- */}
      {/* Fundo escuro conforme imagem */}
      <header className="bg-gray-50 dark:bg-[#1a1a1a] pt-4 px-4 pb-4 sticky top-0 z-20">
        <div className="flex items-center justify-between mb-4 text-gray-900 dark:text-white">
            <button onClick={onBack} className="p-2 -ml-2">
                <ArrowLeft size={24} />
            </button>
            
            <div className="text-center">
                <h1 className="text-base font-bold">{project.title}</h1>
                <p className="text-xs text-gray-500 dark:text-gray-400">{dateStr}</p>
            </div>

            <button className="p-2 -mr-2">
                <Menu size={24} />
            </button>
        </div>

        {/* --- ABAS GRANDES (Azul e Cinza) --- */}
        <div className="grid grid-cols-2 gap-3 h-12">
            {/* Aba Fotos (Azul) */}
            <button className="bg-blue-600 rounded-md flex items-center justify-center gap-2 text-white shadow-sm relative overflow-hidden">
                <div className="flex items-center gap-2 z-10">
                    <Camera size={18} fill="currentColor" />
                    <span className="font-bold">{displayPhotos.length}</span>
                </div>
                {/* Indicador de seleção visual */}
                <div className="absolute bottom-0 w-full h-1 bg-white/30"></div>
            </button>

            {/* Aba Tours (Cinza) */}
            <button className="bg-gray-200 dark:bg-[#2a2a2a] rounded-md flex items-center justify-center gap-2 text-gray-500 dark:text-gray-400 shadow-sm">
                <Play size={18} fill="currentColor" />
                <span className="font-bold">0</span>
            </button>
        </div>
      </header>

      {/* --- GRID DE CONTEÚDO --- */}
      <main className="flex-1 p-1">
          {/* Grid de 3 Colunas com espaçamento mínimo (gap-1) como na foto */}
          <div className="grid grid-cols-3 gap-1 pb-24">
            {displayPhotos.map((photo: Photo) => (
                <div 
                    key={photo.id}
                    onClick={() => onEditPhoto(photo)}
                    className="relative aspect-square bg-gray-100 dark:bg-[#202020] overflow-hidden cursor-pointer"
                >
                  <img 
                    src={photo.url} 
                    alt="thumb" 
                    className="w-full h-full object-cover" 
                    loading="lazy" 
                  />
                </div>
            ))}
            
            {/* Placeholders para grid vazia */}
            {displayPhotos.length === 0 && Array.from({length:9}).map((_, i) => (
                <div key={i} className="aspect-square bg-gray-100 dark:bg-[#1a1a1a] flex items-center justify-center opacity-30">
                    <Camera size={20} className="text-gray-400" />
                </div>
            ))}
          </div>
      </main>

      {/* --- BOTÃO FLUTUANTE (Pílula) --- */}
      <div className="fixed bottom-8 left-1/2 -translate-x-1/2 z-30">
        <button 
            onClick={onAddPhoto}
            className="flex items-center gap-3 bg-gray-800 dark:bg-[#2a2a2a] text-white px-6 py-3 rounded-full font-medium text-sm shadow-xl active:scale-95 transition-transform"
        >
            <Camera size={18} />
            <span>Iniciar captura</span>
        </button>
      </div>

    </div>
  );
};
