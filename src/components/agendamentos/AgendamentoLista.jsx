import React from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Calendar, Clock, Edit, Trash2, DollarSign, Repeat, User } from "lucide-react";
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

export default function AgendamentoLista({ agendamentos, onEdit, onDelete }) {
  return (
    <Card className="border-none shadow-lg overflow-hidden">
      <CardContent className="p-0">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-slate-50 border-b border-slate-200">
              <tr>
                <th className="text-left p-4 font-semibold text-slate-700 text-sm">Paciente</th>
                <th className="text-left p-4 font-semibold text-slate-700 text-sm">Profissional</th>
                <th className="text-left p-4 font-semibold text-slate-700 text-sm">Data & Horário</th>
                <th className="text-left p-4 font-semibold text-slate-700 text-sm">Status</th>
                <th className="text-left p-4 font-semibold text-slate-700 text-sm">Detalhes</th>
                <th className="text-right p-4 font-semibold text-slate-700 text-sm">Ações</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {agendamentos.map((agendamento) => (
                <tr 
                  key={agendamento.id} 
                  className="hover:bg-slate-50 transition-colors"
                >
                  <td className="p-4">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-full bg-gradient-to-br from-cyan-500 to-teal-500 flex items-center justify-center text-white font-bold text-sm shadow">
                        {agendamento.paciente_nome?.charAt(0).toUpperCase()}
                      </div>
                      <div>
                        <p className="font-semibold text-slate-800">
                          {agendamento.paciente_nome}
                        </p>
                        <p className="text-xs text-slate-500">
                          {agendamento.tipo_consulta === 'primeira_vez' ? 'Primeira Vez' :
                           agendamento.tipo_consulta === 'retorno' ? 'Retorno' :
                           agendamento.tipo_consulta === 'exame' ? 'Exame' : 'Procedimento'}
                        </p>
                      </div>
                    </div>
                  </td>
                  <td className="p-4">
                    <div className="flex items-center gap-2 text-slate-700">
                      <User className="w-4 h-4 text-slate-400" />
                      <span className="text-sm">{agendamento.profissional_nome}</span>
                    </div>
                  </td>
                  <td className="p-4">
                    <div className="space-y-1">
                      <div className="flex items-center gap-2 text-slate-700">
                        <Calendar className="w-4 h-4 text-cyan-600" />
                        <span className="text-sm font-medium">
                          {format(parseISO(agendamento.data), "dd/MM/yyyy")}
                        </span>
                      </div>
                      <div className="flex items-center gap-2 text-slate-600">
                        <Clock className="w-4 h-4 text-teal-600" />
                        <span className="text-sm">
                          {agendamento.horario} ({agendamento.duracao || 60} min)
                        </span>
                      </div>
                    </div>
                  </td>
                  <td className="p-4">
                    <span className={`px-3 py-1 rounded-full text-xs font-semibold border inline-block ${statusColors[agendamento.status]}`}>
                      {statusLabels[agendamento.status]}
                    </span>
                  </td>
                  <td className="p-4">
                    <div className="space-y-1">
                      {agendamento.valor > 0 && (
                        <div className="flex items-center gap-2 text-slate-600">
                          <DollarSign className="w-4 h-4 text-green-600" />
                          <span className="text-sm">R$ {agendamento.valor.toFixed(2)}</span>
                        </div>
                      )}
                      {agendamento.recorrencia_tipo && agendamento.recorrencia_tipo !== 'nenhuma' && (
                        <div className="flex items-center gap-2 text-purple-600">
                          <Repeat className="w-4 h-4" />
                          <span className="text-xs font-medium">
                            {recorrenciaLabels[agendamento.recorrencia_tipo]}
                          </span>
                        </div>
                      )}
                      {agendamento.observacoes && (
                        <p className="text-xs text-slate-500 line-clamp-1 max-w-xs">
                          {agendamento.observacoes}
                        </p>
                      )}
                    </div>
                  </td>
                  <td className="p-4">
                    <div className="flex justify-end gap-2">
                      <Button
                        onClick={() => onEdit(agendamento)}
                        variant="ghost"
                        size="sm"
                        className="hover:bg-cyan-50 hover:text-cyan-700"
                      >
                        <Edit className="w-4 h-4" />
                      </Button>
                      <Button
                        onClick={() => onDelete(agendamento.id)}
                        variant="ghost"
                        size="sm"
                        className="hover:bg-red-50 hover:text-red-700"
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </CardContent>
    </Card>
  );
}