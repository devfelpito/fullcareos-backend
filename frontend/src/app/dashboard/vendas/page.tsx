"use client";

import { useEffect, useMemo, useState } from "react";
import { apiGet } from "@/lib/api";

type Sale = {
  id: string;
  amount: number;
  paymentMethod: string;
  createdAt: string;
  clientId: string;
  serviceId: string;
};

type Client = { id: string; name: string };
type Service = { id: string; name: string };

export default function VendasPage() {
  const [sales, setSales] = useState<Sale[]>([]);
  const [clients, setClients] = useState<Client[]>([]);
  const [services, setServices] = useState<Service[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    let mounted = true;

    async function load() {
      setLoading(true);
      setError("");
      try {
        const [salesData, clientsData, servicesData] = await Promise.all([
          apiGet<Sale[]>("/sales"),
          apiGet<Client[]>("/client"),
          apiGet<Service[]>("/services"),
        ]);

        if (!mounted) return;
        setSales(salesData);
        setClients(clientsData);
        setServices(servicesData);
      } catch (err: any) {
        if (mounted) setError(err.message || "Erro ao carregar vendas");
      } finally {
        if (mounted) setLoading(false);
      }
    }

    load();
    return () => {
      mounted = false;
    };
  }, []);

  const total = useMemo(() => sales.reduce((acc, sale) => acc + Number(sale.amount || 0), 0), [sales]);
  const clientMap = useMemo(() => new Map(clients.map((c) => [c.id, c.name])), [clients]);
  const serviceMap = useMemo(() => new Map(services.map((s) => [s.id, s.name])), [services]);

  return (
    <div className="space-y-4">
      <div className="flex items-end justify-between gap-3">
        <div>
          <h1 className="text-xl font-semibold text-primary">Vendas</h1>
          <p className="text-primary/60 text-sm mt-0.5">Histórico em tempo real do banco</p>
        </div>
        <div className="rounded-lg border border-ice-border bg-white px-3 py-2 text-sm text-primary">
          Total: <span className="font-semibold">{total.toLocaleString("pt-BR", { style: "currency", currency: "BRL" })}</span>
        </div>
      </div>

      {error && <p className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-600">{error}</p>}

      <div className="overflow-hidden rounded-xl border border-ice-border bg-white shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-ice-white text-left font-medium text-primary/70">
                <th className="px-4 py-3">Data</th>
                <th className="px-4 py-3">Cliente</th>
                <th className="px-4 py-3">Serviço</th>
                <th className="px-4 py-3">Pagamento</th>
                <th className="px-4 py-3">Valor</th>
              </tr>
            </thead>
            <tbody>
              {!loading && sales.length === 0 && (
                <tr>
                  <td colSpan={5} className="px-4 py-6 text-center text-primary/60">
                    Nenhuma venda registrada ainda.
                  </td>
                </tr>
              )}
              {sales
                .slice()
                .sort((a, b) => +new Date(b.createdAt) - +new Date(a.createdAt))
                .map((sale) => (
                  <tr key={sale.id} className="border-t border-ice-border">
                    <td className="px-4 py-3 text-primary/80">{new Date(sale.createdAt).toLocaleDateString("pt-BR")}</td>
                    <td className="px-4 py-3 text-primary">{clientMap.get(sale.clientId) || "-"}</td>
                    <td className="px-4 py-3 text-primary/80">{serviceMap.get(sale.serviceId) || "-"}</td>
                    <td className="px-4 py-3 text-primary/80">{sale.paymentMethod}</td>
                    <td className="px-4 py-3 font-medium text-primary">
                      {Number(sale.amount).toLocaleString("pt-BR", { style: "currency", currency: "BRL" })}
                    </td>
                  </tr>
                ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
