import React from 'react';
import { UserProfile } from '../../types';
import { Plus, MoreHorizontal, Search, Filter } from 'lucide-react';

interface Props {
    users: UserProfile[];
}

export const UsersTab: React.FC<Props> = ({ users }) => {
    return (
      <div className="py-8 animate-in fade-in space-y-6">

          {/* Header Stats */}
          <div className="flex justify-between items-end">
              <h2 className="text-2xl font-bold text-gray-900">Users</h2>
              <div className="flex gap-6 items-center">
                  <div className="text-right">
                      <p className="text-sm text-gray-500 mb-1">
                          Assentos utilizados <span className="font-bold text-gray-900">{users.length}/2</span>
                      </p>
                      <div className="w-32 h-1 bg-gray-200 rounded-full overflow-hidden ml-auto">
                          <div className="w-1/2 h-full bg-blue-600"></div>
                      </div>
                  </div>
                  <button className="bg-blue-600 text-white px-4 py-2.5 rounded-lg text-sm font-medium flex items-center gap-2 hover:bg-blue-700 shadow-sm transition-colors">
                      <Plus className="w-4 h-4" /> Convidar utilizador
                  </button>
              </div>
          </div>

          {/* Filters */}
          <div className="flex justify-between items-center bg-white p-1 rounded-lg">
              <div className="flex gap-2">
                  <button className="px-3 py-1.5 bg-gray-600 text-white text-xs font-bold rounded flex items-center gap-2">
                      Membros <span className="bg-white/20 px-1.5 rounded">{users.length}</span>
                  </button>
                  <button className="px-3 py-1.5 text-gray-500 hover:bg-gray-100 text-xs font-medium rounded flex items-center gap-2">
                      Convites <span className="bg-gray-200 px-1.5 rounded text-gray-600">0</span>
                  </button>
              </div>
              <div className="flex gap-3">
                  <div className="relative">
                      <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                      <input 
                          type="text" 
                          placeholder="Procurar utilizadores" 
                          className="pl-10 pr-4 py-2 border border-gray-200 rounded-lg text-sm w-64 focus:ring-2 focus:ring-blue-500 outline-none" 
                      />
                  </div>
                  <button className="flex items-center gap-2 px-3 py-2 border border-gray-200 rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-50">
                      <Filter className="w-4 h-4" /> Filtros
                  </button>
              </div>
          </div>

          {/* Table */}
          <div className="bg-gray-50 border border-gray-200 rounded-lg overflow-hidden">
              <table className="w-full text-sm text-left">
                  <thead className="bg-gray-100 text-gray-500 text-[10px] uppercase font-bold tracking-wider border-b border-gray-200">
                      <tr>
                          <th className="px-6 py-4">Membro da Equipa</th>
                          <th className="px-6 py-4">Função</th>
                          <th className="px-6 py-4">Equipe</th>
                          <th className="px-6 py-4">Status</th>
                          <th className="px-6 py-4 text-right">Última Ligação</th>
                          <th className="px-6 py-4 w-10"></th>
                      </tr>
                  </thead>

                  <tbody className="divide-y divide-gray-200 bg-white">
                      {users.length === 0 ? (
                          <tr>
                              <td colSpan={6} className="text-center py-12 text-gray-500">
                                  Nenhum utilizador encontrado.
                              </td>
                          </tr>
                      ) : users.map(user => (
                          <tr key={user.id} className="hover:bg-gray-50 transition-colors group">
                              
                              {/* Avatar + Nome */}
                              <td className="px-6 py-4">
                                  <div className="flex items-center gap-3">
                                      <div className="w-9 h-9 rounded-full bg-blue-600 text-white flex items-center justify-center font-bold text-xs border-2 border-white shadow-sm">
                                          {user.firstName?.charAt(0)}
                                          {user.lastName?.charAt(0)}
                                      </div>
                                      <div>
                                          <p className="font-bold text-gray-900 text-sm">
                                              {user.firstName} {user.lastName}
                                          </p>
                                          <p className="text-xs text-gray-500 font-medium">{user.email}</p>
                                      </div>
                                  </div>
                              </td>

                              {/* Role */}
                              <td className="px-6 py-4 text-gray-700 font-medium">
                                  {user.role ?? "-"}
                              </td>

                              {/* Team */}
                              <td className="px-6 py-4 text-gray-500">-</td>

                              {/* Status */}
                              <td className="px-6 py-4">
                                  <span className="px-2.5 py-1 bg-green-500 text-white rounded text-[10px] font-bold uppercase tracking-wide">
                                      ACTIVO
                                  </span>
                              </td>

                              {/* Last Active */}
                              <td className="px-6 py-4 text-right text-gray-600 tabular-nums">
                                  {user.lastActive 
                                      ? new Date(user.lastActive).toLocaleString('pt-PT')
                                      : "-"}
                              </td>

                              {/* Menu */}
                              <td className="px-6 py-4 text-right">
                                  <button className="p-1.5 hover:bg-gray-100 rounded text-gray-400 hover:text-gray-600 border border-transparent hover:border-gray-200">
                                      <MoreHorizontal className="w-4 h-4" />
                                  </button>
                              </td>

                          </tr>
                      ))}
                  </tbody>
              </table>
          </div>
      </div>
    );
};
