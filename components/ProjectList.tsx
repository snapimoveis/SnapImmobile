// ============================================================
// ProjectList.tsx — versão final e corrigida
// ============================================================

import React, { useState } from "react";
import { Project } from "../types";
import { Plus, LogOut, Search } from "lucide-react";

interface ProjectListProps {
  projects: Project[];
  onCreateProject: () => void;
  onSelectProject: (project: Project) => void;
  onDeleteProject: (id: string) => void;
  onLogout?: () => void;
}

const ProjectList: React.FC<ProjectListProps> = ({
  projects,
  onCreateProject,
  onSelectProject,
  onDeleteProject,
  onLogout,
}) => {
  const [search, setSearch] = useState("");

  const filtered = projects.filter((p) => {
    const term = search.toLowerCase();
    return (
      p.title.toLowerCase().includes(term) ||
      (p.address ?? "").toLowerCase().includes(term)
    );
  });

  return (
    <div className="min-h-screen bg-brand-gray-50 dark:bg-black text-gray-900 dark:text-white flex flex-col">

      {/* HEADER */}
      <div className="p-6 flex justify-between items-center border-b border-gray-300 dark:border-white/10">
        <h1 className="text-xl font-bold">Os seus imóveis</h1>

        {onLogout && (
          <button
            onClick={onLogout}
            className="p-2 rounded-full hover:bg-gray-200 dark:hover:bg-white/10 transition"
          >
            <LogOut size={22} />
          </button>
        )}
      </div>

      {/* SEARCH */}
      <div className="p-4">
        <div className="relative">
          <Search className="absolute top-3 left-3 text-gray-400" size={18} />
          <input
            type="text"
            placeholder="Pesquisar imóvel…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-10 pr-4 py-2 rounded-xl bg-gray-100 dark:bg-white/10 outline-none"
          />
        </div>
      </div>

      {/* LIST */}
      <div className="flex-1 overflow-y-auto px-4 pb-24">
        {filtered.length === 0 ? (
          <p className="text-center text-gray-500 dark:text-gray-400 mt-10">
            Nenhum imóvel encontrado.
          </p>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {filtered.map((p) => (
              <div
                key={p.id}
                onClick={() => onSelectProject(p)}
                className="bg-white dark:bg-[#121212] rounded-xl shadow-md overflow-hidden cursor-pointer hover:shadow-lg transition"
              >
                {/* COVER */}
                <div className="w-full h-40 bg-gray-300 dark:bg-white/10 relative">
                  {p.coverImage ? (
                    <img
                      src={p.coverImage}
                      className="w-full h-full object-cover"
                      alt={p.title}
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-gray-500 text-sm">
                      Sem imagem
                    </div>
                  )}
                </div>

                {/* BODY */}
                <div className="p-4 space-y-1">
                  <h3 className="font-semibold truncate">{p.title}</h3>
                  <p className="text-sm text-gray-500 dark:text-gray-400 truncate">
                    {p.address ?? "Sem endereço"}
                  </p>

                  <div className="text-xs text-gray-400 mt-2">
                    {p.photos?.length ?? 0} fotos
                  </div>
                </div>

                {/* DELETE BUTTON */}
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    if (confirm("Eliminar este imóvel?")) onDeleteProject(p.id);
                  }}
                  className="w-full py-2 bg-red-600 hover:bg-red-700 text-white text-sm"
                >
                  Eliminar
                </button>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* CREATE BUTTON */}
      <button
        onClick={onCreateProject}
        className="fixed bottom-6 right-6 bg-brand-purple text-white p-4 rounded-full shadow-lg hover:scale-105 transition active:scale-95"
      >
        <Plus size={26} />
      </button>
    </div>
  );
};

export default ProjectList;
