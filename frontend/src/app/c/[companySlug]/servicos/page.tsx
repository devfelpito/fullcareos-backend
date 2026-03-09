"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { customerApi } from "@/lib/customerApi";

type ServiceItem = {
  id: string;
  name: string;
  price: number;
  duration: number;
  availableSlots: string[];
};

type ServiceCategory = {
  key: string;
  label: string;
  services: ServiceItem[];
};

type ServicesResponse = {
  date: string;
  categories: ServiceCategory[];
};

export default function CustomerServicesPage() {
  const params = useParams<{ companySlug: string }>();
  const companySlug = String(params.companySlug || "");

  const [date, setDate] = useState(new Date().toISOString().slice(0, 10));
  const [categories, setCategories] = useState<ServiceCategory[]>([]);
  const [selectedServiceId, setSelectedServiceId] = useState<string>("");
  const [selectedSlot, setSelectedSlot] = useState<string>("");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  useEffect(() => {
    let mounted = true;

    async function load() {
      setLoading(true);
      setError("");
      setMessage("");
      try {
        const data = await customerApi<ServicesResponse>(`/customer-portal/${companySlug}/services?date=${date}`);
        if (!mounted) return;
        setCategories(data.categories || []);
      } catch (err: any) {
        if (!mounted) return;
        setError(err.message || "Erro ao carregar serviços");
      } finally {
        if (mounted) setLoading(false);
      }
    }

    load();
    return () => {
      mounted = false;
    };
  }, [companySlug, date]);

  const selectedService = useMemo(() => {
    for (const category of categories) {
      for (const service of category.services) {
        if (service.id === selectedServiceId) return service;
      }
    }
    return null;
  }, [categories, selectedServiceId]);

  async function handleSchedule() {
    if (!selectedServiceId || !selectedSlot) {
      setError("Selecione um serviço e um horário.");
      return;
    }

    setSaving(true);
    setError("");
    setMessage("");
    try {
      const data = await customerApi<{ message: string }>(`/customer-portal/${companySlug}/appointments`, {
        method: "POST",
        body: JSON.stringify({
          serviceId: selectedServiceId,
          scheduledAt: selectedSlot,
        }),
      });

      setMessage(data.message || "Agendamento confirmado");
      setSelectedSlot("");

      const refreshed = await customerApi<ServicesResponse>(`/customer-portal/${companySlug}/services?date=${date}`);
      setCategories(refreshed.categories || []);
    } catch (err: any) {
      setError(err.message || "Erro ao agendar");
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="mx-auto max-w-5xl px-4 py-10 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-primary">Serviços</h1>
          <p className="text-sm text-primary/60">Escolha o serviço e agende um horário disponível.</p>
        </div>
        <Link href={`/c/${companySlug}/area`} className="text-sm font-medium text-accent">Voltar à área do cliente</Link>
      </div>

      <div className="rounded-xl border border-ice-border bg-white p-4 shadow-sm">
        <label className="text-sm font-medium text-primary">Data do agendamento</label>
        <input
          type="date"
          value={date}
          onChange={(e) => setDate(e.target.value)}
          className="mt-2 block rounded-lg border border-ice-border px-3 py-2"
        />
      </div>

      {error && <p className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-600">{error}</p>}
      {message && <p className="rounded-lg bg-green-50 px-3 py-2 text-sm text-green-700">{message}</p>}

      {loading ? (
        <p className="text-primary/60">Carregando serviços...</p>
      ) : (
        <div className="space-y-4">
          {categories.map((category) => (
            <section key={category.key} className="rounded-xl border border-ice-border bg-white p-4 shadow-sm">
              <h2 className="text-lg font-semibold text-primary">{category.label}</h2>

              <div className="mt-3 grid gap-3">
                {category.services.map((service) => (
                  <div key={service.id} className="rounded-lg border border-ice-border p-3">
                    <div className="flex flex-wrap items-center justify-between gap-3">
                      <div>
                        <p className="font-medium text-primary">{service.name}</p>
                        <p className="text-sm text-primary/70">
                          {service.price.toLocaleString("pt-BR", { style: "currency", currency: "BRL" })} • {service.duration} min
                        </p>
                      </div>
                      <button
                        type="button"
                        onClick={() => {
                          setSelectedServiceId(service.id);
                          setSelectedSlot("");
                          setError("");
                          setMessage("");
                        }}
                        className={`rounded-lg px-3 py-2 text-sm font-medium ${
                          selectedServiceId === service.id ? "bg-accent text-white" : "bg-ice-white text-primary"
                        }`}
                      >
                        Agendar
                      </button>
                    </div>

                    {selectedServiceId === service.id && (
                      <div className="mt-3">
                        <p className="mb-2 text-sm font-medium text-primary">Horários disponíveis</p>
                        {service.availableSlots.length === 0 ? (
                          <p className="text-sm text-primary/60">Sem horários disponíveis nesta data.</p>
                        ) : (
                          <div className="flex flex-wrap gap-2">
                            {service.availableSlots.map((slot) => {
                              const label = new Date(slot).toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" });
                              return (
                                <button
                                  key={slot}
                                  type="button"
                                  onClick={() => setSelectedSlot(slot)}
                                  className={`rounded-lg border px-3 py-1.5 text-sm ${
                                    selectedSlot === slot ? "border-accent bg-accent text-white" : "border-ice-border"
                                  }`}
                                >
                                  {label}
                                </button>
                              );
                            })}
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </section>
          ))}
        </div>
      )}

      <div className="rounded-xl border border-ice-border bg-white p-4 shadow-sm">
        <p className="text-sm text-primary/70">
          Serviço selecionado: <span className="font-medium">{selectedService?.name || "Nenhum"}</span>
        </p>
        <p className="text-sm text-primary/70">
          Horário selecionado: <span className="font-medium">{selectedSlot ? new Date(selectedSlot).toLocaleString("pt-BR") : "Nenhum"}</span>
        </p>

        <button
          type="button"
          onClick={handleSchedule}
          disabled={saving}
          className="mt-3 rounded-lg bg-accent px-4 py-2.5 text-sm font-medium text-white disabled:opacity-60"
        >
          {saving ? "Agendando..." : "Confirmar agendamento"}
        </button>
      </div>
    </div>
  );
}
