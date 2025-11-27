
import React from 'react';
import { Project } from '../types';
import { MoreHorizontal, Image as ImageIcon, Box, Video } from 'lucide-react';
import { formatDate, formatTime } from '../utils/helpers';

interface ProjectCardProps {
  project: Project;
  onSelect: (project: Project) => void;
  onDelete: (projectId: string) => void;
}

export const ProjectCard: React.FC<ProjectCardProps> = ({ project, onSelect, onDelete }) => {
  return (
    <div 
        onClick={() => onSelect(project)}
        className="bg-white border border-gray-200 rounded-lg overflow-hidden cursor-pointer hover:shadow-md transition-shadow group relative"
    >
        {/* Image Area */}
        <div className="aspect-[16/9] relative bg-gray-100">
            {project.coverImage ? (
                <img src={project.coverImage} className="w-full h-full object-cover" alt={project.title} />
            ) : (
                <div className="w-full h-full flex items-center justify-center text-gray-400"><ImageIcon className="w-10 h-10" /></div>
            )}
            
            {/* Overlay Top */}
            <div className="absolute top-3 left-3 flex gap-2">
                <button onClick={(e) => { e.stopPropagation(); onDelete(project.id); }} className="p-1 bg-black/40 hover:bg-red-600 text-white rounded transition-colors text-xs">
                    Apagar
                </button>
            </div>
            <div className="absolute top-3 right-3">
                <button className="p-1 rounded-full bg-white/90 hover:bg-white text-gray-700">
                    <MoreHorizontal className="w-4 h-4" />
                </button>
            </div>

            {/* Overlay Status */}
            <div className="absolute bottom-10 right-3">
                <div className="w-8 h-8 rounded-full bg-white flex items-center justify-center shadow-sm">
                    <div className="w-7 h-7 rounded-full border-2 border-orange-400 flex items-center justify-center">
                        <span className="text-[10px] font-bold text-gray-700">{project.title.charAt(0).toUpperCase()}</span>
                    </div>
                </div>
            </div>

            {/* Stats Overlay Bar */}
            <div className="absolute bottom-0 left-0 right-0 bg-black/40 backdrop-blur-[2px] flex items-center gap-4 px-3 py-1.5 text-white/90 text-[10px] font-medium">
                <div className="flex items-center gap-1"><ImageIcon className="w-3 h-3" /> {project.photos.length}</div>
                <div className="flex items-center gap-1"><Box className="w-3 h-3" /> 0</div>
                <div className="flex items-center gap-1"><Video className="w-3 h-3" /> 0</div>
            </div>
        </div>

        {/* Content Area */}
        <div className="p-3">
            <h3 className="text-sm font-bold text-blue-900 truncate mb-1">{project.title}</h3>
            <p className="text-xs text-gray-500">
                {formatDate(project.createdAt)}, {formatTime(project.createdAt)}
            </p>
        </div>
    </div>
  );
};
