
import React, { useState, useRef, useEffect } from 'react';
import { User, Bell, Shield, Globe, Camera, Save, Key } from 'lucide-react';
import { UserProfile, UserPreferences } from '../types';

interface SettingsScreenProps {
  currentUser: UserProfile | null;
  onUpdateUser: (updatedUser: UserProfile) => void;
  onDeleteAccount: () => void;
}

export const SettingsScreen: React.FC<SettingsScreenProps> = ({ currentUser, onUpdateUser, onDeleteAccount }) => {
  // Local state for form fields
  const [firstName, setFirstName] = useState(currentUser?.firstName || '');
  const [lastName, setLastName] = useState(currentUser?.lastName || '');
  const [role, setRole] = useState<UserProfile['role']>(currentUser?.role || 'Fotografo');
  
  // Preferences
  const [language, setLanguage] = useState<UserPreferences['language']>(currentUser?.preferences?.language || 'pt-PT');
  const [notifications, setNotifications] = useState(currentUser?.preferences?.notifications ?? true);
  
  // Avatar
  const [avatar, setAvatar] = useState<string | undefined>(currentUser?.avatar);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Manual API Key for Fallback
  const [manualApiKey, setManualApiKey] = useState(localStorage.getItem('snap_gemini_api_key') || '');
  const [showKeyInput, setShowKeyInput] = useState(false);

  useEffect(() => {
      if (currentUser) {
          setFirstName(currentUser.firstName);
          setLastName(currentUser.lastName);
          setRole(currentUser.role);
          setLanguage(currentUser.preferences?.language || 'pt-PT');
          setNotifications(currentUser.preferences?.notifications ?? true);
          setAvatar(currentUser.avatar);
      }
  }, [currentUser]);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setAvatar(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSave = () => {
      if (!currentUser) return;

      const updatedUser: UserProfile = {
          ...currentUser,
          firstName,
          lastName,
          role: role,
          avatar,
          preferences: {
              ...currentUser.preferences,
              language: language,
              notifications,
              marketing: currentUser.preferences?.marketing || false,
              theme: 'light'
          }
      };

      onUpdateUser(updatedUser);
      alert("Definições guardadas com sucesso!");
  };

  const handleSaveApiKey = () => {
      if (manualApiKey.trim()) {
          localStorage.setItem('snap_gemini_api_key', manualApiKey.trim());
          alert("Chave API salva localmente. A IA deve funcionar agora.");
      } else {
          localStorage.removeItem('snap_gemini_api_key');
      }
  };

  const handleDeleteClick = () => {
      if (confirm("Tem a certeza absoluta? Esta ação apagará a sua conta e TODOS os seus projetos. Não pode ser desfeita.")) {
          onDeleteAccount();
      }
  };

  if (!currentUser) return <div className="p-6">A carregar perfil...</div>;

  return (
    <div className="max-w-4xl mx-auto p-6 pb-24">
      <h1 className="text-3xl font-bold text-gray-900 mb-8">Configurações</h1>

      <div className="space-y-6">
        
        {/* Profile Section */}
        <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
          <div className="p-6 border-b border-gray-100 flex flex-col sm:flex-row items-center gap-6">
            <div className="relative group cursor-pointer" onClick={() => fileInputRef.current?.click()}>
                <div className="w-24 h-24 rounded-full bg-gray-100 flex items-center justify-center overflow-hidden border-2 border-white shadow-md">
                    {avatar ? (
                        <img src={avatar} alt="Avatar" className="w-full h-full object-cover" />
                    ) : (
                        <User size={40} className="text-gray-400" />
                    )}
                </div>
                <div className="absolute inset-0 bg-black/40 rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                    <Camera className="text-white w-6 h-6" />
                </div>
                <input 
                    type="file" 
                    ref={fileInputRef} 
                    className="hidden" 
                    accept="image/*" 
                    onChange={handleFileChange}
                />
            </div>
            
            <div className="flex-1 w-full text-center sm:text-left space-y-3">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <input 
                        type="text" 
                        value={firstName} 
                        onChange={e => setFirstName(e.target.value)}
                        className="border border-gray-300 rounded-lg px-3 py-2 text-sm font-medium focus:ring-2 focus:ring-blue-500 outline-none"
                        placeholder="Nome"
                    />
                    <input 
                        type="text" 
                        value={lastName} 
                        onChange={e => setLastName(e.target.value)}
                        className="border border-gray-300 rounded-lg px-3 py-2 text-sm font-medium focus:ring-2 focus:ring-blue-500 outline-none"
                        placeholder="Sobrenome"
                    />
                </div>
                <div className="flex flex-col sm:flex-row gap-4 items-center">
                    <select 
                        value={role}
                        onChange={e => setRole(e.target.value as any)}
                        className="bg-gray-50 border border-gray-300 rounded-lg px-3 py-2 text-sm text-gray-700 focus:ring-blue-500 focus:border-blue-500"
                    >
                        <option value="Corretor">Sou Corretor</option>
                        <option value="Proprietario">Sou Proprietário</option>
                        <option value="Fotografo">Sou Fotógrafo</option>
                        <option value="Imobiliária">Sou Imobiliária</option>
                    </select>
                    <span className="text-xs text-gray-400 truncate">{currentUser.email}</span>
                </div>
            </div>
          </div>
        </div>

        {/* Preferences Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            
            {/* App Settings */}
            <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-6">
                <h3 className="text-base font-semibold text-gray-900 mb-4 flex items-center gap-2">
                    <Globe size={18} className="text-blue-600" /> Idioma & Região
                </h3>
                <div className="space-y-4">
                    <div className="flex items-center justify-between">
                        <span className="text-sm text-gray-600">Idioma da Interface</span>
                        <select 
                            value={language}
                            onChange={(e) => setLanguage(e.target.value as any)}
                            className="text-sm border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500"
                        >
                            <option value="pt-PT">Português (Portugal)</option>
                            <option value="pt-BR">Português (Brasil)</option>
                            <option value="en-US">English (US)</option>
                        </select>
                    </div>
                </div>
            </div>

            {/* Notifications */}
            <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-6">
                <h3 className="text-base font-semibold text-gray-900 mb-4 flex items-center gap-2">
                    <Bell size={18} className="text-orange-600" /> Notificações
                </h3>
                 <div className="space-y-4">
                    <div className="flex items-center justify-between">
                        <span className="text-sm text-gray-600">Processamento Concluído</span>
                        <div 
                            className={`w-11 h-6 rounded-full flex items-center p-1 cursor-pointer transition-colors ${notifications ? 'bg-blue-600' : 'bg-gray-300'}`}
                            onClick={() => setNotifications(!notifications)}
                        >
                            <div className={`bg-white w-4 h-4 rounded-full shadow-md transform transition-transform ${notifications ? 'translate-x-5' : 'translate-x-0'}`}></div>
                        </div>
                    </div>
                </div>
            </div>
        </div>

         {/* Security & Data */}
         <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-6">
            <h3 className="text-base font-semibold text-gray-900 mb-4 flex items-center gap-2">
                <Shield size={18} className="text-green-600" /> Segurança e Dados
            </h3>
            
            {/* API Key Fallback for Vercel Issues */}
            <div className="mb-6 p-4 bg-gray-50 rounded-lg border border-gray-200">
                <div 
                    className="flex justify-between items-center cursor-pointer mb-2"
                    onClick={() => setShowKeyInput(!showKeyInput)}
                >
                    <div className="flex items-center gap-2">
                        <Key size={16} className="text-gray-500"/>
                        <span className="text-sm font-medium text-gray-700">Diagnóstico IA (API Key)</span>
                    </div>
                    <span className="text-xs text-blue-600">{showKeyInput ? 'Ocultar' : 'Mostrar'}</span>
                </div>
                
                {showKeyInput && (
                    <div className="animate-in fade-in slide-in-from-top-2">
                        <p className="text-xs text-gray-500 mb-2">
                            Se a IA não estiver a funcionar (falha no Vercel), cole a sua chave Google Gemini aqui.
                        </p>
                        <div className="flex gap-2">
                            <input 
                                type="password" 
                                value={manualApiKey}
                                onChange={(e) => setManualApiKey(e.target.value)}
                                placeholder="AIzaSy..."
                                className="flex-1 border border-gray-300 rounded px-2 py-1 text-sm"
                            />
                            <button onClick={handleSaveApiKey} className="text-xs bg-gray-200 px-3 py-1 rounded hover:bg-gray-300">
                                Salvar Localmente
                            </button>
                        </div>
                    </div>
                )}
            </div>

            <div className="flex items-center justify-between border-t border-gray-100 pt-4 mb-4">
                <div>
                    <p className="text-sm font-medium text-gray-900">Exportar Dados</p>
                    <p className="text-xs text-gray-500">Descarregar JSON com todos os seus projetos.</p>
                </div>
                <button 
                    onClick={() => alert("Funcionalidade de exportação JSON será gerada no próximo update.")}
                    className="px-4 py-2 border border-gray-300 rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-50"
                >
                    Exportar
                </button>
            </div>
             <div className="flex items-center justify-between">
                <div>
                    <p className="text-sm font-medium text-red-600">Apagar Conta</p>
                    <p className="text-xs text-gray-500">Remover permanentemente a sua conta e projetos.</p>
                </div>
                <button 
                    onClick={handleDeleteClick}
                    className="px-4 py-2 bg-red-50 border border-red-100 rounded-lg text-sm font-medium text-red-600 hover:bg-red-100"
                >
                    Apagar
                </button>
            </div>
        </div>
        
        {/* Save Button */}
        <div className="sticky bottom-6 flex justify-end">
            <button 
                onClick={handleSave}
                className="bg-blue-600 hover:bg-blue-700 text-white px-8 py-3 rounded-full font-bold shadow-lg flex items-center gap-2 transform active:scale-95 transition-all"
            >
                <Save className="w-5 h-5" />
                Guardar Alterações
            </button>
        </div>

      </div>
    </div>
  );
};
