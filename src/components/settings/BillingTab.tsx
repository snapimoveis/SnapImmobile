import React from "react";
import { Invoice } from "../../types";

// Formatador local para remover dependência date-fns
const formatDate = (timestamp?: number) => {
  if (!timestamp) return "—";
  const d = new Date(timestamp);
  return d.toLocaleDateString("pt-PT") + " " + d.toLocaleTimeString("pt-PT");
};

interface Props {
  invoices: Invoice[];
}

export default function BillingTab({ invoices }: Props) {
  return (
    <div className="p-4">
      <h3 className="font-semibold mb-4 text-lg">Faturação</h3>

      {invoices.map(inv => (
        <div key={inv.id} className="border p-3 rounded mb-2">
          <p>Nº: {inv.number || "—"}</p>
          <p>Valor: {inv.amount.toFixed(2)} €</p>
          <p>Data: {formatDate(inv.createdAt)}</p>
          <p>Status: {inv.status}</p>
        </div>
      ))}
    </div>
  );
}
