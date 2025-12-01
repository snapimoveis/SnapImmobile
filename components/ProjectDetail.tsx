import React from 'react';
import { Project } from '../types';
import { Plus, Search, MapPin, Camera, Bed, Bath, Square } from 'lucide-react';
import { Button } from './ui'; // Importando os componentes novos

interface ProjectListProps {
  projects: Project[];
  onSelectProject: (project: Project) => void;
  onCreateProject: () => void;
  onDeleteProject: (id: string) => void;
}

export const ProjectList: React.FC<ProjectListProps> = ({ projects, onSelectProject, onCreateProject }) => {
  
  // Estado vazio com visual melhorado
  if (projects.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center h-[80vh] p-6 animate-in fade-in duration-500">
        <div className="w-32 h-32 bg-brand-purple/10 rounded-full flex items-center justify-center mb-6 animate-bounce-slow">
          <Camera size={48} className="text-brand-purple" />
        </div>
        <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">Nenhum imóvel encontrado</h2>
        <p className="text-gray-500 dark:text-gray-400 text-center max-w-md mb-8">
          Comece a construir o seu portefólio imobiliário. Crie o seu primeiro imóvel para capturar fotos profissionais.
        </p>
        <Button onClick={onCreateProject} variant="secondary" size="lg">
          <Plus size={20} className="mr-2" />
          Criar Novo Imóvel
        </Button>
      </div>
    );
  }

  return (
    <div className="min-h-full pb-24 bg-brand-gray-50 dark:bg-black transition-colors duration-300">
      
      {/* Header da Lista */}
      <div className="sticky top-0 z-20 bg-brand-gray-50/90 dark:bg-black/90 backdrop-blur-md px-6 py-4 flex justify-between items-center border-b border-gray-200 dark:border-white/10">
        <div>
          <h1 className="text-2xl font-bold text-brand-purple dark:text-white">IMÓVEIS</h1>
          <p className="text-xs text-gray-500 dark:text-gray-400 font-medium">{projects.length} Imóveis listados</p>
        </div>
        <div className="flex gap-3">
             <button className="p-2.5 text-brand-purple bg-white dark:bg-white/10 rounded-xl shadow-sm hover:bg-gray-50 transition-colors">
                <Search size={20} />
             </button>
             <button className="p-2.5 text-brand-purple bg-white dark:bg-white/10 rounded-xl shadow-sm hover:bg-gray-50 transition-colors">
                <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"></path><circle cx="12" cy="7" r="4"></circle></svg>
             </button>
        </div>
      </div>

      <div className="p-6 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
        {projects.map((project) => (
          <div 
            key={project.id} 
            onClick={() => onSelectProject(project)}
            className="group bg-white dark:bg-[#121212] rounded-2xl shadow-card hover:shadow-xl transition-all duration-300 cursor-pointer overflow-hidden border border-transparent hover:border-brand-purple/30 flex flex-col"
          >
            {/* Imagem de Capa */}
            <div className="relative aspect-[4/3] overflow-hidden bg-gray-200 dark:bg-white/5">
              {project.coverImage ? (
                <img 
                  src={project.coverImage} 
                  alt={project.title} 
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" 
                />
              ) : (
                <div className="w-full h-full flex flex-col items-center justify-center text-gray-400">
                  <Camera size={40} strokeWidth={1.5} />
                  <span className="text-xs mt-2">Sem foto</span>
                </div>
              )}
              
              {/* Etiqueta de Status */}
              <div className="absolute top-3 left-3">
                 <span className={`px-2.5 py-1 rounded-lg text-[10px] font-bold uppercase tracking-wide shadow-sm ${
                    project.status === 'Completed' ? 'bg-green-500 text-white' : 'bg-white/90 text-brand-purple backdrop-blur-md'
                 }`}>
                    {project.status === 'Completed' ? 'Concluído' : 'Ativo'}
                 </span>
              </div>

              {/* Contador de Fotos */}
              <div className="absolute bottom-3 right-3 bg-black/60 backdrop-blur-md text-white px-2 py-1 rounded-lg text-xs font-medium flex items-center gap-1">
                 <Camera size={12} /> {project.photos.length}
              </div>
            </div>

            {/* Informações */}
            <div className="p-5 flex-1 flex flex-col">
              <h3 className="text-lg font-bold text-gray-900 dark:text-white leading-tight mb-1 line-clamp-1">{project.title}</h3>
              <div className="flex items-center gap-1 text-gray-500 dark:text-gray-400 text-sm mb-4">
                 <MapPin size={14} className="shrink-0" />
                 <span className="truncate">{project.address || 'Endereço não informado'}</span>
              </div>

              {/* Detalhes Rápidos (Ícones) */}
              <div className="flex items-center justify-between mt-auto pt-4 border-t border-gray-100 dark:border-white/10 text-gray-600 dark:text-gray-400 text-xs">
                 <div className="flex items-center gap-1.5">
                    <Bed size={16} className="text-brand-purple" /> 
                    <span>{project.details?.rooms || '-'}</span>
                 </div>
                 <div className="flex items-center gap-1.5">
                    <Bath size={16} className="text-brand-purple" /> 
                    <span>{project.details?.bathrooms || '-'}</span>
                 </div>
                 <div className="flex items-center gap-1.5">
                    <Square size={16} className="text-brand-purple" /> 
                    <span>{project.details?.area || '-'} m²</span>
                 </div>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
