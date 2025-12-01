import React from 'react';
import { FileText, Shield, LogOut, ChevronRight, Moon, Search, Compass, Heart, RefreshCw } from 'lucide-react';
import { UserProfile } from '../types';

export interface SettingsScreenProps {
  currentUser: UserProfile | null;
  onUpdateUser: (user: UserProfile) => Promise<void> | void;
  onDeleteAccount: () => Promise<void> | void;
}

export const SettingsScreen: React.FC<SettingsScreenProps> = ({ onDeleteAccount }) => {
  
  const toggleTheme = () => {
    document.documentElement.classList.toggle('dark');
  };

  return (
    <div className="flex flex-col min-h-full bg-brand-gray-50 dark:bg-black text-gray-900 dark:text-white animate-in slide-in-from-right-8 duration-300 font-sans">
      
      {/* Cabeçalho com Logo */}
      <div className="pt-12 pb-8 px-6 flex justify-between items-start">
         <div className="relative">
            {/* Logo Roxo */}
            <div className="w-16 h-16 bg-white dark:bg-[#121212] rounded-2xl flex items-center justify-center shadow-sm border border-gray-100 dark:border-white/10">
               <span className="text-brand-purple font-bold text-2xl tracking-tighter">snap</span>
            </div>
            {/* Badge Snap Immobile */}
            <div className="absolute -bottom-2 -right-2 bg-brand-purple text-white text-[8px] font-bold px-1.5 py-0.5 rounded">
               immobile
            </div>
         </div>
         <button onClick={() => window.history.back()} className="p-2 text-gray-400 hover:text-gray-900 dark:hover:text-white">
             <span className="sr-only">Fechar</span>
             <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>
         </button>
      </div>

      <div className="px-0 space-y-8">
        
        {/* MENU PRINCIPAL (Estilo Lista Limpa) */}
        <div className="bg-transparent">
             <LinkItem icon={Shield} label="Politica de Privacidade" isHeader />
             <LinkItem icon={RefreshCw} label="Sincronização" />
             <LinkItem icon={Search} label="Pesquisar" />
             <LinkItem icon={Compass} label="Explorar" />
             <LinkItem icon={Heart} label="Favoritos" />
        </div>

        {/* ESPAÇADOR */}
        <div className="h-12"></div>

        {/* MENU SECUNDÁRIO (Legal & Configs) */}
        <div className="bg-transparent">
             <LinkItem icon={Shield} label="Politica de Privacidade" />
             <LinkItem icon={FileText} label="Termos e Condições" />
             
             {/* Configurações (Com Toggle de Tema) */}
             <div className="flex items-center justify-between py-4 px-6 hover:bg-gray-100 dark:hover:bg-white/5 cursor-pointer" onClick={toggleTheme}>
                <div className="flex items-center gap-4">
                   <div className="text-gray-900 dark:text-white">
                       <SettingsIcon />
                   </div>
                   <span className="text-base font-medium text-gray-700 dark:text-gray-200">Configurações</span>
                </div>
                {/* Toggle */}
                <div className="relative w-10 h-6 bg-gray-200 dark:bg-brand-purple rounded-full transition-colors pointer-events-none">
                   <div className="absolute top-1 left-1 w-4 h-4 bg-white rounded-full shadow transition-transform dark:translate-x-4" />
                </div>
             </div>
             
             <div className="flex items-center gap-4 py-4 px-6 cursor-pointer hover:bg-red-50 dark:hover:bg-red-900/10 transition-colors group" onClick={onDeleteAccount}>
                <div className="text-gray-900 dark:text-white group-hover:text-red-600">
                    <LogOutIcon />
                </div>
                <span className="text-base font-medium text-gray-700 dark:text-gray-200 group-hover:text-red-600">Sair</span>
             </div>
        </div>

      </div>
    </div>
  );
};

// Ícones SVG Personalizados para combinar com o estilo
const SettingsIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="3"></circle><path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z"></path></svg>
);

const LogOutIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"></path><polyline points="16 17 21 12 16 7"></polyline><line x1="21" y1="12" x2="9" y2="12"></line></svg>
);

const LinkItem = ({ icon: Icon, label, isHeader = false }: { icon: any, label: string, isHeader?: boolean }) => (
  <div className={`flex items-center gap-4 py-4 px-6 hover:bg-gray-100 dark:hover:bg-white/5 transition-colors cursor-pointer ${isHeader ? 'bg-gray-100 dark:bg-white/5' : ''}`}>
    <div className={`text-gray-900 dark:text-white ${isHeader ? 'font-bold' : ''}`}>
       <Icon size={24} strokeWidth={isHeader ? 2.5 : 2} />
    </div>
    <span className={`text-base font-medium text-gray-700 dark:text-gray-200`}>{label}</span>
  </div>
);
