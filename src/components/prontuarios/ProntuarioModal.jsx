
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

export default function ProntuarioModal({ prontuario, pacientes, agendamentos, pacienteId, onClose }) {
  const queryClient = useQueryClient();
  const [user, setUser] = useState(null);
  const [formData, setFormData] = useState(prontuario || {
    paciente_id: pacienteId || '',
    paciente_nome: '',
    profissional_id: '',
    profissional_nome: '',
    agendamento_id: '',
    data_anamnese: new Date().toISOString().split('T')[0],
    queixa_principal: '',
    historico_doenca_atual: '',
    historico_medico: '',
    alergias: '',
    medicamentos_uso: '',
    doencas_preexistentes: '',
    cirurgias_anteriores: '',
    historico_familiar: '',
    habitos: '',
    exame_fisico: '',
    pressao_arterial: '',
    peso: '',
    altura: '',
    imc: '',
    tipo_sanguineo: '',
    hipotese_diagnostica: '',
    conduta: '',
    prescricao: '',
    observacoes: ''
  });

  useEffect(() => {
    const loadUser = async () => {
      try {
        const userData = await base44.auth.me();
        setUser(userData);
        if (!prontuario) {
          setFormData(prev => ({
            ...prev,
            profissional_id: userData.id,
            profissional_nome: userData.full_name
          }));
        }
      } catch (error) {
        console.error("Error loading user:", error);
      }
    };
    loadUser();
  }, [prontuario]);

  useEffect(() => {
    // Calcular IMC automaticamente
    if (formData.peso && formData.altura) {
      const imc = formData.peso / (formData.altura * formData.altura);
      setFormData(prev => ({ ...prev, imc: imc.toFixed(2) }));
    }
  }, [formData.peso, formData.altura]);

  const saveMutation = useMutation({
    mutationFn: async (data) => {
      if (prontuario) {
        return await base44.entities.Anamnese.update(prontuario.id, data);
      } else {
        return await base44.entities.Anamnese.create(data);
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries(['anamneses']);
      if (pacienteId) {
        queryClient.invalidateQueries(['anamneses', pacienteId]);
      }
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

  const handleAgendamentoChange = (agendamentoId) => {
    const agendamento = agendamentos?.find(a => a.id === agendamentoId);
    if (agendamento) {
      setFormData({
        ...formData,
        agendamento_id: agendamentoId,
        paciente_id: agendamento.paciente_id,
        paciente_nome: agendamento.paciente_nome,
        data_anamnese: agendamento.data
      });
    }
  };

  // Filtrar apenas agendamentos de primeira vez
  const agendamentosPrimeiraVez = agendamentos?.filter(a => {
    const filtro = a.tipo_consulta === 'primeira_vez';
    return pacienteId ? (filtro && a.paciente_id === pacienteId) : filtro;
  }) || [];

  return (
    <Dialog open={true} onOpenChange={onClose}>
      <DialogContent className="max-w-5xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-2xl font-bold text-slate-800">
            {prontuario ? 'Editar Anamnese' : 'Nova Anamnese'}
          </DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="grid md:grid-cols-2 gap-4">
            {agendamentosPrimeiraVez.length > 0 && !prontuario && (
              <div className="space-y-2 md:col-span-2">
                <Label>Consulta de Primeira Vez (opcional)</Label>
                <Select 
                  value={formData.agendamento_id} 
                  onValueChange={handleAgendamentoChange}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Selecione uma consulta de primeira vez" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value={null}>Nenhum agendamento</SelectItem>
                    {agendamentosPrimeiraVez.map(a => (
                      <SelectItem key={a.id} value={a.id}>
                        {a.paciente_nome} - {a.data} às {a.horario}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}

            <div className="space-y-2">
              <Label>Paciente *</Label>
              <Select 
                value={formData.paciente_id} 
                onValueChange={handlePacienteChange}
                required
                disabled={!!formData.agendamento_id || !!pacienteId}
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
              <Label>Data da Anamnese *</Label>
              <Input
                type="date"
                value={formData.data_anamnese}
                onChange={(e) => setFormData({...formData, data_anamnese: e.target.value})}
                required
              />
            </div>

            <div className="space-y-2 md:col-span-2">
              <Label>Queixa Principal *</Label>
              <Textarea
                value={formData.queixa_principal}
                onChange={(e) => setFormData({...formData, queixa_principal: e.target.value})}
                rows={2}
                placeholder="Descreva a queixa principal do paciente..."
                required
              />
            </div>

            <div className="space-y-2 md:col-span-2">
              <Label>História da Doença Atual</Label>
              <Textarea
                value={formData.historico_doenca_atual}
                onChange={(e) => setFormData({...formData, historico_doenca_atual: e.target.value})}
                rows={3}
                placeholder="Descreva a evolução dos sintomas..."
              />
            </div>

            <div className="space-y-2 md:col-span-2">
              <Label>Histórico Médico Pregresso</Label>
              <Textarea
                value={formData.historico_medico}
                onChange={(e) => setFormData({...formData, historico_medico: e.target.value})}
                rows={2}
                placeholder="Histórico de saúde do paciente..."
              />
            </div>

            <div className="space-y-2">
              <Label>Alergias</Label>
              <Textarea
                value={formData.alergias}
                onChange={(e) => setFormData({...formData, alergias: e.target.value})}
                rows={2}
                placeholder="Alergias conhecidas..."
              />
            </div>

            <div className="space-y-2">
              <Label>Medicamentos em Uso</Label>
              <Textarea
                value={formData.medicamentos_uso}
                onChange={(e) => setFormData({...formData, medicamentos_uso: e.target.value})}
                rows={2}
                placeholder="Medicamentos de uso contínuo..."
              />
            </div>

            <div className="space-y-2">
              <Label>Doenças Pré-existentes</Label>
              <Textarea
                value={formData.doencas_preexistentes}
                onChange={(e) => setFormData({...formData, doencas_preexistentes: e.target.value})}
                rows={2}
                placeholder="Doenças pré-existentes..."
              />
            </div>

            <div className="space-y-2">
              <Label>Cirurgias Anteriores</Label>
              <Textarea
                value={formData.cirurgias_anteriores}
                onChange={(e) => setFormData({...formData, cirurgias_anteriores: e.target.value})}
                rows={2}
                placeholder="Cirurgias realizadas..."
              />
            </div>

            <div className="space-y-2 md:col-span-2">
              <Label>Histórico Familiar</Label>
              <Textarea
                value={formData.historico_familiar}
                onChange={(e) => setFormData({...formData, historico_familiar: e.target.value})}
                rows={2}
                placeholder="Histórico familiar de doenças..."
              />
            </div>

            <div className="space-y-2 md:col-span-2">
              <Label>Hábitos de Vida</Label>
              <Textarea
                value={formData.habitos}
                onChange={(e) => setFormData({...formData, habitos: e.target.value})}
                rows={2}
                placeholder="Fumo, álcool, exercícios físicos..."
              />
            </div>

            <div className="space-y-2">
              <Label>Pressão Arterial</Label>
              <Input
                value={formData.pressao_arterial}
                onChange={(e) => setFormData({...formData, pressao_arterial: e.target.value})}
                placeholder="Ex: 120/80"
              />
            </div>

            <div className="space-y-2">
              <Label>Tipo Sanguíneo</Label>
              <Select 
                value={formData.tipo_sanguineo} 
                onValueChange={(val) => setFormData({...formData, tipo_sanguineo: val})}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Selecione" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Desconhecido">Desconhecido</SelectItem>
                  <SelectItem value="A+">A+</SelectItem>
                  <SelectItem value="A-">A-</SelectItem>
                  <SelectItem value="B+">B+</SelectItem>
                  <SelectItem value="B-">B-</SelectItem>
                  <SelectItem value="AB+">AB+</SelectItem>
                  <SelectItem value="AB-">AB-</SelectItem>
                  <SelectItem value="O+">O+</SelectItem>
                  <SelectItem value="O-">O-</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>Peso (kg)</Label>
              <Input
                type="number"
                step="0.1"
                value={formData.peso}
                onChange={(e) => setFormData({...formData, peso: Number(e.target.value)})}
                placeholder="Ex: 70.5"
              />
            </div>

            <div className="space-y-2">
              <Label>Altura (m)</Label>
              <Input
                type="number"
                step="0.01"
                value={formData.altura}
                onChange={(e) => setFormData({...formData, altura: Number(e.target.value)})}
                placeholder="Ex: 1.75"
              />
            </div>

            {formData.imc && (
              <div className="space-y-2">
                <Label>IMC (calculado)</Label>
                <Input
                  value={formData.imc}
                  disabled
                  className="bg-slate-50"
                />
              </div>
            )}

            <div className="space-y-2 md:col-span-2">
              <Label>Exame Físico</Label>
              <Textarea
                value={formData.exame_fisico}
                onChange={(e) => setFormData({...formData, exame_fisico: e.target.value})}
                rows={3}
                placeholder="Resultados do exame físico..."
              />
            </div>

            <div className="space-y-2 md:col-span-2">
              <Label>Hipótese Diagnóstica</Label>
              <Textarea
                value={formData.hipotese_diagnostica}
                onChange={(e) => setFormData({...formData, hipotese_diagnostica: e.target.value})}
                rows={2}
                placeholder="CID ou diagnóstico clínico..."
              />
            </div>

            <div className="space-y-2 md:col-span-2">
              <Label>Conduta e Plano Terapêutico</Label>
              <Textarea
                value={formData.conduta}
                onChange={(e) => setFormData({...formData, conduta: e.target.value})}
                rows={3}
                placeholder="Plano terapêutico e orientações..."
              />
            </div>

            <div className="space-y-2 md:col-span-2">
              <Label>Prescrição</Label>
              <Textarea
                value={formData.prescricao}
                onChange={(e) => setFormData({...formData, prescricao: e.target.value})}
                rows={4}
                placeholder="Medicamentos prescritos..."
              />
            </div>

            <div className="space-y-2 md:col-span-2">
              <Label>Observações</Label>
              <Textarea
                value={formData.observacoes}
                onChange={(e) => setFormData({...formData, observacoes: e.target.value})}
                rows={2}
                placeholder="Observações adicionais..."
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
