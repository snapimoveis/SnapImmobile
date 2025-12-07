import React, { useRef } from 'react';
import { CompanySettings } from '../../types';
import { Upload, AlertCircle, Palette, Settings } from 'lucide-react';

interface Props {
    company: CompanySettings;
    setCompany: (c: CompanySettings) => void;
    onSave: () => void;
    isLoading: boolean;
    onLogoUpload: (e: React.ChangeEvent<HTMLInputElement>) => void;
    onWatermarkUpload: (e: React.ChangeEvent<HTMLInputElement>) => void;
}

export const GeneralTab: React.FC<Props> = ({ company, setCompany, onSave, isLoading, onLogoUpload, onWatermarkUpload }) => {
    const logoInputRef = useRef<HTMLInputElement>(null);
    const wmInputRef = useRef<HTMLInputElement>(null);

    const weekDays = ['SEG', 'TER', 'QUA', 'QUI', 'SEX', 'SÁB', 'DOM'];

    const toggleDay = (day: string) => {
        // FIX CRÍTICO: Força explicitamente o tipo para string[] e garante que não é nulo
        const currentDays = (Array.isArray(company.virtualTourDays) ? company.virtualTourDays : []) as string[];
        
        if (currentDays.includes(day)) {
            setCompany({ ...company, virtualTourDays: currentDays.filter((d) => d !== day) });
        } else {
            setCompany({ ...company, virtualTourDays: [...currentDays, day] });
        }
    };

    const getSafeWebsite = () => {
        return (company.website || '').replace('https://', '');
    };

    // FIX: Helper para verificar se o dia está selecionado na renderização
    const isDaySelected = (day: string): boolean => {
        const days = Array.isArray(company.virtualTourDays) ? company.virtualTourDays : [];
        // @ts-ignore - Ignora erro se o TS achar que é number, pois verificamos com isArray
        return days.includes(day);
    };

    return (
      <div className="max-w-5xl space-y-10 animate-in fade-in pb-24">
          
          {/* Perfil Section */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
              <div>
                  <h3 className="text-lg font-bold text-gray-900 dark:text-white">Perfil</h3>
                  <p className="text-sm text-gray-500 dark:text-gray-400 mt-2 leading-relaxed">Esta informação pode ser visualizada pelos seus contactos.</p>
              </div>
              <div className="md:col-span-2 bg-white dark:bg-black p-8 rounded-xl border border-gray-200 dark:border-white/10 shadow-sm space-y-6">
                  <div>
                      <label className="block text-sm font-medium text-gray-900 dark:text-gray-300 mb-2">Nome *</label>
                      <input 
                          type="text" 
                          value={company.name || ''}
                          onChange={e => setCompany({...company, name: e.target.value})}
                          className="w-full p-3 border border-gray-300 dark:border-white/20 bg-transparent rounded-lg focus:ring-2 focus:ring-purple-500 outline-none text-gray-900 dark:text-white"
                      />
                  </div>
                  <div>
                      <label className="block text-sm font-medium text-gray-900 dark:text-gray-300 mb-2">Página web</label>
                      <div className="flex">
                          <span className="inline-flex items-center px-4 rounded-l-lg border border-r-0 border-gray-300 dark:border-white/20 bg-gray-50 dark:bg-white/5 text-gray-500 text-sm">https://</span>
                          <input 
                              type="text" 
                              value={getSafeWebsite()}
                              onChange={e => setCompany({...company, website: `https://${e.target.value}`})}
                              className="flex-1 p-3 border border-gray-300 dark:border-white/20 bg-transparent rounded-r-lg focus:ring-2 focus:ring-purple-500 outline-none text-gray-900 dark:text-white"
                          />
                      </div>
                      <p className="text-xs text-gray-500 mt-3 flex items-center gap-1.5">
                          <AlertCircle className="w-3.5 h-3.5" /> Este url é anexado ao seu logótipo quando partilhado com os contatos.
                      </p>
                  </div>
                  <div className="flex justify-end pt-2">
                      <button onClick={onSave} className="bg-[#623aa2] text-white font-semibold px-6 py-2.5 rounded-lg text-sm hover:bg-[#502d85] transition-colors shadow-lg active:scale-95 transition-transform">
                          {isLoading ? 'A guardar...' : 'Guardar'}
                      </button>
                  </div>
              </div>
          </div>

          <div className="border-t border-gray-200 dark:border-white/10"></div>

          {/* Logotipo e Cores Section */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
              <div>
                  <h3 className="text-lg font-bold text-gray-900 dark:text-white">Logotipo e cores</h3>
                  <p className="text-sm text-gray-500 dark:text-gray-400 mt-2 leading-relaxed">O seu logótipo pode ser exibido nas suas fotografias, vídeos ou durante visitas virtuais.</p>
              </div>
              <div className="md:col-span-2 space-y-6">
                  {/* Logo Card */}
                  <div className="bg-white dark:bg-black p-8 rounded-xl border border-gray-200 dark:border-white/10 shadow-sm">
                      <div className="flex justify-between items-center mb-6">
                          <h4 className="font-bold text-gray-900 dark:text-white">Logótipo</h4>
                          <div className="space-x-4 text-sm font-medium">
                              <button onClick={() => setCompany({...company, logoUrl: undefined})} className="text-gray-900 dark:text-gray-400 hover:underline">Remover</button>
                              <button onClick={() => logoInputRef.current?.click()} className="text-blue-600 hover:underline">Actualização</button>
                          </div>
                      </div>
                      <div className="bg-gray-100 dark:bg-white/5 h-48 rounded-lg flex items-center justify-center border border-gray-200 dark:border-white/10">
                          {company.logoUrl ? (
                              <img src={company.logoUrl} className="h-24 object-contain" alt="Logo" />
                          ) : (
                              <div className="text-center text-gray-400">
                                  <Upload className="w-10 h-10 mx-auto mb-2 opacity-50" />
                                  <span className="text-sm">Carregar imagem</span>
                              </div>
                          )}
                      </div>
                      <input type="file" ref={logoInputRef} className="hidden" onChange={onLogoUpload} accept="image/*" />
                  </div>

                  {/* Colors Card */}
                  <div className="bg-white dark:bg-black p-8 rounded-xl border border-gray-200 dark:border-white/10 shadow-sm space-y-8">
                      <h4 className="font-bold text-gray-900 dark:text-white">Cor</h4>
                      
                      {/* Primary Color */}
                      <div className="flex items-center justify-between p-4 border border-gray-100 dark:border-white/10 rounded-lg hover:border-gray-300 dark:hover:border-white/30 transition-colors cursor-pointer relative group">
                          <div className="flex items-center gap-4">
                              <div className="w-12 h-12 rounded-full shadow-inner ring-4 ring-gray-50 dark:ring-white/10" style={{ backgroundColor: company.primaryColor || '#623aa2' }}></div>
                              <div>
                                  <p className="font-bold text-gray-900 dark:text-white">Cor principal</p>
                                  <p className="text-sm text-gray-500">Utilizado para elementos principais, como botões ou títulos.</p>
                              </div>
                          </div>
                          <input 
                            type="color" 
                            value={company.primaryColor || '#623aa2'} 
                            onChange={e => setCompany({...company, primaryColor: e.target.value})} 
                            className="absolute inset-0 w-full h-full opacity-0 cursor-pointer" 
                          />
                          <div className="p-2 bg-gray-100 dark:bg-white/10 rounded-lg text-blue-600 group-hover:bg-blue-50 transition-colors">
                              <Palette className="w-5 h-5" />
                          </div>
                      </div>

                      {/* Background Color */}
                      <div className="flex items-center justify-between p-4 border border-gray-100 dark:border-white/10 rounded-lg hover:border-gray-300 dark:hover:border-white/30 transition-colors cursor-pointer relative group">
                          <div className="flex items-center gap-4">
                              <div className="w-12 h-12 rounded-full shadow-inner border border-gray-200 dark:border-white/20 ring-4 ring-gray-50 dark:ring-white/10" style={{ backgroundColor: company.backgroundColor || '#ffffff' }}></div>
                              <div>
                                  <p className="font-bold text-gray-900 dark:text-white">Cor de fundo</p>
                                  <p className="text-sm text-gray-500">Cores como o branco, o cinzento ou o bege são escolhas populares.</p>
                              </div>
                          </div>
                          <input 
                            type="color" 
                            value={company.backgroundColor || '#ffffff'} 
                            onChange={e => setCompany({...company, backgroundColor: e.target.value})} 
                            className="absolute inset-0 w-full h-full opacity-0 cursor-pointer" 
                          />
                          <div className="p-2 bg-gray-100 dark:bg-white/10 rounded-lg text-blue-600 group-hover:bg-blue-50 transition-colors">
                              <Palette className="w-5 h-5" />
                          </div>
                      </div>
                  </div>
              </div>
          </div>

          <div className="border-t border-gray-200 dark:border-white/10"></div>

          {/* Watermark Section */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
              <div>
                  {/* Empty Left Col to align with above */}
              </div>
              <div className="md:col-span-2 bg-white dark:bg-black p-8 rounded-xl border border-gray-200 dark:border-white/10 shadow-sm">
                  <div className="flex justify-between items-center mb-6">
                      <h4 className="font-bold text-gray-900 dark:text-white">Marca de água</h4>
                      <div className="space-x-4 text-sm font-medium">
                          <button className="text-gray-900 dark:text-gray-400 hover:underline">Remover</button>
                          <button onClick={() => wmInputRef.current?.click()} className="text-blue-600 hover:underline">Actualizar</button>
                      </div>
                  </div>
                  
                  <div className="bg-gray-100 dark:bg-white/5 h-48 rounded-lg flex items-center justify-center border border-gray-200 dark:border-white/10 mb-6 relative overflow-hidden">
                      <button className="absolute top-4 left-4 bg-white dark:bg-black px-3 py-1.5 rounded-md text-xs font-bold text-gray-700 dark:text-white shadow-sm flex items-center gap-2 border border-gray-200 dark:border-white/20">
                          <Settings className="w-3 h-3" /> Definições
                      </button>
                      {company.logoUrl ? (
                          <img src={company.logoUrl} className="h-20 object-contain opacity-50" alt="Watermark Preview" />
                      ) : (
                          <span className="text-gray-400 text-sm">Pré-visualização</span>
                      )}
                  </div>
                  <input type="file" ref={wmInputRef} className="hidden" onChange={onWatermarkUpload} accept="image/*" />

                  <div className="flex items-center gap-3">
                      <input 
                        type="checkbox" 
                        checked={company.allowUserWatermark || false}
                        onChange={e => setCompany({...company, allowUserWatermark: e.target.checked})}
                        className="w-5 h-5 text-blue-600 rounded focus:ring-blue-500 border-gray-300 dark:border-white/30 dark:bg-black"
                      />
                      <label className="text-sm font-medium text-gray-900 dark:text-white">Permitir que os utilizadores adicionem a sua própria marca de água.</label>
                      <AlertCircle className="w-4 h-4 text-gray-400" />
                  </div>

                  <div className="flex justify-end pt-6">
                      <button onClick={onSave} className="bg-[#623aa2] text-white font-semibold px-6 py-2.5 rounded-lg text-sm hover:bg-[#502d85] transition-colors shadow-lg active:scale-95 transition-transform">
                          {isLoading ? 'A guardar...' : 'Guardar'}
                      </button>
                  </div>
              </div>
          </div>

          <div className="border-t border-gray-200 dark:border-white/10"></div>

          {/* Virtual Visits Section */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
              <div>
                  <h3 className="text-lg font-bold text-gray-900 dark:text-white">Visitas virtuais</h3>
                  <p className="text-sm text-gray-500 dark:text-gray-400 mt-2 leading-relaxed">As visitas virtuais permitem-lhe reservar consigo uma visita virtual guiada.</p>
              </div>
              <div className="md:col-span-2 bg-white dark:bg-black p-8 rounded-xl border border-gray-200 dark:border-white/10 shadow-sm">
                  <h4 className="font-bold text-gray-900 dark:text-white mb-6">Seleccione os dias em que está disponível para uma visita virtual guiada *</h4>
                  <div className="flex gap-4 flex-wrap">
                      {weekDays.map(day => {
                          return (
                              <button
                                key={day}
                                onClick={() => toggleDay(day)}
                                className={`w-14 h-14 rounded-lg text-sm font-medium border flex items-center justify-center transition-all ${
                                    isDaySelected(day)
                                    ? 'border-blue-600 text-blue-600 bg-blue-50 dark:bg-blue-900/20 font-bold shadow-sm' 
                                    : 'border-gray-200 dark:border-white/20 text-gray-500 hover:border-gray-300 dark:hover:border-white/40'
                                }`}
                              >
                                  {day}
                              </button>
                          );
                      })}
                  </div>
                  <p className="text-xs text-gray-500 mt-6 flex items-center gap-1.5">
                      <AlertCircle className="w-3.5 h-3.5" /> Desmarque todos se não quiser que as suas pistas exprimam as suas preferências.
                  </p>
                  
                  <div className="flex justify-end pt-6">
                      <button onClick={onSave} className="bg-[#623aa2] text-white font-semibold px-6 py-2.5 rounded-lg text-sm hover:bg-[#502d85] transition-colors shadow-lg active:scale-95 transition-transform">
                          {isLoading ? 'A guardar...' : 'Guardar'}
                      </button>
                  </div>
              </div>
          </div>
      </div>
    );
};
