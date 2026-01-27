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
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Plus, X } from "lucide-react";

export default function ContratoModeloModal({ modelo, onClose }) {
  const queryClient = useQueryClient();
  const [activeTab, setActiveTab] = useState('geral');
  
  const [formData, setFormData] = useState({
    nome_modelo: '',
    descricao_modelo: '',
    tipo_contrato: 'prestacao_servicos',
    titulo: '',
    descricao: '',
    valor_mensal: 0,
    valor_total: 0,
    forma_pagamento: 'mensal',
    dia_vencimento: 10,
    duracao_meses: 12,
    renovacao_automatica: false,
    prazo_aviso_cancelamento: 30,
    clausulas: [],
    servicos_inclusos: [],
    ativo: true,
    cor: '#9333ea',
    observacoes: '',
    ...modelo
  });

  const [novaClausula, setNovaClausula] = useState({ titulo: '', descricao: '', obrigatoria: false });
  const [novoServico, setNovoServico] = useState({ servico: '', quantidade: 1, periodicidade: 'mensal' });

  const saveMutation = useMutation({
    mutationFn: async (data) => {
      if (modelo) {
        return await base44.entities.ContratoModelo.update(modelo.id, data);
      } else {
        return await base44.entities.ContratoModelo.create(data);
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries(['contrato-modelos']);
      onClose();
    },
  });

  const handleSubmit = async (e) => {
    e.preventDefault();
    await saveMutation.mutateAsync(formData);
  };

  const adicionarClausula = () => {
    if (novaClausula.titulo && novaClausula.descricao) {
      setFormData({
        ...formData,
        clausulas: [...(formData.clausulas || []), novaClausula]
      });
      setNovaClausula({ titulo: '', descricao: '', obrigatoria: false });
    }
  };

  const removerClausula = (index) => {
    setFormData({
      ...formData,
      clausulas: formData.clausulas.filter((_, i) => i !== index)
    });
  };

  const adicionarServico = () => {
    if (novoServico.servico) {
      setFormData({
        ...formData,
        servicos_inclusos: [...(formData.servicos_inclusos || []), novoServico]
      });
      setNovoServico({ servico: '', quantidade: 1, periodicidade: 'mensal' });
    }
  };

  const removerServico = (index) => {
    setFormData({
      ...formData,
      servicos_inclusos: formData.servicos_inclusos.filter((_, i) => i !== index)
    });
  };

  return (
    <Dialog open={true} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-2xl font-bold text-slate-800">
            {modelo ? 'Editar Modelo' : 'Novo Modelo de Contrato'}
          </DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit}>
          <Tabs value={activeTab} onValueChange={setActiveTab}>
            <TabsList className="grid w-full grid-cols-3">
              <TabsTrigger value="geral">Informações</TabsTrigger>
              <TabsTrigger value="clausulas">Cláusulas</TabsTrigger>
              <TabsTrigger value="servicos">Serviços</TabsTrigger>
            </TabsList>

            {/* ABA: INFORMAÇÕES GERAIS */}
            <TabsContent value="geral" className="space-y-4">
              <div className="grid md:grid-cols-2 gap-4">
                <div className="space-y-2 md:col-span-2">
                  <Label>Nome do Modelo *</Label>
                  <Input
                    value={formData.nome_modelo}
                    onChange={(e) => setFormData({...formData, nome_modelo: e.target.value})}
                    placeholder="Ex: Contrato Mensal - Fisioterapia"
                    required
                  />
                </div>

                <div className="space-y-2 md:col-span-2">
                  <Label>Descrição do Modelo</Label>
                  <Textarea
                    value={formData.descricao_modelo}
                    onChange={(e) => setFormData({...formData, descricao_modelo: e.target.value})}
                    rows={2}
                    placeholder="Breve descrição sobre este modelo..."
                  />
                </div>

                <div className="space-y-2 md:col-span-2">
                  <Label>Título do Contrato *</Label>
                  <Input
                    value={formData.titulo}
                    onChange={(e) => setFormData({...formData, titulo: e.target.value})}
                    placeholder="Ex: Contrato de Prestação de Serviços de Fisioterapia"
                    required
                  />
                </div>

                <div className="space-y-2">
                  <Label>Tipo de Contrato *</Label>
                  <Select 
                    value={formData.tipo_contrato} 
                    onValueChange={(val) => setFormData({...formData, tipo_contrato: val})}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="prestacao_servicos">Prestação de Serviços</SelectItem>
                      <SelectItem value="plano_saude">Plano de Saúde</SelectItem>
                      <SelectItem value="parceria">Parceria</SelectItem>
                      <SelectItem value="fornecimento">Fornecimento</SelectItem>
                      <SelectItem value="locacao">Locação</SelectItem>
                      <SelectItem value="outro">Outro</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label>Duração Padrão (meses)</Label>
                  <Input
                    type="number"
                    value={formData.duracao_meses}
                    onChange={(e) => setFormData({...formData, duracao_meses: parseInt(e.target.value)})}
                  />
                </div>

                <div className="space-y-2">
                  <Label>Valor Mensal (R$)</Label>
                  <Input
                    type="number"
                    step="0.01"
                    value={formData.valor_mensal}
                    onChange={(e) => setFormData({...formData, valor_mensal: parseFloat(e.target.value)})}
                  />
                </div>

                <div className="space-y-2">
                  <Label>Valor Total (R$)</Label>
                  <Input
                    type="number"
                    step="0.01"
                    value={formData.valor_total}
                    onChange={(e) => setFormData({...formData, valor_total: parseFloat(e.target.value)})}
                  />
                </div>

                <div className="space-y-2">
                  <Label>Forma de Pagamento</Label>
                  <Select 
                    value={formData.forma_pagamento} 
                    onValueChange={(val) => setFormData({...formData, forma_pagamento: val})}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="mensal">Mensal</SelectItem>
                      <SelectItem value="trimestral">Trimestral</SelectItem>
                      <SelectItem value="semestral">Semestral</SelectItem>
                      <SelectItem value="anual">Anual</SelectItem>
                      <SelectItem value="avista">À Vista</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label>Dia do Vencimento</Label>
                  <Input
                    type="number"
                    min="1"
                    max="31"
                    value={formData.dia_vencimento}
                    onChange={(e) => setFormData({...formData, dia_vencimento: parseInt(e.target.value)})}
                  />
                </div>

                <div className="space-y-2">
                  <Label>Prazo Aviso Cancelamento (dias)</Label>
                  <Input
                    type="number"
                    value={formData.prazo_aviso_cancelamento}
                    onChange={(e) => setFormData({...formData, prazo_aviso_cancelamento: parseInt(e.target.value)})}
                  />
                </div>

                <div className="space-y-2">
                  <Label>Cor do Modelo</Label>
                  <Input
                    type="color"
                    value={formData.cor}
                    onChange={(e) => setFormData({...formData, cor: e.target.value})}
                  />
                </div>

                <div className="space-y-2 md:col-span-2">
                  <div className="flex items-center gap-2">
                    <input
                      type="checkbox"
                      id="renovacao"
                      checked={formData.renovacao_automatica}
                      onChange={(e) => setFormData({...formData, renovacao_automatica: e.target.checked})}
                      className="w-4 h-4"
                    />
                    <Label htmlFor="renovacao">Renovação Automática</Label>
                  </div>
                </div>

                <div className="space-y-2 md:col-span-2">
                  <div className="flex items-center gap-2">
                    <input
                      type="checkbox"
                      id="ativo"
                      checked={formData.ativo}
                      onChange={(e) => setFormData({...formData, ativo: e.target.checked})}
                      className="w-4 h-4"
                    />
                    <Label htmlFor="ativo">Modelo Ativo</Label>
                  </div>
                </div>

                <div className="space-y-2 md:col-span-2">
                  <Label>Descrição do Contrato</Label>
                  <Textarea
                    value={formData.descricao}
                    onChange={(e) => setFormData({...formData, descricao: e.target.value})}
                    rows={4}
                    placeholder="Texto descritivo que aparecerá no contrato..."
                  />
                </div>

                <div className="space-y-2 md:col-span-2">
                  <Label>Observações</Label>
                  <Textarea
                    value={formData.observacoes}
                    onChange={(e) => setFormData({...formData, observacoes: e.target.value})}
                    rows={2}
                    placeholder="Observações internas sobre o modelo..."
                  />
                </div>
              </div>
            </TabsContent>

            {/* ABA: CLÁUSULAS */}
            <TabsContent value="clausulas" className="space-y-4">
              <div className="space-y-4">
                <div className="grid gap-2">
                  <Input
                    value={novaClausula.titulo}
                    onChange={(e) => setNovaClausula({...novaClausula, titulo: e.target.value})}
                    placeholder="Título da cláusula"
                  />
                  <Textarea
                    value={novaClausula.descricao}
                    onChange={(e) => setNovaClausula({...novaClausula, descricao: e.target.value})}
                    placeholder="Descrição da cláusula"
                    rows={3}
                  />
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <input
                        type="checkbox"
                        id="obrigatoria"
                        checked={novaClausula.obrigatoria}
                        onChange={(e) => setNovaClausula({...novaClausula, obrigatoria: e.target.checked})}
                        className="w-4 h-4"
                      />
                      <Label htmlFor="obrigatoria">Cláusula Obrigatória</Label>
                    </div>
                    <Button type="button" onClick={adicionarClausula}>
                      <Plus className="w-4 h-4 mr-2" />
                      Adicionar Cláusula
                    </Button>
                  </div>
                </div>

                {formData.clausulas?.length > 0 && (
                  <div className="space-y-3">
                    {formData.clausulas.map((clausula, index) => (
                      <div key={index} className="p-4 bg-slate-50 rounded-lg border">
                        <div className="flex items-start justify-between mb-2">
                          <div className="flex-1">
                            <h4 className="font-semibold text-slate-800">{clausula.titulo}</h4>
                            {clausula.obrigatoria && (
                              <span className="text-xs text-red-600 font-medium">Obrigatória</span>
                            )}
                          </div>
                          <Button
                            type="button"
                            variant="ghost"
                            size="sm"
                            onClick={() => removerClausula(index)}
                          >
                            <X className="w-4 h-4 text-red-600" />
                          </Button>
                        </div>
                        <p className="text-sm text-slate-600">{clausula.descricao}</p>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </TabsContent>

            {/* ABA: SERVIÇOS */}
            <TabsContent value="servicos" className="space-y-4">
              <div className="space-y-4">
                <Label className="text-lg font-semibold">Serviços Inclusos no Modelo</Label>
                
                <div className="grid md:grid-cols-4 gap-2">
                  <Input
                    value={novoServico.servico}
                    onChange={(e) => setNovoServico({...novoServico, servico: e.target.value})}
                    placeholder="Nome do serviço"
                  />
                  <Input
                    type="number"
                    value={novoServico.quantidade}
                    onChange={(e) => setNovoServico({...novoServico, quantidade: parseInt(e.target.value)})}
                    placeholder="Qtd"
                  />
                  <Select 
                    value={novoServico.periodicidade} 
                    onValueChange={(val) => setNovoServico({...novoServico, periodicidade: val})}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="mensal">Mensal</SelectItem>
                      <SelectItem value="semanal">Semanal</SelectItem>
                      <SelectItem value="unico">Único</SelectItem>
                    </SelectContent>
                  </Select>
                  <Button type="button" onClick={adicionarServico}>
                    <Plus className="w-4 h-4" />
                  </Button>
                </div>

                {formData.servicos_inclusos?.length > 0 && (
                  <div className="space-y-2">
                    {formData.servicos_inclusos.map((servico, index) => (
                      <div key={index} className="flex items-center justify-between p-3 bg-slate-50 rounded-lg">
                        <span className="text-sm">
                          {servico.servico} - {servico.quantidade}x ({servico.periodicidade})
                        </span>
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          onClick={() => removerServico(index)}
                        >
                          <X className="w-4 h-4 text-red-600" />
                        </Button>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </TabsContent>
          </Tabs>

          <div className="flex justify-end gap-3 mt-6 pt-6 border-t">
            <Button type="button" variant="outline" onClick={onClose}>
              Cancelar
            </Button>
            <Button 
              type="submit" 
              className="bg-gradient-to-r from-purple-500 to-indigo-500 hover:from-purple-600 hover:to-indigo-600"
              disabled={saveMutation.isPending}
            >
              {saveMutation.isPending ? 'Salvando...' : modelo ? 'Atualizar Modelo' : 'Criar Modelo'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}