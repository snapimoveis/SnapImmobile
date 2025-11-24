import React, { useState } from 'react';
import { Project, Photo } from '../types';
import { Download, Share2, Link as LinkIcon, Trash2, Edit2, Eye, PlusCircle, Loader2, Sparkles } from 'lucide-react';
import JSZip from 'jszip';
import { enhanceImage } from '../services/geminiService';

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
  onAddPhoto,
  onUpdateProject,
  onViewTour
}) => {
  const [isDownloading, setIsDownloading] = useState(false);
  const [processingPhotoId, setProcessingPhotoId] = useState<string | null>(null);

  const handleLinkPhoto = (sourceId: string, targetId: string) => {
    // Logic to update the photo's 'linkedTo' property
    const updatedPhotos = project.photos.map(p => {
        if (p.id === sourceId) return { ...p, linkedTo: targetId };
        return p;
    });
    onUpdateProject({ ...project, photos: updatedPhotos });
  };

  const handleEnhancePhoto = async (photo: Photo) => {
    if (processingPhotoId) return;
    setProcessingPhotoId(photo.id);
    try {
        const enhancedUrl = await enhanceImage(photo.url);
        const updatedPhotos = project.photos.map(p => 
            p.id === photo.id 
            ? { ...p, url: enhancedUrl, name: p.name.includes('AI') ? p.name : `${p.name} (AI)`, type: 'hdr' as const } 
            : p
        );
        onUpdateProject({ ...project, photos: updatedPhotos });
    } catch (error) {
        console.error("Enhancement failed", error);
        alert("Falha ao melhorar a foto. Verifique a API Key ou a conexão.");
    } finally {
        setProcessingPhotoId(null);
    }
  };
  
  const handleDownloadBatch = async () => {
      setIsDownloading(true);
      try {
          const zip = new JSZip();
          
          project.photos.forEach((photo) => {
               let ext = 'png';
               if (photo.url.startsWith('data:image/jpeg')) ext = 'jpg';
               if (photo.url.startsWith('data:image/webp')) ext = 'webp';
               
               // Strip base64 prefix
               const base64Data = photo.url.replace(/^data:image\/\w+;base64,/, "");
               // Create safe filename
               const safeName = photo.name.replace(/[^a-z0-9]/gi, '_').toLowerCase();
               zip.file(`${safeName}.${ext}`, base64Data, {base64: true});
          });

          const content = await zip.generateAsync({type: "blob"});
          const url = window.URL.createObjectURL(content);
          
          const link = document.createElement('a');
          link.href = url;
          link.download = `${project.title.replace(/[^a-z0-9]/gi, '_')}_Export.zip`;
          document.body.appendChild(link);
          link.click();
          document.body.removeChild(link);
          window.URL.revokeObjectURL(url);
          
      } catch (error) {
          console.error("Zip failed", error);
          alert("Falha ao gerar ficheiro ZIP.");
      } finally {
          setIsDownloading(false);
      }
  };

  const handleDownloadPhoto = (photo: Photo) => {
      const link = document.createElement('a');
      link.href = photo.url;
      let ext = 'png';
      if (photo.url.startsWith('data:image/jpeg')) ext = 'jpg';
      if (photo.url.startsWith('data:image/webp')) ext = 'webp';
      
      link.download = `${photo.name.replace(/[^a-z0-9]/gi, '_')}.${ext}`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
  };

  const handleDeletePhoto = (photoId: string) => {
      if (confirm("Eliminar esta foto?")) {
          const updatedPhotos = project.photos.filter(p => p.id !== photoId);
          onUpdateProject({ ...project, photos: updatedPhotos });
      }
  };

  return (
    <div className="max-w-7xl mx-auto p-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8 pb-6 border-b border-gray-200">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">{project.title}</h1>
          <p className="text-gray-500 flex items-center mt-2">
            <span className="bg-blue-100 text-blue-800 text-xs font-medium px-2.5 py-0.5 rounded mr-2">
                {project.status === 'Completed' ? 'Concluído' : 'Em Curso'}
            </span>
            {project.address}
          </p>
        </div>
        
        <div className="flex flex-wrap gap-2">
          <button 
            onClick={onViewTour}
            className="px-4 py-2 bg-white border border-gray-300 rounded-lg text-gray-700 font-medium hover:bg-gray-50 flex items-center gap-2"
          >
            <Eye className="w-4 h-4" /> Visita Virtual
          </button>
          <button 
            onClick={() => navigator.clipboard.writeText(window.location.href)}
            className="px-4 py-2 bg-white border border-gray-300 rounded-lg text-gray-700 font-medium hover:bg-gray-50 flex items-center gap-2"
          >
            <Share2 className="w-4 h-4" /> Partilhar
          </button>
          <button 
            onClick={handleDownloadBatch}
            disabled={isDownloading}
            className="px-4 py-2 bg-gray-900 text-white rounded-lg font-medium hover:bg-gray-800 flex items-center gap-2 shadow-md disabled:opacity-70 disabled:cursor-wait"
          >
            {isDownloading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Download className="w-4 h-4" />}
            {isDownloading ? 'A Comprimir...' : 'Exportar Tudo'}
          </button>
           <button 
            onClick={onAddPhoto}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 flex items-center gap-2 shadow-md"
          >
            <PlusCircle className="w-4 h-4" /> Adicionar Foto
          </button>
        </div>
      </div>

      {/* Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
        {project.photos.map((photo) => (
          <div key={photo.id} className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden group relative flex flex-col">
             <div className="aspect-[4/3] bg-gray-100 relative overflow-hidden">
                <img src={photo.url} alt={photo.name} className="w-full h-full object-cover" />
                <div className="absolute inset-0 bg-black/0 group-hover:bg-black/40 transition-colors flex items-center justify-center opacity-0 group-hover:opacity-100 gap-2 z-10">
                    <button 
                        onClick={() => onEditPhoto(photo)}
                        className="p-2 bg-white rounded-full hover:bg-blue-50 text-blue-600 shadow-lg transform hover:scale-110 transition-all"
                        title="Editor IA (Apagar/Staging)"
                    >
                        <Edit2 className="w-5 h-5" />
                    </button>
                    <button 
                        onClick={() => handleDownloadPhoto(photo)}
                        className="p-2 bg-white rounded-full hover:bg-green-50 text-green-600 shadow-lg transform hover:scale-110 transition-all"
                        title="Download Alta Resolução"
                    >
                        <Download className="w-5 h-5" />
                    </button>
                    <button 
                        onClick={() => handleDeletePhoto(photo.id)}
                        className="p-2 bg-white rounded-full hover:bg-red-50 text-red-600 shadow-lg transform hover:scale-110 transition-all"
                        title="Eliminar"
                    >
                        <Trash2 className="w-5 h-5" />
                    </button>
                </div>
                {photo.type === 'hdr' && (
                    <span className="absolute top-2 left-2 bg-yellow-400 text-black text-[10px] font-bold px-1.5 py-0.5 rounded shadow-sm flex items-center gap-1 z-20">
                        <Sparkles className="w-2 h-2" /> HDR
                    </span>
                )}
                {photo.linkedTo && (
                    <span className="absolute bottom-2 right-2 bg-blue-500 text-white text-[10px] font-bold px-1.5 py-0.5 rounded shadow-sm flex items-center gap-1 z-20">
                        <LinkIcon className="w-3 h-3" /> Ligada
                    </span>
                )}
             </div>
             <div className="p-3 bg-white flex-1 flex flex-col">
                 <h4 className="text-sm font-medium text-gray-900 truncate">{photo.name}</h4>
                 <p className="text-xs text-gray-500 mt-1 truncate">{photo.description || "Sem descrição"}</p>
                 
                 {/* Link Selector Simple Implementation */}
                 <div className="mt-3 pt-2 border-t border-gray-100">
                     <label className="text-xs text-gray-400 block mb-1">Link Visita Virtual:</label>
                     <select 
                        className="w-full text-xs border-gray-300 rounded bg-gray-50 mb-3"
                        value={photo.linkedTo || ""}
                        onChange={(e) => handleLinkPhoto(photo.id, e.target.value)}
                     >
                         <option value="">Sem Link (Fim)</option>
                         {project.photos.filter(p => p.id !== photo.id).map(p => (
                             <option key={p.id} value={p.id}>{p.name}</option>
                         ))}
                     </select>

                     <button 
                        onClick={() => handleEnhancePhoto(photo)}
                        disabled={processingPhotoId === photo.id}
                        className={`w-full py-2 px-3 rounded text-xs font-bold flex items-center justify-center gap-2 transition-all ${
                            photo.type === 'hdr' 
                            ? 'bg-gray-100 text-gray-600 hover:bg-gray-200' 
                            : 'bg-purple-50 text-purple-700 hover:bg-purple-100 border border-purple-100'
                        }`}
                    >
                        {processingPhotoId === photo.id ? (
                            <>
                                <Loader2 className="w-3 h-3 animate-spin" />
                                <span>A Melhorar...</span>
                            </>
                        ) : (
                            <>
                                <Sparkles className={`w-3 h-3 ${photo.type === 'hdr' ? 'text-gray-500' : 'text-purple-500'}`} />
                                <span>{photo.type === 'hdr' ? 'Refazer AI HDR' : 'Melhorar com AI HDR'}</span>
                            </>
                        )}
                    </button>
                 </div>
             </div>
          </div>
        ))}
      </div>
    </div>
  );
};