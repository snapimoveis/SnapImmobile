// ============================================================
// NewProjectModal.tsx — versão final e corrigida, validada JSX
// ============================================================

import React, { useState } from "react";
import { ProjectDetails } from "../types";
import { X } from "lucide-react";

interface NewProjectModalProps {
  onClose: () => void;
  onSubmit: (data: {
    title: string;
    address: string;
    details: ProjectDetails;
  }) => void;
}

export const NewProjectModal: React.FC<NewProjectModalProps> = ({
  onClose,
  onSubmit,
}) => {
  const [title, setTitle] = useState("");
  const [address, setAddress] = useState("");

  const [details, setDetails] = useState<ProjectDetails>({
    rooms: 0,
    bathrooms: 0,
    size: 0,
    description: "",
    area: 0,
  });

  const handleSubmit = () => {
    if (!title.trim()) {
      alert("O imóvel precisa de um nome (ex: T2 Centro)");
      return;
    }

    onSubmit({
      title,
      address,
      details,
    });

    onClose();
  };

  return (
    <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50">
      <div className="bg-white dark:bg-black rounded-2xl p-6 w-full max-w-lg shadow-xl">

        {/* HEADER */}
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-xl font-bold">Novo Imóvel</h2>
          <button
            className="p-2 rounded-full hover:bg-gray-200 dark:hover:bg-white/10"
            onClick={onClose}
          >
            <X size={24} />
          </button>
        </div>

        {/* FORM */}
        <div className="space-y-4">

          {/* TITLE */}
          <div>
            <label className="text-sm font-medium">Título do Imóvel</label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Ex.: Apartamento T2 com varanda"
              className="w-full mt-1 p-3 rounded-lg bg-gray-100 dark:bg-white/10 outline-none"
            />
          </div>

          {/* ADDRESS */}
          <div>
            <label className="text-sm font-medium">Endereço</label>
            <input
              type="text"
              value={address}
              onChange={(e) => setAddress(e.target.value)}
              placeholder="Rua, nº, cidade"
              className="w-full mt-1 p-3 rounded-lg bg-gray-100 dark:bg-white/10 outline-none"
            />
          </div>

          {/* AREA */}
          <div>
            <label className="text-sm font-medium">Área (m²)</label>
            <input
              type="number"
              value={details.area ?? 0}
              onChange={(e) =>
                setDetails((d) => ({ ...d, area: Number(e.target.value) }))
              }
              className="w-full mt-1 p-3 rounded-lg bg-gray-100 dark:bg-white/10 outline-none"
            />
          </div>

          {/* SIZE */}
          <div>
            <label className="text-sm font-medium">Tamanho interno (m²)</label>
            <input
              type="number"
              value={details.size ?? 0}
              onChange={(e) =>
                setDetails((d) => ({ ...d, size: Number(e.target.value) }))
              }
              className="w-full mt-1 p-3 rounded-lg bg-gray-100 dark:bg-white/10 outline-none"
            />
          </div>

          {/* ROOMS */}
          <div>
            <label className="text-sm font-medium">Quartos</label>
            <input
              type="number"
              value={details.rooms ?? 0}
              onChange={(e) =>
                setDetails((d) => ({ ...d, rooms: Number(e.target.value) }))
              }
              className="w-full mt-1 p-3 rounded-lg bg-gray-100 dark:bg-white/10 outline-none"
            />
          </div>

          {/* BATHROOMS */}
          <div>
            <label className="text-sm font-medium">Casas de banho</label>
            <input
              type="number"
              value={details.bathrooms ?? 0}
              onChange={(e) =>
                setDetails((d) => ({ ...d, bathrooms: Number(e.target.value) }))
              }
              className="w-full mt-1 p-3 rounded-lg bg-gray-100 dark:bg-white/10 outline-none"
            />
          </div>

          {/* DESCRIPTION */}
          <div>
            <label className="text-sm font-medium">Descrição</label>
            <textarea
              value={details.description ?? ""}
              onChange={(e) =>
                setDetails((d) => ({ ...d, description: e.target.value }))
              }
              placeholder="Descrição breve do imóvel"
              className="w-full mt-1 p-3 rounded-lg bg-gray-100 dark:bg-white/10 outline-none h-28"
            />
          </div>

        </div>

        {/* FOOTER */}
        <button
          onClick={handleSubmit}
          className="w-full mt-6 bg-brand-purple text-white py-3 rounded-xl hover:bg-brand-purple/90 transition"
        >
          Criar Imóvel
        </button>

      </div>
    </div>
  );
};

