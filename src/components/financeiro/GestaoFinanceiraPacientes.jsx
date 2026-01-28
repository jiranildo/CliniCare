
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
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
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
  RefreshCw,
  ArrowUpDown
} from "lucide-react";
import { format, startOfMonth, endOfMonth, isPast, parseISO, isWithinInterval } from "date-fns";
import { ptBR } from "date-fns/locale";
import PagamentoModal from "@/components/financeiro/PagamentoModal";
import NotaFiscalModal from "@/components/financeiro/NotaFiscalModal";
import HistoricoFinanceiroModal from "@/components/financeiro/HistoricoFinanceiroModal";
import { useMemo } from "react";


import {
  getValorContratado,
  getConsultasTotais,
  calcularValorDevido,
  getDadosFinanceirosPacienteHelper
} from "@/utils/financeiroUtils";

export default function GestaoFinanceiraPacientes({ pacientes, pagamentos, notasFiscais }) {
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [sortConfig, setSortConfig] = useState({ key: null, direction: 'asc' });

  const [showPagamentoModal, setShowPagamentoModal] = useState(false);
  const [showNotaModal, setShowNotaModal] = useState(false);
  const [showHistoricoModal, setShowHistoricoModal] = useState(false);
  const [pacienteSelecionado, setPacienteSelecionado] = useState(null);
  const queryClient = useQueryClient();

  const hoje = new Date();
  // inicioMes and fimMes are handled inside helper now for data calc, but might be needed for other things? 
  // keeping them if used elsewhere, but helper handles them for financial data.
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

  // Local wrappers for handlers that might need simple access or legacy compatibility
  const getDadosFinanceirosPaciente = (paciente) => {
    return getDadosFinanceirosPacienteHelper(paciente, contratos, evolucoes, pagamentos, notasFiscais, hoje);
  };

  // ... (handlers)


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

  // --- PROCESSING DATA FOR SORTING/FILTERING ---
  const processedData = useMemo(() => {
    return pacientes.map(paciente => {
      const financeiro = getDadosFinanceirosPaciente(paciente);
      const responsavel = getResponsavelFinanceiro(paciente);
      return {
        ...paciente,
        financeiro,
        responsavel
      };
    });
  }, [pacientes, pagamentos, notasFiscais, evolucoes, contratos]);

  const filteredAndSortedData = useMemo(() => {
    let result = processedData;

    // Filter by Search
    if (searchTerm) {
      const term = searchTerm.toLowerCase();
      result = result.filter(p =>
        p.nome_completo?.toLowerCase().includes(term) ||
        p.cpf?.includes(term) ||
        p.telefone?.includes(term)
      );
    }

    // Filter by Status
    if (statusFilter && statusFilter !== 'all') {
      result = result.filter(p => p.financeiro.statusPagamento === statusFilter);
    }

    // Sort
    if (sortConfig.key) {
      result.sort((a, b) => {
        let aValue, bValue;

        switch (sortConfig.key) {
          case 'paciente':
            aValue = a.nome_completo;
            bValue = b.nome_completo;
            break;
          case 'vencimento':
            // Assuming simple day comparison
            // Use 99 for missing day to push to bottom/top
            aValue = a.dia_vencimento || 99;
            bValue = b.dia_vencimento || 99;
            break;
          case 'atendimentos':
            aValue = a.financeiro.quantidadeEvolucoes;
            bValue = b.financeiro.quantidadeEvolucoes;
            break;
          case 'valorContratado':
            aValue = a.financeiro.valorContratado;
            bValue = b.financeiro.valorContratado;
            break;
          case 'valorDevido':
            aValue = a.financeiro.valorCalculado;
            bValue = b.financeiro.valorCalculado;
            break;
          case 'status':
            // Sort by status priority? or alphabetical?
            // Let's do alphabetical for now or mapped priority
            const priority = { 'atrasado': 0, 'pendente': 1, 'pago': 2, 'sem_atendimento': 3 };
            aValue = priority[a.financeiro.statusPagamento] ?? 4;
            bValue = priority[b.financeiro.statusPagamento] ?? 4;
            break;
          default:
            return 0;
        }

        if (aValue < bValue) return sortConfig.direction === 'asc' ? -1 : 1;
        if (aValue > bValue) return sortConfig.direction === 'asc' ? 1 : -1;
        return 0;
      });
    }

    return result;
  }, [processedData, searchTerm, statusFilter, sortConfig]);

  const requestSort = (key) => {
    let direction = 'asc';
    if (sortConfig.key === key && sortConfig.direction === 'asc') {
      direction = 'desc';
    }
    setSortConfig({ key, direction });
  };

  const SortIcon = ({ columnKey }) => {
    if (sortConfig.key !== columnKey) return <ArrowUpDown className="ml-2 h-4 w-4 text-slate-300" />;
    if (sortConfig.direction === 'asc') return <ArrowUpDown className="ml-2 h-4 w-4 text-blue-600 rotate-180" />; // Or specific ArrowUp
    return <ArrowUpDown className="ml-2 h-4 w-4 text-blue-600" />;
  };

  // Re-define handlers (Need to verify if I can just reference them or if I need to copy code)
  // Since I am replacing the whole logic flow, I must ensure handles exist.
  // The logic for handlers relies on `paciente` object. `filteredAndSortedData` items are extended `paciente` objects, so passing them to handlers works fine.

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
    const dados = paciente.financeiro; // Use pre-calculated
    const contrato = dados.contratoAtivo;
    const mesReferencia = format(hoje, 'MMMM/yyyy', { locale: ptBR });

    let descricaoServicos = `Serviços de Psicologia - Mês de Referência: ${mesReferencia}`;
    if (contrato?.servicos_inclusos && contrato.servicos_inclusos.length > 0) {
      const servicos = contrato.servicos_inclusos.map(s => `${s.servico} (${s.quantidade}x)`).join(', ');
      descricaoServicos += `\nPacote Contratado: ${servicos}`;
    }

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
    let targetNome = paciente.responsavel.nome;
    let targetTelefone = paciente.responsavel.telefone;
    let targetEmail = paciente.responsavel.email;

    // Fallback logic is already in getResponsavel? No, getResponsavel just gets specific types.
    // Let's start with what getResponsavel returned.

    if (!targetTelefone && !targetEmail) {
      if (paciente.telefone || paciente.email) {
        targetNome = targetNome || paciente.nome_completo;
        targetTelefone = paciente.telefone;
        targetEmail = paciente.email;
      }
    }

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

              {/* FILTER DROPDOWN */}
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger className="w-[180px]">
                  <SelectValue placeholder="Status Pagamento" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todos os Status</SelectItem>
                  <SelectItem value="pago">Pago</SelectItem>
                  <SelectItem value="pendente">Pendente</SelectItem>
                  <SelectItem value="atrasado">Atrasado</SelectItem>
                  <SelectItem value="sem_atendimento">Sem Atendimento</SelectItem>
                </SelectContent>
              </Select>

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

          {filteredAndSortedData.length === 0 ? (
            <div className="text-center py-12">
              <DollarSign className="w-16 h-16 text-slate-300 mx-auto mb-4" />
              <p className="text-slate-500">Nenhum paciente encontrado</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow className="bg-slate-50">
                    <TableHead
                      className="font-semibold cursor-pointer hover:bg-slate-100 transition-colors"
                      onClick={() => requestSort('paciente')}
                    >
                      <div className="flex items-center">
                        Paciente
                        <SortIcon columnKey="paciente" />
                      </div>
                    </TableHead>
                    <TableHead className="font-semibold">Responsável Financeiro</TableHead>
                    <TableHead className="font-semibold">Contrato</TableHead>
                    <TableHead
                      className="font-semibold cursor-pointer hover:bg-slate-100 transition-colors"
                      onClick={() => requestSort('vencimento')}
                    >
                      <div className="flex items-center">
                        Vencimento
                        <SortIcon columnKey="vencimento" />
                      </div>
                    </TableHead>
                    <TableHead
                      className="font-semibold cursor-pointer hover:bg-slate-100 transition-colors"
                      onClick={() => requestSort('atendimentos')}
                    >
                      <div className="flex items-center">
                        Atendimentos
                        <SortIcon columnKey="atendimentos" />
                      </div>
                    </TableHead>
                    <TableHead
                      className="font-semibold cursor-pointer hover:bg-slate-100 transition-colors"
                      onClick={() => requestSort('valorContratado')}
                    >
                      <div className="flex items-center">
                        Valor Contratado
                        <SortIcon columnKey="valorContratado" />
                      </div>
                    </TableHead>
                    <TableHead
                      className="font-semibold cursor-pointer hover:bg-slate-100 transition-colors"
                      onClick={() => requestSort('valorDevido')}
                    >
                      <div className="flex items-center">
                        Valor Devido
                        <SortIcon columnKey="valorDevido" />
                      </div>
                    </TableHead>
                    <TableHead
                      className="font-semibold cursor-pointer hover:bg-slate-100 transition-colors"
                      onClick={() => requestSort('status')}
                    >
                      <div className="flex items-center">
                        Status Pagamento
                        <SortIcon columnKey="status" />
                      </div>
                    </TableHead>
                    <TableHead className="font-semibold">Nota Fiscal</TableHead>
                    <TableHead className="font-semibold text-right">Ações</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredAndSortedData.map((paciente) => {
                    const dados = paciente.financeiro;
                    const responsavel = paciente.responsavel;
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
