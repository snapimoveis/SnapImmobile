
import React, { useRef } from 'react';
import { CompanySettings } from '../../types';
import { Upload, AlertCircle, Palette } from 'lucide-react';

interface Props {
    company: CompanySettings;
    setCompany: (c: CompanySettings) => void;
    onSave: () => void;
    isLoading: boolean;
    onLogoUpload: (e: React.ChangeEvent<HTMLInputElement>) => void;
}

export const GeneralTab: React.FC<Props> = ({ company, setCompany, onSave, isLoading, onLogoUpload }) => {
    const logoInputRef = useRef<HTMLInputElement>(null);

    return (
      <div className="max-w-4xl space-y-8 py-8 animate-in fade-in">
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
                      <button onClick={onSave} className="bg-blue-400/20 text-blue-600 font-medium px-4 py-2 rounded-lg text-sm hover:bg-blue-400/30 transition-colors">
                          {isLoading ? 'A guardar...' : 'Guardar'}
                      </button>
                  </div>
              </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
              <div>
                  <h3 className="text-lg font-bold text-gray-900">Logotipo e cores</h3>
                  <p className="text-sm text-gray-500 mt-2">Personalize a sua marca visual.</p>
              </div>
              <div className="md:col-span-2 space-y-6">
                  <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm">
                      <div className="flex justify-between mb-4">
                          <h4 className="font-medium text-gray-900">Logótipo</h4>
                          <div className="space-x-4 text-sm">
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
                      <input type="file" ref={logoInputRef} className="hidden" onChange={onLogoUpload} accept="image/*" />
                  </div>

                  <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm space-y-6">
                      <h4 className="font-medium text-gray-900">Cor</h4>
                      <div className="flex items-center justify-between p-4 border border-gray-100 rounded-lg">
                          <div className="flex items-center gap-4">
                              <div className="w-10 h-10 rounded-full shadow-inner" style={{ backgroundColor: company.primaryColor }}></div>
                              <div>
                                  <p className="font-medium text-sm text-gray-900">Cor principal</p>
                              </div>
                          </div>
                          <input type="color" value={company.primaryColor} onChange={e => setCompany({...company, primaryColor: e.target.value})} className="w-8 h-8 opacity-0 absolute cursor-pointer" />
                          <div className="p-2 bg-gray-100 rounded hover:bg-gray-200 cursor-pointer"><Palette className="w-4 h-4 text-gray-600" /></div>
                      </div>
                  </div>
              </div>
          </div>
      </div>
    );
};
