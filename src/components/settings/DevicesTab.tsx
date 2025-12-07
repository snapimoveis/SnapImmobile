import React from "react";
import { Device } from "../../types";

// formatador local
const formatDate = (timestamp?: number) => {
  if (!timestamp) return "—";
  const d = new Date(timestamp);
  return d.toLocaleDateString("pt-PT") + " " + d.toLocaleTimeString("pt-PT");
};

interface Props {
  devices: Device[];
}

export default function DevicesTab({ devices }: Props) {
  return (
    <div className="p-4">
      <h3 className="font-semibold mb-4 text-lg">Dispositivos</h3>

      {devices.map(dev => (
        <div key={dev.id} className="border rounded p-4 mb-2">
          <p><strong>Nome:</strong> {dev.name || "—"}</p>
          <p><strong>Modelo:</strong> {dev.model || "—"}</p>
          <p><strong>Status:</strong> {dev.status || "—"}</p>
          <p><strong>Último acesso:</strong> {formatDate(dev.lastAccess || dev.lastActive)}</p>
        </div>
      ))}
    </div>
  );
}
