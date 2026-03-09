"use client";

import Link from "next/link";
import { useState } from "react";
import { useParams, useRouter } from "next/navigation";

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3000/api";

export default function CustomerLoginPage() {
  const router = useRouter();
  const params = useParams<{ companySlug: string }>();
  const companySlug = String(params.companySlug || "");

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      const res = await fetch(`${API_URL}/customer-auth/${companySlug}/login`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });

      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        setError(data.message || "Falha no login");
        return;
      }

      localStorage.setItem("fullcareos_customer_token", data.token);
      localStorage.setItem("fullcareos_customer", JSON.stringify(data.customer));
      router.push(`/c/${companySlug}/area`);
    } catch {
      setError("Erro de conexão com o servidor");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="mx-auto max-w-md px-4 py-10">
      <h1 className="text-2xl font-semibold text-primary">Portal do Cliente</h1>
      <p className="mt-1 text-sm text-primary/60">Empresa: <span className="font-medium">{companySlug}</span></p>

      <form onSubmit={handleSubmit} className="mt-6 space-y-4 rounded-xl border border-ice-border bg-white p-6 shadow-sm">
        <input className="w-full rounded-lg border border-ice-border px-3 py-2" placeholder="Seu e-mail" type="email" value={email} onChange={(e) => setEmail(e.target.value)} required />
        <input className="w-full rounded-lg border border-ice-border px-3 py-2" placeholder="Senha" type="password" value={password} onChange={(e) => setPassword(e.target.value)} required />

        {error && <p className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-600">{error}</p>}

        <button type="submit" disabled={loading} className="w-full rounded-lg bg-accent px-4 py-2.5 font-medium text-white disabled:opacity-60">
          {loading ? "Entrando..." : "Entrar"}
        </button>
      </form>

      <div className="mt-4 text-sm text-primary/70 space-x-2">
        <Link href={`/c/${companySlug}/cadastro`} className="text-accent font-medium">Cadastrar</Link>
        <span>•</span>
        <Link href={`/c/${companySlug}/verificar-email`} className="text-accent font-medium">Verificar e-mail</Link>
        <span>•</span>
        <Link href={`/c/${companySlug}/esqueci-senha`} className="text-accent font-medium">Recuperar senha</Link>
      </div>
    </div>
  );
}
