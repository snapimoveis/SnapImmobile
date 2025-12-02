import React from 'react';
import { Device } from '../../types';
import { Search, MoreHorizontal, Smartphone, Monitor } from 'lucide-react';
import { formatDate } from '../../utils/helpers';

interface Props {
    devices: Device[];
    onBlockDevice: (device: Device) => void;
}

export const DevicesTab: React.FC<Props> = ({ devices = [], onBlockDevice }) => {

    const getBlockedCount = () => {
        if (!Array.isArray(devices)) return 0;
        return devices.filter(d => d.status === 'Blocked' || d.status === 'inactive').length;
    };

    return (
      <div className="py-8 animate-in fade-in">

          {/* HEADER */}
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-6">
              <div className="relative w-full max-w-md">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                  <input 
                      type="text" 
                      placeholder="Procurar dispositivos..." 
                      className="w-full pl-10 pr-4 py-2 border border-gray-300 dark:border-white/20 bg-white dark:bg-black text-gray-900 dark:text-white rounded-lg text-sm focus:ring-2 focus:ring-purple-500 outline-none transition-colors" 
                  />
              </div>

              <div className="flex gap-2">
                  <span className="px-3 py-1 bg-[#623aa2] text-white text-xs font-medium rounded">
                      Todos {devices.length}
                  </span>
                  <span className="px-3 py-1 bg-white dark:bg-white/10 border border-gray-200 dark:border-white/10 text-gray-600 dark:text-gray-300 text-xs font-medium rounded">
                      Bloqueado {getBlockedCount()}
                  </span>
              </div>
          </div>

          {/* TABLE */}
          <div className="bg-white dark:bg-black border border-gray-200 dark:border-white/10 rounded-xl overflow-hidden shadow-sm transition-colors">
              <table className="w-full text-sm text-left">
                  <thead className="bg-gray-50 dark:bg-white/5 text-gray-500 dark:text-gray-400 text-xs uppercase">
                      <tr>
                          <th className="px-6 py-3 w-10"><input type="checkbox" /></th>
                          <th className="px-6 py-3">Tipo</th>
                          <th className="px-6 py-3">Nome</th>
                          <th className="px-6 py-3">Utilizador</th>
                          <th className="px-6 py-3">Último Acesso</th>
                          <th className="px-6 py-3">Status</th>
                          <th className="px-6 py-3"></th>
                      </tr>
                  </thead>

                  <tbody className="divide-y divide-gray-100 dark:divide-white/10">
                      {devices.length === 0 ? (
                          <tr>
                              <td colSpan={7} className="text-center py-8 text-gray-500 dark:text-gray-400">
                                  Nenhum dispositivo registado.
                              </td>
                          </tr>
                      ) : devices.map(device => (
                          <tr key={device.id} className="hover:bg-gray-50 dark:hover:bg-white/5 transition-colors">

                              {/* CHECKBOX */}
                              <td className="px-6 py-4">
                                  <input type="checkbox" />
                              </td>

                              {/* TYPE */}
                              <td className="px-6 py-4 font-medium text-gray-900 dark:text-white">
                                  <div className="flex items-center gap-2">
                                      {device.type === "mobile" 
                                          ? <Smartphone size={16} />
                                          : <Monitor size={16} />
                                      }
                                      <span className="capitalize">{device.type ?? "desconhecido"}</span>
                                  </div>
                              </td>

                              {/* NAME + MODEL */}
                              <td className="px-6 py-4 text-gray-600 dark:text-gray-300">
                                  <div className="flex flex-col">
                                      <span className="font-medium text-gray-900 dark:text-white">
                                          {device.name}
                                      </span>
                                      <span className="text-xs text-gray-500">
                                          {device.model ?? ""}
                                      </span>
                                  </div>
                              </td>

                              {/* USER */}
                              <td className="px-6 py-4 text-gray-600 dark:text-gray-300">
                                  {device.userName ?? "Desconhecido"}
                              </td>

                              {/* LAST ACCESS */}
                              <td className="px-6 py-4 text-gray-500 dark:text-gray-400">
                                  {formatDate(device.lastAccess ?? device.lastActive ?? 0)}
                              </td>

                              {/* STATUS */}
                              <td className="px-6 py-4">
                                  <button 
                                      onClick={() => onBlockDevice(device)}
                                      className={`px-2 py-1 rounded text-[10px] font-bold uppercase hover:opacity-80 transition-opacity ${
                                          (device.status === 'active' || device.status === 'Active')
                                          ? 'text-green-700 bg-green-100 dark:text-green-400 dark:bg-green-900/30'
                                          : 'text-red-700 bg-red-100 dark:text-red-400 dark:bg-red-900/30'
                                      }`}
                                  >
                                      {(device.status === 'active' || device.status === 'Active')
                                          ? 'Acesso permitido'
                                          : 'Bloqueado'}
                                  </button>
                              </td>

                              {/* MENU */}
                              <td className="px-6 py-4 text-right">
                                  <button className="p-1 hover:bg-gray-100 dark:hover:bg-white/10 rounded-full transition-colors">
                                      <MoreHorizontal className="w-4 h-4 text-gray-400" />
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
