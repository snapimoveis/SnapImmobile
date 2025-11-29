import React from 'react';
import { User, Bell, Moon, FileText, Shield, HelpCircle, LogOut, ChevronRight } from 'lucide-react';
import { UserProfile } from '../types';

// Interface exportada para garantir que o App.tsx reconheça os tipos
export interface SettingsScreenProps {
  currentUser: UserProfile | null;
  onUpdateUser: (user: UserProfile) => Promise<void> | void;
  onDeleteAccount: () => Promise<void> | void;
}

export const SettingsScreen: React.FC<SettingsScreenProps> = ({ 
  currentUser, 
  onUpdateUser, 
  onDeleteAccount 
}) => {
  
  const toggleTheme = () => {
    document.documentElement.classList.toggle('dark');
  };

  return (
    <div className="flex flex-col min-h-full bg-white dark:bg-black text-black dark:text-white animate-in slide-in-from-right-8 duration-300">
      
      {/* Cabeçalho */}
      <div className="pt-6 px-6 pb-4">
         <h1 className="text-3xl font-bold tracking-tight">Configurações</h1>
         {currentUser && (
            <p className="text-sm text-gray-500 mt-1">Olá, {currentUser.firstName}</p>
         )}
      </div>

      <div className="px-4 space-y-8 mt-2">
        
        {/* SEÇÃO: GERAL */}
        <section>
          <h2 className="text-xs font-bold text-gray-500 uppercase mb-2 ml-2 tracking-wider">Geral</h2>
          <div className="border-t border-b border-gray-100 dark:border-white/10 divide-y divide-gray-100 dark:divide-white/10">
             
             {/* Toggle Tema Escuro */}
             <div className="flex items-center justify-between py-4 px-2 hover:bg-gray-50 dark:hover:bg-white/5 transition-colors cursor-pointer" onClick={toggleTheme}>
                <div className="flex items-center gap-3">
                   <Moon size={20} className="text-gray-900 dark:text-white" />
                   <span className="font-medium text-base">Modo Escuro</span>
                </div>
                <div className="relative w-11 h-6 bg-gray-200 dark:bg-white/20 rounded-full transition-colors">
                   <div className="absolute top-1 left-1 w-4 h-4 bg-white dark:bg-black rounded-full shadow transition-transform dark:translate-x-5" />
                </div>
             </div>

             <LinkItem icon={User} label="Editar Perfil" />
             <LinkItem icon={Bell} label="Notificações" />
          </div>
        </section>

        {/* SEÇÃO: SOBRE */}
        <section>
          <h2 className="text-xs font-bold text-gray-500 uppercase mb-2 ml-2 tracking-wider">Sobre</h2>
          <div className="border-t border-b border-gray-100 dark:border-white/10 divide-y divide-gray-100 dark:divide-white/10">
             <LinkItem icon={FileText} label="Termos de Uso" />
             <LinkItem icon={Shield} label="Política de Privacidade" />
             <LinkItem icon={HelpCircle} label="Ajuda e Suporte" />
          </div>
        </section>

        {/* Botão Sair */}
        <button 
            onClick={onDeleteAccount}
            className="w-full mt-4 p-4 rounded-xl flex items-center justify-center gap-2 text-red-600 dark:text-red-500 font-medium hover:bg-red-50 dark:hover:bg-red-900/10 transition-colors"
        >
            <LogOut size={20} />
            <span>Sair da conta</span>
        </button>

        <p className="text-center text-xs text-gray-400 py-6">
           Versão 2.1.0 • SnapImmobile
        </p>

      </div>
    </div>
  );
};

const LinkItem = ({ icon: Icon, label }: { icon: any, label: string }) => (
  <button className="w-full flex items-center justify-between py-4 px-2 hover:bg-gray-50 dark:hover:bg-white/5 transition-colors">
    <div className="flex items-center gap-3">
       <Icon size={20} className="text-gray-900 dark:text-white" />
       <span className="font-medium text-base text-gray-900 dark:text-white">{label}</span>
    </div>
    <ChevronRight size={18} className="text-gray-300 dark:text-gray-600" />
  </button>
);
