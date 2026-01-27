import React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { 
  Edit, 
  Trash2, 
  FileText,
  DollarSign
} from "lucide-react";

export default function ContratoModeloCard({ modelo, onEdit, onDelete }) {
  return (
    <Card className="border-2 border-purple-200 hover:shadow-xl transition-all">
      <CardHeader className="pb-3 bg-gradient-to-r from-purple-50 to-indigo-50">
        <div className="flex items-start justify-between">
          <div className="flex-1">
            <CardTitle className="text-lg font-bold text-slate-800 mb-1">
              {modelo.nome_modelo}
            </CardTitle>
            <p className="text-sm text-slate-600 line-clamp-1">
              {modelo.titulo}
            </p>
          </div>
          <div className={`ml-2 px-2 py-1 rounded-full text-xs font-semibold ${
            modelo.ativo ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'
          }`}>
            {modelo.ativo ? 'Ativo' : 'Inativo'}
          </div>
        </div>
      </CardHeader>

      <CardContent className="space-y-3">
        <div className="flex items-center gap-2 text-sm">
          <FileText className="w-4 h-4 text-purple-600" />
          <span className="text-slate-600 capitalize">
            {modelo.tipo_contrato?.replace(/_/g, ' ')}
          </span>
        </div>

        {modelo.descricao_modelo && (
          <p className="text-xs text-slate-600 line-clamp-2">
            {modelo.descricao_modelo}
          </p>
        )}

        {modelo.valor_mensal && (
          <div className="flex items-center justify-between py-2 px-3 bg-green-50 rounded-lg border border-green-200">
            <div className="flex items-center gap-2">
              <DollarSign className="w-4 h-4 text-green-600" />
              <span className="text-sm text-green-700 font-medium">Valor Mensal</span>
            </div>
            <span className="text-lg font-bold text-green-700">
              R$ {(modelo.valor_mensal || 0).toFixed(2)}
            </span>
          </div>
        )}

        {modelo.duracao_meses && (
          <div className="flex items-center justify-between text-sm">
            <span className="text-slate-500">Duração</span>
            <span className="font-semibold text-slate-700">{modelo.duracao_meses} meses</span>
          </div>
        )}

        {modelo.clausulas && modelo.clausulas.length > 0 && (
          <div className="flex items-center justify-between text-sm">
            <span className="text-slate-500">Cláusulas</span>
            <Badge variant="outline">{modelo.clausulas.length}</Badge>
          </div>
        )}

        {modelo.servicos_inclusos && modelo.servicos_inclusos.length > 0 && (
          <div className="flex items-center justify-between text-sm">
            <span className="text-slate-500">Serviços</span>
            <Badge variant="outline">{modelo.servicos_inclusos.length}</Badge>
          </div>
        )}

        <div className="flex gap-2 pt-3 border-t">
          <Button
            onClick={() => onEdit(modelo)}
            variant="outline"
            size="sm"
            className="flex-1"
          >
            <Edit className="w-4 h-4 mr-1" />
            Editar
          </Button>
          <Button
            onClick={() => onDelete(modelo.id)}
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