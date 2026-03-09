"use client";

import Link from "next/link";
import { useParams } from "next/navigation";
import { useState } from "react";

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3000/api";

export default function CustomerForgotPage() {
  const params = useParams<{ companySlug: string }>();
  const companySlug = String(params.companySlug || "");

  const [email, setEmail] = useState("");
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setMessage("");

    const res = await fetch(`${API_URL}/customer-auth/${companySlug}/forgot-password`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email }),
    });

    const data = await res.json().catch(() => ({}));
    if (!res.ok) {
      setError(data.message || "Falha ao solicitar recuperação");
      return;
    }

    const tokenHint = data.resetToken ? ` Token (teste): ${data.resetToken}` : "";
    setMessage(`${data.message || "Instruções enviadas"}${tokenHint}`);
  }

  return (
    <div className="mx-auto max-w-md px-4 py-10">
      <h1 className="text-2xl font-semibold text-primary">Recuperar senha</h1>
      <p className="mt-1 text-sm text-primary/60">Empresa: <span className="font-medium">{companySlug}</span></p>

      <form onSubmit={handleSubmit} className="mt-6 space-y-4 rounded-xl border border-ice-border bg-white p-6 shadow-sm">
        <input className="w-full rounded-lg border border-ice-border px-3 py-2" placeholder="Seu e-mail" type="email" value={email} onChange={(e) => setEmail(e.target.value)} required />

        {error && <p className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-600">{error}</p>}
        {message && <p className="rounded-lg bg-green-50 px-3 py-2 text-sm text-green-700">{message}</p>}

        <button type="submit" className="w-full rounded-lg bg-accent px-4 py-2.5 font-medium text-white">Solicitar token</button>
      </form>

      <p className="mt-4 text-sm text-primary/70">
        Já tem token? <Link href={`/c/${companySlug}/redefinir-senha`} className="text-accent font-medium">Redefinir senha</Link>
      </p>
    </div>
  );
}
