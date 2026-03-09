"use client";

import Link from "next/link";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { LogIn, UserRound } from "lucide-react";

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3000/api";

type LoginMode = "company" | "customer";

export default function LoginPage() {
  const router = useRouter();
  const [mode, setMode] = useState<LoginMode>("company");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [companySlug, setCompanySlug] = useState("");

  async function handleCompanyLogin(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      const res = await fetch(`${API_URL}/auth/login`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });

      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        setError(data.message || "Falha no login da empresa.");
        return;
      }

      localStorage.setItem("fullcareos_token", data.token);
      if (data.user) localStorage.setItem("fullcareos_user", JSON.stringify(data.user));
      router.push("/dashboard");
    } catch {
      setError("Erro de conexão com o servidor.");
    } finally {
      setLoading(false);
    }
  }

  function handleGoCustomerPortal(e: React.FormEvent) {
    e.preventDefault();
    const slug = companySlug.trim().toLowerCase();
    if (!slug) {
      setError("Informe o link da sua empresa.");
      return;
    }
    setError("");
    router.push(`/c/${slug}/login`);
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-ice-white px-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <h1 className="text-2xl font-semibold text-primary tracking-tight">FullcareOS</h1>
          <p className="text-primary/60 text-sm mt-1">Acesse como empresa ou cliente final</p>
        </div>

        <div className="mb-4 grid grid-cols-2 rounded-lg border border-ice-border bg-white p-1">
          <button
            type="button"
            onClick={() => setMode("company")}
            className={`rounded-md px-3 py-2 text-sm font-medium transition-colors ${
              mode === "company" ? "bg-accent text-white" : "text-primary/70 hover:bg-ice-white"
            }`}
          >
            Empresa
          </button>
          <button
            type="button"
            onClick={() => setMode("customer")}
            className={`rounded-md px-3 py-2 text-sm font-medium transition-colors ${
              mode === "customer" ? "bg-accent text-white" : "text-primary/70 hover:bg-ice-white"
            }`}
          >
            Cliente
          </button>
        </div>

        {mode === "company" ? (
          <form onSubmit={handleCompanyLogin} className="bg-white rounded-xl shadow-sm border border-ice-border p-6 space-y-4">
            <div>
              <label htmlFor="company-email" className="block text-sm font-medium text-primary mb-1.5">E-mail</label>
              <input
                id="company-email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                className="w-full px-3 py-2 border border-ice-border rounded-lg text-primary focus:outline-none focus:ring-2 focus:ring-accent"
              />
            </div>
            <div>
              <label htmlFor="company-password" className="block text-sm font-medium text-primary mb-1.5">Senha</label>
              <input
                id="company-password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                className="w-full px-3 py-2 border border-ice-border rounded-lg text-primary focus:outline-none focus:ring-2 focus:ring-accent"
              />
            </div>
            {error && <p className="text-sm text-red-600 bg-red-50 rounded-lg px-3 py-2">{error}</p>}
            <button type="submit" disabled={loading} className="w-full flex items-center justify-center gap-2 py-2.5 px-4 rounded-lg bg-accent text-white font-medium disabled:opacity-60">
              <LogIn className="w-4 h-4" />
              {loading ? "Entrando..." : "Entrar como empresa"}
            </button>
            <p className="text-center text-sm text-primary/70">
              Não tem conta?{" "}
              <Link href="/register" className="text-accent font-medium hover:text-accent-hover">Criar empresa</Link>
            </p>
            <p className="text-center text-sm text-primary/70">
              <Link href="/auth/forgot-password" className="text-accent font-medium hover:text-accent-hover">
                Recuperar senha
              </Link>
              {" • "}
              <Link href="/auth/verify-email" className="text-accent font-medium hover:text-accent-hover">
                Verificar e-mail
              </Link>
            </p>
          </form>
        ) : (
          <form onSubmit={handleGoCustomerPortal} className="bg-white rounded-xl shadow-sm border border-ice-border p-6 space-y-4">
            <div>
              <label htmlFor="company-slug" className="block text-sm font-medium text-primary mb-1.5">Link da empresa</label>
              <input
                id="company-slug"
                value={companySlug}
                onChange={(e) => setCompanySlug(e.target.value)}
                placeholder="ex: oficina-alfa"
                required
                className="w-full px-3 py-2 border border-ice-border rounded-lg text-primary focus:outline-none focus:ring-2 focus:ring-accent"
              />
              <p className="mt-1 text-xs text-primary/60">Você recebe esse link da empresa.</p>
            </div>

            {error && <p className="text-sm text-red-600 bg-red-50 rounded-lg px-3 py-2">{error}</p>}

            <button type="submit" className="w-full flex items-center justify-center gap-2 py-2.5 px-4 rounded-lg bg-accent text-white font-medium">
              <UserRound className="w-4 h-4" />
              Acessar portal do cliente
            </button>
          </form>
        )}
      </div>
    </div>
  );
}
