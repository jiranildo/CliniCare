import React, { useState } from "react";
import { base44 } from "@/api/base44Client";
import { useMutation, useQueryClient } from "@tanstack/react-query";
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

export default function EstoqueModal({ item, onClose }) {
  const queryClient = useQueryClient();
  const [formData, setFormData] = useState(item || {
    nome: '',
    codigo: '',
    categoria: 'medicamento',
    quantidade: 0,
    unidade: 'un',
    estoque_minimo: 0,
    valor_unitario: 0,
    fornecedor: '',
    lote: '',
    data_validade: '',
    localizacao: '',
    observacoes: '',
    status: 'disponivel'
  });

  const saveMutation = useMutation({
    mutationFn: async (data) => {
      if (item) {
        return await base44.entities.EstoqueItem.update(item.id, data);
      } else {
        return await base44.entities.EstoqueItem.create(data);
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries(['estoque']);
      onClose();
    },
  });

  const handleSubmit = async (e) => {
    e.preventDefault();
    await saveMutation.mutateAsync(formData);
  };

  return (
    <Dialog open={true} onOpenChange={onClose}>
      <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-2xl font-bold text-slate-800">
            {item ? 'Editar Item' : 'Novo Item de Estoque'}
          </DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="grid md:grid-cols-2 gap-4">
            <div className="space-y-2 md:col-span-2">
              <Label>Nome do Item *</Label>
              <Input
                value={formData.nome}
                onChange={(e) => setFormData({...formData, nome: e.target.value})}
                placeholder="Ex: Luvas de procedimento"
                required
              />
            </div>

            <div className="space-y-2">
              <Label>Código</Label>
              <Input
                value={formData.codigo}
                onChange={(e) => setFormData({...formData, codigo: e.target.value})}
                placeholder="Ex: EST-001"
              />
            </div>

            <div className="space-y-2">
              <Label>Categoria *</Label>
              <Select 
                value={formData.categoria} 
                onValueChange={(val) => setFormData({...formData, categoria: val})}
                required
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="medicamento">Medicamento</SelectItem>
                  <SelectItem value="material_descartavel">Material Descartável</SelectItem>
                  <SelectItem value="equipamento">Equipamento</SelectItem>
                  <SelectItem value="insumo">Insumo</SelectItem>
                  <SelectItem value="outros">Outros</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>Quantidade *</Label>
              <Input
                type="number"
                value={formData.quantidade}
                onChange={(e) => setFormData({...formData, quantidade: Number(e.target.value)})}
                required
              />
            </div>

            <div className="space-y-2">
              <Label>Unidade</Label>
              <Input
                value={formData.unidade}
                onChange={(e) => setFormData({...formData, unidade: e.target.value})}
                placeholder="un, cx, ml, kg"
              />
            </div>

            <div className="space-y-2">
              <Label>Estoque Mínimo</Label>
              <Input
                type="number"
                value={formData.estoque_minimo}
                onChange={(e) => setFormData({...formData, estoque_minimo: Number(e.target.value)})}
              />
            </div>

            <div className="space-y-2">
              <Label>Valor Unitário (R$)</Label>
              <Input
                type="number"
                step="0.01"
                value={formData.valor_unitario}
                onChange={(e) => setFormData({...formData, valor_unitario: Number(e.target.value)})}
              />
            </div>

            <div className="space-y-2 md:col-span-2">
              <Label>Fornecedor</Label>
              <Input
                value={formData.fornecedor}
                onChange={(e) => setFormData({...formData, fornecedor: e.target.value})}
                placeholder="Nome do fornecedor"
              />
            </div>

            <div className="space-y-2">
              <Label>Lote</Label>
              <Input
                value={formData.lote}
                onChange={(e) => setFormData({...formData, lote: e.target.value})}
                placeholder="Número do lote"
              />
            </div>

            <div className="space-y-2">
              <Label>Data de Validade</Label>
              <Input
                type="date"
                value={formData.data_validade}
                onChange={(e) => setFormData({...formData, data_validade: e.target.value})}
              />
            </div>

            <div className="space-y-2">
              <Label>Localização</Label>
              <Input
                value={formData.localizacao}
                onChange={(e) => setFormData({...formData, localizacao: e.target.value})}
                placeholder="Ex: Prateleira A, Gaveta 3"
              />
            </div>

            <div className="space-y-2">
              <Label>Status</Label>
              <Select 
                value={formData.status} 
                onValueChange={(val) => setFormData({...formData, status: val})}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="disponivel">Disponível</SelectItem>
                  <SelectItem value="estoque_baixo">Estoque Baixo</SelectItem>
                  <SelectItem value="vencido">Vencido</SelectItem>
                  <SelectItem value="indisponivel">Indisponível</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2 md:col-span-2">
              <Label>Observações</Label>
              <Textarea
                value={formData.observacoes}
                onChange={(e) => setFormData({...formData, observacoes: e.target.value})}
                rows={2}
                placeholder="Observações sobre o item..."
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