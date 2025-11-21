
import React, { useState } from 'react';
import { Logo } from './Logo';
import { ArrowLeft, RefreshCw } from 'lucide-react';

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
    password: '',
    phone: '',
    cpf: '',
    company: ''
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit(formData);
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col font-sans">
      <div className="flex-1 max-w-md mx-auto w-full p-6 flex flex-col">
        
        {/* Header Logo */}
        <div className="flex justify-center mt-4 mb-8 relative">
          <Logo className="w-24 h-24" />
           <div className="absolute right-0 top-1/2 -translate-y-1/2 text-purple-700 opacity-80">
             <RefreshCw className="w-6 h-6" />
          </div>
        </div>

        <div className="mb-6">
          <h1 className="text-2xl font-bold text-gray-900 mb-1">Crie a sua conta</h1>
          <p className="text-gray-600 text-sm">Preencha os seus dados</p>
        </div>

        <form id="registerForm" onSubmit={handleSubmit} className="space-y-3 flex-1">
            {/* Name and Surname on the same line */}
            <div className="flex gap-3">
                <input 
                    type="text" 
                    name="firstName"
                    placeholder="Nome"
                    required
                    className="w-full p-4 bg-gray-200/70 rounded-xl text-gray-800 placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-purple-500 transition-all"
                    value={formData.firstName}
                    onChange={handleChange}
                />
                 <input 
                    type="text" 
                    name="lastName"
                    placeholder="Sobre Nome"
                    required
                    className="w-full p-4 bg-gray-200/70 rounded-xl text-gray-800 placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-purple-500 transition-all"
                    value={formData.lastName}
                    onChange={handleChange}
                />
            </div>

             <input 
                type="email" 
                name="email"
                placeholder="E-Mail"
                required
                className="w-full p-4 bg-gray-200/70 rounded-xl text-gray-800 placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-purple-500 transition-all"
                value={formData.email}
                onChange={handleChange}
            />

            <input 
                type="password" 
                name="password"
                placeholder="Crie sua Senha"
                required
                className="w-full p-4 bg-gray-200/70 rounded-xl text-gray-800 placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-purple-500 transition-all"
                value={formData.password}
                onChange={handleChange}
            />

             <input 
                type="tel" 
                name="phone"
                placeholder="Telefone"
                className="w-full p-4 bg-gray-200/70 rounded-xl text-gray-800 placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-purple-500 transition-all"
                value={formData.phone}
                onChange={handleChange}
            />
             <input 
                type="text" 
                name="cpf"
                placeholder="CPF"
                className="w-full p-4 bg-gray-200/70 rounded-xl text-gray-800 placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-purple-500 transition-all"
                value={formData.cpf}
                onChange={handleChange}
            />
             <input 
                type="text" 
                name="company"
                placeholder="Empresa"
                className="w-full p-4 bg-gray-200/70 rounded-xl text-gray-800 placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-purple-500 transition-all"
                value={formData.company}
                onChange={handleChange}
            />
        </form>

        <div className="flex justify-between items-center mt-6 pb-4">
          <button 
            type="button"
            onClick={onBack}
            className="p-2 text-gray-400 hover:text-gray-600 transition-colors"
          >
            <ArrowLeft className="w-8 h-8" />
          </button>

          <button
            type="submit"
            form="registerForm"
            className="px-8 py-3 rounded-full font-bold text-sm tracking-wide bg-gray-200 text-gray-900 hover:bg-gray-300 shadow-md transition-all"
          >
            CRIAR CONTA
          </button>
        </div>

      </div>
    </div>
  );
};
