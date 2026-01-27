import React, { useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Calendar, Clock, Edit, Trash2, DollarSign, Repeat, ChevronDown, ChevronUp, User } from "lucide-react";
import { format, parseISO } from "date-fns";
import { ptBR } from "date-fns/locale";

const statusColors = {
  agendado: "bg-blue-100 text-blue-700 border-blue-200",
  confirmado: "bg-green-100 text-green-700 border-green-200",
  em_atendimento: "bg-purple-100 text-purple-700 border-purple-200",
  concluido: "bg-slate-100 text-slate-700 border-slate-200",
  cancelado: "bg-red-100 text-red-700 border-red-200",
  faltou: "bg-amber-100 text-amber-700 border-amber-200"
};

const statusLabels = {
  agendado: "Agendado",
  confirmado: "Confirmado",
  em_atendimento: "Em Atendimento",
  concluido: "Concluído",
  cancelado: "Cancelado",
  faltou: "Faltou"
};

const recorrenciaLabels = {
  nenhuma: null,
  diaria: "Diário",
  semanal: "Semanal",
  quinzenal: "Quinzenal",
  mensal: "Mensal"
};

export default function AgendamentoPacienteCard({ paciente, agendamentos, onEdit, onDelete }) {
  const [expandido, setExpandido] = useState(false);

  // Ordenar agendamentos por data
  const agendamentosOrdenados = [...agendamentos].sort((a, b) => 
    new Date(a.data + ' ' + a.horario) - new Date(b.data + ' ' + b.horario)
  );

  const proximoAgendamento = agendamentosOrdenados.find(
    ag => new Date(ag.data) >= new Date() && ag.status !== 'cancelado' && ag.status !== 'concluido'
  );

  const totalAgendamentos = agendamentos.length;
  const agendamentosConcluidos = agendamentos.filter(a => a.status === 'concluido').length;
  const agendamentosAtivos = agendamentos.filter(a => 
    a.status !== 'cancelado' && a.status !== 'concluido'
  ).length;

  // Agrupar por série de recorrência
  const seriesRecorrentes = {};
  agendamentos.forEach(ag => {
    if (ag.agendamento_serie_id) {
      if (!seriesRecorrentes[ag.agendamento_serie_id]) {
        seriesRecorrentes[ag.agendamento_serie_id] = [];
      }
      seriesRecorrentes[ag.agendamento_serie_id].push(ag);
    }
  });

  return (
    <Card className="border-none shadow-lg hover:shadow-xl transition-all duration-300 overflow-hidden">
      <div className={`h-1.5 bg-gradient-to-r ${
        proximoAgendamento?.status === 'confirmado' ? 'from-green-400 to-emerald-500' :
        agendamentosAtivos > 0 ? 'from-blue-400 to-cyan-500' :
        'from-slate-400 to-slate-500'
      }`} />
      
      <CardContent className="p-6">
        {/* Cabeçalho do Card */}
        <div className="flex justify-between items-start mb-4">
          <div className="flex items-center gap-3">
            <div className="w-14 h-14 rounded-full bg-gradient-to-br from-cyan-500 to-teal-500 flex items-center justify-center text-white font-bold text-xl shadow-lg">
              {paciente.nome?.charAt(0).toUpperCase()}
            </div>
            <div>
              <h3 className="font-bold text-slate-800 text-lg">
                {paciente.nome}
              </h3>
              <div className="flex items-center gap-2 text-sm text-slate-500">
                <span>{totalAgendamentos} agendamento{totalAgendamentos !== 1 ? 's' : ''}</span>
                {agendamentosAtivos > 0 && (
                  <>
                    <span>•</span>
                    <span className="text-blue-600 font-medium">{agendamentosAtivos} ativo{agendamentosAtivos !== 1 ? 's' : ''}</span>
                  </>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Próximo Agendamento em Destaque */}
        {proximoAgendamento && (
          <div className="bg-gradient-to-r from-cyan-50 to-teal-50 p-4 rounded-lg mb-4 border border-cyan-200">
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-semibold text-cyan-700 uppercase">Próximo Agendamento</span>
              <span className={`px-2 py-1 rounded-full text-xs font-semibold border ${statusColors[proximoAgendamento.status]}`}>
                {statusLabels[proximoAgendamento.status]}
              </span>
            </div>
            <div className="space-y-2">
              <div className="flex items-center gap-2 text-slate-700">
                <Calendar className="w-4 h-4 text-cyan-600" />
                <span className="font-semibold">
                  {format(parseISO(proximoAgendamento.data), "dd 'de' MMMM 'de' yyyy", { locale: ptBR })}
                </span>
              </div>
              <div className="flex items-center gap-2 text-slate-600">
                <Clock className="w-4 h-4 text-teal-600" />
                <span>{proximoAgendamento.horario} ({proximoAgendamento.duracao || 60} min)</span>
              </div>
              <div className="flex items-center gap-2 text-slate-600">
                <User className="w-4 h-4 text-blue-600" />
                <span className="text-sm">{proximoAgendamento.profissional_nome}</span>
              </div>
              {proximoAgendamento.valor > 0 && (
                <div className="flex items-center gap-2 text-slate-600">
                  <DollarSign className="w-4 h-4 text-green-600" />
                  <span className="font-medium">R$ {proximoAgendamento.valor.toFixed(2)}</span>
                </div>
              )}
              {proximoAgendamento.recorrencia_tipo && proximoAgendamento.recorrencia_tipo !== 'nenhuma' && (
                <div className="flex items-center gap-2 text-purple-600">
                  <Repeat className="w-4 h-4" />
                  <span className="text-xs font-medium">
                    {recorrenciaLabels[proximoAgendamento.recorrencia_tipo]}
                    {proximoAgendamento.recorrencia_quantidade > 1 && ` (${proximoAgendamento.recorrencia_quantidade}x)`}
                  </span>
                </div>
              )}
            </div>
            <div className="flex gap-2 mt-3">
              <Button
                onClick={() => onEdit(proximoAgendamento)}
                variant="outline"
                size="sm"
                className="flex-1 hover:bg-cyan-100"
              >
                <Edit className="w-4 h-4 mr-1" />
                Editar
              </Button>
              <Button
                onClick={() => onDelete(proximoAgendamento.id)}
                variant="outline"
                size="sm"
                className="hover:bg-red-100"
              >
                <Trash2 className="w-4 h-4" />
              </Button>
            </div>
          </div>
        )}

        {/* Estatísticas */}
        <div className="grid grid-cols-3 gap-2 mb-4">
          <div className="bg-slate-50 p-3 rounded-lg text-center">
            <p className="text-2xl font-bold text-slate-800">{totalAgendamentos}</p>
            <p className="text-xs text-slate-500">Total</p>
          </div>
          <div className="bg-blue-50 p-3 rounded-lg text-center">
            <p className="text-2xl font-bold text-blue-600">{agendamentosAtivos}</p>
            <p className="text-xs text-slate-500">Ativos</p>
          </div>
          <div className="bg-green-50 p-3 rounded-lg text-center">
            <p className="text-2xl font-bold text-green-600">{agendamentosConcluidos}</p>
            <p className="text-xs text-slate-500">Concluídos</p>
          </div>
        </div>

        {/* Botão Ver Todos */}
        {agendamentos.length > 1 && (
          <>
            <Button
              onClick={() => setExpandido(!expandido)}
              variant="outline"
              className="w-full"
              size="sm"
            >
              {expandido ? (
                <>
                  <ChevronUp className="w-4 h-4 mr-2" />
                  Ocultar Agendamentos
                </>
              ) : (
                <>
                  <ChevronDown className="w-4 h-4 mr-2" />
                  Ver Todos os Agendamentos ({agendamentos.length - 1} mais)
                </>
              )}
            </Button>

            {/* Lista de Todos os Agendamentos */}
            {expandido && (
              <div className="mt-4 space-y-2 max-h-96 overflow-y-auto">
                {agendamentosOrdenados.map((agendamento) => (
                  <div 
                    key={agendamento.id}
                    className={`p-3 rounded-lg border transition-all ${
                      agendamento.id === proximoAgendamento?.id 
                        ? 'bg-cyan-50 border-cyan-200' 
                        : 'bg-white border-slate-200 hover:border-slate-300'
                    }`}
                  >
                    <div className="flex items-start justify-between mb-2">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          <Calendar className="w-3 h-3 text-slate-400" />
                          <span className="text-sm font-semibold text-slate-700">
                            {format(parseISO(agendamento.data), "dd/MM/yyyy")}
                          </span>
                          <Clock className="w-3 h-3 text-slate-400 ml-2" />
                          <span className="text-sm text-slate-600">{agendamento.horario}</span>
                        </div>
                        <div className="flex items-center gap-2 text-xs text-slate-500">
                          <User className="w-3 h-3" />
                          <span>{agendamento.profissional_nome}</span>
                        </div>
                      </div>
                      <div className="flex flex-col items-end gap-2">
                        <span className={`px-2 py-0.5 rounded-full text-xs font-semibold border ${statusColors[agendamento.status]}`}>
                          {statusLabels[agendamento.status]}
                        </span>
                        <div className="flex gap-1">
                          <Button
                            onClick={() => onEdit(agendamento)}
                            variant="ghost"
                            size="sm"
                            className="h-7 w-7 p-0 hover:bg-cyan-100"
                          >
                            <Edit className="w-3 h-3" />
                          </Button>
                          <Button
                            onClick={() => onDelete(agendamento.id)}
                            variant="ghost"
                            size="sm"
                            className="h-7 w-7 p-0 hover:bg-red-100"
                          >
                            <Trash2 className="w-3 h-3" />
                          </Button>
                        </div>
                      </div>
                    </div>
                    {agendamento.observacoes && (
                      <p className="text-xs text-slate-500 mt-2 line-clamp-1">
                        {agendamento.observacoes}
                      </p>
                    )}
                    {agendamento.recorrencia_tipo && agendamento.recorrencia_tipo !== 'nenhuma' && (
                      <div className="flex items-center gap-1 mt-2">
                        <Repeat className="w-3 h-3 text-purple-500" />
                        <span className="text-xs text-purple-600">
                          {recorrenciaLabels[agendamento.recorrencia_tipo]}
                        </span>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </>
        )}
      </CardContent>
    </Card>
  );
}