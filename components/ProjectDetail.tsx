import React from "react";
import { Project, Photo } from "../types";

export interface ProjectDetailProps {
  project: Project;
  onBack: () => void;
  onOpenCamera: () => void;
  onEditPhoto: (photo: Photo) => void;
}

export const ProjectDetail: React.FC<ProjectDetailProps> = ({
  project,
  onBack,
  onOpenCamera,
  onEditPhoto,
}) => {
  return (
    <div className="w-full h-full px-6 pb-20 overflow-y-auto bg-white dark:bg-black transition-colors">

      {/* HEADER */}
      <div className="flex items-center justify-between pt-6 mb-8">
        <button
          onClick={onBack}
          className="text-gray-700 dark:text-gray-300 text-sm underline"
        >
          Voltar
        </button>

        <h2 className="text-xl font-bold text-gray-900 dark:text-white text-center flex-1">
          {project.title || "Imóvel"}
        </h2>

        <div className="w-12"></div>
      </div>

      {/* COVER */}
      {project.coverImage && (
        <img
          src={project.coverImage}
          alt="Cover"
          className="w-full h-56 object-cover rounded-2xl shadow-lg mb-6"
        />
      )}

      {/* INFO */}
      <div className="mb-6">
        <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-2">
          Informação do imóvel
        </h3>

        <p className="text-gray-600 dark:text-gray-400 text-sm">
          Endereço: {project.address || "Não definido"}
        </p>

        {project.details?.description && (
          <p className="text-gray-600 dark:text-gray-400 text-sm mt-3">
            {project.details.description}
          </p>
        )}
      </div>

      {/* PHOTOS HEADER */}
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-bold text-gray-900 dark:text-white">
          Fotografias
        </h3>

        <button
          onClick={onOpenCamera}
          className="bg-orange-500 hover:bg-orange-600 transition text-white text-sm font-semibold px-4 py-2 rounded-xl shadow-md"
        >
          + Foto
        </button>
      </div>

      {/* PHOTOS GRID */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4 mb-20">
        {project.photos?.map((photo) => (
          <div
            key={photo.id}
            className="relative group cursor-pointer"
            onClick={() => onEditPhoto(photo)}
          >
            <img
              src={photo.url}
              alt="Photo"
              className="w-full h-32 sm:h-40 object-cover rounded-xl shadow-card"
            />

            <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition rounded-xl flex items-center justify-center text-white text-sm">
              Editar
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
