import React from 'react';
import { User, Bell, Moon, FileText, Shield, HelpCircle, LogOut, ChevronRight, Home, Camera, Settings as SettingsIcon } from 'lucide-react';
import { Link, useLocation } from 'react-router-dom';

// Componente da Tela de Configurações
export const SettingsScreen = () => {
  return (
    <div className="flex flex-col h-full bg-gray-50 font-sans">
      {/* Cabeçalho */}
      <header className="bg-[#2A2142] p-6 text-white">
        <h1 className="text-2xl font-bold">Configurações</h1>
      </header>

      {/* Conteúdo */}
      <main className="flex-1 p-4 space-y-6 overflow-y-auto">
        {/* Seção Geral */}
        <section>
          <h2 className="text-sm font-medium text-gray-500 uppercase mb-3 ml-1">Geral</h2>
          <div className="bg-white rounded-xl shadow-sm divide-y divide-gray-100 overflow-hidden">
            <LinkItem icon={User} label="Editar Perfil" to="/profile" />
            <LinkItem icon={Bell} label="Notificações" to="/notifications" />
            {/* Item do Tema Escuro */}
            <div className="flex items-center justify-between p-4">
              <div className="flex items-center gap-3">
                <Moon className="h-5 w-5 text-gray-500" />
                <span className="text-gray-900 font-medium">Tema Escuro</span>
              </div>
              {/* Switch Toggle Simples (Visual) */}
              <label className="relative inline-flex items-center cursor-pointer">
                <input type="checkbox" value="" className="sr-only peer" />
                <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-2 peer-focus:ring-purple-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-purple-600"></div>
              </label>
            </div>
          </div>
        </section>

        {/* Seção Sobre */}
        <section>
          <h2 className="text-sm font-medium text-gray-500 uppercase mb-3 ml-1">Sobre</h2>
          <div className="bg-white rounded-xl shadow-sm divide-y divide-gray-100 overflow-hidden">
            <LinkItem icon={FileText} label="Termos de Uso" to="/terms-of-use" />
            <LinkItem icon={Shield} label="Política de Privacidade" to="/privacy-policy" />
            <LinkItem icon={HelpCircle} label="Ajuda e Suporte" to="/support" />
          </div>
        </section>

        {/* Botão Sair */}
        <div className="pt-4">
            <button className="w-full flex items-center justify-center gap-2 bg-red-500 hover:bg-red-600 text-white font-medium p-4 rounded-xl transition-colors">
            <LogOut className="h-5 w-5" /> Sair
            </button>
        </div>
      </main>
      
      {/* Barra de Navegação Inferior */}
      <BottomNavigationBar />
    </div>
  );
};

// Componente auxiliar para os links de navegação da lista
const LinkItem = ({ icon: Icon, label, to }: { icon: React.ElementType, label: string, to: string }) => (
  <Link to={to} className="flex items-center justify-between p-4 hover:bg-gray-50 transition-colors">
    <div className="flex items-center gap-3">
      <Icon className="h-5 w-5 text-gray-500" />
      <span className="text-gray-900 font-medium">{label}</span>
    </div>
    <ChevronRight className="h-5 w-5 text-gray-400" />
  </Link>
);

// Componente da Barra de Navegação Inferior (Baseado na imagem de referência)
const BottomNavigationBar = () => {
  const location = useLocation();
  
  return (
    <nav className="bg-white border-t border-gray-200 py-2 px-6 flex justify-around items-center">
      {/* O link para "Imóveis" está ativo conforme a imagem de referência */}
      <NavItem icon={Home} label="Imóveis" to="/imoveis" isActive={location.pathname === '/imoveis'} />
      <NavItem icon={Camera} label="Câmera" to="/camera" isActive={location.pathname === '/camera'} />
      <NavItem icon={SettingsIcon} label="Configurações" to="/settings" isActive={location.pathname === '/settings'} />
    </nav>
  );
};

// Componente auxiliar para os itens da barra de navegação
const NavItem = ({ icon: Icon, label, to, isActive = false }: { icon: React.ElementType, label: string, to: string, isActive?: boolean }) => (
  <Link to={to} className={`flex flex-col items-center gap-1 ${isActive ? 'text-purple-600' : 'text-gray-400 hover:text-gray-600'}`}>
    <Icon className="h-6 w-6" />
    <span className="text-xs font-medium">{label}</span>
  </Link>
);
