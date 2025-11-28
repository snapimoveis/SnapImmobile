
import React, { useState } from 'react';
import { Project, Photo } from '../types';
import { ArrowLeft, Camera, Video, Image, Box, LayoutTemplate, MoreHorizontal, CheckCircle, Circle, Download, X as XIcon, CheckSquare } from 'lucide-react';
import JSZip from 'jszip';
import { WatermarkModal } from './WatermarkModal'; // Kept if needed for single photo or future expansion
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
  
  // Selection State
  const [isSelectionMode, setIsSelectionMode] = useState(false);
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [isDownloading, setIsDownloading] = useState(false);

  const toggleSelectionMode = () => {
      setIsSelectionMode(!isSelectionMode);
      setSelectedIds([]);
  };

  const handlePhotoClick = (photo: Photo) => {
      if (isSelectionMode) {
          setSelectedIds(prev => 
              prev.includes(photo.id) 
                  ? prev.filter(id => id !== photo.id) 
                  : [...prev, photo.id]
          );
      } else {
          onEditPhoto(photo);
      }
  };

  const handleSelectAll = () => {
      if (activeTab === 'photo') {
          if (selectedIds.length === project.photos.length) {
              setSelectedIds([]);
          } else {
              setSelectedIds(project.photos.map(p => p.id));
          }
      }
  };

  const handleBatchDownload = async () => {
      if (selectedIds.length === 0) return;
      setIsDownloading(true);

      try {
          const zip = new JSZip();
          const folder = zip.folder(project.title) || zip;

          const photosToDownload = project.photos.filter(p => selectedIds.includes(p.id));

          const downloadPromises = photosToDownload.map(async (photo) => {
              try {
                  const response = await fetch(photo.url, { mode: 'cors' });
                  const blob = await response.blob();
                  const fileName = `${photo.name || 'photo'}.jpg`;
                  folder.file(fileName, blob);
              } catch (e) {
                  console.error(`Failed to download ${photo.id}`, e);
              }
          });

          await Promise.all(downloadPromises);

          const content = await zip.generateAsync({ type: "blob" });
          const link = document.createElement('a');
          link.href = URL.createObjectURL(content);
          link.download = `${project.title}_photos.zip`;
          document.body.appendChild(link);
          link.click();
          document.body.removeChild(link);
          
          setIsSelectionMode(false);
          setSelectedIds([]);
      } catch (error) {
          console.error("Batch download failed", error);
          alert("Erro ao criar ficheiro ZIP.");
      } finally {
          setIsDownloading(false);
      }
  };
  
  return (
    <div className="min-h-screen bg-[#121212] text-white font-sans flex flex-col">
      
      {/* Header */}
      <div className="sticky top-0 z-20 bg-[#121212] px-4 py-3 border-b border-white/5 flex justify-between items-center transition-all">
          {isSelectionMode ? (
              <div className="flex items-center gap-4 w-full justify-between animate-in fade-in">
                  <div className="flex items-center gap-4">
                      <button onClick={toggleSelectionMode} className="text-white/70 hover:text-white">
                          <XIcon className="w-6 h-6" />
                      </button>
                      <span className="font-bold text-lg">{selectedIds.length} selecionados</span>
                  </div>
                  <div className="flex gap-3">
                      <button onClick={handleSelectAll} className="p-2 text-white/80 hover:text-white" title="Selecionar Todos">
                          <CheckSquare className="w-6 h-6" />
                      </button>
                      {selectedIds.length > 0 && (
                          <button 
                            onClick={handleBatchDownload} 
                            disabled={isDownloading}
                            className="text-blue-400 font-bold text-sm flex items-center gap-2 bg-blue-500/10 px-3 py-1.5 rounded-lg hover:bg-blue-500/20"
                          >
                              {isDownloading ? 'A Baixar...' : 'Download'}
                              <Download className="w-4 h-4" />
                          </button>
                      )}
                  </div>
              </div>
          ) : (
              <div className="flex items-center gap-4 w-full justify-between animate-in fade-in">
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

                  <button onClick={toggleSelectionMode} className="p-2 text-white hover:bg-white/10 rounded-full transition-colors">
                      {/* Using CheckSquare as 'Select' icon */}
                      <CheckSquare className="w-6 h-6" />
                  </button>
              </div>
          )}
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
                  {project.photos.map((photo) => {
                      const isSelected = selectedIds.includes(photo.id);
                      return (
                          <div 
                            key={photo.id} 
                            className={`aspect-square bg-gray-800 overflow-hidden relative cursor-pointer group ${isSelectionMode && isSelected ? 'ring-2 ring-inset ring-blue-500' : ''}`}
                            onClick={() => handlePhotoClick(photo)}
                          >
                              <img 
                                src={photo.url} 
                                className={`w-full h-full object-cover transition-transform duration-300 ${isSelectionMode && isSelected ? 'scale-90' : ''}`} 
                                alt={photo.name} 
                              />
                              
                              {/* Selection Overlay */}
                              {isSelectionMode && (
                                  <div className={`absolute top-2 right-2 rounded-full bg-black/20 backdrop-blur-sm p-1 transition-all ${isSelected ? 'text-blue-500 bg-white' : 'text-white/50 border border-white/50'}`}>
                                      {isSelected ? (
                                          <CheckCircle className="w-5 h-5 fill-current" />
                                      ) : (
                                          <Circle className="w-5 h-5" />
                                      )}
                                  </div>
                              )}
                          </div>
                      );
                  })}
                  {project.photos.length === 0 && (
                      <div className="col-span-3 py-20 text-center text-gray-500 text-sm">
                          Nenhuma foto. Inicie a captura.
                      </div>
                  )}
              </div>
          )}
      </div>

      {/* Floating Capture Button (Hidden during selection) */}
      {!isSelectionMode && (
          <div className="fixed bottom-8 left-0 right-0 flex justify-center z-30 pointer-events-none">
              <button 
                onClick={onAddPhoto}
                className="pointer-events-auto bg-[#1f1f1f] text-white px-8 py-4 rounded-full flex items-center gap-3 shadow-2xl border border-white/10 hover:bg-[#333] transition-transform active:scale-95"
              >
                  <Camera className="w-5 h-5" />
                  <span className="font-medium text-sm">Iniciar captura</span>
              </button>
          </div>
      )}
    </div>
  );
};
