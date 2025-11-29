import React from 'react';
import { Project } from '../types';
import { Plus, Search, Settings, Camera, MapPin, MoreVertical } from 'lucide-react';

interface ProjectListProps {
  projects: Project[];
  onSelectProject: (project: Project) => void;
  onCreateProject: () => void;
  onDeleteProject: (id: string) => void;
}

export const ProjectList: React.FC<ProjectListProps> = ({ projects, onSelectProject, onCreateProject, onDeleteProject }) => {
  
  // Função auxiliar para formatar data estilo "8 de outubro de 2025"
  const formatDate = (timestamp: number) => {
    return new Date(timestamp).toLocaleDateString('pt-PT', { day: 'numeric', month: 'long', year: 'numeric' });
  };

  if (projects.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center h-[70vh] text-center p-6 dark:text-white">
        <div className="w-20 h-20 bg-gray-200 dark:bg-white/10 rounded-full flex items-center justify-center mb-6">
          <Camera size={40} className="text-gray-500 dark:text-gray-300" />
        </div>
        <h2 className="text-xl font-bold mb-2">Sem imóveis recentes</h2>
        <p className="text-gray-500 dark:text-gray-400 max-w-xs mb-8">Comece por criar o seu primeiro imóvel.</p>
        <button 
          onClick={onCreateProject}
          className="bg-gray-900 dark:bg-white text-white dark:text-black font-medium py-3 px-8 rounded-full shadow-lg active:scale-95 transition-transform"
        >
          + Novo imóvel
        </button>
      </div>
    );
  }

  // Filtrar os 3 projetos mais recentes para a "Atividade recente"
  const recentProjects = [...projects].sort((a, b) => b.createdAt - a.createdAt).slice(0, 3);

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-[#121212] pb-24 text-gray-900 dark:text-white transition-colors duration-300">
      
      {/* --- HEADER --- */}
      <div className="pt-4 px-4 pb-2 flex justify-between items-center">
        <Search size={24} className="text-gray-600 dark:text-gray-300" />
        <Settings size={24} className="text-gray-600 dark:text-gray-300" />
      </div>

      <div className="p-4 space-y-8">
        
        {/* --- ATIVIDADE RECENTE (Scroll Horizontal) --- */}
        <div>
            <div className="flex justify-between items-center mb-4">
                <h2 className="text-lg font-bold">Actividade recente</h2>
                <button className="text-gray-400 hover:text-white"><span className="sr-only">Fechar</span>×</button>
            </div>
            
            <div className="flex gap-4 overflow-x-auto no-scrollbar pb-2">
                {recentProjects.map(proj => (
                    <div key={proj.id} onClick={() => onSelectProject(proj)} className="shrink-0 w-32 cursor-pointer active:opacity-80">
                        <div className="aspect-square rounded-2xl overflow-hidden bg-gray-200 dark:bg-gray-800 relative">
                            {proj.coverImage ? (
                                <img src={proj.coverImage} className="w-full h-full object-cover" alt="" />
                            ) : (
                                <div className="w-full h-full flex items-center justify-center"><Camera size={24} className="text-gray-400"/></div>
                            )}
                            <div className="absolute bottom-2 left-2 bg-black/50 backdrop-blur-sm p-1 rounded-md">
                                <MapPin size={12} className="text-white" />
                            </div>
                        </div>
                    </div>
                ))}
            </div>
        </div>

        {/* --- LISTA DE PROJETOS (Cards Grandes) --- */}
        <div className="space-y-8">
            {projects.map((project) => (
                <div 
                    key={project.id} 
                    onClick={() => onSelectProject(project)}
                    className="cursor-pointer active:scale-[0.99] transition-transform"
                >
                    {/* Título e Data FORA da imagem, em cima */}
                    <div className="mb-2 px-1">
                        <h3 className="text-xl font-bold leading-tight">{project.title}</h3>
                        <p className="text-sm text-gray-500 dark:text-gray-400">{formatDate(project.createdAt)}</p>
                    </div>

                    {/* Imagem Grande */}
                    <div className="aspect-[4/3] w-full bg-gray-200 dark:bg-gray-800 rounded-2xl overflow-hidden relative shadow-sm">
                        {project.coverImage ? (
                            <img src={project.coverImage} className="w-full h-full object-cover" alt={project.title} />
                        ) : (
                            <div className="w-full h-full flex flex-col items-center justify-center text-gray-400">
                                <Camera size={48} strokeWidth={1} />
                            </div>
                        )}

                        {/* Badge de Fotos (Canto inferior esquerdo) */}
                        <div className="absolute bottom-3 left-3 bg-black/60 backdrop-blur-md px-2 py-1 rounded-md flex items-center gap-1.5 text-white">
                            <Camera size={14} />
                            <span className="text-xs font-bold">{project.photos.length}</span>
                        </div>

                        {/* Marca d'água simulada (opcional, como na foto) */}
                        <div className="absolute bottom-3 right-3 opacity-60">
                             {/* <span className="text-[10px] font-bold text-white tracking-widest uppercase">NODALVIEW</span> */}
                        </div>
                    </div>
                </div>
            ))}
        </div>

      </div>

      {/* --- FAB (Botão Flutuante Central) --- */}
      <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-50">
        <button 
            onClick={onCreateProject}
            className="flex items-center gap-2 bg-gray-900 dark:bg-[#202020] text-white px-6 py-3.5 rounded-full shadow-2xl border border-gray-700 active:scale-95 transition-transform"
        >
            <Plus size={20} />
            <span className="font-medium text-sm">+ Novo imóvel</span>
        </button>
      </div>

    </div>
  );
};
