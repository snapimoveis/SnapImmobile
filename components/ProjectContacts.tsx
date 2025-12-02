import React, { useState } from 'react';
import { Phone, Mail, User, Plus, Trash2, MessageCircle, Save, X } from 'lucide-react';
import { Project, Contact } from '../types';
import { saveProject } from '../services/storage';

interface Props {
  project: Project;
  onUpdate: (updatedProject: Project) => void;
}

export const ProjectContacts: React.FC<Props> = ({ project, onUpdate }) => {
  const [isAdding, setIsAdding] = useState(false);
  const [newContact, setNewContact] = useState<Partial<Contact>>({
    role: 'Proprietário'
  });

  const contacts = project.contacts ?? [];

  const handleAddContact = async () => {
    if (!newContact.name || !newContact.phone) {
      alert("Nome e Telefone são obrigatórios.");
      return;
    }

    const contact: Contact = {
      id: crypto.randomUUID(),
      name: newContact.name,
      phone: newContact.phone,
      role: newContact.role ?? 'Proprietário',
      email: newContact.email ?? '',
      notes: newContact.notes ?? ''
    };

    const updatedProject: Project = {
      ...project,
      contacts: [...contacts, contact]
    };

    try {
      await saveProject(updatedProject);
      onUpdate(updatedProject);
      setIsAdding(false);
      setNewContact({ role: 'Proprietário' });
    } catch (error) {
      console.error(error);
      alert("Erro ao salvar contacto.");
    }
  };

  const handleDeleteContact = async (contactId: string) => {
    if (!window.confirm("Tem a certeza que deseja remover este contacto?")) return;

    const updatedProject: Project = {
      ...project,
      contacts: contacts.filter((c: Contact) => c.id !== contactId)
    };

    try {
      await saveProject(updatedProject);
      onUpdate(updatedProject);
    } catch (error) {
      console.error(error);
      alert("Erro ao remover contacto.");
    }
  };

  return (
    <div className="max-w-4xl mx-auto py-6 animate-in fade-in">

      {/* Header */}
      <div className="flex justify-between items-center mb-8">
        <div>
          <h2 className="text-lg font-semibold text-gray-900">Pessoas Associadas</h2>
          <p className="text-sm text-gray-500">Gestão de proprietários e visitas.</p>
        </div>
        <button 
          onClick={() => setIsAdding(true)}
          className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg text-sm font-medium flex items-center gap-2 transition-colors shadow-sm"
        >
          <Plus size={16} />
          Adicionar Contacto
        </button>
      </div>

      {/* Add Form */}
      {isAdding && (
        <div className="bg-white p-6 rounded-xl border border-blue-100 shadow-lg mb-8 relative">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
            
            <div>
              <label className="block text-xs font-medium text-gray-500 mb-1">Nome *</label>
              <input 
                type="text" 
                className="w-full p-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 outline-none"
                value={newContact.name ?? ''}
                onChange={e => setNewContact({ ...newContact, name: e.target.value })}
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-gray-500 mb-1">Função</label>
              <select 
                className="w-full p-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 outline-none bg-white"
                value={newContact.role}
                onChange={e => setNewContact({ ...newContact, role: e.target.value })}
              >
                <option value="Proprietário">Proprietário</option>
                <option value="Inquilino">Inquilino</option>
                <option value="Porteiro">Porteiro</option>
                <option value="Outro">Outro</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-medium text-gray-500 mb-1">Telefone *</label>
              <input 
                type="tel" 
                className="w-full p-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 outline-none"
                value={newContact.phone ?? ''}
                onChange={e => setNewContact({ ...newContact, phone: e.target.value })}
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-gray-500 mb-1">Email</label>
              <input 
                type="email" 
                className="w-full p-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 outline-none"
                value={newContact.email ?? ''}
                onChange={e => setNewContact({ ...newContact, email: e.target.value })}
              />
            </div>

          </div>

          {/* Buttons */}
          <div className="flex justify-end gap-2">
            <button 
              onClick={() => setIsAdding(false)} 
              className="px-4 py-2 text-sm text-gray-600 hover:bg-gray-100 rounded-lg"
            >
              Cancelar
            </button>

            <button 
              onClick={handleAddContact} 
              className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-2 rounded-lg text-sm font-medium flex items-center gap-2"
            >
              <Save size={16} /> Guardar
            </button>
          </div>

        </div>
      )}

      {/* Empty State */}
      {contacts.length === 0 && !isAdding && (
        <div className="text-center py-12 bg-white rounded-xl border border-dashed border-gray-300">
          <div className="w-12 h-12 bg-gray-50 rounded-full flex items-center justify-center mx-auto mb-3">
            <User className="text-gray-400" size={24} />
          </div>
          <p className="text-gray-500 text-sm">Nenhum contacto associado.</p>
        </div>
      )}

      {/* Contact List */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {contacts.map((contact: Contact) => (
          <div 
            key={contact.id} 
            className="bg-white p-5 rounded-xl border border-gray-200 shadow-sm hover:shadow-md transition-all group relative"
          >
            <button
              onClick={() => handleDeleteContact(contact.id)}
              className="absolute top-4 right-4 text-gray-300 hover:text-red-500 opacity-0 group-hover:opacity-100 transition-all"
            >
              <Trash2 size={16} />
            </button>

            <div className="flex items-start gap-4">
              <div className="w-10 h-10 rounded-full bg-gray-100 flex items-center justify-center text-sm font-bold text-gray-600 shrink-0">
                {(contact.name ?? "?").charAt(0).toUpperCase()}
              </div>

              <div className="flex-1 min-w-0">
                <h3 className="font-semibold text-gray-900 truncate">{contact.name}</h3>

                <span className="text-[10px] uppercase font-bold px-2 py-0.5 bg-gray-100 text-gray-500 rounded-full">
                  {contact.role}
                </span>

                <div className="mt-3 flex gap-2">
                  <a
                    href={`tel:${contact.phone ?? ""}`}
                    className="p-2 bg-blue-50 text-blue-600 rounded-lg hover:bg-blue-100 transition-colors"
                  >
                    <Phone size={14} />
                  </a>

                  {contact.email && (
                    <a
                      href={`mailto:${contact.email}`}
                      className="p-2 bg-gray-50 text-gray-600 rounded-lg hover:bg-gray-100 transition-colors"
                    >
                      <Mail size={14} />
                    </a>
                  )}

                  <a
                    href={`https://wa.me/${(contact.phone ?? "").replace(/[^0-9]/g, '')}`}
                    target="_blank"
                    className="p-2 bg-green-50 text-green-600 rounded-lg hover:bg-green-100 transition-colors"
                  >
                    <MessageCircle size={14} />
                  </a>
                </div>

              </div>
            </div>
          </div>
        ))}
      </div>

    </div>
  );
};
