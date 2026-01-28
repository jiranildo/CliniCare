import React, { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Link } from "react-router-dom";
import { createPageUrl } from "@/utils";
import AgendamentoModal from "@/components/agendamentos/AgendamentoModal";
import {
  Calendar,
  FileText,
  DollarSign,
  User,
  Clock,
  CheckCircle,
  AlertCircle,
  Activity,
  Package,
  Phone,
  Mail,
  MapPin,
  Search,
  ArrowRight
} from "lucide-react";
import { format, parseISO, isFuture, isToday, isPast } from "date-fns";
import { ptBR } from "date-fns/locale";

export default function AreaPaciente() {
  const [user, setUser] = useState(null);
  const [paciente, setPaciente] = useState(null);
  const [isAdmin, setIsAdmin] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');

  // Modal states
  const [showAgendamentoModal, setShowAgendamentoModal] = useState(false);
  const [agendamentoSelecionado, setAgendamentoSelecionado] = useState(null);

  useEffect(() => {
    const loadUser = async () => {
      try {
        const userData = await base44.auth.me();
        setUser(userData);
        setIsAdmin(userData.role === 'admin');

        // Se é admin, buscar paciente selecionado do localStorage
        if (userData.role === 'admin') {
          const pacienteSelecionadoId = localStorage.getItem('admin_paciente_selecionado');
          if (pacienteSelecionadoId) {
            const pacientes = await base44.entities.Paciente.filter({ id: pacienteSelecionadoId });
            if (pacientes && pacientes.length > 0) {
              setPaciente(pacientes[0]);
            }
          }
        } else {
          // Se não é admin, buscar paciente pelo email
          const pacientes = await base44.entities.Paciente.filter({ email: userData.email });
          if (pacientes && pacientes.length > 0) {
            setPaciente(pacientes[0]);

            // Atualizar último acesso
            try {
              await base44.entities.Paciente.update(pacientes[0].id, {
                ...pacientes[0],
                ultimo_acesso: new Date().toISOString()
              });
            } catch (err) {
              console.error("Erro ao atualizar ultimo acesso", err);
            }
          }
        }
      } catch (error) {
        console.error("Error loading user:", error);
      }
    };
    loadUser();
  }, []);

  const { data: todosOsPacientes = [] } = useQuery({
    queryKey: ['todos-pacientes'],
    queryFn: () => base44.entities.Paciente.list('-nome_completo'),
    enabled: isAdmin && !paciente,
  });

  const { data: agendamentos = [] } = useQuery({
    queryKey: ['meus-agendamentos', paciente?.id],
    queryFn: () => paciente ? base44.entities.Agendamento.filter({ paciente_id: paciente.id }, '-data') : [],
    enabled: !!paciente,
  });

  const { data: pagamentos = [] } = useQuery({
    queryKey: ['meus-pagamentos', paciente?.id],
    queryFn: () => paciente ? base44.entities.Pagamento.filter({ paciente_id: paciente.id }, '-data_vencimento') : [],
    enabled: !!paciente,
  });

  const { data: evolucoes = [] } = useQuery({
    queryKey: ['minhas-evolucoes', paciente?.id],
    queryFn: () => paciente ? base44.entities.Evolucao.filter({ paciente_id: paciente.id }, '-data_atendimento') : [],
    enabled: !!paciente,
  });

  const { data: contrato } = useQuery({
    queryKey: ['meu-contrato', paciente?.id],
    queryFn: async () => {
      if (!paciente) return null;
      const contratos = await base44.entities.Contrato.filter({
        paciente_id: paciente.id,
        status: 'ativo'
      });
      return contratos && contratos.length > 0 ? contratos[0] : null;
    },
    enabled: !!paciente,
  });

  const { data: profissionais = [] } = useQuery({
    queryKey: ['profissionais-ativos'],
    queryFn: async () => {
      // Fetch all professionals. If there is an 'active' flag, filter by it.
      // Assuming list returns all. 
      const all = await base44.entities.Profissional.list('full_name');
      return all;
    },
    enabled: !!paciente
  });

  const handleSelecionarPaciente = (pacienteSelecionado) => {
    localStorage.setItem('admin_paciente_selecionado', pacienteSelecionado.id);
    setPaciente(pacienteSelecionado);
  };

  const handleVoltarSelecao = () => {
    localStorage.removeItem('admin_paciente_selecionado');
    setPaciente(null);
  };

  const handleNovoAgendamento = () => {
    setAgendamentoSelecionado({
      paciente_id: paciente.id,
      paciente_nome: paciente.nome_completo,
      status: 'agendado',
      tipo_consulta: 'retorno' // Default
    });
    setShowAgendamentoModal(true);
  };

  // Se é admin e não selecionou paciente, mostrar lista de seleção
  if (isAdmin && !paciente) {
    const pacientesFiltrados = todosOsPacientes.filter(p =>
      p.nome_completo?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      p.cpf?.includes(searchTerm) ||
      p.email?.toLowerCase().includes(searchTerm.toLowerCase())
    );

    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50/30 to-teal-50/20 p-6">
        <div className="max-w-6xl mx-auto space-y-6">
          <div>
            <h1 className="text-3xl font-bold text-slate-800">
              Selecione um Paciente 👤
            </h1>
            <p className="text-slate-500 mt-1">
              Escolha um paciente para visualizar sua área
            </p>
          </div>

          <Card className="border-none shadow-lg">
            <CardContent className="p-6">
              <div className="relative mb-6">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400 w-5 h-5" />
                <Input
                  placeholder="Buscar por nome, CPF ou email..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>

              {pacientesFiltrados.length === 0 ? (
                <div className="text-center py-12">
                  <User className="w-16 h-16 text-slate-300 mx-auto mb-4" />
                  <p className="text-slate-500">Nenhum paciente encontrado</p>
                </div>
              ) : (
                <div className="grid md:grid-cols-2 gap-4">
                  {pacientesFiltrados.map((p) => (
                    <div
                      key={p.id}
                      onClick={() => handleSelecionarPaciente(p)}
                      className="flex items-center gap-4 p-4 bg-slate-50 rounded-lg border hover:border-cyan-500 hover:shadow-md transition-all cursor-pointer group"
                    >
                      {p.foto_url ? (
                        <img
                          src={p.foto_url}
                          alt={p.nome_completo}
                          className="w-16 h-16 rounded-full object-cover border-2 border-white shadow-md"
                        />
                      ) : (
                        <div className="w-16 h-16 rounded-full bg-gradient-to-br from-cyan-500 to-teal-500 flex items-center justify-center text-white font-bold text-xl shadow-md">
                          {p.nome_completo?.charAt(0).toUpperCase()}
                        </div>
                      )}

                      <div className="flex-1">
                        <h3 className="font-bold text-slate-800 group-hover:text-cyan-600 transition-colors">
                          {p.nome_completo}
                        </h3>
                        {p.cpf && (
                          <p className="text-sm text-slate-500">CPF: {p.cpf}</p>
                        )}
                        {p.email && (
                          <p className="text-sm text-slate-500">{p.email}</p>
                        )}
                      </div>

                      <ArrowRight className="w-5 h-5 text-slate-400 group-hover:text-cyan-600 transition-colors" />
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

  if (!user || !paciente) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-50 via-blue-50/30 to-teal-50/20">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-cyan-600 mx-auto mb-4"></div>
          <p className="text-slate-600">Carregando seus dados...</p>
        </div>
      </div>
    );
  }

  const proximosAgendamentos = agendamentos
    .filter(a => a.data && (isFuture(parseISO(a.data)) || isToday(parseISO(a.data))))
    .filter(a => a.status !== 'cancelado' && a.status !== 'concluido')
    .slice(0, 3);

  const pagamentosPendentes = pagamentos.filter(p => p.status === 'pendente' || p.status === 'atrasado');
  const totalPendente = pagamentosPendentes.reduce((acc, p) => acc + (p.valor - (p.valor_pago || 0)), 0);

  const atendimentosRealizados = evolucoes.length;

  const statCards = [
    {
      title: "Próximas Consultas",
      value: proximosAgendamentos.length,
      icon: Calendar,
      color: "from-blue-500 to-cyan-500",
      bgColor: "bg-blue-50",
      iconColor: "text-blue-600",
      link: createPageUrl("MeusAgendamentos")
    },
    {
      title: "Pagamentos Pendentes",
      value: `R$ ${totalPendente.toFixed(2)}`,
      icon: DollarSign,
      color: "from-green-500 to-emerald-500",
      bgColor: "bg-green-50",
      iconColor: "text-green-600",
      link: createPageUrl("MeusPagamentos")
    },
    {
      title: "Atendimentos Realizados",
      value: atendimentosRealizados,
      icon: Activity,
      color: "from-purple-500 to-indigo-500",
      bgColor: "bg-purple-50",
      iconColor: "text-purple-600",
      link: createPageUrl("MeuProntuario")
    }
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50/30 to-teal-50/20 p-6">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          <div>
            <h1 className="text-3xl font-bold text-slate-800">
              Olá, {paciente.nome_completo?.split(' ')[0]}! 👋
            </h1>
            <p className="text-slate-500 mt-1">
              {isAdmin ? '🔐 Modo Admin - Visualizando como paciente' : 'Bem-vindo à sua área do paciente'}
            </p>
          </div>
          <div className="flex gap-2">
            <Button
              onClick={handleNovoAgendamento}
              className="bg-cyan-600 hover:bg-cyan-700 text-white"
            >
              <Calendar className="w-4 h-4 mr-2" />
              Novo Agendamento
            </Button>

            {isAdmin && (
              <Button
                onClick={handleVoltarSelecao}
                variant="outline"
                className="border-cyan-200 text-cyan-600 hover:bg-cyan-50"
              >
                ← Trocar Paciente
              </Button>
            )}
            <Button
              onClick={() => base44.auth.logout()}
              variant="outline"
              className="border-red-200 text-red-600 hover:bg-red-50"
            >
              Sair
            </Button>
          </div>
        </div>

        {/* Perfil do Paciente */}
        <Card className="border-none shadow-lg">
          <CardHeader className="bg-gradient-to-r from-cyan-500 to-teal-500 text-white rounded-t-lg">
            <CardTitle className="flex items-center gap-3">
              <User className="w-6 h-6" />
              Meu Perfil
            </CardTitle>
          </CardHeader>
          <CardContent className="p-6">
            <div className="flex flex-col md:flex-row gap-6">
              {paciente.foto_url ? (
                <img
                  src={paciente.foto_url}
                  alt={paciente.nome_completo}
                  className="w-24 h-24 rounded-full object-cover border-4 border-white shadow-lg"
                />
              ) : (
                <div className="w-24 h-24 rounded-full bg-gradient-to-br from-cyan-500 to-teal-500 flex items-center justify-center text-white font-bold text-3xl shadow-lg">
                  {paciente.nome_completo?.charAt(0).toUpperCase()}
                </div>
              )}

              <div className="flex-1 space-y-3">
                <div className="grid md:grid-cols-2 gap-4">
                  <div className="flex items-center gap-2 text-slate-600">
                    <User className="w-4 h-4 text-cyan-600" />
                    <span className="font-semibold">Nome:</span>
                    <span>{paciente.nome_completo}</span>
                  </div>
                  {paciente.cpf && (
                    <div className="flex items-center gap-2 text-slate-600">
                      <FileText className="w-4 h-4 text-cyan-600" />
                      <span className="font-semibold">CPF:</span>
                      <span>{paciente.cpf}</span>
                    </div>
                  )}
                  <div className="flex items-center gap-2 text-slate-600">
                    <Phone className="w-4 h-4 text-cyan-600" />
                    <span className="font-semibold">Telefone:</span>
                    <span>{paciente.telefone}</span>
                  </div>
                  {paciente.email && (
                    <div className="flex items-center gap-2 text-slate-600">
                      <Mail className="w-4 h-4 text-cyan-600" />
                      <span className="font-semibold">Email:</span>
                      <span>{paciente.email}</span>
                    </div>
                  )}
                  {paciente.endereco && (
                    <div className="flex items-center gap-2 text-slate-600 md:col-span-2">
                      <MapPin className="w-4 h-4 text-cyan-600" />
                      <span className="font-semibold">Endereço:</span>
                      <span>{paciente.endereco}, {paciente.cidade} - {paciente.estado}</span>
                    </div>
                  )}
                </div>

                {paciente.convenio && (
                  <div className="bg-blue-50 p-3 rounded-lg border border-blue-200">
                    <span className="text-sm font-semibold text-blue-800">
                      Convênio: {paciente.convenio}
                      {paciente.numero_convenio && ` - ${paciente.numero_convenio}`}
                    </span>
                  </div>
                )}
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Cards de Estatísticas */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
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

        {/* Contrato Ativo */}
        {contrato && (
          <Card className="border-none shadow-lg bg-gradient-to-r from-purple-50 to-blue-50">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Package className="w-5 h-5 text-purple-600" />
                Contrato Ativo
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                <div>
                  <p className="text-lg font-bold text-slate-800">{contrato.titulo}</p>
                  <p className="text-sm text-slate-600">Nº {contrato.numero_contrato}</p>
                  <p className="text-sm text-slate-600">Tipo: {contrato.tipo_contrato}</p>
                </div>
                <div className="grid md:grid-cols-3 gap-4">
                  {contrato.servicos_inclusos && contrato.servicos_inclusos.length > 0 && (
                    <div className="bg-white p-3 rounded-lg">
                      <p className="text-xs text-slate-500">Serviços Inclusos</p>
                      {contrato.servicos_inclusos.map((servico, idx) => (
                        <p key={idx} className="text-sm font-bold text-purple-600">
                          {servico.servico}: {servico.quantidade}x
                        </p>
                      ))}
                    </div>
                  )}
                  {contrato.valor_mensal && (
                    <div className="bg-white p-3 rounded-lg">
                      <p className="text-xs text-slate-500">Valor Mensal</p>
                      <p className="text-xl font-bold text-green-600">
                        R$ {(contrato.valor_mensal || 0).toFixed(2)}
                      </p>
                    </div>
                  )}
                  <div className="bg-white p-3 rounded-lg">
                    <p className="text-xs text-slate-500">Vigência</p>
                    <p className="text-sm font-semibold text-slate-800">
                      {contrato.data_inicio && format(new Date(contrato.data_inicio), "dd/MM/yyyy")}
                      {contrato.data_termino && ` - ${format(new Date(contrato.data_termino), "dd/MM/yyyy")}`}
                    </p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Próximos Agendamentos */}
        <Card className="border-none shadow-lg">
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle className="flex items-center gap-2">
              <Calendar className="w-5 h-5 text-cyan-600" />
              Próximas Consultas
            </CardTitle>
            <Link to={createPageUrl("MeusAgendamentos")}>
              <Button variant="outline" size="sm">
                Ver Todas
              </Button>
            </Link>
          </CardHeader>
          <CardContent>
            {proximosAgendamentos.length === 0 ? (
              <div className="text-center py-8 text-slate-400">
                <Calendar className="w-12 h-12 mx-auto mb-2 opacity-50" />
                <p>Nenhuma consulta agendada</p>
              </div>
            ) : (
              <div className="space-y-3">
                {proximosAgendamentos.map((agendamento) => (
                  <div
                    key={agendamento.id}
                    className="flex items-center justify-between p-4 bg-slate-50 rounded-lg border hover:shadow-md transition-all"
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-12 h-12 rounded-full bg-gradient-to-br from-cyan-500 to-teal-500 flex items-center justify-center text-white font-bold">
                        {format(parseISO(agendamento.data), 'dd')}
                      </div>
                      <div>
                        <p className="font-semibold text-slate-800">
                          {agendamento.profissional_nome}
                        </p>
                        <p className="text-sm text-slate-600">
                          {format(parseISO(agendamento.data), "EEEE, dd/MM/yyyy", { locale: ptBR })} às {agendamento.horario}
                        </p>
                      </div>
                    </div>
                    <div>
                      {agendamento.status === 'confirmado' ? (
                        <CheckCircle className="w-5 h-5 text-green-600" />
                      ) : (
                        <Clock className="w-5 h-5 text-amber-600" />
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Pagamentos Pendentes */}
        {pagamentosPendentes.length > 0 && (
          <Card className="border-none shadow-lg border-l-4 border-l-amber-500">
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle className="flex items-center gap-2">
                <AlertCircle className="w-5 h-5 text-amber-600" />
                Pagamentos Pendentes
              </CardTitle>
              <Link to={createPageUrl("MeusPagamentos")}>
                <Button variant="outline" size="sm">
                  Ver Todos
                </Button>
              </Link>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {pagamentosPendentes.slice(0, 3).map((pagamento) => (
                  <div
                    key={pagamento.id}
                    className="flex items-center justify-between p-4 bg-amber-50 rounded-lg border border-amber-200"
                  >
                    <div>
                      <p className="font-semibold text-slate-800">
                        R$ {(pagamento.valor || 0).toFixed(2)}
                      </p>
                      <p className="text-sm text-slate-600">
                        Vencimento: {format(new Date(pagamento.data_vencimento), "dd/MM/yyyy")}
                      </p>
                    </div>
                    <div>
                      {isPast(new Date(pagamento.data_vencimento)) ? (
                        <span className="px-3 py-1 bg-red-100 text-red-700 rounded-full text-xs font-semibold">
                          Atrasado
                        </span>
                      ) : (
                        <span className="px-3 py-1 bg-amber-100 text-amber-700 rounded-full text-xs font-semibold">
                          Pendente
                        </span>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}

        {showAgendamentoModal && paciente && (
          <AgendamentoModal
            agendamento={agendamentoSelecionado}
            pacientes={[paciente]}
            profissionais={profissionais}
            onClose={() => setShowAgendamentoModal(false)}
          />
        )}
      </div>
    </div>
  );
}
