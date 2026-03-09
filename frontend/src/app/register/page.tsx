"use client";

import Link from "next/link";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { UserPlus } from "lucide-react";

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3000/api";

export default function RegisterPage() {
  const router = useRouter();
  const [companyName, setCompanyName] = useState("");
  const [companySlug, setCompanySlug] = useState("");
  const [companyEmail, setCompanyEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [address, setAddress] = useState("");
  const [adminName, setAdminName] = useState("");
  const [adminEmail, setAdminEmail] = useState("");
  const [adminPassword, setAdminPassword] = useState("");
  const [portalLink, setPortalLink] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setPortalLink("");
    setLoading(true);

    try {
      const res = await fetch(`${API_URL}/onboarding/register`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          companyName,
          companySlug,
          companyEmail,
          phone,
          address,
          adminName,
          adminEmail,
          adminPassword,
        }),
      });

      const data = await res.json().catch(() => ({}));

      if (!res.ok) {
        setError(data.message || "Não foi possível criar a conta.");
        return;
      }

      if (!data.token) {
        setError("Resposta inválida do servidor.");
        return;
      }

      localStorage.setItem("fullcareos_token", data.token);
      if (data.user) {
        localStorage.setItem("fullcareos_user", JSON.stringify(data.user));
      }

      const slug = data?.company?.slug;
      if (slug) {
        setPortalLink(`${window.location.origin}/c/${slug}/login`);
      }

      router.push("/dashboard");
    } catch {
      setError("Erro de conexão. Verifique se o backend está rodando.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen bg-ice-white px-4 py-8">
      <div className="mx-auto w-full max-w-xl">
        <div className="mb-8 text-center">
          <h1 className="text-2xl font-semibold text-primary tracking-tight">Criar conta da empresa</h1>
          <p className="mt-1 text-sm text-primary/60">Comece seu trial de 14 dias no FullcareOS</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4 rounded-xl border border-ice-border bg-white p-6 shadow-sm">
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="sm:col-span-2">
              <label htmlFor="companyName" className="mb-1.5 block text-sm font-medium text-primary">Nome da empresa</label>
              <input id="companyName" value={companyName} onChange={(e) => setCompanyName(e.target.value)} required className="w-full rounded-lg border border-ice-border px-3 py-2" placeholder="Oficina Exemplo" />
            </div>

            <div className="sm:col-span-2">
              <label htmlFor="companySlug" className="mb-1.5 block text-sm font-medium text-primary">Link da empresa (slug)</label>
              <input id="companySlug" value={companySlug} onChange={(e) => setCompanySlug(e.target.value)} className="w-full rounded-lg border border-ice-border px-3 py-2" placeholder="oficina-exemplo" />
              <p className="mt-1 text-xs text-primary/60">Esse valor será usado no portal de cliente: /c/seu-slug/login</p>
            </div>

            <div>
              <label htmlFor="companyEmail" className="mb-1.5 block text-sm font-medium text-primary">E-mail da empresa</label>
              <input id="companyEmail" type="email" value={companyEmail} onChange={(e) => setCompanyEmail(e.target.value)} required className="w-full rounded-lg border border-ice-border px-3 py-2" placeholder="contato@empresa.com" />
            </div>

            <div>
              <label htmlFor="phone" className="mb-1.5 block text-sm font-medium text-primary">Telefone</label>
              <input id="phone" value={phone} onChange={(e) => setPhone(e.target.value)} required className="w-full rounded-lg border border-ice-border px-3 py-2" placeholder="(11) 99999-9999" />
            </div>

            <div className="sm:col-span-2">
              <label htmlFor="address" className="mb-1.5 block text-sm font-medium text-primary">Endereço</label>
              <input id="address" value={address} onChange={(e) => setAddress(e.target.value)} required className="w-full rounded-lg border border-ice-border px-3 py-2" placeholder="Rua, número, bairro, cidade" />
            </div>

            <div>
              <label htmlFor="adminName" className="mb-1.5 block text-sm font-medium text-primary">Nome do administrador</label>
              <input id="adminName" value={adminName} onChange={(e) => setAdminName(e.target.value)} required className="w-full rounded-lg border border-ice-border px-3 py-2" placeholder="Seu nome" />
            </div>

            <div>
              <label htmlFor="adminEmail" className="mb-1.5 block text-sm font-medium text-primary">E-mail do administrador</label>
              <input id="adminEmail" type="email" value={adminEmail} onChange={(e) => setAdminEmail(e.target.value)} required className="w-full rounded-lg border border-ice-border px-3 py-2" placeholder="admin@empresa.com" />
            </div>

            <div className="sm:col-span-2">
              <label htmlFor="adminPassword" className="mb-1.5 block text-sm font-medium text-primary">Senha</label>
              <input id="adminPassword" type="password" minLength={8} value={adminPassword} onChange={(e) => setAdminPassword(e.target.value)} required className="w-full rounded-lg border border-ice-border px-3 py-2" placeholder="Mínimo 8 caracteres" />
            </div>
          </div>

          {error && <p className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-600">{error}</p>}
          {portalLink && <p className="rounded-lg bg-green-50 px-3 py-2 text-sm text-green-700">Link do portal de cliente: {portalLink}</p>}

          <button type="submit" disabled={loading} className="flex w-full items-center justify-center gap-2 rounded-lg bg-accent px-4 py-2.5 font-medium text-white disabled:cursor-not-allowed disabled:opacity-60">
            <UserPlus className="h-4 w-4" />
            {loading ? "Criando conta..." : "Criar conta"}
          </button>
        </form>

        <p className="mt-5 text-center text-sm text-primary/60">
          Já tem conta? <Link href="/login" className="font-medium text-accent hover:text-accent-hover">Entrar</Link>
        </p>
      </div>
    </div>
  );
}
