
import React, { useState } from "react";
import { base44 } from "@/api/base44Client";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Search,
  CheckCircle2,
  AlertCircle,
  Clock,
  Receipt,
  DollarSign,
  MoreVertical,
  Phone,
  Mail,
  FileText,
  Calendar,
  Activity,
  RefreshCw
} from "lucide-react";
import { format, startOfMonth, endOfMonth, isPast, parseISO, isWithinInterval } from "date-fns";
import { ptBR } from "date-fns/locale";
import PagamentoModal from "@/components/financeiro/PagamentoModal";
import NotaFiscalModal from "@/components/financeiro/NotaFiscalModal";
import HistoricoFinanceiroModal from "@/components/financeiro/HistoricoFinanceiroModal";


export default function GestaoFinanceiraPacientes({ pacientes, pagamentos, notasFiscais }) {
  const [searchTerm, setSearchTerm] = useState('');
  const [showPagamentoModal, setShowPagamentoModal] = useState(false);
  const [showNotaModal, setShowNotaModal] = useState(false);
  const [showHistoricoModal, setShowHistoricoModal] = useState(false);
  const [pacienteSelecionado, setPacienteSelecionado] = useState(null);
  const queryClient = useQueryClient();

  const hoje = new Date();
  const inicioMes = startOfMonth(hoje);
  const fimMes = endOfMonth(hoje);

  // Buscar todas as evoluções - com refetch automático
  const { data: evolucoes = [], refetch: refetchEvolucoes, isRefetching: isRefetchingEvolucoes } = useQuery({
    queryKey: ['evolucoes-todas'],
    queryFn: () => base44.entities.Evolucao.list(),
    staleTime: 0,
    refetchOnWindowFocus: true,
  });

  // Buscar todos os contratos - com refetch automático
  const { data: contratos = [], refetch: refetchContratos, isRefetching: isRefetchingContratos } = useQuery({
    queryKey: ['contratos-todos'],
    queryFn: () => base44.entities.Contrato.list(),
    staleTime: 0,
    refetchOnWindowFocus: true,
  });

  const updatePagamentoMutation = useMutation({
    mutationFn: ({ id, data }) => base44.entities.Pagamento.update(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries(['pagamentos']);
    },
  });

  const handleAtualizarDados = async () => {
    await Promise.all([
      refetchEvolucoes(),
      refetchContratos(),
      queryClient.invalidateQueries(['pagamentos']),
      queryClient.invalidateQueries(['notas-fiscais']),
      queryClient.invalidateQueries(['pacientes'])
    ]);
  };

  const isRefreshing = isRefetchingEvolucoes || isRefetchingContratos;

  const getValorContratado = (paciente) => {
    // Buscar contrato ativo do paciente
    const contratoAtivo = contratos.find(c =>
      c.paciente_id === paciente.id &&
      c.status === 'ativo'
    );

    if (contratoAtivo && contratoAtivo.valor_mensal) {
      return contratoAtivo.valor_mensal;
    }

    return 0;
  };

  const getConsultasTotais = (paciente) => {
    // Buscar contrato ativo do paciente
    const contratoAtivo = contratos.find(c =>
      c.paciente_id === paciente.id &&
      c.status === 'ativo'
    );

    if (!contratoAtivo || !contratoAtivo.servicos_inclusos) return 0;

    // Procurar nos serviços inclusos por consultas
    const servicoConsultas = contratoAtivo.servicos_inclusos.find(s =>
      s.servico?.toLowerCase().includes('consulta') ||
      s.periodicidade === 'mensal'
    );

    return servicoConsultas?.quantidade || 0;
  };

  const calcularValorDevido = (paciente) => {
    // Contar evoluções do mês
    const evolucoesDoMes = evolucoes.filter(e => {
      if (e.paciente_id !== paciente.id) return false;
      if (!e.data_atendimento) return false;

      try {
        const dataAtendimento = parseISO(e.data_atendimento);
        return isWithinInterval(dataAtendimento, { start: inicioMes, end: fimMes });
      } catch (error) {
        console.error('Erro ao processar data:', e.data_atendimento, error);
        return false;
      }
    });

    const quantidadeEvolucoes = evolucoesDoMes.length;

    // Se não tem evolução no mês, não deve nada
    if (quantidadeEvolucoes === 0) return 0;

    // Buscar contrato ativo
    const contratoAtivo = contratos.find(c =>
      c.paciente_id === paciente.id &&
      c.status === 'ativo'
    );

    // Se tem contrato ativo, calcular baseado no valor mensal
    if (contratoAtivo && contratoAtivo.valor_mensal) {
      const consultasTotais = getConsultasTotais(paciente);

      // Se tem limite de consultas definido
      if (consultasTotais > 0) {
        const valorPorConsulta = contratoAtivo.valor_mensal / consultasTotais;
        return quantidadeEvolucoes * valorPorConsulta;
      }

      // Se não tem limite, cobra o valor mensal fixo
      return contratoAtivo.valor_mensal;
    }

    // Se não tem contrato, retorna 0
    return 0;
  };

  const handleMarcarComoPago = async (paciente, pagamento, valorCalculado) => {
    if (!pagamento) {
      await base44.entities.Pagamento.create({
        paciente_id: paciente.id,
        paciente_nome: paciente.nome_completo,
        data_vencimento: new Date(hoje.getFullYear(), hoje.getMonth(), paciente.dia_vencimento || 10).toISOString().split('T')[0],
        data_pagamento: new Date().toISOString().split('T')[0],
        valor: valorCalculado,
        valor_pago: valorCalculado,
        status: 'pago',
        tipo: 'mensalidade',
        forma_pagamento: paciente.forma_pagamento_preferencial || 'pix'
      });
    } else {
      await updatePagamentoMutation.mutateAsync({
        id: pagamento.id,
        data: {
          ...pagamento,
          status: 'pago',
          data_pagamento: new Date().toISOString().split('T')[0],
          valor: valorCalculado,
          valor_pago: valorCalculado
        }
      });
    }
    queryClient.invalidateQueries(['pagamentos']);
  };

  const handleInformarPagamento = (paciente, valorCalculado) => {
    setPacienteSelecionado({ ...paciente, valorCalculado });
    setShowPagamentoModal(true);
  };

  const handleEmitirNota = (paciente, valorCalculado) => {
    // Calcular dados para pré-preenchimento
    const dados = getDadosFinanceirosPaciente(paciente);
    const contrato = dados.contratoAtivo;
    const mesReferencia = format(hoje, 'MMMM/yyyy', { locale: ptBR });

    // Gerar descrição dos serviços
    let descricaoServicos = `Serviços de Psicologia - Mês de Referência: ${mesReferencia}`;
    if (contrato?.servicos_inclusos && contrato.servicos_inclusos.length > 0) {
      const servicos = contrato.servicos_inclusos.map(s => `${s.servico} (${s.quantidade}x)`).join(', ');
      descricaoServicos += `\nPacote Contratado: ${servicos}`;
    }

    // Adicionar total de atendimentos realizados
    if (dados.quantidadeEvolucoes > 0) {
      descricaoServicos += `\nAtendimentos Realizados: ${dados.quantidadeEvolucoes}`;
    }

    setPacienteSelecionado({
      ...paciente,
      valorCalculado,
      quantidadeConsultas: dados.quantidadeEvolucoes || 0,
      descricaoServicos
    });
    setShowNotaModal(true);
  };

  const handleCobrar = async (paciente) => {
    // Tentar obter dados com base no tipo de responsável
    let targetNome = paciente.responsavel_financeiro_tipo === 'proprio_paciente'
      ? paciente.nome_completo
      : paciente.responsavel_financeiro_tipo === 'responsavel_legal'
        ? paciente.nome_responsavel_legal
        : paciente.nome_responsavel_financeiro;

    let targetTelefone = paciente.responsavel_financeiro_tipo === 'proprio_paciente'
      ? paciente.telefone
      : paciente.responsavel_financeiro_tipo === 'responsavel_legal'
        ? paciente.telefone_responsavel_legal
        : paciente.telefone_responsavel_financeiro;

    let targetEmail = paciente.responsavel_financeiro_tipo === 'proprio_paciente'
      ? paciente.email
      : paciente.responsavel_financeiro_tipo === 'responsavel_legal'
        ? paciente.email_responsavel_legal
        : paciente.email_responsavel_financeiro;

    // Fallback: Se não encontrou contato específico do responsável, usar o do paciente
    // Isso é comum quando o cadastro coloca o telefone do pai/mãe no campo 'telefone' do paciente
    if (!targetTelefone && !targetEmail) {
      if (paciente.telefone || paciente.email) {
        // Se mudamos para o contato do paciente, talvez devêssemos usar o nome dele também?
        // Ou assumimos que o telefone principal é do responsável mesmo.
        // Vamos manter o nome do responsável se houver, senão o do paciente.
        targetNome = targetNome || paciente.nome_completo;
        targetTelefone = paciente.telefone;
        targetEmail = paciente.email;
      }
    }

    // Garantir que temos um nome para a mensagem
    targetNome = targetNome || paciente.nome_completo;

    if (targetTelefone) {
      const mensagem = `Olá ${targetNome}, lembramos que o pagamento referente ao paciente ${paciente.nome_completo} vence no dia ${paciente.dia_vencimento || 10}. Por favor, efetue o pagamento para manter os serviços ativos.`;
      const whatsappUrl = `https://wa.me/55${targetTelefone.replace(/\D/g, '')}?text=${encodeURIComponent(mensagem)}`;
      window.open(whatsappUrl, '_blank');
    } else if (targetEmail) {
      alert(`Enviar cobrança por email para: ${targetEmail}\n(Funcionalidade de email em desenvolvimento)`);
    } else {
      alert('Paciente (e seu responsável) não possui telefone ou email cadastrado para cobrança.');
    }
  };

  const handleVerHistorico = (paciente) => {
    setPacienteSelecionado(paciente);
    setShowHistoricoModal(true);
  };

  const getDadosFinanceirosPaciente = (paciente) => {
    const valorContratado = getValorContratado(paciente);
    const valorCalculado = calcularValorDevido(paciente);
    const consultasTotais = getConsultasTotais(paciente);

    const pagamentoMes = pagamentos.find(p => {
      if (p.paciente_id !== paciente.id) return false;
      if (!p.data_vencimento) return false;

      try {
        const dataVencimento = parseISO(p.data_vencimento);
        return isWithinInterval(dataVencimento, { start: inicioMes, end: fimMes });
      } catch (error) {
        return false;
      }
    });

    const notaMes = notasFiscais.find(n => {
      if (n.paciente_id !== paciente.id) return false;
      const mesRef = format(hoje, 'yyyy-MM');
      return n.mes_referencia === mesRef;
    });

    const evolucoesDoMes = evolucoes.filter(e => {
      if (e.paciente_id !== paciente.id) return false;
      if (!e.data_atendimento) return false;

      try {
        const dataAtendimento = parseISO(e.data_atendimento);
        return isWithinInterval(dataAtendimento, { start: inicioMes, end: fimMes });
      } catch (error) {
        return false;
      }
    });

    const contratoAtivo = contratos.find(c =>
      c.paciente_id === paciente.id &&
      c.status === 'ativo'
    );

    const jaFoiPago = pagamentoMes?.status === 'pago';
    const estaAtrasado = pagamentoMes && pagamentoMes.status !== 'pago' && isPast(parseISO(pagamentoMes.data_vencimento));

    return {
      pagamento: pagamentoMes,
      nota: notaMes,
      jaFoiPago,
      estaAtrasado,
      valorContratado,
      valorCalculado,
      quantidadeEvolucoes: evolucoesDoMes.length,
      consultasTotais,
      statusPagamento: jaFoiPago ? 'pago' : estaAtrasado ? 'atrasado' : 'pendente',
      contratoAtivo
    };
  };

  const pacientesFiltrados = pacientes.filter(p =>
    p.nome_completo?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    p.cpf?.includes(searchTerm) ||
    p.telefone?.includes(searchTerm)
  );

  const getResponsavelFinanceiro = (paciente) => {
    if (paciente.responsavel_financeiro_tipo === 'proprio_paciente') {
      return {
        nome: paciente.nome_completo,
        telefone: paciente.telefone,
        email: paciente.email
      };
    } else if (paciente.responsavel_financeiro_tipo === 'responsavel_legal') {
      return {
        nome: paciente.nome_responsavel_legal,
        telefone: paciente.telefone_responsavel_legal,
        email: paciente.email_responsavel_legal
      };
    } else {
      return {
        nome: paciente.nome_responsavel_financeiro,
        telefone: paciente.telefone_responsavel_financeiro,
        email: paciente.email_responsavel_financeiro
      };
    }
  };

  const statusContratoConfig = {
    ativo: {
      label: 'Ativo',
      color: 'bg-green-100 text-green-700 border-green-300',
      icon: CheckCircle2
    },
    rascunho: {
      label: 'Rascunho',
      color: 'bg-slate-100 text-slate-700 border-slate-300',
      icon: FileText
    },
    suspenso: {
      label: 'Suspenso',
      color: 'bg-amber-100 text-amber-700 border-amber-300',
      icon: AlertCircle
    },
    cancelado: {
      label: 'Cancelado',
      color: 'bg-red-100 text-red-700 border-red-300',
      icon: AlertCircle
    },
    finalizado: {
      label: 'Finalizado',
      color: 'bg-blue-100 text-blue-700 border-blue-300',
      icon: CheckCircle2
    },
    renovacao: {
      label: 'Em Renovação',
      color: 'bg-purple-100 text-purple-700 border-purple-300',
      icon: RefreshCw
    }
  };

  return (
    <>
      <Card className="border-none shadow-lg">
        <CardContent className="p-6">
          <div className="flex flex-col md:flex-row gap-4 justify-between items-start md:items-center mb-6">
            <h3 className="text-xl font-bold text-slate-800">Gestão Financeira por Paciente</h3>
            <div className="flex gap-3 flex-1 max-w-2xl w-full">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400 w-5 h-5" />
                <Input
                  placeholder="Buscar paciente..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
              <Button
                onClick={handleAtualizarDados}
                disabled={isRefreshing}
                variant="outline"
                className="flex items-center gap-2"
              >
                <RefreshCw className={`w-4 h-4 ${isRefreshing ? 'animate-spin' : ''}`} />
                Atualizar
              </Button>
            </div>
          </div>

          <div className="mb-4 p-3 bg-blue-50 border-2 border-blue-200 rounded-lg">
            <p className="text-sm text-blue-800 flex items-center gap-2">
              <Activity className="w-4 h-4" />
              <strong>ℹ️ Cálculo Automático:</strong> O valor devido é calculado baseado nos atendimentos do prontuário do mês multiplicado pelo valor proporcional do pacote contratado.
            </p>
          </div>

          {pacientesFiltrados.length === 0 ? (
            <div className="text-center py-12">
              <DollarSign className="w-16 h-16 text-slate-300 mx-auto mb-4" />
              <p className="text-slate-500">Nenhum paciente encontrado</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow className="bg-slate-50">
                    <TableHead className="font-semibold">Paciente</TableHead>
                    <TableHead className="font-semibold">Responsável Financeiro</TableHead>
                    <TableHead className="font-semibold">Contrato</TableHead>
                    <TableHead className="font-semibold">Vencimento</TableHead>
                    <TableHead className="font-semibold">Atendimentos</TableHead>
                    <TableHead className="font-semibold">Valor Contratado</TableHead>
                    <TableHead className="font-semibold">Valor Devido</TableHead>
                    <TableHead className="font-semibold">Status Pagamento</TableHead>
                    <TableHead className="font-semibold">Nota Fiscal</TableHead>
                    <TableHead className="font-semibold text-right">Ações</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {pacientesFiltrados.map((paciente) => {
                    const dados = getDadosFinanceirosPaciente(paciente);
                    const responsavel = getResponsavelFinanceiro(paciente);
                    const statusConfig = dados.contratoAtivo
                      ? statusContratoConfig[dados.contratoAtivo.status]
                      : null;
                    const StatusIcon = statusConfig?.icon || AlertCircle;

                    return (
                      <TableRow key={paciente.id} className="hover:bg-slate-50">
                        {/* Paciente */}
                        <TableCell>
                          <div className="flex items-center gap-3">
                            {paciente.foto_url ? (
                              <img
                                src={paciente.foto_url}
                                alt={paciente.nome_completo}
                                className="w-10 h-10 rounded-full object-cover border-2 border-slate-200"
                              />
                            ) : (
                              <div className="w-10 h-10 rounded-full bg-gradient-to-br from-cyan-500 to-teal-500 flex items-center justify-center text-white font-bold text-sm">
                                {paciente.nome_completo?.charAt(0).toUpperCase()}
                              </div>
                            )}
                            <div>
                              <p className="font-semibold text-slate-800">
                                {paciente.nome_completo}
                              </p>
                              <p className="text-xs text-slate-500">
                                {paciente.tipo_pagamento || 'Particular'}
                              </p>
                            </div>
                          </div>
                        </TableCell>

                        {/* Responsável Financeiro */}
                        <TableCell>
                          <div className="space-y-1">
                            <p className="text-sm font-medium text-slate-700">
                              {responsavel.nome || '-'}
                            </p>
                            {responsavel.telefone && (
                              <div className="flex items-center gap-1 text-xs text-slate-500">
                                <Phone className="w-3 h-3" />
                                {responsavel.telefone}
                              </div>
                            )}
                            {responsavel.email && (
                              <div className="flex items-center gap-1 text-xs text-slate-500">
                                <Mail className="w-3 h-3" />
                                {responsavel.email}
                              </div>
                            )}
                          </div>
                        </TableCell>

                        {/* Contrato */}
                        <TableCell>
                          {dados.contratoAtivo ? (
                            <div className="space-y-1">
                              <div className={`inline-flex items-center gap-1.5 px-2 py-1 rounded-md border ${statusConfig?.color || 'bg-slate-100 text-slate-700 border-slate-300'}`}>
                                <StatusIcon className="w-3.5 h-3.5" />
                                <span className="text-xs font-semibold">
                                  {statusConfig?.label || dados.contratoAtivo.status}
                                </span>
                              </div>
                              {dados.contratoAtivo.numero_contrato && (
                                <p className="text-xs text-slate-500 font-mono">
                                  {dados.contratoAtivo.numero_contrato}
                                </p>
                              )}
                              {dados.contratoAtivo.titulo && (
                                <p className="text-xs text-slate-600 line-clamp-1">
                                  {dados.contratoAtivo.titulo}
                                </p>
                              )}
                            </div>
                          ) : (
                            <div className="flex items-center gap-2 text-slate-400">
                              <AlertCircle className="w-4 h-4" />
                              <span className="text-xs font-medium">Sem contrato</span>
                            </div>
                          )}
                        </TableCell>

                        {/* Vencimento */}
                        <TableCell>
                          <div className="flex items-center gap-2">
                            <Calendar className="w-4 h-4 text-purple-600" />
                            <span className="font-medium">Dia {paciente.dia_vencimento || 10}</span>
                          </div>
                        </TableCell>

                        {/* Evoluções */}
                        <TableCell>
                          <div className="flex items-center gap-2">
                            <Activity className="w-4 h-4 text-blue-600" />
                            <span className="font-bold text-blue-700">
                              {dados.quantidadeEvolucoes}x
                            </span>
                            {dados.consultasTotais > 0 && (
                              <span className="text-xs text-slate-500">
                                / {dados.consultasTotais}
                              </span>
                            )}
                          </div>
                        </TableCell>

                        {/* Valor Contratado */}
                        <TableCell>
                          <div>
                            <span className="font-semibold text-purple-700 text-base">
                              R$ {dados.valorContratado.toFixed(2)}
                            </span>
                            {dados.consultasTotais > 0 && (
                              <p className="text-xs text-slate-500">
                                {dados.consultasTotais} consultas/mês
                              </p>
                            )}
                          </div>
                        </TableCell>

                        {/* Valor Devido */}
                        <TableCell>
                          <div>
                            <span className="font-bold text-slate-800 text-lg">
                              R$ {dados.valorCalculado.toFixed(2)}
                            </span>
                            {dados.quantidadeEvolucoes > 0 && dados.consultasTotais > 0 && (
                              <p className="text-xs text-slate-500">
                                {dados.quantidadeEvolucoes} × R$ {(dados.valorContratado / dados.consultasTotais).toFixed(2)}
                              </p>
                            )}
                          </div>
                        </TableCell>

                        {/* Status Pagamento */}
                        <TableCell>
                          {dados.jaFoiPago ? (
                            <div className="flex items-center gap-2 text-green-700">
                              <CheckCircle2 className="w-4 h-4" />
                              <span className="text-sm font-bold">PAGO</span>
                            </div>
                          ) : dados.estaAtrasado ? (
                            <div className="flex items-center gap-2 text-red-700">
                              <AlertCircle className="w-4 h-4" />
                              <span className="text-sm font-bold">ATRASADO</span>
                            </div>
                          ) : dados.valorCalculado > 0 ? (
                            <div className="flex items-center gap-2 text-amber-700">
                              <Clock className="w-4 h-4" />
                              <span className="text-sm font-bold">PENDENTE</span>
                            </div>
                          ) : (
                            <div className="flex items-center gap-2 text-slate-400">
                              <Clock className="w-4 h-4" />
                              <span className="text-sm font-bold">SEM ATENDIMENTO</span>
                            </div>
                          )}
                        </TableCell>

                        {/* Nota Fiscal */}
                        <TableCell>
                          {dados.nota ? (
                            <div className="flex items-center gap-2">
                              <Receipt className="w-4 h-4 text-green-600" />
                              <span className="text-xs text-green-700 font-medium">
                                {dados.nota.numero_nota || 'Emitida'}
                              </span>
                            </div>
                          ) : (
                            <span className="text-xs text-slate-400">Não emitida</span>
                          )}
                        </TableCell>

                        {/* Ações */}
                        <TableCell className="text-right">
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button variant="ghost" size="sm">
                                <MoreVertical className="w-4 h-4" />
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end" className="w-56">
                              <DropdownMenuItem
                                onClick={() => handleInformarPagamento(paciente, dados.valorCalculado)}
                                className="cursor-pointer"
                              >
                                <DollarSign className="w-4 h-4 mr-2 text-green-600" />
                                Informar Pagamento
                              </DropdownMenuItem>

                              <DropdownMenuItem
                                onClick={() => handleMarcarComoPago(paciente, dados.pagamento, dados.valorCalculado)}
                                className="cursor-pointer"
                              >
                                <CheckCircle2 className="w-4 h-4 mr-2 text-green-600" />
                                Marcar como Pago
                              </DropdownMenuItem>

                              <DropdownMenuItem
                                onClick={() => handleCobrar(paciente)}
                                className="cursor-pointer"
                              >
                                <Phone className="w-4 h-4 mr-2 text-blue-600" />
                                Enviar Cobrança
                              </DropdownMenuItem>

                              <div className="my-1 border-t border-slate-200" />

                              <DropdownMenuItem
                                onClick={() => handleEmitirNota(paciente, dados.valorCalculado)}
                                className="cursor-pointer"
                              >
                                <Receipt className="w-4 h-4 mr-2 text-purple-600" />
                                Emitir Nota Fiscal
                              </DropdownMenuItem>

                              <DropdownMenuItem
                                onClick={() => handleVerHistorico(paciente)}
                                className="cursor-pointer"
                              >
                                <FileText className="w-4 h-4 mr-2 text-slate-600" />
                                Ver Histórico
                              </DropdownMenuItem>
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>

      {showPagamentoModal && pacienteSelecionado && (
        <PagamentoModal
          pagamento={{
            paciente_id: pacienteSelecionado.id,
            paciente_nome: pacienteSelecionado.nome_completo,
            data_vencimento: new Date(hoje.getFullYear(), hoje.getMonth(), pacienteSelecionado.dia_vencimento || 10).toISOString().split('T')[0],
            tipo: 'mensalidade',
            valor: pacienteSelecionado.valorCalculado || 0
          }}
          pacientes={pacientes}
          onClose={() => {
            setShowPagamentoModal(false);
            setPacienteSelecionado(null);
          }}
        />
      )}

      {showNotaModal && pacienteSelecionado && (
        <NotaFiscalModal
          nota={{
            paciente_id: pacienteSelecionado.id,
            paciente_nome: pacienteSelecionado.nome_completo,
            mes_referencia: format(hoje, 'yyyy-MM'),
            data_emissao: new Date().toISOString().split('T')[0],
            valor_total: pacienteSelecionado.valorCalculado || 0,
            quantidadeConsultas: pacienteSelecionado.quantidadeConsultas || 0,
            descricaoServicos: pacienteSelecionado.descricaoServicos || ''
          }}
          onClose={() => {
            setShowNotaModal(false);
            setPacienteSelecionado(null);
          }}
        />
      )}

      {showHistoricoModal && pacienteSelecionado && (
        <HistoricoFinanceiroModal
          paciente={pacienteSelecionado}
          pagamentos={pagamentos}
          notasFiscais={notasFiscais}
          onClose={() => {
            setShowHistoricoModal(false);
            setPacienteSelecionado(null);
          }}
        />
      )}
    </>
  );
}
