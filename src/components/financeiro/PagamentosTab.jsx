import React, { useState } from "react";
import { base44 } from "@/api/base44Client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Plus, Calendar, DollarSign, User, Edit, Trash2, CheckCircle } from "lucide-react";
import { format, parseISO, isPast } from "date-fns";
import { ptBR } from "date-fns/locale";
import PagamentoModal from "@/components/financeiro/PagamentoModal";

const statusColors = {
  pendente: "bg-amber-100 text-amber-700 border-amber-200",
  pago: "bg-green-100 text-green-700 border-green-200",
  parcial: "bg-blue-100 text-blue-700 border-blue-200",
  atrasado: "bg-red-100 text-red-700 border-red-200",
  cancelado: "bg-slate-100 text-slate-700 border-slate-200"
};

const formasPagamento = {
  dinheiro: 'Dinheiro',
  cartao_credito: 'Cartão de Crédito',
  cartao_debito: 'Cartão de Débito',
  pix: 'PIX',
  transferencia: 'Transferência',
  cheque: 'Cheque',
  convenio: 'Convênio'
};

export default function PagamentosTab() {
  const [showModal, setShowModal] = useState(false);
  const [editingPagamento, setEditingPagamento] = useState(null);
  const queryClient = useQueryClient();

  const { data: pagamentos = [], isLoading } = useQuery({
    queryKey: ['pagamentos'],
    queryFn: () => base44.entities.Pagamento.list('-data_vencimento'),
  });

  const { data: pacientes = [] } = useQuery({
    queryKey: ['pacientes'],
    queryFn: () => base44.entities.Paciente.list(),
  });

  const deletePagamento = useMutation({
    mutationFn: (id) => base44.entities.Pagamento.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries(['pagamentos']);
    },
  });

  const updatePagamento = useMutation({
    mutationFn: ({ id, data }) => base44.entities.Pagamento.update(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries(['pagamentos']);
    },
  });

  const handleEdit = (pagamento) => {
    setEditingPagamento(pagamento);
    setShowModal(true);
  };

  const handleDelete = async (id) => {
    if (confirm('Tem certeza que deseja excluir este pagamento?')) {
      await deletePagamento.mutateAsync(id);
    }
  };

  const handleMarcarPago = async (pagamento) => {
    await updatePagamento.mutateAsync({
      id: pagamento.id,
      data: {
        ...pagamento,
        status: 'pago',
        valor_pago: pagamento.valor,
        data_pagamento: new Date().toISOString().split('T')[0]
      }
    });
  };

  const handleClose = () => {
    setShowModal(false);
    setEditingPagamento(null);
  };

  const getStatusAtualizado = (pagamento) => {
    if (pagamento.status === 'pendente' && isPast(new Date(pagamento.data_vencimento))) {
      return 'atrasado';
    }
    return pagamento.status;
  };

  if (isLoading) {
    return (
      <Card className="border-none shadow-lg">
        <CardContent className="p-6">
          <div className="text-center py-12">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-cyan-600 mx-auto mb-4"></div>
            <p className="text-slate-500">Carregando pagamentos...</p>
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
            <h3 className="text-xl font-bold text-slate-800">Lista de Pagamentos</h3>
            <Button 
              onClick={() => setShowModal(true)}
              className="bg-gradient-to-r from-cyan-500 to-teal-500 hover:from-cyan-600 hover:to-teal-600"
            >
              <Plus className="w-4 h-4 mr-2" />
              Novo Pagamento
            </Button>
          </div>

          {pagamentos.length === 0 ? (
            <div className="text-center py-12">
              <DollarSign className="w-16 h-16 text-slate-300 mx-auto mb-4" />
              <p className="text-slate-500 mb-2">Nenhum pagamento registrado</p>
              <p className="text-sm text-slate-400">Clique em "Novo Pagamento" para adicionar</p>
            </div>
          ) : (
            <div className="space-y-3">
              {pagamentos.map((pagamento) => {
                const statusAtual = getStatusAtualizado(pagamento);
                return (
                  <div 
                    key={pagamento.id}
                    className="flex items-center justify-between p-4 rounded-xl bg-gradient-to-r from-slate-50 to-blue-50/50 border border-slate-100 hover:shadow-md transition-all"
                  >
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-2">
                        <User className="w-4 h-4 text-cyan-600" />
                        <span className="font-semibold text-slate-800">
                          {pagamento.paciente_nome || 'Paciente não informado'}
                        </span>
                        <span className={`px-2 py-1 rounded-full text-xs font-semibold border ${statusColors[statusAtual]}`}>
                          {statusAtual === 'atrasado' ? 'Atrasado' : 
                           statusAtual === 'pago' ? 'Pago' : 
                           statusAtual === 'pendente' ? 'Pendente' : 
                           statusAtual === 'parcial' ? 'Parcial' : 
                           statusAtual === 'cancelado' ? 'Cancelado' : statusAtual}
                        </span>
                      </div>
                      <div className="flex items-center gap-4 text-sm text-slate-600">
                        <div className="flex items-center gap-1">
                          <Calendar className="w-3 h-3" />
                          <span>Venc: {format(parseISO(pagamento.data_vencimento), "dd/MM/yyyy")}</span>
                        </div>
                        <div className="flex items-center gap-1">
                          <DollarSign className="w-3 h-3" />
                          <span className="font-medium">R$ {(pagamento.valor || 0).toFixed(2)}</span>
                        </div>
                        {pagamento.forma_pagamento && (
                          <span className="px-2 py-0.5 bg-slate-100 rounded text-xs">
                            {formasPagamento[pagamento.forma_pagamento] || pagamento.forma_pagamento}
                          </span>
                        )}
                        {pagamento.tipo && (
                          <span className="px-2 py-0.5 bg-blue-100 text-blue-700 rounded text-xs">
                            {pagamento.tipo}
                          </span>
                        )}
                      </div>
                      {pagamento.data_pagamento && (
                        <div className="text-xs text-green-600 mt-1">
                          Pago em: {format(parseISO(pagamento.data_pagamento), "dd/MM/yyyy")}
                        </div>
                      )}
                      {pagamento.observacoes && (
                        <div className="text-xs text-slate-500 mt-1">
                          {pagamento.observacoes}
                        </div>
                      )}
                    </div>
                    <div className="flex gap-2">
                      {statusAtual === 'pendente' && (
                        <Button
                          onClick={() => handleMarcarPago(pagamento)}
                          size="sm"
                          className="bg-green-600 hover:bg-green-700"
                        >
                          <CheckCircle className="w-4 h-4 mr-1" />
                          Pago
                        </Button>
                      )}
                      <Button
                        onClick={() => handleEdit(pagamento)}
                        variant="outline"
                        size="sm"
                        className="hover:bg-cyan-50"
                      >
                        <Edit className="w-4 h-4" />
                      </Button>
                      <Button
                        onClick={() => handleDelete(pagamento.id)}
                        variant="outline"
                        size="sm"
                        className="hover:bg-red-50"
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>

      {showModal && (
        <PagamentoModal
          pagamento={editingPagamento}
          pacientes={pacientes}
          onClose={handleClose}
        />
      )}
    </>
  );
}