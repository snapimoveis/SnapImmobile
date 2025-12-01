import React from 'react';
import { Project } from '../types';
import { Search, MapPin, Camera, Image as ImageIcon, ChevronRight, Bed, Bath, Square } from 'lucide-react';
import { Card, Button } from './ui';

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

  const recentProjects = [...projects].sort((a, b) => b.createdAt - a.createdAt).slice(0, 3);

  if (projects.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center h-[70vh] text-center p-6 animate-in fade-in zoom-in duration-500">
        <div className="w-24 h-24 bg-brand-gray-100 dark:bg-white/5 rounded-full flex items-center justify-center mb-6">
          <Camera size={40} className="text-gray-400" />
        </div>
        <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-2">Sem imóveis recentes</h2>
        <p className="text-gray-500 dark:text-gray-400 max-w-xs mb-8 text-sm">Comece por criar o seu primeiro imóvel para capturar fotos incríveis.</p>
        {/* Botão auxiliar caso o FAB não seja óbvio */}
      </div>
    );
  }

  return (
    <div className="min-h-full text-gray-900 dark:text-white transition-colors duration-300">
      
      {/* Barra de Pesquisa (Agora logo abaixo do Header principal) */}
      <div className="px-4 py-4 bg-white dark:bg-[#121212] border-b border-gray-100 dark:border-white/5 mb-6">
        <div className="relative">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <Search size={18} className="text-gray-400" />
            </div>
            <input 
                type="text" 
                placeholder="Pesquisar imóveis..." 
                className="w-full pl-10 pr-4 py-2.5 bg-brand-gray-100 dark:bg-white/10 border-none rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-brand-purple/50 text-gray-900 dark:text-white placeholder-gray-500"
            />
        </div>
      </div>

      <div className="px-4 space-y-8 pb-24">
        
        {/* ATIVIDADE RECENTE */}
        {recentProjects.length > 0 && (
          <div>
              <div className="flex justify-between items-center mb-3 px-1">
                  <h2 className="text-base font-bold text-gray-900 dark:text-white">Actividade recente</h2>
              </div>
              <div className="flex gap-3 overflow-x-auto no-scrollbar pb-2 -mx-4 px-4">
                  {recentProjects.map(proj => (
                      <div key={proj.id} onClick={() => onSelectProject(proj)} className="shrink-0 w-36 cursor-pointer active:scale-95 transition-transform group">
                          <div className="aspect-square rounded-xl overflow-hidden bg-gray-200 dark:bg-[#1a1a1a] border border-gray-100 dark:border-white/5 relative">
                              {proj.coverImage ? (
                                  <img src={proj.coverImage} className="w-full h-full object-cover" alt="" />
                              ) : (
                                  <div className="w-full h-full flex items-center justify-center"><ImageIcon size={24} className="text-gray-400"/></div>
                              )}
                              <div className="absolute bottom-1.5 left-1.5 bg-black/50 backdrop-blur-sm p-1 rounded-md">
                                  <MapPin size={10} className="text-white" />
                              </div>
                          </div>
                          <p className="mt-1.5 text-xs font-semibold text-gray-700 dark:text-gray-300 truncate px-0.5">{proj.title}</p>
                          <p className="text-[10px] text-gray-400 px-0.5">{formatDate(proj.createdAt)}</p>
                      </div>
                  ))}
              </div>
          </div>
        )}

        {/* LISTA VERTICAL (Estilo Referência) */}
        <div className="space-y-6">
            <div className="px-1">
               <h2 className="text-base font-bold text-gray-900 dark:text-white">Todos os imóveis</h2>
            </div>
            
            {projects.map((project) => (
                <div 
                    key={project.id} 
                    onClick={() => onSelectProject(project)}
                    className="cursor-pointer group active:scale-[0.98] transition-transform"
                >
                    {/* Título FORA do card, estilo referência */}
                    <div className="mb-2 px-1">
                        <h3 className="text-lg font-bold leading-tight text-gray-900 dark:text-white">{project.title}</h3>
                        <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">{formatDate(project.createdAt)}</p>
                    </div>

                    {/* Card Imagem */}
                    <div className="aspect-[4/3] w-full bg-white dark:bg-[#121212] rounded-2xl overflow-hidden relative shadow-sm border border-gray-200 dark:border-white/10">
                        {project.coverImage ? (
                            <img src={project.coverImage} className="w-full h-full object-cover" alt={project.title} />
                        ) : (
                            <div className="w-full h-full flex flex-col items-center justify-center text-gray-300 dark:text-gray-600 bg-gray-50 dark:bg-white/5">
                                <Camera size={32} strokeWidth={1.5} />
                            </div>
                        )}

                        {/* Menu de 3 pontos (visual) */}
                        <div className="absolute top-3 right-3 bg-white/90 dark:bg-black/60 backdrop-blur-md p-1.5 rounded-full shadow-sm">
                            <div className="flex gap-0.5">
                                <div className="w-1 h-1 bg-gray-800 dark:bg-white rounded-full"></div>
                                <div className="w-1 h-1 bg-gray-800 dark:bg-white rounded-full"></div>
                                <div className="w-1 h-1 bg-gray-800 dark:bg-white rounded-full"></div>
                            </div>
                        </div>
                        
                        {/* Badge de Fotos */}
                        <div className="absolute bottom-3 left-3 bg-black/60 backdrop-blur-md text-white px-2 py-1 rounded-md text-xs font-bold flex items-center gap-1.5 border border-white/10">
                             <Camera size={12} /> 
                             <span>{project.photos.length}</span>
                        </div>

                        {/* Marca d'água Nodalview Style (Opcional) */}
                        <div className="absolute bottom-3 right-3 opacity-50">
                             {/* <span className="text-[8px] font-black text-white uppercase tracking-widest drop-shadow-md">SNAP</span> */}
                        </div>
                    </div>
                </div>
            ))}
        </div>
      </div>
    </div>
  );
};
