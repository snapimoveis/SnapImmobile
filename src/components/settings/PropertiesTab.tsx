
import React from 'react';
import { Project, UserProfile } from '../../types';
import { Smartphone, Cloud, Upload, MoreHorizontal, Search } from 'lucide-react';
import { formatDate } from '../../utils/helpers';

interface Props {
    projects: Project[];
    currentUser: UserProfile | null;
}

export const PropertiesTab: React.FC<Props> = ({ projects, currentUser }) => {
    return (
      <div className="py-8 animate-in fade-in">
          <div className="flex justify-between items-center mb-6">
              <div className="flex gap-2">
                  <div className="relative">
                      <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                      <input type="text" placeholder="Pesquisar..." className="pl-10 pr-4 py-2 border border-gray-300 rounded-lg text-sm w-64 focus:ring-2 focus:ring-blue-500 outline-none" />
                  </div>
                  <div className="flex border border-gray-300 rounded-lg overflow-hidden">
                      <span className="px-3 py-2 bg-blue-600 text-white text-sm font-medium">Activo {projects.length}</span>
                      <span className="px-3 py-2 bg-white text-gray-600 text-sm font-medium hover:bg-gray-50 cursor-pointer border-l">Arquivado 0</span>
                  </div>
              </div>
          </div>

          <div className="bg-white border border-gray-200 rounded-xl overflow-hidden shadow-sm">
              <table className="w-full text-sm text-left">
                  <thead className="bg-gray-50 text-gray-500 font-medium border-b border-gray-200">
                      <tr>
                          <th className="px-6 py-3 w-10"><input type="checkbox" className="rounded" /></th>
                          <th className="px-6 py-3">NOME DA PROPRIEDADE</th>
                          <th className="px-6 py-3">ADMINISTRADO POR</th>
                          <th className="px-6 py-3 text-center"><Smartphone className="w-4 h-4 mx-auto" /></th>
                          <th className="px-6 py-3 text-center"><Cloud className="w-4 h-4 mx-auto" /></th>
                          <th className="px-6 py-3 text-right">DATA DE CRIAÇÃO</th>
                          <th className="px-6 py-3"></th>
                      </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100">
                      {projects.length === 0 ? (
                          <tr><td colSpan={7} className="text-center py-10 text-gray-500">Nenhum imóvel encontrado.</td></tr>
                      ) : projects.map((p) => (
                          <tr key={p.id} className="hover:bg-gray-50 transition-colors">
                              <td className="px-6 py-4"><input type="checkbox" className="rounded" /></td>
                              <td className="px-6 py-4 font-medium text-gray-900">{p.title}</td>
                              <td className="px-6 py-4 text-gray-500 flex items-center gap-2">
                                  <Upload className="w-3 h-3" /> {currentUser?.email}
                              </td>
                              <td className="px-6 py-4 text-center">0</td>
                              <td className="px-6 py-4 text-center">{p.photos.length}</td>
                              <td className="px-6 py-4 text-right text-gray-500">{formatDate(p.createdAt)}</td>
                              <td className="px-6 py-4 text-right">
                                  <button className="p-1 hover:bg-gray-200 rounded"><MoreHorizontal className="w-4 h-4 text-gray-400" /></button>
                              </td>
                          </tr>
                      ))}
                  </tbody>
              </table>
          </div>
      </div>
    );
};
