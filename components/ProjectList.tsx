import React from 'react';
import { Project } from '../types';
import { Plus, Search, MapPin, Camera, Image as ImageIcon, ChevronRight } from 'lucide-react';
import { Card, Button } from './ui'; // Use os novos componentes UI

interface ProjectListProps {
  projects: Project[];
  onSelectProject: (project: Project) => void;
  onCreateProject: () => void;
  onDeleteProject: (id: string) => void;
}

export const ProjectList: React.FC<ProjectListProps> = ({ projects, onSelectProject, onCreateProject }) => {
  
  const formatDate = (timestamp: number) => {
    return new Date(timestamp).toLocaleDateString('pt-PT', { day: 'numeric', month: 'long', year: 'numeric' });
  };

  // Top 3 recentes
  const recentProjects = [...projects].sort((a, b) => b.createdAt - a.createdAt).slice(0, 3);

  if (projects.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center h-[70vh] text-center p-6 animate-in fade-in zoom-in duration-500">
        <div className="w-24 h-24 bg-white dark:bg-white/5 border border-gray-200 dark:border-white/10 rounded-full flex items-center justify-center mb-6 shadow-sm">
          <Camera size={40} className="text-gray-300 dark:text-gray-500" />
        </div>
        <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-2">Sem imóveis recentes</h2>
        <p className="text-gray-500 dark:text-gray-400 max-w-xs mb-8">Comece por criar o seu primeiro imóvel para capturar fotos incríveis.</p>
        <Button onClick={onCreateProject} variant="secondary">
          + Novo imóvel
        </Button>
      </div>
    );
  }

  return (
    <div className="min-h-full pb-24 bg-brand-gray-50 dark:bg-black text-gray-900 dark:text-white transition-colors duration-300">
      
      {/* HEADER */}
      <div className="pt-6 px-6 pb-4 flex justify-between items-center">
        <h1 className="text-2xl font-bold tracking-tight">Início</h1>
        <button className="p-3 bg-white dark:bg-white/10 border border-gray-100 dark:border-transparent rounded-full text-gray-500 dark:text-gray-300 shadow-sm hover:bg-gray-50 transition-colors">
            <Search size={20} />
        </button>
      </div>

      <div className="px-6 space-y-10">
        
        {/* ATIVIDADE RECENTE (Scroll Horizontal) */}
        {recentProjects.length > 0 && (
          <div>
              <div className="flex justify-between items-center mb-4">
                  <h2 className="text-lg font-bold text-gray-800 dark:text-gray-100">Actividade recente</h2>
              </div>
              <div className="flex gap-4 overflow-x-auto no-scrollbar pb-4 -mx-6 px-6">
                  {recentProjects.map(proj => (
                      <div key={proj.id} onClick={() => onSelectProject(proj)} className="shrink-0 w-40 cursor-pointer active:scale-95 transition-transform">
                          <div className="aspect-square rounded-2xl overflow-hidden bg-white dark:bg-[#1a1a1a] border border-gray-100 dark:border-white/10 relative shadow-sm">
                              {proj.coverImage ? (
                                  <img src={proj.coverImage} className="w-full h-full object-cover" alt="" />
                              ) : (
                                  <div className="w-full h-full flex items-center justify-center"><ImageIcon size={24} className="text-gray-300 dark:text-gray-600"/></div>
                              )}
                              <div className="absolute bottom-2 left-2 bg-white/90 dark:bg-black/60 backdrop-blur-md p-1.5 rounded-lg border border-white/20 shadow-sm">
                                  <MapPin size={12} className="text-brand-purple dark:text-white" />
                              </div>
                          </div>
                          <p className="mt-2 text-xs font-bold text-gray-700 dark:text-gray-300 truncate px-1">{proj.title}</p>
                      </div>
                  ))}
              </div>
          </div>
        )}

        {/* TODOS OS IMÓVEIS (Lista Vertical de Cards) */}
        <div className="space-y-8">
            <h2 className="text-lg font-bold text-gray-800 dark:text-gray-100">Todos os imóveis</h2>
            {projects.map((project) => (
                <div 
                    key={project.id} 
                    onClick={() => onSelectProject(project)}
                    className="cursor-pointer group"
                >
                    {/* Título fora do card (Estilo Nodalview) */}
                    <div className="mb-3 px-1 flex justify-between items-end">
                        <div>
                          <h3 className="text-lg font-bold leading-tight text-gray-900 dark:text-white">{project.title}</h3>
                          <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">{formatDate(project.createdAt)}</p>
                        </div>
                        <ChevronRight size={16} className="text-gray-300 group-hover:text-brand-purple transition-colors" />
                    </div>

                    {/* Card Imagem Grande */}
                    <div className="aspect-[4/3] w-full bg-white dark:bg-[#121212] rounded-3xl overflow-hidden relative shadow-md border border-gray-100 dark:border-white/10">
                        {project.coverImage ? (
                            <img src={project.coverImage} className="w-full h-full object-cover opacity-95 group-hover:opacity-100 transition-opacity" alt={project.title} />
                        ) : (
                            <div className="w-full h-full flex flex-col items-center justify-center text-gray-300 dark:text-gray-600 bg-gray-50 dark:bg-white/5">
                                <Camera size={48} strokeWidth={1} />
                                <span className="text-xs mt-2 font-medium">Sem foto de capa</span>
                            </div>
                        )}

                        {/* Badge de Fotos */}
                        <div className="absolute bottom-4 left-4 bg-white/90 dark:bg-black/80 backdrop-blur-md px-3 py-1.5 rounded-xl flex items-center gap-2 text-gray-900 dark:text-white border border-white/20 shadow-sm">
                            <Camera size={14} className="text-brand-purple dark:text-white" />
                            <span className="text-xs font-bold">{project.photos.length}</span>
                        </div>
                    </div>
                </div>
            ))}
        </div>
      </div>
    </div>
  );
};
