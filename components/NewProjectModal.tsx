import React, { useState } from 'react';
import { X, Home, MapPin, Ruler, Bed, Bath } from 'lucide-react';
import { ProjectDetails } from '../types';
import { Button, Input } from './ui';

interface NewProjectModalProps {
  onClose: () => void;
  onCreate: (data: ProjectDetails & { title: string; address: string }) => void;
}

export const NewProjectModal: React.FC<NewProjectModalProps> = ({ onClose, onCreate }) => {
  const [formData, setFormData] = useState({
    title: '',
    address: '',
    area: '',
    rooms: '',
    bathrooms: '',
    price: '',
    description: ''
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    // CORREÇÃO: Função auxiliar para evitar o erro "NaN" (Not a Number) que bloqueia o Firebase
    const safeNumber = (value: string) => {
        const num = parseFloat(value);
        return isNaN(num) ? 0 : num;
    };

    onCreate({
      title: formData.title || 'Sem nome',
      address: formData.address || 'Sem endereço',
      area: safeNumber(formData.area),
      rooms: safeNumber(formData.rooms),
      bathrooms: safeNumber(formData.bathrooms),
      price: safeNumber(formData.price),
      description: formData.description || ''
    });
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-in fade-in duration-200">
      <div className="bg-white dark:bg-[#1a1a1a] w-full max-w-lg rounded-3xl shadow-2xl overflow-hidden animate-in zoom-in-95 duration-200">
        
        <div className="bg-brand-purple p-6 relative overflow-hidden">
            <div className="absolute top-0 right-0 p-4 opacity-10 pointer-events-none">
                <Home size={120} />
            </div>
            <div className="relative z-10">
                <h2 className="text-2xl font-bold text-white">Criar um novo imóvel</h2>
                <p className="text-purple-200 text-sm mt-1">Preencha os dados para começar a capturar.</p>
            </div>
            <button 
                onClick={onClose}
                className="absolute top-4 right-4 p-2 bg-white/10 hover:bg-white/20 text-white rounded-full transition-colors"
            >
                <X size={20} />
            </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-5">
          
          <div className="space-y-4">
              <h3 className="text-sm font-bold text-brand-purple dark:text-white uppercase tracking-wider text-xs">Detalhes do imóvel</h3>
              
              <Input 
                  name="title" 
                  label="Nome do Imóvel" 
                  placeholder="Ex: Apartamento T3 Centro" 
                  value={formData.title} 
                  onChange={handleChange} 
                  required 
              />
              
              <Input 
                  name="address" 
                  label="Localização" 
                  placeholder="Endereço completo" 
                  icon={<MapPin size={18} />}
                  value={formData.address} 
                  onChange={handleChange} 
                  required 
              />
          </div>

          <div className="grid grid-cols-2 gap-4">
              <Input 
                  name="area" 
                  label="Área (m²)" 
                  type="number" 
                  placeholder="0" 
                  icon={<Ruler size={18} />}
                  value={formData.area} 
                  onChange={handleChange} 
              />
              <Input 
                  name="price" 
                  label="Preço (€)" 
                  type="number" 
                  placeholder="0.00" 
                  value={formData.price} 
                  onChange={handleChange} 
              />
          </div>

          <div className="grid grid-cols-2 gap-4">
              <Input 
                  name="rooms" 
                  label="Quartos" 
                  type="number" 
                  placeholder="0" 
                  icon={<Bed size={18} />}
                  value={formData.rooms} 
                  onChange={handleChange} 
              />
              <Input 
                  name="bathrooms" 
                  label="Banheiros" 
                  type="number" 
                  placeholder="0" 
                  icon={<Bath size={18} />}
                  value={formData.bathrooms} 
                  onChange={handleChange} 
              />
          </div>

          <div className="pt-4">
            <Button type="submit" variant="secondary" size="lg" fullWidth>
                Guardar Imóvel
            </Button>
          </div>

        </form>
      </div>
    </div>
  );
};
