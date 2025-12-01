import React, { useState } from 'react';
import { ArrowLeft, Mail, Phone, FileText, Briefcase, Lock } from 'lucide-react';
import { Button, Input } from './ui';

interface RegisterScreenProps {
  role: string;
  onSubmit: (data: any) => void;
  onBack: () => void;
}

export const RegisterScreen: React.FC<RegisterScreenProps> = ({ role, onSubmit, onBack }) => {
  const [formData, setFormData] = useState({
    firstName: '', lastName: '', email: '', phone: '', cpf: '', company: '', password: ''
  });

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit(formData);
  };

  return (
    <div className="min-h-screen bg-brand-gray-50 dark:bg-black flex flex-col font-sans p-6 transition-colors duration-300">
      <div className="max-w-md mx-auto w-full flex-1 flex flex-col justify-center py-8">
        
        <div className="mb-8 text-center animate-in slide-in-from-top-4 duration-500">
          {/* CORREÇÃO: Logo da Marca */}
          <div className="flex justify-center">
             <img 
                src="/brand/logo_color.png" 
                alt="Snap Immobile" 
                className="h-24 w-auto object-contain mb-6 dark:hidden" 
             />
             <img 
                src="/brand/logo_color.png" 
                alt="Snap Immobile" 
                className="h-24 w-auto object-contain mb-6 hidden dark:block brightness-0 invert" 
             />
          </div>

          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Crie a sua conta</h1>
          <p className="text-gray-500 dark:text-gray-400 mt-1">Preencha os seus dados para começar a usar o Snap Immobile</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4 animate-in fade-in duration-700">
          <div className="grid grid-cols-2 gap-4">
            <Input name="firstName" placeholder="Nome" value={formData.firstName} onChange={handleChange} required />
            <Input name="lastName" placeholder="Sobrenome" value={formData.lastName} onChange={handleChange} required />
          </div>

          <Input name="email" type="email" placeholder="E-Mail" icon={<Mail size={18}/>} value={formData.email} onChange={handleChange} required />
          <Input name="phone" type="tel" placeholder="Telefone" icon={<Phone size={18}/>} value={formData.phone} onChange={handleChange} required />
          <Input name="password" type="password" placeholder="Senha" icon={<Lock size={18}/>} value={formData.password} onChange={handleChange} required />
          
          <div className="grid grid-cols-2 gap-4">
             <Input name="cpf" placeholder="CPF" icon={<FileText size={18}/>} value={formData.cpf} onChange={handleChange} required />
             <Input name="company" placeholder="Empresa" icon={<Briefcase size={18}/>} value={formData.company} onChange={handleChange} />
          </div>

          <div className="pt-6">
            <Button type="submit" variant="primary" size="lg" fullWidth>
               CRIAR CONTA
            </Button>
          </div>
        </form>

        <button onClick={onBack} className="mt-6 w-full flex items-center justify-center text-gray-500 hover:text-gray-900 dark:hover:text-white gap-2 py-3 rounded-xl hover:bg-gray-100 dark:hover:bg-white/5 transition-colors font-medium">
           <ArrowLeft size={20} /> Voltar
        </button>

      </div>
    </div>
  );
};
