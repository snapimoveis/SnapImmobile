import React, { useState, useEffect } from 'react';
import { ArrowLeft, Mail, Lock } from 'lucide-react';
import { Button, Input } from './ui';

interface LoginScreenProps {
  onLogin: (email: string, password?: string) => void;
  onBack: () => void;
  onRegisterClick: () => void;
  initialEmail?: string;
}

export const LoginScreen: React.FC<LoginScreenProps> = ({ onLogin, onBack, onRegisterClick, initialEmail = '' }) => {
  const [email, setEmail] = useState(initialEmail);
  const [password, setPassword] = useState('');

  useEffect(() => {
    if (initialEmail) setEmail(initialEmail);
  }, [initialEmail]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (email) onLogin(email.trim(), password);
  };

  return (
    <div className="min-h-screen bg-brand-gray-50 dark:bg-brand-dark flex flex-col font-sans justify-center p-6 transition-colors duration-300">
      <div className="flex-1 flex flex-col justify-center max-w-md mx-auto w-full">
        
        <div className="flex flex-col items-center mb-10 animate-in slide-in-from-bottom-4 duration-500">
          <div className="w-24 h-24 bg-brand-purple rounded-[2rem] flex items-center justify-center mb-6 shadow-xl shadow-brand-purple/30 transform rotate-3 hover:rotate-0 transition-transform duration-300">
             <span className="text-white font-bold text-4xl tracking-tighter">S</span>
          </div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2 text-center">Bem-vindo de volta!</h1>
          <p className="text-gray-500 dark:text-gray-400 text-center">Entre na sua conta para continuar a gerir os seus imóveis.</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6 animate-in fade-in duration-700">
             <Input 
                type="email" 
                placeholder="E-Mail" 
                value={email} 
                onChange={(e) => setEmail(e.target.value)}
                icon={<Mail size={20} />}
                required
             />
             
             <div>
               <Input 
                  type="password" 
                  placeholder="Senha" 
                  value={password} 
                  onChange={(e) => setPassword(e.target.value)}
                  icon={<Lock size={20} />}
                  required
               />
               <div className="flex justify-end mt-2">
                  <button type="button" className="text-sm text-brand-purple font-bold hover:underline">
                      Esqueceu a senha?
                  </button>
               </div>
             </div>

             <div className="pt-4">
                <Button type="submit" variant="secondary" size="lg" fullWidth>
                    ENTRAR
                </Button>
             </div>
        </form>

        <div className="mt-8 text-center">
            <p className="text-gray-600 dark:text-gray-400 text-sm">
                Não tem conta?{' '}
                <button type="button" onClick={onRegisterClick} className="text-brand-orange font-bold hover:underline ml-1">
                    Registe-se
                </button>
            </p>
        </div>

        <div className="mt-auto pt-10 flex justify-center">
            <button onClick={onBack} className="text-gray-400 hover:text-gray-600 dark:hover:text-white transition-colors flex items-center gap-2 text-sm font-medium">
                <ArrowLeft size={18} /> Voltar ao início
            </button>
        </div>
      </div>
    </div>
  );
};
