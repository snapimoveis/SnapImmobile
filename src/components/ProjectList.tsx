import React from "react";
import { Project } from "../types";
import { Camera, Settings, Search } from "lucide-react";

interface ProjectListProps {
  projects: Project[];
  onCreateProject: () => void;
  onSelectProject: (p: Project) => void;
}

export default function ProjectList({
  projects,
  onCreateProject,
  onSelectProject,
}: ProjectListProps) {
  return (
    <div className="w-full min-h-screen bg-white dark:bg-black px-4 pt-6 pb-24">

      {/* ========================== */}
      {/* HEADER */}
      {/* ========================== */}
      <div className="flex items-center justify-between mb-6">
        <Search className="w-6 h-6 text-gray-700 dark:text-gray-300" />
        <Settings className="w-6 h-6 text-gray-700 dark:text-gray-300" />
      </div>

      {/* ========================== */}
      {/* ATIVIDADE RECENTE */}
      {/* ========================== */}
      <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">
        Actividade recente
      </h2>

      <div className="flex space-x-4 overflow-x-auto pb-4 scrollbar-hide">
        {projects.slice(0, 12).flatMap((p) =>
          p.photos.slice(0, 1).map((photo) => (
            <div
              key={photo.id}
              className="min-w-[150px] h-[150px] rounded-2xl bg-gray-300 dark:bg-neutral-800 overflow-hidden shadow-md flex-shrink-0 cursor-pointer"
              onClick={() => onSelectProject(p)}
            >
              <img
                src={photo.url}
                className="w-full h-full object-cover"
                alt="recent"
              />
            </div>
          ))
        )}
      </div>

      {/* ========================== */}
      {/* LISTA DE IMÓVEIS */}
      {/* ========================== */}
      <div className="space-y-8 mt-4">
        {projects.map((p) => {
          const cover =
            p.coverImage ||
            (p.photos.length > 0 ? p.photos[0].url : undefined);

          return (
            <div key={p.id} className="w-full cursor-pointer" onClick={() => onSelectProject(p)}>
              
              {/* título e data */}
              <div className="flex items-center justify-between mb-2">
                <div>
                  <h3 className="text-xl font-semibold text-gray-900 dark:text-white">
                    {p.title || "Imóvel sem título"}
                  </h3>
                  <p className="text-sm text-gray-500 dark:text-gray-400">
                    {new Date(p.createdAt).toLocaleDateString("pt-PT", {
                      day: "2-digit",
                      month: "long",
                      year: "numeric",
                    })}
                  </p>
                </div>
                <span className="text-gray-400 dark:text-gray-500 text-xl">⌄</span>
              </div>

              {/* imagem principal */}
              <div className="relative w-full h-56 rounded-3xl overflow-hidden shadow-lg bg-gray-200 dark:bg-neutral-800">
                {cover ? (
                  <img src={cover} className="w-full h-full object-cover" />
                ) : (
                  <div className="flex items-center justify-center w-full h-full text-gray-500">
                    Sem foto
                  </div>
                )}

                {/* Contador de fotos */}
                <div className="absolute bottom-3 left-3 bg-black/70 text-white px-3 py-1 rounded-full text-sm flex items-center gap-2">
                  <Camera size={16} />
                  {p.photos.length}
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* ========================== */}
      {/* BOTÃO FLUTUANTE */}
      {/* ========================== */}
      <button
        onClick={onCreateProject}
        className="fixed bottom-6 left-1/2 -translate-x-1/2 bg-orange-500 hover:bg-orange-600 
        text-white text-lg font-semibold px-10 py-4 rounded-full shadow-xl active:scale-95"
      >
        + Novo imóvel
      </button>
    </div>
  );
}
