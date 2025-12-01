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

      {/* HEADER */}
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

      {/* LISTA */}
      {projects.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20 text-center">
          <div className="w-20 h-20 bg-gray-200 dark:bg-white/10 rounded-full flex items-center justify-center mb-4">
            <Camera size={32} className="text-gray-400" />
          </div>
          <p className="text-gray-500 dark:text-gray-400 font-medium">
            Nenhum projeto criado ainda.
          </p>
          <p className="text-xs text-gray-400 mt-1">
            Toque em “Novo Projeto” para começar.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-4">
          {projects.map((project) => (
            <div
              key={project.id}
              onClick={() => onSelectProject(project)}
              className="bg-white dark:bg-[#151515] p-4 rounded-xl shadow-sm hover:shadow-md border border-gray-100 dark:border-white/5 cursor-pointer transition-all"
            >
              <div className="flex justify-between items-center">
                <div>
                  <h2 className="text-lg font-bold text-gray-900 dark:text-white">
                    {project.title}
                  </h2>
                  <p className="text-sm text-gray-500 dark:text-gray-400">
                    {project.address}
                  </p>
                </div>

                <button
                  onClick={(e) => {
                    e.stopPropagation(); // evita abrir projeto ao apagar
                    onDeleteProject(project.id);
                  }}
                  className="p-2 rounded-full hover:bg-red-100 dark:hover:bg-red-500/20 text-red-600 dark:text-red-400 transition-colors"
                >
                  <Trash2 size={20} />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

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
