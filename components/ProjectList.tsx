
import React from 'react';
import { Project } from '../types';
import { Search, Settings, Camera, Image as ImageIcon, Trash2 } from 'lucide-react';

interface ProjectListProps {
  projects: Project[];
  onSelectProject: (project: Project) => void;
  onCreateProject: () => void;
  onDeleteProject: (projectId: string) => void;
}

export const ProjectList: React.FC<ProjectListProps> = ({ projects, onSelectProject, onCreateProject, onDeleteProject }) => {
  return (
    <div className="bg-gray-900 min-h-screen pb-24 relative font-sans text-white">
      {/* Clean Header */}
      <div className="sticky top-0 z-20 bg-gray-900 px-4 py-4 flex justify-between items-center border-b border-white/5">
         <div className="flex items-center gap-3">
             <Search className="w-6 h-6 text-white/80" />
         </div>
         <div className="flex items-center justify-center">
             <div className="flex items-center gap-1">
                 <span className="font-bold text-xl tracking-tight text-white">snap</span>
                 <span className="font-medium text-xl text-[#623aa2]">immobile</span>
             </div>
         </div>
         <Settings className="w-6 h-6 text-white/80" />
      </div>

      <div className="px-4 py-6">
          <h2 className="text-lg font-medium mb-4 text-white/90">Actividade recente</h2>
          
          <div className="grid gap-6">
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
                  className="cursor-pointer group bg-gray-900 rounded-2xl overflow-hidden"
                >
                  {/* Title & Date Header Area */}
                  <div className="mb-3 px-1">
                      <h3 className="text-white text-lg font-bold leading-tight truncate">
                          {project.title}
                      </h3>
                      <p className="text-gray-400 text-xs mt-1">
                          {new Date(project.createdAt).toLocaleDateString('pt-PT', { day: 'numeric', month: 'long', year: 'numeric' })}
                      </p>
                  </div>
                  
                  {/* Card Image */}
                  <div className="aspect-video w-full bg-gray-800 rounded-2xl overflow-hidden relative border border-gray-800 shadow-lg">
                    {project.coverImage ? (
                      <img 
                        src={project.coverImage} 
                        alt={project.title} 
                        className="w-full h-full object-cover opacity-95 group-hover:opacity-100 transition-opacity"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-gray-600">
                        <ImageIcon className="w-12 h-12" />
                      </div>
                    )}
                    
                    {/* Delete Button (Top Left) */}
                    <button 
                        onClick={(e) => {
                            e.stopPropagation();
                            onDeleteProject(project.id);
                        }}
                        className="absolute top-3 left-3 w-8 h-8 rounded-lg flex items-center justify-center bg-black/40 text-white/70 hover:text-white hover:bg-red-600/90 backdrop-blur-md transition-all z-10"
                    >
                        <Trash2 className="w-4 h-4" />
                    </button>
                    
                    {/* Photo Count Badge (Bottom Left) */}
                    <div className="absolute bottom-3 left-3 bg-black/60 backdrop-blur-md text-white text-xs font-semibold px-2.5 py-1.5 rounded-lg flex items-center gap-1.5">
                        <Camera className="w-3.5 h-3.5" />
                        <span>{project.photos.length}</span>
                    </div>

                    {/* Status Indicator (Top Right) */}
                    <div className={`absolute top-3 right-3 w-8 h-8 rounded-lg flex items-center justify-center font-bold text-xs bg-gray-900/60 backdrop-blur-md text-white border border-white/10`}>
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
            className="pointer-events-auto bg-[#1f1f1f] text-white px-6 py-3 rounded-full flex items-center gap-3 shadow-2xl border border-white/10 hover:bg-[#2a2a2a] transition-colors"
          >
              <span className="text-2xl font-light leading-none mb-1">+</span>
              <span className="font-medium text-sm">Novo imóvel</span>
          </button>
      </div>
    </div>
  );
};