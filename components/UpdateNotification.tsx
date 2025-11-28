import React from 'react';
// @ts-ignore - Este módulo é virtual gerado pelo vite-plugin-pwa e só existe no build
import { useRegisterSW } from 'virtual:pwa-register/react';
import { RefreshCw, X } from 'lucide-react';

export const UpdateNotification = () => {
  const {
    needRefresh: [needRefresh, setNeedRefresh],
    updateServiceWorker,
  } = useRegisterSW({
    onRegistered(r: any) {
      console.log('SW Registado:', r);
    },
    onRegisterError(error: any) {
      console.log('Erro no registo do SW:', error);
    },
  });

  const close = () => {
    setNeedRefresh(false);
  };

  // Se não houver atualização pendente, não mostra nada
  if (!needRefresh) {
    return null;
  }

  return (
    <div className="fixed bottom-6 left-6 right-6 md:left-auto md:right-6 md:w-96 bg-gray-900 text-white p-4 rounded-lg shadow-2xl z-50 flex flex-col gap-3 animate-in slide-in-from-bottom-5 border border-gray-700">
      <div className="flex justify-between items-start">
        <div>
          <h3 className="font-bold text-base">Nova versão disponível</h3>
          <p className="text-sm text-gray-300 mt-1">
            Uma nova versão da aplicação está pronta. Atualize para carregar as alterações.
          </p>
        </div>
        <button onClick={close} className="text-gray-400 hover:text-white transition-colors">
          <X size={20} />
        </button>
      </div>
      
      <button
        onClick={() => updateServiceWorker(true)}
        className="w-full bg-blue-600 hover:bg-blue-500 text-white font-medium py-2 px-4 rounded-md transition-colors flex items-center justify-center gap-2 shadow-lg"
      >
        <RefreshCw size={16} />
        Atualizar Agora
      </button>
    </div>
  );
};
