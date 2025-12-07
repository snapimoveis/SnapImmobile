// components/ProjectContacts.tsx

import React, { useState } from "react";
import { Project, Contact } from "../types";
import { saveProjects } from "../services/storage"; // loadProjects foi removido!

interface ProjectContactsProps {
  project: Project;
  onSave: (p: Project) => void;
}

export const ProjectContacts: React.FC<ProjectContactsProps> = ({
  project,
  onSave,
}) => {
  const [newContact, setNewContact] = useState<Partial<Contact>>({
    name: "",
    phone: "",
    email: "",
    role: "",
    notes: "",
  });

  const handleAdd = () => {
    if (!newContact.name) return;

    const contact: Contact = {
      id: Date.now().toString(),
      name: newContact.name!,
      phone: newContact.phone || "",
      email: newContact.email || "",
      role: newContact.role || "",
      notes: newContact.notes || "",
    };

    const updated: Project = {
      ...project,
      contacts: [...(project.contacts || []), contact],
    };

    onSave(updated);

    // Salvar localmente se necessário
    saveProjects([]); // mantém compatibilidade, mas não grava lista nenhuma

    setNewContact({
      name: "",
      phone: "",
      email: "",
      role: "",
      notes: "",
    });
  };

  const handleDelete = (id: string) => {
    const updated: Project = {
      ...project,
      contacts: (project.contacts || []).filter((c) => c.id !== id),
    };

    onSave(updated);

    saveProjects([]); // apenas placeholder
  };

  return (
    <div className="p-4">
      <h3 className="text-lg font-bold mb-3">Contactos</h3>

      {/* LISTA */}
      {(project.contacts || []).map((c) => (
        <div
          key={c.id}
          className="border p-2 rounded mb-2 flex justify-between items-center"
        >
          <div>
            <div className="font-semibold">{c.name}</div>
            <div className="text-sm text-gray-600">{c.phone}</div>
            <div className="text-sm text-gray-600">{c.email}</div>
          </div>
          <button
            onClick={() => handleDelete(c.id)}
            className="text-red-600 underline text-sm"
          >
            remover
          </button>
        </div>
      ))}

      {/* FORM NOVO CONTACTO */}
      <div className="mt-4">
        <input
          className="border p-2 w-full mb-2"
          placeholder="Nome"
          value={newContact.name || ""}
          onChange={(e) =>
            setNewContact({ ...newContact, name: e.target.value })
          }
        />
        <input
          className="border p-2 w-full mb-2"
          placeholder="Telefone"
          value={newContact.phone || ""}
          onChange={(e) =>
            setNewContact({ ...newContact, phone: e.target.value })
          }
        />
        <input
          className="border p-2 w-full mb-2"
          placeholder="Email"
          value={newContact.email || ""}
          onChange={(e) =>
            setNewContact({ ...newContact, email: e.target.value })
          }
        />

        <button
          className="bg-blue-600 text-white p-2 rounded w-full"
          onClick={handleAdd}
        >
          Adicionar Contacto
        </button>
      </div>
    </div>
  );
};
