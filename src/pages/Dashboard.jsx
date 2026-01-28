
import React, { useState, useEffect, useMemo } from "react";
import { base44 } from "@/api/base44Client";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Users,
  Calendar,
  DollarSign,
  TrendingUp,
  Activity,
  Clock,
  CheckCircle2,
  Filter,
  CalendarDays,
  AlertCircle,
  CreditCard,
  FileSignature
} from "lucide-react";
import {
  format,
  startOfWeek,
  endOfWeek,
  startOfMonth,
  endOfMonth,
  startOfYear,
  endOfYear,
  isWithinInterval,
  parseISO,
  differenceInYears,
  addMonths,
  isPast
} from "date-fns";
import { ptBR } from "date-fns/locale";
import {
  LineChart,
  Line,
  BarChart,
  Bar,
  PieChart as RechartsPieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer
} from "recharts";
import { Link } from "react-router-dom";
import { createPageUrl } from "@/utils";
import { getDadosFinanceirosPacienteHelper } from "@/utils/financeiroUtils";

import { useAuth } from "@/lib/AuthContext";

export default function Dashboard() {
  const { user } = useAuth();
  const [periodoFiltro, setPeriodoFiltro] = useState('mensal');
  const [showCustomDialog, setShowCustomDialog] = useState(false);
  const [dataInicio, setDataInicio] = useState('');
  const [dataFim, setDataFim] = useState('');
  const [periodoCustomizado, setPeriodoCustomizado] = useState(null);
  // ...

  const { data: pacientes = [] } = useQuery({
    queryKey: ['pacientes'],
    queryFn: () => base44.entities.Paciente.list(),
  });

  const { data: agendamentos = [] } = useQuery({
    queryKey: ['agendamentos'],
    queryFn: () => base44.entities.Agendamento.list('-data'),
  });

  const { data: pagamentos = [] } = useQuery({
    queryKey: ['pagamentos'],
    queryFn: () => base44.entities.Pagamento.list('-data_vencimento'),
  });

  const { data: evolucoes = [] } = useQuery({
    queryKey: ['evolucoes'],
    queryFn: () => base44.entities.Evolucao.list('-data_atendimento'),
  });

  const { data: contratos = [] } = useQuery({
    queryKey: ['contratos'],
    queryFn: () => base44.entities.Contrato.list('-created_date'),
  });

  const { inicio, fim } = useMemo(() => {
    const hoje = new Date();

    if (periodoCustomizado) {
      return { inicio: new Date(periodoCustomizado.inicio), fim: new Date(periodoCustomizado.fim) };
    }

    switch (periodoFiltro) {
      case 'semanal':
        return { inicio: startOfWeek(hoje, { weekStartsOn: 1 }), fim: endOfWeek(hoje, { weekStartsOn: 1 }) };
      case 'mensal':
        return { inicio: startOfMonth(hoje), fim: endOfMonth(hoje) };
      case 'anual':
        return { inicio: startOfYear(hoje), fim: endOfYear(hoje) };
      default:
        return { inicio: startOfMonth(hoje), fim: endOfMonth(hoje) };
    }
  }, [periodoFiltro, periodoCustomizado]);

  const handleAplicarPeriodo = () => {
    if (dataInicio && dataFim) {
      setPeriodoCustomizado({ inicio: dataInicio, fim: dataFim });
      setPeriodoFiltro('customizado');
      setShowCustomDialog(false);
    }
  };

  const dadosFiltrados = useMemo(() => {
    const agendamentosFiltrados = agendamentos.filter(a => {
      if (!a.data) return false;
      const data = parseISO(a.data);
      return isWithinInterval(data, { start: inicio, end: fim });
    });

    const pagamentosFiltrados = pagamentos.filter(p => {
      if (!p.data_vencimento) return false;
      const data = new Date(p.data_vencimento);
      return isWithinInterval(data, { start: inicio, end: fim });
    });

    const evolucoesFiltradas = evolucoes.filter(e => {
      if (!e.data_atendimento) return false;
      const data = parseISO(e.data_atendimento);
      return isWithinInterval(data, { start: inicio, end: fim });
    });

    return {
      agendamentos: agendamentosFiltrados,
      pagamentos: pagamentosFiltrados,
      evolucoes: evolucoesFiltradas
    };
  }, [agendamentos, pagamentos, evolucoes, inicio, fim]);

  // PAGAMENTOS PENDENTES (TODOS)
  const pagamentosPendentes = useMemo(() => {
    return pagamentos.filter(p =>
      p.status === 'pendente' || p.status === 'parcial' || p.status === 'atrasado'
    );
  }, [pagamentos]);

  const pagamentosAtrasados = useMemo(() => {
    return pagamentos.filter(p => {
      if (p.status === 'pago' || p.status === 'cancelado') return false;
      if (!p.data_vencimento) return false;
      return isPast(new Date(p.data_vencimento));
    });
  }, [pagamentos]);

  const totalPendente = pagamentosPendentes.reduce((acc, p) =>
    acc + (p.valor - (p.valor_pago || 0)), 0
  );

  const totalAtrasado = pagamentosAtrasados.reduce((acc, p) =>
    acc + (p.valor - (p.valor_pago || 0)), 0
  );

  const pacientesAtivos = useMemo(() => {
    const pacientesComAtendimento = new Set();
    dadosFiltrados.agendamentos.forEach(a => {
      if (a.status === 'concluido' || a.status === 'em_atendimento') {
        pacientesComAtendimento.add(a.paciente_id);
      }
    });
    dadosFiltrados.evolucoes.forEach(e => {
      pacientesComAtendimento.add(e.paciente_id);
    });
    return pacientesComAtendimento.size;
  }, [dadosFiltrados]);

  const contasFinanceiras = useMemo(() => {
    const receber = dadosFiltrados.pagamentos
      .filter(p => p.status === 'pendente' || p.status === 'parcial')
      .reduce((acc, p) => acc + (p.valor - (p.valor_pago || 0)), 0);

    const recebido = dadosFiltrados.pagamentos
      .filter(p => p.status === 'pago')
      .reduce((acc, p) => acc + (p.valor_pago || p.valor || 0), 0);

    return { receber, recebido, total: receber + recebido };
  }, [dadosFiltrados]);

  const atendimentosRealizados = dadosFiltrados.evolucoes.length;

  const agendamentosPorStatus = useMemo(() => {
    const contagem = {};
    dadosFiltrados.agendamentos.forEach(a => {
      contagem[a.status] = (contagem[a.status] || 0) + 1;
    });
    return Object.entries(contagem).map(([status, count]) => ({
      name: status === 'agendado' ? 'Agendado' :
        status === 'confirmado' ? 'Confirmado' :
          status === 'em_atendimento' ? 'Em Atendimento' :
            status === 'concluido' ? 'Concluído' :
              status === 'cancelado' ? 'Cancelado' : 'Faltou',
      value: count
    }));
  }, [dadosFiltrados]);

  const demograficos = useMemo(() => {
    const pacientesAtendidos = new Set();
    dadosFiltrados.agendamentos.forEach(a => pacientesAtendidos.add(a.paciente_id));
    dadosFiltrados.evolucoes.forEach(e => pacientesAtendidos.add(e.paciente_id));

    const pacientesAtivos = pacientes.filter(p => pacientesAtendidos.has(p.id));

    const porFaixaEtaria = {
      '0-18': 0,
      '19-30': 0,
      '31-45': 0,
      '46-60': 0,
      '60+': 0
    };

    pacientesAtivos.forEach(p => {
      if (p.data_nascimento) {
        const idade = differenceInYears(new Date(), new Date(p.data_nascimento));
        if (idade <= 18) porFaixaEtaria['0-18']++;
        else if (idade <= 30) porFaixaEtaria['19-30']++;
        else if (idade <= 45) porFaixaEtaria['31-45']++;
        else if (idade <= 60) porFaixaEtaria['46-60']++;
        else porFaixaEtaria['60+']++;
      }
    });

    return {
      faixaEtaria: Object.entries(porFaixaEtaria).map(([name, value]) => ({ name, value }))
    };
  }, [pacientes, dadosFiltrados]);

  const previsaoPagamentos = useMemo(() => {
    const hoje = new Date();

    const calcularPrevisao = (mesesAFrente) => {
      const dataInicio = hoje;
      const dataFim = addMonths(hoje, mesesAFrente);

      const pagamentosFuturos = pagamentos.filter(p => {
        if (!p.data_vencimento) return false;
        const data = new Date(p.data_vencimento);
        return isWithinInterval(data, { start: dataInicio, end: dataFim });
      });

      let receber = pagamentosFuturos
        .filter(p => p.status !== 'pago' && p.status !== 'cancelado')
        .reduce((acc, p) => acc + (p.valor - (p.valor_pago || 0)), 0);

      // Adicionar previsão de contratos mensais ativos
      const contratosAtivos = contratos.filter(c =>
        c.status === 'ativo' &&
        c.forma_pagamento === 'mensal' &&
        c.valor_mensal > 0
      );

      const receitaContratos = contratosAtivos.reduce((acc, c) =>
        acc + (c.valor_mensal * mesesAFrente), 0
      );

      return receber + receitaContratos;
    };

    return {
      proximoMes: calcularPrevisao(1),
      trimestre: calcularPrevisao(3),
      semestre: calcularPrevisao(6),
      ano: calcularPrevisao(12)
    };
  }, [pagamentos, contratos]);

  const dadosEvolucaoAtendimentos = useMemo(() => {
    const dados = {};

    dadosFiltrados.evolucoes.forEach(e => {
      const mes = format(parseISO(e.data_atendimento), 'MMM/yy', { locale: ptBR });
      dados[mes] = (dados[mes] || 0) + 1;
    });

    return Object.entries(dados).map(([mes, quantidade]) => ({
      mes,
      atendimentos: quantidade
    }));
  }, [dadosFiltrados]);

  const dadosReceita = useMemo(() => {
    const dados = {};

    dadosFiltrados.pagamentos
      .filter(p => p.status === 'pago')
      .forEach(p => {
        const mes = format(new Date(p.data_pagamento || p.data_vencimento), 'MMM/yy', { locale: ptBR });
        dados[mes] = (dados[mes] || 0) + (p.valor_pago || p.valor || 0);
      });

    return Object.entries(dados).map(([mes, valor]) => ({
      mes,
      receita: valor
    }));
  }, [dadosFiltrados]);

  const COLORS = ['#06b6d4', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#ec4899'];

  const statCards = [
    {
      title: "Pacientes Ativos",
      value: pacientesAtivos,
      icon: Users,
      color: "from-blue-500 to-cyan-500",
      bgColor: "bg-blue-50",
      iconColor: "text-blue-600"
    },
    {
      title: "Atendimentos Realizados",
      value: atendimentosRealizados,
      icon: Activity,
      color: "from-teal-500 to-emerald-500",
      bgColor: "bg-teal-50",
      iconColor: "text-teal-600"
    },
    {
      title: "Receita do Período",
      value: `R$ ${contasFinanceiras.recebido.toFixed(2)}`,
      icon: DollarSign,
      color: "from-green-500 to-emerald-500",
      bgColor: "bg-green-50",
      iconColor: "text-green-600"
    },
    {
      title: "A Receber (Período)",
      value: `R$ ${contasFinanceiras.receber.toFixed(2)}`,
      icon: TrendingUp,
      color: "from-amber-500 to-orange-500",
      bgColor: "bg-amber-50",
      iconColor: "text-amber-600"
    }
  ];

  return (
    <div className="p-6 md:p-8 space-y-6">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold text-slate-800">
            Olá, {user?.full_name?.split(' ')[0] || 'Usuário'}! 👋
          </h1>
          <p className="text-slate-500 mt-1">
            {periodoCustomizado ?
              `${format(inicio, "dd/MM/yyyy")} - ${format(fim, "dd/MM/yyyy")}` :
              format(new Date(), "EEEE, d 'de' MMMM 'de' yyyy", { locale: ptBR })
            }
          </p>
        </div>

        <div className="flex gap-2 flex-wrap">
          <Tabs value={periodoFiltro} onValueChange={(val) => {
            if (val === 'customizado') {
              setShowCustomDialog(true);
            } else {
              setPeriodoFiltro(val);
              setPeriodoCustomizado(null);
            }
          }}>
            <TabsList className="bg-white border shadow-sm">
              <TabsTrigger value="semanal">Semanal</TabsTrigger>
              <TabsTrigger value="mensal">Mensal</TabsTrigger>
              <TabsTrigger value="anual">Anual</TabsTrigger>
              <TabsTrigger value="customizado">
                <Filter className="w-4 h-4 mr-1" />
                Personalizado
              </TabsTrigger>
            </TabsList>
          </Tabs>
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

      {(pagamentosPendentes.length > 0 || pagamentosAtrasados.length > 0) && (
        <div className="grid md:grid-cols-2 gap-6">
          <Link to={createPageUrl("Financeiro")}>
            <Card className="border-l-4 border-l-amber-500 shadow-lg hover:shadow-xl transition-all cursor-pointer h-full">
              <CardHeader className="bg-gradient-to-r from-amber-50 to-orange-50">
                <CardTitle className="flex items-center gap-2 text-amber-800">
                  <CreditCard className="w-5 h-5" />
                  Pagamentos Pendentes
                </CardTitle>
              </CardHeader>
              <CardContent className="p-6">
                <div className="flex items-center justify-between mb-4">
                  <div>
                    <p className="text-sm text-slate-500">Total a Receber</p>
                    <p className="text-3xl font-bold text-amber-600">
                      R$ {totalPendente.toFixed(2)}
                    </p>
                  </div>
                  <div className="w-16 h-16 rounded-full bg-amber-100 flex items-center justify-center">
                    <span className="text-2xl font-bold text-amber-700">
                      {pagamentosPendentes.length}
                    </span>
                  </div>
                </div>
                <div className="text-xs text-slate-500">
                  {pagamentosPendentes.length} pagamento(s) aguardando quitação
                </div>
              </CardContent>
            </Card>
          </Link>

          {pagamentosAtrasados.length > 0 && (
            <Link to={createPageUrl("Financeiro")}>
              <Card className="border-l-4 border-l-red-500 shadow-lg hover:shadow-xl transition-all cursor-pointer h-full">
                <CardHeader className="bg-gradient-to-r from-red-50 to-rose-50">
                  <CardTitle className="flex items-center gap-2 text-red-800">
                    <AlertCircle className="w-5 h-5" />
                    Pagamentos Atrasados
                  </CardTitle>
                </CardHeader>
                <CardContent className="p-6">
                  <div className="flex items-center justify-between mb-4">
                    <div>
                      <p className="text-sm text-slate-500">Total em Atraso</p>
                      <p className="text-3xl font-bold text-red-600">
                        R$ {totalAtrasado.toFixed(2)}
                      </p>
                    </div>
                    <div className="w-16 h-16 rounded-full bg-red-100 flex items-center justify-center">
                      <span className="text-2xl font-bold text-red-700">
                        {pagamentosAtrasados.length}
                      </span>
                    </div>
                  </div>
                  <div className="text-xs text-red-600 font-medium">
                    ⚠️ Requer atenção imediata!
                  </div>
                </CardContent>
              </Card>
            </Link>
          )}
        </div>
      )}

      {pagamentosAtrasados.length > 0 && (
        <Card className="border-none shadow-lg border-l-4 border-l-red-500">
          <CardHeader className="bg-red-50">
            <CardTitle className="flex items-center gap-2 text-red-800">
              <AlertCircle className="w-5 h-5" />
              Pagamentos Atrasados - Ação Necessária ({pagamentosAtrasados.length})
            </CardTitle>
          </CardHeader>
          <CardContent className="p-6">
            <div className="space-y-3">
              {pagamentosAtrasados.slice(0, 5).map((pagamento) => {
                const diasAtraso = Math.floor(
                  (new Date().getTime() - new Date(pagamento.data_vencimento).getTime()) / (1000 * 60 * 60 * 24)
                );

                return (
                  <div
                    key={pagamento.id}
                    className="flex items-center justify-between p-4 bg-red-50 rounded-lg border border-red-200 hover:bg-red-100 transition-all"
                  >
                    <div className="flex-1">
                      <p className="font-semibold text-slate-800">
                        {pagamento.paciente_nome}
                      </p>
                      <p className="text-sm text-slate-600">
                        Vencimento: {format(new Date(pagamento.data_vencimento), "dd/MM/yyyy")}
                      </p>
                      <p className="text-xs text-red-600 font-medium mt-1">
                        {diasAtraso} dia(s) em atraso
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="text-xl font-bold text-red-700">
                        R$ {(pagamento.valor - (pagamento.valor_pago || 0)).toFixed(2)}
                      </p>
                      {pagamento.telefone && (
                        <p className="text-xs text-slate-500 mt-1">
                          {pagamento.telefone}
                        </p>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
            {pagamentosAtrasados.length > 5 && (
              <Link to={createPageUrl("Financeiro")}>
                <Button className="w-full mt-4" variant="outline">
                  Ver Todos os {pagamentosAtrasados.length} Pagamentos Atrasados
                </Button>
              </Link>
            )}
          </CardContent>
        </Card>
      )}

      <div className="grid lg:grid-cols-2 gap-6">
        <Card className="border-none shadow-lg">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-slate-800">
              <Activity className="w-5 h-5 text-cyan-600" />
              Atendimentos Realizados
            </CardTitle>
          </CardHeader>
          <CardContent>
            {dadosEvolucaoAtendimentos.length === 0 ? (
              <div className="h-64 flex items-center justify-center text-slate-400">
                Nenhum dado disponível para o período
              </div>
            ) : (
              <ResponsiveContainer width="100%" height={300}>
                <LineChart data={dadosEvolucaoAtendimentos}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="mes" />
                  <YAxis />
                  <Tooltip />
                  <Legend />
                  <Line type="monotone" dataKey="atendimentos" stroke="#06b6d4" strokeWidth={2} />
                </LineChart>
              </ResponsiveContainer>
            )}
          </CardContent>
        </Card>

        <Card className="border-none shadow-lg">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-slate-800">
              <TrendingUp className="w-5 h-5 text-green-600" />
              Receita do Período
            </CardTitle>
          </CardHeader>
          <CardContent>
            {dadosReceita.length === 0 ? (
              <div className="h-64 flex items-center justify-center text-slate-400">
                Nenhum dado disponível para o período
              </div>
            ) : (
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={dadosReceita}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="mes" />
                  <YAxis />
                  <Tooltip formatter={(value) => `R$ ${value.toFixed(2)}`} />
                  <Legend />
                  <Bar dataKey="receita" fill="#10b981" />
                </BarChart>
              </ResponsiveContainer>
            )}
          </CardContent>
        </Card>
      </div>

      <div className="grid lg:grid-cols-3 gap-6">
        <Card className="border-none shadow-lg">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-slate-800">
              <CalendarDays className="w-5 h-5 text-purple-600" />
              Agendamentos por Status
            </CardTitle>
          </CardHeader>
          <CardContent>
            {agendamentosPorStatus.length === 0 ? (
              <div className="h-64 flex items-center justify-center text-slate-400">
                Nenhum dado disponível
              </div>
            ) : (
              <ResponsiveContainer width="100%" height={300}>
                <RechartsPieChart>
                  <Pie
                    data={agendamentosPorStatus}
                    cx="50%"
                    cy="50%"
                    labelLine={false}
                    label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                    outerRadius={80}
                    fill="#8884d8"
                    dataKey="value"
                  >
                    {agendamentosPorStatus.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip />
                </RechartsPieChart>
              </ResponsiveContainer>
            )}
          </CardContent>
        </Card>

        <Card className="border-none shadow-lg">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-slate-800">
              <Users className="w-5 h-5 text-blue-600" />
              Distribuição por Faixa Etária
            </CardTitle>
          </CardHeader>
          <CardContent>
            {demograficos.faixaEtaria.every(d => d.value === 0) ? (
              <div className="h-64 flex items-center justify-center text-slate-400">
                Nenhum dado disponível
              </div>
            ) : (
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={demograficos.faixaEtaria}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="name" />
                  <YAxis />
                  <Tooltip />
                  <Bar dataKey="value" fill="#3b82f6" />
                </BarChart>
              </ResponsiveContainer>
            )}
          </CardContent>
        </Card>

        <Card className="border-none shadow-lg">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-slate-800">
              <DollarSign className="w-5 h-5 text-green-600" />
              Previsão de Recebimentos
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex justify-between items-center p-3 bg-slate-50 rounded-lg">
                <div>
                  <p className="text-xs text-slate-500 font-medium">Próximo Mês</p>
                  <p className="text-lg font-bold text-slate-800">
                    R$ {previsaoPagamentos.proximoMes.toFixed(2)}
                  </p>
                </div>
                <CalendarDays className="w-8 h-8 text-slate-400" />
              </div>

              <div className="flex justify-between items-center p-3 bg-blue-50 rounded-lg">
                <div>
                  <p className="text-xs text-blue-600 font-medium">Trimestre (3 meses)</p>
                  <p className="text-lg font-bold text-blue-800">
                    R$ {previsaoPagamentos.trimestre.toFixed(2)}
                  </p>
                </div>
                <Calendar className="w-8 h-8 text-blue-400" />
              </div>

              <div className="flex justify-between items-center p-3 bg-teal-50 rounded-lg">
                <div>
                  <p className="text-xs text-teal-600 font-medium">Semestre (6 meses)</p>
                  <p className="text-lg font-bold text-teal-800">
                    R$ {previsaoPagamentos.semestre.toFixed(2)}
                  </p>
                </div>
                <TrendingUp className="w-8 h-8 text-teal-400" />
              </div>

              <div className="flex justify-between items-center p-3 bg-green-50 rounded-lg">
                <div>
                  <p className="text-xs text-green-600 font-medium">Ano (12 meses)</p>
                  <p className="text-lg font-bold text-green-800">
                    R$ {previsaoPagamentos.ano.toFixed(2)}
                  </p>
                </div>
                <DollarSign className="w-8 h-8 text-green-400" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* --- NOVO DASHBOARD FINANCEIRO DETALHADO --- */}
      <div className="mt-8">
        <h2 className="text-2xl font-bold text-slate-800 mb-6 flex items-center gap-2">
          <DollarSign className="w-6 h-6 text-emerald-600" />
          Visão Financeira Detalhada
        </h2>

        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
          {(() => {
            // CÁLCULOS FINANCEIROS (Unificado com GestaoFinanceiraPacientes)

            const dadosFinanceiros = useMemo(() => {
              const hoje = new Date();
              return pacientes.map(p =>
                getDadosFinanceirosPacienteHelper(p, contratos, evolucoes, pagamentos, [], hoje)
              );
            }, [pacientes, contratos, evolucoes, pagamentos]);

            const valorContratadoGeral = dadosFinanceiros.reduce((acc, d) => acc + d.valorContratado, 0);

            // Valor Devido Geral agora inclui dívidas implícitas (calculadas) e explícitas (boletos)
            // Filtrando apenas o que é realmente devido (pendente ou atrasado)
            const valorDevidoGeral = dadosFinanceiros.reduce((acc, d) => acc + d.valorDevidoReal, 0);

            // PIE CHART: STATUS DE PAGAMENTO (Por Valor)
            // Agregando valores pagos vs devidos
            const statusPagamentoData = (() => {
              let pago = 0;
              let pendente = 0;
              let atrasado = 0;

              dadosFinanceiros.forEach(d => {
                // Soma tudo que já foi pago
                pago += d.valorPagoReal;

                // Soma o restante devido baseado no status
                if (d.valorDevidoReal > 0) {
                  if (d.statusPagamento === 'atrasado') {
                    atrasado += d.valorDevidoReal;
                  } else {
                    pendente += d.valorDevidoReal;
                  }
                }
              });

              return [
                { name: 'Pago', value: pago, color: '#10b981' },
                { name: 'Pendente', value: pendente, color: '#f59e0b' },
                { name: 'Atrasado', value: atrasado, color: '#ef4444' },
              ].filter(item => item.value > 0);
            })();

            // BAR CHART: VENCIMENTOS POR DATA (Próximos 30 dias ou período filtrado)
            // Mantendo lógica original de varredura de pagamentos para previsão futura detalhada,
            // mas apenas para boletos existentes, pois "calculado" não tem data de vencimento fixa no banco ainda (assume-se hoje ou fim do mês).
            // Se quisermos incluir o valor calculado no gráfico, assumimos vencimento hoje/fim do mês.
            const vencimentosPorData = (() => {
              const dados = {};

              // 1. Pagamentos explícitos
              pagamentos
                .filter(p => ['pendente', 'parcial', 'atrasado'].includes(p.status) && p.data_vencimento)
                .forEach(p => {
                  const data = new Date(p.data_vencimento);
                  const diaMes = format(data, 'dd/MM', { locale: ptBR });
                  dados[diaMes] = (dados[diaMes] || 0) + (Number(p.valor || 0) - Number(p.valor_pago || 0));
                });

              // 2. Valores calculados (Implícitos) - Assumimos vencimento para o dia atual ou fim do mês?
              // Para consistência visual, vamos agrupar no final do mês atual ou 'HOJE'.
              // Vamos colocar no dia atual para alerta.
              const hojeStr = format(new Date(), 'dd/MM', { locale: ptBR });

              dadosFinanceiros.forEach(d => {
                // Se é calculado e não tem pagamento gerado
                if (d.valorDevidoReal > 0 && !d.pagamento && d.statusPagamento !== 'pago') {
                  dados[hojeStr] = (dados[hojeStr] || 0) + d.valorDevidoReal;
                }
              });

              return Object.entries(dados)
                .map(([name, value]) => ({ name, value }))
                .sort((a, b) => {
                  const [da, ma] = a.name.split('/').map(Number);
                  const [db, mb] = b.name.split('/').map(Number);
                  if (ma !== mb) return ma - mb;
                  return da - db;
                })
                .slice(0, 10);
            })();

            return (
              <>
                <Card className="border-none shadow-lg bg-gradient-to-br from-emerald-50 to-teal-50">
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm font-medium text-emerald-800 flex items-center gap-2">
                      <FileSignature className="w-4 h-4" />
                      Valor Contratado (Mês Atual)
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold text-emerald-900">
                      R$ {valorContratadoGeral.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                    </div>
                    <p className="text-xs text-emerald-600 mt-1 opacity-80">
                      Total base mensal dos contratos ativos
                    </p>
                  </CardContent>
                </Card>

                <Card className="border-none shadow-lg bg-gradient-to-br from-red-50 to-orange-50">
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm font-medium text-red-800 flex items-center gap-2">
                      <AlertCircle className="w-4 h-4" />
                      Valor Devido Geral
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold text-red-900">
                      R$ {valorDevidoGeral.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                    </div>
                    <p className="text-xs text-red-600 mt-1 opacity-80">
                      Total pendente (Boletos + Serviços)
                    </p>
                  </CardContent>
                </Card>

                {/* ... charts ... */}


                <Card className="border-none shadow-lg md:col-span-2 lg:col-span-1">
                  <CardHeader className="pb-2">
                    <CardTitle className="text-slate-800 text-sm font-medium">Status de Pagamento (Valor)</CardTitle>
                  </CardHeader>
                  <CardContent className="h-[200px] flex items-center justify-center">
                    <ResponsiveContainer width="100%" height="100%">
                      <RechartsPieChart>
                        <Pie
                          data={statusPagamentoData}
                          cx="50%"
                          cy="50%"
                          innerRadius={40}
                          outerRadius={70}
                          paddingAngle={5}
                          dataKey="value"
                        >
                          {statusPagamentoData.map((entry, index) => (
                            <Cell key={`cell-${index}`} fill={entry.color} />
                          ))}
                        </Pie>
                        <Tooltip formatter={(value) => `R$ ${Number(value).toFixed(2)}`} />
                        <Legend layout="horizontal" verticalAlign="bottom" align="center" iconSize={8} wrapperStyle={{ fontSize: '10px' }} />
                      </RechartsPieChart>
                    </ResponsiveContainer>
                  </CardContent>
                </Card>

                <Card className="border-none shadow-lg md:col-span-2 lg:col-span-1">
                  <CardHeader className="pb-2">
                    <CardTitle className="text-slate-800 text-sm font-medium">Próximos Vencimentos</CardTitle>
                  </CardHeader>
                  <CardContent className="h-[200px]">
                    {vencimentosPorData.length > 0 ? (
                      <ResponsiveContainer width="100%" height="100%">
                        <BarChart data={vencimentosPorData} margin={{ top: 5, right: 5, bottom: 5, left: -20 }}>
                          <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
                          <XAxis dataKey="name" fontSize={10} tickLine={false} axisLine={false} />
                          <YAxis fontSize={10} tickLine={false} axisLine={false} tickFormatter={(val) => `R$${val / 1000}k`} />
                          <Tooltip
                            formatter={(value) => `R$ ${Number(value).toFixed(2)}`}
                            cursor={{ fill: '#f8fafc' }}
                            contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                          />
                          <Bar dataKey="value" fill="#6366f1" radius={[4, 4, 0, 0]} barSize={20}>
                            {vencimentosPorData.map((entry, index) => (
                              <Cell key={`cell-${index}`} fill={index % 2 === 0 ? '#6366f1' : '#818cf8'} />
                            ))}
                          </Bar>
                        </BarChart>
                      </ResponsiveContainer>
                    ) : (
                      <div className="h-full flex flex-col items-center justify-center text-slate-400 gap-2">
                        <CheckCircle2 className="w-8 h-8 text-green-100" />
                        <span className="text-xs">Nenhum vencimento próximo</span>
                      </div>
                    )}
                  </CardContent>
                </Card>
              </>
            );
          })()}
        </div>
      </div>

      <Dialog open={showCustomDialog} onOpenChange={setShowCustomDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Selecionar Período Personalizado</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 pt-4">
            <div className="space-y-2">
              <Label>Data Início</Label>
              <Input
                type="date"
                value={dataInicio}
                onChange={(e) => setDataInicio(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label>Data Fim</Label>
              <Input
                type="date"
                value={dataFim}
                onChange={(e) => setDataFim(e.target.value)}
              />
            </div>
            <div className="flex justify-end gap-3">
              <Button variant="outline" onClick={() => setShowCustomDialog(false)}>
                Cancelar
              </Button>
              <Button
                onClick={handleAplicarPeriodo}
                className="bg-gradient-to-r from-cyan-500 to-teal-500"
              >
                Aplicar
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
