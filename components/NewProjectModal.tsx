import React, { useState } from 'react';
import { X, Home, MapPin, Locate } from 'lucide-react';
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
    description: ''
  });
  const [isLoadingGeo, setIsLoadingGeo] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onCreate({
      title: formData.title || 'Sem nome',
      address: formData.address || 'Sem endereço',
      // Campos removidos enviados como 0 ou vazio para compatibilidade
      area: 0,
      rooms: 0,
      bathrooms: 0,
      price: 0,
      description: formData.description
    });
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleGetLocation = () => {
    if (!navigator.geolocation) {
      alert('Geolocalização não é suportada pelo seu navegador.');
      return;
    }

    setIsLoadingGeo(true);
    navigator.geolocation.getCurrentPosition(
      async (position) => {
        const { latitude, longitude } = position.coords;
        try {
          // Usando OpenStreetMap (Nominatim) para geocodificação reversa gratuita
          const response = await fetch(`https://nominatim.openstreetmap.org/reverse?format=json&lat=${latitude}&lon=${longitude}`);
          const data = await response.json();
          
          if (data && data.display_name) {
            // Tenta formatar o endereço de forma mais limpa
            const addr = data.address;
            const street = addr.road || addr.pedestrian || '';
            const number = addr.house_number || '';
            const city = addr.city || addr.town || addr.village || '';
            const formattedAddress = `${street} ${number}, ${city}`.trim().replace(/^, /, '');
            
            setFormData(prev => ({ ...prev, address: formattedAddress || data.display_name }));
          } else {
             setFormData(prev => ({ ...prev, address: `${latitude}, ${longitude}` }));
          }
        } catch (error) {
          console.error("Erro ao obter endereço:", error);
          setFormData(prev => ({ ...prev, address: `${latitude}, ${longitude}` }));
        } finally {
          setIsLoadingGeo(false);
        }
      },
      (error) => {
        console.error("Erro de geolocalização:", error);
        alert('Não foi possível obter a sua localização. Verifique as permissões.');
        setIsLoadingGeo(false);
      }
    );
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-in fade-in duration-200">
      <div className="bg-white dark:bg-[#1a1a1a] w-full max-w-md rounded-3xl shadow-2xl overflow-hidden animate-in zoom-in-95 duration-200">
        
        {/* Cabeçalho Roxo */}
        <div className="bg-brand-purple p-6 relative overflow-hidden">
            <div className="absolute top-0 right-0 p-4 opacity-10 pointer-events-none">
                <Home size={120} />
            </div>
            <div className="relative z-10">
                <h2 className="text-2xl font-bold text-white">Novo Imóvel</h2>
                <p className="text-purple-200 text-sm mt-1">Comece a capturar agora.</p>
            </div>
            <button 
                onClick={onClose}
                className="absolute top-4 right-4 p-2 bg-white/10 hover:bg-white/20 text-white rounded-full transition-colors"
            >
                <X size={20} />
            </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          
          <div className="space-y-5">
              <Input 
                  name="title" 
                  label="Nome do Imóvel" 
                  placeholder="Ex: Apartamento T3 Centro" 
                  value={formData.title} 
                  onChange={handleChange} 
                  required 
                  autoFocus
              />
              
              <div className="relative">
                  <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 ml-1 mb-1.5">Localização</label>
                  <div className="flex gap-2">
                    <div className="relative flex-1">
                        <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-gray-400">
                            <MapPin size={18} />
                        </div>
                        <input
                            name="address"
                            value={formData.address}
                            onChange={handleChange}
                            placeholder="Endereço ou coordenadas"
                            className="w-full bg-brand-gray-100 dark:bg-[#1e1e1e] border-2 border-transparent focus:border-brand-purple focus:bg-white dark:focus:bg-black text-gray-900 dark:text-white placeholder-gray-400 rounded-xl pl-12 pr-4 py-3.5 outline-none transition-all font-medium"
                            required
                        />
                    </div>
                    <button
                        type="button"
                        onClick={handleGetLocation}
                        disabled={isLoadingGeo}
                        className="bg-brand-gray-100 dark:bg-[#1e1e1e] hover:bg-brand-purple/10 hover:text-brand-purple text-gray-500 p-3.5 rounded-xl transition-colors border-2 border-transparent focus:border-brand-purple outline-none"
                        title="Usar localização atual"
                    >
                        {isLoadingGeo ? (
                            <div className="w-5 h-5 border-2 border-current border-t-transparent rounded-full animate-spin" />
                        ) : (
                            <Locate size={20} />
                        )}
                    </button>
                  </div>
                  <p className="text-xs text-gray-400 mt-1.5 ml-1">Toque no ícone para usar sua localização atual.</p>
              </div>
          </div>

          <div className="pt-4">
            <Button type="submit" variant="secondary" size="lg" fullWidth>
                Criar e Capturar
            </Button>
          </div>

        </form>
      </div>
    </div>
  );
};
