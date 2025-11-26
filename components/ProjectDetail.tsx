
import React, { useState } from 'react';
import { Project, Photo } from '../types';
import { ArrowLeft, MoreHorizontal, Camera, Video, Image, Box, List } from 'lucide-react';
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
  const [isDownloading, setIsDownloading] = useState(false);
  
  // Watermark State
  const [pendingDownloadPhotos, setPendingDownloadPhotos] = useState<Photo[] | null>(null);
  const [currentWatermarkPhotoIndex, setCurrentWatermarkPhotoIndex] = useState(0);
  const [processedPhotos, setProcessedPhotos] = useState<{name: string, data: Blob}[]>([]);
  const [showWatermarkModal, setShowWatermarkModal] = useState(false);
  const [userWatermark, setUserWatermark] = useState<string | null>(null);

  const handleDownloadBatchStart = () => {
      const user = getCurrentUser();
      if (user && user.watermarkUrl) {
          setUserWatermark(user.watermarkUrl);
          setPendingDownloadPhotos(project.photos);
          setCurrentWatermarkPhotoIndex(0);
          setProcessedPhotos([]);
          setShowWatermarkModal(true);
      } else {
          // No watermark set, proceed to normal download
          downloadDirectly(project.photos);
      }
  };

  const downloadDirectly = async (photos: Photo[]) => {
      setIsDownloading(true);
      try {
          const zip = new JSZip();
          const promises = photos.map(async (photo) => {
               const safeName = photo.name.replace(/[^a-z0-9]/gi, '_').toLowerCase();
               let ext = 'jpg';
               let data: Blob;
               try {
                   if (photo.url.startsWith('http')) {
                       const response = await fetch(photo.url);
                       data = await response.blob();
                   } else {
                       // Base64
                       const arr = photo.url.split(',');
                       const mime = arr[0].match(/:(.*?);/)?.[1] || 'image/jpeg';
                       const bstr = atob(arr[1]);
                       let n = bstr.length;
                       const u8arr = new Uint8Array(n);
                       while(n--){ u8arr[n] = bstr.charCodeAt(n); }
                       data = new Blob([u8arr], {type: mime});
                   }
                   zip.file(`${safeName}.${ext}`, data);
               } catch (err) { console.error(err); }
          });
          await Promise.all(promises);
          const content = await zip.generateAsync({type: "blob"});
          const url = window.URL.createObjectURL(content);
          const link = document.createElement('a');
          link.href = url;
          link.download = `${project.title.replace(/[^a-z0-9]/gi, '_')}_Export.zip`;
          document.body.appendChild(link);
          link.click();
          document.body.removeChild(link);
          window.URL.revokeObjectURL(url);
      } catch (e) { alert("Erro no download."); }
      setIsDownloading(false);
  };

  const handleWatermarkProcessed = async (finalUrl: string) => {
      if (!pendingDownloadPhotos) return;

      // Convert finalUrl (DataURL) to Blob
      const arr = finalUrl.split(',');
      const mime = arr[0].match(/:(.*?);/)?.[1] || 'image/jpeg';
      const bstr = atob(arr[1]);
      let n = bstr.length;
      const u8arr = new Uint8Array(n);
      while(n--){ u8arr[n] = bstr.charCodeAt(n); }
      const blob = new Blob([u8arr], {type: mime});

      const currentPhoto = pendingDownloadPhotos[currentWatermarkPhotoIndex];
      const newProcessed = [...processedPhotos, { name: currentPhoto.name, data: blob }];
      setProcessedPhotos(newProcessed);

      if (currentWatermarkPhotoIndex < pendingDownloadPhotos.length - 1) {
          // Move to next photo
          setCurrentWatermarkPhotoIndex(prev => prev + 1);
      } else {
          // All done, generate ZIP
          setShowWatermarkModal(false);
          setIsDownloading(true);
          const zip = new JSZip();
          newProcessed.forEach(p => {
              zip.file(`${p.name}.jpg`, p.data);
          });
          const content = await zip.generateAsync({type: "blob"});
          const url = window.URL.createObjectURL(content);
          const link = document.createElement('a');
          link.href = url;
          link.download = `${project.title}_WM.zip`;
          document.body.appendChild(link);
          link.click();
          document.body.removeChild(link);
          setIsDownloading(false);
          setPendingDownloadPhotos(null);
      }
  };

  return (
    <div className="min-h-screen bg-[#121212] text-white font-sans">
      {/* Watermark Modal Flow */}
      {showWatermarkModal && pendingDownloadPhotos && userWatermark && (
          <WatermarkModal 
            photoUrl={pendingDownloadPhotos[currentWatermarkPhotoIndex].url}
            watermarkUrl={userWatermark}
            onClose={() => setShowWatermarkModal(false)}
            onDownload={handleWatermarkProcessed}
          />
      )}

      {/* Header */}
      <div className="sticky top-0 z-20 bg-[#121212] px-4 py-4 flex justify-between items-center border-b border-white/5">
        <div className="flex items-center gap-4">
            <button onClick={onBack} className="text-white hover:text-gray-300">
                <ArrowLeft className="w-6 h-6" />
            </button>
            <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-gray-800 flex items-center justify-center text-white font-bold border border-white/5 text-sm">
                    {project.title.charAt(0).toUpperCase()}
                </div>
                <div>
                    <h1 className="font-bold text-base leading-tight text-white">{project.title}</h1>
                    <p className="text-xs text-gray-400 mt-0.5">
                        {new Date(project.createdAt).toLocaleDateString('pt-PT', { day: 'numeric', month: 'long', year: 'numeric' })}
                    </p>
                </div>
            </div>
        </div>
        <button className="text-white flex items-center gap-2" onClick={handleDownloadBatchStart} disabled={isDownloading}>
            {isDownloading ? <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div> : <List className="w-6 h-6" />}
        </button>
      </div>

      {/* Action Tabs */}
      <div className="flex items-center gap-3 px-4 py-5 overflow-x-auto no-scrollbar">
          <button 
            onClick={() => setActiveTab('360')}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-colors whitespace-nowrap ${activeTab === '360' ? 'bg-[#333] text-white' : 'bg-[#1e1e1e] text-gray-400'}`}
          >
              <Box className="w-4 h-4" /> 360
          </button>
          <button 
            onClick={() => setActiveTab('photo')}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-colors whitespace-nowrap ${activeTab === 'photo' ? 'bg-[#623aa2] text-white' : 'bg-[#1e1e1e] text-gray-400'}`}
          >
              <Image className="w-4 h-4" /> {project.photos.length}
          </button>
          <button 
            onClick={() => setActiveTab('video')}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-colors whitespace-nowrap ${activeTab === 'video' ? 'bg-[#333] text-white' : 'bg-[#1e1e1e] text-gray-400'}`}
          >
              <Video className="w-4 h-4" /> 0
          </button>
      </div>

      {/* Grid Content */}
      <div className="px-4 pb-32">
          {activeTab === 'photo' && (
              <div className="grid grid-cols-3 gap-1.5">
                  {project.photos.map((photo) => (
                      <div 
                        key={photo.id} 
                        className="aspect-square bg-gray-800 rounded-md overflow-hidden relative cursor-pointer group"
                        onClick={() => onEditPhoto(photo)}
                      >
                          <img src={photo.url} className="w-full h-full object-cover" alt={photo.name} />
                          {photo.type === 'hdr' && (
                              <div className="absolute top-1 right-1 w-2 h-2 bg-[#623aa2] rounded-full shadow-sm"></div>
                          )}
                      </div>
                  ))}
              </div>
          )}
          
          {project.photos.length === 0 && (
              <div className="text-center py-20 text-gray-500 text-sm">
                  Nenhuma foto capturada.
              </div>
          )}
      </div>

      {/* Floating "Iniciar captura" Button */}
      <div className="fixed bottom-8 left-0 right-0 flex justify-center z-30 pointer-events-none">
          <button 
            onClick={onAddPhoto}
            className="pointer-events-auto bg-[#2a2a2a] text-white px-8 py-3.5 rounded-full flex items-center gap-3 shadow-2xl border border-white/10 hover:bg-[#333] transition-transform active:scale-95"
          >
              <Camera className="w-5 h-5" />
              <span className="font-medium text-sm">Iniciar captura</span>
          </button>
      </div>
    </div>
  );
};
