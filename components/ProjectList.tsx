import React from "react";
import { Project } from "../types";
import { Plus, Trash2, Camera } from "lucide-react";

interface ProjectListProps {
  projects: Project[];
  onSelectProject: (project: Project) => void;
  onCreateProject: () => void;
  onDeleteProject: (id: string) => void;
}

const ProjectList: React.FC<ProjectListProps> = ({
  projects,
  onSelectProject,
  onCreateProject,
  onDeleteProject,
}) => {
  return (
    <div className="min-h-screen bg-brand-gray-50 dark:bg-black p-4 pb-24 transition-colors duration-300">

      <div className="flex items-center justify-between mb-6">
        <h1 className="text-xl font-bold text-gray-900 dark:text-white">
          Seus Projetos
        </h1>

        <button
          onClick={onCreateProject}
          className="bg-brand-orange hover:bg-brand-orange-hover text-white px-4 py-2 rounded-xl flex items-center gap-2 shadow-md active:scale-95 transition-transform"
        >
          <Plus size={18} /> Novo Projeto
        </button>
      </div>

      {/* LISTA DE PROJETOS */}
      <div className="grid grid-cols-1 gap-4">
        {projects.map((project) => {
          const image = project.coverImage || project.photos?.[0]?.url;

          return (
            <div
              key={project.id}
              onClick={() => onSelectProject(project)}
              className="bg-white dark:bg-[#151515] rounded-2xl shadow-md overflow-hidden border border-gray-200 dark:border-white/5 cursor-pointer transition-all hover:scale-[1.01]"
            >
              {/* IMAGEM DE CAPA */}
              <div className="relative h-48 w-full bg-gray-200 dark:bg-gray-800">
                {image ? (
                  <img
                    src={image}
                    alt="Foto de capa"
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center text-gray-400">
                    <Camera size={40} />
                  </div>
                )}

                {/* Contador de fotos */}
                <div className="absolute bottom-2 right-2 bg-black/60 text-white text-xs px-2 py-1 rounded-xl flex items-center gap-1">
                  <Camera size={12} />
                  {project.photos?.length || 0}
                </div>
              </div>

              {/* INFORMACOES DO IMOVEL */}
              <div className="p-4 flex justify-between items-start">
                <div>
                  <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
                    {project.title}
                  </h2>
                  <p className="text-sm text-gray-500 dark:text-gray-400">
                    {project.address}
                  </p>
                </div>

                {/* DELETE */}
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    onDeleteProject(project.id);
                  }}
                  className="p-2 rounded-full hover:bg-red-100 dark:hover:bg-red-500/20 text-red-600 dark:text-red-400 transition-colors"
                >
                  <Trash2 size={20} />
                </button>
              </div>
            </div>
          );
        })}
      </div>

      {/* BOTÃO FLUTUANTE */}
      <div className="fixed bottom-8 left-0 right-0 flex justify-center pointer-events-none">
        <button
          onClick={onCreateProject}
          className="pointer-events-auto bg-brand-orange hover:bg-brand-orange-hover text-white px-8 py-3.5 rounded-full font-bold text-sm shadow-lg shadow-orange-500/30 active:scale-95 transition-transform flex items-center gap-2"
        >
          <Plus size={18} />
          Criar Projeto
        </button>
      </div>
    </div>
  );
};

export default ProjectList;
