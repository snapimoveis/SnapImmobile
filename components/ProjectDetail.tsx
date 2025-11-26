
import React, { useState } from 'react';
import { Project, Photo } from '../types';
import { ArrowLeft, Camera, Video, Image, Box, LayoutTemplate, MoreHorizontal } from 'lucide-react';
import JSZip from 'jszip';
import { WatermarkModal } from './WatermarkModal';
import { getCurrentUser } from '../services/storage';

interface ProjectDetailProps {
  project: Project;
  onBack: () => void;
  onEditPhoto: (photo: Photo) => void;
  onAddPhoto: () => void;
  onUpdateProject: (updatedProject: Project) => void;
  onViewTour: () => void;
}

export const ProjectDetail: React.FC<ProjectDetailProps> = ({ 
  project, 
  onBack, 
  onEditPhoto, 
  onAddPhoto
}) => {
  const [activeTab, setActiveTab] = useState<'360' | 'photo' | 'video' | 'planta'>('photo');
  
  return (
    <div className="min-h-screen bg-[#121212] text-white font-sans flex flex-col">
      
      {/* Mobile App Header Style */}
      <div className="sticky top-0 z-20 bg-[#121212] px-4 py-3 border-b border-white/5 flex justify-between items-center">
          <div className="flex items-center gap-4">
              <button onClick={onBack} className="text-white hover:text-gray-300">
                  <ArrowLeft className="w-6 h-6" />
              </button>
              
              <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-[#2a2a2a] flex items-center justify-center text-gray-300 font-bold text-sm border border-white/10 relative">
                      {project.title.charAt(0).toUpperCase()}
                      <div className="absolute -top-1 -right-1 w-3 h-3 bg-red-500 rounded-full border-2 border-[#121212]"></div>
                  </div>
                  <div>
                      <h1 className="font-bold text-base leading-tight text-white truncate max-w-[150px]">{project.title}</h1>
                      <p className="text-xs text-gray-400">
                          {new Date(project.createdAt).toLocaleDateString('pt-PT', { day: 'numeric', month: 'long', year: 'numeric' })}
                      </p>
                  </div>
              </div>
          </div>

          <button className="p-2 text-white">
              <MoreHorizontal className="w-6 h-6" />
          </button>
      </div>

      {/* Media Tabs */}
      <div className="flex items-center justify-around px-2 py-4 border-b border-white/5 bg-[#121212]">
          <button 
            onClick={() => setActiveTab('360')}
            className={`flex flex-col items-center gap-1 p-2 rounded-lg transition-all ${activeTab === '360' ? 'text-blue-500' : 'text-gray-500'}`}
          >
              <div className={`p-2 rounded-lg ${activeTab === '360' ? 'bg-blue-500/10' : 'bg-gray-800'}`}>
                  <Box className="w-5 h-5" />
              </div>
          </button>

          <button 
            onClick={() => setActiveTab('photo')}
            className={`flex flex-col items-center gap-1 p-2 rounded-lg transition-all relative ${activeTab === 'photo' ? 'text-blue-500' : 'text-gray-500'}`}
          >
              <div className={`p-2 rounded-lg ${activeTab === 'photo' ? 'bg-blue-600 text-white shadow-lg shadow-blue-900/50' : 'bg-gray-800'}`}>
                  <Image className="w-5 h-5" />
              </div>
              <span className="absolute -top-1 -right-1 bg-gray-700 text-white text-[10px] px-1.5 rounded-full border border-[#121212]">
                  {project.photos.length}
              </span>
          </button>

          <button 
            onClick={() => setActiveTab('video')}
            className={`flex flex-col items-center gap-1 p-2 rounded-lg transition-all ${activeTab === 'video' ? 'text-blue-500' : 'text-gray-500'}`}
          >
              <div className={`p-2 rounded-lg ${activeTab === 'video' ? 'bg-blue-500/10' : 'bg-gray-800'}`}>
                  <Video className="w-5 h-5" />
              </div>
          </button>

          <button 
            onClick={() => setActiveTab('planta')}
            className={`flex flex-col items-center gap-1 p-2 rounded-lg transition-all ${activeTab === 'planta' ? 'text-blue-500' : 'text-gray-500'}`}
          >
              <div className={`p-2 rounded-lg ${activeTab === 'planta' ? 'bg-blue-500/10' : 'bg-gray-800'}`}>
                  <LayoutTemplate className="w-5 h-5" />
              </div>
          </button>
      </div>

      {/* Grid Content */}
      <div className="p-1 pb-32">
          {activeTab === 'photo' && (
              <div className="grid grid-cols-3 gap-1">
                  {project.photos.map((photo) => (
                      <div 
                        key={photo.id} 
                        className="aspect-square bg-gray-800 overflow-hidden relative cursor-pointer"
                        onClick={() => onEditPhoto(photo)}
                      >
                          <img src={photo.url} className="w-full h-full object-cover" alt={photo.name} />
                      </div>
                  ))}
                  {project.photos.length === 0 && (
                      <div className="col-span-3 py-20 text-center text-gray-500 text-sm">
                          Nenhuma foto. Inicie a captura.
                      </div>
                  )}
              </div>
          )}
      </div>

      {/* Floating Capture Button */}
      <div className="fixed bottom-8 left-0 right-0 flex justify-center z-30 pointer-events-none">
          <button 
            onClick={onAddPhoto}
            className="pointer-events-auto bg-[#1f1f1f] text-white px-8 py-4 rounded-full flex items-center gap-3 shadow-2xl border border-white/10 hover:bg-[#333] transition-transform active:scale-95"
          >
              <Camera className="w-5 h-5" />
              <span className="font-medium text-sm">Iniciar captura</span>
          </button>
      </div>
    </div>
  );
};
