export const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3000/api";

export function getAuthToken() {
  if (typeof window === "undefined") return null;
  return localStorage.getItem("fullcareos_token");
}

export async function apiGet<T>(path: string): Promise<T> {
  const token = getAuthToken();

  const res = await fetch(`${API_URL}${path}`, {
    headers: token
      ? {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        }
      : { "Content-Type": "application/json" },
    cache: "no-store",
  });

  const data = await res.json().catch(() => ({}));

  if (!res.ok) {
    throw new Error(data.message || "Falha ao carregar dados");
  }

  return data as T;
}
