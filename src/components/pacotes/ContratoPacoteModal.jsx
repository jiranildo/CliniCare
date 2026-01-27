import React, { useState, useEffect } from "react";
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
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Info } from "lucide-react";
import { addMonths, addDays, format } from "date-fns";

export default function ContratoPacoteModal({ pacotes, pacientes, onClose }) {
  const queryClient = useQueryClient();
  const [formData, setFormData] = useState({
    paciente_id: '',
    paciente_nome: '',
    pacote_id: '',
    pacote_nome: '',
    tipo_pagamento: 'mensal',
    valor_total: 0,
    valor_parcela: 0,
    quantidade_parcelas: 1,
    data_inicio: new Date().toISOString().split('T')[0],
    data_fim: '',
    data_proximo_pagamento: new Date().toISOString().split('T')[0],
    consultas_utilizadas: 0,
    consultas_total: 0,
    status: 'ativo',
    forma_pagamento: 'pix',
    desconto_aplicado: 0,
    observacoes: ''
  });

  const [pacoteSelecionado, setPacoteSelecionado] = useState(null);

  useEffect(() => {
    if (formData.pacote_id) {
      const pacote = pacotes.find(p => p.id === formData.pacote_id);
      if (pacote) {
        setPacoteSelecionado(pacote);
        
        // Calcular valores
        const valorComDesconto = pacote.valor_base * (1 - (pacote.desconto_percentual || 0) / 100);
        const dataInicio = new Date(formData.data_inicio);
        let dataFim = null;
        let valorParcela = valorComDesconto;
        let quantidadeParcelas = 1;

        switch (formData.tipo_pagamento) {
          case 'mensal':
            dataFim = addMonths(dataInicio, 1);
            break;
          case 'bimestral':
            dataFim = addMonths(dataInicio, 2);
            break;
          case 'trimestral':
            dataFim = addMonths(dataInicio, 3);
            quantidadeParcelas = 3;
            valorParcela = valorComDesconto / 3;
            break;
          case 'semestral':
            dataFim = addMonths(dataInicio, 6);
            quantidadeParcelas = 6;
            valorParcela = valorComDesconto / 6;
            break;
          case 'anual':
            dataFim = addMonths(dataInicio, 12);
            quantidadeParcelas = 12;
            valorParcela = valorComDesconto / 12;
            break;
          case 'avista':
            dataFim = pacote.validade_dias ? addDays(dataInicio, pacote.validade_dias) : addMonths(dataInicio, 12);
            break;
          default:
            dataFim = addMonths(dataInicio, 1);
        }

        setFormData(prev => ({
          ...prev,
          pacote_nome: pacote.nome,
          valor_total: valorComDesconto,
          valor_parcela: valorParcela,
          quantidade_parcelas: quantidadeParcelas,
          consultas_total: pacote.quantidade_consultas || 0,
          data_fim: dataFim ? dataFim.toISOString().split('T')[0] : '',
          desconto_aplicado: pacote.desconto_percentual || 0
        }));
      }
    }
  }, [formData.pacote_id, formData.tipo_pagamento, formData.data_inicio, pacotes]);

  const saveMutation = useMutation({
    mutationFn: async (data) => {
      return await base44.entities.ContratoPacote.create(data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries(['contratos-pacote']);
      onClose();
    },
  });

  const handleSubmit = async (e) => {
    e.preventDefault();
    await saveMutation.mutateAsync(formData);
  };

  const handlePacienteChange = (pacienteId) => {
    const paciente = pacientes.find(p => p.id === pacienteId);
    setFormData({
      ...formData,
      paciente_id: pacienteId,
      paciente_nome: paciente?.nome_completo || ''
    });
  };

  const pacotesAtivos = pacotes.filter(p => p.ativo);
  const modalidadesDisponiveis = pacoteSelecionado?.modalidades_pagamento || ['mensal'];

  return (
    <Dialog open={true} onOpenChange={onClose}>
      <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-2xl font-bold text-slate-800">
            Novo Contrato de Pacote
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
              <Label>Pacote *</Label>
              <Select 
                value={formData.pacote_id} 
                onValueChange={(val) => setFormData({...formData, pacote_id: val})}
                required
              >
                <SelectTrigger>
                  <SelectValue placeholder="Selecione o pacote" />
                </SelectTrigger>
                <SelectContent>
                  {pacotesAtivos.map(p => (
                    <SelectItem key={p.id} value={p.id}>
                      {p.nome} - R$ {(p.valor_base || 0).toFixed(2)}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {pacoteSelecionado && (
              <div className="md:col-span-2">
                <Alert className="bg-blue-50 border-blue-200">
                  <Info className="h-4 w-4 text-blue-600" />
                  <AlertDescription className="text-sm text-blue-900">
                    <strong>{pacoteSelecionado.nome}</strong>
                    {pacoteSelecionado.quantidade_consultas && (
                      <span className="ml-2">• {pacoteSelecionado.quantidade_consultas} consultas</span>
                    )}
                    {pacoteSelecionado.validade_dias && (
                      <span className="ml-2">• Validade: {pacoteSelecionado.validade_dias} dias</span>
                    )}
                    {pacoteSelecionado.desconto_percentual > 0 && (
                      <span className="ml-2 text-green-700">• {pacoteSelecionado.desconto_percentual}% de desconto</span>
                    )}
                  </AlertDescription>
                </Alert>
              </div>
            )}

            <div className="space-y-2">
              <Label>Modalidade de Pagamento *</Label>
              <Select 
                value={formData.tipo_pagamento} 
                onValueChange={(val) => setFormData({...formData, tipo_pagamento: val})}
                required
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {modalidadesDisponiveis.map(mod => (
                    <SelectItem key={mod} value={mod}>
                      {mod === 'consulta' ? 'Por Consulta' :
                       mod === 'mensal' ? 'Mensal' :
                       mod === 'bimestral' ? 'Bimestral' :
                       mod === 'trimestral' ? 'Trimestral' :
                       mod === 'semestral' ? 'Semestral' :
                       mod === 'anual' ? 'Anual' : 'À Vista'}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>Forma de Pagamento *</Label>
              <Select 
                value={formData.forma_pagamento} 
                onValueChange={(val) => setFormData({...formData, forma_pagamento: val})}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="dinheiro">Dinheiro</SelectItem>
                  <SelectItem value="cartao_credito">Cartão de Crédito</SelectItem>
                  <SelectItem value="cartao_debito">Cartão de Débito</SelectItem>
                  <SelectItem value="pix">PIX</SelectItem>
                  <SelectItem value="transferencia">Transferência</SelectItem>
                  <SelectItem value="boleto">Boleto</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>Data de Início *</Label>
              <Input
                type="date"
                value={formData.data_inicio}
                onChange={(e) => setFormData({...formData, data_inicio: e.target.value})}
                required
              />
            </div>

            <div className="space-y-2">
              <Label>Data de Término</Label>
              <Input
                type="date"
                value={formData.data_fim}
                onChange={(e) => setFormData({...formData, data_fim: e.target.value})}
              />
            </div>
          </div>

          {/* Resumo Financeiro */}
          {formData.valor_total > 0 && (
            <div className="p-4 bg-green-50 rounded-lg border border-green-200">
              <h3 className="font-semibold text-green-900 mb-3">Resumo Financeiro</h3>
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <p className="text-green-700">Valor Total:</p>
                  <p className="text-2xl font-bold text-green-900">
                    R$ {formData.valor_total.toFixed(2)}
                  </p>
                </div>
                <div>
                  <p className="text-green-700">Valor da Parcela:</p>
                  <p className="text-2xl font-bold text-green-900">
                    R$ {formData.valor_parcela.toFixed(2)}
                  </p>
                </div>
                {formData.quantidade_parcelas > 1 && (
                  <div>
                    <p className="text-green-700">Quantidade de Parcelas:</p>
                    <p className="text-xl font-bold text-green-900">
                      {formData.quantidade_parcelas}x
                    </p>
                  </div>
                )}
                {formData.desconto_aplicado > 0 && (
                  <div>
                    <p className="text-green-700">Desconto:</p>
                    <p className="text-xl font-bold text-green-900">
                      {formData.desconto_aplicado}%
                    </p>
                  </div>
                )}
              </div>
            </div>
          )}

          <div className="space-y-2">
            <Label>Observações</Label>
            <Textarea
              value={formData.observacoes}
              onChange={(e) => setFormData({...formData, observacoes: e.target.value})}
              rows={3}
              placeholder="Adicione observações sobre o contrato..."
            />
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
              {saveMutation.isPending ? 'Criando...' : 'Criar Contrato'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}