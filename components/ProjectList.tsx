import React from 'react';
import { Project } from '../types';
import { Search, UserCog, Camera, Image as ImageIcon } from 'lucide-react';

interface ProjectListProps {
  projects: Project[];
  onSelectProject: (project: Project) => void;
  onCreateProject: () => void;
  onDeleteProject: (projectId: string) => void;
}

export const ProjectList: React.FC<ProjectListProps> = ({ projects, onSelectProject, onCreateProject, onDeleteProject }) => {
  return (
    <div className="bg-white min-h-screen pb-24 relative font-sans">
      {/* Custom Header matching the image */}
      <div className="sticky top-0 z-20 bg-white px-6 py-4 flex justify-between items-center shadow-sm">
         <Search className="w-6 h-6 text-orange-600" />
         <h1 className="text-xl text-gray-800 tracking-[0.2em] uppercase font-light">IMÓVEIS</h1>
         <UserCog className="w-6 h-6 text-orange-600" />
      </div>

      <div className="p-6 space-y-8">
        {projects.length === 0 ? (
          <div className="text-center py-20 opacity-60">
              <div className="bg-gray-50 p-6 rounded-full inline-flex mb-4">
                  <ImageIcon className="w-10 h-10 text-gray-400" />
              </div>
              <h3 className="text-lg font-medium text-gray-900">Sem imóveis</h3>
              <p className="text-gray-500">Toque no botão da câmara para começar.</p>
          </div>
        ) : (
          projects.map((project) => (
            <div 
              key={project.id} 
              onClick={() => onSelectProject(project)}
              className="cursor-pointer group"
            >
              {/* Title above image as requested */}
              <h3 className="text-gray-600 text-sm mb-3 pl-1 font-medium truncate">
                  {project.title}
              </h3>
              
              <div className="aspect-video w-full bg-gray-100 rounded-2xl overflow-hidden shadow-sm group-hover:shadow-md transition-all border border-gray-100 relative">
                {project.coverImage ? (
                  <img 
                    src={project.coverImage} 
                    alt={project.title} 
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center text-gray-300">
                    <ImageIcon className="w-12 h-12" />
                  </div>
                )}
                
                {/* Optional: Subtle status dot instead of big badge */}
                <div className={`absolute top-3 right-3 w-3 h-3 rounded-full border-2 border-white ${project.status === 'Completed' ? 'bg-green-500' : 'bg-yellow-400'}`}></div>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Floating Action Button - Orange Camera */}
      <div className="fixed bottom-8 left-0 right-0 flex justify-center pointer-events-none z-30">
          <button 
            onClick={onCreateProject}
            className="pointer-events-auto bg-[#e05618] hover:bg-[#d04b0f] text-white w-16 h-16 rounded-full flex items-center justify-center shadow-2xl shadow-orange-600/40 transform transition-transform active:scale-90"
          >
              <Camera className="w-8 h-8" strokeWidth={2.5} />
          </button>
      </div>
    </div>
  );
};