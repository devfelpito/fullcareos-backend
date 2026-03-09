"use client";

import Link from "next/link";
import { useState } from "react";

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3000/api";

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState("");
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setMessage("");

    const res = await fetch(`${API_URL}/auth/forgot-password`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email }),
    });

    const data = await res.json().catch(() => ({}));
    if (!res.ok) {
      setError(data.message || "Falha ao solicitar recuperação");
      return;
    }

    setMessage(data.message || "Instruções enviadas");
  }

  return (
    <div className="mx-auto max-w-md px-4 py-10">
      <h1 className="text-2xl font-semibold text-primary">Recuperar senha da empresa</h1>
      <form onSubmit={handleSubmit} className="mt-6 space-y-4 rounded-xl border border-ice-border bg-white p-6 shadow-sm">
        <input className="w-full rounded-lg border border-ice-border px-3 py-2" placeholder="E-mail" type="email" value={email} onChange={(e) => setEmail(e.target.value)} required />
        {error && <p className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-600">{error}</p>}
        {message && <p className="rounded-lg bg-green-50 px-3 py-2 text-sm text-green-700">{message}</p>}
        <button type="submit" className="w-full rounded-lg bg-accent px-4 py-2.5 text-white">Enviar recuperação</button>
      </form>
      <p className="mt-4 text-sm text-primary/70">Já tem token? <Link href="/auth/reset-password" className="text-accent font-medium">Redefinir senha</Link></p>
    </div>
  );
}
