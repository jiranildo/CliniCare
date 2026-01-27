import React from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Calendar, Clock, User, Edit, Trash2, DollarSign, Repeat } from "lucide-react";
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

export default function AgendamentoCard({ agendamento, onEdit, onDelete }) {
  return (
    <Card className="border-none shadow-lg hover:shadow-xl transition-all duration-300 overflow-hidden">
      <div className={`h-1.5 bg-gradient-to-r ${
        agendamento.status === 'confirmado' ? 'from-green-400 to-emerald-500' :
        agendamento.status === 'agendado' ? 'from-blue-400 to-cyan-500' :
        agendamento.status === 'concluido' ? 'from-slate-400 to-slate-500' :
        'from-red-400 to-rose-500'
      }`} />
      
      <CardContent className="p-6">
        <div className="flex justify-between items-start mb-4">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-full bg-gradient-to-br from-cyan-500 to-teal-500 flex items-center justify-center text-white font-bold text-lg shadow-lg">
              {agendamento.paciente_nome?.charAt(0).toUpperCase()}
            </div>
            <div>
              <h3 className="font-bold text-slate-800 text-lg">
                {agendamento.paciente_nome}
              </h3>
              <p className="text-sm text-slate-500">
                {agendamento.profissional_nome}
              </p>
            </div>
          </div>
          <span className={`px-3 py-1 rounded-full text-xs font-semibold border ${statusColors[agendamento.status]}`}>
            {statusLabels[agendamento.status]}
          </span>
        </div>

        <div className="space-y-2 mb-4">
          <div className="flex items-center gap-2 text-slate-600">
            <Calendar className="w-4 h-4 text-cyan-600" />
            <span className="text-sm font-medium">
              {format(parseISO(agendamento.data), "d 'de' MMMM 'de' yyyy", { locale: ptBR })}
            </span>
          </div>
          <div className="flex items-center gap-2 text-slate-600">
            <Clock className="w-4 h-4 text-teal-600" />
            <span className="text-sm font-medium">
              {agendamento.horario} ({agendamento.duracao || 60} min)
            </span>
          </div>
          {agendamento.valor > 0 && (
            <div className="flex items-center gap-2 text-slate-600">
              <DollarSign className="w-4 h-4 text-green-600" />
              <span className="text-sm font-medium">
                R$ {agendamento.valor.toFixed(2)}
              </span>
            </div>
          )}
          {agendamento.recorrencia_tipo && agendamento.recorrencia_tipo !== 'nenhuma' && (
            <div className="flex items-center gap-2 text-purple-600 bg-purple-50 px-2 py-1 rounded">
              <Repeat className="w-4 h-4" />
              <span className="text-xs font-medium">
                {recorrenciaLabels[agendamento.recorrencia_tipo]}
                {agendamento.recorrencia_quantidade > 1 && ` (${agendamento.recorrencia_quantidade}x)`}
              </span>
            </div>
          )}
        </div>

        {agendamento.observacoes && (
          <p className="text-sm text-slate-500 mb-4 line-clamp-2">
            {agendamento.observacoes}
          </p>
        )}

        <div className="flex gap-2 pt-4 border-t border-slate-100">
          <Button
            onClick={() => onEdit(agendamento)}
            variant="outline"
            size="sm"
            className="flex-1 hover:bg-cyan-50 hover:text-cyan-700 hover:border-cyan-200"
          >
            <Edit className="w-4 h-4 mr-2" />
            Editar
          </Button>
          <Button
            onClick={() => onDelete(agendamento.id)}
            variant="outline"
            size="sm"
            className="hover:bg-red-50 hover:text-red-700 hover:border-red-200"
          >
            <Trash2 className="w-4 h-4" />
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}