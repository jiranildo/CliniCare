import React, { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Link, useNavigate } from "react-router-dom";
import { createPageUrl } from "@/utils";
import AgendamentoModal from "@/components/agendamentos/AgendamentoModal";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Calendar,
  FileText,
  Activity,
  Clock,
  CheckCircle,
  AlertCircle,
  Users,
  Stethoscope,
  ClipboardList,
  Search,
  DollarSign,
  MoreVertical,
  UserCog,
  ArrowRight,
  Eye
} from "lucide-react";
import { format, parseISO, isFuture, isToday } from "date-fns";
import { ptBR } from "date-fns/locale";
import { toast } from "sonner";

export default function AreaProfissional() {
  const [user, setUser] = useState(null);
  const [profissionalId, setProfissionalId] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [showAgendamentoModal, setShowAgendamentoModal] = useState(false);
  const [agendamentoSelecionado, setAgendamentoSelecionado] = useState(null);

  const navigate = useNavigate();
  const queryClient = useQueryClient();

  useEffect(() => {
    const loadUser = async () => {
      try {
        const userData = await base44.auth.me();
        setUser(userData);

        const profs = await base44.entities.Profissional.filter({ email: userData.email });
        if (profs && profs.length > 0) {
          setProfissionalId(profs[0].id);
        }
      } catch (error) {
        console.error("Error loading user:", error);
      }
    };
    loadUser();
  }, []);

  const { data: agendamentos = [] } = useQuery({
    queryKey: ['agendamentos-profissional', profissionalId],
    queryFn: async () => {
      const all = await base44.entities.Agendamento.list('-data');
      if (profissionalId) {
        return all.filter(a => a.profissional_id === profissionalId);
      }
      return all;
    },
    enabled: !!user
  });

  const { data: evolucoes = [] } = useQuery({
    queryKey: ['evolucoes-profissional', profissionalId],
    queryFn: async () => {
      const all = await base44.entities.Evolucao.list('-data_atendimento');
      if (profissionalId) {
        return all.filter(e => e.profissional_id === profissionalId);
      }
      return all;
    },
    enabled: !!user
  });

  const { data: pacientes = [] } = useQuery({
    queryKey: ['pacientes-todos'], // We need all patients to resolve photos
    queryFn: () => base44.entities.Paciente.list('nome_completo'),
    staleTime: 5 * 60 * 1000 // Cache for 5 mins
  });

  const { data: profissionais = [] } = useQuery({
    queryKey: ['profissionais-ativos'],
    queryFn: () => base44.entities.Profissional.list('full_name'),
  });

  const updateStatusMutation = useMutation({
    mutationFn: async ({ id, status }) => {
      return await base44.entities.Agendamento.update(id, { status });
    },
    onSuccess: () => {
      queryClient.invalidateQueries(['agendamentos-profissional']);
      toast.success("Status atualizado!");
    }
  });

  const handleSearchPaciente = (e) => {
    e.preventDefault();
    if (searchTerm.trim()) {
      navigate(createPageUrl("Prontuarios") + `?search=${encodeURIComponent(searchTerm)}`);
    }
  };

  const handleEditarAgendamento = (agendamento) => {
    setAgendamentoSelecionado(agendamento);
    setShowAgendamentoModal(true);
  };

  const handleAtender = (pacienteId) => {
    // Redirect to Prontuarios with patient selected if possible, or just search
    navigate(createPageUrl("Prontuarios") + `?patientId=${pacienteId}`);
  };

  const agendamentosHoje = agendamentos
    .filter(a => a.data && isToday(parseISO(a.data)))
    .map(a => {
      const paciente = pacientes.find(p => p.id === a.paciente_id);
      return {
        ...a,
        paciente_foto: paciente?.foto_url,
        paciente_nome_completo: paciente?.nome_completo || a.paciente_nome,
        paciente_status: paciente?.status
      };
    });

  const agendamentosProximos = agendamentos.filter(a =>
    a.data && isFuture(parseISO(a.data)) && !isToday(parseISO(a.data))
  ).slice(0, 5);

  const atendimentosMes = evolucoes.filter(e => {
    if (!e.data_atendimento) return false;
    const data = parseISO(e.data_atendimento);
    const hoje = new Date();
    return data.getMonth() === hoje.getMonth() && data.getFullYear() === hoje.getFullYear();
  }).length;

  const faturamentoMes = agendamentos.filter(a => {
    if (!a.data || a.status !== 'concluido') return false;
    const data = parseISO(a.data);
    const hoje = new Date();
    return data.getMonth() === hoje.getMonth() && data.getFullYear() === hoje.getFullYear();
  }).reduce((acc, a) => acc + (a.valor || 0), 0);

  const statCards = [
    {
      title: "Confirmados Hoje",
      value: agendamentosHoje.filter(a => a.status === 'confirmado').length,
      icon: CheckCircle,
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
      title: "Próximos Pacientes",
      value: agendamentosProximos.length,
      icon: Users,
      color: "from-purple-500 to-indigo-500",
      bgColor: "bg-purple-50",
      iconColor: "text-purple-600",
      link: createPageUrl("Agenda")
    },
    {
      title: "Faturamento (Est.)",
      value: `R$ ${faturamentoMes.toFixed(0)}`,
      icon: DollarSign,
      color: "from-amber-500 to-yellow-500",
      bgColor: "bg-amber-50",
      iconColor: "text-amber-600",
      link: createPageUrl("Financeiro")
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
          <div className="flex gap-2">
            <Button
              onClick={() => base44.auth.logout()}
              variant="outline"
              className="border-red-200 text-red-600 hover:bg-red-50"
            >
              Sair
            </Button>
          </div>
        </div>

        {/* Search Bar */}
        <Card className="border-none shadow-sm bg-white/50 backdrop-blur-sm">
          <CardContent className="p-4">
            <form onSubmit={handleSearchPaciente} className="flex gap-2">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400 w-4 h-4" />
                <Input
                  placeholder="Buscar prontuário de paciente..."
                  className="pl-9 bg-white"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
              </div>
              <Button type="submit" className="bg-emerald-600 hover:bg-emerald-700 text-white">
                Buscar
              </Button>
            </form>
          </CardContent>
        </Card>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {statCards.map((stat, index) => (
            <Link key={index} to={stat.link}>
              <Card className="relative overflow-hidden border-none shadow-lg hover:shadow-xl transition-all duration-300 bg-white cursor-pointer h-full">
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
              Minha Agenda de Hoje ({agendamentosHoje.length})
            </CardTitle>
          </CardHeader>
          <CardContent className="p-6">
            {agendamentosHoje.length === 0 ? (
              <div className="text-center py-8 text-slate-400">
                <Calendar className="w-12 h-12 mx-auto mb-2 opacity-50" />
                <p>Nenhum atendimento para hoje</p>
              </div>
            ) : (
              <div className="space-y-4">
                {agendamentosHoje.map((agendamento) => (
                  <div
                    key={agendamento.id}
                    className="flex flex-col md:flex-row items-center justify-between p-4 bg-white rounded-xl border border-slate-100 shadow-sm hover:shadow-md transition-all gap-4"
                  >
                    <div className="flex items-center gap-4 w-full md:w-auto">
                      <div className="w-16 h-16 rounded-full bg-gradient-to-br from-green-500 to-emerald-500 flex items-center justify-center text-white font-bold shadow-md shrink-0 overflow-hidden">
                        {agendamento.paciente_foto ? (
                          <img src={agendamento.paciente_foto} alt={agendamento.paciente_nome_completo} className="w-full h-full object-cover" />
                        ) : (
                          <span className="text-xl">{agendamento.horario}</span>
                        )}
                      </div>
                      <div className="flex-1">
                        <div className="flex items-center gap-2">
                          <h3 className="font-bold text-slate-800 text-lg">
                            {agendamento.paciente_nome_completo}
                          </h3>
                          {agendamento.status === 'confirmado' && (
                            <CheckCircle className="w-4 h-4 text-green-500" />
                          )}
                        </div>
                        <p className="text-sm text-slate-500 flex items-center gap-1">
                          <Clock className="w-3 h-3" />
                          Chegada: {agendamento.horario}
                        </p>
                        <p className="text-sm font-medium text-slate-600 mt-1 inline-flex items-center gap-2">
                          <span className="bg-blue-50 text-blue-700 px-2 py-0.5 rounded border border-blue-100">
                            {agendamento.tipo_consulta === 'primeira_vez' ? 'Primeira consulta' :
                              agendamento.tipo_consulta === 'retorno' ? 'Retorno' :
                                agendamento.tipo_consulta}
                          </span>
                        </p>
                      </div>
                    </div>

                    <div className="flex flex-wrap items-center gap-2 w-full md:w-auto justify-end">
                      <Button
                        onClick={() => handleAtender(agendamento.paciente_id)}
                        className="bg-green-600 hover:bg-green-700 text-white shadow-sm flex items-center gap-2"
                      >
                        <Stethoscope className="w-4 h-4" />
                        Atender
                      </Button>

                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" className="h-9 w-9 p-0 rounded-full hover:bg-slate-100">
                            <span className="sr-only">Abrir menu</span>
                            <MoreVertical className="h-4 w-4 text-slate-500" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuLabel>Opções do Paciente</DropdownMenuLabel>

                          <DropdownMenuItem onClick={() => handleEditarAgendamento(agendamento)}>
                            <UserCog className="mr-2 h-4 w-4" />
                            Transferir Profissional
                          </DropdownMenuItem>

                          <DropdownMenuItem onClick={() => navigate(createPageUrl("Prontuarios") + `?patientId=${agendamento.paciente_id}`)}>
                            <FileText className="mr-2 h-4 w-4" />
                            Ver Prontuário
                          </DropdownMenuItem>

                          <DropdownMenuSeparator />

                          <DropdownMenuItem
                            onClick={() => updateStatusMutation.mutate({ id: agendamento.id, status: 'faltou' })}
                            className="text-amber-600 focus:text-amber-700"
                          >
                            <AlertCircle className="mr-2 h-4 w-4" />
                            Marcar como Faltou
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
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

          <Card className="border-none shadow-lg">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <FileText className="w-5 h-5 text-indigo-600" />
                Recentes no Prontuário
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
                  {evolucoes.slice(0, 5).map(ev => (
                    <div key={ev.id} className="p-3 bg-indigo-50/50 rounded-lg border border-indigo-100">
                      <div className="flex justify-between items-start">
                        <span className="font-semibold text-slate-800 text-sm">{ev.paciente_nome}</span>
                        <span className="text-xs text-slate-500">{format(parseISO(ev.data_atendimento), 'dd/MM')}</span>
                      </div>
                      <p className="text-xs text-slate-600 truncate mt-1">
                        {ev.queixa || ev.subjetivo || 'Sem detalhes'}
                      </p>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {showAgendamentoModal && (
          <AgendamentoModal
            agendamento={agendamentoSelecionado}
            pacientes={pacientes}
            profissionais={profissionais}
            onClose={() => setShowAgendamentoModal(false)}
          />
        )}
      </div>
    </div>
  );
}