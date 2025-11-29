import React from 'react';
import { Project } from '../types';
import { Plus, MapPin, Calendar, ChevronRight, Trash2, Image as ImageIcon } from 'lucide-react';

interface ProjectListProps {
  projects: Project[];
  onSelectProject: (project: Project) => void;
  onCreateProject: () => void;
  onDeleteProject: (id: string) => void;
}

export const ProjectList: React.FC<ProjectListProps> = ({ projects, onSelectProject, onCreateProject, onDeleteProject }) => {
  
  // Estado vazio (Empty State)
  if (projects.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center h-[60vh] text-center p-6 animate-in fade-in zoom-in duration-500">
        <div className="w-20 h-20 bg-white/5 border border-white/10 rounded-full flex items-center justify-center mb-6">
          <Plus size={40} className="text-gray-500" />
        </div>
        <h2 className="text-xl font-bold text-white mb-2">Sem projetos ainda</h2>
        <p className="text-gray-400 max-w-xs mb-8">Comece por criar o seu primeiro projeto imobiliário para gerir as fotos.</p>
        <button 
          onClick={onCreateProject}
          className="bg-yellow-400 hover:bg-yellow-300 text-black font-bold py-3 px-8 rounded-full shadow-lg shadow-yellow-400/20 transition-all active:scale-95"
        >
          Criar Novo Projeto
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-in slide-in-from-bottom-4 duration-500">
      
      {/* Cabeçalho */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
           <h1 className="text-2xl font-bold text-white">Meus Imóveis</h1>
           <p className="text-sm text-gray-400">{projects.length} projetos ativos</p>
        </div>
        <button 
          onClick={onCreateProject}
          className="hidden md:flex items-center gap-2 bg-white/10 text-white border border-white/10 px-5 py-2.5 rounded-lg hover:bg-white/20 transition-all shadow-md"
        >
          <Plus size={18} />
          <span>Novo Projeto</span>
        </button>
      </div>

      {/* Grid Responsivo */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 md:gap-6 pb-safe">
        {projects.map((project) => (
          <div 
            key={project.id} 
            onClick={() => onSelectProject(project)}
            className="group bg-[#121212] rounded-xl border border-white/10 overflow-hidden hover:border-yellow-400/50 transition-all duration-300 cursor-pointer flex flex-col hover:-translate-y-1 shadow-lg"
          >
            {/* Imagem de Capa */}
            <div className="relative aspect-video bg-black/50 overflow-hidden">
               {project.coverImage ? (
                 <img 
                    src={project.coverImage} 
                    alt={project.title} 
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500 opacity-80 group-hover:opacity-100" 
                 />
               ) : (
                 <div className="w-full h-full flex items-center justify-center text-gray-700">
                    <ImageIcon size={40} />
                 </div>
               )}
               
               {/* Badge de Fotos */}
               <div className="absolute top-2 right-2 bg-black/60 backdrop-blur-md border border-white/10 px-2 py-1 rounded text-xs font-bold text-white shadow-sm flex items-center gap-1">
                  <ImageIcon size={10} className="text-yellow-400"/>
                  {project.photos.length}
               </div>
            </div>

            {/* Conteúdo */}
            <div className="p-4 flex-1 flex flex-col">
              <div className="flex justify-between items-start mb-2">
                 <h3 className="font-bold text-white truncate flex-1 pr-2 text-lg">{project.title}</h3>
                 <ChevronRight size={16} className="text-gray-600 group-hover:text-yellow-400 transition-colors" />
              </div>
              
              <div className="flex items-center gap-1.5 text-gray-400 text-xs mb-1">
                 <MapPin size={12} className="text-gray-500" />
                 <span className="truncate">{project.address || 'Sem morada'}</span>
              </div>
              
              <div className="flex items-center gap-1.5 text-gray-500 text-xs mb-4">
                 <Calendar size={12} />
                 <span>{new Date(project.createdAt).toLocaleDateString()}</span>
              </div>

              {/* Botão Deletar */}
              <div className="mt-auto pt-3 border-t border-white/5 flex justify-end">
                 <button 
                    onClick={(e) => { e.stopPropagation(); onDeleteProject(project.id); }}
                    className="p-2 text-gray-500 hover:text-red-400 hover:bg-red-400/10 rounded-full transition-colors"
                    title="Eliminar projeto"
                 >
                    <Trash2 size={16} />
                 </button>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
