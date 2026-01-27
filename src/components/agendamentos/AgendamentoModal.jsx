import React, { useState } from "react";
import { base44 } from "@/api/base44Client";
import { useMutation, useQueryClient, useQuery } from "@tanstack/react-query";
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
import { AlertCircle, Repeat, Calendar } from "lucide-react";
import { Checkbox } from "@/components/ui/checkbox";
import {
  RadioGroup,
  RadioGroupItem,
} from "@/components/ui/radio-group";
import { addDays, addWeeks, addMonths, parseISO, format } from "date-fns";

export default function AgendamentoModal({ agendamento, pacientes, profissionais, onClose }) {
  const queryClient = useQueryClient();

  // Initialize state with default values merged with passed agendamento data
  const [formData, setFormData] = useState({
    paciente_id: '',
    paciente_nome: '',
    profissional_id: '',
    profissional_nome: '',
    data: '',
    horario: '',
    duracao: 60,
    tipo_consulta: 'retorno',
    status: 'agendado',
    observacoes: '',
    valor: 0,
    recorrencia_tipo: 'nenhuma',
    recorrencia_quantidade: 1,
    recorrencia_ate: '',
    ...agendamento // Spread agendamento last to override defaults if provided
  });

  const [usarRecorrencia, setUsarRecorrencia] = useState(
    agendamento?.recorrencia_tipo && agendamento.recorrencia_tipo !== 'nenhuma'
  );
  const [tipoEdicao, setTipoEdicao] = useState('apenas_este'); // 'apenas_este', 'este_e_futuros', 'toda_serie'

  // Buscar outros agendamentos da mesma série
  const { data: agendamentosDaSerie = [] } = useQuery({
    queryKey: ['agendamentos-serie', agendamento?.agendamento_serie_id],
    queryFn: async () => {
      if (!agendamento?.agendamento_serie_id) return [];
      const todos = await base44.entities.Agendamento.list();
      return todos.filter(a => a.agendamento_serie_id === agendamento.agendamento_serie_id);
    },
    enabled: !!agendamento?.agendamento_serie_id,
  });

  const ehParteDeSerie = agendamento?.id && agendamento.agendamento_serie_id && agendamentosDaSerie.length > 1;

  const saveMutation = useMutation({
    mutationFn: async (data) => {
      if (agendamento?.id) {
        // Editando agendamento existente
        if (ehParteDeSerie) {
          // Lidar com edição de série
          if (tipoEdicao === 'apenas_este') {
            // Editar apenas este agendamento
            return await base44.entities.Agendamento.update(agendamento.id, {
              ...data,
              agendamento_serie_id: null // Remove da série
            });
          } else if (tipoEdicao === 'este_e_futuros') {
            // Editar este e todos os futuros
            const dataAtual = parseISO(agendamento.data);
            const futuros = agendamentosDaSerie.filter(a => {
              const dataAg = parseISO(a.data);
              return dataAg >= dataAtual;
            });

            const promises = futuros.map(ag =>
              base44.entities.Agendamento.update(ag.id, {
                ...ag,
                ...data,
                data: ag.data // Mantém a data de cada agendamento
              })
            );

            return await Promise.all(promises);
          } else {
            // Editar toda a série
            const promises = agendamentosDaSerie.map(ag =>
              base44.entities.Agendamento.update(ag.id, {
                ...ag,
                ...data,
                data: ag.data // Mantém a data de cada agendamento
              })
            );

            return await Promise.all(promises);
          }
        } else {
          // Agendamento simples, apenas atualizar
          return await base44.entities.Agendamento.update(agendamento.id, data);
        }
      } else {
        // Criando novo agendamento
        if (data.recorrencia_tipo !== 'nenhuma' && (data.recorrencia_quantidade > 1 || data.recorrencia_ate)) {
          const agendamentos = gerarAgendamentosRecorrentes(data);
          const serieId = `serie_${Date.now()}`;

          const promises = agendamentos.map(ag =>
            base44.entities.Agendamento.create({
              ...ag,
              agendamento_serie_id: serieId
            })
          );

          return await Promise.all(promises);
        } else {
          return await base44.entities.Agendamento.create(data);
        }
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries(['agendamentos']);
      onClose();
    },
  });

  const gerarAgendamentosRecorrentes = (baseData) => {
    const agendamentos = [];
    const dataInicial = new Date(baseData.data);
    let dataAtual = new Date(dataInicial);

    let quantidade = baseData.recorrencia_quantidade || 1;
    const dataLimite = baseData.recorrencia_ate ? new Date(baseData.recorrencia_ate) : null;

    for (let i = 0; i < quantidade; i++) {
      if (dataLimite && dataAtual > dataLimite) break;

      agendamentos.push({
        ...baseData,
        data: dataAtual.toISOString().split('T')[0],
        recorrencia_tipo: baseData.recorrencia_tipo,
        recorrencia_quantidade: quantidade,
        recorrencia_ate: baseData.recorrencia_ate
      });

      switch (baseData.recorrencia_tipo) {
        case 'diaria':
          dataAtual = addDays(dataAtual, 1);
          break;
        case 'semanal':
          dataAtual = addWeeks(dataAtual, 1);
          break;
        case 'quinzenal':
          dataAtual = addWeeks(dataAtual, 2);
          break;
        case 'mensal':
          dataAtual = addMonths(dataAtual, 1);
          break;
        default:
          break;
      }
    }

    return agendamentos;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    // Clean payload to match database schema
    const dataToSave = {
      paciente_id: formData.paciente_id,
      profissional_id: formData.profissional_id,
      data: formData.data,
      horario: formData.horario,
      duracao: formData.duracao,
      tipo_consulta: formData.tipo_consulta,
      status: formData.status,
      valor: formData.valor,
      observacoes: formData.observacoes,
      recorrencia_tipo: usarRecorrencia ? formData.recorrencia_tipo : 'nenhuma',
      recorrencia_quantidade: usarRecorrencia ? formData.recorrencia_quantidade : 1,
      recorrencia_ate: usarRecorrencia && formData.recorrencia_ate ? formData.recorrencia_ate : null
    };

    await saveMutation.mutateAsync(dataToSave);
  };

  const handlePacienteChange = (pacienteId) => {
    const paciente = pacientes.find(p => p.id === pacienteId);
    setFormData({
      ...formData,
      paciente_id: pacienteId,
      paciente_nome: paciente?.nome_completo || '',
      valor: paciente?.valor_consulta || 0
    });
  };

  const handleProfissionalChange = (profId) => {
    const prof = profissionais.find(p => p.id === profId);
    setFormData({
      ...formData,
      profissional_id: profId,
      profissional_nome: prof?.full_name || ''
    });
  };

  const quantidadePrevia = usarRecorrencia && formData.recorrencia_tipo !== 'nenhuma'
    ? gerarAgendamentosRecorrentes(formData).length
    : 1;

  return (
    <Dialog open={true} onOpenChange={onClose}>
      <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-2xl font-bold text-slate-800">
            {agendamento?.id ? 'Editar Agendamento' : 'Novo Agendamento'}
          </DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-6">
          {ehParteDeSerie && (
            <Alert className="bg-blue-50 border-blue-200">
              <Repeat className="h-4 w-4 text-blue-600" />
              <AlertDescription>
                <div className="space-y-3">
                  <p className="text-sm text-blue-900 font-medium">
                    Este agendamento faz parte de uma série de {agendamentosDaSerie.length} agendamentos recorrentes.
                  </p>

                  <RadioGroup value={tipoEdicao} onValueChange={setTipoEdicao}>
                    <div className="space-y-2">
                      <div className="flex items-center space-x-2">
                        <RadioGroupItem value="apenas_este" id="apenas_este" />
                        <Label htmlFor="apenas_este" className="cursor-pointer font-normal">
                          Editar apenas este agendamento
                        </Label>
                      </div>
                      <div className="flex items-center space-x-2">
                        <RadioGroupItem value="este_e_futuros" id="este_e_futuros" />
                        <Label htmlFor="este_e_futuros" className="cursor-pointer font-normal">
                          Editar este e todos os agendamentos futuros ({
                            agendamentosDaSerie.filter(a => parseISO(a.data) >= parseISO(agendamento.data)).length
                          })
                        </Label>
                      </div>
                      <div className="flex items-center space-x-2">
                        <RadioGroupItem value="toda_serie" id="toda_serie" />
                        <Label htmlFor="toda_serie" className="cursor-pointer font-normal">
                          Editar toda a série ({agendamentosDaSerie.length} agendamentos)
                        </Label>
                      </div>
                    </div>
                  </RadioGroup>
                </div>
              </AlertDescription>
            </Alert>
          )}

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
              <Label>Profissional *</Label>
              <Select
                value={formData.profissional_id}
                onValueChange={handleProfissionalChange}
                required
              >
                <SelectTrigger>
                  <SelectValue placeholder="Selecione o profissional" />
                </SelectTrigger>
                <SelectContent>
                  {profissionais.map(p => (
                    <SelectItem key={p.id} value={p.id}>
                      {p.full_name} {p.especialidade && `- ${p.especialidade}`}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>Data *</Label>
              <Input
                type="date"
                value={formData.data}
                onChange={(e) => setFormData({ ...formData, data: e.target.value })}
                required
              />
            </div>

            <div className="space-y-2">
              <Label>Horário *</Label>
              <Input
                type="time"
                value={formData.horario}
                onChange={(e) => setFormData({ ...formData, horario: e.target.value })}
                required
              />
            </div>

            <div className="space-y-2">
              <Label>Duração (minutos)</Label>
              <Input
                type="number"
                value={formData.duracao}
                onChange={(e) => setFormData({ ...formData, duracao: Number(e.target.value) })}
              />
            </div>

            <div className="space-y-2">
              <Label>Tipo de Consulta</Label>
              <Select
                value={formData.tipo_consulta}
                onValueChange={(val) => setFormData({ ...formData, tipo_consulta: val })}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="primeira_vez">Primeira Vez</SelectItem>
                  <SelectItem value="retorno">Retorno</SelectItem>
                  <SelectItem value="exame">Exame</SelectItem>
                  <SelectItem value="procedimento">Procedimento</SelectItem>
                </SelectContent>
              </Select>
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
                  <SelectItem value="agendado">Agendado</SelectItem>
                  <SelectItem value="confirmado">Confirmado</SelectItem>
                  <SelectItem value="em_atendimento">Em Atendimento</SelectItem>
                  <SelectItem value="concluido">Concluído</SelectItem>
                  <SelectItem value="cancelado">Cancelado</SelectItem>
                  <SelectItem value="faltou">Faltou</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>Valor (R$)</Label>
              <Input
                type="number"
                step="0.01"
                value={formData.valor}
                onChange={(e) => setFormData({ ...formData, valor: Number(e.target.value) })}
              />
            </div>
          </div>

          {!agendamento && (
            <>
              <div className="border-t pt-4">
                <div className="flex items-center space-x-2 mb-4">
                  <Checkbox
                    id="recorrencia"
                    checked={usarRecorrencia}
                    onCheckedChange={setUsarRecorrencia}
                  />
                  <label
                    htmlFor="recorrencia"
                    className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 flex items-center gap-2"
                  >
                    <Repeat className="w-4 h-4" />
                    Agendamento Recorrente
                  </label>
                </div>

                {usarRecorrencia && (
                  <div className="space-y-4 bg-slate-50 p-4 rounded-lg">
                    <div className="grid md:grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label>Frequência</Label>
                        <Select
                          value={formData.recorrencia_tipo}
                          onValueChange={(val) => setFormData({ ...formData, recorrencia_tipo: val })}
                        >
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="diaria">Diariamente</SelectItem>
                            <SelectItem value="semanal">Semanalmente</SelectItem>
                            <SelectItem value="quinzenal">Quinzenalmente</SelectItem>
                            <SelectItem value="mensal">Mensalmente</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>

                      <div className="space-y-2">
                        <Label>Quantidade de Repetições</Label>
                        <Input
                          type="number"
                          min="1"
                          max="52"
                          value={formData.recorrencia_quantidade}
                          onChange={(e) => setFormData({ ...formData, recorrencia_quantidade: Number(e.target.value) })}
                        />
                      </div>

                      <div className="space-y-2 md:col-span-2">
                        <Label>Repetir até (opcional)</Label>
                        <Input
                          type="date"
                          value={formData.recorrencia_ate}
                          onChange={(e) => setFormData({ ...formData, recorrencia_ate: e.target.value })}
                        />
                      </div>
                    </div>

                    <Alert>
                      <Calendar className="h-4 w-4" />
                      <AlertDescription>
                        Serão criados <strong>{quantidadePrevia} agendamentos</strong> com base nas configurações acima.
                      </AlertDescription>
                    </Alert>
                  </div>
                )}
              </div>
            </>
          )}

          {agendamento && !ehParteDeSerie && usarRecorrencia && (
            <div className="border-t pt-4">
              <div className="space-y-4 bg-slate-50 p-4 rounded-lg">
                <p className="text-sm text-slate-600 font-medium">
                  Configurar Recorrência para Agendamentos Futuros
                </p>
                <div className="grid md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Frequência</Label>
                    <Select
                      value={formData.recorrencia_tipo}
                      onValueChange={(val) => setFormData({ ...formData, recorrencia_tipo: val })}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="nenhuma">Sem Recorrência</SelectItem>
                        <SelectItem value="diaria">Diariamente</SelectItem>
                        <SelectItem value="semanal">Semanalmente</SelectItem>
                        <SelectItem value="quinzenal">Quinzenalmente</SelectItem>
                        <SelectItem value="mensal">Mensalmente</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <Label>Quantidade de Repetições</Label>
                    <Input
                      type="number"
                      min="1"
                      max="52"
                      value={formData.recorrencia_quantidade}
                      onChange={(e) => setFormData({ ...formData, recorrencia_quantidade: Number(e.target.value) })}
                    />
                  </div>
                </div>
              </div>
            </div>
          )}

          <div className="space-y-2">
            <Label>Observações</Label>
            <Textarea
              value={formData.observacoes}
              onChange={(e) => setFormData({ ...formData, observacoes: e.target.value })}
              rows={3}
              placeholder="Adicione observações sobre o agendamento..."
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
              {saveMutation.isPending ? 'Salvando...' : 'Salvar'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}