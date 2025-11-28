
import React, { useState, useEffect } from 'react';
import { 
  ArrowLeft, 
  Pencil, 
  MoreHorizontal, 
  CheckSquare, 
  ArrowUpDown, 
  Upload, 
  Download, 
  ExternalLink, 
  Image as ImageIcon,
  Play
} from 'lucide-react';
import { Project, Photo } from '../types';

// Interface compatível com o que o App.tsx está a enviar
interface ProjectDetailsProps {
  initialProject: Project;
  onBack: () => void;
  onAddPhoto: () => void;
  onEditPhoto: (photo: Photo) => void;
  onUpdateProject: (project: Project) => void;
  onViewTour: () => void;
}

export const ProjectDetails: React.FC<ProjectDetailsProps> = ({ 
  initialProject, 
  onBack, 
  onAddPhoto, 
  onEditPhoto,
  onUpdateProject,
  onViewTour
}) => {
  const [project, setProject] = useState<Project>(initialProject);
  const [activeTab, setActiveTab] = useState<'content' | 'contacts'>('content');
  const [mediaType, setMediaType] = useState<'photos' | 'videos'>('photos');

  // Sincroniza o estado local se o projeto mudar no pai (ex: após salvar edição)
  useEffect(() => {
    setProject(initialProject);
  }, [initialProject]);

  const displayPhotos = project.photos || [];

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col animate-in fade-in duration-300">
      {/* --- HEADER SUPERIOR --- */}
      <header className="bg-white border-b border-gray-200 pt-6 px-6 pb-0 shadow-sm z-10">
        <button 
          onClick={onBack}
          className="flex items-center text-sm text-blue-600 hover:text-blue-800 mb-4 transition-colors font-medium"
        >
          <ArrowLeft size={16} className="mr-1" />
          Voltar a todos os imóveis
        </button>

        <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6 gap-4">
          <div className="flex items-center gap-4">
            {/* Thumbnail do Projeto */}
            <div className="w-16 h-12 bg-gray-200 rounded overflow-hidden border border-gray-100 flex-shrink-0">
               {project.coverImage ? (
                   <img 
                     src={project.coverImage} 
                     alt="Capa" 
                     className="w-full h-full object-cover"
                   />
               ) : (
                   <div className="w-full h-full flex items-center justify-center bg-gray-100 text-gray-400">
                       <ImageIcon size={20} />
                   </div>
               )}
            </div>
            
            {/* Título e Endereço */}
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-xl font-bold text-gray-900 leading-tight">
                  {project.title}
                </h1>
                <button className="text-gray-400 hover:text-gray-600 p-1 rounded hover:bg-gray-100 transition-colors">
                  <Pencil size={14} />
                </button>
              </div>
              <p className="text-sm text-gray-500 mt-0.5">{project.address}</p>
            </div>
          </div>

          <div className="flex gap-2 w-full md:w-auto">
             <button 
                onClick={onViewTour}
                className="flex-1 md:flex-none justify-center px-4 py-2 bg-purple-600 text-white text-sm font-medium rounded-lg hover:bg-purple-700 flex items-center gap-2 transition-all shadow-sm hover:shadow-md"
             >
                <Play size={16} fill="currentColor" /> Ver Tour Virtual
             </button>
             <button className="p-2 hover:bg-gray-100 rounded-full border border-gray-200 transition-colors">
                <MoreHorizontal size={20} className="text-gray-500" />
             </button>
          </div>
        </div>

        {/* --- ABAS (TABS) --- */}
        <div className="flex gap-8 overflow-x-auto no-scrollbar">
          <button 
            onClick={() => setActiveTab('content')}
            className={`pb-3 px-1 text-sm font-medium border-b-2 transition-colors whitespace-nowrap ${
              activeTab === 'content' 
                ? 'border-blue-600 text-blue-600' 
                : 'border-transparent text-gray-500 hover:text-gray-700'
            }`}
          >
            Conteúdo
          </button>
          <button 
            onClick={() => setActiveTab('contacts')}
            className={`pb-3 px-1 text-sm font-medium border-b-2 transition-colors whitespace-nowrap ${
              activeTab === 'contacts' 
                ? 'border-blue-600 text-blue-600' 
                : 'border-transparent text-gray-500 hover:text-gray-700'
            }`}
          >
            Contactos
          </button>
        </div>
      </header>

      {/* --- CONTEÚDO PRINCIPAL --- */}
      <div className="flex flex-1 max-w-7xl w-full mx-auto p-4 md:p-6 gap-6">
        
        {/* --- SIDEBAR ESQUERDA (Desktop) --- */}
        <aside className="w-64 flex-shrink-0 hidden lg:block">
          <nav className="space-y-1">
            <button 
              onClick={() => setMediaType('photos')}
              className={`w-full flex items-center justify-between px-3 py-2 text-sm font-medium rounded-lg transition-colors ${
                mediaType === 'photos' 
                  ? 'bg-blue-50 text-blue-700' 
                  : 'text-gray-600 hover:bg-gray-100'
              }`}
            >
              <div className="flex items-center">
                <span className="truncate">Fotografias</span>
              </div>
              <span className={`ml-3 py-0.5 px-2.5 rounded-full text-xs font-medium ${
                mediaType === 'photos' ? 'bg-blue-100 text-blue-600' : 'bg-gray-100 text-gray-600'
              }`}>
                {displayPhotos.length}
              </span>
            </button>

            <button 
              onClick={() => setMediaType('videos')}
              className={`w-full flex items-center justify-between px-3 py-2 text-sm font-medium rounded-lg transition-colors ${
                mediaType === 'videos' 
                  ? 'bg-blue-50 text-blue-700' 
                  : 'text-gray-600 hover:bg-gray-100'
              }`}
            >
              <div className="flex items-center">
                <span className="truncate">Videos</span>
              </div>
              <span className="ml-3 py-0.5 px-2.5 rounded-full text-xs font-medium bg-gray-100 text-gray-600">
                0
              </span>
            </button>
          </nav>
        </aside>

        {/* --- GALERIA DIREITA --- */}
        <main className="flex-1 min-w-0">
          {/* Toolbar */}
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-6 gap-4">
            <h2 className="text-gray-700 font-medium">
              {displayPhotos.length} fotos
            </h2>
            <div className="flex flex-wrap gap-2 w-full sm:w-auto">
              <button className="flex-1 sm:flex-none flex items-center justify-center gap-2 px-3 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors shadow-sm">
                <CheckSquare size={16} />
                <span className="hidden sm:inline">Selecionar todos</span>
              </button>
              <button className="flex-1 sm:flex-none flex items-center justify-center gap-2 px-3 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors shadow-sm">
                <ArrowUpDown size={16} />
                <span className="hidden sm:inline">Reordenar</span>
              </button>
              <button 
                onClick={onAddPhoto}
                className="flex-1 sm:flex-none flex items-center justify-center gap-2 px-3 py-2 text-sm font-medium text-white bg-blue-600 border border-transparent rounded-lg hover:bg-blue-700 transition-colors shadow-sm"
              >
                <Upload size={16} />
                <span className="whitespace-nowrap">Importar fotos</span>
              </button>
            </div>
          </div>

          {displayPhotos.length === 0 ? (
             <div className="text-center py-20 bg-white rounded-xl border-2 border-dashed border-gray-200 hover:border-blue-300 transition-colors">
                <div className="mx-auto h-16 w-16 text-gray-400 bg-gray-50 rounded-full flex items-center justify-center mb-4">
                   <ImageIcon size={32} strokeWidth={1.5} />
                </div>
                <h3 className="text-base font-semibold text-gray-900">Sem fotografias</h3>
                <p className="mt-1 text-sm text-gray-500 max-w-sm mx-auto">Este projeto ainda não tem imagens. Comece por importar as fotos do imóvel.</p>
                <div className="mt-6">
                  <button 
                    onClick={onAddPhoto}
                    className="inline-flex items-center px-6 py-3 border border-transparent shadow-sm text-sm font-medium rounded-lg text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-all"
                  >
                    <Upload className="-ml-1 mr-2 h-5 w-5" aria-hidden="true" />
                    Carregar Fotografias
                  </button>
                </div>
             </div>
          ) : (
              /* Grid de Fotos */
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 pb-10">
                
                {displayPhotos.map((photo: Photo, index: number) => (
                  <React.Fragment key={photo.id || index}>
                    {/* Inserção do Card Promocional de IA na posição 4 (index 3) */}
                    {index === 3 && (
                      <div className="aspect-[4/3] bg-gradient-to-br from-purple-50 to-white rounded-xl border border-purple-100 flex flex-col items-center justify-center p-6 text-center group hover:shadow-lg hover:border-purple-200 transition-all relative overflow-hidden">
                        <div className="relative z-10 grid grid-cols-2 gap-2 mb-4 w-24 opacity-80 group-hover:scale-105 transition-transform">
                           <div className="h-8 bg-purple-200 rounded animate-pulse"></div>
                           <div className="h-8 bg-purple-300 rounded animate-pulse delay-75"></div>
                           <div className="h-8 bg-purple-300 rounded animate-pulse delay-100"></div>
                           <div className="h-8 bg-purple-200 rounded animate-pulse delay-150"></div>
                        </div>
                        <h3 className="relative z-10 text-sm font-bold text-gray-900 mb-1">
                          Vídeo com IA
                        </h3>
                        <p className="relative z-10 text-xs text-gray-500 mb-4 px-2 leading-relaxed">Transforme estas fotos num tour virtual profissional em segundos.</p>
                        <button className="relative z-10 px-5 py-2 bg-purple-600 text-white text-xs font-bold uppercase tracking-wide rounded-lg hover:bg-purple-700 transition-colors shadow-md hover:shadow-lg">
                          Experimentar
                        </button>
                      </div>
                    )}

                    {/* Cartão da Foto */}
                    <div 
                        onClick={() => onEditPhoto(photo)}
                        className="group relative aspect-[4/3] bg-gray-100 rounded-xl overflow-hidden border border-gray-200 hover:shadow-lg hover:border-blue-200 transition-all cursor-pointer"
                    >
                      <img 
                        src={photo.url} 
                        alt={photo.name} 
                        className="w-full h-full object-cover transform group-hover:scale-105 transition-transform duration-500"
                        loading="lazy"
                      />
                      
                      {/* Overlay Gradiente */}
                      <div className="absolute inset-0 bg-black/0 group-hover:bg-black/10 transition-colors" />

                      {/* Checkbox (Top Left) */}
                      <div className="absolute top-3 left-3 z-10 opacity-0 group-hover:opacity-100 transition-all duration-200" onClick={e => e.stopPropagation()}>
                        <div className="bg-white rounded-md border border-gray-300 w-6 h-6 flex items-center justify-center cursor-pointer hover:border-blue-500 hover:bg-blue-50 shadow-sm">
                          {/* Check logic */}
                        </div>
                      </div>

                      {/* Actions (Top Right) */}
                      <div className="absolute top-3 right-3 flex gap-1.5 opacity-0 group-hover:opacity-100 transition-all duration-200 translate-y-1 group-hover:translate-y-0 z-10" onClick={e => e.stopPropagation()}>
                        <a 
                            href={photo.url} 
                            download 
                            className="p-1.5 bg-white/90 backdrop-blur-sm text-gray-600 rounded-md border border-gray-200 hover:text-blue-600 hover:bg-white shadow-sm transition-colors"
                            title="Download"
                            target="_blank"
                            rel="noreferrer"
                        >
                          <Download size={14} />
                        </a>
                        <button className="p-1.5 bg-white/90 backdrop-blur-sm text-gray-600 rounded-md border border-gray-200 hover:text-blue-600 hover:bg-white shadow-sm transition-colors" title="Mais Opções">
                          <MoreHorizontal size={14} />
                        </button>
                      </div>
                      
                      {/* Legenda (Bottom) */}
                      <div className="absolute bottom-0 inset-x-0 bg-gradient-to-t from-black/60 via-black/30 to-transparent p-4 pt-8 opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                          <p className="text-white text-xs truncate font-medium drop-shadow-sm">{photo.name}</p>
                      </div>
                    </div>
                  </React.Fragment>
                ))}
              </div>
          )}
        </main>
      </div>
    </div>
  );
};
