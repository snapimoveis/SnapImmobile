import React, { useRef, useState } from 'react';
import { UserProfile } from '../../types';
import { Upload, Loader2, Save } from 'lucide-react';

interface Props {
    currentUser: UserProfile & {
        // Extensão da tipagem para incluir campos de negócio se não existirem no tipo base
        businessEmail?: string;
        website?: string;
        businessLogo?: string;
        businessName?: string;
    };
    onUpdateUser: (u: UserProfile) => void;
    onSave?: () => Promise<void>; // Nova prop para lidar com a gravação no banco
}

export const ProfileTab: React.FC<Props> = ({ currentUser, onUpdateUser, onSave }) => {
    const profileInputRef = useRef<HTMLInputElement>(null);
    const businessInputRef = useRef<HTMLInputElement>(null);
    const [isSaving, setIsSaving] = useState(false);

    // Handler genérico para upload de imagens (Avatar ou Logo de Negócio)
    const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>, field: 'avatar' | 'businessLogo') => {
        const file = e.target.files?.[0];
        if (file) {
            const reader = new FileReader();
            reader.onloadend = () => {
                onUpdateUser({ ...currentUser, [field]: reader.result as string });
            };
            reader.readAsDataURL(file);
        }
    };

    const handleSave = async () => {
        if (!onSave) return;
        setIsSaving(true);
        try {
            await onSave();
        } catch (error) {
            console.error("Erro ao guardar:", error);
        } finally {
            setIsSaving(false);
        }
    };

    return (
        <div className="max-w-4xl space-y-8 animate-in fade-in pb-10">
            {/* --- Informações Gerais --- */}
            <div className="bg-white p-8 rounded-xl border border-gray-200 shadow-sm space-y-6">
                <h3 className="text-xl font-bold text-gray-900 mb-6 border-b border-gray-100 pb-4">Informações gerais</h3>
                
                <div>
                    <label className="block text-sm font-bold text-gray-900 mb-2">E-mail</label>
                    <input 
                        type="email" 
                        value={currentUser.email} 
                        readOnly 
                        className="w-full p-3 bg-gray-100 border border-gray-200 rounded-lg text-gray-600 cursor-not-allowed"
                    />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                        <label className="block text-sm font-bold text-gray-900 mb-2">Nome *</label>
                        <input 
                            type="text" 
                            value={currentUser.firstName}
                            onChange={(e) => onUpdateUser({...currentUser, firstName: e.target.value})}
                            className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none transition-all"
                        />
                    </div>
                    <div>
                        <label className="block text-sm font-bold text-gray-900 mb-2">Apelido *</label>
                        <input 
                            type="text" 
                            value={currentUser.lastName || ''}
                            onChange={(e) => onUpdateUser({...currentUser, lastName: e.target.value})}
                            className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none transition-all"
                        />
                    </div>
                </div>

                <div>
                    <label className="block text-sm font-bold text-gray-900 mb-2">Idioma *</label>
                    <select 
                        className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none bg-white transition-all"
                        value={currentUser.preferences?.language || 'pt-PT'}
                        onChange={(e) => onUpdateUser({
                            ...currentUser, 
                            preferences: { ...currentUser.preferences, language: e.target.value }
                        })}
                    >
                        <option value="pt-PT">Português</option>
                        <option value="en-US">English</option>
                    </select>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                        <label className="block text-sm font-bold text-gray-900 mb-2">Número de telefone</label>
                        <div className="flex">
                            <select className="p-3 border border-r-0 border-gray-300 rounded-l-lg bg-gray-50 text-gray-600 outline-none">
                                <option>PT +351</option>
                            </select>
                            <input 
                                type="text" 
                                className="flex-1 p-3 border border-gray-300 rounded-r-lg focus:ring-2 focus:ring-blue-500 outline-none transition-all"
                                value={currentUser.phone || ''}
                                onChange={(e) => onUpdateUser({...currentUser, phone: e.target.value})}
                            />
                        </div>
                    </div>
                </div>

                <div>
                    <label className="block text-sm font-bold text-gray-900 mb-2">Imagem de perfil</label>
                    <div className="flex items-center gap-4">
                        {currentUser.avatar && (
                            <img src={currentUser.avatar} alt="Avatar" className="w-12 h-12 rounded-full object-cover border border-gray-200" />
                        )}
                        <button 
                            onClick={() => profileInputRef.current?.click()}
                            className="bg-white border border-gray-300 text-gray-700 font-medium px-4 py-2.5 rounded-lg text-sm hover:bg-gray-50 transition-colors shadow-sm flex items-center gap-2"
                        >
                            <Upload size={16} />
                            Carregar imagem
                        </button>
                    </div>
                    <input 
                        type="file" 
                        ref={profileInputRef} 
                        className="hidden" 
                        onChange={(e) => handleImageUpload(e, 'avatar')} 
                        accept="image/*" 
                    />
                </div>

                <div className="flex justify-end pt-4">
                    <button 
                        onClick={handleSave}
                        disabled={isSaving}
                        className="bg-blue-600 text-white font-bold px-8 py-3 rounded-lg text-sm hover:bg-blue-700 transition-colors flex items-center gap-2 disabled:opacity-50"
                    >
                        {isSaving ? <Loader2 className="animate-spin" size={18} /> : <Save size={18} />}
                        Guardar Alterações
                    </button>
                </div>
            </div>

            {/* --- Cartão de Visitas --- */}
            <div className="bg-white p-8 rounded-xl border border-gray-200 shadow-sm space-y-6">
                <h3 className="text-xl font-bold text-gray-900 mb-4">Cartão de visitas</h3>
                <p className="text-sm text-gray-500 mb-6">Personalize o seu cartão de visita exibido durante as visitas virtuais.</p>

                {/* Preview do Cartão */}
                <div className="flex justify-center bg-gray-50 p-10 rounded-xl border border-gray-100 mb-8">
                    <div className="bg-white p-6 rounded-xl shadow-lg w-full max-w-sm border-t-4 border-teal-600 relative overflow-hidden">
                        <div className="flex items-center gap-4 relative z-10">
                            <div className="w-16 h-16 rounded-full bg-blue-100 flex-shrink-0 overflow-hidden border-2 border-white shadow-sm">
                                {currentUser.avatar ? (
                                    <img src={currentUser.avatar} className="w-full h-full object-cover" alt="Avatar" />
                                ) : (
                                    <div className="w-full h-full flex items-center justify-center text-blue-300 text-xl font-bold">
                                        {currentUser.firstName?.[0]}
                                    </div>
                                )}
                            </div>
                            <div className="flex-1 min-w-0">
                                <p className="font-bold text-gray-900 truncate">
                                    {currentUser.businessName || 'Nome da Empresa'}
                                </p>
                                <p className="text-sm text-gray-600 truncate">
                                    {currentUser.firstName} {currentUser.lastName}
                                </p>
                                <p className="text-xs text-gray-400 mt-1 truncate">
                                    {currentUser.businessEmail || currentUser.email}
                                </p>
                                {currentUser.website && (
                                     <p className="text-xs text-teal-600 mt-0.5 truncate">{currentUser.website}</p>
                                )}
                            </div>
                        </div>
                        
                        {/* Logo da Empresa no canto (se existir) */}
                        {currentUser.businessLogo && (
                            <div className="absolute top-2 right-2 opacity-10">
                                <img src={currentUser.businessLogo} className="w-20 h-20 object-contain" alt="Business Logo Watermark" />
                            </div>
                        )}

                        <div className="flex justify-end mt-4 pt-4 border-t border-gray-100">
                             {currentUser.businessLogo ? (
                                 <img src={currentUser.businessLogo} className="h-8 object-contain" alt="Business Logo" />
                             ) : (
                                 <div className="text-xs text-gray-300 italic">Sem logo</div>
                             )}
                        </div>
                    </div>
                </div>
                <p className="text-center text-xs text-gray-400 -mt-4 mb-6">Pré-visualização em tempo real</p>

                {/* Inputs do Cartão */}
                <div className="space-y-4">
                    <div>
                        <label className="block text-sm font-bold text-gray-900 mb-2">Nome da Empresa (opcional)</label>
                        <input 
                            type="text" 
                            className="w-full p-3 border border-gray-300 rounded-lg outline-none focus:ring-2 focus:ring-teal-500 transition-all" 
                            value={currentUser.businessName || ''}
                            onChange={(e) => onUpdateUser({...currentUser, businessName: e.target.value})}
                            placeholder="Ex: Imobiliária Central"
                        />
                    </div>

                    <div>
                        <label className="block text-sm font-bold text-gray-900 mb-2">Correio electrónico profissional</label>
                        <input 
                            type="email" 
                            className="w-full p-3 border border-gray-300 rounded-lg outline-none focus:ring-2 focus:ring-teal-500 transition-all" 
                            value={currentUser.businessEmail || ''}
                            onChange={(e) => onUpdateUser({...currentUser, businessEmail: e.target.value})}
                            placeholder={currentUser.email}
                        />
                        <p className="text-xs text-gray-400 mt-1">Se deixar em branco, será usado o e-mail da conta.</p>
                    </div>

                    <div>
                        <label className="block text-sm font-bold text-gray-900 mb-2">URL do site</label>
                        <input 
                            type="text" 
                            className="w-full p-3 border border-gray-300 rounded-lg outline-none focus:ring-2 focus:ring-teal-500 transition-all" 
                            value={currentUser.website || ''}
                            onChange={(e) => onUpdateUser({...currentUser, website: e.target.value})}
                            placeholder="www.oseusite.com"
                        />
                        <p className="text-xs text-gray-400 mt-1">Se deixar em branco, o site não aparecerá no cartão.</p>
                    </div>

                    <div>
                        <label className="block text-sm font-bold text-gray-900 mb-2">Logótipo do negócio</label>
                        <div className="flex items-center gap-4">
                            <button 
                                onClick={() => businessInputRef.current?.click()}
                                className="bg-white border border-gray-300 text-gray-700 font-medium px-4 py-2.5 rounded-lg text-sm hover:bg-gray-50 transition-colors shadow-sm flex items-center gap-2"
                            >
                                <Upload size={16} />
                                Carregar logótipo
                            </button>
                            {currentUser.businessLogo && (
                                <span className="text-xs text-green-600 font-medium flex items-center gap-1">
                                    ✓ Carregado
                                    <button 
                                        onClick={() => onUpdateUser({...currentUser, businessLogo: undefined})}
                                        className="text-red-400 hover:text-red-600 ml-2 underline"
                                    >
                                        Remover
                                    </button>
                                </span>
                            )}
                        </div>
                        <input 
                            type="file" 
                            ref={businessInputRef} 
                            className="hidden" 
                            onChange={(e) => handleImageUpload(e, 'businessLogo')} 
                            accept="image/*" 
                        />
                        <p className="text-xs text-gray-400 mt-2">Recomendado: PNG com fundo transparente.</p>
                    </div>
                </div>

                <div className="flex justify-end pt-4">
                    <button 
                        onClick={handleSave}
                        disabled={isSaving}
                        className="bg-blue-50 text-blue-700 font-bold px-8 py-3 rounded-lg text-sm hover:bg-blue-100 transition-colors flex items-center gap-2"
                    >
                         {isSaving ? <Loader2 className="animate-spin" size={18} /> : <Save size={18} />}
                        Guardar Cartão
                    </button>
                </div>
            </div>
        </div>
    );
};
