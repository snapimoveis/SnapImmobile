import React, { useState } from 'react';
import { X, Home, MapPin, BedDouble, Bath, Ruler, DollarSign, Building } from 'lucide-react';
import { ProjectDetails } from '../types';

interface NewProjectModalProps {
  onClose: () => void;
  onCreate: (details: ProjectDetails & { title: string, address: string }) => void;
}

export const NewProjectModal: React.FC<NewProjectModalProps> = ({ onClose, onCreate }) => {
  const [formData, setFormData] = useState({
    title: '',
    address: '',
    type: 'Apartment' as const,
    bedrooms: 2,
    bathrooms: 2,
    area: 100,
    price: 0
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onCreate(formData);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg overflow-hidden animate-in fade-in zoom-in duration-200">
        
        {/* Header */}
        <div className="bg-gray-50 px-6 py-4 border-b border-gray-100 flex justify-between items-center">
          <div>
            <h2 className="text-xl font-bold text-gray-900">Novo Imóvel</h2>
            <p className="text-sm text-gray-500">Introduza os detalhes do imóvel</p>
          </div>
          <button onClick={onClose} className="p-2 rounded-full hover:bg-gray-200 text-gray-500 transition-colors">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-6 space-y-5 max-h-[80vh] overflow-y-auto">
            
            {/* Basic Info */}
            <div className="space-y-4">
                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Título do Imóvel</label>
                    <div className="relative">
                        <div className="absolute inset-y-0 left-3 flex items-center pointer-events-none">
                            <Home className="w-4 h-4 text-gray-400" />
                        </div>
                        <input 
                            type="text" 
                            required
                            className="w-full pl-10 pr-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all"
                            placeholder="ex: Apartamento 3/4 em Boa Viagem"
                            value={formData.title}
                            onChange={e => setFormData({...formData, title: e.target.value})}
                        />
                    </div>
                </div>
                
                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Morada Completa</label>
                    <div className="relative">
                        <div className="absolute inset-y-0 left-3 flex items-center pointer-events-none">
                            <MapPin className="w-4 h-4 text-gray-400" />
                        </div>
                        <input 
                            type="text" 
                            required
                            className="w-full pl-10 pr-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all"
                            placeholder="ex: Rua das Flores 123, Lisboa"
                            value={formData.address}
                            onChange={e => setFormData({...formData, address: e.target.value})}
                        />
                    </div>
                </div>
            </div>

            <div className="border-t border-gray-100 pt-4">
                <label className="block text-sm font-medium text-gray-700 mb-3">Especificações</label>
                <div className="grid grid-cols-2 gap-4">
                     <div>
                        <label className="text-xs text-gray-500 mb-1 block">Tipo</label>
                        <div className="relative">
                            <div className="absolute inset-y-0 left-3 flex items-center pointer-events-none">
                                <Building className="w-4 h-4 text-gray-400" />
                            </div>
                            <select 
                                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none bg-white"
                                value={formData.type}
                                onChange={e => setFormData({...formData, type: e.target.value as any})}
                            >
                                <option value="Apartment">Apartamento</option>
                                <option value="House">Moradia</option>
                                <option value="Commercial">Comercial</option>
                                <option value="Land">Terreno</option>
                            </select>
                        </div>
                    </div>
                    <div>
                        <label className="text-xs text-gray-500 mb-1 block">Preço</label>
                        <div className="relative">
                            <div className="absolute inset-y-0 left-3 flex items-center pointer-events-none">
                                <DollarSign className="w-4 h-4 text-gray-400" />
                            </div>
                            <input 
                                type="number" 
                                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                                placeholder="0"
                                value={formData.price || ''}
                                onChange={e => setFormData({...formData, price: Number(e.target.value)})}
                            />
                        </div>
                    </div>
                </div>

                <div className="grid grid-cols-3 gap-4 mt-4">
                    <div>
                        <label className="text-xs text-gray-500 mb-1 block">Quartos</label>
                        <div className="relative">
                            <div className="absolute inset-y-0 left-2 flex items-center pointer-events-none">
                                <BedDouble className="w-3.5 h-3.5 text-gray-400" />
                            </div>
                            <input 
                                type="number" 
                                className="w-full pl-8 pr-2 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none text-sm"
                                value={formData.bedrooms}
                                onChange={e => setFormData({...formData, bedrooms: Number(e.target.value)})}
                            />
                        </div>
                    </div>
                    <div>
                        <label className="text-xs text-gray-500 mb-1 block">Casas de Banho</label>
                        <div className="relative">
                            <div className="absolute inset-y-0 left-2 flex items-center pointer-events-none">
                                <Bath className="w-3.5 h-3.5 text-gray-400" />
                            </div>
                            <input 
                                type="number" 
                                className="w-full pl-8 pr-2 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none text-sm"
                                value={formData.bathrooms}
                                onChange={e => setFormData({...formData, bathrooms: Number(e.target.value)})}
                            />
                        </div>
                    </div>
                    <div>
                        <label className="text-xs text-gray-500 mb-1 block">Área (m²)</label>
                        <div className="relative">
                            <div className="absolute inset-y-0 left-2 flex items-center pointer-events-none">
                                <Ruler className="w-3.5 h-3.5 text-gray-400" />
                            </div>
                            <input 
                                type="number" 
                                className="w-full pl-8 pr-2 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none text-sm"
                                value={formData.area}
                                onChange={e => setFormData({...formData, area: Number(e.target.value)})}
                            />
                        </div>
                    </div>
                </div>
            </div>
        </form>

        {/* Footer */}
        <div className="p-6 border-t border-gray-100 bg-gray-50 flex justify-end gap-3">
            <button 
                onClick={onClose}
                className="px-5 py-2.5 text-gray-600 font-medium hover:bg-gray-200 rounded-lg transition-colors"
            >
                Cancelar
            </button>
            <button 
                onClick={handleSubmit}
                className="px-6 py-2.5 bg-orange-600 text-white font-medium rounded-lg hover:bg-orange-700 shadow-lg shadow-orange-600/20 transition-all transform active:scale-95"
            >
                Criar Imóvel
            </button>
        </div>
      </div>
    </div>
  );
};