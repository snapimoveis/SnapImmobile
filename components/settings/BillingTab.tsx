
import React from 'react';
import { Invoice, UserProfile } from '../../types';
import { Download } from 'lucide-react';
import { formatDate } from '../../utils/helpers';

interface Props {
    invoices: Invoice[];
    users: UserProfile[];
}

export const BillingTab: React.FC<Props> = ({ invoices, users }) => {
    return (
      <div className="py-8 space-y-8 animate-in fade-in">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {/* Plan Card */}
              <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm col-span-2">
                  <div className="flex justify-between items-start mb-4">
                      <div>
                          <h3 className="text-lg font-bold text-gray-900">Discovery - Photo</h3>
                          <p className="text-2xl font-bold text-gray-900 mt-2">59,00 € <span className="text-sm font-normal text-gray-500">por mês</span></p>
                      </div>
                      <span className="px-3 py-1 bg-green-100 text-green-700 text-xs font-bold rounded uppercase">Ativo</span>
                  </div>
                  <div className="space-y-3 mt-6">
                      <div className="flex justify-between text-sm">
                          <span className="text-gray-600">Imóveis ativos</span>
                          <span className="font-medium text-gray-900">Ilimitado</span>
                      </div>
                      <div className="h-1 w-full bg-blue-100 rounded-full overflow-hidden">
                          <div className="h-full bg-blue-600 w-full"></div>
                      </div>
                      <div className="flex justify-between text-sm mt-2">
                          <span className="text-gray-600">Créditos de IA</span>
                          <span className="font-medium text-gray-900">0/40</span>
                      </div>
                      <div className="h-1 w-full bg-gray-200 rounded-full overflow-hidden">
                          <div className="h-full bg-blue-600 w-0"></div>
                      </div>
                  </div>
                  <div className="mt-4 flex gap-2">
                      <span className="px-2 py-1 bg-gray-800 text-white text-[10px] font-bold rounded uppercase tracking-wider">PHOTO UNLIMITED</span>
                  </div>
                  <p className="text-xs text-gray-400 mt-4 text-right">Renova a dezembro 12, 2025 às 15:23 CET</p>
              </div>

              {/* Sidebar Widgets */}
              <div className="space-y-6">
                  <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm">
                      <div className="flex justify-between items-center mb-4">
                          <h4 className="font-bold text-gray-900">Usuários ( {users.length} )</h4>
                          <button className="text-xs text-blue-600 font-medium hover:underline">Adicionar</button>
                      </div>
                      <div className="flex -space-x-2">
                          {users.slice(0, 3).map(u => (
                              <div key={u.id} className="w-8 h-8 rounded-full bg-blue-600 text-white flex items-center justify-center text-xs border-2 border-white uppercase">
                                  {u.firstName?.charAt(0)}
                              </div>
                          ))}
                      </div>
                  </div>

                  <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm">
                      <div className="flex justify-between items-center mb-2">
                          <h4 className="font-bold text-gray-900">Créditos pré-pagos</h4>
                          <button className="text-xs text-blue-600 font-medium hover:underline">Ver transações</button>
                      </div>
                      <div className="flex justify-between items-center mt-4">
                          <span className="text-2xl font-bold text-gray-900">0</span>
                          <button className="px-3 py-1 border border-gray-300 rounded text-sm font-medium hover:bg-gray-50">Comprar</button>
                      </div>
                  </div>
              </div>
          </div>

          {/* Invoices Table */}
          <div>
              <h3 className="text-xl font-bold text-gray-900 mb-4">Faturas</h3>
              <div className="bg-white border border-gray-200 rounded-xl overflow-hidden shadow-sm">
                  <table className="w-full text-sm text-left">
                      <thead className="bg-gray-50 text-gray-500 text-xs uppercase">
                          <tr>
                              <th className="px-6 py-3">Nome</th>
                              <th className="px-6 py-3">Estado</th>
                              <th className="px-6 py-3">Data de Emissão</th>
                              <th className="px-6 py-3">Montante</th>
                              <th className="px-6 py-3"></th>
                          </tr>
                      </thead>
                      <tbody className="divide-y divide-gray-100">
                          {invoices.length === 0 ? (
                              <tr><td colSpan={5} className="text-center py-8 text-gray-500">Sem faturas recentes.</td></tr>
                          ) : invoices.map(inv => (
                              <tr key={inv.id} className="hover:bg-gray-50">
                                  <td className="px-6 py-4 font-medium text-gray-600">{inv.number}</td>
                                  <td className="px-6 py-4">
                                      <span className="px-2 py-1 bg-green-500 text-white text-[10px] font-bold rounded uppercase">PAGO</span>
                                  </td>
                                  <td className="px-6 py-4 text-gray-500">{formatDate(inv.date)}</td>
                                  <td className="px-6 py-4 text-gray-900">{inv.amount.toFixed(2)} €</td>
                                  <td className="px-6 py-4 text-right">
                                      <button className="p-2 hover:bg-gray-200 rounded border border-gray-300"><Download className="w-4 h-4 text-gray-600" /></button>
                                  </td>
                              </tr>
                          ))}
                      </tbody>
                  </table>
              </div>
          </div>
      </div>
    );
};
