import React, { useState } from "react";
import { base44 } from "@/api/base44Client";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
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

export default function ContratoModal({ contrato, onClose }) {
  const queryClient = useQueryClient();
  const [activeTab, setActiveTab] = useState('geral');

  const [formData, setFormData] = useState({
    numero_contrato: '',
    paciente_id: '',
    paciente_nome: '',
    tipo_contrato: 'prestacao_servicos',
    titulo: '',
    descricao: '',
    data_inicio: new Date().toISOString().split('T')[0],
    data_termino: '',
    data_assinatura: '',
    valor_mensal: 0,
    valor_total: 0,
    forma_pagamento: 'mensal',
    dia_vencimento: 10,
    status: 'rascunho',
    renovacao_automatica: false,
    prazo_aviso_cancelamento: 30,
    clausulas: [],
    servicos_inclusos: [],
    responsavel_legal: '',
    cpf_responsavel: '',
    testemunha_1: '',
    testemunha_2: '',
    observacoes: '',
    // Campos de Pacote (Migração)
    cor: '#06b6d4',
    desconto_percentual: 0,
    validade_dias: 365,
    quantidade_sessoes: 0,
    ...contrato
  });

  const [novaClausula, setNovaClausula] = useState({ titulo: '', descricao: '', obrigatoria: false });
  const [novoServico, setNovoServico] = useState({ servico: '', quantidade: 1, periodicidade: 'mensal' });
  const [modeloSelecionado, setModeloSelecionado] = useState('');

  const { data: pacientes = [] } = useQuery({
    queryKey: ['pacientes'],
    queryFn: () => base44.entities.Paciente.list(),
  });

  const { data: modelos = [] } = useQuery({
    queryKey: ['contrato-modelos'],
    queryFn: () => base44.entities.ContratoModelo.list(),
  });

  const saveMutation = useMutation({
    mutationFn: async (data) => {
      if (contrato) {
        return await base44.entities.Contrato.update(contrato.id, data);
      } else {
        return await base44.entities.Contrato.create(data);
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries(['contratos']);
      onClose();
    },
  });

  const handleSubmit = async (e) => {
    e.preventDefault();
    await saveMutation.mutateAsync(formData);
  };

  const handlePacienteChange = (pacienteId) => {
    const paciente = pacientes.find(p => p.id === pacienteId);

    if (!paciente) return;

    // Determinar quem é o responsável financeiro
    let responsavelNome = '';
    let responsavelCPF = '';

    if (paciente.responsavel_financeiro_tipo === 'proprio_paciente') {
      // O próprio paciente
      responsavelNome = paciente.nome_completo;
      responsavelCPF = paciente.cpf || '';
    } else if (paciente.responsavel_financeiro_tipo === 'responsavel_legal') {
      // Responsável legal
      responsavelNome = paciente.nome_responsavel_legal || '';
      responsavelCPF = paciente.cpf_responsavel_legal || '';
    } else if (paciente.responsavel_financeiro_tipo === 'outra_pessoa') {
      // Outra pessoa
      responsavelNome = paciente.nome_responsavel_financeiro || '';
      responsavelCPF = paciente.cpf_responsavel_financeiro || '';
    }

    setFormData({
      ...formData,
      paciente_id: pacienteId,
      paciente_nome: paciente.nome_completo || '',
      responsavel_legal: responsavelNome,
      cpf_responsavel: responsavelCPF,
    });
  };

  const handleModeloChange = (modeloId) => {
    if (!modeloId || modeloId === 'none') {
      setModeloSelecionado('');
      return;
    }

    const modelo = modelos.find(m => m.id === modeloId);
    if (!modelo) return;

    let dataTermino = formData.data_termino;
    if (modelo.duracao_meses) {
      const dataInicio = new Date(formData.data_inicio);
      const novaDataTermino = new Date(dataInicio);
      novaDataTermino.setMonth(novaDataTermino.getMonth() + modelo.duracao_meses);
      dataTermino = novaDataTermino.toISOString().split('T')[0];
    }

    setFormData({
      ...formData,
      tipo_contrato: modelo.tipo_contrato || formData.tipo_contrato,
      titulo: modelo.titulo || formData.titulo,
      descricao: modelo.descricao || formData.descricao,
      valor_mensal: modelo.valor_mensal || formData.valor_mensal,
      valor_total: modelo.valor_total || formData.valor_total,
      forma_pagamento: modelo.forma_pagamento || formData.forma_pagamento,
      dia_vencimento: modelo.dia_vencimento || formData.dia_vencimento,
      renovacao_automatica: modelo.renovacao_automatica || formData.renovacao_automatica,
      prazo_aviso_cancelamento: modelo.prazo_aviso_cancelamento || formData.prazo_aviso_cancelamento,
      clausulas: modelo.clausulas || formData.clausulas,
      servicos_inclusos: modelo.servicos_inclusos || formData.servicos_inclusos,
      data_termino: dataTermino,
    });

    setModeloSelecionado(modeloId);
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

  const modelosAtivos = modelos.filter(m => m.ativo);

  return (
    <Dialog open={true} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-2xl font-bold text-slate-800">
            {contrato ? 'Editar Contrato' : 'Novo Contrato'}
          </DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit}>
          {!contrato && modelosAtivos.length > 0 && (
            <div className="mb-6 p-4 bg-purple-50 border-2 border-purple-200 rounded-lg">
              <Label className="text-purple-900 font-semibold mb-2 block">
                🎯 Usar Modelo de Contrato (Opcional)
              </Label>
              <Select value={modeloSelecionado} onValueChange={handleModeloChange}>
                <SelectTrigger className="bg-white">
                  <SelectValue placeholder="Selecione um modelo para preencher automaticamente" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">Nenhum modelo (criar do zero)</SelectItem>
                  {modelosAtivos.map(m => (
                    <SelectItem key={m.id} value={m.id}>
                      {m.nome_modelo} - {m.titulo}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {modeloSelecionado && (
                <p className="text-xs text-purple-700 mt-2">
                  ✓ Modelo aplicado! Você pode editar os campos conforme necessário.
                </p>
              )}
            </div>
          )}

          <Tabs value={activeTab} onValueChange={setActiveTab}>
            <TabsList className="grid w-full grid-cols-4">
              <TabsTrigger value="geral">Geral</TabsTrigger>
              <TabsTrigger value="financeiro">Financeiro</TabsTrigger>
              <TabsTrigger value="clausulas">Cláusulas</TabsTrigger>
              <TabsTrigger value="partes">Partes</TabsTrigger>
            </TabsList>

            <TabsContent value="geral" className="space-y-4">
              <div className="grid md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Número do Contrato</Label>
                  <Input
                    value={formData.numero_contrato}
                    onChange={(e) => setFormData({ ...formData, numero_contrato: e.target.value })}
                    placeholder="Ex: CT-2025-001"
                  />
                </div>

                <div className="space-y-2">
                  <Label>Status *</Label>
                  <Select
                    value={formData.status}
                    onValueChange={(val) => setFormData({ ...formData, status: val })}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="rascunho">Rascunho</SelectItem>
                      <SelectItem value="ativo">Ativo</SelectItem>
                      <SelectItem value="suspenso">Suspenso</SelectItem>
                      <SelectItem value="cancelado">Cancelado</SelectItem>
                      <SelectItem value="finalizado">Finalizado</SelectItem>
                      <SelectItem value="renovacao">Em Renovação</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2 md:col-span-2">
                  <Label>Título do Contrato *</Label>
                  <Input
                    value={formData.titulo}
                    onChange={(e) => setFormData({ ...formData, titulo: e.target.value })}
                    placeholder="Ex: Contrato de Prestação de Serviços"
                    required
                  />
                </div>

                <div className="space-y-2">
                  <Label>Tipo de Contrato *</Label>
                  <Select
                    value={formData.tipo_contrato}
                    onValueChange={(val) => setFormData({ ...formData, tipo_contrato: val })}
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
                  <Label>Paciente *</Label>
                  <Select
                    value={formData.paciente_id}
                    onValueChange={handlePacienteChange}
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
                  <Label>Data de Início *</Label>
                  <Input
                    type="date"
                    value={formData.data_inicio}
                    onChange={(e) => setFormData({ ...formData, data_inicio: e.target.value })}
                    required
                  />
                </div>

                <div className="space-y-2">
                  <Label>Data de Término</Label>
                  <Input
                    type="date"
                    value={formData.data_termino}
                    onChange={(e) => setFormData({ ...formData, data_termino: e.target.value })}
                  />
                </div>

                <div className="space-y-2">
                  <Label>Data de Assinatura</Label>
                  <Input
                    type="date"
                    value={formData.data_assinatura}
                    onChange={(e) => setFormData({ ...formData, data_assinatura: e.target.value })}
                  />
                </div>

                <div className="space-y-2">
                  <Label>Prazo Aviso Cancelamento (dias)</Label>
                  <Input
                    type="number"
                    value={formData.prazo_aviso_cancelamento}
                    onChange={(e) => setFormData({ ...formData, prazo_aviso_cancelamento: parseInt(e.target.value) })}
                  />
                </div>

                <div className="space-y-2 md:col-span-2">
                  <Label>Descrição</Label>
                  <Textarea
                    value={formData.descricao}
                    onChange={(e) => setFormData({ ...formData, descricao: e.target.value })}
                    rows={4}
                    placeholder="Descrição detalhada do contrato..."
                  />
                </div>
              </div>
            </TabsContent>

            <TabsContent value="financeiro" className="space-y-4">
              <div className="grid md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Valor Mensal</Label>
                  <Input
                    type="number"
                    step="0.01"
                    value={formData.valor_mensal}
                    onChange={(e) => setFormData({ ...formData, valor_mensal: parseFloat(e.target.value) })}
                    placeholder="0.00"
                  />
                </div>

                <div className="space-y-2">
                  <Label>Valor Total</Label>
                  <Input
                    type="number"
                    step="0.01"
                    value={formData.valor_total}
                    onChange={(e) => setFormData({ ...formData, valor_total: parseFloat(e.target.value) })}
                    placeholder="0.00"
                  />
                </div>

                <div className="space-y-2">
                  <Label>Forma de Pagamento</Label>
                  <Select
                    value={formData.forma_pagamento}
                    onValueChange={(val) => setFormData({ ...formData, forma_pagamento: val })}
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
                    onChange={(e) => setFormData({ ...formData, dia_vencimento: parseInt(e.target.value) })}
                  />
                </div>

                <div className="space-y-2 md:col-span-2">
                  <div className="flex items-center gap-2">
                    <input
                      type="checkbox"
                      id="renovacao"
                      checked={formData.renovacao_automatica}
                      onChange={(e) => setFormData({ ...formData, renovacao_automatica: e.target.checked })}
                      className="w-4 h-4"
                    />
                    <Label htmlFor="renovacao">Renovação Automática</Label>
                  </div>
                </div>

                <div className="md:col-span-2 pt-4 border-t">
                  <Label className="text-lg font-semibold block mb-4">Configuração do Pacote</Label>
                  <div className="grid md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label>Cor de Identificação</Label>
                      <div className="flex items-center gap-2">
                        <Input
                          type="color"
                          value={formData.cor}
                          onChange={(e) => setFormData({ ...formData, cor: e.target.value })}
                          className="w-12 h-10 p-1"
                        />
                        <span className="text-sm text-slate-500">Cor usada para identificar sessões deste contrato na agenda</span>
                      </div>
                    </div>

                    <div className="space-y-2">
                      <Label>Desconto (%)</Label>
                      <Input
                        type="number"
                        step="0.1"
                        value={formData.desconto_percentual}
                        onChange={(e) => setFormData({ ...formData, desconto_percentual: parseFloat(e.target.value) })}
                        placeholder="0.0"
                      />
                    </div>

                    <div className="space-y-2">
                      <Label>Validade (dias)</Label>
                      <Input
                        type="number"
                        value={formData.validade_dias}
                        onChange={(e) => setFormData({ ...formData, validade_dias: parseInt(e.target.value) })}
                        placeholder="365"
                      />
                    </div>

                    <div className="space-y-2">
                      <Label>Quantidade de Sessões/Consultas</Label>
                      <Input
                        type="number"
                        value={formData.quantidade_sessoes}
                        onChange={(e) => setFormData({ ...formData, quantidade_sessoes: parseInt(e.target.value) })}
                        placeholder="0"
                      />
                    </div>
                  </div>
                </div>
              </div>

              <div className="space-y-4 pt-4 border-t">
                <Label className="text-lg font-semibold">Serviços Inclusos</Label>

                <div className="grid md:grid-cols-4 gap-2">
                  <Input
                    value={novoServico.servico}
                    onChange={(e) => setNovoServico({ ...novoServico, servico: e.target.value })}
                    placeholder="Nome do serviço"
                  />
                  <Input
                    type="number"
                    value={novoServico.quantidade}
                    onChange={(e) => setNovoServico({ ...novoServico, quantidade: parseInt(e.target.value) })}
                    placeholder="Qtd"
                  />
                  <Select
                    value={novoServico.periodicidade}
                    onValueChange={(val) => setNovoServico({ ...novoServico, periodicidade: val })}
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

            <TabsContent value="clausulas" className="space-y-4">
              <div className="space-y-4">
                <div className="grid gap-2">
                  <Input
                    value={novaClausula.titulo}
                    onChange={(e) => setNovaClausula({ ...novaClausula, titulo: e.target.value })}
                    placeholder="Título da cláusula"
                  />
                  <Textarea
                    value={novaClausula.descricao}
                    onChange={(e) => setNovaClausula({ ...novaClausula, descricao: e.target.value })}
                    placeholder="Descrição da cláusula"
                    rows={3}
                  />
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <input
                        type="checkbox"
                        id="obrigatoria"
                        checked={novaClausula.obrigatoria}
                        onChange={(e) => setNovaClausula({ ...novaClausula, obrigatoria: e.target.checked })}
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

            <TabsContent value="partes" className="space-y-4">
              <div className="p-4 bg-blue-50 border-2 border-blue-200 rounded-lg mb-4">
                <p className="text-sm text-blue-800">
                  ℹ️ Os dados do responsável são preenchidos automaticamente ao selecionar o paciente, baseado no <strong>Responsável Financeiro</strong> cadastrado.
                </p>
              </div>

              <div className="grid md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Responsável Legal</Label>
                  <Input
                    value={formData.responsavel_legal}
                    onChange={(e) => setFormData({ ...formData, responsavel_legal: e.target.value })}
                    placeholder="Nome do responsável"
                  />
                </div>

                <div className="space-y-2">
                  <Label>CPF do Responsável</Label>
                  <Input
                    value={formData.cpf_responsavel}
                    onChange={(e) => setFormData({ ...formData, cpf_responsavel: e.target.value })}
                    placeholder="000.000.000-00"
                  />
                </div>

                <div className="space-y-2">
                  <Label>Testemunha 1</Label>
                  <Input
                    value={formData.testemunha_1}
                    onChange={(e) => setFormData({ ...formData, testemunha_1: e.target.value })}
                    placeholder="Nome da primeira testemunha"
                  />
                </div>

                <div className="space-y-2">
                  <Label>Testemunha 2</Label>
                  <Input
                    value={formData.testemunha_2}
                    onChange={(e) => setFormData({ ...formData, testemunha_2: e.target.value })}
                    placeholder="Nome da segunda testemunha"
                  />
                </div>

                <div className="space-y-2 md:col-span-2">
                  <Label>Observações</Label>
                  <Textarea
                    value={formData.observacoes}
                    onChange={(e) => setFormData({ ...formData, observacoes: e.target.value })}
                    rows={4}
                    placeholder="Observações adicionais sobre o contrato..."
                  />
                </div>
              </div>
            </TabsContent>
          </Tabs>

          <div className="flex justify-end gap-3 mt-6 pt-6 border-t">
            <Button type="button" variant="outline" onClick={onClose}>
              Cancelar
            </Button>
            <Button
              type="submit"
              className="bg-gradient-to-r from-cyan-500 to-teal-500 hover:from-cyan-600 hover:to-teal-600"
              disabled={saveMutation.isPending}
            >
              {saveMutation.isPending ? 'Salvando...' : contrato ? 'Atualizar Contrato' : 'Criar Contrato'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}