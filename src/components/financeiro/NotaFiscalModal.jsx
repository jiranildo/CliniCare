import React, { useState } from "react";
import { base44 } from "@/api/base44Client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

export default function NotaFiscalModal({ nota, onClose }) {
  const queryClient = useQueryClient();
  const [formData, setFormData] = useState({
    paciente_id: '',
    paciente_nome: '',
    numero_nota: '',
    mes_referencia: '',
    data_emissao: new Date().toISOString().split('T')[0],
    valor_total: 0,
    quantidade_consultas: 0,
    descricao_servicos: '',
    status: 'emitida',
    observacoes: '',
    ...nota,
    // Ensure we map the calculated fields correctly if they come from the helper
    valor_total: nota?.valor_total || nota?.valorCalculado || 0,
    quantidade_consultas: nota?.quantidade_consultas || nota?.quantidadeConsultas || 0,
    descricao_servicos: nota?.descricao_servicos || nota?.descricaoServicos || ''
  });

  const { data: pacientes = [] } = useQuery({
    queryKey: ['pacientes'],
    queryFn: () => base44.entities.Paciente.list(),
  });

  const saveMutation = useMutation({
    mutationFn: async (data) => {
      if (nota?.id) {
        return await base44.entities.NotaFiscal.update(nota.id, data);
      } else {
        return await base44.entities.NotaFiscal.create(data);
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries(['notas-fiscais']);
      onClose();
    },
  });

  const handleSubmit = async (e) => {
    e.preventDefault();

    // Create a clean payload with only the fields that exist in the database
    const payload = {
      paciente_id: formData.paciente_id,
      paciente_nome: formData.paciente_nome,
      numero_nota: formData.numero_nota,
      mes_referencia: formData.mes_referencia,
      data_emissao: formData.data_emissao,
      valor_total: formData.valor_total,
      quantidade_consultas: formData.quantidade_consultas,
      descricao_servicos: formData.descricao_servicos,
      status: formData.status,
      observacoes: formData.observacoes
    };

    await saveMutation.mutateAsync(payload);
  };

  const handlePacienteChange = (pacienteId) => {
    const paciente = pacientes.find(p => p.id === pacienteId);
    setFormData({
      ...formData,
      paciente_id: pacienteId,
      paciente_nome: paciente?.nome_completo || ''
    });
  };

  return (
    <Dialog open={true} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-2xl font-bold text-slate-800">
            {nota?.id ? 'Editar Nota Fiscal' : 'Nova Nota Fiscal'}
          </DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="grid md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Paciente *</Label>
              <Select
                value={formData.paciente_id}
                onValueChange={handlePacienteChange}
                required
              >
                <SelectTrigger>
                  <SelectValue placeholder="Selecione o paciente" />
                </SelectTrigger>
                <SelectContent>
                  {pacientes.map(p => (
                    <SelectItem key={p.id} value={p.id}>
                      {p.nome_completo}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>Número da Nota</Label>
              <Input
                value={formData.numero_nota}
                onChange={(e) => setFormData({ ...formData, numero_nota: e.target.value })}
                placeholder="Ex: NF-001/2025"
              />
            </div>

            <div className="space-y-2">
              <Label>Mês de Referência *</Label>
              <Input
                type="month"
                value={formData.mes_referencia}
                onChange={(e) => setFormData({ ...formData, mes_referencia: e.target.value })}
                required
              />
            </div>

            <div className="space-y-2">
              <Label>Data de Emissão *</Label>
              <Input
                type="date"
                value={formData.data_emissao}
                onChange={(e) => setFormData({ ...formData, data_emissao: e.target.value })}
                required
              />
            </div>

            <div className="space-y-2">
              <Label>Valor Total (R$) *</Label>
              <Input
                type="number"
                step="0.01"
                value={formData.valor_total}
                onChange={(e) => setFormData({ ...formData, valor_total: Number(e.target.value) })}
                required
              />
            </div>

            <div className="space-y-2">
              <Label>Quantidade de Consultas</Label>
              <Input
                type="number"
                value={formData.quantidade_consultas}
                onChange={(e) => setFormData({ ...formData, quantidade_consultas: Number(e.target.value) })}
              />
            </div>

            <div className="space-y-2">
              <Label>Status</Label>
              <Select
                value={formData.status}
                onValueChange={(val) => setFormData({ ...formData, status: val })}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="emitida">Emitida</SelectItem>
                  <SelectItem value="enviada">Enviada</SelectItem>
                  <SelectItem value="paga">Paga</SelectItem>
                  <SelectItem value="cancelada">Cancelada</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2 md:col-span-2">
              <Label>Descrição dos Serviços</Label>
              <Textarea
                value={formData.descricao_servicos}
                onChange={(e) => setFormData({ ...formData, descricao_servicos: e.target.value })}
                rows={3}
                placeholder="Descreva os serviços prestados..."
              />
            </div>

            <div className="space-y-2 md:col-span-2">
              <Label>Observações</Label>
              <Textarea
                value={formData.observacoes}
                onChange={(e) => setFormData({ ...formData, observacoes: e.target.value })}
                rows={2}
              />
            </div>
          </div>

          <div className="flex justify-end gap-3 pt-4 border-t">
            <Button type="button" variant="outline" onClick={onClose}>
              Cancelar
            </Button>
            <Button
              type="submit"
              className="bg-gradient-to-r from-cyan-500 to-teal-500 hover:from-cyan-600 hover:to-teal-600"
              disabled={saveMutation.isPending}
            >
              {saveMutation.isPending ? 'Salvando...' : 'Salvar'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}