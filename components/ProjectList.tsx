import React from 'react';
import { Project } from '../types';
import { Search, Settings, Camera, Image as ImageIcon } from 'lucide-react';
import { Logo } from './Logo';

interface ProjectListProps {
  projects: Project[];
  onSelectProject: (project: Project) => void;
  onCreateProject: () => void;
  onDeleteProject: (projectId: string) => void;
}

export const ProjectList: React.FC<ProjectListProps> = ({ projects, onSelectProject, onCreateProject, onDeleteProject }) => {
  return (
    <div className="bg-[#1a1a1a] min-h-screen pb-24 relative font-sans text-white">
      {/* Header */}
      <div className="sticky top-0 z-20 bg-[#1a1a1a] px-4 py-4 flex justify-between items-center">
         <div className="flex items-center gap-3">
             <Search className="w-6 h-6 text-white" />
         </div>
         <div className="flex items-center justify-center">
             <div className="flex items-center gap-2">
                 <span className="font-bold text-xl tracking-tight">snap</span>
                 <span className="font-medium text-lg text-[#623aa2]">immobile</span>
             </div>
         </div>
         <Settings className="w-6 h-6 text-white" />
      </div>

      <div className="px-4 py-2">
          <h2 className="text-lg font-medium mb-4">Actividade recente</h2>
          
          <div className="space-y-6">
            {projects.length === 0 ? (
              <div className="text-center py-20 opacity-40">
                  <div className="bg-gray-800 p-6 rounded-full inline-flex mb-4">
                      <ImageIcon className="w-10 h-10 text-gray-400" />
                  </div>
                  <h3 className="text-lg font-medium text-white">Sem imóveis</h3>
                  <p className="text-gray-400 mt-2">Crie um novo imóvel para começar.</p>
              </div>
            ) : (
              projects.map((project) => (
                <div 
                  key={project.id} 
                  onClick={() => onSelectProject(project)}
                  className="cursor-pointer group"
                >
                  {/* Title & Date */}
                  <div className="mb-2">
                      <h3 className="text-white text-lg font-bold truncate">
                          {project.title}
                      </h3>
                      <p className="text-gray-400 text-xs">
                          {new Date(project.createdAt).toLocaleDateString('pt-PT', { day: 'numeric', month: 'long', year: 'numeric' })}
                      </p>
                  </div>
                  
                  {/* Card Image */}
                  <div className="aspect-video w-full bg-gray-800 rounded-xl overflow-hidden relative border border-gray-800">
                    {project.coverImage ? (
                      <img 
                        src={project.coverImage} 
                        alt={project.title} 
                        className="w-full h-full object-cover opacity-90 group-hover:opacity-100 transition-opacity"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-gray-600">
                        <ImageIcon className="w-12 h-12" />
                      </div>
                    )}
                    
                    {/* Photo Count Badge */}
                    <div className="absolute bottom-3 left-3 bg-black/60 backdrop-blur-sm text-white text-xs font-medium px-2 py-1 rounded-md flex items-center gap-1.5">
                        <Camera className="w-3 h-3" />
                        <span>{project.photos.length}</span>
                    </div>

                    {/* Status Indicator */}
                    <div className={`absolute top-3 right-3 w-8 h-8 rounded-lg flex items-center justify-center font-bold text-xs bg-gray-900/80 text-white border border-white/10`}>
                        {project.title.charAt(0).toUpperCase()}
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
      </div>

      {/* Floating "Novo imóvel" Button */}
      <div className="fixed bottom-8 left-0 right-0 flex justify-center z-30 pointer-events-none">
          <button 
            onClick={onCreateProject}
            className="pointer-events-auto bg-[#333333] text-white px-6 py-3 rounded-full flex items-center gap-3 shadow-2xl border border-white/10 hover:bg-[#444444] transition-colors"
          >
              <span className="text-2xl font-light mb-1">+</span>
              <span className="font-medium">Novo imóvel</span>
          </button>
      </div>
    </div>
  );
};