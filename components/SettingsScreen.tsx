
import React, { useState, useEffect } from 'react';
import { UserProfile, Device, Invoice, CompanySettings, Project } from '../types';
import { 
    getCompanySettings, saveCompanySettings, getCompanyUsers, 
    getCompanyDevices, getInvoices, toggleDeviceStatus, getUserProjects, updateUser 
} from '../services/storage';
import { GeneralTab } from './settings/GeneralTab';
import { PropertiesTab } from './settings/PropertiesTab';
import { UsersTab } from './settings/UsersTab';
import { DevicesTab } from './settings/DevicesTab';
import { BillingTab } from './settings/BillingTab';
import { ProfileTab } from './settings/ProfileTab';

interface SettingsScreenProps {
  currentUser: UserProfile | null;
  onUpdateUser: (updatedUser: UserProfile) => void;
  onDeleteAccount: () => void;
}

// Added 'teams' and 'integrations' to match screenshot
type Tab = 'general' | 'properties' | 'users' | 'teams' | 'integrations' | 'devices' | 'billing' | 'my_profile';

export const SettingsScreen: React.FC<SettingsScreenProps> = ({ currentUser, onUpdateUser }) => {
  const [activeTab, setActiveTab] = useState<Tab>('general');
  const [isLoading, setIsLoading] = useState(false);
  
  const [company, setCompany] = useState<CompanySettings | null>(null);
  const [devices, setDevices] = useState<Device[]>([]);
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [users, setUsers] = useState<UserProfile[]>([]);
  const [projects, setProjects] = useState<Project[]>([]);

  // If we are in "My Profile" mode vs "Company" mode
  const isProfileMode = activeTab === 'my_profile';

  useEffect(() => {
      if (!currentUser?.companyId) return;

      const loadData = async () => {
          setIsLoading(true);
          try {
              const settings = await getCompanySettings(currentUser.companyId!);
              if (settings) {
                  setCompany(settings);
              } else {
                  const def: CompanySettings = {
                      id: currentUser.companyId!,
                      name: currentUser.company || 'Minha Empresa',
                      website: '',
                      primaryColor: '#623aa2',
                      backgroundColor: '#ffffff',
                      allowUserWatermark: true,
                      ownerId: currentUser.id,
                      virtualTourDays: ['SEG', 'TER', 'QUA', 'QUI', 'SEX']
                  };
                  setCompany(def);
              }

              if (activeTab === 'users') setUsers(await getCompanyUsers(currentUser.companyId!));
              if (activeTab === 'devices') setDevices(await getCompanyDevices(currentUser.companyId!));
              if (activeTab === 'billing') setInvoices(await getInvoices(currentUser.companyId!));
              if (activeTab === 'properties') setProjects(await getUserProjects(currentUser.id));

          } catch (e) {
              console.error(e);
          } finally {
              setIsLoading(false);
          }
      };
      loadData();
  }, [currentUser, activeTab]);

  const handleSaveGeneral = async () => {
      if (!company) return;
      setIsLoading(true);
      try {
          await saveCompanySettings(company);
          alert("Configurações guardadas com sucesso!");
      } catch (e) {
          alert("Erro ao guardar.");
      } finally {
          setIsLoading(false);
      }
  };

  const handleLogoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      if (file && company) {
          setIsLoading(true);
          try {
              const updated = await saveCompanySettings(company, file);
              setCompany(updated);
          } catch (e) {
              alert("Erro no upload.");
          } finally {
              setIsLoading(false);
          }
      }
  };

  const handleWatermarkUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
      // Placeholder for watermark upload logic
      alert("Upload de marca d'água");
  };

  const handleBlockDevice = async (device: Device) => {
      const newStatus = device.status === 'Active' ? 'Blocked' : 'Active';
      await toggleDeviceStatus(device.userId, device.id, newStatus);
      setDevices(prev => prev.map(d => d.id === device.id ? {...d, status: newStatus} : d));
  };

  return (
    <div className="min-h-screen bg-[#f9fafb] font-sans pb-20">
      
      {/* Dynamic Header */}
      <div className="bg-white border-b border-gray-200 pt-8 px-8 pb-0">
          <div className="flex justify-between items-center mb-6">
             <h1 className="text-2xl font-bold text-gray-900">
                 {activeTab === 'my_profile' ? 'A minha conta' : 'A minha organização'}
             </h1>
             {/* Simple Toggle for Demo Purposes to switch views */}
             <div className="flex bg-gray-100 rounded-lg p-1">
                 <button 
                    onClick={() => setActiveTab('general')}
                    className={`px-3 py-1 text-xs font-medium rounded-md transition-all ${activeTab !== 'my_profile' ? 'bg-white shadow text-gray-900' : 'text-gray-500'}`}
                 >
                    Empresa
                 </button>
                 <button 
                    onClick={() => setActiveTab('my_profile')}
                    className={`px-3 py-1 text-xs font-medium rounded-md transition-all ${activeTab === 'my_profile' ? 'bg-white shadow text-gray-900' : 'text-gray-500'}`}
                 >
                    Perfil
                 </button>
             </div>
          </div>

          {!isProfileMode ? (
              <div className="flex overflow-x-auto no-scrollbar bg-white sticky top-0 z-20 gap-6">
                  {[
                      { id: 'general', label: 'Informações gerais' },
                      { id: 'properties', label: 'Imóvel' },
                      { id: 'users', label: 'Utilizadores' },
                      { id: 'teams', label: 'Equipas' },
                      { id: 'integrations', label: 'Integrações' },
                      { id: 'devices', label: 'Dispositivos' },
                      { id: 'billing', label: 'Faturação e Subscrição' }
                  ].map(tab => (
                      <button
                          key={tab.id}
                          onClick={() => setActiveTab(tab.id as Tab)}
                          className={`pb-4 text-sm font-medium whitespace-nowrap transition-colors relative ${
                              activeTab === tab.id ? 'text-blue-600 border-b-2 border-blue-600' : 'text-gray-500 hover:text-gray-700'
                          }`}
                      >
                          {tab.label}
                      </button>
                  ))}
              </div>
          ) : (
              <div className="flex overflow-x-auto no-scrollbar bg-white sticky top-0 z-20 gap-6">
                  <button className="pb-4 text-sm font-medium text-blue-600 border-b-2 border-blue-600">Informações gerais</button>
                  <button className="pb-4 text-sm font-medium text-gray-500 hover:text-gray-700">Segurança</button>
                  <button className="pb-4 text-sm font-medium text-gray-500 hover:text-gray-700">Preferências</button>
                  <button className="pb-4 text-sm font-medium text-gray-500 hover:text-gray-700">Actividade</button>
                  <button className="pb-4 text-sm font-medium text-gray-500 hover:text-gray-700">Cartão de visitas</button>
              </div>
          )}
      </div>

      <div className="px-8 pt-8">
          {/* Company Context */}
          {!isProfileMode && (
              <>
                {activeTab === 'general' && company && (
                    <GeneralTab 
                        company={company} 
                        setCompany={setCompany} 
                        onSave={handleSaveGeneral} 
                        isLoading={isLoading} 
                        onLogoUpload={handleLogoUpload} 
                        onWatermarkUpload={handleWatermarkUpload}
                    />
                )}
                {activeTab === 'properties' && <PropertiesTab projects={projects} currentUser={currentUser} />}
                {activeTab === 'users' && <UsersTab users={users} />}
                {activeTab === 'devices' && <DevicesTab devices={devices} onBlockDevice={handleBlockDevice} />}
                {activeTab === 'billing' && <BillingTab invoices={invoices} users={users} />}
                {/* Placeholders for new tabs */}
                {(activeTab === 'teams' || activeTab === 'integrations') && (
                    <div className="text-center py-20 text-gray-500">Funcionalidade em desenvolvimento.</div>
                )}
              </>
          )}

          {/* User Context */}
          {isProfileMode && currentUser && (
              <ProfileTab currentUser={currentUser} onUpdateUser={onUpdateUser} />
          )}
      </div>
    </div>
  );
};
