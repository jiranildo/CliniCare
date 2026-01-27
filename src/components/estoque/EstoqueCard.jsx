import React from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Package, Edit, Trash2, AlertTriangle, MapPin, Calendar } from "lucide-react";
import { format } from "date-fns";

const categoriaColors = {
  medicamento: "bg-blue-100 text-blue-700",
  material_descartavel: "bg-green-100 text-green-700",
  equipamento: "bg-purple-100 text-purple-700",
  insumo: "bg-orange-100 text-orange-700",
  outros: "bg-slate-100 text-slate-700"
};

const statusColors = {
  disponivel: "bg-green-100 text-green-700 border-green-200",
  estoque_baixo: "bg-amber-100 text-amber-700 border-amber-200",
  vencido: "bg-red-100 text-red-700 border-red-200",
  indisponivel: "bg-slate-100 text-slate-700 border-slate-200"
};

export default function EstoqueCard({ item, onEdit, onDelete }) {
  const isEstoqueBaixo = item.quantidade <= (item.estoque_minimo || 0);
  const valorTotal = (item.quantidade || 0) * (item.valor_unitario || 0);

  return (
    <Card className="border-none shadow-lg hover:shadow-xl transition-all duration-300 overflow-hidden">
      <div className={`h-1.5 bg-gradient-to-r ${
        isEstoqueBaixo ? 'from-red-400 to-rose-500' : 'from-cyan-400 to-teal-500'
      }`} />
      
      <CardContent className="p-6">
        <div className="flex justify-between items-start mb-4">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-full bg-gradient-to-br from-cyan-500 to-teal-500 flex items-center justify-center shadow-lg">
              <Package className="w-6 h-6 text-white" />
            </div>
            <div>
              <h3 className="font-bold text-slate-800 text-lg">
                {item.nome}
              </h3>
              {item.codigo && (
                <p className="text-sm text-slate-500">
                  Cód: {item.codigo}
                </p>
              )}
            </div>
          </div>
        </div>

        <div className="space-y-2 mb-4">
          <div className="flex items-center justify-between">
            <span className="text-sm text-slate-600">Quantidade:</span>
            <span className={`font-bold ${isEstoqueBaixo ? 'text-red-600' : 'text-slate-800'}`}>
              {item.quantidade} {item.unidade}
            </span>
          </div>
          
          {isEstoqueBaixo && (
            <div className="flex items-center gap-2 text-amber-600 text-sm bg-amber-50 p-2 rounded">
              <AlertTriangle className="w-4 h-4" />
              <span>Estoque baixo! Mín: {item.estoque_minimo}</span>
            </div>
          )}

          {item.valor_unitario > 0 && (
            <>
              <div className="flex items-center justify-between text-sm">
                <span className="text-slate-600">Valor Unitário:</span>
                <span className="font-medium text-slate-700">
                  R$ {item.valor_unitario.toFixed(2)}
                </span>
              </div>
              <div className="flex items-center justify-between text-sm">
                <span className="text-slate-600">Valor Total:</span>
                <span className="font-bold text-green-600">
                  R$ {valorTotal.toFixed(2)}
                </span>
              </div>
            </>
          )}
        </div>

        <div className="space-y-2 mb-4">
          <span className={`inline-block px-3 py-1 rounded-full text-xs font-semibold ${categoriaColors[item.categoria]}`}>
            {item.categoria.replace(/_/g, ' ')}
          </span>

          {item.localizacao && (
            <div className="flex items-center gap-2 text-sm text-slate-600">
              <MapPin className="w-3 h-3" />
              <span>{item.localizacao}</span>
            </div>
          )}

          {item.data_validade && (
            <div className="flex items-center gap-2 text-sm text-slate-600">
              <Calendar className="w-3 h-3" />
              <span>Validade: {format(new Date(item.data_validade), "dd/MM/yyyy")}</span>
            </div>
          )}

          {item.fornecedor && (
            <p className="text-sm text-slate-500">
              Fornecedor: {item.fornecedor}
            </p>
          )}
        </div>

        <div className="flex gap-2 pt-4 border-t border-slate-100">
          <Button
            onClick={() => onEdit(item)}
            variant="outline"
            size="sm"
            className="flex-1 hover:bg-cyan-50 hover:text-cyan-700 hover:border-cyan-200"
          >
            <Edit className="w-4 h-4 mr-2" />
            Editar
          </Button>
          <Button
            onClick={() => onDelete(item.id)}
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