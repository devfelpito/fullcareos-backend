"use client";

import { useEffect, useMemo, useState } from "react";
import { apiGet } from "@/lib/api";

type Appointment = {
  id: string;
  scheduledAt: string;
  clientId: string;
  serviceId: string;
  vehicleId?: string | null;
};

type Client = { id: string; name: string };
type Service = { id: string; name: string };

export default function AgendamentosPage() {
  const [appointments, setAppointments] = useState<Appointment[]>([]);
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
        const [appointmentsData, clientsData, servicesData] = await Promise.all([
          apiGet<Appointment[]>("/appointments"),
          apiGet<Client[]>("/client"),
          apiGet<Service[]>("/services"),
        ]);
        if (!mounted) return;
        setAppointments(appointmentsData);
        setClients(clientsData);
        setServices(servicesData);
      } catch (err: any) {
        if (mounted) setError(err.message || "Erro ao carregar agendamentos");
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
  const serviceMap = useMemo(() => new Map(services.map((s) => [s.id, s.name])), [services]);

  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-xl font-semibold text-primary">Agendamentos</h1>
        <p className="text-primary/60 text-sm mt-0.5">Agenda em tempo real do banco</p>
      </div>

      {error && <p className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-600">{error}</p>}

      <div className="overflow-hidden rounded-xl border border-ice-border bg-white shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-ice-white text-left font-medium text-primary/70">
                <th className="px-4 py-3">Data/Hora</th>
                <th className="px-4 py-3">Cliente</th>
                <th className="px-4 py-3">Serviço</th>
                <th className="px-4 py-3">Veículo</th>
              </tr>
            </thead>
            <tbody>
              {!loading && appointments.length === 0 && (
                <tr>
                  <td colSpan={4} className="px-4 py-6 text-center text-primary/60">
                    Nenhum agendamento registrado ainda.
                  </td>
                </tr>
              )}
              {appointments.map((appointment) => (
                <tr key={appointment.id} className="border-t border-ice-border">
                  <td className="px-4 py-3 text-primary/80">
                    {new Date(appointment.scheduledAt).toLocaleString("pt-BR")}
                  </td>
                  <td className="px-4 py-3 text-primary">{clientMap.get(appointment.clientId) || "-"}</td>
                  <td className="px-4 py-3 text-primary/80">{serviceMap.get(appointment.serviceId) || "-"}</td>
                  <td className="px-4 py-3 text-primary/80">{appointment.vehicleId || "-"}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
