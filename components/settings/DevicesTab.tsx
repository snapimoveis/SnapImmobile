
import React from 'react';
import { Device } from '../../types';
import { Search, MoreHorizontal } from 'lucide-react';
import { formatDate } from '../../utils/helpers';

interface Props {
    devices: Device[];
    onBlockDevice: (device: Device) => void;
}

export const DevicesTab: React.FC<Props> = ({ devices, onBlockDevice }) => {
    return (
      <div className="py-8 animate-in fade-in">
          <div className="flex justify-between items-center mb-6">
              <div className="relative w-full max-w-md">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                  <input type="text" placeholder="Procurar dispositivos..." className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 outline-none" />
              </div>
              <div className="flex gap-2">
                  <span className="px-3 py-1 bg-blue-600 text-white text-xs font-medium rounded">Todos {devices.length}</span>
                  <span className="px-3 py-1 bg-white border text-gray-600 text-xs font-medium rounded">Bloqueado {devices.filter(d=>d.status==='Blocked').length}</span>
              </div>
          </div>

          <div className="bg-white border border-gray-200 rounded-xl overflow-hidden shadow-sm">
              <table className="w-full text-sm text-left">
                  <thead className="bg-gray-50 text-gray-500 text-xs uppercase">
                      <tr>
                          <th className="px-6 py-3 w-10"><input type="checkbox" className="rounded" /></th>
                          <th className="px-6 py-3">Nome</th>
                          <th className="px-6 py-3">Utilizador</th>
                          <th className="px-6 py-3">Modelo</th>
                          <th className="px-6 py-3">Último Acesso</th>
                          <th className="px-6 py-3">Status</th>
                          <th></th>
                      </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100">
                      {devices.length === 0 ? (
                          <tr><td colSpan={7} className="text-center py-8 text-gray-500">Nenhum dispositivo registado.</td></tr>
                      ) : devices.map(device => (
                          <tr key={device.id} className="hover:bg-gray-50">
                              <td className="px-6 py-4"><input type="checkbox" className="rounded" /></td>
                              <td className="px-6 py-4 font-medium text-gray-900">{device.type}</td>
                              <td className="px-6 py-4 text-gray-600">{device.userName}</td>
                              <td className="px-6 py-4 text-gray-500">{device.name} ({device.model})</td>
                              <td className="px-6 py-4 text-gray-500">{formatDate(device.lastAccess)}</td>
                              <td className="px-6 py-4">
                                  <button 
                                    onClick={() => onBlockDevice(device)}
                                    className={`px-2 py-1 rounded text-xs font-bold uppercase hover:opacity-80 transition-opacity ${
                                      device.status === 'Active' ? 'text-green-600 bg-green-50' : 'text-red-600 bg-red-50'
                                  }`}>
                                      {device.status === 'Active' ? 'Acesso completo' : 'Bloqueado'}
                                  </button>
                              </td>
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
