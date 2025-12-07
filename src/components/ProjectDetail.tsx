import React from "react";
import { Project, Photo } from "../types";
import { ArrowLeft, Camera, Trash } from "lucide-react";

interface Props {
  project: Project;
  onBack: () => void;
  onOpenCamera: () => void;
  onSelectPhoto: (p: Photo) => void;
}

export default function ProjectDetail({
  project,
  onBack,
  onOpenCamera,
  onSelectPhoto,
}: Props) {
  return (
    <div className="w-full min-h-screen bg-white dark:bg-black px-4 pt-6 pb-32">

      {/* HEADER */}
      <div className="flex items-center justify-between mb-6">
        <button
          onClick={onBack}
          className="p-2 rounded-full bg-gray-200 dark:bg-gray-800"
        >
          <ArrowLeft className="w-6 h-6 text-gray-900 dark:text-white" />
        </button>

        <h1 className="text-xl font-bold text-gray-900 dark:text-white">
          {project.title || "Imóvel"}
        </h1>

        <div className="w-10" />
      </div>

      {/* INFO DO IMÓVEL */}
      <div className="mb-6">
        {project.address && (
          <p className="text-gray-500 dark:text-gray-400 text-sm">
            {project.address}
          </p>
        )}
      </div>

      {/* GRID DE FOTOS – estilo Nodalview */}
      <div className="grid grid-cols-3 gap-3 mt-4">
        {project.photos.map((photo) => (
          <div
            key={photo.id}
            className="relative w-full h-32 bg-gray-200 dark:bg-neutral-800 rounded-xl overflow-hidden cursor-pointer"
            onClick={() => onSelectPhoto(photo)}
          >
            <img
              src={photo.url}
              alt="foto"
              className="w-full h-full object-cover"
            />

            {/* Canto inferior direito */}
            <div className="absolute bottom-1 right-1 bg-black/60 text-white text-[10px] px-2 py-0.5 rounded-full">
              HDR
            </div>
          </div>
        ))}
      </div>

      {/* BOTÃO FOTOGRAFAR */}
      <button
        onClick={onOpenCamera}
        className="
          fixed bottom-6 left-1/2 -translate-x-1/2
          bg-orange-500 hover:bg-orange-600 
          text-white text-lg font-semibold
          px-10 py-4 rounded-full shadow-xl active:scale-95
        "
      >
        <Camera size={22} className="inline-block mr-2" />
        Fotografar
      </button>
    </div>
  );
}
