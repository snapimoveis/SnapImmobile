
import React, { useRef } from 'react';
import { UserProfile } from '../../types';
import { Upload } from 'lucide-react';

interface Props {
    currentUser: UserProfile;
    onUpdateUser: (u: UserProfile) => void;
}

export const ProfileTab: React.FC<Props> = ({ currentUser, onUpdateUser }) => {
    const profileInputRef = useRef<HTMLInputElement>(null);
    const businessInputRef = useRef<HTMLInputElement>(null);

    const handleAvatarUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) {
            const reader = new FileReader();
            reader.onloadend = () => {
                onUpdateUser({ ...currentUser, avatar: reader.result as string });
            };
            reader.readAsDataURL(file);
        }
    };

    return (
        <div className="max-w-4xl space-y-8 animate-in fade-in">
            {/* Informações Gerais Section */}
            <div className="bg-white p-8 rounded-xl border border-gray-200 shadow-sm space-y-6">
                <h3 className="text-xl font-bold text-gray-900 mb-6 border-b border-gray-100 pb-4">Informações gerais</h3>
                
                <div>
                    <label className="block text-sm font-bold text-gray-900 mb-2">Correio electrónico</label>
                    <input 
                        type="email" 
                        value={currentUser.email} 
                        readOnly 
                        className="w-full p-3 bg-gray-100 border border-gray-200 rounded-lg text-gray-600 cursor-not-allowed"
                    />
                </div>

                <div className="grid grid-cols-2 gap-6">
                    <div>
                        <label className="block text-sm font-bold text-gray-900 mb-2">Nome *</label>
                        <input 
                            type="text" 
                            value={currentUser.firstName}
                            onChange={(e) => onUpdateUser({...currentUser, firstName: e.target.value})}
                            className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                        />
                    </div>
                    <div>
                        <label className="block text-sm font-bold text-gray-900 mb-2">Apelido *</label>
                        <input 
                            type="text" 
                            value={currentUser.lastName || ''}
                            onChange={(e) => onUpdateUser({...currentUser, lastName: e.target.value})}
                            className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                        />
                    </div>
                </div>

                <div>
                    <label className="block text-sm font-bold text-gray-900 mb-2">Idioma *</label>
                    <select 
                        className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none bg-white"
                        value={currentUser.preferences?.language}
                    >
                        <option value="pt-PT">Português</option>
                        <option value="en-US">English</option>
                    </select>
                </div>

                <div className="grid grid-cols-3 gap-6">
                    <div>
                        <label className="block text-sm font-bold text-gray-900 mb-2">Número de telefone</label>
                        <div className="flex">
                            <select className="p-3 border border-r-0 border-gray-300 rounded-l-lg bg-gray-50 text-gray-600">
                                <option>PT +351</option>
                            </select>
                            <input 
                                type="text" 
                                className="flex-1 p-3 border border-gray-300 rounded-r-lg focus:ring-2 focus:ring-blue-500 outline-none"
                                value={currentUser.phone}
                                onChange={(e) => onUpdateUser({...currentUser, phone: e.target.value})}
                            />
                        </div>
                    </div>
                </div>

                <div>
                    <label className="block text-sm font-bold text-gray-900 mb-2">Imagem de perfil</label>
                    <button 
                        onClick={() => profileInputRef.current?.click()}
                        className="bg-blue-600 text-white font-medium px-6 py-2.5 rounded-lg text-sm hover:bg-blue-700 transition-colors shadow-sm"
                    >
                        Carregar imagem
                    </button>
                    <input type="file" ref={profileInputRef} className="hidden" onChange={handleAvatarUpload} accept="image/*" />
                </div>

                <div className="flex justify-end pt-4">
                    <button className="bg-blue-200/50 text-blue-700 font-bold px-8 py-3 rounded-lg text-sm hover:bg-blue-200 transition-colors">
                        Guardar
                    </button>
                </div>
            </div>

            {/* Cartão de Visitas Section */}
            <div className="bg-white p-8 rounded-xl border border-gray-200 shadow-sm space-y-6">
                <h3 className="text-xl font-bold text-gray-900 mb-4">Cartão de visitas</h3>
                <p className="text-sm text-gray-500 mb-6">Personalize o seu cartão de visita exibido durante as visitas virtuais.</p>

                <div className="flex justify-center bg-gray-50 p-10 rounded-xl border border-gray-100 mb-8">
                    <div className="bg-white p-4 rounded-xl shadow-lg w-full max-w-sm border-t-4 border-teal-600">
                        <div className="flex items-center gap-4">
                            <div className="w-16 h-16 rounded-full bg-blue-100 flex-shrink-0 overflow-hidden">
                                {currentUser.avatar ? <img src={currentUser.avatar} className="w-full h-full object-cover" /> : null}
                            </div>
                            <div>
                                <p className="font-bold text-gray-900">Nome da Empresa</p>
                                <p className="text-sm text-gray-600">{currentUser.firstName} {currentUser.lastName}</p>
                                <p className="text-xs text-gray-400 mt-1">{currentUser.email}</p>
                            </div>
                        </div>
                        <div className="flex justify-end mt-4">
                            <div className="w-10 h-10 rounded-full bg-blue-600"></div>
                        </div>
                    </div>
                </div>
                <p className="text-center text-xs text-gray-400 -mt-4 mb-6">Pré-visualização do seu cartão de visita</p>

                <div className="space-y-4">
                    <div>
                        <label className="block text-sm font-bold text-gray-900 mb-2">Correio electrónico</label>
                        <input type="email" className="w-full p-3 border border-gray-300 rounded-lg outline-none" />
                        <p className="text-xs text-gray-400 mt-1">Se você deixar este espaço om branco, o endereço de e-mail da sua conta será exibido.</p>
                    </div>
                    <div>
                        <label className="block text-sm font-bold text-gray-900 mb-2">URL do site</label>
                        <input type="text" className="w-full p-3 border border-gray-300 rounded-lg outline-none" />
                        <p className="text-xs text-gray-400 mt-1">Se você deixar este espaço om branco, o site da sua empresa não aparecerá.</p>
                    </div>
                    <div>
                        <label className="block text-sm font-bold text-gray-900 mb-2">Imagem do negócio</label>
                        <button className="bg-blue-600 text-white font-medium px-6 py-2.5 rounded-lg text-sm hover:bg-blue-700 transition-colors shadow-sm mb-2">
                            Carregar imagem
                        </button>
                        <p className="text-xs text-gray-400">Se você não enviar uma foto, o logotipo da sua organização será exibido.</p>
                    </div>
                </div>

                <div className="flex justify-end pt-4">
                    <button className="bg-blue-200/50 text-blue-700 font-bold px-8 py-3 rounded-lg text-sm hover:bg-blue-200 transition-colors">
                        Guardar
                    </button>
                </div>
            </div>
        </div>
    );
};
