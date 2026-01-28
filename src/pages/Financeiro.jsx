import React, { useState } from "react";
import { useViewPreference } from "@/hooks/useViewPreference";
import { base44 } from "@/api/base44Client";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  DollarSign,
  TrendingUp,
  TrendingDown,
  Receipt,
  CreditCard,
  AlertCircle,
  Users
} from "lucide-react";
import { format, startOfMonth, endOfMonth } from "date-fns";
import { ptBR } from "date-fns/locale";
import PagamentosTab from "@/components/financeiro/PagamentosTab";
import NotasFiscaisTab from "@/components/financeiro/NotasFiscaisTab";
import GestaoFinanceiraPacientes from "@/components/financeiro/GestaoFinanceiraPacientes";

export default function Financeiro() {
  const [activeTab, setActiveTab] = useViewPreference('financeiro-active-tab', 'gestao-pacientes');

  const { data: pagamentos = [] } = useQuery({
    queryKey: ['pagamentos'],
    queryFn: () => base44.entities.Pagamento.list('-data_vencimento'),
  });

  const { data: notasFiscais = [] } = useQuery({
    queryKey: ['notas-fiscais'],
    queryFn: () => base44.entities.NotaFiscal.list('-data_emissao'),
  });

  const { data: pacientes = [] } = useQuery({
    queryKey: ['pacientes'],
    queryFn: () => base44.entities.Paciente.list(),
  });

  const hoje = new Date();
  const inicioMes = startOfMonth(hoje);
  const fimMes = endOfMonth(hoje);

  const pagamentosMes = pagamentos.filter(p => {
    const data = new Date(p.data_pagamento || p.data_vencimento);
    return data >= inicioMes && data <= fimMes;
  });

  const receitaTotal = pagamentosMes
    .filter(p => p.status === 'pago')
    .reduce((acc, p) => acc + (p.valor_pago || p.valor || 0), 0);

  const receitaPendente = pagamentosMes
    .filter(p => p.status === 'pendente')
    .reduce((acc, p) => acc + (p.valor || 0), 0);

  const pagamentosAtrasados = pagamentos.filter(p => {
    if (p.status !== 'pendente') return false;
    const vencimento = new Date(p.data_vencimento);
    return vencimento < hoje;
  }).length;

  const statCards = [
    {
      title: "Receita do Mês",
      value: `R$ ${receitaTotal.toFixed(2)}`,
      icon: DollarSign,
      color: "from-green-500 to-emerald-500",
      bgColor: "bg-green-50",
      iconColor: "text-green-600"
    },
    {
      title: "A Receber",
      value: `R$ ${receitaPendente.toFixed(2)}`,
      icon: TrendingUp,
      color: "from-blue-500 to-cyan-500",
      bgColor: "bg-blue-50",
      iconColor: "text-blue-600"
    },
    {
      title: "Pagamentos Atrasados",
      value: pagamentosAtrasados,
      icon: AlertCircle,
      color: "from-red-500 to-rose-500",
      bgColor: "bg-red-50",
      iconColor: "text-red-600"
    },
    {
      title: "Notas Fiscais",
      value: notasFiscais.filter(n => n.status === 'emitida').length,
      icon: Receipt,
      color: "from-purple-500 to-indigo-500",
      bgColor: "bg-purple-50",
      iconColor: "text-purple-600"
    }
  ];

  return (
    <div className="p-6 md:p-8 space-y-6">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold text-slate-800 flex items-center gap-3">
            <DollarSign className="w-8 h-8 text-cyan-600" />
            Financeiro
          </h1>
          <p className="text-slate-500 mt-1">Gestão de pagamentos e notas fiscais</p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {statCards.map((stat, index) => (
          <Card key={index} className="relative overflow-hidden border-none shadow-lg hover:shadow-xl transition-all duration-300 bg-white">
            <div className={`absolute top-0 right-0 w-32 h-32 bg-gradient-to-br ${stat.color} opacity-10 rounded-full transform translate-x-8 -translate-y-8`} />
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-slate-600">
                {stat.title}
              </CardTitle>
              <div className={`p-2 rounded-lg ${stat.bgColor}`}>
                <stat.icon className={`w-5 h-5 ${stat.iconColor}`} />
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-slate-800">{stat.value}</div>
            </CardContent>
          </Card>
        ))}
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
        <TabsList className="bg-white border shadow-sm">
          <TabsTrigger value="gestao-pacientes" className="data-[state=active]:bg-gradient-to-r data-[state=active]:from-cyan-500 data-[state=active]:to-teal-500 data-[state=active]:text-white">
            <Users className="w-4 h-4 mr-2" />
            Gestão por Paciente
          </TabsTrigger>
          <TabsTrigger value="pagamentos" className="data-[state=active]:bg-gradient-to-r data-[state=active]:from-cyan-500 data-[state=active]:to-teal-500 data-[state=active]:text-white">
            <CreditCard className="w-4 h-4 mr-2" />
            Pagamentos
          </TabsTrigger>
          <TabsTrigger value="notas" className="data-[state=active]:bg-gradient-to-r data-[state=active]:from-cyan-500 data-[state=active]:to-teal-500 data-[state=active]:text-white">
            <Receipt className="w-4 h-4 mr-2" />
            Notas Fiscais
          </TabsTrigger>
        </TabsList>

        <TabsContent value="gestao-pacientes">
          <GestaoFinanceiraPacientes
            pacientes={pacientes}
            pagamentos={pagamentos}
            notasFiscais={notasFiscais}
          />
        </TabsContent>

        <TabsContent value="pagamentos">
          <PagamentosTab pagamentos={pagamentos} />
        </TabsContent>

        <TabsContent value="notas">
          <NotasFiscaisTab notasFiscais={notasFiscais} />
        </TabsContent>
      </Tabs>
    </div>
  );
}