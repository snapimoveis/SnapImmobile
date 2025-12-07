
import React, { useState } from 'react';
import { Logo } from './Logo';
import { X, Shield, RefreshCw, Search, Compass, Heart, FileText, Settings, LogOut } from 'lucide-react';
import { TermsModal } from './TermsModal';
import { PrivacyModal } from './PrivacyModal';

interface ManagementMenuProps {
  onClose: () => void;
  onNavigate: (route: string) => void;
  onLogout: () => void;
}

export const ManagementMenu: React.FC<ManagementMenuProps> = ({ onClose, onNavigate, onLogout }) => {
  const [activeModal, setActiveModal] = useState<'terms' | 'privacy' | null>(null);

  const menuItemsTop = [
    { icon: Shield, label: 'Politica de Privacidade', action: () => setActiveModal('privacy') },
    { icon: RefreshCw, label: 'Sincronização', action: () => {} },
    { icon: Search, label: 'Pesquisar', action: () => {} },
    { icon: Compass, label: 'Explorar', action: () => {} },
    { icon: Heart, label: 'Favoritos', action: () => {} },
  ];

  const menuItemsBottom = [
    { icon: Shield, label: 'Politica de Privacidade', action: () => setActiveModal('privacy') },
    { icon: FileText, label: 'Termos e Condições', action: () => setActiveModal('terms') },
    { icon: Settings, label: 'Configurações', action: () => onNavigate('SETTINGS') },
    { icon: LogOut, label: 'Sair', action: onLogout },
  ];

  return (
    <>
        <div className="fixed inset-0 bg-gray-50 z-50 flex flex-col animate-in slide-in-from-left duration-300 font-sans">
        
        {/* Header with Logo and Close Button */}
        <div className="relative flex items-center justify-center py-8 px-6">
            <Logo className="w-24 h-24" />
            
            <button 
            onClick={onClose}
            className="absolute top-6 right-6 p-2 text-gray-600 hover:text-gray-900 hover:bg-gray-200 rounded-full transition-colors"
            >
            <X className="w-6 h-6" />
            </button>
        </div>

        {/* Scrollable Content Area */}
        <div className="flex-1 flex flex-col px-6 pb-8 overflow-y-auto">
            
            {/* Top Section */}
            <div className="space-y-1">
                {menuItemsTop.map((item, index) => (
                    <button 
                        key={index}
                        onClick={item.action}
                        className="w-full flex items-center gap-4 py-4 text-gray-700 hover:bg-gray-100 rounded-xl px-2 transition-colors group"
                    >
                        <item.icon className="w-6 h-6 text-black group-hover:text-gray-600 stroke-[1.5]" />
                        <span className="text-base font-normal text-gray-600 group-hover:text-gray-900">{item.label}</span>
                    </button>
                ))}
            </div>

            {/* Spacer to push bottom items down */}
            <div className="flex-1 min-h-[40px]"></div>

            {/* Bottom Section */}
            <div className="space-y-1">
                {menuItemsBottom.map((item, index) => (
                    <button 
                        key={index + 10}
                        onClick={item.action}
                        className="w-full flex items-center gap-4 py-4 text-gray-700 hover:bg-gray-100 rounded-xl px-2 transition-colors group"
                    >
                        <item.icon className="w-6 h-6 text-black group-hover:text-gray-600 stroke-[1.5]" />
                        <span className="text-base font-normal text-gray-600 group-hover:text-gray-900">{item.label}</span>
                    </button>
                ))}
            </div>

        </div>
        </div>

        {/* Modals */}
        {activeModal === 'terms' && <TermsModal onClose={() => setActiveModal(null)} />}
        {activeModal === 'privacy' && <PrivacyModal onClose={() => setActiveModal(null)} />}
    </>
  );
};
