"use client";

import { Users, Car, Calendar, DollarSign } from "lucide-react";

const stats = [
  { label: "Clientes", value: "248", icon: Users, change: "+12% este mês" },
  { label: "Veículos", value: "312", icon: Car, change: "+8% este mês" },
  { label: "Agendamentos", value: "89", icon: Calendar, change: "Esta semana" },
  { label: "Vendas (R$)", value: "24.580", icon: DollarSign, change: "+18% este mês" },
];

const tableData = [
  { id: 1, cliente: "Maria Silva", servico: "Troca de óleo", valor: "R$ 180,00", data: "01/03/2025" },
  { id: 2, cliente: "João Santos", servico: "Revisão geral", valor: "R$ 420,00", data: "28/02/2025" },
  { id: 3, cliente: "Ana Oliveira", servico: "Alinhamento", valor: "R$ 150,00", data: "27/02/2025" },
  { id: 4, cliente: "Pedro Costa", servico: "Troca de pneus", valor: "R$ 890,00", data: "26/02/2025" },
  { id: 5, cliente: "Carla Mendes", servico: "Freios", valor: "R$ 320,00", data: "25/02/2025" },
];

export default function DashboardPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl font-semibold text-primary">Dashboard</h1>
        <p className="text-primary/60 text-sm mt-0.5">Visão geral do seu negócio</p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {stats.map(({ label, value, icon: Icon, change }) => (
          <div
            key={label}
            className="bg-white rounded-xl border border-ice-border p-4 shadow-sm"
          >
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium text-primary/70">{label}</span>
              <div className="p-2 rounded-lg bg-accent/10 text-accent">
                <Icon className="w-4 h-4" />
              </div>
            </div>
            <p className="text-2xl font-semibold text-primary mt-2">{value}</p>
            <p className="text-xs text-primary/50 mt-1">{change}</p>
          </div>
        ))}
      </div>

      <div className="bg-white rounded-xl border border-ice-border shadow-sm overflow-hidden">
        <div className="px-4 py-3 border-b border-ice-border">
          <h2 className="font-medium text-primary">Últimos atendimentos</h2>
          <p className="text-sm text-primary/60">Dados ilustrativos</p>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-ice-white text-left text-primary/70 font-medium">
                <th className="px-4 py-3">Cliente</th>
                <th className="px-4 py-3">Serviço</th>
                <th className="px-4 py-3">Valor</th>
                <th className="px-4 py-3">Data</th>
              </tr>
            </thead>
            <tbody>
              {tableData.map((row) => (
                <tr
                  key={row.id}
                  className="border-t border-ice-border hover:bg-ice-white/50 transition-colors"
                >
                  <td className="px-4 py-3 text-primary">{row.cliente}</td>
                  <td className="px-4 py-3 text-primary/80">{row.servico}</td>
                  <td className="px-4 py-3 text-primary font-medium">{row.valor}</td>
                  <td className="px-4 py-3 text-primary/70">{row.data}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
