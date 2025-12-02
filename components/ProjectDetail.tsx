import React, { useState, useEffect } from "react";
import { ArrowLeft, Camera, Video, Check } from "lucide-react";
import { Project, Photo } from "../types";

interface ProjectDetailProps {
  initialProject: Project;
  onBack: () => void;
  onAddPhoto: () => void;
  onEditPhoto: (photo: Photo) => void;
  onUpdateProject: (project: Project) => void;
  onViewTour?: () => void;
}

const ProjectDetail: React.FC<ProjectDetailProps> = ({
  initialProject,
  onBack,
  onAddPhoto,
  onEditPhoto,
  onViewTour,
}) => {
  const [project, setProject] = useState<Project>(initialProject);

  useEffect(() => setProject(initialProject), [initialProject]);

  const photos = project.photos || [];

  return (
    <div className="min-h-screen w-full bg-brand-gray-50 dark:bg-black flex flex-col transition-colors duration-300 pb-28 md:pb-12">

      {/* HEADER (Mobile + Desktop) */}
      <header className="
        bg-white dark:bg-[#121212]
        px-4 py-4 
        sticky top-0 z-30
        shadow-sm 
        border-b border-gray-200 dark:border-white/5
      ">
        <div className="max-w-6xl mx-auto flex items-center justify-between">

          {/* VOLTAR */}
          <button
            onClick={onBack}
            className="p-2 -ml-2 rounded-full hover:bg-gray-100 dark:hover:bg-white/10 text-gray-600 dark:text-gray-300 transition-colors"
          >
            <ArrowLeft size={24} />
          </button>

          {/* TÍTULO */}
          <div className="text-center flex-1">
            <h1 className="text-base md:text-lg font-bold text-gray-900 dark:text-white truncate">
              {project.title}
            </h1>
            <p className="text-xs text-gray-500 dark:text-gray-400 truncate mt-0.5">
              {project.address}
            </p>
          </div>

          {/* BOTÃO "OK" (Futuro salvar alterações) */}
          <button
            className="p-2 -mr-2 rounded-full hover:bg-gray-100 dark:hover:bg-white/10 text-brand-orange transition-colors"
          >
            <Check size={24} />
          </button>
        </div>

        {/* AÇÕES - Mobile & Desktop */}
        <div className="grid grid-cols-3 gap-3 mt-4 max-w-6xl mx-auto">
          {/* Gerar Tour */}
          <button
            onClick={onViewTour}
            className="bg-brand-orange hover:bg-brand-orange-hover text-white rounded-xl py-3 flex items-center justify-center shadow-md active:scale-95 transition-transform"
          >
            <Video size={20} />
          </button>

          {/* Adicionar Fotos */}
          <button
            onClick={onAddPhoto}
            className="bg-brand-orange hover:bg-brand-orange-hover text-white rounded-xl py-3 flex items-center justify-center shadow-md active:scale-95 transition-transform"
          >
            <Camera size={20} />
          </button>

          {/* Reservado para futura função */}
          <button className="bg-brand-orange hover:bg-brand-orange-hover text-white rounded-xl py-3 flex items-center justify-center shadow-md active:scale-95 transition-transform">
            <Check size={20} />
          </button>
        </div>
      </header>

      {/* FOTOS DO IMÓVEL */}
      <main className="flex-1 p-4 max-w-6xl mx-auto w-full">

        {/* Sem Fotos */}
        {photos.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 text-center">
            <div className="w-20 h-20 bg-gray-200 dark:bg-white/10 rounded-full flex items-center justify-center mb-4">
              <Camera size={32} className="text-gray-400" />
            </div>
            <p className="text-gray-500 dark:text-gray-400 font-medium">
              Ainda não há fotos.
            </p>
            <p className="text-xs text-gray-400 mt-1">
              Toque no botão de câmera acima para começar.
            </p>
          </div>
        ) : (
          <div
            className="
              grid 
              grid-cols-2 
              sm:grid-cols-3 
              lg:grid-cols-4 
              xl:grid-cols-6
              gap-4 md:gap-5
            "
          >
            {photos.map((photo) => (
              <div
                key={photo.id}
                onClick={() => onEditPhoto(photo)}
                className="
                  relative 
                  aspect-square 
                  bg-gray-200 dark:bg-white/5 
                  rounded-xl 
                  overflow-hidden 
                  cursor-pointer 
                  group 
                  shadow-sm hover:shadow-md 
                  transition-all
                "
              >
                <img
                  src={photo.url}
                  alt="Foto"
                  loading="lazy"
                  className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
                />

                {/* Overlay suave ao hover */}
                <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-colors" />
              </div>
            ))}
          </div>
        )}
      </main>

      {/* BOTÃO FLUTUANTE (Mobile) */}
      <div className="fixed bottom-8 left-0 right-0 flex justify-center px-4 z-20 pointer-events-none sm:hidden">
        <button
          onClick={onAddPhoto}
          className="
            pointer-events-auto
            bg-brand-orange hover:bg-brand-orange-hover 
            text-white 
            px-8 py-3.5 
            rounded-full 
            font-bold text-sm 
            shadow-lg shadow-orange-500/30 
            active:scale-95 
            transition-transform 
            flex items-center gap-2
          "
        >
          Iniciar Captura
        </button>
      </div>
    </div>
  );
};

export default ProjectDetail;
