"use client";

import { useEffect, useState } from "react";
import { apiGet } from "@/lib/api";

type Client = {
  id: string;
  name: string;
  email?: string | null;
  phone?: string | null;
  createdAt: string;
};

export default function ClientesPage() {
  const [clients, setClients] = useState<Client[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    let mounted = true;
    async function load() {
      setLoading(true);
      setError("");
      try {
        const data = await apiGet<Client[]>("/client");
        if (mounted) setClients(data);
      } catch (err: any) {
        if (mounted) setError(err.message || "Erro ao carregar clientes");
      } finally {
        if (mounted) setLoading(false);
      }
    }

    load();
    return () => {
      mounted = false;
    };
  }, []);

  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-xl font-semibold text-primary">Clientes</h1>
        <p className="text-primary/60 text-sm mt-0.5">Listagem em tempo real do banco</p>
      </div>

      {error && <p className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-600">{error}</p>}

      <div className="overflow-hidden rounded-xl border border-ice-border bg-white shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-ice-white text-left font-medium text-primary/70">
                <th className="px-4 py-3">Nome</th>
                <th className="px-4 py-3">E-mail</th>
                <th className="px-4 py-3">Telefone</th>
                <th className="px-4 py-3">Cadastro</th>
              </tr>
            </thead>
            <tbody>
              {!loading && clients.length === 0 && (
                <tr>
                  <td colSpan={4} className="px-4 py-6 text-center text-primary/60">
                    Nenhum cliente cadastrado ainda.
                  </td>
                </tr>
              )}
              {clients.map((client) => (
                <tr key={client.id} className="border-t border-ice-border">
                  <td className="px-4 py-3 text-primary">{client.name}</td>
                  <td className="px-4 py-3 text-primary/80">{client.email || "-"}</td>
                  <td className="px-4 py-3 text-primary/80">{client.phone || "-"}</td>
                  <td className="px-4 py-3 text-primary/80">{new Date(client.createdAt).toLocaleDateString("pt-BR")}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
