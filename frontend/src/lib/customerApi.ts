export const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3000/api";

export function getCustomerToken() {
  if (typeof window === "undefined") return null;
  return localStorage.getItem("fullcareos_customer_token");
}

export async function customerApi<T>(path: string, init?: RequestInit): Promise<T> {
  const token = getCustomerToken();

  const res = await fetch(`${API_URL}${path}`, {
    ...init,
    headers: {
      "Content-Type": "application/json",
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...(init?.headers || {}),
    },
    cache: "no-store",
  });

  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    throw new Error(data.message || "Erro na requisição");
  }

  return data as T;
}
