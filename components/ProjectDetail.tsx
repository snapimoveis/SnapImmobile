import React, { useState, useEffect } from 'react';
import { 
  ArrowLeft, 
  Pencil, 
  MoreHorizontal, 
  Camera, 
  Cloud,
  Play,
  Download
} from 'lucide-react';
import { Project, Photo } from '../types';
import { ProjectContacts } from './ProjectContacts';

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
  onEditPhoto,
  onUpdateProject,
  onViewTour
}) => {
  const [project, setProject] = useState<Project>(initialProject);
  const [activeTab, setActiveTab] = useState<'content' | 'contacts'>('content');
  const [downloadingId, setDownloadingId] = useState<string | null>(null);

  useEffect(() => {
    setProject(initialProject);
  }, [initialProject]);

  const displayPhotos = project.photos || [];

  const handleDownloadPhoto = async (e: React.MouseEvent, photo: Photo) => {
    e.stopPropagation();
    setDownloadingId(photo.id);

    try {
        const response = await fetch(photo.url, { mode: 'cors' });
        const blob = await response.blob();
        const url = window.URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        const fileName = photo.name.toLowerCase().endsWith('.jpg') ? photo.name : `${photo.name}.jpg`;
        link.download = fileName;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        window.URL.revokeObjectURL(url);
    } catch (error) {
        console.error("Erro no download:", error);
        window.open(photo.url, '_blank');
    } finally {
        setDownloadingId(null);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col animate-in fade-in duration-300 pb-28">
      {/* --- HEADER --- */}
      <header className="bg-white border-b border-gray-200 pt-6 px-4 md:px-6 pb-0 shadow-sm z-10 sticky top-0">
        <div className="flex items-center justify-between mb-4">
            <button onClick={onBack} className="flex items-center text-sm text-gray-600 hover:text-gray-900 font-medium">
                <ArrowLeft size={20} className="mr-1" />
            </button>
            <div className="flex gap-2">
                <button onClick={onViewTour} className="p-2 text-gray-600 hover:text-purple-600 hover:bg-purple-50 rounded-full transition-colors" title="Ver Tour">
                    <Play size={20} />
                </button>
                <button className="p-2 text-gray-600 hover:bg-gray-100 rounded-full transition-colors">
                    <MoreHorizontal size={20} />
                </button>
            </div>
        </div>

        <div className="mb-6">
            <div className="flex items-center gap-2">
                <h1 className="text-2xl font-bold text-gray-900 leading-tight">{project.title}</h1>
                <button className="text-gray-400 hover:text-gray-600 p-1 rounded hover:bg-gray-100">
                    <Pencil size={14} />
                </button>
            </div>
            <p className="text-sm text-gray-500 mt-1">{project.address}</p>
        </div>

        <div className="flex gap-8 overflow-x-auto no-scrollbar">
          <button 
            onClick={() => setActiveTab('content')}
            className={`pb-3 px-1 text-sm font-medium border-b-2 transition-colors whitespace-nowrap ${activeTab === 'content' ? 'border-black text-black' : 'border-transparent text-gray-500 hover:text-gray-700'}`}
          >
            Conteúdo
          </button>
          <button 
            onClick={() => setActiveTab('contacts')}
            className={`pb-3 px-1 text-sm font-medium border-b-2 transition-colors whitespace-nowrap ${activeTab === 'contacts' ? 'border-black text-black' : 'border-transparent text-gray-500 hover:text-gray-700'}`}
          >
            Contactos
          </button>
        </div>
      </header>

      {/* --- CONTENT --- */}
      {activeTab === 'content' ? (
          <main className="flex-1 max-w-7xl w-full mx-auto p-4 md:p-6">
              {displayPhotos.length === 0 ? (
                 <div className="text-center py-20 bg-white rounded-xl border-2 border-dashed border-gray-200 mt-4">
                    <div className="mx-auto h-16 w-16 text-gray-300 bg-gray-50 rounded-full flex items-center justify-center mb-4">
                       <Camera size={32} strokeWidth={1.5} />
                    </div>
                    <h3 className="text-base font-semibold text-gray-900">Comece a capturar</h3>
                    <p className="mt-1 text-sm text-gray-500 max-w-xs mx-auto">Toque no botão abaixo para adicionar as primeiras fotos.</p>
                 </div>
              ) : (
                  /* GRID DE FOTOS (Estilo Nodalview) */
                  <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
                    {displayPhotos.map((photo: Photo) => (
                        <div 
                            key={photo.id}
                            onClick={() => onEditPhoto(photo)}
                            className="relative aspect-[4/3] rounded-xl overflow-hidden bg-gray-200 cursor-pointer shadow-sm active:scale-95 transition-transform group"
                        >
                          <img src={photo.url} alt={photo.name} className="w-full h-full object-cover" loading="lazy" />
                          
                          <div className="absolute inset-x-0 bottom-0 h-1/3 bg-gradient-to-t from-black/40 to-transparent pointer-events-none" />
                          <span className="absolute bottom-2 left-2 text-[10px] font-medium text-white/90 tracking-wide uppercase shadow-sm">Snap Fusion</span>

                          {/* Ícone de Nuvem / Download */}
                          <button 
                            onClick={(e) => handleDownloadPhoto(e, photo)}
                            className="absolute bottom-2 right-2 bg-white rounded-lg p-1.5 shadow-sm text-gray-700 hover:text-blue-600 transition-colors z-10"
                          >
                            {downloadingId === photo.id ? (
                                <div className="w-3.5 h-3.5 border-2 border-blue-600 border-t-transparent rounded-full animate-spin" />
                            ) : (
                                <Cloud size={16} fill="currentColor" className="text-gray-400" />
                            )}
                          </button>
                        </div>
                    ))}
                  </div>
              )}
          </main>
      ) : (
          <div className="flex-1 bg-gray-50 p-6">
            <ProjectContacts 
              project={project} 
              onUpdate={(updated) => { setProject(updated); onUpdateProject(updated); }} 
            />
          </div>
      )}

      {/* --- BOTÃO FLUTUANTE --- */}
      {activeTab === 'content' && (
          <div className="fixed bottom-8 left-1/2 -translate-x-1/2 z-30 shadow-xl rounded-full animate-in slide-in-from-bottom-4">
            <button 
                onClick={onAddPhoto}
                className="flex items-center gap-3 bg-white text-gray-900 px-6 py-3.5 rounded-full font-bold text-sm hover:bg-gray-50 active:scale-95 transition-all border border-gray-100"
                style={{ boxShadow: "0 4px 20px rgba(0,0,0,0.15)" }}
            >
                <Camera size={20} className="text-gray-800" />
                <span>Iniciar captura</span>
            </button>
          </div>
      )}
    </div>
  );
};
