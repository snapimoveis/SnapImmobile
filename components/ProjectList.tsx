import React, { useState } from 'react';
import { Project } from '../types';
import { Search, MapPin, Camera, Image as ImageIcon, ChevronRight, Bed, Bath, Square, Trash2, Download, Loader2 } from 'lucide-react';
import { Card, Button } from './ui';
import JSZip from 'jszip';
import { saveAs } from 'file-saver';

interface ProjectListProps {
  projects: Project[];
  onSelectProject: (project: Project) => void;
  onCreateProject: () => void;
  onDeleteProject: (id: string) => void;
}

export const ProjectList: React.FC<ProjectListProps> = ({ projects, onSelectProject, onCreateProject, onDeleteProject }) => {
  
  // Estado para controlar qual projeto está sendo baixado
  const [downloadingId, setDownloadingId] = useState<string | null>(null);

  const formatDate = (timestamp: number) => {
    return new Date(timestamp).toLocaleDateString('pt-PT', { day: 'numeric', month: 'long', year: 'numeric' });
  };

  const handleDownloadProject = async (e: React.MouseEvent, project: Project) => {
      e.stopPropagation(); // Impede abrir o projeto
      if (!project.photos || project.photos.length === 0) {
          alert("Este projeto não tem fotos para descarregar.");
          return;
      }

      setDownloadingId(project.id);

      try {
          const zip = new JSZip();
          const folder = zip.folder(project.title.replace(/[^a-z0-9]/gi, '_')); // Nome seguro para pasta

          // Download de cada foto e adição ao ZIP
          const promises = project.photos.map(async (photo, index) => {
              try {
                  const response = await fetch(photo.url, { mode: 'cors' });
                  const blob = await response.blob();
                  const fileName = photo.name || `foto_${index + 1}.jpg`;
                  // Garante extensão .jpg se não tiver
                  const finalName = fileName.toLowerCase().endsWith('.jpg') || fileName.toLowerCase().endsWith('.png') 
                      ? fileName 
                      : `${fileName}.jpg`;
                  
                  folder?.file(finalName, blob);
              } catch (err) {
                  console.error(`Erro ao baixar foto ${photo.id}:`, err);
              }
          });

          await Promise.all(promises);

          const content = await zip.generateAsync({ type: "blob" });
          saveAs(content, `${project.title}_fotos.zip`);

      } catch (error) {
          console.error("Erro ao gerar ZIP:", error);
          alert("Ocorreu um erro ao preparar o download.");
      } finally {
          setDownloadingId(null);
      }
  };

  const recentProjects = [...projects].sort((a, b) => b.createdAt - a.createdAt).slice(0, 3);

  if (projects.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center h-[70vh] text-center p-6 animate-in fade-in zoom-in duration-500">
        <div className="w-24 h-24 bg-brand-purple/5 border-2 border-brand-purple/20 rounded-full flex items-center justify-center mb-6 shadow-sm">
          <Camera size={40} className="text-brand-purple" />
        </div>
        <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-2">Sem imóveis recentes</h2>
        <p className="text-gray-500 dark:text-gray-400 max-w-xs mb-8 text-sm">Comece por criar o seu primeiro imóvel para capturar fotos incríveis.</p>
        <Button onClick={onCreateProject} variant="secondary">
          + Novo imóvel
        </Button>
      </div>
    );
  }

  return (
    <div className="min-h-full pb-24 bg-brand-gray-50 dark:bg-black text-gray-900 dark:text-white transition-colors duration-300">
      
      {/* Barra de Pesquisa */}
      <div className="px-4 py-4 bg-white dark:bg-[#121212] border-b border-gray-100 dark:border-white/5 mb-6 sticky top-0 z-10">
        <div className="relative">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <Search size={18} className="text-gray-400" />
            </div>
            <input 
                type="text" 
                placeholder="Pesquisar imóveis..." 
                className="w-full pl-10 pr-4 py-2.5 bg-brand-gray-100 dark:bg-white/10 border-none rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-brand-purple/50 text-gray-900 dark:text-white placeholder-gray-500"
            />
        </div>
      </div>

      <div className="px-4 space-y-8 pb-32">
        
        {/* ATIVIDADE RECENTE */}
        {recentProjects.length > 0 && (
          <div>
              <div className="flex justify-between items-center mb-3 px-1">
                  <h2 className="text-base font-bold text-gray-900 dark:text-white">Actividade recente</h2>
              </div>
              <div className="flex gap-3 overflow-x-auto no-scrollbar pb-2 -mx-4 px-4">
                  {recentProjects.map(proj => (
                      <div key={proj.id} onClick={() => onSelectProject(proj)} className="shrink-0 w-36 cursor-pointer active:scale-95 transition-transform group relative">
                          <div className="aspect-square rounded-xl overflow-hidden bg-gray-200 dark:bg-[#1a1a1a] border border-gray-100 dark:border-white/5 relative">
                              {proj.coverImage ? (
                                  <img src={proj.coverImage} className="w-full h-full object-cover" alt="" />
                              ) : (
                                  <div className="w-full h-full flex items-center justify-center"><ImageIcon size={24} className="text-gray-400"/></div>
                              )}
                              <div className="absolute bottom-1.5 left-1.5 bg-black/50 backdrop-blur-sm p-1 rounded-md">
                                  <MapPin size={10} className="text-white" />
                              </div>
                          </div>
                          <p className="mt-1.5 text-xs font-semibold text-gray-700 dark:text-gray-300 truncate px-0.5">{proj.title}</p>
                          <p className="text-[10px] text-gray-400 px-0.5">{formatDate(proj.createdAt)}</p>
                      </div>
                  ))}
              </div>
          </div>
        )}

        {/* LISTA VERTICAL DE IMÓVEIS */}
        <div className="space-y-6">
            <div className="px-1">
               <h2 className="text-base font-bold text-gray-900 dark:text-white">Todos os imóveis</h2>
            </div>
            
            {projects.map((project) => (
                <Card 
                    key={project.id} 
                    onClick={() => onSelectProject(project)}
                    hoverEffect
                    className="flex flex-col group relative"
                >
                    {/* Imagem */}
                    <div className="relative aspect-[16/9] bg-gray-100 dark:bg-white/5 overflow-hidden">
                        {project.coverImage ? (
                            <img src={project.coverImage} className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105" alt={project.title} />
                        ) : (
                            <div className="w-full h-full flex flex-col items-center justify-center text-gray-300 dark:text-gray-600 bg-gray-50 dark:bg-white/5">
                                <Camera size={32} strokeWidth={1.5} />
                            </div>
                        )}
                        
                        <div className="absolute top-3 left-3">
                             <span className="px-2.5 py-1 bg-white/90 dark:bg-black/80 backdrop-blur-md rounded-lg text-[10px] font-bold uppercase text-brand-purple shadow-sm">
                                {project.status === 'Completed' ? 'Concluído' : 'Ativo'}
                             </span>
                        </div>

                        {/* === GRUPO DE AÇÕES (LIXO + DOWNLOAD) === */}
                        <div className="absolute top-3 right-3 flex gap-2 z-10">
                            
                            {/* Botão de Download (Novo) */}
                            <button 
                                onClick={(e) => handleDownloadProject(e, project)}
                                disabled={downloadingId === project.id}
                                className="p-2 bg-white/90 dark:bg-black/60 backdrop-blur-md rounded-full text-gray-700 dark:text-white hover:text-brand-purple dark:hover:text-brand-purple transition-colors shadow-sm disabled:opacity-50"
                                title="Descarregar todas as fotos"
                            >
                                {downloadingId === project.id ? (
                                    <Loader2 size={18} className="animate-spin" />
                                ) : (
                                    <Download size={18} />
                                )}
                            </button>

                            {/* Botão de Deletar */}
                            <button 
                                onClick={(e) => {
                                    e.stopPropagation(); 
                                    if (window.confirm('Tem a certeza que deseja eliminar este projeto?')) {
                                        onDeleteProject(project.id);
                                    }
                                }}
                                className="p-2 bg-white/90 dark:bg-black/60 backdrop-blur-md rounded-full text-red-500 hover:bg-red-50 dark:hover:bg-red-900/30 transition-colors shadow-sm"
                                title="Eliminar projeto"
                            >
                                <Trash2 size={18} />
                            </button>
                        </div>
                        
                        <div className="absolute bottom-3 right-3 bg-black/60 backdrop-blur-md text-white px-2 py-1 rounded-lg text-xs font-medium flex items-center gap-1">
                             <Camera size={12} /> {project.photos.length}
                        </div>
                    </div>

                    {/* Info */}
                    <div className="p-4">
                        <div className="flex justify-between items-start mb-2">
                             <h3 className="text-lg font-bold text-gray-900 dark:text-white line-clamp-1">{project.title}</h3>
                             <ChevronRight size={18} className="text-gray-300" />
                        </div>
                        <div className="flex items-center gap-1 text-gray-500 dark:text-gray-400 text-xs mb-4">
                             <MapPin size={12} />
                             <span className="truncate">{project.address || 'Endereço não informado'}</span>
                             <span className="mx-1">•</span>
                             <span>{formatDate(project.createdAt)}</span>
                        </div>

                        <div className="flex items-center justify-between pt-3 border-t border-gray-100 dark:border-white/10 text-xs text-gray-600 dark:text-gray-400">
                             <div className="flex gap-4">
                                <span className="flex items-center gap-1"><Bed size={14} className="text-brand-purple"/> {project.details?.rooms || '-'}</span>
                                <span className="flex items-center gap-1"><Bath size={14} className="text-brand-purple"/> {project.details?.bathrooms || '-'}</span>
                                <span className="flex items-center gap-1"><Square size={14} className="text-brand-purple"/> {project.details?.area || '-'} m²</span>
                             </div>
                        </div>
                    </div>
                </Card>
            ))}
        </div>
      </div>
    </div>
  );
};
