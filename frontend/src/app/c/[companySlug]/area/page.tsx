"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { customerApi } from "@/lib/customerApi";

type Appointment = {
  id: string;
  scheduledAt: string;
  service: { name: string; duration: number; price: number };
};

export default function CustomerAreaPage() {
  const params = useParams<{ companySlug: string }>();
  const companySlug = String(params.companySlug || "");

  const [customerName, setCustomerName] = useState("");
  const [customerEmail, setCustomerEmail] = useState("");
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [error, setError] = useState("");

  async function loadAppointments() {
    try {
      const data = await customerApi<Appointment[]>(`/customer-portal/${companySlug}/appointments`);
      setAppointments(data);
    } catch (err: any) {
      setError(err.message || "Erro ao carregar agendamentos");
    }
  }

  useEffect(() => {
    const raw = localStorage.getItem("fullcareos_customer");
    if (!raw) {
      window.location.href = `/c/${companySlug}/login`;
      return;
    }

    try {
      const parsed = JSON.parse(raw);
      setCustomerName(parsed?.client?.name || "Cliente");
      setCustomerEmail(parsed?.email || "");
    } catch {
      window.location.href = `/c/${companySlug}/login`;
      return;
    }

    loadAppointments();
  }, [companySlug]);

  async function cancelAppointment(appointmentId: string) {
    try {
      await customerApi(`/customer-portal/${companySlug}/appointments/${appointmentId}`, {
        method: "DELETE",
      });
      await loadAppointments();
    } catch (err: any) {
      setError(err.message || "Erro ao cancelar agendamento");
    }
  }

  function logout() {
    localStorage.removeItem("fullcareos_customer_token");
    localStorage.removeItem("fullcareos_customer");
    window.location.href = `/c/${companySlug}/login`;
  }

  return (
    <div className="mx-auto max-w-3xl px-4 py-10 space-y-6">
      <div className="rounded-xl border border-ice-border bg-white p-6 shadow-sm">
        <h1 className="text-2xl font-semibold text-primary">Área do Cliente</h1>
        <p className="mt-2 text-sm text-primary/70">Empresa: {companySlug}</p>
        <p className="text-sm text-primary/70">Bem-vindo, {customerName}.</p>
        <p className="text-sm text-primary/70">E-mail: {customerEmail}</p>

        <div className="mt-4 flex gap-3">
          <Link href={`/c/${companySlug}/servicos`} className="rounded-lg bg-accent px-4 py-2 text-sm font-medium text-white">
            Ver serviços e agendar
          </Link>
          <button onClick={logout} className="rounded-lg border border-ice-border px-4 py-2 text-sm font-medium text-primary">
            Sair
          </button>
        </div>
      </div>

      {error && <p className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-600">{error}</p>}

      <div className="rounded-xl border border-ice-border bg-white p-6 shadow-sm">
        <h2 className="text-lg font-semibold text-primary">Meus agendamentos</h2>

        {appointments.length === 0 ? (
          <p className="mt-3 text-sm text-primary/60">Você ainda não possui agendamentos.</p>
        ) : (
          <div className="mt-3 space-y-3">
            {appointments.map((appointment) => (
              <div key={appointment.id} className="rounded-lg border border-ice-border p-3 flex items-center justify-between gap-3">
                <div>
                  <p className="font-medium text-primary">{appointment.service.name}</p>
                  <p className="text-sm text-primary/70">
                    {new Date(appointment.scheduledAt).toLocaleString("pt-BR")} • {appointment.service.duration} min
                  </p>
                </div>
                <button
                  onClick={() => cancelAppointment(appointment.id)}
                  className="rounded-lg border border-red-300 px-3 py-1.5 text-sm font-medium text-red-700"
                >
                  Cancelar
                </button>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
