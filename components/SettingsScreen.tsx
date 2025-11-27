
import React, { useState, useEffect } from 'react';
import { UserProfile, Device, Invoice, CompanySettings, Project } from '../types';
import { 
    getCompanySettings, saveCompanySettings, getCompanyUsers, 
    getCompanyDevices, getInvoices, toggleDeviceStatus, getUserProjects 
} from '../services/storage';
import { GeneralTab } from './settings/GeneralTab';
import { PropertiesTab } from './settings/PropertiesTab';
import { UsersTab } from './settings/UsersTab';
import { DevicesTab } from './settings/DevicesTab';
import { BillingTab } from './settings/BillingTab';

interface SettingsScreenProps {
  currentUser: UserProfile | null;
  onUpdateUser: (updatedUser: UserProfile) => void;
  onDeleteAccount: () => void;
}

type Tab = 'general' | 'properties' | 'users' | 'devices' | 'billing';

export const SettingsScreen: React.FC<SettingsScreenProps> = ({ currentUser }) => {
  const [activeTab, setActiveTab] = useState<Tab>('general');
  const [isLoading, setIsLoading] = useState(false);
  
  const [company, setCompany] = useState<CompanySettings | null>(null);
  const [devices, setDevices] = useState<Device[]>([]);
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [users, setUsers] = useState<UserProfile[]>([]);
  const [projects, setProjects] = useState<Project[]>([]);

  useEffect(() => {
      if (!currentUser?.companyId) return;

      const loadData = async () => {
          setIsLoading(true);
          try {
              const settings = await getCompanySettings(currentUser.companyId!);
              if (settings) setCompany(settings);
              else {
                  const def: CompanySettings = {
                      id: currentUser.companyId!,
                      name: currentUser.company || 'Minha Empresa',
                      website: '',
                      primaryColor: '#623aa2',
                      backgroundColor: '#ffffff',
                      allowUserWatermark: true,
                      ownerId: currentUser.id
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

  const handleBlockDevice = async (device: Device) => {
      const newStatus = device.status === 'Active' ? 'Blocked' : 'Active';
      await toggleDeviceStatus(device.userId, device.id, newStatus);
      setDevices(prev => prev.map(d => d.id === device.id ? {...d, status: newStatus} : d));
  };

  return (
    <div className="min-h-screen bg-[#f9fafb] font-sans pb-20">
      <div className="bg-white border-b border-gray-200 pt-8 px-8 pb-0">
          <h1 className="text-2xl font-bold text-gray-900 mb-6">A minha organização</h1>
          <div className="flex overflow-x-auto no-scrollbar border-b border-gray-200 bg-white sticky top-0 z-20">
              {[
                  { id: 'general', label: 'Informações gerais' },
                  { id: 'properties', label: 'Imóvel' },
                  { id: 'users', label: 'Utilizadores' },
                  { id: 'devices', label: 'Dispositivos' },
                  { id: 'billing', label: 'Faturação e Subscrição' }
              ].map(tab => (
                  <button
                      key={tab.id}
                      onClick={() => setActiveTab(tab.id as Tab)}
                      className={`px-6 py-4 text-sm font-medium whitespace-nowrap transition-colors relative ${
                          activeTab === tab.id ? 'text-blue-600' : 'text-gray-500 hover:text-gray-700'
                      }`}
                  >
                      {tab.label}
                      {activeTab === tab.id && <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-blue-600 rounded-t-full"></div>}
                  </button>
              ))}
          </div>
      </div>

      <div className="px-8">
          {activeTab === 'general' && company && (
              <GeneralTab 
                  company={company} 
                  setCompany={setCompany} 
                  onSave={handleSaveGeneral} 
                  isLoading={isLoading} 
                  onLogoUpload={handleLogoUpload} 
              />
          )}
          {activeTab === 'properties' && <PropertiesTab projects={projects} currentUser={currentUser} />}
          {activeTab === 'users' && <UsersTab users={users} />}
          {activeTab === 'devices' && <DevicesTab devices={devices} onBlockDevice={handleBlockDevice} />}
          {activeTab === 'billing' && <BillingTab invoices={invoices} users={users} />}
      </div>
    </div>
  );
};
