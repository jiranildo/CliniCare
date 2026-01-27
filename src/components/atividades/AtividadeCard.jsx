import React from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Calendar, User, Edit, Trash2, CheckCircle, Clock, AlertTriangle } from "lucide-react";
import { format, parseISO } from "date-fns";
import { ptBR } from "date-fns/locale";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

const statusColors = {
  pendente: "bg-amber-100 text-amber-700 border-amber-200",
  em_andamento: "bg-blue-100 text-blue-700 border-blue-200",
  concluido: "bg-green-100 text-green-700 border-green-200",
  cancelado: "bg-slate-100 text-slate-700 border-slate-200",
  atrasado: "bg-red-100 text-red-700 border-red-200"
};

const prioridadeColors = {
  baixa: "bg-slate-100 text-slate-600",
  media: "bg-blue-100 text-blue-600",
  alta: "bg-orange-100 text-orange-600",
  urgente: "bg-red-100 text-red-600"
};

const tipoLabels = {
  exercicio: "Exercício",
  medicacao: "Medicação",
  exame: "Exame",
  procedimento: "Procedimento",
  retorno: "Retorno",
  outro: "Outro"
};

export default function AtividadeCard({ atividade, onEdit, onDelete, onStatusChange }) {
  const getStatusIcon = () => {
    switch (atividade.status) {
      case 'concluido': return <CheckCircle className="w-5 h-5 text-green-600" />;
      case 'em_andamento': return <Clock className="w-5 h-5 text-blue-600" />;
      case 'atrasado': return <AlertTriangle className="w-5 h-5 text-red-600" />;
      default: return <Clock className="w-5 h-5 text-amber-600" />;
    }
  };

  return (
    <Card className="border-none shadow-lg hover:shadow-xl transition-all duration-300 overflow-hidden">
      <div className={`h-1.5 bg-gradient-to-r ${
        atividade.status === 'concluido' ? 'from-green-400 to-emerald-500' :
        atividade.status === 'em_andamento' ? 'from-blue-400 to-cyan-500' :
        atividade.status === 'atrasado' ? 'from-red-400 to-rose-500' :
        'from-amber-400 to-orange-500'
      }`} />
      
      <CardContent className="p-6">
        <div className="flex justify-between items-start mb-4">
          <div className="flex items-center gap-3">
            {getStatusIcon()}
            <div>
              <h3 className="font-bold text-slate-800 text-lg">
                {atividade.titulo}
              </h3>
              <span className="text-xs px-2 py-1 rounded-full bg-slate-100 text-slate-600">
                {tipoLabels[atividade.tipo]}
              </span>
            </div>
          </div>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="sm">
                <span className={`px-3 py-1 rounded-full text-xs font-semibold border ${statusColors[atividade.status]}`}>
                  {atividade.status.replace('_', ' ')}
                </span>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent>
              <DropdownMenuItem onClick={() => onStatusChange(atividade, 'pendente')}>
                Pendente
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => onStatusChange(atividade, 'em_andamento')}>
                Em Andamento
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => onStatusChange(atividade, 'concluido')}>
                Concluído
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => onStatusChange(atividade, 'cancelado')}>
                Cancelado
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>

        <div className="space-y-2 mb-4">
          <div className="flex items-center gap-2 text-slate-600">
            <User className="w-4 h-4 text-cyan-600" />
            <span className="text-sm font-medium">{atividade.paciente_nome}</span>
          </div>
          <div className="flex items-center gap-2 text-slate-600">
            <Calendar className="w-4 h-4 text-teal-600" />
            <span className="text-sm">
              Início: {format(parseISO(atividade.data_inicio), "dd/MM/yyyy")}
            </span>
          </div>
          {atividade.data_conclusao && (
            <div className="flex items-center gap-2 text-slate-600">
              <Calendar className="w-4 h-4 text-purple-600" />
              <span className="text-sm">
                Conclusão: {format(parseISO(atividade.data_conclusao), "dd/MM/yyyy")}
              </span>
            </div>
          )}
          {atividade.frequencia && (
            <div className="text-sm text-slate-600">
              <span className="font-medium">Frequência:</span> {atividade.frequencia}
            </div>
          )}
        </div>

        {atividade.descricao && (
          <p className="text-sm text-slate-500 mb-4 line-clamp-3">
            {atividade.descricao}
          </p>
        )}

        <div className="flex items-center justify-between mb-4">
          <span className={`text-xs px-3 py-1 rounded-full font-semibold ${prioridadeColors[atividade.prioridade]}`}>
            Prioridade: {atividade.prioridade}
          </span>
        </div>

        <div className="flex gap-2 pt-4 border-t border-slate-100">
          <Button
            onClick={() => onEdit(atividade)}
            variant="outline"
            size="sm"
            className="flex-1 hover:bg-cyan-50 hover:text-cyan-700 hover:border-cyan-200"
          >
            <Edit className="w-4 h-4 mr-2" />
            Editar
          </Button>
          <Button
            onClick={() => onDelete(atividade.id)}
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