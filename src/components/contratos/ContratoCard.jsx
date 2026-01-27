import React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { 
  Edit, 
  Trash2, 
  Calendar, 
  DollarSign, 
  FileText,
  User,
  AlertCircle,
  Download
} from "lucide-react";
import { format, differenceInDays } from "date-fns";
import { ptBR } from "date-fns/locale";

export default function ContratoCard({ contrato, onEdit, onDelete, statusConfig }) {
  const StatusIcon = statusConfig[contrato.status]?.icon || FileText;
  
  const diasRestantes = contrato.data_termino 
    ? differenceInDays(new Date(contrato.data_termino), new Date())
    : null;

  const vencendoEm30Dias = diasRestantes !== null && diasRestantes > 0 && diasRestantes <= 30;

  return (
    <Card className={`border-2 hover:shadow-xl transition-all ${
      vencendoEm30Dias ? 'border-amber-300' : 'border-slate-200'
    }`}>
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between">
          <div className="flex-1">
            <div className="flex items-center gap-2 mb-2">
              <CardTitle className="text-lg font-bold text-slate-800">
                {contrato.titulo}
              </CardTitle>
              {vencendoEm30Dias && (
                <AlertCircle className="w-4 h-4 text-amber-600" />
              )}
            </div>
            {contrato.numero_contrato && (
              <p className="text-xs text-slate-500 mb-2">
                Nº {contrato.numero_contrato}
              </p>
            )}
            <div className="flex items-center gap-2">
              <Badge className={`${statusConfig[contrato.status]?.color || 'bg-slate-100 text-slate-700'}`}>
                <StatusIcon className="w-3 h-3 mr-1" />
                {statusConfig[contrato.status]?.label || contrato.status}
              </Badge>
              {vencendoEm30Dias && (
                <Badge className="bg-amber-100 text-amber-700 border-amber-300">
                  Vence em {diasRestantes} dias
                </Badge>
              )}
            </div>
          </div>
        </div>
      </CardHeader>

      <CardContent className="space-y-3">
        {contrato.paciente_nome && (
          <div className="flex items-center gap-2 text-sm">
            <User className="w-4 h-4 text-cyan-600" />
            <span className="text-slate-600">{contrato.paciente_nome}</span>
          </div>
        )}

        {contrato.tipo_contrato && (
          <div className="flex items-center gap-2 text-sm">
            <FileText className="w-4 h-4 text-cyan-600" />
            <span className="text-slate-600 capitalize">
              {contrato.tipo_contrato.replace(/_/g, ' ')}
            </span>
          </div>
        )}

        <div className="grid grid-cols-2 gap-3 pt-3 border-t">
          <div>
            <p className="text-xs text-slate-500">Início</p>
            <p className="text-sm font-semibold text-slate-700">
              {format(new Date(contrato.data_inicio), "dd/MM/yyyy")}
            </p>
          </div>
          {contrato.data_termino && (
            <div>
              <p className="text-xs text-slate-500">Término</p>
              <p className={`text-sm font-semibold ${
                vencendoEm30Dias ? 'text-amber-700' : 'text-slate-700'
              }`}>
                {format(new Date(contrato.data_termino), "dd/MM/yyyy")}
              </p>
            </div>
          )}
        </div>

        {(contrato.valor_mensal || contrato.valor_total) && (
          <div className="flex items-center justify-between py-2 px-3 bg-green-50 rounded-lg border border-green-200">
            <div className="flex items-center gap-2">
              <DollarSign className="w-4 h-4 text-green-600" />
              <span className="text-sm text-green-700 font-medium">
                {contrato.valor_mensal ? 'Mensal' : 'Total'}
              </span>
            </div>
            <span className="text-lg font-bold text-green-700">
              R$ {(contrato.valor_mensal || contrato.valor_total || 0).toFixed(2)}
            </span>
          </div>
        )}

        {contrato.descricao && (
          <p className="text-xs text-slate-600 line-clamp-2 pt-2 border-t">
            {contrato.descricao}
          </p>
        )}

        <div className="flex gap-2 pt-3 border-t">
          <Button
            onClick={() => onEdit(contrato)}
            variant="outline"
            size="sm"
            className="flex-1"
          >
            <Edit className="w-4 h-4 mr-1" />
            Editar
          </Button>
          {contrato.arquivo_contrato_url && (
            <Button
              variant="outline"
              size="sm"
              onClick={() => window.open(contrato.arquivo_contrato_url, '_blank')}
            >
              <Download className="w-4 h-4" />
            </Button>
          )}
          <Button
            onClick={() => onDelete(contrato.id)}
            variant="outline"
            size="sm"
            className="text-red-600 hover:bg-red-50"
          >
            <Trash2 className="w-4 h-4" />
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}