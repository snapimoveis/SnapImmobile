import React from 'react';
import { Project } from '../types';
import { Plus, Search, MapPin, Camera, Image as ImageIcon, ChevronRight, Bed, Bath, Square } from 'lucide-react';
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

  // ESTADO VAZIO COM LOGO
  if (projects.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center h-[70vh] text-center p-6 animate-in fade-in zoom-in duration-500">
        {/* Logo em vez de ícone de câmera */}
        <img src="/brand/logo_color.png" alt="Snap Immobile" className="h-16 w-auto mb-6 dark:hidden opacity-80" />
        <img src="/brand/logo_color.png" alt="Snap Immobile" className="h-16 w-auto mb-6 hidden dark:block brightness-0 invert opacity-80" />
        
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
      <div className="pt-6 px-6 pb-4 flex justify-between items-center sticky top-0 z-20 bg-brand-gray-50/90 dark:bg-brand-dark/90 backdrop-blur-md">
        <div className="flex items-center gap-3">
           {/* Logo pequeno no mobile para branding */}
           <div className="md:hidden">
              <img src="/brand/logo_color.png" className="h-8 w-auto dark:hidden" alt="Logo" />
              <img src="/brand/logo_color.png" className="h-8 w-auto hidden dark:block brightness-0 invert" alt="Logo" />
           </div>
           <div className="hidden md:block">
             <h1 className="text-2xl font-bold tracking-tight">Início</h1>
             <p className="text-xs text-gray-500 dark:text-gray-400 font-medium">Bem-vindo ao seu painel</p>
           </div>
        </div>
        <button className="p-3 bg-white dark:bg-white/10 border border-gray-100 dark:border-transparent rounded-xl text-brand-purple dark:text-gray-300 shadow-sm hover:bg-gray-50 transition-colors">
            <Search size={20} />
        </button>
      </div>

      <div className="px-6 space-y-10">
        
        {/* ATIVIDADE RECENTE */}
        {recentProjects.length > 0 && (
          <div>
              <div className="flex justify-between items-center mb-4">
                  <h2 className="text-lg font-bold text-gray-800 dark:text-gray-100">Atividade recente</h2>
              </div>
              <div className="flex gap-4 overflow-x-auto no-scrollbar pb-4 -mx-6 px-6">
                  {recentProjects.map(proj => (
                      <div key={proj.id} onClick={() => onSelectProject(proj)} className="shrink-0 w-40 cursor-pointer active:scale-95 transition-transform group">
                          <div className="aspect-square rounded-2xl overflow-hidden bg-white dark:bg-[#1a1a1a] border border-gray-100 dark:border-white/10 relative shadow-sm group-hover:border-brand-purple/50 transition-colors">
                              {proj.coverImage ? (
                                  <img src={proj.coverImage} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500" alt="" />
                              ) : (
                                  <div className="w-full h-full flex items-center justify-center"><ImageIcon size={24} className="text-gray-300 dark:text-gray-600"/></div>
                              )}
                              <div className="absolute bottom-2 left-2 bg-white/90 dark:bg-black/60 backdrop-blur-md p-1.5 rounded-lg border border-white/20 shadow-sm">
                                  <MapPin size={12} className="text-brand-purple dark:text-white" />
                              </div>
                          </div>
                          <p className="mt-2 text-xs font-bold text-gray-700 dark:text-gray-300 truncate px-1 group-hover:text-brand-purple transition-colors">{proj.title}</p>
                      </div>
                  ))}
              </div>
          </div>
        )}

        {/* TODOS OS IMÓVEIS */}
        <div className="space-y-8">
            <div className="flex justify-between items-end">
               <h2 className="text-lg font-bold text-gray-800 dark:text-gray-100">Todos os imóveis</h2>
               <button onClick={onCreateProject} className="text-xs font-bold text-brand-purple hover:underline">+ Novo</button>
            </div>
            
            {projects.map((project) => (
                <Card 
                    key={project.id} 
                    onClick={() => onSelectProject(project)}
                    hoverEffect
                    className="flex flex-col"
                >
                    {/* Imagem */}
                    <div className="relative aspect-[16/9] bg-gray-100 dark:bg-white/5 overflow-hidden">
                        {project.coverImage ? (
                            <img src={project.coverImage} className="w-full h-full object-cover" alt={project.title} />
                        ) : (
                            <div className="w-full h-full flex flex-col items-center justify-center text-gray-300 dark:text-gray-600">
                                <Camera size={32} strokeWidth={1.5} />
                            </div>
                        )}
                        
                        <div className="absolute top-3 left-3">
                             <span className="px-2.5 py-1 bg-white/90 dark:bg-black/80 backdrop-blur-md rounded-lg text-[10px] font-bold uppercase text-brand-purple shadow-sm">
                                {project.status === 'Completed' ? 'Concluído' : 'Ativo'}
                             </span>
                        </div>
                        
                        <div className="absolute bottom-3 right-3 bg-black/60 backdrop-blur-md text-white px-2 py-1 rounded-lg text-xs font-medium flex items-center gap-1">
                             <Camera size={12} /> {project.photos.length}
                        </div>
                    </div>

                    {/* Info */}
                    <div className="p-4">
                        <div className="flex justify-between items-start mb-2">
                             <h3 className="text-lg font-bold text-gray-900 dark:text-white line-clamp-1">{project.title}</h3>
                             <ChevronRight size={18} className="text-gray-300" />
                        </div>
                        <div className="flex items-center gap-1 text-gray-500 dark:text-gray-400 text-xs mb-4">
                             <MapPin size={12} />
                             <span className="truncate">{project.address || 'Endereço não informado'}</span>
                             <span className="mx-1">•</span>
                             <span>{formatDate(project.createdAt)}</span>
                        </div>

                        <div className="flex items-center justify-between pt-3 border-t border-gray-100 dark:border-white/10 text-xs text-gray-600 dark:text-gray-400">
                             <div className="flex gap-4">
                                <span className="flex items-center gap-1"><Bed size={14} className="text-brand-purple"/> {project.details?.rooms || '-'}</span>
                                <span className="flex items-center gap-1"><Bath size={14} className="text-brand-purple"/> {project.details?.bathrooms || '-'}</span>
                                <span className="flex items-center gap-1"><Square size={14} className="text-brand-purple"/> {project.details?.area || '-'} m²</span>
                             </div>
                        </div>
                    </div>
                </Card>
            ))}
        </div>
      </div>
    </div>
  );
};
