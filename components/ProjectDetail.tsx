import React, { useState, useEffect } from 'react';
import { ArrowLeft, Camera, Video, Settings, Share2, Pencil, Check, MapPin } from 'lucide-react';
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
  onEditPhoto,
  onUpdateProject,
  onViewTour,
}) => {
  const [project, setProject] = useState<Project>(initialProject);
  const [isEditing, setIsEditing] = useState(false);

  useEffect(() => {
    setProject(initialProject);
  }, [initialProject]);

  const photos = [...(project.photos || [])].sort((a, b) => (b.createdAt ?? 0) - (a.createdAt ?? 0));

  const handleChange = (field: keyof Project, value: string) => {
    setProject(prev => ({ ...prev, [field]: value }));
  };

  const handleSaveProject = () => {
    onUpdateProject(project);
    setIsEditing(false);
  };

  return (
    <div className="min-h-screen bg-brand-gray-50 dark:bg-black flex flex-col pb-24 md:pb-0">

      {/* HEADER */}
      <header className="bg-white dark:bg-[#121212] px-4 py-4 sticky top-0 z-30 shadow-sm border-b border-gray-200 dark:border-white/5">
        <div className="max-w-7xl mx-auto">

          <div className="flex items-center justify-between mb-4">
            <button
              onClick={onBack}
              className="p-2 -ml-2 rounded-full hover:bg-gray-100 dark:hover:bg-white/10 text-gray-600 dark:text-gray-300"
            >
              <ArrowLeft size={24} />
            </button>

            <div className="text-center">
              {!isEditing ? (
                <>
                  <h1 className="text-base font-bold text-gray-900 dark:text-white">
                    {project.title}
                  </h1>
                  <p className="text-xs text-gray-500 dark:text-gray-400">{project.address}</p>
                </>
              ) : (
                <div className="flex flex-col gap-2">
                  <input
                    value={project.title}
                    onChange={(e) => handleChange("title", e.target.value)}
                    className="bg-gray-100 dark:bg-white/10 px-2 py-1 text-sm rounded-lg"
                  />
                  <input
                    value={project.address}
                    onChange={(e) => handleChange("address", e.target.value)}
                    className="bg-gray-100 dark:bg-white/10 px-2 py-1 text-xs rounded-lg"
                  />
                </div>
              )}
            </div>

            <button
              onClick={() => (isEditing ? handleSaveProject() : setIsEditing(true))}
              className="p-2 -mr-2 rounded-full hover:bg-gray-100 dark:hover:bg-white/10 text-brand-orange"
            >
              {isEditing ? <Check size={24} /> : <Pencil size={22} />}
            </button>
          </div>

          {/* AÇÕES */}
          <div className="grid grid-cols-3 gap-3">

            {/* ABRIR CONFIGURAÇÕES FUTURAS */}
            <button className="bg-brand-orange text-white rounded-xl py-3 flex items-center justify-center shadow-md">
              <Settings size={20} />
            </button>

            {/* ADICIONAR FOTOS */}
            <button
              onClick={onAddPhoto}
              className="bg-brand-orange text-white rounded-xl py-3 flex items-center justify-center shadow-md"
            >
              <Camera size={20} />
            </button>

            {/* TOUR 360 */}
            <button
              onClick={onViewTour}
              className="bg-brand-orange text-white rounded-xl py-3 flex items-center justify-center shadow-md"
            >
              <Video size={20} />
            </button>

          </div>
        </div>
      </header>

      {/* LISTAGEM DE FOTOS */}
      <main className="flex-1 p-4 max-w-7xl mx-auto w-full">
        {photos.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 text-center">
            <div className="w-20 h-20 bg-gray-200 dark:bg-white/10 rounded-full flex items-center justify-center mb-4">
              <Camera size={32} className="text-gray-400" />
            </div>
            <p className="text-gray-500 dark:text-gray-400 font-medium">Ainda não há fotos.</p>
            <p className="text-xs text-gray-400 mt-1">Toque no botão de câmera acima para começar.</p>
          </div>
        ) : (
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
            {photos.map((photo) => (
              <div
                key={photo.id}
                onClick={() => onEditPhoto(photo)}
                className="relative aspect-square bg-gray-200 dark:bg-white/5 rounded-xl overflow-hidden cursor-pointer group"
              >
                <img
                  src={photo.url}
                  alt=""
                  className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
                />
                <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-colors" />
              </div>
            ))}
          </div>
        )}
      </main>

      {/* BOTÃO FLUTUANTE */}
      <div className="fixed bottom-8 left-0 right-0 flex justify-center px-4 z-40 pointer-events-none">
        <button
          onClick={onAddPhoto}
          className="pointer-events-auto bg-brand-orange px-8 py-3.5 rounded-full font-bold text-sm text-white shadow-lg shadow-orange-500/30 active:scale-95 flex items-center gap-2"
        >
          <Camera size={18} />
          Iniciar Captura
        </button>
      </div>
    </div>
  );
};

export default ProjectDetail;
