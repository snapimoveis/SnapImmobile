import React, { useRef } from "react";
import { UserProfile } from "../../types";
import { Upload } from "lucide-react";

interface Props {
  user: UserProfile;
  onUpdateUser: (updated: UserProfile) => void;
}

export const ProfileTab: React.FC<Props> = ({ user, onUpdateUser }) => {
  const fileRef = useRef<HTMLInputElement>(null);

  const handleAvatarUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = () => {
      const url = reader.result as string;
      onUpdateUser({ ...user, avatar: url });
    };
    reader.readAsDataURL(file);
  };

  return (
    <div className="max-w-4xl space-y-8 animate-in fade-in">
      {/* =======================
          FOTO DE PERFIL
      ======================== */}
      <div className="bg-white p-8 rounded-xl border border-gray-200 shadow-sm space-y-6">
        <h3 className="font-bold text-lg text-gray-900">Foto de Perfil</h3>

        <div className="flex items-center gap-6">
          <div className="w-24 h-24 rounded-full overflow-hidden bg-gray-100 border">
            {user.avatar ? (
              <img
                src={user.avatar}
                alt="avatar"
                className="w-full h-full object-cover"
              />
            ) : (
              <div className="w-full h-full flex items-center justify-center text-gray-400 text-sm">
                Sem foto
              </div>
            )}
          </div>

          <div>
            <button
              className="px-4 py-2 bg-purple-600 text-white rounded-lg text-sm hover:bg-purple-700"
              onClick={() => fileRef.current?.click()}
            >
              Carregar nova foto
            </button>
            <input
              ref={fileRef}
              type="file"
              accept="image/*"
              className="hidden"
              onChange={handleAvatarUpload}
            />
          </div>
        </div>
      </div>

      {/* =======================
          INFORMAÇÕES DO PERFIL
      ======================== */}
      <div className="bg-white p-8 rounded-xl border border-gray-200 shadow-sm space-y-6">
        <h3 className="font-bold text-lg text-gray-900">Informações</h3>

        <div className="space-y-4">
          {/* Nome */}
          <div>
            <label className="block text-sm font-medium text-gray-700">
              Primeiro Nome
            </label>
            <input
              type="text"
              value={user.firstName}
              onChange={(e) =>
                onUpdateUser({ ...user, firstName: e.target.value })
              }
              className="mt-1 w-full p-3 border rounded-lg bg-white"
            />
          </div>

          {/* Apelido */}
          <div>
            <label className="block text-sm font-medium text-gray-700">
              Último Nome
            </label>
            <input
              type="text"
              value={user.lastName}
              onChange={(e) =>
                onUpdateUser({ ...user, lastName: e.target.value })
              }
              className="mt-1 w-full p-3 border rounded-lg bg-white"
            />
          </div>

          {/* Email */}
          <div>
            <label className="block text-sm font-medium text-gray-700">
              E-mail
            </label>
            <input
              type="email"
              value={user.email}
              onChange={(e) =>
                onUpdateUser({ ...user, email: e.target.value })
              }
              className="mt-1 w-full p-3 border rounded-lg bg-white"
            />
          </div>

          {/* Telefone */}
          <div>
            <label className="block text-sm font-medium text-gray-700">
              Telefone
            </label>
            <input
              type="text"
              value={user.phone ?? ""}
              onChange={(e) =>
                onUpdateUser({ ...user, phone: e.target.value })
              }
              className="mt-1 w-full p-3 border rounded-lg bg-white"
            />
          </div>
        </div>
      </div>
    </div>
  );
};
