import React from 'react';
import { User, Bell, Shield, Moon, Globe } from 'lucide-react';

export const SettingsScreen: React.FC = () => {
  return (
    <div className="max-w-4xl mx-auto p-6">
      <h1 className="text-3xl font-bold text-gray-900 mb-8">Configurações</h1>

      <div className="space-y-6">
        {/* Profile Section */}
        <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
          <div className="p-6 border-b border-gray-100 flex items-center gap-4">
            <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center text-blue-600">
                <User size={32} />
            </div>
            <div>
                <h2 className="text-lg font-bold text-gray-900">Perfil do Fotógrafo</h2>
                <p className="text-sm text-gray-500">joao.silva@snapimmobile.pt</p>
            </div>
            <button className="ml-auto text-sm font-medium text-blue-600 hover:underline">Editar</button>
          </div>
        </div>

        {/* Preferences Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* App Settings */}
            <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-6">
                <h3 className="text-base font-semibold text-gray-900 mb-4 flex items-center gap-2">
                    <Globe size={18} /> Aplicação
                </h3>
                <div className="space-y-4">
                    <div className="flex items-center justify-between">
                        <span className="text-sm text-gray-600">Idioma</span>
                        <select className="text-sm border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500">
                            <option>Português (Portugal)</option>
                            <option>English (US)</option>
                        </select>
                    </div>
                    <div className="flex items-center justify-between">
                        <span className="text-sm text-gray-600">Tema Escuro</span>
                        <button className="w-11 h-6 bg-gray-200 rounded-full peer peer-focus:ring-4 peer-focus:ring-blue-300 flex items-center transition-colors">
                            <div className="w-5 h-5 bg-white rounded-full shadow-md transform translate-x-0.5 transition-transform"></div>
                        </button>
                    </div>
                </div>
            </div>

            {/* Notifications */}
            <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-6">
                <h3 className="text-base font-semibold text-gray-900 mb-4 flex items-center gap-2">
                    <Bell size={18} /> Notificações
                </h3>
                 <div className="space-y-4">
                    <div className="flex items-center justify-between">
                        <span className="text-sm text-gray-600">Processamento Concluído</span>
                        <input type="checkbox" defaultChecked className="w-4 h-4 text-blue-600 rounded focus:ring-blue-500" />
                    </div>
                    <div className="flex items-center justify-between">
                        <span className="text-sm text-gray-600">Novas Funcionalidades</span>
                        <input type="checkbox" className="w-4 h-4 text-blue-600 rounded focus:ring-blue-500" />
                    </div>
                </div>
            </div>
        </div>

         {/* Security */}
         <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-6">
            <h3 className="text-base font-semibold text-gray-900 mb-4 flex items-center gap-2">
                <Shield size={18} /> Segurança e Dados
            </h3>
            <div className="flex items-center justify-between border-b border-gray-50 pb-4 mb-4">
                <div>
                    <p className="text-sm font-medium text-gray-900">Exportar Dados</p>
                    <p className="text-xs text-gray-500">Descarregar uma cópia de todos os seus projetos.</p>
                </div>
                <button className="px-4 py-2 border border-gray-300 rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-50">
                    Exportar
                </button>
            </div>
             <div className="flex items-center justify-between">
                <div>
                    <p className="text-sm font-medium text-red-600">Apagar Conta</p>
                    <p className="text-xs text-gray-500">Remover permanentemente a sua conta e dados.</p>
                </div>
                <button className="px-4 py-2 bg-red-50 border border-red-100 rounded-lg text-sm font-medium text-red-600 hover:bg-red-100">
                    Apagar
                </button>
            </div>
        </div>
      </div>
    </div>
  );
};