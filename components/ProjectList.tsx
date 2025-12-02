import React, { useState, useMemo } from "react";
import { Project } from "../types";
import { Plus, Trash2, Camera, MapPin, Search } from "lucide-react";

interface ProjectListProps {
  projects: Project[];
  onSelectProject: (project: Project) => void;
  onCreateProject: () => void;
  onDeleteProject: (id: string) => void;
}

export const ProjectList: React.FC<ProjectListProps> = ({
  projects,
  onSelectProject,
  onCreateProject,
  onDeleteProject,
}) => {
  const [search, setSearch] = useState("");

  const formatDate = (timestamp: number) => {
    if (!timestamp) return "";
    try {
      return new Date(timestamp).toLocaleDateString("pt-PT", {
        day: "numeric",
        month: "long",
        year: "numeric",
      });
    } catch {
      return "";
    }
  };

  // ------------------------------
  // FILTRAGEM POR BUSCA
  // ------------------------------
  const filteredProjects = useMemo(() => {
    if (!search.trim()) return projects;
    const term = search.toLowerCase();
    return projects.filter(
      (p) =>
        p.title.toLowerCase().includes(term) ||
        p.address.toLowerCase().includes(term)
    );
  }, [projects, search]);

  // ------------------------------
  // ACTIVIDADE RECENTE
  // ------------------------------
  const recentProjects = useMemo(() => {
    return [...projects]
      .sort((a, b) => b.createdAt - a.createdAt)
      .slice(0, 5);
  }, [projects]);

  return (
    <div className="min-h-screen w-full bg-brand-gray-50 dark:bg-black p-4 pb-32 sm:pb-24 transition-colors duration-300">
      
      {/* HEADER */}
      <div className="flex items-center justify-between mb-4">
        <h1 className="text-lg sm:text-xl font-bold text-gray-900 dark:text-white">
          Seus Projetos
        </h1>

        {/* DESKTOP botão “Novo imóvel” */}
        <button
          onClick={onCreateProject}
          className="hidden sm:flex bg-brand-orange hover:bg-brand-orange-hover text-white px-4 py-2 rounded-xl items-center gap-2 shadow-md active:scale-95 transition-transform"
        >
          <Plus size={18} /> Novo Projeto
        </button>
      </div>

      {/* SEARCH BAR */}
      <div className="mb-6">
        <div className="flex items-center gap-2 bg-gray-100 dark:bg-white/10 rounded-2xl px-3 py-2">
          <Search size={18} className="text-gray-400" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Pesquisar imóveis..."
            className="bg-transparent outline-none flex-1 text-sm text-gray-800 dark:text-gray-100 placeholder:text-gray-400"
          />
        </div>
      </div>

      {/* ACTIVIDADE RECENTE */}
      {recentProjects.length > 0 && (
        <div className="mb-6">
          <h2 className="text-sm font-semibold text-gray-700 dark:text-gray-200 mb-3">
            Actividade recente
          </h2>

          <div className="flex gap-4 overflow-x-auto no-scrollbar pb-2">
            {recentProjects.map((project) => {
              const image =
                project.coverImage || project.photos?.[0]?.url || null;

              return (
                <div
                  key={project.id}
                  onClick={() => onSelectProject(project)}
                  className="min-w-[180px] sm:min-w-[210px] bg-white dark:bg-[#151515] rounded-2xl shadow-sm border border-gray-100 dark:border-white/5 cursor-pointer overflow-hidden flex-shrink-0"
                >
                  {/* Capa */}
                  <div className="relative aspect-square bg-gray-200 dark:bg-gray-800">
                    {image ? (
                      <img
                        src={image}
                        alt="Foto do imóvel"
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-gray-400">
                        <Camera size={32} />
                      </div>
                    )}

                    <div className="absolute bottom-2 left-2 bg-black/60 text-white rounded-lg p-1">
                      <MapPin size={14} />
                    </div>
                  </div>

                  {/* Info */}
                  <div className="px-3 pt-2 pb-3">
                    <p className="text-sm font-semibold text-gray-900 dark:text-white truncate">
                      {project.title}
                    </p>
                    <p className="text-xs text-gray-500 dark:text-gray-400">
                      {formatDate(project.createdAt)}
                    </p>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* GRID – TODOS OS IMÓVEIS */}
      <h2 className="text-sm font-semibold text-gray-700 dark:text-gray-200 mb-3">
        Todos os imóveis
      </h2>

      {filteredProjects.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-12 text-center">
          <div className="w-16 h-16 bg-gray-200 dark:bg-white/10 rounded-full flex items-center justify-center mb-3">
            <Camera size={28} className="text-gray-400" />
          </div>
          <p className="text-gray-500 dark:text-gray-400 text-sm">
            Nenhum imóvel encontrado.
          </p>
          <p className="text-xs text-gray-400 mt-1">
            Ajuste a pesquisa ou crie um novo imóvel.
          </p>
        </div>
      ) : (
        <div
          className="
            grid 
            grid-cols-1 
            sm:grid-cols-2 
            lg:grid-cols-3 
            xl:grid-cols-4 
            gap-4 sm:gap-6
          "
        >
          {filteredProjects.map((project) => {
            const image =
              project.coverImage || project.photos?.[0]?.url || null;

            const photoCount = project.photos?.length || 0;

            return (
              <div
                key={project.id}
                onClick={() => onSelectProject(project)}
                className="bg-white dark:bg-[#151515] rounded-2xl shadow-md overflow-hidden border border-gray-200 dark:border-white/5 cursor-pointer transition-all hover:scale-[1.01]"
              >
                {/* Capa */}
                <div className="relative h-40 w-full bg-gray-200 dark:bg-gray-800">
                  {image ? (
                    <img
                      src={image}
                      alt="Foto de capa"
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-gray-400">
                      <Camera size={32} />
                    </div>
                  )}

                  {/* Contador fotos */}
                  <div className="absolute bottom-2 left-2 bg-black/70 text-white text-xs px-2 py-1 rounded-xl flex items-center gap-1">
                    <Camera size={12} />
                    {photoCount}
                  </div>

                  {/* Botão delete */}
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      onDeleteProject(project.id);
                    }}
                    className="absolute top-2 right-2 bg-black/60 hover:bg-black/80 text-white p-1.5 rounded-full transition-colors"
                  >
                    <Trash2 size={16} />
                  </button>
                </div>

                {/* Conteúdo */}
                <div className="p-4">
                  <p className="text-base font-semibold text-gray-900 dark:text-white truncate">
                    {project.title}
                  </p>
                  <p className="text-xs text-gray-500 dark:text-gray-400">
                    {formatDate(project.createdAt)}
                  </p>
                  <p className="text-xs text-gray-500 dark:text-gray-400 mt-1 truncate">
                    {project.address}
                  </p>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* BOTÃO FLUTUANTE — MOBILE */}
      <div className="fixed sm:hidden bottom-8 left-0 right-0 flex justify-center pointer-events-none">
        <button
          onClick={onCreateProject}
          className="pointer-events-auto bg-brand-orange hover:bg-brand-orange-hover text-white px-8 py-3.5 rounded-full font-bold text-sm shadow-lg shadow-orange-500/30 active:scale-95 transition-transform flex items-center gap-2"
        >
          <Plus size={18} />
          Novo imóvel
        </button>
      </div>
    </div>
  );
};

export default ProjectList;
