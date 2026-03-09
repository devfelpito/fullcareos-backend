"use client";

import Link from "next/link";
import { useEffect, useState } from "react";

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3000/api";

export default function ResetPasswordPage() {
  const [email, setEmail] = useState("");
  const [token, setToken] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    setEmail(params.get("email") || "");
    setToken(params.get("token") || "");
  }, []);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setMessage("");

    const res = await fetch(`${API_URL}/auth/reset-password`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, token, newPassword }),
    });

    const data = await res.json().catch(() => ({}));
    if (!res.ok) {
      setError(data.message || "Falha ao redefinir senha");
      return;
    }

    setMessage(data.message || "Senha redefinida com sucesso");
  }

  return (
    <div className="mx-auto max-w-md px-4 py-10">
      <h1 className="text-2xl font-semibold text-primary">Redefinir senha da empresa</h1>
      <form onSubmit={handleSubmit} className="mt-6 space-y-4 rounded-xl border border-ice-border bg-white p-6 shadow-sm">
        <input className="w-full rounded-lg border border-ice-border px-3 py-2" placeholder="E-mail" type="email" value={email} onChange={(e) => setEmail(e.target.value)} required />
        <input className="w-full rounded-lg border border-ice-border px-3 py-2" placeholder="Token" value={token} onChange={(e) => setToken(e.target.value)} required />
        <input className="w-full rounded-lg border border-ice-border px-3 py-2" placeholder="Nova senha" type="password" minLength={8} value={newPassword} onChange={(e) => setNewPassword(e.target.value)} required />
        {error && <p className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-600">{error}</p>}
        {message && <p className="rounded-lg bg-green-50 px-3 py-2 text-sm text-green-700">{message}</p>}
        <button type="submit" className="w-full rounded-lg bg-accent px-4 py-2.5 text-white">Redefinir senha</button>
      </form>
      <p className="mt-4 text-sm text-primary/70">Voltar para <Link href="/login" className="text-accent font-medium">login</Link></p>
    </div>
  );
}
