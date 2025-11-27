
import React, { useState } from 'react';
import { Project } from '../types';
import { Search, Plus, Grid, List, CheckSquare, ArrowUpDown } from 'lucide-react';
import { ProjectCard } from './ProjectCard';

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
        {projects.length === 0 ? (
            <div className="col-span-full text-center py-20 text-gray-400">
                Nenhum imóvel encontrado.
            </div>
        ) : (
            projects.map((project) => (
                <ProjectCard 
                    key={project.id} 
                    project={project} 
                    onSelect={onSelectProject} 
                    onDelete={onDeleteProject} 
                />
            ))
        )}
      </div>
    </div>
  );
};
