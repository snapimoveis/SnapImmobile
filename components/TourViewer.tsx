import React, { useState } from 'react';
import { Project, Photo } from '../types';
import { X, ChevronRight, ArrowLeft } from 'lucide-react';

interface TourViewerProps {
  project: Project;
  onClose: () => void;
}

export const TourViewer: React.FC<TourViewerProps> = ({ project, onClose }) => {
  const [currentPhotoId, setCurrentPhotoId] = useState<string>(project.photos[0]?.id);

  const currentPhoto = project.photos.find(p => p.id === currentPhotoId);

  if (!currentPhoto) return <div className="text-white p-10">Sem fotos na visita.</div>;

  const nextPhotoId = currentPhoto.linkedTo;
  const nextPhoto = project.photos.find(p => p.id === nextPhotoId);

  return (
    <div className="fixed inset-0 z-[60] bg-black flex flex-col">
      <div className="absolute top-0 left-0 right-0 p-4 flex justify-between items-center z-10 bg-gradient-to-b from-black/60 to-transparent">
        <div>
            <h2 className="text-white font-bold text-lg drop-shadow-md">{project.title}</h2>
            <p className="text-white/80 text-sm drop-shadow-md">{currentPhoto.name}</p>
        </div>
        <button onClick={onClose} className="bg-white/20 hover:bg-white/30 p-2 rounded-full text-white backdrop-blur-md transition-colors">
          <X className="w-6 h-6" />
        </button>
      </div>

      <div className="flex-1 relative flex items-center justify-center bg-neutral-900">
        <img 
            src={currentPhoto.url} 
            alt="Tour View" 
            className="max-w-full max-h-full object-contain"
        />
        
        {/* Navigation Hotspot */}
        {nextPhoto && (
            <div className="absolute bottom-10 right-10 animate-bounce">
                <button 
                    onClick={() => setCurrentPhotoId(nextPhoto.id)}
                    className="bg-white/90 hover:bg-white text-black px-6 py-3 rounded-full font-bold shadow-lg flex items-center gap-2 transform hover:scale-105 transition-all"
                >
                    Ir para {nextPhoto.name} <ChevronRight className="w-5 h-5" />
                </button>
            </div>
        )}

        {!nextPhoto && (
            <div className="absolute bottom-10 bg-black/50 px-4 py-2 rounded-lg text-white backdrop-blur-sm">
                Fim da Visita
            </div>
        )}
      </div>
      
      {/* Thumbnails strip */}
      <div className="h-20 bg-black/80 backdrop-blur-md border-t border-white/10 flex items-center px-4 gap-2 overflow-x-auto no-scrollbar">
        {project.photos.map(p => (
            <div 
                key={p.id}
                onClick={() => setCurrentPhotoId(p.id)}
                className={`w-24 h-16 flex-shrink-0 rounded-md overflow-hidden border-2 cursor-pointer transition-all ${currentPhotoId === p.id ? 'border-blue-500 opacity-100' : 'border-transparent opacity-50 hover:opacity-100'}`}
            >
                <img src={p.url} className="w-full h-full object-cover" />
            </div>
        ))}
      </div>
    </div>
  );
};