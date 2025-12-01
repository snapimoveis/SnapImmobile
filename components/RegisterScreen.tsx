import React, { useState } from 'react';
import { ArrowLeft, User, Mail, Phone, FileText, Briefcase, Lock } from 'lucide-react';
import { Button, Input } from './ui';

interface RegisterScreenProps {
  role: string;
  onSubmit: (data: any) => void;
  onBack: () => void;
}

export const RegisterScreen: React.FC<RegisterScreenProps> = ({ role, onSubmit, onBack }) => {
  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    email: '',
    phone: '',
    cpf: '',
    company: '',
    password: ''
  });

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit(formData);
  };

  return (
    <div className="min-h-screen bg-brand-gray-50 dark:bg-black flex flex-col font-sans p-6">
      <div className="max-w-md mx-auto w-full flex-1 flex flex-col justify-center">
        
        <div className="mb-8 text-center">
          <div className="inline-block p-4 bg-brand-purple/10 rounded-full mb-4">
             <User size={32} className="text-brand-purple" />
          </div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Crie a sua conta</h1>
          <p className="text-gray-500 dark:text-gray-400 mt-1">Preencha os seus dados para começar</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <Input name="firstName" placeholder="Nome" value={formData.firstName} onChange={handleChange} required />
            <Input name="lastName" placeholder="Sobrenome" value={formData.lastName} onChange={handleChange} required />
          </div>

          <Input name="email" type="email" placeholder="E-Mail" icon={<Mail size={18}/>} value={formData.email} onChange={handleChange} required />
          <Input name="phone" type="tel" placeholder="Telefone" icon={<Phone size={18}/>} value={formData.phone} onChange={handleChange} required />
          <Input name="cpf" placeholder="CPF" icon={<FileText size={18}/>} value={formData.cpf} onChange={handleChange} required />
          <Input name="company" placeholder="Empresa" icon={<Briefcase size={18}/>} value={formData.company} onChange={handleChange} />
          <Input name="password" type="password" placeholder="Senha" icon={<Lock size={18}/>} value={formData.password} onChange={handleChange} required />

          <div className="pt-6">
            <Button type="submit" variant="primary" size="lg" fullWidth>
               CRIAR CONTA
            </Button>
          </div>
        </form>

        <button onClick={onBack} className="mt-6 flex items-center justify-center text-gray-500 hover:text-gray-900 dark:hover:text-white gap-2 py-2">
           <ArrowLeft size={20} /> Voltar
        </button>

      </div>
    </div>
  );
};
