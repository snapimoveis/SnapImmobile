
import React from 'react';
import { X, CheckCircle, UserX, MessageCircle } from 'lucide-react';

interface TermsModalProps {
  onClose: () => void;
}

export const TermsModal: React.FC<TermsModalProps> = ({ onClose }) => {
  const handleAgree = () => {
      // Logic to record agreement could go here
      onClose();
  };

  const handleCloseAccount = () => {
      if(confirm("Deseja realmente iniciar o processo de encerramento de conta?")) {
          alert("Solicitação enviada. A equipa entrará em contacto.");
          onClose();
      }
  };

  const handleSupport = () => {
      alert("A abrir chat de suporte...");
      // Logic to open chat
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl flex flex-col max-h-[90vh] animate-in fade-in zoom-in duration-200">
        
        {/* Header */}
        <div className="px-6 py-4 border-b border-gray-100 flex justify-between items-center bg-gray-50 rounded-t-2xl">
          <h2 className="text-lg font-bold text-gray-900">Termos de Uso</h2>
          <button onClick={onClose} className="p-2 rounded-full hover:bg-gray-200 text-gray-500 transition-colors">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6 text-sm text-gray-700 leading-relaxed space-y-4 text-justify">
            <h3 className="font-bold text-base text-gray-900">Introdução</h3>
            <p>Este Termo de Uso estabelece as condições gerais para o uso do aplicativo SNAP IMMOBILE TECNOLOGIA, um serviço online e aplicativo móvel para fotografia de imóveis que usa tecnologia HDR e que visa otimizar o tempo e a qualidade fotográfica para publicação de imóveis. Ao utilizar o Aplicativo, você concorda em cumprir os termos e condições aqui estabelecidos.</p>

            <h3 className="font-bold text-base text-gray-900">Definições</h3>
            <ul className="list-disc pl-5 space-y-1">
                <li><strong>Aplicativo:</strong> SNAP IMMOBILE TECNOLOGIA, a plataforma online e aplicativo móvel para fotografia de imóveis que usa tecnologia HDR.</li>
                <li><strong>Usuário:</strong> Qualquer pessoa física ou jurídica que se cadastre e utilize o Aplicativo.</li>
                <li><strong>Conteúdo:</strong> Todo material, fotos, vídeos, dados e informações compartilhados.</li>
                <li><strong>Assinatura:</strong> Plano de pagamento mensal.</li>
            </ul>

            <h3 className="font-bold text-base text-gray-900">Uso do Aplicativo</h3>
            <p><strong>3.1 Cadastro:</strong> Necessário fornecer informações precisas e completas.</p>
            <p><strong>3.2 Assinatura:</strong> Condicionado à assinatura de um plano.</p>
            <p><strong>3.3 Pagamento:</strong> Mensal, conforme condições escolhidas.</p>
            <p><strong>3.4 Suspensão e Rescisão:</strong> Suspensão após 8 dias de atraso. Rescisão após 30 dias de suspensão.</p>

            <h3 className="font-bold text-base text-gray-900">Propriedade Intelectual</h3>
            <p>Todos os direitos são de propriedade exclusiva do SNAP IMMOBILE TECNOLOGIA.</p>

            <h3 className="font-bold text-base text-gray-900">Responsabilidade do Usuário</h3>
            <p>O Usuário é responsável por manter a confidencialidade dos dados e usar o App de forma ética.</p>

            <h3 className="font-bold text-base text-gray-900">Limitação de Responsabilidade</h3>
            <p>Não nos responsabilizamos por falhas na internet ou perda de dados do usuário.</p>

            <h3 className="font-bold text-base text-gray-900">Reembolso</h3>
            <p>O SNAP IMMOBILE TECNOLOGIA não se responsabiliza por qualquer reembolso de assinatura, uma vez que, após o primeiro cadastro, o usuário terá acesso gratuitamente ao uso do app com armazenamento de 30 fotos antes de decidir realizar a assinatura do mesmo. O download das fotos será gratuito e ficará disponível pelo período de 5 dias.</p>

            <h3 className="font-bold text-base text-gray-900">Lei Aplicável e Foro</h3>
            <p>Regido pelas leis do Brasil. Foro da Comarca de Paulista.</p>

            <h3 className="font-bold text-base text-gray-900">Contato</h3>
            <p>E-mail: dados@snapimmoble.app</p>
        </div>

        {/* Footer Actions */}
        <div className="p-6 border-t border-gray-100 bg-gray-50 rounded-b-2xl flex flex-col gap-4">
            <div className="flex items-center gap-2 text-xs text-gray-500 mb-2">
                <input type="checkbox" checked readOnly className="rounded text-blue-600" />
                <span>Declaro que li, compreendi e aceito todos os termos e condições deste Termo de Uso.</span>
            </div>
            
            <div className="flex flex-wrap gap-3 justify-between">
                <button 
                    onClick={handleCloseAccount}
                    className="flex items-center gap-2 px-4 py-2 border border-red-200 text-red-600 rounded-lg hover:bg-red-50 text-sm font-medium transition-colors"
                >
                    <UserX className="w-4 h-4" /> Encerrar Conta
                </button>

                <div className="flex gap-3">
                    <button 
                        onClick={handleSupport}
                        className="flex items-center gap-2 px-4 py-2 bg-white border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 text-sm font-medium transition-colors"
                    >
                        <MessageCircle className="w-4 h-4" /> Suporte Técnico
                    </button>
                    <button 
                        onClick={handleAgree}
                        className="flex items-center gap-2 px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 text-sm font-bold shadow-md transition-colors"
                    >
                        <CheckCircle className="w-4 h-4" /> Concordo
                    </button>
                </div>
            </div>
        </div>

      </div>
    </div>
  );
};
