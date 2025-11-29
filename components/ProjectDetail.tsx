import React, { useState, useEffect } from 'react';
import { 
  ArrowLeft, 
  Pencil, 
  MoreHorizontal, 
  Camera, 
  Cloud,
  Play,
  Download,
  Share2
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
    // FIX: Removido min-h-screen para não forçar scroll duplo no AppLayout
    // FIX: Cores alteradas para Dark Mode (bg-transparent pois o pai já é escuro)
    <div className="flex flex-col animate-in slide-in-from-right-4 duration-300 pb-24 md:pb-0">
      
      {/* --- HEADER (Sticky para ficar preso no topo ao rolar) --- */}
      <header className="bg-gray-900/95 backdrop-blur-md border-b border-white/10 pt-2 px-1 md:px-0 pb-0 z-20 sticky -top-6 md:-top-8">
        
        <div className="flex items-center justify-between mb-4">
            <button 
                onClick={onBack} 
                className="flex items-center gap-2 text-sm text-gray-400 hover:text-white font-medium p-2 rounded-lg hover:bg-white/5 transition-colors"
            >
                <ArrowLeft size={20} />
                <span className="hidden md:inline">Voltar</span>
            </button>
            
            <div className="flex gap-2">
                <button onClick={onViewTour} className="p-2 text-gray-400 hover:text-yellow-400 hover:bg-yellow-400/10 rounded-full transition-colors" title="Ver Tour Virtual">
                    <Play size={20} />
                </button>
                <button className="p-2 text-gray-400 hover:text-white hover:bg-white/10 rounded-full transition-colors">
                    <Share2 size={20} />
                </button>
                <button className="p-2 text-gray-400 hover:text-white hover:bg-white/10 rounded-full transition-colors">
                    <MoreHorizontal size={20} />
                </button>
            </div>
        </div>

        <div className="mb-6 px-2">
            <div className="flex items-start justify-between gap-4">
                <div>
                    <h1 className="text-2xl md:text-3xl font-bold text-white leading-tight">{project.title}</h1>
                    <p className="text-sm text-gray-400 mt-1 flex items-center gap-1">
                        {project.address}
                    </p>
                </div>
                <button className="p-2 text-gray-500 hover:text-white bg-white/5 rounded-lg hover:bg-white/10 transition-colors">
                    <Pencil size={16} />
                </button>
            </div>
        </div>

        {/* Tabs */}
        <div className="flex gap-8 px-2 border-b border-white/10">
          <button 
            onClick={() => setActiveTab('content')}
            className={`pb-3 px-1 text-sm font-medium border-b-2 transition-all ${
                activeTab === 'content' 
                ? 'border-yellow-400 text-yellow-400' 
                : 'border-transparent text-gray-500 hover:text-gray-300'
            }`}
          >
            Galeria ({displayPhotos.length})
          </button>
          <button 
            onClick={() => setActiveTab('contacts')}
            className={`pb-3 px-1 text-sm font-medium border-b-2 transition-all ${
                activeTab === 'contacts' 
                ? 'border-yellow-400 text-yellow-400' 
                : 'border-transparent text-gray-500 hover:text-gray-300'
            }`}
          >
            Informações
          </button>
        </div>
      </header>

      {/* --- CONTENT --- */}
      {activeTab === 'content' ? (
          <main className="flex-1 w-full mt-6">
              {displayPhotos.length === 0 ? (
                 <div className="text-center py-20 bg-[#121212] rounded-2xl border-2 border-dashed border-white/10 mt-4 mx-2">
                    <div className="mx-auto h-20 w-20 text-gray-600 bg-white/5 rounded-full flex items-center justify-center mb-6">
                       <Camera size={36} strokeWidth={1.5} />
                    </div>
                    <h3 className="text-lg font-semibold text-white">Galeria vazia</h3>
                    <p className="mt-2 text-sm text-gray-500 max-w-xs mx-auto">Adicione fotos profissionais ou Renders 3D para começar.</p>
                 </div>
              ) : (
                  /* GRID DE FOTOS (Estilo Dark) */
                  <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3 md:gap-4">
                    {displayPhotos.map((photo: Photo) => (
                        <div 
                            key={photo.id}
                            onClick={() => onEditPhoto(photo)}
                            className="relative aspect-[4/3] rounded-xl overflow-hidden bg-[#121212] border border-white/10 cursor-pointer shadow-lg group hover:border-yellow-400/50 transition-all"
                        >
                          <img src={photo.url} alt={photo.name} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" loading="lazy" />
                          
                          {/* Gradiente para legibilidade */}
                          <div className="absolute inset-x-0 bottom-0 h-1/2 bg-gradient-to-t from-black/80 to-transparent pointer-events-none opacity-60 group-hover:opacity-100 transition-opacity" />
                          
                          {/* Badge HDR/Tipo */}
                          {photo.type && (
                              <span className="absolute top-2 left-2 text-[9px] font-bold text-black bg-yellow-400 px-1.5 py-0.5 rounded shadow-sm">
                                {photo.type.toUpperCase()}
                              </span>
                          )}

                          {/* Botão Download */}
                          <button 
                            onClick={(e) => handleDownloadPhoto(e, photo)}
                            className="absolute bottom-2 right-2 p-2 bg-black/60 backdrop-blur-md rounded-lg text-white hover:bg-white hover:text-black transition-all active:scale-95 border border-white/10"
                          >
                            {downloadingId === photo.id ? (
                                <div className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin" />
                            ) : (
                                <Download size={16} />
                            )}
                          </button>
                        </div>
                    ))}
                  </div>
              )}
          </main>
      ) : (
          <div className="flex-1 mt-6">
            <ProjectContacts 
              project={project} 
              onUpdate={(updated) => { setProject(updated); onUpdateProject(updated); }} 
            />
          </div>
      )}

      {/* --- BOTÃO FLUTUANTE (FAB) --- */}
      {/* Ajustado para não sobrepor o menu inferior no mobile (mb-20 no mobile, mb-8 no desktop) */}
      {activeTab === 'content' && (
          <div className="fixed bottom-24 md:bottom-8 left-1/2 -translate-x-1/2 z-30 animate-in slide-in-from-bottom-4">
            <button 
                onClick={onAddPhoto}
                className="flex items-center gap-3 bg-yellow-400 text-black px-8 py-4 rounded-full font-bold text-sm hover:bg-yellow-300 active:scale-95 transition-all shadow-[0_0_20px_rgba(250,204,21,0.3)]"
            >
                <Camera size={20} />
                <span>Nova Foto</span>
            </button>
          </div>
      )}
    </div>
  );
};
