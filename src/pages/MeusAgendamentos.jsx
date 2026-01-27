import React, { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Link } from "react-router-dom";
import { createPageUrl } from "@/utils";
import {
  Calendar,
  Clock,
  ArrowLeft,
  CheckCircle,
  AlertCircle,
  XCircle,
  Activity
} from "lucide-react";
import { format, parseISO, isFuture, isPast, isToday } from "date-fns";
import { ptBR } from "date-fns/locale";

export default function MeusAgendamentos() {
  const [paciente, setPaciente] = useState(null);
  const [isAdmin, setIsAdmin] = useState(false);

  useEffect(() => {
    const loadPaciente = async () => {
      try {
        const userData = await base44.auth.me();
        setIsAdmin(userData.role === 'admin');
        
        if (userData.role === 'admin') {
          // Admin: buscar paciente selecionado do localStorage
          const pacienteSelecionadoId = localStorage.getItem('admin_paciente_selecionado');
          if (pacienteSelecionadoId) {
            const pacientes = await base44.entities.Paciente.filter({ id: pacienteSelecionadoId });
            if (pacientes && pacientes.length > 0) {
              setPaciente(pacientes[0]);
            }
          }
        } else {
          // Paciente: buscar pelo email
          const pacientes = await base44.entities.Paciente.filter({ email: userData.email });
          if (pacientes && pacientes.length > 0) {
            setPaciente(pacientes[0]);
          }
        }
      } catch (error) {
        console.error("Error loading paciente:", error);
      }
    };
    loadPaciente();
  }, []);

  const { data: agendamentos = [], isLoading } = useQuery({
    queryKey: ['meus-agendamentos', paciente?.id],
    queryFn: () => paciente ? base44.entities.Agendamento.filter({ paciente_id: paciente.id }, '-data') : [],
    enabled: !!paciente,
  });

  if (isLoading || !paciente) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-cyan-600"></div>
      </div>
    );
  }

  const agendamentosFuturos = agendamentos.filter(a => 
    a.data && (isFuture(parseISO(a.data)) || isToday(parseISO(a.data))) && a.status !== 'cancelado'
  );

  const agendamentosPassados = agendamentos.filter(a =>
    a.data && isPast(parseISO(a.data)) && !isToday(parseISO(a.data))
  );

  const statusConfig = {
    agendado: { label: 'Agendado', color: 'bg-blue-100 text-blue-700', icon: Clock },
    confirmado: { label: 'Confirmado', color: 'bg-green-100 text-green-700', icon: CheckCircle },
    em_atendimento: { label: 'Em Atendimento', color: 'bg-purple-100 text-purple-700', icon: Activity },
    concluido: { label: 'Concluído', color: 'bg-slate-100 text-slate-700', icon: CheckCircle },
    cancelado: { label: 'Cancelado', color: 'bg-red-100 text-red-700', icon: XCircle },
    faltou: { label: 'Faltou', color: 'bg-orange-100 text-orange-700', icon: AlertCircle }
  };

  const AgendamentoCard = ({ agendamento }) => {
    const StatusIcon = statusConfig[agendamento.status]?.icon || Clock;
    
    return (
      <Card className="border-none shadow-lg hover:shadow-xl transition-all">
        <CardContent className="p-6">
          <div className="flex flex-col md:flex-row gap-4">
            <div className="flex items-center gap-4">
              <div className="w-20 h-20 rounded-full bg-gradient-to-br from-cyan-500 to-teal-500 flex flex-col items-center justify-center text-white shadow-lg">
                <span className="text-2xl font-bold">
                  {format(parseISO(agendamento.data), 'dd')}
                </span>
                <span className="text-[10px] uppercase">
                  {format(parseISO(agendamento.data), 'MMM', { locale: ptBR })}
                </span>
              </div>

              <div className="flex-1">
                <h3 className="font-bold text-lg text-slate-800">
                  {agendamento.profissional_nome}
                </h3>
                <div className="space-y-1 mt-2">
                  <div className="flex items-center gap-2 text-sm text-slate-600">
                    <Calendar className="w-4 h-4 text-cyan-600" />
                    <span>{format(parseISO(agendamento.data), "EEEE, dd 'de' MMMM 'de' yyyy", { locale: ptBR })}</span>
                  </div>
                  <div className="flex items-center gap-2 text-sm text-slate-600">
                    <Clock className="w-4 h-4 text-cyan-600" />
                    <span>{agendamento.horario}</span>
                    <span className="text-slate-400">•</span>
                    <span>{agendamento.duracao || 60} minutos</span>
                  </div>
                </div>

                {agendamento.observacoes && (
                  <div className="mt-3 p-3 bg-blue-50 rounded-lg border border-blue-200">
                    <p className="text-sm text-blue-800">
                      <strong>Observações:</strong> {agendamento.observacoes}
                    </p>
                  </div>
                )}
              </div>
            </div>

            <div className="flex flex-col items-end justify-between">
              <span className={`px-3 py-1 rounded-full text-xs font-semibold ${statusConfig[agendamento.status]?.color || 'bg-slate-100 text-slate-700'}`}>
                {statusConfig[agendamento.status]?.label || agendamento.status}
              </span>

              {agendamento.eh_substituicao && (
                <span className="mt-2 px-3 py-1 bg-orange-100 text-orange-700 rounded-full text-xs font-semibold">
                  Substituição
                </span>
              )}
            </div>
          </div>
        </CardContent>
      </Card>
    );
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50/30 to-teal-50/20 p-6">
      <div className="max-w-6xl mx-auto space-y-6">
        <div className="flex items-center gap-4">
          <Link to={createPageUrl("AreaPaciente")}>
            <Button variant="outline" size="icon">
              <ArrowLeft className="w-4 h-4" />
            </Button>
          </Link>
          <div className="flex-1">
            <h1 className="text-3xl font-bold text-slate-800">Meus Agendamentos</h1>
            <p className="text-slate-500 mt-1">
              {isAdmin ? `🔐 Visualizando como: ${paciente.nome_completo}` : 'Consultas e procedimentos agendados'}
            </p>
          </div>
        </div>

        <Card className="border-none shadow-lg">
          <CardHeader className="bg-gradient-to-r from-cyan-500 to-teal-500 text-white rounded-t-lg">
            <CardTitle className="flex items-center gap-2">
              <Calendar className="w-5 h-5" />
              Próximas Consultas ({agendamentosFuturos.length})
            </CardTitle>
          </CardHeader>
          <CardContent className="p-6">
            {agendamentosFuturos.length === 0 ? (
              <div className="text-center py-12">
                <Calendar className="w-16 h-16 text-slate-300 mx-auto mb-4" />
                <p className="text-slate-500">Nenhuma consulta futura agendada</p>
              </div>
            ) : (
              <div className="space-y-4">
                {agendamentosFuturos.map((agendamento) => (
                  <AgendamentoCard key={agendamento.id} agendamento={agendamento} />
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        <Card className="border-none shadow-lg">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Activity className="w-5 h-5 text-slate-600" />
              Histórico de Consultas ({agendamentosPassados.length})
            </CardTitle>
          </CardHeader>
          <CardContent className="p-6">
            {agendamentosPassados.length === 0 ? (
              <div className="text-center py-12">
                <Activity className="w-16 h-16 text-slate-300 mx-auto mb-4" />
                <p className="text-slate-500">Nenhuma consulta anterior</p>
              </div>
            ) : (
              <div className="space-y-4">
                {agendamentosPassados.slice(0, 10).map((agendamento) => (
                  <AgendamentoCard key={agendamento.id} agendamento={agendamento} />
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}