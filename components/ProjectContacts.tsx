import React, { useState } from "react";
import { Contact, Project } from "../types";
import { saveProjects, loadProjects } from "../services/storage";

interface Props {
  project: Project;
  onUpdate: (p: Project) => void;
}

export default function ProjectContacts({ project, onUpdate }: Props) {
  const [newContact, setNewContact] = useState<Partial<Contact>>({
    name: "",
    phone: "",
    email: "",
    role: "Proprietário",
    notes: "",
  });

  const handleAdd = () => {
    const finalContact: Contact = {
      id: crypto.randomUUID(),
      name: newContact.name || "Sem Nome",
      phone: newContact.phone || "",
      email: newContact.email || "",
      role: newContact.role || "Proprietário",
      notes: newContact.notes || "",
    };

    const updated: Project = {
      ...project,
      contacts: [...(project.contacts || []), finalContact],
    };

    // Salvar toda a lista
    const all = loadProjects();
    const updatedList = all.map(p => (p.id === project.id ? updated : p));
    saveProjects(updatedList);

    onUpdate(updated);
    setNewContact({ name: "", phone: "", email: "", role: "Proprietário", notes: "" });
  };

  return (
    <div className="p-4">
      <h3 className="font-semibold mb-2 text-lg">Contactos</h3>

      {/* Lista */}
      {(project.contacts || []).map(c => (
        <div key={c.id} className="border p-3 rounded mb-2">
          <p className="font-bold">{c.name}</p>
          {c.phone && <p>📞 {c.phone}</p>}
          {c.email && <p>✉️ {c.email}</p>}
          {c.role && <p>👤 {c.role}</p>}
          {c.notes && <p>📝 {c.notes}</p>}
        </div>
      ))}

      {/* Form */}
      <div className="mt-4 border rounded p-4 bg-gray-50">
        <input
          value={newContact.name}
          placeholder="Nome"
          onChange={e => setNewContact({ ...newContact, name: e.target.value })}
          className="input mb-2"
        />
        <input
          value={newContact.phone}
          placeholder="Telefone"
          onChange={e => setNewContact({ ...newContact, phone: e.target.value })}
          className="input mb-2"
        />
        <input
          value={newContact.email}
          placeholder="Email"
          onChange={e => setNewContact({ ...newContact, email: e.target.value })}
          className="input mb-2"
        />
        <input
          value={newContact.role}
          placeholder="Função"
          onChange={e => setNewContact({ ...newContact, role: e.target.value })}
          className="input mb-2"
        />
        <textarea
          value={newContact.notes}
          placeholder="Notas"
          onChange={e => setNewContact({ ...newContact, notes: e.target.value })}
          className="input mb-2"
        />

        <button onClick={handleAdd} className="btn-primary w-full">
          Adicionar Contacto
        </button>
      </div>
    </div>
  );
}
