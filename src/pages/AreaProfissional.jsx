import React, { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Link } from "react-router-dom";
import { createPageUrl } from "@/utils";
import {
  Calendar,
  FileText,
  Activity,
  Clock,
  CheckCircle,
  AlertCircle,
  Users,
  Stethoscope,
  ClipboardList
} from "lucide-react";
import { format, parseISO, isFuture, isToday } from "date-fns";
import { ptBR } from "date-fns/locale";

export default function AreaProfissional() {
  const [user, setUser] = useState(null);

  useEffect(() => {
    const loadUser = async () => {
      try {
        const userData = await base44.auth.me();
        setUser(userData);
      } catch (error) {
        console.error("Error loading user:", error);
      }
    };
    loadUser();
  }, []);

  const { data: agendamentos = [] } = useQuery({
    queryKey: ['agendamentos-profissional'],
    queryFn: () => base44.entities.Agendamento.list('-data'),
  });

  const { data: evolucoes = [] } = useQuery({
    queryKey: ['evolucoes-profissional'],
    queryFn: () => base44.entities.Evolucao.list('-data_atendimento'),
  });

  const { data: atividades = [] } = useQuery({
    queryKey: ['atividades-profissional'],
    queryFn: () => base44.entities.Atividade.list('-created_date'),
  });

  const agendamentosHoje = agendamentos.filter(a => 
    a.data && isToday(parseISO(a.data))
  );

  const agendamentosProximos = agendamentos.filter(a => 
    a.data && isFuture(parseISO(a.data)) && !isToday(parseISO(a.data))
  ).slice(0, 5);

  const atividadesPendentes = atividades.filter(a => 
    a.status === 'pendente' || a.status === 'em_andamento'
  );

  const atendimentosMes = evolucoes.filter(e => {
    if (!e.data_atendimento) return false;
    const data = parseISO(e.data_atendimento);
    const hoje = new Date();
    return data.getMonth() === hoje.getMonth() && data.getFullYear() === hoje.getFullYear();
  }).length;

  const statCards = [
    {
      title: "Atendimentos Hoje",
      value: agendamentosHoje.length,
      icon: Calendar,
      color: "from-blue-500 to-cyan-500",
      bgColor: "bg-blue-50",
      iconColor: "text-blue-600",
      link: createPageUrl("Agenda")
    },
    {
      title: "Atendimentos do Mês",
      value: atendimentosMes,
      icon: Activity,
      color: "from-green-500 to-emerald-500",
      bgColor: "bg-green-50",
      iconColor: "text-green-600",
      link: createPageUrl("Prontuarios")
    },
    {
      title: "Atividades Pendentes",
      value: atividadesPendentes.length,
      icon: ClipboardList,
      color: "from-amber-500 to-orange-500",
      bgColor: "bg-amber-50",
      iconColor: "text-amber-600",
      link: createPageUrl("Atividades")
    },
    {
      title: "Próximos Atendimentos",
      value: agendamentosProximos.length,
      icon: Clock,
      color: "from-purple-500 to-indigo-500",
      bgColor: "bg-purple-50",
      iconColor: "text-purple-600",
      link: createPageUrl("Agenda")
    }
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-green-50/30 to-emerald-50/20 p-6">
      <div className="max-w-7xl mx-auto space-y-6">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          <div>
            <h1 className="text-3xl font-bold text-slate-800">
              Área do Profissional 🩺
            </h1>
            <p className="text-slate-500 mt-1">
              Painel de atendimentos e prontuários
            </p>
          </div>
          <Button
            onClick={() => base44.auth.logout()}
            variant="outline"
            className="border-red-200 text-red-600 hover:bg-red-50"
          >
            Sair
          </Button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {statCards.map((stat, index) => (
            <Link key={index} to={stat.link}>
              <Card className="relative overflow-hidden border-none shadow-lg hover:shadow-xl transition-all duration-300 bg-white cursor-pointer">
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
            </Link>
          ))}
        </div>

        <Card className="border-none shadow-lg">
          <CardHeader className="bg-gradient-to-r from-green-500 to-emerald-500 text-white rounded-t-lg">
            <CardTitle className="flex items-center gap-2">
              <Stethoscope className="w-5 h-5" />
              Atendimentos de Hoje ({agendamentosHoje.length})
            </CardTitle>
          </CardHeader>
          <CardContent className="p-6">
            {agendamentosHoje.length === 0 ? (
              <div className="text-center py-8 text-slate-400">
                <Calendar className="w-12 h-12 mx-auto mb-2 opacity-50" />
                <p>Nenhum atendimento para hoje</p>
              </div>
            ) : (
              <div className="space-y-3">
                {agendamentosHoje.map((agendamento) => (
                  <div
                    key={agendamento.id}
                    className="flex items-center justify-between p-4 bg-slate-50 rounded-lg border hover:shadow-md transition-all"
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-12 h-12 rounded-full bg-gradient-to-br from-green-500 to-emerald-500 flex items-center justify-center text-white font-bold text-sm">
                        {agendamento.horario}
                      </div>
                      <div>
                        <p className="font-semibold text-slate-800">
                          {agendamento.paciente_nome}
                        </p>
                        <p className="text-sm text-slate-600">
                          {agendamento.tipo_consulta === 'primeira_vez' ? 'Primeira consulta' : 
                           agendamento.tipo_consulta === 'retorno' ? 'Retorno' : 
                           agendamento.tipo_consulta}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      {agendamento.status === 'confirmado' ? (
                        <CheckCircle className="w-5 h-5 text-green-600" />
                      ) : agendamento.status === 'agendado' ? (
                        <Clock className="w-5 h-5 text-amber-600" />
                      ) : (
                        <AlertCircle className="w-5 h-5 text-red-600" />
                      )}
                      <Button size="sm" variant="outline">
                        Atender
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        <div className="grid md:grid-cols-2 gap-6">
          <Card className="border-none shadow-lg">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Clock className="w-5 h-5 text-purple-600" />
                Próximos Atendimentos
              </CardTitle>
            </CardHeader>
            <CardContent>
              {agendamentosProximos.length === 0 ? (
                <div className="text-center py-8 text-slate-400">
                  <Calendar className="w-12 h-12 mx-auto mb-2 opacity-50" />
                  <p>Nenhum atendimento futuro</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {agendamentosProximos.map((agendamento) => (
                    <div
                      key={agendamento.id}
                      className="flex items-center justify-between p-3 bg-slate-50 rounded-lg border text-sm"
                    >
                      <div>
                        <p className="font-semibold text-slate-800">
                          {agendamento.paciente_nome}
                        </p>
                        <p className="text-xs text-slate-600">
                          {format(parseISO(agendamento.data), "dd/MM/yyyy")} - {agendamento.horario}
                        </p>
                      </div>
                      <span className="text-xs px-2 py-1 bg-blue-100 text-blue-700 rounded-full">
                        {agendamento.tipo_consulta}
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>

          <Card className="border-none shadow-lg border-l-4 border-l-amber-500">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <ClipboardList className="w-5 h-5 text-amber-600" />
                Atividades Pendentes
              </CardTitle>
            </CardHeader>
            <CardContent>
              {atividadesPendentes.length === 0 ? (
                <div className="text-center py-8 text-slate-400">
                  <CheckCircle className="w-12 h-12 mx-auto mb-2 opacity-50" />
                  <p>Nenhuma atividade pendente</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {atividadesPendentes.slice(0, 5).map((atividade) => (
                    <div
                      key={atividade.id}
                      className="flex items-center justify-between p-3 bg-amber-50 rounded-lg border border-amber-200 text-sm"
                    >
                      <div>
                        <p className="font-semibold text-slate-800">
                          {atividade.titulo}
                        </p>
                        <p className="text-xs text-slate-600">
                          {atividade.paciente_nome}
                        </p>
                      </div>
                      <span className={`text-xs px-2 py-1 rounded-full ${
                        atividade.prioridade === 'alta' ? 'bg-red-100 text-red-700' :
                        atividade.prioridade === 'media' ? 'bg-amber-100 text-amber-700' :
                        'bg-blue-100 text-blue-700'
                      }`}>
                        {atividade.prioridade}
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        <Card className="border-none shadow-lg">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <FileText className="w-5 h-5 text-green-600" />
              Últimas Evoluções Registradas
            </CardTitle>
          </CardHeader>
          <CardContent>
            {evolucoes.length === 0 ? (
              <div className="text-center py-8 text-slate-400">
                <FileText className="w-12 h-12 mx-auto mb-2 opacity-50" />
                <p>Nenhuma evolução registrada</p>
              </div>
            ) : (
              <div className="space-y-3">
                {evolucoes.slice(0, 5).map((evolucao) => (
                  <div
                    key={evolucao.id}
                    className="flex items-center justify-between p-3 bg-slate-50 rounded-lg border text-sm"
                  >
                    <div className="flex-1">
                      <p className="font-semibold text-slate-800">
                        {evolucao.paciente_nome}
                      </p>
                      <p className="text-xs text-slate-600 mt-1">
                        {evolucao.queixa?.substring(0, 60)}...
                      </p>
                    </div>
                    <p className="text-xs text-slate-500">
                      {format(parseISO(evolucao.data_atendimento), "dd/MM/yyyy")}
                    </p>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}