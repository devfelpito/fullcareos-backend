"use client";

import { useEffect, useMemo, useState } from "react";
import { Users, Car, Calendar, DollarSign } from "lucide-react";
import { apiGet } from "@/lib/api";

type Client = { id: string; name: string };
type Vehicle = { id: string };
type Appointment = { id: string; scheduledAt: string; clientId: string; serviceId: string };
type Sale = { id: string; amount: number; paymentMethod: string; createdAt: string; clientId: string; serviceId: string };
type Service = { id: string; name: string };

export default function DashboardPage() {
  const [clients, setClients] = useState<Client[]>([]);
  const [vehicles, setVehicles] = useState<Vehicle[]>([]);
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [sales, setSales] = useState<Sale[]>([]);
  const [services, setServices] = useState<Service[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    let mounted = true;

    async function load() {
      setLoading(true);
      setError("");
      try {
        const [clientsData, vehiclesData, appointmentsData, salesData, servicesData] = await Promise.all([
          apiGet<Client[]>("/client"),
          apiGet<Vehicle[]>("/vehicles"),
          apiGet<Appointment[]>("/appointments"),
          apiGet<Sale[]>("/sales"),
          apiGet<Service[]>("/services"),
        ]);

        if (!mounted) return;
        setClients(clientsData);
        setVehicles(vehiclesData);
        setAppointments(appointmentsData);
        setSales(salesData);
        setServices(servicesData);
      } catch (err: any) {
        if (!mounted) return;
        setError(err.message || "Não foi possível carregar o dashboard");
      } finally {
        if (mounted) setLoading(false);
      }
    }

    load();
    return () => {
      mounted = false;
    };
  }, []);

  const serviceMap = useMemo(() => new Map(services.map((s) => [s.id, s.name])), [services]);
  const totalSales = useMemo(() => sales.reduce((acc, s) => acc + Number(s.amount || 0), 0), [sales]);

  const recentSales = useMemo(
    () => [...sales].sort((a, b) => +new Date(b.createdAt) - +new Date(a.createdAt)).slice(0, 6),
    [sales]
  );

  const stats = [
    { label: "Clientes", value: String(clients.length), icon: Users, change: "Total cadastrado" },
    { label: "Veículos", value: String(vehicles.length), icon: Car, change: "Total cadastrado" },
    { label: "Agendamentos", value: String(appointments.length), icon: Calendar, change: "Total cadastrado" },
    {
      label: "Vendas (R$)",
      value: totalSales.toLocaleString("pt-BR", { minimumFractionDigits: 2 }),
      icon: DollarSign,
      change: "Faturamento acumulado",
    },
  ];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl font-semibold text-primary">Dashboard</h1>
        <p className="text-primary/60 text-sm mt-0.5">Visão geral do seu negócio</p>
      </div>

      {error && <p className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-600">{error}</p>}

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {stats.map(({ label, value, icon: Icon, change }) => (
          <div key={label} className="rounded-xl border border-ice-border bg-white p-4 shadow-sm">
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium text-primary/70">{label}</span>
              <div className="rounded-lg bg-accent/10 p-2 text-accent">
                <Icon className="h-4 w-4" />
              </div>
            </div>
            <p className="mt-2 text-2xl font-semibold text-primary">{loading ? "..." : value}</p>
            <p className="mt-1 text-xs text-primary/50">{change}</p>
          </div>
        ))}
      </div>

      <div className="overflow-hidden rounded-xl border border-ice-border bg-white shadow-sm">
        <div className="border-b border-ice-border px-4 py-3">
          <h2 className="font-medium text-primary">Últimas vendas</h2>
          <p className="text-sm text-primary/60">Dados reais da sua conta</p>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-ice-white text-left font-medium text-primary/70">
                <th className="px-4 py-3">Data</th>
                <th className="px-4 py-3">Serviço</th>
                <th className="px-4 py-3">Pagamento</th>
                <th className="px-4 py-3">Valor</th>
              </tr>
            </thead>
            <tbody>
              {!loading && recentSales.length === 0 && (
                <tr>
                  <td colSpan={4} className="px-4 py-6 text-center text-primary/60">
                    Nenhuma venda registrada ainda.
                  </td>
                </tr>
              )}
              {recentSales.map((row) => (
                <tr key={row.id} className="border-t border-ice-border">
                  <td className="px-4 py-3 text-primary/80">{new Date(row.createdAt).toLocaleDateString("pt-BR")}</td>
                  <td className="px-4 py-3 text-primary">{serviceMap.get(row.serviceId) || "Serviço"}</td>
                  <td className="px-4 py-3 text-primary/80">{row.paymentMethod}</td>
                  <td className="px-4 py-3 font-medium text-primary">
                    {Number(row.amount).toLocaleString("pt-BR", { style: "currency", currency: "BRL" })}
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
