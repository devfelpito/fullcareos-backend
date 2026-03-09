"use client";

import { useEffect, useMemo, useState } from "react";
import { apiGet } from "@/lib/api";

type Vehicle = {
  id: string;
  model: string;
  plate: string;
  clientId: string;
  createdAt: string;
};

type Client = { id: string; name: string };

export default function VeiculosPage() {
  const [vehicles, setVehicles] = useState<Vehicle[]>([]);
  const [clients, setClients] = useState<Client[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    let mounted = true;

    async function load() {
      setLoading(true);
      setError("");
      try {
        const [vehiclesData, clientsData] = await Promise.all([
          apiGet<Vehicle[]>("/vehicles"),
          apiGet<Client[]>("/client"),
        ]);
        if (!mounted) return;
        setVehicles(vehiclesData);
        setClients(clientsData);
      } catch (err: any) {
        if (mounted) setError(err.message || "Erro ao carregar veículos");
      } finally {
        if (mounted) setLoading(false);
      }
    }

    load();
    return () => {
      mounted = false;
    };
  }, []);

  const clientMap = useMemo(() => new Map(clients.map((c) => [c.id, c.name])), [clients]);

  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-xl font-semibold text-primary">Veículos</h1>
        <p className="text-primary/60 text-sm mt-0.5">Listagem em tempo real do banco</p>
      </div>

      {error && <p className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-600">{error}</p>}

      <div className="overflow-hidden rounded-xl border border-ice-border bg-white shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-ice-white text-left font-medium text-primary/70">
                <th className="px-4 py-3">Modelo</th>
                <th className="px-4 py-3">Placa</th>
                <th className="px-4 py-3">Cliente</th>
                <th className="px-4 py-3">Cadastro</th>
              </tr>
            </thead>
            <tbody>
              {!loading && vehicles.length === 0 && (
                <tr>
                  <td colSpan={4} className="px-4 py-6 text-center text-primary/60">
                    Nenhum veículo cadastrado ainda.
                  </td>
                </tr>
              )}
              {vehicles.map((vehicle) => (
                <tr key={vehicle.id} className="border-t border-ice-border">
                  <td className="px-4 py-3 text-primary">{vehicle.model}</td>
                  <td className="px-4 py-3 text-primary/80">{vehicle.plate}</td>
                  <td className="px-4 py-3 text-primary/80">{clientMap.get(vehicle.clientId) || "-"}</td>
                  <td className="px-4 py-3 text-primary/80">{new Date(vehicle.createdAt).toLocaleDateString("pt-BR")}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
