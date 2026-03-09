"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  Users,
  Car,
  Calendar,
  ShoppingCart,
  LogOut,
} from "lucide-react";

const items = [
  { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { href: "/dashboard/clientes", label: "Clientes", icon: Users },
  { href: "/dashboard/veiculos", label: "Veículos", icon: Car },
  { href: "/dashboard/agendamentos", label: "Agendamentos", icon: Calendar },
  { href: "/dashboard/vendas", label: "Vendas", icon: ShoppingCart },
];

export default function DashboardSidebar() {
  const pathname = usePathname();

  function handleLogout() {
    localStorage.removeItem("fullcareos_token");
    localStorage.removeItem("fullcareos_user");
    window.location.href = "/login";
  }

  return (
    <aside className="w-56 min-h-screen bg-primary flex flex-col border-r border-primary/20">
      <div className="p-4 border-b border-primary/20">
        <Link href="/dashboard" className="flex items-center gap-2 text-white font-semibold">
          <span>FullcareOS</span>
        </Link>
      </div>

      <nav className="flex-1 p-3 space-y-0.5">
        {items.map(({ href, label, icon: Icon }) => {
          const isActive = pathname === href;
          return (
            <Link
              key={href}
              href={href}
              className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors ${
                isActive
                  ? "bg-accent text-white"
                  : "text-white/80 hover:bg-primary-light hover:text-white"
              }`}
            >
              <Icon className="w-5 h-5 shrink-0" />
              {label}
            </Link>
          );
        })}
      </nav>

      <div className="p-3 border-t border-primary/20">
        <button
          type="button"
          onClick={handleLogout}
          className="flex items-center gap-3 w-full px-3 py-2.5 rounded-lg text-sm font-medium text-white/80 hover:bg-primary-light hover:text-white transition-colors"
        >
          <LogOut className="w-5 h-5 shrink-0" />
          Sair
        </button>
      </div>
    </aside>
  );
}
