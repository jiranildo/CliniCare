import React, { useState, useEffect } from "react";
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
import { Plus, Calendar, User, Edit, Trash2, Activity, Mic, MicOff, Sparkles, Clock } from "lucide-react";
import { format, parseISO } from "date-fns";
import { ptBR } from "date-fns/locale";
import { useToast } from "@/components/ui/use-toast";

export default function ProntuarioEvolucoesTab({ paciente, agendamentos, agendamentoInicial, onAgendamentoProcessado }) {
  const [showModal, setShowModal] = useState(false);
  const [editingEvolucao, setEditingEvolucao] = useState(null);
  const queryClient = useQueryClient();
  const [user, setUser] = useState(null);

  React.useEffect(() => {
    const loadUser = async () => {
      try {
        const userData = await base44.auth.me();
        setUser(userData);
      } catch (error) {
        console.error("Error loading user:", error);
      }
    };
    loadUser();
  }, []);

  // Abrir modal automaticamente se houver agendamentoInicial
  useEffect(() => {
    if (agendamentoInicial && user) {
      const now = new Date();
      const evolucaoInicial = {
        paciente_id: paciente.id,
        paciente_nome: paciente.nome_completo,
        profissional_id: user.id,
        profissional_nome: user.full_name,
        agendamento_id: agendamentoInicial.id,
        data_atendimento: agendamentoInicial.data,
        hora_atendimento: format(now, "HH:mm"),
        tipo_atendimento: agendamentoInicial.tipo_consulta === 'primeira_vez' ? 'consulta' :
          agendamentoInicial.tipo_consulta === 'retorno' ? 'retorno' : 'consulta',
        queixa: '',
        evolucao: '',
        resumo: '',
        exame_fisico: '',
        pressao_arterial: '',
        peso: '',
        temperatura: '',
        frequencia_cardiaca: '',
        hipotese_diagnostica: '',
        conduta: '',
        prescricao: '',
        observacoes: agendamentoInicial.observacoes || '',
        retorno_em: ''
      };

      setEditingEvolucao(evolucaoInicial);
      setShowModal(true);

      if (onAgendamentoProcessado) {
        onAgendamentoProcessado();
      }
    }
  }, [agendamentoInicial, user, paciente, onAgendamentoProcessado]);

  const { data: evolucoes = [], isLoading } = useQuery({
    queryKey: ['evolucoes', paciente.id],
    queryFn: () => base44.entities.Evolucao.filter({ paciente_id: paciente.id }, '-data_atendimento'),
  });

  const deleteEvolucao = useMutation({
    mutationFn: (id) => base44.entities.Evolucao.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries(['evolucoes', paciente.id]);
    },
  });

  const handleEdit = (evolucao) => {
    setEditingEvolucao(evolucao);
    setShowModal(true);
  };

  const handleDelete = async (id) => {
    if (confirm('Tem certeza que deseja excluir este atendimento?')) {
      await deleteEvolucao.mutateAsync(id);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h3 className="text-lg font-bold text-slate-800">
          {evolucoes.length > 0 ? `${evolucoes.length} Atendimento(s) Registrado(s)` : 'Nenhum atendimento registrado'}
        </h3>
        <Button
          onClick={() => {
            setEditingEvolucao(null);
            setShowModal(true);
          }}
          size="sm"
          className="bg-gradient-to-r from-cyan-500 to-teal-500 hover:from-cyan-600 hover:to-teal-600 shadow-md"
        >
          <Plus className="w-4 h-4 mr-2" />
          Novo Atendimento
        </Button>
      </div>

      {isLoading ? (
        <div className="text-center py-12">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-cyan-600 mx-auto"></div>
          <p className="text-slate-500 mt-4">Carregando atendimentos...</p>
        </div>
      ) : evolucoes.length === 0 ? (
        <div className="text-center py-12 bg-slate-50 rounded-lg border-2 border-dashed border-slate-200">
          <Activity className="w-16 h-16 text-slate-300 mx-auto mb-4" />
          <p className="text-slate-500 mb-4">Nenhum atendimento registrado para este paciente</p>
          <Button
            onClick={() => setShowModal(true)}
            className="bg-gradient-to-r from-cyan-500 to-teal-500 hover:from-cyan-600 hover:to-teal-600"
          >
            <Plus className="w-4 h-4 mr-2" />
            Registrar Primeiro Atendimento
          </Button>
        </div>
      ) : (
        <div className="space-y-6">
          {evolucoes.map((evolucao) => (
            <div key={evolucao.id} className="bg-white border border-slate-200 rounded-xl p-6 hover:shadow-lg transition-all duration-300">
              <div className="flex items-start justify-between mb-6">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 rounded-full bg-gradient-to-br from-blue-500 to-cyan-500 flex items-center justify-center shadow-md">
                    <Calendar className="w-6 h-6 text-white" />
                  </div>
                  <div>
                    <h4 className="text-lg font-bold text-slate-800">
                      {format(parseISO(evolucao.data_atendimento), "dd 'de' MMMM 'de' yyyy", { locale: ptBR })}
                    </h4>
                    <div className="flex items-center gap-3 text-sm text-slate-500 mt-1">
                      {evolucao.hora_atendimento && (
                        <div className="flex items-center gap-1">
                          <Clock className="w-3.5 h-3.5" />
                          <span>{evolucao.hora_atendimento}</span>
                        </div>
                      )}
                      <span className="hidden md:inline">•</span>
                      <div className="flex items-center gap-1">
                        <User className="w-3.5 h-3.5" />
                        <span>{evolucao.profissional_nome}</span>
                      </div>
                      <span className="px-2.5 py-0.5 bg-blue-100 text-blue-700 rounded-full text-xs font-semibold uppercase tracking-wide">
                        {evolucao.tipo_atendimento}
                      </span>
                    </div>
                  </div>
                </div>
                <div className="flex gap-2">
                  <Button
                    onClick={() => handleEdit(evolucao)}
                    variant="ghost"
                    size="sm"
                    className="hover:bg-slate-100"
                  >
                    <Edit className="w-4 h-4 text-slate-600" />
                  </Button>
                  <Button
                    onClick={() => handleDelete(evolucao.id)}
                    variant="ghost"
                    size="sm"
                    className="hover:bg-red-50"
                  >
                    <Trash2 className="w-4 h-4 text-red-600" />
                  </Button>
                </div>
              </div>

              <div className="grid md:grid-cols-2 gap-6">
                {/* Lado Esquerdo - Detalhes */}
                <div className="space-y-4">
                  {evolucao.evolucao && (
                    <div className="bg-slate-50 p-4 rounded-lg border border-slate-100">
                      <p className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">Descrição do Atendimento</p>
                      <p className="text-slate-700 whitespace-pre-wrap leading-relaxed">{evolucao.evolucao}</p>
                    </div>
                  )}
                  {evolucao.queixa && (
                    <div>
                      <p className="text-sm font-semibold text-slate-700">Queixa:</p>
                      <p className="text-sm text-slate-600">{evolucao.queixa}</p>
                    </div>
                  )}
                </div>

                {/* Lado Direito - Resumo IA & Vitais */}
                <div className="space-y-4">
                  {evolucao.resumo && (
                    <div className="bg-gradient-to-br from-purple-50 to-indigo-50 p-4 rounded-lg border border-purple-100">
                      <div className="flex items-center gap-2 mb-2">
                        <Sparkles className="w-4 h-4 text-purple-600" />
                        <p className="text-xs font-bold text-purple-700 uppercase tracking-wider">Resumo Fonoaudiologist AI</p>
                      </div>
                      <p className="text-slate-700 text-sm whitespace-pre-wrap leading-relaxed">{evolucao.resumo}</p>
                    </div>
                  )}

                  {(evolucao.pressao_arterial || evolucao.peso || evolucao.temperatura || evolucao.frequencia_cardiaca) && (
                    <div className="grid grid-cols-2 gap-3">
                      {evolucao.pressao_arterial && (
                        <div className="bg-white border p-2 rounded text-center">
                          <p className="text-xs text-slate-400 uppercase">PA</p>
                          <p className="font-semibold text-slate-700">{evolucao.pressao_arterial}</p>
                        </div>
                      )}
                      {evolucao.peso && (
                        <div className="bg-white border p-2 rounded text-center">
                          <p className="text-xs text-slate-400 uppercase">Peso</p>
                          <p className="font-semibold text-slate-700">{evolucao.peso} kg</p>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {showModal && (
        <EvolucaoModal
          evolucao={editingEvolucao}
          paciente={paciente}
          agendamentos={agendamentos}
          user={user}
          onClose={() => {
            setShowModal(false);
            setEditingEvolucao(null);
          }}
        />
      )}
    </div>
  );
}

function EvolucaoModal({ evolucao, paciente, agendamentos, user, onClose }) {
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const [isListening, setIsListening] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);

  const [formData, setFormData] = useState(evolucao || {
    paciente_id: paciente.id,
    paciente_nome: paciente.nome_completo,
    profissional_id: user?.id || '',
    profissional_nome: user?.full_name || '',
    agendamento_id: '',
    data_atendimento: new Date().toISOString().split('T')[0],
    hora_atendimento: new Date().toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' }),
    tipo_atendimento: 'consulta',
    queixa: '',
    evolucao: '',
    resumo: '',
    exame_fisico: '',
    hipotese_diagnostica: '',
    conduta: '',
    prescricao: '',
    observacoes: '',
    retorno_em: ''
  });

  const saveMutation = useMutation({
    mutationFn: async (data) => {
      if (evolucao?.id) {
        return await base44.entities.Evolucao.update(evolucao.id, data);
      } else {
        return await base44.entities.Evolucao.create(data);
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries(['evolucoes', paciente.id]);
      toast({
        title: "Sucesso!",
        description: "Atendimento salvo com sucesso.",
        className: "bg-green-500 text-white border-none",
        duration: 5000
      });
      onClose();
    },
    onError: (error) => {
      console.error(error);
      toast({
        title: "Erro ao salvar",
        description: "Não foi possível salvar o atendimento.",
        variant: "destructive"
      });
    }
  });

  const handleSubmit = async (e) => {
    e.preventDefault();
    await saveMutation.mutateAsync(formData);
  };

  const toggleSpeechToText = () => {
    if (!('webkitSpeechRecognition' in window)) {
      alert("Seu navegador não suporta reconhecimento de fala.");
      return;
    }

    if (isListening) {
      setIsListening(false);
      return;
    }

    const recognition = new window.webkitSpeechRecognition();
    recognition.lang = 'pt-BR';
    recognition.continuous = true;
    recognition.interimResults = true;

    recognition.onstart = () => {
      setIsListening(true);
    };

    recognition.onresult = (event) => {
      let finalTranscript = '';
      for (let i = event.resultIndex; i < event.results.length; ++i) {
        if (event.results[i].isFinal) {
          finalTranscript += event.results[i][0].transcript;
        }
      }
      if (finalTranscript) {
        setFormData(prev => ({
          ...prev,
          evolucao: prev.evolucao + (prev.evolucao ? ' ' : '') + finalTranscript
        }));
      }
    };

    recognition.onerror = (event) => {
      console.error("Speech recognition error", event.error);
      setIsListening(false);
    };

    recognition.onend = () => {
      setIsListening(false);
    };

    recognition.start();
    // Stop manually after some time or let user stop
    // Simplistic implementation: user clicks button again to stop (but we lost reference to instance)
    // To fix: store recognition instance in ref. For now, simplistic approach implies it stops on end or silence.
    // Enhanced:
    window.recognitionInstance = recognition;
  };

  const stopListening = () => {
    if (window.recognitionInstance) {
      window.recognitionInstance.stop();
      setIsListening(false);
    }
  };

  const handleGenerateSummary = async () => {
    if (!formData.evolucao || formData.evolucao.length < 10) {
      toast({
        title: "Descrição insuficiente",
        description: "Por favor, descreva o atendimento com mais detalhes antes de gerar o resumo.",
        variant: "warning"
      });
      return;
    }

    setIsGenerating(true);
    try {
      const prompt = `
          Você é uma IA especialista em Fonoaudiologia (Fonoaudiologist AI).
          Analise a seguinte descrição de um atendimento fonoaudiológico e gere um RESUMO TÉCNICO ESTRUTURADO.
          
          O resumo deve conter:
          1. Pontos principais abordados
          2. Hipótese diagnóstica ou evolução observada
          3. Recomendações/Conduta para próximos passos
          
          Descrição do atendimento:
          "${formData.evolucao}"
          
          Queixa do paciente:
          "${formData.queixa}"
          
          Gere apenas o texto do resumo, de forma direta e profissional.
          `;

      const summary = await base44.integrations.Core.InvokeLLM({ prompt });
      setFormData(prev => ({ ...prev, resumo: summary }));

      toast({
        title: "Resumo Gerado!",
        description: "A Fonoaudiologist AI gerou um resumo do atendimento.",
        className: "bg-purple-500 text-white border-none"
      });

    } catch (error) {
      console.error("Erro ao gerar resumo:", error);
      toast({
        title: "Erro na IA",
        description: error.message || "Não foi possível gerar o resumo. Verifique a API Key.",
        variant: "destructive"
      });
    } finally {
      setIsGenerating(false);
    }
  };

  return (
    <Dialog open={true} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-2xl font-bold text-slate-800">
            {evolucao?.id ? 'Editar Atendimento' : 'Novo Atendimento'}
          </DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="grid md:grid-cols-3 gap-4">
            <div className="space-y-2">
              <Label>Data *</Label>
              <Input
                type="date"
                value={formData.data_atendimento}
                onChange={(e) => setFormData({ ...formData, data_atendimento: e.target.value })}
                required
              />
            </div>
            <div className="space-y-2">
              <Label>Horário *</Label>
              <Input
                type="time"
                value={formData.hora_atendimento}
                onChange={(e) => setFormData({ ...formData, hora_atendimento: e.target.value })}
                required
              />
            </div>

            <div className="space-y-2">
              <Label>Tipo de Atendimento *</Label>
              <Select
                value={formData.tipo_atendimento}
                onValueChange={(val) => setFormData({ ...formData, tipo_atendimento: val })}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="consulta">Consulta</SelectItem>
                  <SelectItem value="retorno">Retorno</SelectItem>
                  <SelectItem value="emergencia">Emergência</SelectItem>
                  <SelectItem value="procedimento">Procedimento</SelectItem>
                  <SelectItem value="terapia">Terapia</SelectItem>
                  <SelectItem value="avaliacao">Avaliação</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2 md:col-span-3">
              <Label>Queixa Principal</Label>
              <Input
                value={formData.queixa}
                onChange={(e) => setFormData({ ...formData, queixa: e.target.value })}
                placeholder="Ex: Dificuldade na fala, rouquidão..."
              />
            </div>

            <div className="space-y-2 md:col-span-3 bg-slate-50 p-4 rounded-xl border border-slate-200">
              <div className="flex justify-between items-center mb-2">
                <Label className="text-lg text-slate-700">Descrição do Atendimento</Label>
                <Button
                  type="button"
                  variant={isListening ? "destructive" : "secondary"}
                  size="sm"
                  onClick={isListening ? stopListening : toggleSpeechToText}
                  className="flex items-center gap-2"
                >
                  {isListening ? (
                    <>
                      <span className="relative flex h-3 w-3">
                        <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>
                        <span className="relative inline-flex rounded-full h-3 w-3 bg-red-500"></span>
                      </span>
                      <MicOff className="w-4 h-4" /> Parar Gravação
                    </>
                  ) : (
                    <>
                      <Mic className="w-4 h-4" /> Ditado (Speech-to-Text)
                    </>
                  )}
                </Button>
              </div>
              <Textarea
                value={formData.evolucao}
                onChange={(e) => setFormData({ ...formData, evolucao: e.target.value })}
                rows={8}
                placeholder="Descreva detalhadamente o que foi realizado no atendimento..."
                className="bg-white resize-none"
              />
            </div>

            <div className="space-y-2 md:col-span-3 bg-indigo-50 p-4 rounded-xl border border-indigo-200">
              <div className="flex justify-between items-center mb-2">
                <div className="flex items-center gap-2">
                  <Sparkles className="w-5 h-5 text-indigo-600" />
                  <Label className="text-lg text-indigo-800">Resumo Fonoaudiologist AI</Label>
                </div>
                <Button
                  type="button"
                  onClick={handleGenerateSummary}
                  disabled={isGenerating}
                  className="bg-gradient-to-r from-purple-600 to-indigo-600 text-white shadow hover:opacity-90"
                  size="sm"
                >
                  {isGenerating ? 'Gerando...' : 'Gerar Resumo com IA'}
                </Button>
              </div>
              <Textarea
                value={formData.resumo}
                onChange={(e) => setFormData({ ...formData, resumo: e.target.value })}
                rows={5}
                placeholder="O resumo gerado pela IA aparecerá aqui..."
                className="bg-white/80 border-indigo-200"
              />
            </div>

            <div className="space-y-2 md:col-span-3">
              <Label>Conduta e Orientações</Label>
              <Textarea
                value={formData.conduta}
                onChange={(e) => setFormData({ ...formData, conduta: e.target.value })}
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
              className="bg-gradient-to-r from-cyan-500 to-teal-500 hover:from-cyan-600 hover:to-teal-600 w-32"
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