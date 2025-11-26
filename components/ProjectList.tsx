
import React, { useState } from 'react';
import { Project } from '../types';
import { Search, Plus, MoreHorizontal, Image as ImageIcon, Video, Box, Grid, List, CheckSquare, ArrowUpDown } from 'lucide-react';

interface ProjectListProps {
  projects: Project[];
  onSelectProject: (project: Project) => void;
  onCreateProject: () => void;
  onDeleteProject: (projectId: string) => void;
}

export const ProjectList: React.FC<ProjectListProps> = ({ projects, onSelectProject, onCreateProject, onDeleteProject }) => {
  const [viewTab, setViewTab] = useState<'active' | 'archived'>('active');
  
  return (
    <div className="bg-white min-h-screen font-sans text-gray-900 flex flex-col">
      
      {/* Dashboard Header */}
      <div className="px-8 pt-8 pb-4">
          <div className="flex justify-between items-center mb-6">
              <h1 className="text-2xl font-bold text-gray-900">Imóveis</h1>
              <button 
                onClick={onCreateProject}
                className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-md text-sm font-medium flex items-center gap-2 transition-colors"
              >
                  <Plus className="w-4 h-4" />
                  Novo imóvel
              </button>
          </div>

          {/* Tabs */}
          <div className="flex gap-4 border-b border-gray-200 mb-6">
              <button 
                onClick={() => setViewTab('active')}
                className={`pb-3 px-1 text-sm font-medium transition-colors relative ${
                    viewTab === 'active' ? 'text-gray-900 border-b-2 border-gray-900' : 'text-gray-500 hover:text-gray-700'
                }`}
              >
                  Ativo <span className="ml-1 bg-gray-100 text-gray-600 py-0.5 px-2 rounded-full text-xs">{projects.length}</span>
              </button>
              <button 
                onClick={() => setViewTab('archived')}
                className={`pb-3 px-1 text-sm font-medium transition-colors relative ${
                    viewTab === 'archived' ? 'text-gray-900 border-b-2 border-gray-900' : 'text-gray-500 hover:text-gray-700'
                }`}
              >
                  Arquivado <span className="ml-1 bg-gray-100 text-gray-600 py-0.5 px-2 rounded-full text-xs">208</span>
              </button>
          </div>

          <h2 className="text-lg font-medium text-blue-900 mb-4">{projects.length} propriedades ativas</h2>

          {/* Toolbar */}
          <div className="flex flex-wrap gap-3 items-center justify-between mb-6">
              <div className="flex gap-3 flex-1 min-w-[300px]">
                  <div className="relative flex-1 max-w-md">
                      <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                      <input 
                        type="text" 
                        placeholder="Pesquisar..." 
                        className="w-full pl-10 pr-4 py-2 border border-gray-200 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      />
                  </div>
                  <button className="flex items-center gap-2 px-3 py-2 border border-gray-200 rounded-md text-sm text-gray-600 hover:bg-gray-50">
                      <ArrowUpDown className="w-4 h-4" />
                      Ordenar por
                  </button>
              </div>

              <div className="flex gap-2">
                  <button className="flex items-center gap-2 px-3 py-2 border border-gray-200 rounded-md text-sm text-gray-600 hover:bg-gray-50">
                      <CheckSquare className="w-4 h-4" />
                      Selecionar todos
                  </button>
                  <div className="flex border border-gray-200 rounded-md overflow-hidden">
                      <button className="p-2 bg-gray-100 text-gray-900"><Grid className="w-4 h-4" /></button>
                      <button className="p-2 bg-white text-gray-500 hover:bg-gray-50"><List className="w-4 h-4" /></button>
                  </div>
              </div>
          </div>
      </div>

      {/* Card Grid */}
      <div className="px-8 pb-12 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
        {projects.map((project) => (
            <div 
                key={project.id}
                onClick={() => onSelectProject(project)}
                className="bg-white border border-gray-200 rounded-lg overflow-hidden cursor-pointer hover:shadow-md transition-shadow group"
            >
                {/* Image Area */}
                <div className="aspect-[16/9] relative bg-gray-100">
                    {project.coverImage ? (
                        <img src={project.coverImage} className="w-full h-full object-cover" alt={project.title} />
                    ) : (
                        <div className="w-full h-full flex items-center justify-center text-gray-400"><ImageIcon className="w-10 h-10" /></div>
                    )}
                    
                    {/* Overlay Top */}
                    <div className="absolute top-3 left-3">
                        <div className="w-5 h-5 border-2 border-white/80 rounded bg-black/20 hover:bg-blue-500/80 transition-colors"></div>
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
                        {new Date(project.createdAt).toLocaleDateString('pt-PT', { day: '2-digit', month: '2-digit', year: 'numeric' })}, 
                        {new Date(project.createdAt).toLocaleTimeString('pt-PT', { hour: '2-digit', minute: '2-digit' })}
                    </p>
                </div>
            </div>
        ))}
        
        {projects.length === 0 && (
            <div className="col-span-full text-center py-20 text-gray-400">
                Nenhum imóvel encontrado.
            </div>
        )}
      </div>

    </div>
  );
};
