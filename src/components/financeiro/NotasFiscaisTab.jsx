import React, { useState } from "react";
import { base44 } from "@/api/base44Client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Plus, Calendar, DollarSign, User, Edit, Trash2, Receipt, FileText } from "lucide-react";
import { format, parseISO } from "date-fns";
import { ptBR } from "date-fns/locale";
import NotaFiscalModal from "@/components/financeiro/NotaFiscalModal";

const statusColors = {
  emitida: "bg-green-100 text-green-700 border-green-200",
  enviada: "bg-blue-100 text-blue-700 border-blue-200",
  paga: "bg-teal-100 text-teal-700 border-teal-200",
  cancelada: "bg-red-100 text-red-700 border-red-200"
};

const statusLabels = {
  emitida: "Emitida",
  enviada: "Enviada",
  paga: "Paga",
  cancelada: "Cancelada"
};

export default function NotasFiscaisTab() {
  const [showModal, setShowModal] = useState(false);
  const [editingNota, setEditingNota] = useState(null);
  const queryClient = useQueryClient();

  const { data: notasFiscais = [], isLoading } = useQuery({
    queryKey: ['notas-fiscais'],
    queryFn: () => base44.entities.NotaFiscal.list('-data_emissao'),
  });

  const deleteNota = useMutation({
    mutationFn: (id) => base44.entities.NotaFiscal.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries(['notas-fiscais']);
    },
  });

  const handleEdit = (nota) => {
    setEditingNota(nota);
    setShowModal(true);
  };

  const handleDelete = async (id) => {
    if (confirm('Tem certeza que deseja excluir esta nota fiscal?')) {
      await deleteNota.mutateAsync(id);
    }
  };

  const handleClose = () => {
    setShowModal(false);
    setEditingNota(null);
  };

  if (isLoading) {
    return (
      <Card className="border-none shadow-lg">
        <CardContent className="p-6">
          <div className="text-center py-12">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-cyan-600 mx-auto mb-4"></div>
            <p className="text-slate-500">Carregando notas fiscais...</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <>
      <Card className="border-none shadow-lg">
        <CardContent className="p-6">
          <div className="flex justify-between items-center mb-6">
            <h3 className="text-xl font-bold text-slate-800">Notas Fiscais</h3>
            <Button 
              onClick={() => setShowModal(true)}
              className="bg-gradient-to-r from-cyan-500 to-teal-500 hover:from-cyan-600 hover:to-teal-600"
            >
              <Plus className="w-4 h-4 mr-2" />
              Nova Nota Fiscal
            </Button>
          </div>

          {notasFiscais.length === 0 ? (
            <div className="text-center py-12">
              <Receipt className="w-16 h-16 text-slate-300 mx-auto mb-4" />
              <p className="text-slate-500 mb-2">Nenhuma nota fiscal emitida</p>
              <p className="text-sm text-slate-400">Clique em "Nova Nota Fiscal" para adicionar</p>
            </div>
          ) : (
            <div className="space-y-3">
              {notasFiscais.map((nota) => (
                <div 
                  key={nota.id}
                  className="flex items-center justify-between p-4 rounded-xl bg-gradient-to-r from-slate-50 to-purple-50/50 border border-slate-100 hover:shadow-md transition-all"
                >
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      <Receipt className="w-4 h-4 text-purple-600" />
                      <span className="font-semibold text-slate-800">
                        {nota.paciente_nome || 'Paciente não informado'}
                      </span>
                      {nota.numero_nota && (
                        <span className="text-sm text-slate-600">
                          NF: {nota.numero_nota}
                        </span>
                      )}
                      <span className={`px-2 py-1 rounded-full text-xs font-semibold border ${statusColors[nota.status]}`}>
                        {statusLabels[nota.status] || nota.status}
                      </span>
                    </div>
                    <div className="flex items-center gap-4 text-sm text-slate-600">
                      <div className="flex items-center gap-1">
                        <Calendar className="w-3 h-3" />
                        <span>Emissão: {format(parseISO(nota.data_emissao), "dd/MM/yyyy")}</span>
                      </div>
                      <div className="flex items-center gap-1">
                        <DollarSign className="w-3 h-3" />
                        <span className="font-medium">R$ {(nota.valor_total || 0).toFixed(2)}</span>
                      </div>
                      {nota.mes_referencia && (
                        <span className="px-2 py-0.5 bg-purple-100 text-purple-700 rounded text-xs">
                          Ref: {format(new Date(nota.mes_referencia + '-01'), "MMM/yyyy", { locale: ptBR })}
                        </span>
                      )}
                      {nota.quantidade_consultas && (
                        <span className="text-xs text-slate-500">
                          {nota.quantidade_consultas} consulta(s)
                        </span>
                      )}
                    </div>
                    {nota.descricao_servicos && (
                      <div className="text-xs text-slate-500 mt-1">
                        {nota.descricao_servicos}
                      </div>
                    )}
                    {nota.arquivo_url && (
                      <div className="mt-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => window.open(nota.arquivo_url, '_blank')}
                        >
                          <FileText className="w-3 h-3 mr-1" />
                          Ver Nota
                        </Button>
                      </div>
                    )}
                  </div>
                  <div className="flex gap-2">
                    <Button
                      onClick={() => handleEdit(nota)}
                      variant="outline"
                      size="sm"
                      className="hover:bg-purple-50"
                    >
                      <Edit className="w-4 h-4" />
                    </Button>
                    <Button
                      onClick={() => handleDelete(nota.id)}
                      variant="outline"
                      size="sm"
                      className="hover:bg-red-50"
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {showModal && (
        <NotaFiscalModal
          nota={editingNota}
          onClose={handleClose}
        />
      )}
    </>
  );
}