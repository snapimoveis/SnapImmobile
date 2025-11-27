
import React from 'react';
import { UserProfile } from '../../types';
import { Plus, MoreHorizontal } from 'lucide-react';
import { formatDate } from '../../utils/helpers';

interface Props {
    users: UserProfile[];
}

export const UsersTab: React.FC<Props> = ({ users }) => {
    return (
      <div className="py-8 animate-in fade-in">
          <div className="flex justify-between items-center mb-6">
              <h2 className="text-2xl font-bold text-gray-900">Users</h2>
              <div className="flex gap-4 items-center">
                  <div className="text-sm text-gray-500">
                      Assentos utilizados <span className="font-bold text-gray-900">{users.length}/5</span>
                      <div className="w-24 h-1 bg-gray-200 rounded-full mt-1 overflow-hidden">
                          <div className="w-full h-full bg-blue-600" style={{width: `${(users.length/5)*100}%`}}></div>
                      </div>
                  </div>
                  <button className="bg-blue-600 text-white px-4 py-2 rounded-lg text-sm font-medium flex items-center gap-2 hover:bg-blue-700 shadow-sm">
                      <Plus className="w-4 h-4" /> Convidar utilizador
                  </button>
              </div>
          </div>

          <div className="bg-white border border-gray-200 rounded-xl overflow-hidden shadow-sm">
              <div className="px-6 py-4 border-b border-gray-200 flex gap-3">
                  <button className="px-3 py-1 bg-gray-100 text-gray-600 text-xs font-bold rounded">Membros {users.length}</button>
              </div>
              <table className="w-full text-sm text-left">
                  <thead className="bg-gray-50 text-gray-500 text-xs uppercase">
                      <tr>
                          <th className="px-6 py-3">Membro da Equipa</th>
                          <th className="px-6 py-3">Função</th>
                          <th className="px-6 py-3">Status</th>
                          <th className="px-6 py-3 text-right">Última Ligação</th>
                          <th></th>
                      </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100">
                      {users.length === 0 ? (
                          <tr><td colSpan={5} className="text-center py-8 text-gray-500">Nenhum utilizador.</td></tr>
                      ) : users.map(user => (
                          <tr key={user.id} className="hover:bg-gray-50">
                              <td className="px-6 py-4">
                                  <div className="flex items-center gap-3">
                                      <div className="w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center text-blue-600 font-bold text-xs">
                                          {user.firstName?.charAt(0)}{user.lastName?.charAt(0)}
                                      </div>
                                      <div>
                                          <p className="font-medium text-gray-900">{user.firstName} {user.lastName}</p>
                                          <p className="text-xs text-gray-500">{user.email}</p>
                                      </div>
                                  </div>
                              </td>
                              <td className="px-6 py-4 text-gray-600">{user.role}</td>
                              <td className="px-6 py-4">
                                  <span className="px-2 py-1 bg-green-100 text-green-600 rounded text-xs font-bold uppercase">Activo</span>
                              </td>
                              <td className="px-6 py-4 text-right text-gray-500">{formatDate(user.createdAt)}</td>
                              <td className="px-6 py-4 text-right">
                                  <button><MoreHorizontal className="w-4 h-4 text-gray-400" /></button>
                              </td>
                          </tr>
                      ))}
                  </tbody>
              </table>
          </div>
      </div>
    );
};
