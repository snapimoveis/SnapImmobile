
import React, { useState, useEffect, useRef } from 'react';
import { 
    User, Building2, Smartphone, CreditCard, LayoutGrid, Users, 
    Search, Filter, MoreHorizontal, Download, Plus, CheckCircle, 
    AlertCircle, Lock, Globe, Palette, Upload, Cloud
} from 'lucide-react';
import { UserProfile, Device, Invoice, CompanySettings, Project } from '../types';
import { 
    getCompanySettings, saveCompanySettings, getCompanyUsers, 
    getCompanyDevices, getInvoices, toggleDeviceStatus, getUserProjects 
} from '../services/storage';

interface SettingsScreenProps {
  currentUser: UserProfile | null;
  onUpdateUser: (updatedUser: UserProfile) => void;
  onDeleteAccount: () => void;
}

type Tab = 'general' | 'properties' | 'users' | 'devices' | 'billing';

export const SettingsScreen: React.FC<SettingsScreenProps> = ({ currentUser, onUpdateUser, onDeleteAccount }) => {
  const [activeTab, setActiveTab] = useState<Tab>('general');
  const [isLoading, setIsLoading] = useState(false);
  
  // Data States
  const [company, setCompany] = useState<CompanySettings | null>(null);
  const [devices, setDevices] = useState<Device[]>([]);
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [users, setUsers] = useState<UserProfile[]>([]);
  const [projects, setProjects] = useState<Project[]>([]);

  const logoInputRef = useRef<HTMLInputElement>(null);

  // Fetch Data on Mount / Tab Change
  useEffect(() => {
      if (!currentUser?.companyId) return;

      const loadData = async () => {
          setIsLoading(true);
          try {
              // Load Company Settings
              const settings = await getCompanySettings(currentUser.companyId!);
              if (settings) setCompany(settings);
              else {
                  // Initialize default if missing
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

              // Load Tab Specific Data
              if (activeTab === 'users') {
                  const u = await getCompanyUsers(currentUser.companyId!);
                  setUsers(u);
              }
              if (activeTab === 'devices') {
                  const d = await getCompanyDevices(currentUser.companyId!);
                  setDevices(d);
              }
              if (activeTab === 'billing') {
                  const i = await getInvoices(currentUser.companyId!);
                  setInvoices(i);
              }
              if (activeTab === 'properties') {
                  // For demo, loading current user projects. In real app, load all company projects if admin
                  const p = await getUserProjects(currentUser.id);
                  setProjects(p);
              }

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

  const Tabs = () => (
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
                      activeTab === tab.id 
                      ? 'text-blue-600' 
                      : 'text-gray-500 hover:text-gray-700'
                  }`}
              >
                  {tab.label}
                  {activeTab === tab.id && (
                      <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-blue-600 rounded-t-full"></div>
                  )}
              </button>
          ))}
      </div>
  );

  const GeneralTab = () => {
      if (!company) return <div>Carregando...</div>;
      return (
      <div className="max-w-4xl space-y-8 py-8 animate-in fade-in">
          {/* Profile Section */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
              <div>
                  <h3 className="text-lg font-bold text-gray-900">Perfil</h3>
                  <p className="text-sm text-gray-500 mt-2">Esta informação pode ser visualizada pelos seus contactos.</p>
              </div>
              <div className="md:col-span-2 space-y-6 bg-white p-6 rounded-xl border border-gray-200 shadow-sm">
                  <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Nome *</label>
                      <input 
                          type="text" 
                          value={company.name}
                          onChange={e => setCompany({...company, name: e.target.value})}
                          className="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                      />
                  </div>
                  <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Página web</label>
                      <div className="flex">
                          <span className="inline-flex items-center px-3 rounded-l-lg border border-r-0 border-gray-300 bg-gray-50 text-gray-500 text-sm">https://</span>
                          <input 
                              type="text" 
                              value={company.website.replace('https://', '')}
                              onChange={e => setCompany({...company, website: `https://${e.target.value}`})}
                              className="flex-1 p-2 border border-gray-300 rounded-r-lg focus:ring-2 focus:ring-blue-500 outline-none"
                          />
                      </div>
                      <p className="text-xs text-gray-500 mt-2 flex items-center gap-1">
                          <AlertCircle className="w-3 h-3" /> Este url é anexado ao seu logótipo quando partilhado.
                      </p>
                  </div>
                  <div className="flex justify-end">
                      <button onClick={handleSaveGeneral} className="bg-blue-400/20 text-blue-600 font-medium px-4 py-2 rounded-lg text-sm hover:bg-blue-400/30 transition-colors">
                          {isLoading ? 'A guardar...' : 'Guardar'}
                      </button>
                  </div>
              </div>
          </div>

          {/* Logo & Colors */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
              <div>
                  <h3 className="text-lg font-bold text-gray-900">Logotipo e cores</h3>
                  <p className="text-sm text-gray-500 mt-2">Personalize a sua marca visual nas visitas virtuais e e-mails.</p>
              </div>
              <div className="md:col-span-2 space-y-6">
                  {/* Logo Card */}
                  <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm">
                      <div className="flex justify-between mb-4">
                          <h4 className="font-medium text-gray-900">Logótipo</h4>
                          <div className="space-x-4 text-sm">
                              <button className="text-red-500 hover:underline">Remover</button>
                              <button onClick={() => logoInputRef.current?.click()} className="text-blue-600 hover:underline">Actualização</button>
                          </div>
                      </div>
                      <div className="bg-gray-100 h-40 rounded-lg flex items-center justify-center border-2 border-dashed border-gray-300">
                          {company.logoUrl ? (
                              <img src={company.logoUrl} className="h-24 object-contain" alt="Logo" />
                          ) : (
                              <div className="text-center text-gray-400">
                                  <Upload className="w-8 h-8 mx-auto mb-2" />
                                  <span className="text-sm">Carregar imagem</span>
                              </div>
                          )}
                      </div>
                      <input type="file" ref={logoInputRef} className="hidden" onChange={handleLogoUpload} accept="image/*" />
                  </div>

                  {/* Colors Card */}
                  <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm space-y-6">
                      <h4 className="font-medium text-gray-900">Cor</h4>
                      <div className="flex items-center justify-between p-4 border border-gray-100 rounded-lg">
                          <div className="flex items-center gap-4">
                              <div className="w-10 h-10 rounded-full shadow-inner" style={{ backgroundColor: company.primaryColor }}></div>
                              <div>
                                  <p className="font-medium text-sm text-gray-900">Cor principal</p>
                                  <p className="text-xs text-gray-500">Utilizado para botões e títulos.</p>
                              </div>
                          </div>
                          <input type="color" value={company.primaryColor} onChange={e => setCompany({...company, primaryColor: e.target.value})} className="w-8 h-8 opacity-0 absolute cursor-pointer" />
                          <div className="p-2 bg-gray-100 rounded hover:bg-gray-200 cursor-pointer"><Palette className="w-4 h-4 text-gray-600" /></div>
                      </div>
                  </div>

                  {/* Watermark Card */}
                  <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm">
                      <div className="flex justify-between mb-4">
                          <h4 className="font-medium text-gray-900">Marca de água</h4>
                          <div className="space-x-4 text-sm">
                              <button className="text-blue-600 hover:underline">Actualizar</button>
                          </div>
                      </div>
                      <div className="bg-gray-100 h-32 rounded-lg flex items-center justify-center relative overflow-hidden">
                          {company.logoUrl && <img src={company.logoUrl} className="h-16 opacity-50" alt="Watermark" />}
                          <div className="absolute top-2 left-2 bg-white px-2 py-1 rounded text-xs font-medium shadow-sm border">Definições</div>
                      </div>
                      <div className="mt-4 flex items-center gap-3">
                          <input 
                              type="checkbox" 
                              checked={company.allowUserWatermark}
                              onChange={e => setCompany({...company, allowUserWatermark: e.target.checked})}
                              className="w-4 h-4 text-blue-600 rounded" 
                          />
                          <span className="text-sm text-gray-700">Permitir que os utilizadores adicionem a sua própria marca de água.</span>
                      </div>
                      <div className="mt-6 flex justify-end">
                          <button onClick={handleSaveGeneral} className="bg-blue-400 text-white font-medium px-6 py-2 rounded-lg text-sm shadow-sm hover:bg-blue-500">Guardar</button>
                      </div>
                  </div>
              </div>
          </div>
      </div>
      );
  };

  const PropertiesTab = () => (
      <div className="py-8 animate-in fade-in">
          <div className="flex justify-between items-center mb-6">
              <div className="flex gap-2">
                  <div className="relative">
                      <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                      <input type="text" placeholder="Pesquisar..." className="pl-10 pr-4 py-2 border border-gray-300 rounded-lg text-sm w-64 focus:ring-2 focus:ring-blue-500 outline-none" />
                  </div>
                  <div className="flex border border-gray-300 rounded-lg overflow-hidden">
                      <span className="px-3 py-2 bg-blue-600 text-white text-sm font-medium">Activo {projects.length}</span>
                      <span className="px-3 py-2 bg-white text-gray-600 text-sm font-medium hover:bg-gray-50 cursor-pointer border-l">Arquivado 0</span>
                  </div>
              </div>
          </div>

          {/* List */}
          <div className="bg-white border border-gray-200 rounded-xl overflow-hidden shadow-sm">
              <table className="w-full text-sm text-left">
                  <thead className="bg-gray-50 text-gray-500 font-medium border-b border-gray-200">
                      <tr>
                          <th className="px-6 py-3 w-10"><input type="checkbox" className="rounded" /></th>
                          <th className="px-6 py-3">NOME DA PROPRIEDADE</th>
                          <th className="px-6 py-3">ADMINISTRADO POR</th>
                          <th className="px-6 py-3 text-center"><Smartphone className="w-4 h-4 mx-auto" /></th>
                          <th className="px-6 py-3 text-center"><Cloud className="w-4 h-4 mx-auto" /></th>
                          <th className="px-6 py-3 text-right">DATA DE CRIAÇÃO</th>
                          <th className="px-6 py-3"></th>
                      </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100">
                      {projects.length === 0 ? (
                          <tr><td colSpan={7} className="text-center py-10 text-gray-500">Nenhum imóvel encontrado.</td></tr>
                      ) : projects.map((p) => (
                          <tr key={p.id} className="hover:bg-gray-50 transition-colors">
                              <td className="px-6 py-4"><input type="checkbox" className="rounded" /></td>
                              <td className="px-6 py-4 font-medium text-gray-900">{p.title}</td>
                              <td className="px-6 py-4 text-gray-500 flex items-center gap-2">
                                  <Upload className="w-3 h-3" /> {currentUser?.email}
                              </td>
                              <td className="px-6 py-4 text-center">0</td>
                              <td className="px-6 py-4 text-center">{p.photos.length}</td>
                              <td className="px-6 py-4 text-right text-gray-500">{new Date(p.createdAt).toLocaleDateString()}</td>
                              <td className="px-6 py-4 text-right">
                                  <button className="p-1 hover:bg-gray-200 rounded"><MoreHorizontal className="w-4 h-4 text-gray-400" /></button>
                              </td>
                          </tr>
                      ))}
                  </tbody>
              </table>
          </div>
      </div>
  );

  const UsersTab = () => (
      <div className="py-8 animate-in fade-in">
          <div className="flex justify-between items-center mb-6">
              <h2 className="text-2xl font-bold text-gray-900">Users</h2>
              <div className="flex gap-4 items-center">
                  <div className="text-sm text-gray-500">
                      Assentos utilizados <span className="font-bold text-gray-900">{users.length}/5</span>
                      <div className="w-24 h-1 bg-gray-200 rounded-full mt-1 overflow-hidden">
                          <div className="w-full h-full bg-blue-600" style={{width: `${(users.length/5)*100}%`}}></div>
                      </div>
                  </div>
                  <button className="bg-blue-600 text-white px-4 py-2 rounded-lg text-sm font-medium flex items-center gap-2 hover:bg-blue-700 shadow-sm">
                      <Plus className="w-4 h-4" /> Convidar utilizador
                  </button>
              </div>
          </div>

          <div className="bg-white border border-gray-200 rounded-xl overflow-hidden shadow-sm">
              <div className="px-6 py-4 border-b border-gray-200 flex gap-3">
                  <button className="px-3 py-1 bg-gray-100 text-gray-600 text-xs font-bold rounded">Membros {users.length}</button>
                  <button className="px-3 py-1 bg-white text-gray-400 text-xs font-bold rounded hover:bg-gray-50">Convites 0</button>
              </div>
              <table className="w-full text-sm text-left">
                  <thead className="bg-gray-50 text-gray-500 text-xs uppercase">
                      <tr>
                          <th className="px-6 py-3">Membro da Equipa</th>
                          <th className="px-6 py-3">Função</th>
                          <th className="px-6 py-3">Status</th>
                          <th className="px-6 py-3 text-right">Última Ligação</th>
                          <th></th>
                      </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100">
                      {users.length === 0 ? (
                          <tr><td colSpan={5} className="text-center py-8 text-gray-500">Nenhum utilizador.</td></tr>
                      ) : users.map(user => (
                          <tr key={user.id} className="hover:bg-gray-50">
                              <td className="px-6 py-4">
                                  <div className="flex items-center gap-3">
                                      <div className="w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center text-blue-600 font-bold text-xs">
                                          {user.firstName?.charAt(0)}{user.lastName?.charAt(0)}
                                      </div>
                                      <div>
                                          <p className="font-medium text-gray-900">{user.firstName} {user.lastName}</p>
                                          <p className="text-xs text-gray-500">{user.email}</p>
                                      </div>
                                  </div>
                              </td>
                              <td className="px-6 py-4 text-gray-600">{user.role}</td>
                              <td className="px-6 py-4">
                                  <span className="px-2 py-1 bg-green-100 text-green-600 rounded text-xs font-bold uppercase">Activo</span>
                              </td>
                              <td className="px-6 py-4 text-right text-gray-500">{new Date(user.createdAt).toLocaleDateString()}</td>
                              <td className="px-6 py-4 text-right">
                                  <button><MoreHorizontal className="w-4 h-4 text-gray-400" /></button>
                              </td>
                          </tr>
                      ))}
                  </tbody>
              </table>
          </div>
      </div>
  );

  const DevicesTab = () => (
      <div className="py-8 animate-in fade-in">
          <div className="flex justify-between items-center mb-6">
              <div className="relative w-full max-w-md">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                  <input type="text" placeholder="Procurar dispositivos..." className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 outline-none" />
              </div>
              <div className="flex gap-2">
                  <span className="px-3 py-1 bg-blue-600 text-white text-xs font-medium rounded">Todos {devices.length}</span>
                  <span className="px-3 py-1 bg-white border text-gray-600 text-xs font-medium rounded">Bloqueado {devices.filter(d=>d.status==='Blocked').length}</span>
              </div>
          </div>

          <div className="bg-white border border-gray-200 rounded-xl overflow-hidden shadow-sm">
              <table className="w-full text-sm text-left">
                  <thead className="bg-gray-50 text-gray-500 text-xs uppercase">
                      <tr>
                          <th className="px-6 py-3 w-10"><input type="checkbox" className="rounded" /></th>
                          <th className="px-6 py-3">Nome</th>
                          <th className="px-6 py-3">Utilizador</th>
                          <th className="px-6 py-3">Modelo</th>
                          <th className="px-6 py-3">Último Acesso</th>
                          <th className="px-6 py-3">Status</th>
                          <th></th>
                      </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100">
                      {devices.length === 0 ? (
                          <tr><td colSpan={7} className="text-center py-8 text-gray-500">Nenhum dispositivo registado.</td></tr>
                      ) : devices.map(device => (
                          <tr key={device.id} className="hover:bg-gray-50">
                              <td className="px-6 py-4"><input type="checkbox" className="rounded" /></td>
                              <td className="px-6 py-4 font-medium text-gray-900">{device.type}</td>
                              <td className="px-6 py-4 text-gray-600">{device.userName}</td>
                              <td className="px-6 py-4 text-gray-500">{device.name} ({device.model})</td>
                              <td className="px-6 py-4 text-gray-500">{new Date(device.lastAccess).toLocaleDateString()}</td>
                              <td className="px-6 py-4">
                                  <button 
                                    onClick={() => handleBlockDevice(device)}
                                    className={`px-2 py-1 rounded text-xs font-bold uppercase hover:opacity-80 transition-opacity ${
                                      device.status === 'Active' ? 'text-green-600 bg-green-50' : 'text-red-600 bg-red-50'
                                  }`}>
                                      {device.status === 'Active' ? 'Acesso completo' : 'Bloqueado'}
                                  </button>
                              </td>
                              <td className="px-6 py-4 text-right">
                                  <button><MoreHorizontal className="w-4 h-4 text-gray-400" /></button>
                              </td>
                          </tr>
                      ))}
                  </tbody>
              </table>
          </div>
      </div>
  );

  const BillingTab = () => (
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
                                  <td className="px-6 py-4 text-gray-500">{new Date(inv.date).toLocaleDateString()}</td>
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

  return (
    <div className="min-h-screen bg-[#f9fafb] font-sans pb-20">
      <div className="bg-white border-b border-gray-200 pt-8 px-8 pb-0">
          <h1 className="text-2xl font-bold text-gray-900 mb-6">A minha organização</h1>
          <Tabs />
      </div>

      <div className="px-8">
          {activeTab === 'general' && <GeneralTab />}
          {activeTab === 'properties' && <PropertiesTab />}
          {activeTab === 'users' && <UsersTab />}
          {activeTab === 'devices' && <DevicesTab />}
          {activeTab === 'billing' && <BillingTab />}
      </div>
    </div>
  );
};
