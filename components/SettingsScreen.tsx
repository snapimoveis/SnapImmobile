import React, { useState, useRef, useEffect } from 'react';
import { User, Bell, Shield, Globe, Camera, Save, CheckCircle, Smartphone } from 'lucide-react';
import { UserProfile, UserPreferences } from '../types';

interface SettingsScreenProps {
  currentUser: UserProfile | null;
  onUpdateUser: (updatedUser: UserProfile) => void;
  onDeleteAccount: () => void;
}

export const SettingsScreen: React.FC<SettingsScreenProps> = ({ currentUser, onUpdateUser, onDeleteAccount }) => {
  const [firstName, setFirstName] = useState(currentUser?.firstName || '');
  const [lastName, setLastName] = useState(currentUser?.lastName || '');
  const [role, setRole] = useState<UserProfile['role']>(currentUser?.role || 'Fotografo');
  const [language, setLanguage] = useState(currentUser?.preferences?.language || 'pt-PT');
  const [notifications, setNotifications] = useState(currentUser?.preferences?.notifications ?? true);
  const [avatar, setAvatar] = useState<string | undefined>(currentUser?.avatar);
  const fileInputRef = useRef<HTMLInputElement>(null);

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
      reader.onloadend = () => setAvatar(reader.result as string);
      reader.readAsDataURL(file);
    }
  };

  const handleSave = () => {
      if (!currentUser) return;
      const updatedUser: UserProfile = {
          ...currentUser,
          firstName,
          lastName,
          role,
          avatar,
          preferences: {
              ...currentUser.preferences,
              language: language as any,
              notifications,
              marketing: false,
              theme: 'light'
          }
      };
      onUpdateUser(updatedUser);
      alert("Definições guardadas!");
  };

  if (!currentUser) return <div className="p-6">Loading...</div>;

  return (
    <div className="max-w-4xl mx-auto p-6 pb-24">
      <h1 className="text-3xl font-bold text-gray-900 mb-8">Configurações</h1>
      <div className="space-y-6">
        <div className="bg-white rounded-xl border border-gray-200 p-6 flex flex-col sm:flex-row items-center gap-6">
            <div className="relative cursor-pointer" onClick={() => fileInputRef.current?.click()}>
                <div className="w-24 h-24 rounded-full bg-gray-100 overflow-hidden border-2 border-white shadow-md">
                    {avatar ? <img src={avatar} className="w-full h-full object-cover" /> : <User className="w-full h-full p-4 text-gray-400" />}
                </div>
                <input type="file" ref={fileInputRef} className="hidden" accept="image/*" onChange={handleFileChange} />
            </div>
            <div className="flex-1 w-full space-y-3">
                <div className="grid grid-cols-2 gap-4">
                    <input value={firstName} onChange={e => setFirstName(e.target.value)} className="border p-2 rounded" placeholder="Nome" />
                    <input value={lastName} onChange={e => setLastName(e.target.value)} className="border p-2 rounded" placeholder="Sobrenome" />
                </div>
                <select value={role} onChange={e => setRole(e.target.value as any)} className="border p-2 rounded w-full">
                    <option value="Corretor">Corretor</option>
                    <option value="Fotografo">Fotógrafo</option>
                    <option value="Proprietario">Proprietário</option>
                    <option value="Imobiliária">Imobiliária</option>
                </select>
            </div>
        </div>

        <div className="bg-white rounded-xl border border-gray-200 p-6">
            <h3 className="font-bold mb-4">Segurança</h3>
            <div className="p-3 bg-blue-50 rounded mb-4">
                <p className="text-xs font-bold text-blue-600">ID do Dispositivo</p>
                <code className="text-xs">{currentUser.deviceId || 'N/A'}</code>
            </div>
            <button onClick={() => confirm("Apagar conta?") && onDeleteAccount()} className="text-red-600 text-sm">Apagar Conta</button>
        </div>

        <div className="flex justify-end">
            <button onClick={handleSave} className="bg-blue-600 text-white px-6 py-2 rounded-full font-bold">Guardar</button>
        </div>
      </div>
    </div>
  );
};