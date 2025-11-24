
import React, { useState } from 'react';
import { Logo } from './Logo';
import { ArrowLeft, RefreshCw, Mail, Lock } from 'lucide-react';

interface LoginScreenProps {
  onLogin: (email: string, password?: string) => void;
  onBack: () => void;
  onRegisterClick: () => void;
}

export const LoginScreen: React.FC<LoginScreenProps> = ({ onLogin, onBack, onRegisterClick }) => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (email) {
        onLogin(email.trim(), password);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col font-sans">
      <div className="flex-1 max-w-md mx-auto w-full p-6 flex flex-col">
        
        {/* Header Logo */}
        <div className="flex justify-center mt-8 mb-10 relative">
          <Logo className="w-28 h-28" />
           <div className="absolute right-0 top-1/2 -translate-y-1/2 text-purple-700 opacity-80">
             <RefreshCw className="w-7 h-7" />
          </div>
        </div>

        <div className="mb-8">
          <h1 className="text-2xl font-bold text-gray-900 mb-1">Bem-vindo de volta!</h1>
          <p className="text-gray-600 text-sm">Entre na sua conta para continuar</p>
        </div>

        <form id="loginForm" onSubmit={handleSubmit} className="space-y-4 flex-1">
             <div className="relative">
                <div className="absolute inset-y-0 left-4 flex items-center pointer-events-none text-gray-500">
                    <Mail size={20} />
                </div>
                <input 
                    type="email" 
                    placeholder="E-Mail"
                    required
                    className="w-full pl-12 pr-4 py-4 bg-gray-200/70 rounded-xl text-gray-800 placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-purple-500 transition-all"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                />
             </div>
             
             <div className="relative">
                <div className="absolute inset-y-0 left-4 flex items-center pointer-events-none text-gray-500">
                    <Lock size={20} />
                </div>
                <input 
                    type="password" 
                    placeholder="Senha"
                    required
                    className="w-full pl-12 pr-4 py-4 bg-gray-200/70 rounded-xl text-gray-800 placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-purple-500 transition-all"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                />
             </div>

             <div className="text-right">
                 <button type="button" className="text-sm text-purple-700 font-medium hover:underline">
                     Esqueceu a senha?
                 </button>
             </div>
        </form>

        <div className="mt-auto">
            <div className="flex justify-between items-center mb-6">
            <button 
                type="button"
                onClick={onBack}
                className="p-2 text-gray-400 hover:text-gray-600 transition-colors"
            >
                <ArrowLeft className="w-8 h-8" />
            </button>

            <button
                type="submit"
                form="loginForm"
                className="px-10 py-3 rounded-full font-bold text-sm tracking-wide bg-purple-700 text-white hover:bg-purple-800 shadow-lg shadow-purple-700/30 transition-all"
            >
                ENTRAR
            </button>
            </div>

            <div className="text-center pt-6 border-t border-gray-200">
                <p className="text-gray-600 text-sm">
                    Não tem conta?{' '}
                    <button type="button" onClick={onRegisterClick} className="text-orange-600 font-bold hover:underline">
                        Registe-se
                    </button>
                </p>
            </div>
        </div>

      </div>
    </div>
  );
};
