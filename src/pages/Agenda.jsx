import React, { useState, useMemo } from "react";
import { base44 } from "@/api/base44Client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useNavigate } from "react-router-dom";
import { createPageUrl } from "@/utils";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
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
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSub,
  DropdownMenuSubContent,
  DropdownMenuSubTrigger,
  DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Label } from "@/components/ui/label";
import {
  Calendar,
  ChevronLeft,
  ChevronRight,
  Plus,
  Clock,
  CheckCircle,
  AlertCircle,
  XCircle,
  UserCheck,
  DollarSign,
  Receipt,
  FileText,
  Stethoscope,
  AlertTriangle,
  CalendarDays,
  Edit,
  Play,
  MoreVertical,
  Move,
  Repeat,
  UserX,
  RefreshCw
} from "lucide-react";
import {
  format,
  startOfWeek,
  addDays,
  addWeeks,
  subWeeks,
  startOfMonth,
  endOfMonth,
  addMonths,
  subMonths,
  eachDayOfInterval,
  parseISO,
  isSameDay,
  isSameMonth,
  addMinutes
} from "date-fns";
import { ptBR } from "date-fns/locale";
import AgendamentoModal from "@/components/agendamentos/AgendamentoModal";

export default function Agenda() {
  const [periodoAtual, setPeriodoAtual] = useState(new Date());
  const [visualizacao, setVisualizacao] = useState('semanal');
  const [profissionalSelecionado, setProfissionalSelecionado] = useState('todos');
  const [showModal, setShowModal] = useState(false);
  const [agendamentoSelecionado, setAgendamentoSelecionado] = useState(null);
  const [showMoveDialog, setShowMoveDialog] = useState(false);
  const [moveData, setMoveData] = useState(null);
  const [showSubstituicaoDialog, setShowSubstituicaoDialog] = useState(false);
  const [agendamentoParaSubstituir, setAgendamentoParaSubstituir] = useState(null);
  const [pacienteSubstituto, setPacienteSubstituto] = useState('');
  const [showCancelarSubstituicaoDialog, setShowCancelarSubstituicaoDialog] = useState(false);
  const [substituicaoParaCancelar, setSubstituicaoParaCancelar] = useState(null);
  const queryClient = useQueryClient();
  const navigate = useNavigate();

  const { data: agendamentos = [] } = useQuery({
    queryKey: ['agendamentos'],
    queryFn: () => base44.entities.Agendamento.list('-data'),
  });

  const { data: pacientes = [] } = useQuery({
    queryKey: ['pacientes'],
    queryFn: () => base44.entities.Paciente.list(),
  });

  const { data: profissionais = [] } = useQuery({
    queryKey: ['profissionais'],
    queryFn: async () => {
      try {
        const users = await base44.entities.User.list();
        return users.filter(u => u.role === 'profissional_saude' || u.role === 'admin');
      } catch (error) {
        console.error("Error loading professionals:", error);
        return [];
      }
    },
  });

  const { data: pagamentos = [] } = useQuery({
    queryKey: ['pagamentos'],
    queryFn: () => base44.entities.Pagamento.list(),
  });

  const { data: notasFiscais = [] } = useQuery({
    queryKey: ['notas-fiscais'],
    queryFn: () => base44.entities.NotaFiscal.list(),
  });

  const createAgendamento = useMutation({
    mutationFn: (data) => base44.entities.Agendamento.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries(['agendamentos']);
    },
  });

  const updateAgendamento = useMutation({
    mutationFn: ({ id, data }) => base44.entities.Agendamento.update(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries(['agendamentos']);
    },
  });

  const updateMultipleAgendamentos = useMutation({
    mutationFn: async (updates) => {
      const promises = updates.map(({ id, data }) =>
        base44.entities.Agendamento.update(id, data)
      );
      return await Promise.all(promises);
    },
    onSuccess: () => {
      queryClient.invalidateQueries(['agendamentos']);
    },
  });

  const deleteAgendamento = useMutation({
    mutationFn: (id) => base44.entities.Agendamento.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries(['agendamentos']);
    },
  });

  const createPagamento = useMutation({
    mutationFn: (data) => base44.entities.Pagamento.create(data),
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

  const createNotaFiscalMutation = useMutation({
    mutationFn: (data) => base44.entities.NotaFiscal.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries(['notas-fiscais']);
    },
  });

  const updateNotaFiscalMutation = useMutation({
    mutationFn: ({ id, data }) => base44.entities.NotaFiscal.update(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries(['notas-fiscais']);
    },
  });

  const diasExibicao = useMemo(() => {
    if (visualizacao === 'semanal') {
      const inicioSemana = startOfWeek(periodoAtual, { weekStartsOn: 1 });
      return Array.from({ length: 7 }, (_, i) => addDays(inicioSemana, i));
    } else {
      const inicio = startOfMonth(periodoAtual);
      const fim = endOfMonth(periodoAtual);
      const inicioCalendario = startOfWeek(inicio, { weekStartsOn: 1 });
      const fimCalendario = addDays(inicioCalendario, 34);
      return eachDayOfInterval({ start: inicioCalendario, end: fimCalendario });
    }
  }, [periodoAtual, visualizacao]);

  const horarios = Array.from({ length: 13 }, (_, i) => {
    const hora = 8 + i;
    return `${hora.toString().padStart(2, '0')}:00`;
  });

  const agendamentosFiltrados = useMemo(() => {
    return agendamentos.filter(ag => {
      if (!ag.data) return false;
      const dataAg = parseISO(ag.data);
      const dentroPeriodo = diasExibicao.some(dia => isSameDay(dataAg, dia));
      const profissionalMatch = profissionalSelecionado === 'todos' || ag.profissional_id === profissionalSelecionado;
      return dentroPeriodo && profissionalMatch;
    });
  }, [agendamentos, diasExibicao, profissionalSelecionado]);

  const pacientesMap = useMemo(() => {
    return pacientes.reduce((acc, p) => {
      acc[p.id] = p;
      return acc;
    }, {});
  }, [pacientes]);

  const pagamentosMap = useMemo(() => {
    return pagamentos.reduce((acc, p) => {
      if (p.agendamento_id) {
        acc[p.agendamento_id] = p;
      }
      return acc;
    }, {});
  }, [pagamentos]);

  const notasFiscaisMap = useMemo(() => {
    return notasFiscais.reduce((acc, nf) => {
      const key = `${nf.paciente_id}_${nf.mes_referencia}`;
      acc[key] = nf;
      return acc;
    }, {});
  }, [notasFiscais]);

  const statusColors = {
    agendado: 'bg-blue-100 border-blue-400 text-blue-900',
    confirmado: 'bg-green-100 border-green-400 text-green-900',
    em_atendimento: 'bg-purple-100 border-purple-400 text-purple-900',
    concluido: 'bg-slate-100 border-slate-400 text-slate-900',
    cancelado: 'bg-red-100 border-red-400 text-red-900',
    faltou: 'bg-amber-100 border-amber-400 text-amber-900'
  };

  const statusLabels = {
    agendado: 'Agendado',
    confirmado: 'Confirmado',
    em_atendimento: 'Em Atendimento',
    concluido: 'Concluído',
    cancelado: 'Cancelado',
    faltou: 'Faltou'
  };

  const statusIcons = {
    agendado: Clock,
    confirmado: CheckCircle,
    em_atendimento: UserCheck,
    concluido: CheckCircle,
    cancelado: XCircle,
    faltou: AlertCircle
  };

  const tipoConsultaIcons = {
    primeira_vez: FileText,
    retorno: Clock,
    exame: AlertCircle,
    procedimento: Stethoscope
  };

  const calcularPosicao = (horario, duracao = 60) => {
    const [hora, minuto] = horario.split(':').map(Number);
    const minutosDesdeInicio = (hora - 8) * 60 + minuto;
    const alturaPorHora = 120; // Altura em pixels de cada hora
    const top = (minutosDesdeInicio / 60) * alturaPorHora;
    const height = Math.max((duracao / 60) * alturaPorHora, 100);
    return { top, height };
  };

  const calcularHorarioFim = (horario, duracao = 60) => {
    const [hora, minuto] = horario.split(':').map(Number);
    const dataInicio = new Date();
    dataInicio.setHours(hora, minuto, 0);
    const dataFim = addMinutes(dataInicio, duracao);
    return format(dataFim, 'HH:mm');
  };

  const verificarConflito = (novaData, novoHorario, duracao, agendamentoIdIgnorar, profissionalId) => {
    const agendamentosConflitantes = agendamentos.filter(ag => {
      if (ag.id === agendamentoIdIgnorar) return false;
      if (!ag.data || ag.data !== novaData) return false;
      if (profissionalId && ag.profissional_id !== professionalId) return false;

      const [horaAg, minAg] = ag.horario.split(':').map(Number);
      const [horaNovo, minNovo] = novoHorario.split(':').map(Number);

      const inicioAg = horaAg * 60 + minAg;
      const fimAg = inicioAg + (ag.duracao || 60);
      const inicioNovo = horaNovo * 60 + minNovo;
      const fimNovo = inicioNovo + duracao;

      return (inicioNovo < fimAg && fimNovo > inicioAg);
    });

    return agendamentosConflitantes;
  };

  const handleMoverAgendamento = (agendamento, dia, hora) => {
    if (!agendamento || !agendamento.data) return;

    const novaData = format(dia, 'yyyy-MM-dd');
    const novoHorario = hora || agendamento.horario;

    const conflitos = verificarConflito(
      novaData,
      novoHorario,
      agendamento.duracao || 60,
      agendamento.id,
      agendamento.profissional_id
    );

    const agendamentosDaSerie = agendamento.agendamento_serie_id
      ? agendamentos.filter(a => a.agendamento_serie_id === agendamento.agendamento_serie_id)
      : [];

    const ehSerie = agendamentosDaSerie.length > 1;

    setMoveData({
      agendamento,
      novaData,
      novoHorario,
      agendamentosDaSerie,
      ehSerie,
      conflitos
    });
    setShowMoveDialog(true);
  };

  const handleConfirmMove = async (tipoMovimentacao) => {
    if (!moveData) return;

    const { agendamento, novaData, novoHorario, agendamentosDaSerie, ehSerie } = moveData;

    if (tipoMovimentacao === 'pontual' || !ehSerie) {
      await updateAgendamento.mutateAsync({
        id: agendamento.id,
        data: {
          ...agendamento,
          data: novaData,
          horario: novoHorario,
          agendamento_serie_id: null
        }
      });
    } else if (tipoMovimentacao === 'serie') {
      const dataOriginal = parseISO(agendamento.data);
      const dataDestino = parseISO(novaData);
      const diferencaDias = Math.floor((dataDestino - dataOriginal) / (1000 * 60 * 60 * 24));

      const updates = agendamentosDaSerie.map(ag => {
        if (!ag.data) return null;
        const dataAg = parseISO(ag.data);
        const novaDataAg = addDays(dataAg, diferencaDias);

        return {
          id: ag.id,
          data: {
            ...ag,
            data: format(novaDataAg, 'yyyy-MM-dd'),
            horario: novoHorario
          }
        };
      }).filter(Boolean);

      await updateMultipleAgendamentos.mutateAsync(updates);
    }

    setShowMoveDialog(false);
    setMoveData(null);
  };

  const handleNovoAgendamento = (dia, hora) => {
    setAgendamentoSelecionado({
      data: format(dia, 'yyyy-MM-dd'),
      horario: hora || '09:00',
      profissional_id: profissionalSelecionado !== 'todos' ? profissionalSelecionado : ''
    });
    setShowModal(true);
  };

  const handleEditarAgendamento = (agendamento) => {
    setAgendamentoSelecionado(agendamento);
    setShowModal(true);
  };

  const handleIniciarAtendimento = async (agendamento) => {
    await updateAgendamento.mutateAsync({
      id: agendamento.id,
      data: { ...agendamento, status: 'em_atendimento' }
    });

    const url = createPageUrl('Prontuarios') +
      `?paciente_id=${agendamento.paciente_id}&agendamento_id=${agendamento.id}`;
    navigate(url);
  };

  const handleAlterarStatus = async (agendamento, novoStatus) => {
    await updateAgendamento.mutateAsync({
      id: agendamento.id,
      data: { ...agendamento, status: novoStatus }
    });
  };

  const handleSubstituirPaciente = (agendamento) => {
    setAgendamentoParaSubstituir(agendamento);
    setPacienteSubstituto('');
    setShowSubstituicaoDialog(true);
  };

  const handleEditarSubstituicao = (agendamento) => {
    setAgendamentoParaSubstituir(agendamento);
    setPacienteSubstituto(agendamento.paciente_id);
    setShowSubstituicaoDialog(true);
  };

  const handleCancelarSubstituicao = (agendamento) => {
    setSubstituicaoParaCancelar(agendamento);
    setShowCancelarSubstituicaoDialog(true);
  };

  const handleConfirmarCancelamentoSubstituicao = async (opcao) => {
    if (!substituicaoParaCancelar || !substituicaoParaCancelar.id) return;

    try {
      if (opcao === 'restaurar') {
        // Opção 1: Restaurar o agendamento original
        const agendamentoOriginalId = substituicaoParaCancelar.agendamento_original_id;
        
        if (agendamentoOriginalId) {
          const agendamentoOriginal = agendamentos.find(a => a.id === agendamentoOriginalId);
          
          if (agendamentoOriginal && agendamentoOriginal.id) {
            // Restaurar o agendamento original para "agendado" ou "confirmado"
            await updateAgendamento.mutateAsync({
              id: agendamentoOriginal.id,
              data: {
                ...agendamentoOriginal,
                status: 'agendado',
                observacoes: `${agendamentoOriginal.observacoes || ''}\n\n[RESTAURAÇÃO] Substituição cancelada em ${format(new Date(), "dd/MM/yyyy 'às' HH:mm", { locale: ptBR })}. Agendamento restaurado.`
              }
            });
          }
        }
        
        // Deletar o agendamento de substituição
        await deleteAgendamento.mutateAsync(substituicaoParaCancelar.id);
      } else {
        // Opção 2: Apenas remover a substituição (deixar horário vazio)
        // Deletar o agendamento de substituição
        await deleteAgendamento.mutateAsync(substituicaoParaCancelar.id);
        
        // Se houver agendamento original, adicionar observação
        const agendamentoOriginalId = substituicaoParaCancelar.agendamento_original_id;
        if (agendamentoOriginalId) {
          const agendamentoOriginal = agendamentos.find(a => a.id === agendamentoOriginalId);
          
          if (agendamentoOriginal && agendamentoOriginal.id) {
            await updateAgendamento.mutateAsync({
              id: agendamentoOriginal.id,
              data: {
                ...agendamentoOriginal,
                observacoes: `${agendamentoOriginal.observacoes || ''}\n\n[CANCELAMENTO] Substituição cancelada em ${format(new Date(), "dd/MM/yyyy 'às' HH:mm", { locale: ptBR })}. Horário ficou vago.`
              }
            });
          }
        }
      }

      setShowCancelarSubstituicaoDialog(false);
      setSubstituicaoParaCancelar(null);
    } catch (error) {
      console.error('Erro ao cancelar substituição:', error);
      alert('Erro ao cancelar substituição. Tente novamente.');
    }
  };

  const handleConfirmarSubstituicao = async () => {
    if (!pacienteSubstituto || !agendamentoParaSubstituir) return;

    try {
      const pacienteSelecionado = pacientes.find(p => p.id === pacienteSubstituto);
      if (!pacienteSelecionado) return;

      // Verifica se é uma edição de substituição existente
      const ehEdicao = agendamentoParaSubstituir.eh_substituicao;

      if (ehEdicao) {
        // EDITAR substituição existente
        await updateAgendamento.mutateAsync({
          id: agendamentoParaSubstituir.id,
          data: {
            ...agendamentoParaSubstituir,
            paciente_id: pacienteSelecionado.id,
            paciente_nome: pacienteSelecionado.nome_completo,
            valor: pacienteSelecionado.valor_consulta || agendamentoParaSubstituir.valor || 0,
            observacoes: `[SUBSTITUIÇÃO EDITADA] Este agendamento substituiu o horário do paciente ${agendamentoParaSubstituir.paciente_faltou_nome} que faltou. Editado em ${format(new Date(), "dd/MM/yyyy 'às' HH:mm", { locale: ptBR })} para ${pacienteSelecionado.nome_completo}.`
          }
        });
      } else {
        // CRIAR nova substituição
        // 1. Marcar o agendamento original como "faltou"
        await updateAgendamento.mutateAsync({
          id: agendamentoParaSubstituir.id,
          data: {
            ...agendamentoParaSubstituir,
            status: 'faltou',
            observacoes: `${agendamentoParaSubstituir.observacoes || ''}\n\n[SUBSTITUIÇÃO] Paciente faltou. Horário foi preenchido por ${pacienteSelecionado.nome_completo} em ${format(new Date(), "dd/MM/yyyy 'às' HH:mm", { locale: ptBR })}.`
          }
        });

        // 2. Criar novo agendamento de substituição
        const novoAgendamento = {
          paciente_id: pacienteSelecionado.id,
          paciente_nome: pacienteSelecionado.nome_completo,
          profissional_id: agendamentoParaSubstituir.profissional_id,
          profissional_nome: agendamentoParaSubstituir.profissional_nome,
          data: agendamentoParaSubstituir.data,
          horario: agendamentoParaSubstituir.horario,
          duracao: agendamentoParaSubstituir.duracao,
          tipo_consulta: agendamentoParaSubstituir.tipo_consulta,
          status: 'confirmado',
          valor: pacienteSelecionado.valor_consulta || agendamentoParaSubstituir.valor || 0,
          eh_substituicao: true,
          agendamento_original_id: agendamentoParaSubstituir.id,
          paciente_faltou_id: agendamentoParaSubstituir.paciente_id,
          paciente_faltou_nome: agendamentoParaSubstituir.paciente_nome,
          motivo_substituicao: 'Paciente original faltou',
          observacoes: `[SUBSTITUIÇÃO] Este agendamento substituiu o horário do paciente ${agendamentoParaSubstituir.paciente_nome} que faltou.`
        };

        await createAgendamento.mutateAsync(novoAgendamento);
      }

      setShowSubstituicaoDialog(false);
      setAgendamentoParaSubstituir(null);
      setPacienteSubstituto('');
    } catch (error) {
      console.error('Erro ao substituir paciente:', error);
      alert('Erro ao substituir paciente. Tente novamente.');
    }
  };

  const handleConfirmarPagamento = async (agendamento) => {
    const pagamento = pagamentosMap[agendamento.id];

    if (pagamento) {
      await updatePagamento.mutateAsync({
        id: pagamento.id,
        data: {
          ...pagamento,
          status: 'pago',
          valor_pago: pagamento.valor,
          data_pagamento: new Date().toISOString().split('T')[0]
        }
      });
    } else {
      await createPagamento.mutateAsync({
        agendamento_id: agendamento.id,
        paciente_id: agendamento.paciente_id,
        paciente_nome: agendamento.paciente_nome,
        valor: agendamento.valor || 0,
        valor_pago: agendamento.valor || 0,
        data_pagamento: new Date().toISOString().split('T')[0],
        data_vencimento: agendamento.data,
        status: 'pago',
        tipo: 'consulta',
        forma_pagamento: 'dinheiro'
      });
    }
  };

  const handleAlterarStatusPagamento = async (agendamento, novoStatus) => {
    const pagamento = pagamentosMap[agendamento.id];

    if (pagamento) {
      await updatePagamento.mutateAsync({
        id: pagamento.id,
        data: {
          ...pagamento,
          status: novoStatus,
          ...(novoStatus === 'pago' && {
            valor_pago: pagamento.valor,
            data_pagamento: new Date().toISOString().split('T')[0]
          })
        }
      });
    } else {
      await createPagamento.mutateAsync({
        agendamento_id: agendamento.id,
        paciente_id: agendamento.paciente_id,
        paciente_nome: agendamento.paciente_nome,
        valor: agendamento.valor || 0,
        valor_pago: novoStatus === 'pago' ? (agendamento.valor || 0) : 0,
        data_pagamento: novoStatus === 'pago' ? new Date().toISOString().split('T')[0] : null,
        data_vencimento: agendamento.data,
        status: novoStatus,
        tipo: 'consulta',
        forma_pagamento: 'dinheiro'
      });
    }
  };

  const handleEmitirNota = async (agendamento, notaFiscal) => {
    if (!agendamento.data) return;
    const mesRef = format(parseISO(agendamento.data), 'yyyy-MM');

    if (notaFiscal) {
      alert('Já existe uma nota fiscal para este paciente neste mês.');
      return;
    }

    await createNotaFiscalMutation.mutateAsync({
      paciente_id: agendamento.paciente_id,
      paciente_nome: agendamento.paciente_nome,
      mes_referencia: mesRef,
      data_emissao: new Date().toISOString().split('T')[0],
      valor_total: agendamento.valor || 0,
      quantidade_consultas: 1,
      descricao_servicos: `Consulta - ${agendamento.tipo_consulta}`,
      status: 'emitida'
    });
  };

  const handleAlterarStatusNota = async (notaFiscal, novoStatus) => {
    if (!notaFiscal) {
      alert('Nenhuma nota fiscal encontrada para este agendamento.');
      return;
    }

    await updateNotaFiscalMutation.mutateAsync({
      id: notaFiscal.id,
      data: {
        ...notaFiscal,
        status: novoStatus
      }
    });
  };

  const handleAnterior = () => {
    if (visualizacao === 'semanal') {
      setPeriodoAtual(subWeeks(periodoAtual, 1));
    } else {
      setPeriodoAtual(subMonths(periodoAtual, 1));
    }
  };

  const handleProximo = () => {
    if (visualizacao === 'semanal') {
      setPeriodoAtual(addWeeks(periodoAtual, 1));
    } else {
      setPeriodoAtual(addMonths(periodoAtual, 1));
    }
  };

  const handleHoje = () => {
    setPeriodoAtual(new Date());
  };

  const getTituloPeriodo = () => {
    if (visualizacao === 'semanal') {
      const inicioSemana = startOfWeek(periodoAtual, { weekStartsOn: 1 });
      const fimSemana = addDays(inicioSemana, 6);
      return `${format(inicioSemana, "d 'de' MMM", { locale: ptBR })} - ${format(fimSemana, "d 'de' MMM 'de' yyyy", { locale: ptBR })}`;
    } else {
      return format(periodoAtual, "MMMM 'de' yyyy", { locale: ptBR });
    }
  };

  const renderVisualizacaoSemanal = () => {
    const diasSemana = diasExibicao;

    return (
      <Card className="border-none shadow-lg">
        <CardContent className="p-0">
          <div className="grid grid-cols-8 border-b border-slate-200 sticky top-0 bg-white z-20">
            <div className="bg-slate-50 border-r border-slate-200 p-4 font-semibold text-slate-700 text-sm">
              Horário
            </div>

            {diasSemana.map((dia, index) => {
              const isHoje = isSameDay(dia, new Date());
              return (
                <div
                  key={index}
                  className={`p-4 text-center border-r border-slate-200 ${
                    isHoje ? 'bg-cyan-50' : 'bg-slate-50'
                  }`}
                >
                  <div className="text-xs text-slate-500 uppercase font-semibold">
                    {format(dia, 'EEE', { locale: ptBR })}
                  </div>
                  <div className={`text-lg font-bold mt-1 ${
                    isHoje ? 'text-cyan-600' : 'text-slate-700'
                  }`}>
                    {format(dia, 'd')}
                  </div>
                </div>
              );
            })}
          </div>

          <div className="max-h-[calc(100vh-320px)] overflow-y-auto">
            <div className="grid grid-cols-8 relative">
              <div className="bg-slate-50 border-r border-slate-200">
                {horarios.map((hora) => (
                  <div
                    key={hora}
                    className="h-30 border-b border-slate-200 px-4 py-3 text-sm font-medium text-slate-600"
                    style={{ minHeight: '120px' }}
                  >
                    {hora}
                  </div>
                ))}
              </div>

              {diasSemana.map((dia, diaIndex) => {
                const isHoje = isSameDay(dia, new Date());
                const agendamentosDoDia = agendamentosFiltrados.filter(ag =>
                  ag.data && isSameDay(parseISO(ag.data), dia)
                );

                return (
                  <div
                    key={diaIndex}
                    className={`border-r border-slate-200 relative ${
                      isHoje ? 'bg-cyan-50/30' : 'bg-white'
                    }`}
                  >
                    {horarios.map((hora) => (
                      <div
                        key={hora}
                        className="h-30 border-b border-slate-100 hover:bg-slate-50 cursor-pointer transition-colors"
                        style={{ minHeight: '120px' }}
                        onClick={() => handleNovoAgendamento(dia, hora)}
                      />
                    ))}

                    {agendamentosDoDia.map((agendamento) => {
                      if (!agendamento.data) return null;
                      const { top, height } = calcularPosicao(agendamento.horario, agendamento.duracao || 60);
                      const paciente = pacientesMap[agendamento.paciente_id];
                      const pagamento = pagamentosMap[agendamento.id];
                      const mesRef = format(parseISO(agendamento.data), 'yyyy-MM');
                      const notaFiscal = notasFiscaisMap[`${agendamento.paciente_id}_${mesRef}`];
                      const TipoConsultaIcon = tipoConsultaIcons[agendamento.tipo_consulta] || FileText;
                      const horarioFim = calcularHorarioFim(agendamento.horario, agendamento.duracao || 60);

                      const isSubstituicao = agendamento.eh_substituicao;
                      const cardColor = isSubstituicao 
                        ? 'bg-orange-100 border-orange-400 text-orange-900'
                        : statusColors[agendamento.status];

                      return (
                        <div
                          key={agendamento.id}
                          className={`absolute left-0.5 right-0.5 rounded-lg border-2 shadow-md hover:shadow-lg transition-all ${cardColor}`}
                          style={{
                            top: `${top}px`,
                            height: `${height - 8}px`,
                            zIndex: 10
                          }}
                        >
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <div className="p-2.5 h-full flex flex-col cursor-pointer overflow-hidden">
                                {isSubstituicao && (
                                  <div className="flex items-center gap-1 mb-1 bg-orange-200 rounded px-2 py-1">
                                    <RefreshCw className="w-3.5 h-3.5 flex-shrink-0" />
                                    <span className="text-[10px] font-bold">SUBSTITUIÇÃO</span>
                                  </div>
                                )}

                                <div className="flex items-center justify-between gap-1.5 mb-1">
                                  <div className="flex items-center gap-2 flex-1 min-w-0">
                                    {paciente?.foto_url ? (
                                      <img 
                                        src={paciente.foto_url}
                                        alt={agendamento.paciente_nome}
                                        className="w-7 h-7 rounded-full object-cover border border-white shadow-sm flex-shrink-0"
                                      />
                                    ) : (
                                      <div className="w-7 h-7 rounded-full bg-white/40 flex items-center justify-center border border-white shadow-sm flex-shrink-0">
                                        <span className="text-[10px] font-bold">
                                          {agendamento.paciente_nome?.charAt(0).toUpperCase()}
                                        </span>
                                      </div>
                                    )}
                                    <span className="font-semibold text-xs truncate">
                                      {agendamento.paciente_nome}
                                    </span>
                                  </div>
                                  <div className="flex items-center gap-1">
                                    {agendamento.agendamento_serie_id && (
                                      <Repeat className="w-4 h-4 flex-shrink-0" />
                                    )}
                                    <TipoConsultaIcon className="w-4 h-4 flex-shrink-0" />
                                  </div>
                                </div>

                                {isSubstituicao && agendamento.paciente_faltou_nome && (
                                  <div className="flex items-center gap-1 mb-1 bg-red-100 rounded px-2 py-1">
                                    <UserX className="w-3.5 h-3.5 flex-shrink-0 text-red-700" />
                                    <span className="text-[10px] text-red-700 truncate">
                                      Falta: {agendamento.paciente_faltou_nome}
                                    </span>
                                  </div>
                                )}

                                <div className="flex items-center gap-1.5 mb-1 bg-white/25 rounded px-2 py-1">
                                  <Clock className="w-3.5 h-3.5 flex-shrink-0" />
                                  <span className="font-bold text-[11px]">
                                    {agendamento.horario}-{horarioFim}
                                  </span>
                                </div>

                                {agendamento.observacoes && (
                                  <div className="text-[9px] text-slate-700 opacity-75 mb-1 truncate">
                                    {agendamento.observacoes.substring(0, 50)}
                                  </div>
                                )}

                                <div className="mt-auto flex items-center gap-2">
                                  {pagamento ? (
                                    pagamento.status === 'pago' ? (
                                      <CheckCircle className="w-4 h-4 text-green-700" />
                                    ) : pagamento.status === 'pendente' ? (
                                      <Clock className="w-4 h-4 text-amber-700" />
                                    ) : (
                                      <AlertTriangle className="w-4 h-4 text-red-700" />
                                    )
                                  ) : (
                                    <DollarSign className="w-4 h-4 opacity-40" />
                                  )}

                                  {notaFiscal && notaFiscal.status === 'emitida' ? (
                                    <Receipt className="w-4 h-4 text-blue-700" />
                                  ) : (
                                    <Receipt className="w-4 h-4 opacity-30" />
                                  )}
                                </div>
                              </div>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="start" className="w-56">
                              {!isSubstituicao && (
                                <>
                                  <DropdownMenuItem onClick={(e) => {
                                    e.stopPropagation();
                                    handleIniciarAtendimento(agendamento);
                                  }}>
                                    <Play className="w-4 h-4 mr-2" />
                                    Iniciar Atendimento
                                  </DropdownMenuItem>
                                  
                                  <DropdownMenuItem onClick={(e) => {
                                    e.stopPropagation();
                                    handleEditarAgendamento(agendamento);
                                  }}>
                                    <Edit className="w-4 h-4 mr-2" />
                                    Editar
                                  </DropdownMenuItem>

                                  <DropdownMenuSub>
                                    <DropdownMenuSubTrigger>
                                      <Move className="w-4 h-4 mr-2 text-cyan-600" />
                                      Mover Agendamento
                                    </DropdownMenuSubTrigger>
                                    <DropdownMenuSubContent>
                                      {diasSemana.map((diaDest, idx) => (
                                        <DropdownMenuSub key={idx}>
                                          <DropdownMenuSubTrigger>
                                            {format(diaDest, "EEE dd/MM", { locale: ptBR })}
                                          </DropdownMenuSubTrigger>
                                          <DropdownMenuSubContent>
                                            {horarios.map((h) => (
                                              <DropdownMenuItem
                                                key={h}
                                                onClick={(e) => {
                                                  e.stopPropagation();
                                                  handleMoverAgendamento(agendamento, diaDest, h);
                                                }}
                                              >
                                                {h}
                                              </DropdownMenuItem>
                                            ))}
                                          </DropdownMenuSubContent>
                                        </DropdownMenuSub>
                                      ))}
                                    </DropdownMenuSubContent>
                                  </DropdownMenuSub>

                                  <DropdownMenuSeparator />
                                </>
                              )}

                              {isSubstituicao && (
                                <>
                                  <DropdownMenuItem onClick={(e) => {
                                    e.stopPropagation();
                                    handleIniciarAtendimento(agendamento);
                                  }}>
                                    <Play className="w-4 h-4 mr-2" />
                                    Iniciar Atendimento
                                  </DropdownMenuItem>

                                  <DropdownMenuItem onClick={(e) => {
                                    e.stopPropagation();
                                    handleEditarSubstituicao(agendamento);
                                  }}>
                                    <Edit className="w-4 h-4 mr-2 text-orange-600" />
                                    Editar Substituição
                                  </DropdownMenuItem>

                                  <DropdownMenuItem onClick={(e) => {
                                    e.stopPropagation();
                                    handleCancelarSubstituicao(agendamento);
                                  }}>
                                    <XCircle className="w-4 h-4 mr-2 text-red-600" />
                                    Cancelar Substituição
                                  </DropdownMenuItem>
                                  
                                  <DropdownMenuSeparator />
                                  
                                  <div className="px-2 py-1.5 text-xs text-slate-500">
                                    ℹ️ Agendamento de substituição
                                  </div>
                                  
                                  <DropdownMenuSeparator />
                                </>
                              )}

                              <DropdownMenuSub>
                                <DropdownMenuSubTrigger>
                                  <MoreVertical className="w-4 h-4 mr-2" />
                                  Status do Agendamento
                                </DropdownMenuSubTrigger>
                                <DropdownMenuSubContent>
                                  {Object.entries(statusLabels).map(([status, label]) => {
                                    const Icon = statusIcons[status];
                                    return (
                                      <DropdownMenuItem 
                                        key={status}
                                        onClick={(e) => {
                                          e.stopPropagation();
                                          handleAlterarStatus(agendamento, status);
                                        }}
                                      >
                                        <Icon className="w-4 h-4 mr-2" />
                                        {label}
                                      </DropdownMenuItem>
                                    );
                                  })}
                                </DropdownMenuSubContent>
                              </DropdownMenuSub>

                              {!isSubstituicao && agendamento.status === 'faltou' && (
                                <>
                                  <DropdownMenuSeparator />
                                  <DropdownMenuItem 
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      handleSubstituirPaciente(agendamento);
                                    }}
                                    className="text-orange-600"
                                  >
                                    <RefreshCw className="w-4 h-4 mr-2" />
                                    Substituir Paciente
                                  </DropdownMenuItem>
                                </>
                              )}

                              <DropdownMenuSeparator />

                              <DropdownMenuSub>
                                <DropdownMenuSubTrigger>
                                  <DollarSign className="w-4 h-4 mr-2 text-green-600" />
                                  Pagamento
                                </DropdownMenuSubTrigger>
                                <DropdownMenuSubContent>
                                  <DropdownMenuItem
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      handleConfirmarPagamento(agendamento);
                                    }}
                                    className="text-green-600"
                                  >
                                    <CheckCircle className="w-4 h-4 mr-2" />
                                    Confirmar Pagamento
                                  </DropdownMenuItem>

                                  <DropdownMenuSeparator />

                                  <DropdownMenuItem
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      handleAlterarStatusPagamento(agendamento, 'pago');
                                    }}
                                  >
                                    <CheckCircle className="w-4 h-4 mr-2 text-green-600" />
                                    Marcar como Pago
                                  </DropdownMenuItem>

                                  <DropdownMenuItem
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      handleAlterarStatusPagamento(agendamento, 'pendente');
                                    }}
                                  >
                                    <Clock className="w-4 h-4 mr-2 text-amber-600" />
                                    Marcar como Pendente
                                  </DropdownMenuItem>

                                  <DropdownMenuItem
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      handleAlterarStatusPagamento(agendamento, 'parcial');
                                    }}
                                  >
                                    <AlertCircle className="w-4 h-4 mr-2 text-blue-600" />
                                    Marcar como Parcial
                                  </DropdownMenuItem>

                                  <DropdownMenuItem
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      handleAlterarStatusPagamento(agendamento, 'atrasado');
                                    }}
                                  >
                                    <AlertTriangle className="w-4 h-4 mr-2 text-red-600" />
                                    Marcar como Atrasado
                                  </DropdownMenuItem>

                                  <DropdownMenuItem
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      handleAlterarStatusPagamento(agendamento, 'cancelado');
                                    }}
                                  >
                                    <XCircle className="w-4 h-4 mr-2 text-slate-600" />
                                    Cancelar Pagamento
                                  </DropdownMenuItem>
                                </DropdownMenuSubContent>
                              </DropdownMenuSub>

                              <DropdownMenuSub>
                                <DropdownMenuSubTrigger>
                                  <Receipt className="w-4 h-4 mr-2 text-blue-600" />
                                  Nota Fiscal
                                </DropdownMenuSubTrigger>
                                <DropdownMenuSubContent>
                                  {!notaFiscal ? (
                                    <DropdownMenuItem
                                      onClick={(e) => {
                                        e.stopPropagation();
                                        handleEmitirNota(agendamento, notaFiscal);
                                      }}
                                      className="text-blue-600"
                                    >
                                      <Plus className="w-4 h-4 mr-2" />
                                      Emitir Nota Fiscal
                                    </DropdownMenuItem>
                                  ) : (
                                    <>
                                      <DropdownMenuItem
                                        onClick={(e) => {
                                          e.stopPropagation();
                                          handleAlterarStatusNota(notaFiscal, 'emitida');
                                        }}
                                      >
                                        <Receipt className="w-4 h-4 mr-2 text-blue-600" />
                                        Marcar como Emitida
                                      </DropdownMenuItem>

                                      <DropdownMenuItem
                                        onClick={(e) => {
                                          e.stopPropagation();
                                          handleAlterarStatusNota(notaFiscal, 'enviada');
                                        }}
                                      >
                                        <CheckCircle className="w-4 h-4 mr-2 text-purple-600" />
                                        Marcar como Enviada
                                      </DropdownMenuItem>

                                      <DropdownMenuItem
                                        onClick={(e) => {
                                          e.stopPropagation();
                                          handleAlterarStatusNota(notaFiscal, 'paga');
                                        }}
                                      >
                                        <CheckCircle className="w-4 h-4 mr-2 text-green-600" />
                                        Marcar como Paga
                                      </DropdownMenuItem>

                                      <DropdownMenuItem
                                        onClick={(e) => {
                                          e.stopPropagation();
                                          handleAlterarStatusNota(notaFiscal, 'cancelada');
                                        }}
                                      >
                                        <XCircle className="w-4 h-4 mr-2 text-red-600" />
                                        Cancelar Nota Fiscal
                                      </DropdownMenuItem>
                                    </>
                                  )}
                                </DropdownMenuSubContent>
                              </DropdownMenuSub>
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </div>
                      );
                    })}
                  </div>
                );
              })}
            </div>
          </div>
        </CardContent>
      </Card>
    );
  };

  const renderVisualizacaoMensal = () => {
    const semanas = [];
    for (let i = 0; i < diasExibicao.length; i += 7) {
      semanas.push(diasExibicao.slice(i, i + 7));
    }

    return (
      <Card className="border-none shadow-lg">
        <CardContent className="p-0">
          <div className="grid grid-cols-7 border-b border-slate-200">
            {['Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb', 'Dom'].map((dia, index) => (
              <div
                key={index}
                className="p-4 text-center border-r border-slate-200 bg-slate-50 font-semibold text-slate-700 text-sm"
              >
                {dia}
              </div>
            ))}
          </div>

          <div>
            {semanas.map((semana, semanaIndex) => (
              <div key={semanaIndex} className="grid grid-cols-7 border-b border-slate-200">
                {semana.map((dia, diaIndex) => {
                  const isHoje = isSameDay(dia, new Date());
                  const isDentroMes = isSameMonth(dia, periodoAtual);
                  const agendamentosDoDia = agendamentosFiltrados.filter(ag =>
                    ag.data && isSameDay(parseISO(ag.data), dia)
                  );

                  return (
                    <div
                      key={diaIndex}
                      className={`min-h-[120px] border-r border-slate-100 p-2 cursor-pointer hover:bg-slate-50 transition-colors ${
                        !isDentroMes ? 'bg-slate-50/50' : 'bg-white'
                      } ${isHoje ? 'bg-cyan-50' : ''}`}
                      onClick={() => handleNovoAgendamento(dia)}
                    >
                      <div className={`text-sm font-semibold mb-2 ${
                        isHoje ? 'text-cyan-600' :
                        !isDentroMes ? 'text-slate-400' : 'text-slate-700'
                      }`}>
                        {format(dia, 'd')}
                      </div>

                      <div className="space-y-1">
                        {agendamentosDoDia.slice(0, 3).map((agendamento) => {
                          if (!agendamento.data) return null;
                          const paciente = pacientesMap[agendamento.paciente_id];
                          const pagamento = pagamentosMap[agendamento.id];
                          const isSubstituicao = agendamento.eh_substituicao;
                          const cardColor = isSubstituicao
                            ? 'bg-orange-100 border-orange-400 text-orange-900'
                            : statusColors[agendamento.status];

                          return (
                            <div
                              key={agendamento.id}
                              className={`text-[9px] p-1 rounded border cursor-pointer hover:shadow transition-all ${cardColor}`}
                              onClick={(e) => {
                                e.stopPropagation();
                                handleEditarAgendamento(agendamento);
                              }}
                            >
                              <div className="flex items-center gap-1">
                                {paciente?.foto_url ? (
                                  <img
                                    src={paciente.foto_url}
                                    alt={agendamento.paciente_nome}
                                    className="w-3 h-3 rounded-full object-cover flex-shrink-0"
                                  />
                                ) : (
                                  <div className="w-3 h-3 rounded-full bg-white/40 flex items-center justify-center flex-shrink-0">
                                    <span className="text-[6px] font-bold">
                                      {agendamento.paciente_nome?.charAt(0).toUpperCase()}
                                    </span>
                                  </div>
                                )}
                                <span className="font-semibold truncate">{agendamento.horario}</span>
                                <span className="truncate flex-1">{agendamento.paciente_nome}</span>
                                {pagamento?.status === 'pago' && (
                                  <CheckCircle className="w-2.5 h-2.5 text-green-700 flex-shrink-0" />
                                )}
                              </div>
                            </div>
                          );
                        })}
                        {agendamentosDoDia.length > 3 && (
                          <div className="text-[8px] text-slate-500 font-medium pl-1">
                            +{agendamentosDoDia.length - 3} mais
                          </div>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    );
  };

  return (
    <div className="h-screen flex flex-col bg-slate-50">
      <div className="bg-white border-b border-slate-200 px-6 py-4">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-4">
            <h1 className="text-2xl font-bold text-slate-800 flex items-center gap-2">
              <Calendar className="w-7 h-7 text-cyan-600" />
              Agenda
            </h1>

            <Tabs value={visualizacao} onValueChange={setVisualizacao}>
              <TabsList>
                <TabsTrigger value="semanal" className="gap-2">
                  <CalendarDays className="w-4 h-4" />
                  Semanal
                </TabsTrigger>
                <TabsTrigger value="mensal" className="gap-2">
                  <Calendar className="w-4 h-4" />
                  Mensal
                </TabsTrigger>
              </TabsList>
            </Tabs>
          </div>

          <Button
            onClick={() => setShowModal(true)}
            className="bg-gradient-to-r from-cyan-500 to-teal-500"
          >
            <Plus className="w-4 h-4 mr-2" />
            Novo Agendamento
          </Button>
        </div>

        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Button variant="outline" size="sm" onClick={handleAnterior}>
              <ChevronLeft className="w-4 h-4" />
            </Button>
            <Button variant="outline" size="sm" onClick={handleHoje}>
              Hoje
            </Button>
            <Button variant="outline" size="sm" onClick={handleProximo}>
              <ChevronRight className="w-4 h-4" />
            </Button>
            <span className="text-sm font-medium text-slate-700 ml-2 capitalize">
              {getTituloPeriodo()}
            </span>
          </div>

          <Select value={profissionalSelecionado} onValueChange={setProfissionalSelecionado}>
            <SelectTrigger className="w-64">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="todos">Todos os Profissionais</SelectItem>
              {profissionais.map(p => (
                <SelectItem key={p.id} value={p.id}>
                  {p.full_name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      <div className="flex-1 overflow-auto p-6">
        {visualizacao === 'semanal' ? renderVisualizacaoSemanal() : renderVisualizacaoMensal()}

        <Card className="border-none shadow-lg mt-4">
          <CardContent className="p-4">
            <div className="flex items-center gap-2 text-sm text-blue-600 mb-3">
              <Move className="w-4 h-4" />
              <span className="font-semibold">Use o menu "Mover Agendamento" para reorganizar horários</span>
            </div>

            <div className="space-y-3">
              <div>
                <p className="text-xs font-semibold text-slate-600 mb-2">Status do Agendamento:</p>
                <div className="flex flex-wrap gap-4">
                  {Object.entries(statusLabels).map(([status, label]) => {
                    const Icon = statusIcons[status];
                    return (
                      <div key={status} className="flex items-center gap-2">
                        <div className={`w-4 h-4 rounded border-2 ${statusColors[status]}`} />
                        <Icon className="w-3 h-3 text-slate-600" />
                        <span className="text-sm text-slate-600">{label}</span>
                      </div>
                    );
                  })}
                </div>
              </div>

              <div>
                <p className="text-xs font-semibold text-slate-600 mb-2">Tipo de Consulta:</p>
                <div className="flex flex-wrap gap-4">
                  <div className="flex items-center gap-2">
                    <FileText className="w-3 h-3 text-slate-600" />
                    <span className="text-sm text-slate-600">Primeira Vez</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Clock className="w-3 h-3 text-slate-600" />
                    <span className="text-sm text-slate-600">Retorno</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <AlertCircle className="w-3 h-3 text-slate-600" />
                    <span className="text-sm text-slate-600">Exame</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Stethoscope className="w-3 h-3 text-slate-600" />
                    <span className="text-sm text-slate-600">Procedimento</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Repeat className="w-3 h-3 text-slate-600" />
                    <span className="text-sm text-slate-600">Recorrente</span>
                  </div>
                </div>
              </div>

              <div>
                <p className="text-xs font-semibold text-slate-600 mb-2">Informações de Pagamento e Fiscal:</p>
                <div className="flex flex-wrap gap-4">
                  <div className="flex items-center gap-2">
                    <CheckCircle className="w-3 h-3 text-green-600" />
                    <span className="text-sm text-slate-600">Pagamento Confirmado</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Clock className="w-3 h-3 text-amber-600" />
                    <span className="text-sm text-slate-600">Pagamento Pendente</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <AlertTriangle className="w-3 h-3 text-red-600" />
                    <span className="text-sm text-slate-600">Pagamento Atrasado</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Receipt className="w-3 h-3 text-blue-600" />
                    <span className="text-sm text-slate-600">Nota Fiscal Emitida</span>
                  </div>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <Dialog open={showMoveDialog} onOpenChange={setShowMoveDialog}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Move className="w-5 h-5 text-cyan-600" />
              Mover Agendamento
            </DialogTitle>
          </DialogHeader>

          <div className="space-y-4">
            {moveData?.conflitos && moveData.conflitos.length > 0 && (
              <div className="p-4 bg-red-50 border border-red-200 rounded-lg">
                <div className="flex items-center gap-2 mb-2">
                  <AlertTriangle className="w-5 h-5 text-red-600" />
                  <p className="font-semibold text-red-900">
                    Conflito de Horário Detectado!
                  </p>
                </div>
                <p className="text-sm text-red-700 mb-2">
                  Já existe(m) {moveData.conflitos.length} agendamento(s) neste horário:
                </p>
                <div className="space-y-1">
                  {moveData.conflitos.map((conflito) => (
                    <div key={conflito.id} className="text-xs bg-white p-2 rounded border border-red-200">
                      <strong>{conflito.paciente_nome}</strong> - {conflito.horario}
                    </div>
                  ))}
                </div>
                <p className="text-sm text-red-700 mt-2">
                  Deseja continuar mesmo assim?
                </p>
              </div>
            )}

            {moveData?.ehSerie ? (
              <>
                <div className="flex items-center gap-2 p-3 bg-blue-50 rounded-lg border border-blue-200">
                  <Repeat className="w-5 h-5 text-blue-600" />
                  <div className="text-sm text-blue-900">
                    <strong>Este agendamento faz parte de uma série de {moveData.agendamentosDaSerie.length} agendamentos recorrentes.</strong>
                  </div>
                </div>

                <div className="space-y-2">
                  <p className="text-sm font-medium text-slate-700">Como deseja movimentar?</p>

                  <div className="p-3 bg-slate-50 rounded-lg border border-slate-200">
                    <p className="text-sm text-slate-700">
                      <strong>Paciente:</strong> {moveData.agendamento.paciente_nome}
                    </p>
                    <p className="text-sm text-slate-700">
                      <strong>De:</strong> {moveData.agendamento.data ? format(parseISO(moveData.agendamento.data), "dd/MM/yyyy") : 'N/A'} às {moveData.agendamento.horario}
                    </p>
                    <p className="text-sm text-slate-700">
                      <strong>Para:</strong> {moveData.novaData ? format(parseISO(moveData.novaData), "dd/MM/yyyy") : 'N/A'} às {moveData.novoHorario}
                    </p>
                  </div>
                </div>
              </>
            ) : (
              <>
                <p className="text-sm text-slate-700">Deseja mover este agendamento?</p>

                <div className="p-3 bg-slate-50 rounded-lg border border-slate-200 space-y-1">
                  <p className="text-sm text-slate-700">
                    <strong>Paciente:</strong> {moveData?.agendamento.paciente_nome}
                  </p>
                  <p className="text-sm text-slate-700">
                    <strong>De:</strong> {moveData?.agendamento.data ? format(parseISO(moveData.agendamento.data), "dd/MM/yyyy") : 'N/A'} às {moveData?.agendamento.horario}
                  </p>
                  <p className="text-sm text-slate-700">
                    <strong>Para:</strong> {moveData?.novaData ? format(parseISO(moveData.novaData), "dd/MM/yyyy") : 'N/A'} às {moveData?.novoHorario}
                  </p>
                </div>
              </>
            )}
          </div>

          <DialogFooter className="flex-col sm:flex-row gap-2">
            {moveData?.ehSerie ? (
              <>
                <Button
                  variant="outline"
                  onClick={() => setShowMoveDialog(false)}
                >
                  Cancelar
                </Button>
                <Button
                  variant="outline"
                  onClick={() => handleConfirmMove('pontual')}
                  className="bg-blue-50 hover:bg-blue-100"
                >
                  Apenas Este
                </Button>
                <Button
                  onClick={() => handleConfirmMove('serie')}
                  className="bg-gradient-to-r from-cyan-500 to-teal-500"
                >
                  <Repeat className="w-4 h-4 mr-2" />
                  Toda a Série ({moveData.agendamentosDaSerie.length})
                </Button>
              </>
            ) : (
              <>
                <Button
                  variant="outline"
                  onClick={() => setShowMoveDialog(false)}
                >
                  Cancelar
                </Button>
                <Button
                  onClick={() => handleConfirmMove('pontual')}
                  className="bg-gradient-to-r from-cyan-500 to-teal-500"
                >
                  Confirmar Movimentação
                </Button>
              </>
            )}
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Dialog de Substituição */}
      <Dialog open={showSubstituicaoDialog} onOpenChange={setShowSubstituicaoDialog}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <RefreshCw className="w-5 h-5 text-orange-600" />
              {agendamentoParaSubstituir?.eh_substituicao ? 'Editar Substituição' : 'Substituir Paciente por Falta'}
            </DialogTitle>
          </DialogHeader>

          {agendamentoParaSubstituir && (
            <div className="space-y-4">
              {!agendamentoParaSubstituir.eh_substituicao && (
                <Alert className="bg-red-50 border-red-200">
                  <AlertCircle className="h-4 w-4 text-red-600" />
                  <AlertDescription>
                    <div className="space-y-2">
                      <p className="font-semibold text-red-900">
                        Paciente que faltou: {agendamentoParaSubstituir.paciente_nome}
                      </p>
                      <p className="text-sm text-red-700">
                        Data/Hora: {agendamentoParaSubstituir.data ? format(parseISO(agendamentoParaSubstituir.data), "dd/MM/yyyy") : 'N/A'} às {agendamentoParaSubstituir.horario}
                      </p>
                      <p className="text-xs text-red-600 mt-2">
                        ⚠️ O agendamento original será mantido como "Faltou" no histórico
                      </p>
                    </div>
                  </AlertDescription>
                </Alert>
              )}

              {agendamentoParaSubstituir.eh_substituicao && (
                <Alert className="bg-orange-50 border-orange-200">
                  <AlertCircle className="h-4 w-4 text-orange-600" />
                  <AlertDescription>
                    <div className="space-y-2">
                      <p className="font-semibold text-orange-900">
                        Editando substituição existente
                      </p>
                      <p className="text-sm text-orange-700">
                        Paciente atual: {agendamentoParaSubstituir.paciente_nome}
                      </p>
                      <p className="text-sm text-orange-700">
                        Paciente que faltou: {agendamentoParaSubstituir.paciente_faltou_nome}
                      </p>
                    </div>
                  </AlertDescription>
                </Alert>
              )}

              <div className="space-y-2">
                <Label>Selecione o {agendamentoParaSubstituir.eh_substituicao ? 'Novo' : ''} Paciente Substituto</Label>
                <Select value={pacienteSubstituto} onValueChange={setPacienteSubstituto}>
                  <SelectTrigger>
                    <SelectValue placeholder="Escolha um paciente para o horário" />
                  </SelectTrigger>
                  <SelectContent>
                    {pacientes
                      .filter(p => p.id !== (agendamentoParaSubstituir.eh_substituicao ? agendamentoParaSubstituir.paciente_faltou_id : agendamentoParaSubstituir.paciente_id))
                      .map(p => (
                        <SelectItem key={p.id} value={p.id}>
                          {p.nome_completo}
                          {p.telefone && ` - ${p.telefone}`}
                        </SelectItem>
                      ))}
                  </SelectContent>
                </Select>
                <p className="text-xs text-slate-500">
                  {agendamentoParaSubstituir.eh_substituicao 
                    ? 'Escolha outro paciente para esta substituição.'
                    : 'Esta será uma substituição pontual. Um novo agendamento será criado para o paciente selecionado.'}
                </p>
              </div>

              {!agendamentoParaSubstituir.eh_substituicao && (
                <Alert className="bg-blue-50 border-blue-200">
                  <AlertDescription className="text-sm text-blue-900">
                    <strong>O que acontecerá:</strong>
                    <ul className="list-disc list-inside mt-2 space-y-1 text-xs">
                      <li>O agendamento de {agendamentoParaSubstituir.paciente_nome} será marcado como "Faltou"</li>
                      <li>Um novo agendamento será criado para o paciente substituto no mesmo horário</li>
                      <li>Ambos os registros ficarão no histórico com indicação de substituição</li>
                      <li>Esta substituição é pontual e não afeta outros agendamentos</li>
                    </ul>
                  </AlertDescription>
                </Alert>
              )}
            </div>
          )}

          <DialogFooter>
            <Button variant="outline" onClick={() => setShowSubstituicaoDialog(false)}>
              Cancelar
            </Button>
            <Button
              onClick={handleConfirmarSubstituicao}
              disabled={!pacienteSubstituto}
              className="bg-gradient-to-r from-orange-500 to-red-500"
            >
              <RefreshCw className="w-4 h-4 mr-2" />
              {agendamentoParaSubstituir?.eh_substituicao ? 'Salvar Alteração' : 'Confirmar Substituição'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Dialog de Cancelar Substituição */}
      <Dialog open={showCancelarSubstituicaoDialog} onOpenChange={setShowCancelarSubstituicaoDialog}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <XCircle className="w-5 h-5 text-red-600" />
              Cancelar Substituição
            </DialogTitle>
          </DialogHeader>

          {substituicaoParaCancelar && (
            <div className="space-y-4">
              <Alert className="bg-amber-50 border-amber-200">
                <AlertCircle className="h-4 w-4 text-amber-600" />
                <AlertDescription>
                  <div className="space-y-2">
                    <p className="font-semibold text-amber-900">
                      Substituição atual: {substituicaoParaCancelar.paciente_nome}
                    </p>
                    <p className="text-sm text-amber-700">
                      Paciente que faltou: {substituicaoParaCancelar.paciente_faltou_nome}
                    </p>
                    <p className="text-sm text-amber-700">
                      Data/Hora: {substituicaoParaCancelar.data ? format(parseISO(substituicaoParaCancelar.data), "dd/MM/yyyy") : 'N/A'} às {substituicaoParaCancelar.horario}
                    </p>
                  </div>
                </AlertDescription>
              </Alert>

              <div className="space-y-3">
                <p className="text-sm font-semibold text-slate-700">
                  O que você deseja fazer após cancelar esta substituição?
                </p>

                <div className="space-y-2">
                  <Card className="border-2 border-blue-200 hover:border-blue-400 cursor-pointer transition-colors">
                    <CardContent className="p-4">
                      <div className="flex items-start gap-3">
                        <RefreshCw className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" />
                        <div className="flex-1">
                          <p className="font-semibold text-blue-900 mb-1">
                            Restaurar agendamento original
                          </p>
                          <p className="text-xs text-blue-700">
                            O agendamento de <strong>{substituicaoParaCancelar.paciente_faltou_nome}</strong> será restaurado e voltará ao status "Agendado".
                          </p>
                          <Button
                            onClick={() => handleConfirmarCancelamentoSubstituicao('restaurar')}
                            className="mt-3 w-full bg-blue-600 hover:bg-blue-700"
                          >
                            <RefreshCw className="w-4 h-4 mr-2" />
                            Restaurar e Cancelar Substituição
                          </Button>
                        </div>
                      </div>
                    </CardContent>
                  </Card>

                  <Card className="border-2 border-slate-200 hover:border-slate-400 cursor-pointer transition-colors">
                    <CardContent className="p-4">
                      <div className="flex items-start gap-3">
                        <XCircle className="w-5 h-5 text-slate-600 flex-shrink-0 mt-0.5" />
                        <div className="flex-1">
                          <p className="font-semibold text-slate-900 mb-1">
                            Apenas cancelar substituição
                          </p>
                          <p className="text-xs text-slate-700">
                            A substituição será removida e o horário ficará vago. O registro de falta de <strong>{substituicaoParaCancelar.paciente_faltou_nome}</strong> será mantido.
                          </p>
                          <Button
                            onClick={() => handleConfirmarCancelamentoSubstituicao('vago')}
                            variant="outline"
                            className="mt-3 w-full"
                          >
                            <XCircle className="w-4 h-4 mr-2" />
                            Deixar Horário Vago
                          </Button>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </div>
              </div>
            </div>
          )}

          <DialogFooter>
            <Button variant="outline" onClick={() => setShowCancelarSubstituicaoDialog(false)}>
              Voltar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {showModal && (
        <AgendamentoModal
          agendamento={agendamentoSelecionado}
          pacientes={pacientes}
          profissionais={profissionais}
          onClose={() => {
            setShowModal(false);
            setAgendamentoSelecionado(null);
          }}
        />
      )}
    </div>
  );
}