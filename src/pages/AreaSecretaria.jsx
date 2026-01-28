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
  Users,
  DollarSign,
  Clock,
  CheckCircle,
  AlertCircle,
  Package,
  Phone,
  Mail,
  FileText,
  Search,
  Plus,
  UserPlus,
  MoreVertical,
  UserCog,
  XCircle,
  Check
} from "lucide-react";
import { format, parseISO, isFuture, isToday, isPast } from "date-fns";
import { ptBR } from "date-fns/locale";
import { toast } from "sonner";

export default function AreaSecretaria() {
  const [user, setUser] = useState(null);
  const [showAgendamentoModal, setShowAgendamentoModal] = useState(false);
  const [agendamentoSelecionado, setAgendamentoSelecionado] = useState(null);
  const navigate = useNavigate();
  const queryClient = useQueryClient();

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
    queryKey: ['agendamentos-secretaria'],
    queryFn: () => base44.entities.Agendamento.list('-data'),
  });

  const { data: pacientes = [] } = useQuery({
    queryKey: ['pacientes-secretaria'],
    queryFn: () => base44.entities.Paciente.list('-created_date'),
  });

  const { data: profissionais = [] } = useQuery({
    queryKey: ['profissionais-secretaria'],
    queryFn: () => base44.entities.Profissional.list('full_name'),
  });

  const { data: pagamentos = [] } = useQuery({
    queryKey: ['pagamentos-secretaria'],
    queryFn: () => base44.entities.Pagamento.list('-data_vencimento'),
  });

  // Mutation for quick status updates
  const updateStatusMutation = useMutation({
    mutationFn: async ({ id, status }) => {
      return await base44.entities.Agendamento.update(id, { status });
    },
    onSuccess: () => {
      queryClient.invalidateQueries(['agendamentos-secretaria']);
      toast.success("Status do agendamento atualizado!");
    },
    onError: () => {
      toast.error("Erro ao atualizar status.");
    }
  });

  // Enhance agendamentos with patient photo
  const agendamentosHoje = agendamentos
    .filter(a => a.data && isToday(parseISO(a.data)))
    .map(a => {
      const paciente = pacientes.find(p => p.id === a.paciente_id);
      return {
        ...a,
        paciente_foto: paciente?.foto_url,
        paciente_nome_completo: paciente?.nome_completo || a.paciente_nome
      };
    });

  const agendamentosProximos = agendamentos.filter(a =>
    a.data && isFuture(parseISO(a.data)) && !isToday(parseISO(a.data))
  ).slice(0, 5);

  const pagamentosPendentes = pagamentos.filter(p =>
    p.status === 'pendente' || p.status === 'atrasado'
  );

  const totalPendente = pagamentosPendentes.reduce((acc, p) =>
    acc + (p.valor - (p.valor_pago || 0)), 0
  );

  const pacientesAtivos = pacientes.filter(p => p.status === 'ativo').length;

  const handleNovoAgendamento = () => {
    setAgendamentoSelecionado(null);
    setShowAgendamentoModal(true);
  };

  const handleEditarAgendamento = (agendamento) => {
    setAgendamentoSelecionado(agendamento);
    setShowAgendamentoModal(true);
  };

  const statCards = [
    {
      title: "Agendamentos Hoje",
      value: agendamentosHoje.length,
      icon: Calendar,
      color: "from-blue-500 to-cyan-500",
      bgColor: "bg-blue-50",
      iconColor: "text-blue-600",
      link: createPageUrl("Agenda")
    },
    {
      title: "Pacientes Ativos",
      value: pacientesAtivos,
      icon: Users,
      color: "from-green-500 to-emerald-500",
      bgColor: "bg-green-50",
      iconColor: "text-green-600",
      link: createPageUrl("Pacientes")
    },
    {
      title: "Pagamentos Pendentes",
      value: `R$ ${totalPendente.toFixed(2)}`,
      icon: DollarSign,
      color: "from-amber-500 to-orange-500",
      bgColor: "bg-amber-50",
      iconColor: "text-amber-600",
      link: createPageUrl("Financeiro")
    },
    {
      title: "Próximos Agendamentos",
      value: agendamentosProximos.length,
      icon: Clock,
      color: "from-purple-500 to-indigo-500",
      bgColor: "bg-purple-50",
      iconColor: "text-purple-600",
      link: createPageUrl("Agenda")
    }
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-pink-50/30 to-rose-50/20 p-6">
      <div className="max-w-7xl mx-auto space-y-6">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          <div>
            <h1 className="text-3xl font-bold text-slate-800">
              Área da Secretaria 📋
            </h1>
            <p className="text-slate-500 mt-1">
              Painel de controle e gestão administrativa
            </p>
          </div>
          <div className="flex gap-2">
            <Link to={createPageUrl("Pacientes")}>
              <Button variant="outline" className="text-slate-600 border-slate-300 hover:bg-slate-50">
                <Search className="w-4 h-4 mr-2" />
                Buscar Paciente
              </Button>
            </Link>
            <Button
              onClick={() => base44.auth.logout()}
              variant="outline"
              className="border-red-200 text-red-600 hover:bg-red-50"
            >
              Sair
            </Button>
          </div>
        </div>

        {/* Quick Actions Bar */}
        <div className="flex gap-4 overflow-x-auto pb-2">
          <Button
            onClick={handleNovoAgendamento}
            className="bg-blue-600 hover:bg-blue-700 text-white shadow-sm"
          >
            <Plus className="w-4 h-4 mr-2" />
            Novo Agendamento
          </Button>

          <Link to={createPageUrl("Pacientes")}>
            <Button
              className="bg-emerald-600 hover:bg-emerald-700 text-white shadow-sm"
            >
              <UserPlus className="w-4 h-4 mr-2" />
              Novo Paciente
            </Button>
          </Link>

          <Link to={createPageUrl("Financeiro")}>
            <Button
              className="bg-amber-600 hover:bg-amber-700 text-white shadow-sm"
            >
              <DollarSign className="w-4 h-4 mr-2" />
              Novo Pagamento
            </Button>
          </Link>
        </div>

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
          <CardHeader className="bg-gradient-to-r from-pink-500 to-rose-500 text-white rounded-t-lg">
            <CardTitle className="flex items-center gap-2">
              <Calendar className="w-5 h-5" />
              Agendamentos de Hoje ({agendamentosHoje.length})
            </CardTitle>
          </CardHeader>
          <CardContent className="p-6">
            {agendamentosHoje.length === 0 ? (
              <div className="text-center py-8 text-slate-400">
                <Calendar className="w-12 h-12 mx-auto mb-2 opacity-50" />
                <p>Nenhum agendamento para hoje</p>
              </div>
            ) : (
              <div className="space-y-4">
                {agendamentosHoje.map((agendamento) => (
                  <div
                    key={agendamento.id}
                    className="flex flex-col md:flex-row items-center justify-between p-4 bg-white rounded-xl border border-slate-100 shadow-sm hover:shadow-md transition-all gap-4"
                  >
                    <div className="flex items-center gap-4 w-full md:w-auto">
                      <div className="w-16 h-16 rounded-full bg-gradient-to-br from-pink-500 to-rose-500 flex items-center justify-center text-white font-bold shadow-md shrink-0 overflow-hidden">
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
                          {agendamento.horario} - {agendamento.tipo_consulta}
                        </p>
                        <p className="text-sm text-slate-600 mt-1 font-medium bg-slate-50 inline-block px-2 py-0.5 rounded border border-slate-200">
                          Dr(a). {agendamento.profissional_nome}
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center gap-2 w-full md:w-auto justify-end">
                      {/* Status Indicator for mobile/desktop redundancy or quick view */}
                      <div className={`px-3 py-1 rounded-full text-xs font-bold border ${agendamento.status === 'confirmado' ? 'bg-green-50 text-green-700 border-green-200' :
                          agendamento.status === 'cancelado' ? 'bg-red-50 text-red-700 border-red-200' :
                            'bg-amber-50 text-amber-700 border-amber-200'
                        }`}>
                        {agendamento.status.toUpperCase()}
                      </div>

                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" className="h-8 w-8 p-0">
                            <span className="sr-only">Abrir menu</span>
                            <MoreVertical className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuLabel>Ações</DropdownMenuLabel>
                          <DropdownMenuItem onClick={() => handleEditarAgendamento(agendamento)}>
                            <Calendar className="mr-2 h-4 w-4" />
                            Editar / Reagendar
                          </DropdownMenuItem>
                          <DropdownMenuItem onClick={() => handleEditarAgendamento(agendamento)}>
                            <UserCog className="mr-2 h-4 w-4" />
                            Transferir Profissional
                          </DropdownMenuItem>
                          <DropdownMenuSeparator />
                          <DropdownMenuItem
                            className="text-green-600 focus:text-green-700"
                            onClick={() => updateStatusMutation.mutate({ id: agendamento.id, status: 'confirmado' })}
                          >
                            <Check className="mr-2 h-4 w-4" />
                            Confirmar Presença
                          </DropdownMenuItem>
                          <DropdownMenuItem
                            className="text-red-600 focus:text-red-700"
                            onClick={() => updateStatusMutation.mutate({ id: agendamento.id, status: 'cancelado' })}
                          >
                            <XCircle className="mr-2 h-4 w-4" />
                            Cancelar
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
                Próximos Agendamentos
              </CardTitle>
            </CardHeader>
            <CardContent>
              {agendamentosProximos.length === 0 ? (
                <div className="text-center py-8 text-slate-400">
                  <Calendar className="w-12 h-12 mx-auto mb-2 opacity-50" />
                  <p>Nenhum agendamento futuro</p>
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
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>

          <Card className="border-none shadow-lg border-l-4 border-l-amber-500">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <AlertCircle className="w-5 h-5 text-amber-600" />
                Pagamentos Pendentes
              </CardTitle>
            </CardHeader>
            <CardContent>
              {pagamentosPendentes.length === 0 ? (
                <div className="text-center py-8 text-slate-400">
                  <CheckCircle className="w-12 h-12 mx-auto mb-2 opacity-50" />
                  <p>Nenhum pagamento pendente</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {pagamentosPendentes.slice(0, 5).map((pagamento) => (
                    <div
                      key={pagamento.id}
                      className="flex items-center justify-between p-3 bg-amber-50 rounded-lg border border-amber-200 text-sm"
                    >
                      <div>
                        <p className="font-semibold text-slate-800">
                          {pagamento.paciente_nome}
                        </p>
                        <p className="text-xs text-slate-600">
                          Venc: {format(new Date(pagamento.data_vencimento), "dd/MM/yyyy")}
                        </p>
                      </div>
                      <p className="font-bold text-amber-700">
                        R$ {(pagamento.valor || 0).toFixed(2)}
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