
import React from 'react';
import { X } from 'lucide-react';

interface PrivacyModalProps {
  onClose: () => void;
}

export const PrivacyModal: React.FC<PrivacyModalProps> = ({ onClose }) => {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-3xl flex flex-col max-h-[90vh] animate-in fade-in zoom-in duration-200">
        
        {/* Header */}
        <div className="px-6 py-4 border-b border-gray-100 flex justify-between items-center bg-gray-50 rounded-t-2xl">
          <h2 className="text-lg font-bold text-gray-900">Política de Privacidade</h2>
          <button onClick={onClose} className="p-2 rounded-full hover:bg-gray-200 text-gray-500 transition-colors">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-8 text-sm text-gray-700 leading-relaxed space-y-6 text-justify">
            
            <section>
                <h3 className="font-bold text-gray-900 mb-2">SEÇÃO 1 – INFORMAÇÕES GERAIS</h3>
                <p>A presente Política de Privacidade contém informações sobre coleta, uso, armazenamento, tratamento e proteção dos dados pessoais dos usuários e visitantes do aplicativo Snap Immobile Tecnologia e site www.snapimmobile.app, com a finalidade de demonstrar absoluta transparência quanto ao assunto.</p>
                <p className="mt-2">O presente documento foi elaborado em conformidade com a Lei Geral de Proteção de Dados Pessoais (Lei 13.709/18). Esta Política de Privacidade foi atualizada pela última vez em 08/08/2024.</p>
            </section>

            <section>
                <h3 className="font-bold text-gray-900 mb-2">SEÇÃO 2 – COMO RECOLHEMOS OS DADOS PESSOAIS?</h3>
                <p>Os dados pessoais são recolhidos quando o usuário cria uma conta (e-mail, nome, CPF, cidade) e quando navega na plataforma (cookies, IP, interação).</p>
            </section>

            <section>
                <h3 className="font-bold text-gray-900 mb-2">SEÇÃO 3 – QUAIS DADOS RECOLHEMOS?</h3>
                <ul className="list-disc pl-5 mt-1 space-y-1">
                    <li>Dados de criação de conta: e-mail, nome, CPF, telefone.</li>
                    <li>Dados de navegação: acesso a páginas, IP.</li>
                    <li>Dados de transações: informações de pagamento.</li>
                </ul>
                <p className="mt-2"><strong>Dados sensíveis:</strong> A plataforma não coletará dados sensíveis como origem racial, opinião política ou saúde.</p>
            </section>

            <section>
                <h3 className="font-bold text-gray-900 mb-2">SEÇÃO 4 – FINALIDADES</h3>
                <p>Utilizamos os dados para melhorar o serviço, segurança jurídica, comercial e melhoria da plataforma.</p>
            </section>

            <section>
                <h3 className="font-bold text-gray-900 mb-2">SEÇÃO 5 – SEGURANÇA</h3>
                <p>A Snap Immobile Tecnologia compromete-se a aplicar as medidas técnicas aptas a proteger os dados pessoais. Dados de pagamento são criptografados (SSL).</p>
            </section>

            <section>
                <h3 className="font-bold text-gray-900 mb-2">SEÇÃO 6 – COMPARTILHAMENTO</h3>
                <p>Os dados não são compartilhados com terceiros, exceto fornecedores de serviços essenciais (pagamentos) que possuem suas próprias políticas.</p>
            </section>

            <section>
                <h3 className="font-bold text-gray-900 mb-2">SEÇÃO 7 – COOKIES</h3>
                <p>O usuário manifesta conhecer e aceitar que pode ser utilizado um sistema de coleta de dados de navegação mediante a utilização de cookies.</p>
            </section>

            <section>
                <h3 className="font-bold text-gray-900 mb-2">SEÇÃO 8 – CONSENTIMENTO</h3>
                <p>Ao utilizar os serviços, o usuário está consentindo com a presente Política de Privacidade. O usuário tem direito de retirar o consentimento a qualquer tempo através do e-mail dados@snapimmobile.app.</p>
            </section>

            <section>
                <h3 className="font-bold text-gray-900 mb-2">SEÇÃO 9 – ALTERAÇÕES</h3>
                <p>Reservamos o direito de modificar essa Política de Privacidade a qualquer momento.</p>
            </section>

            <section>
                <h3 className="font-bold text-gray-900 mb-2">SEÇÃO 10 – JURISDIÇÃO</h3>
                <p>Para a solução de controvérsias decorrentes do presente instrumento será aplicado integralmente o Direito brasileiro.</p>
            </section>
        </div>

        {/* Footer */}
        <div className="p-6 border-t border-gray-100 bg-gray-50 rounded-b-2xl flex justify-end">
            <button 
                onClick={onClose}
                className="px-6 py-2.5 bg-gray-900 text-white rounded-lg hover:bg-gray-800 text-sm font-bold shadow-md transition-colors"
            >
                Entendido
            </button>
        </div>

      </div>
    </div>
  );
};
