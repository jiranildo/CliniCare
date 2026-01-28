import React, { useState } from "react";
import { useViewPreference } from "@/hooks/useViewPreference";
import { base44 } from "@/api/base44Client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  FileText,
  Plus,
  CheckCircle2,
  Clock,
  AlertCircle,
  XCircle,
  RefreshCw,
  FileSignature,
  Calendar,
  DollarSign,
  MoreVertical,
  Edit,
  Trash2,
  Eye
} from "lucide-react";
import ViewHeader from "@/components/common/ViewHeader";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import ContratoModal from "@/components/contratos/ContratoModal";
import ContratoCard from "@/components/contratos/ContratoCard";

export default function Contratos() {
  const [showModal, setShowModal] = useState(false);
  const [editingContrato, setEditingContrato] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [activeTab, setActiveTab] = useState('todos');

  const [viewMode, setViewMode] = useViewPreference('contratos-view-mode', 'cards');
  const queryClient = useQueryClient();

  const { data: contratos = [], isLoading } = useQuery({
    queryKey: ['contratos'],
    queryFn: () => base44.entities.Contrato.list('-created_date'),
  });

  const deleteContrato = useMutation({
    mutationFn: (id) => base44.entities.Contrato.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries(['contratos']);
    },
  });

  const handleEdit = (contrato) => {
    setEditingContrato(contrato);
    setShowModal(true);
  };

  const handleDelete = async (id) => {
    if (confirm('Tem certeza que deseja excluir este contrato?')) {
      await deleteContrato.mutateAsync(id);
    }
  };

  const handleClose = () => {
    setShowModal(false);
    setEditingContrato(null);
  };

  const contratosFiltrados = contratos.filter(c => {
    const matchSearch =
      c.titulo?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      c.numero_contrato?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      c.paciente_nome?.toLowerCase().includes(searchTerm.toLowerCase());

    if (activeTab === 'todos') return matchSearch;
    return matchSearch && c.status === activeTab;
  });

  const estatisticas = {
    total: contratos.length,
    ativos: contratos.filter(c => c.status === 'ativo').length,
    rascunhos: contratos.filter(c => c.status === 'rascunho').length,
    finalizados: contratos.filter(c => c.status === 'finalizado').length,
    vencendo: contratos.filter(c => {
      if (c.status !== 'ativo' || !c.data_termino) return false;
      const hoje = new Date();
      const termino = new Date(c.data_termino);
      const diasRestantes = Math.floor((termino - hoje) / (1000 * 60 * 60 * 24));
      return diasRestantes > 0 && diasRestantes <= 30;
    }).length
  };

  const statusConfig = {
    rascunho: { label: 'Rascunho', color: 'bg-slate-100 text-slate-700', icon: FileText },
    ativo: { label: 'Ativo', color: 'bg-green-100 text-green-700', icon: CheckCircle2 },
    suspenso: { label: 'Suspenso', color: 'bg-amber-100 text-amber-700', icon: Clock },
    cancelado: { label: 'Cancelado', color: 'bg-red-100 text-red-700', icon: XCircle },
    finalizado: { label: 'Finalizado', color: 'bg-blue-100 text-blue-700', icon: CheckCircle2 },
    renovacao: { label: 'Em Renovação', color: 'bg-purple-100 text-purple-700', icon: RefreshCw }
  };

  return (
    <div className="p-6 md:p-8 space-y-6">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold text-slate-800 flex items-center gap-3">
            <FileSignature className="w-8 h-8 text-cyan-600" />
            Contratos
          </h1>
          <p className="text-slate-500 mt-1">Gestão de contratos e acordos</p>
        </div>
        <Button
          onClick={() => setShowModal(true)}
          className="bg-gradient-to-r from-cyan-500 to-teal-500 hover:from-cyan-600 hover:to-teal-600 shadow-lg"
        >
          <Plus className="w-4 h-4 mr-2" />
          Novo Contrato
        </Button>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
        <Card className="border-none shadow-lg hover:shadow-xl transition-all cursor-pointer" onClick={() => setActiveTab('todos')}>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-slate-500 mb-1">Total</p>
                <p className="text-3xl font-bold text-slate-800">{estatisticas.total}</p>
              </div>
              <FileText className="w-8 h-8 text-slate-400" />
            </div>
          </CardContent>
        </Card>

        <Card className="border-none shadow-lg hover:shadow-xl transition-all cursor-pointer" onClick={() => setActiveTab('ativo')}>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-slate-500 mb-1">Ativos</p>
                <p className="text-3xl font-bold text-green-600">{estatisticas.ativos}</p>
              </div>
              <CheckCircle2 className="w-8 h-8 text-green-400" />
            </div>
          </CardContent>
        </Card>

        <Card className="border-none shadow-lg hover:shadow-xl transition-all cursor-pointer" onClick={() => setActiveTab('rascunho')}>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-slate-500 mb-1">Rascunhos</p>
                <p className="text-3xl font-bold text-slate-600">{estatisticas.rascunhos}</p>
              </div>
              <FileText className="w-8 h-8 text-slate-400" />
            </div>
          </CardContent>
        </Card>

        <Card className="border-none shadow-lg hover:shadow-xl transition-all">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-slate-500 mb-1">Vencendo</p>
                <p className="text-3xl font-bold text-amber-600">{estatisticas.vencendo}</p>
              </div>
              <Calendar className="w-8 h-8 text-amber-400" />
            </div>
          </CardContent>
        </Card>

        <Card className="border-none shadow-lg hover:shadow-xl transition-all cursor-pointer" onClick={() => setActiveTab('finalizado')}>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-slate-500 mb-1">Finalizados</p>
                <p className="text-3xl font-bold text-blue-600">{estatisticas.finalizados}</p>
              </div>
              <CheckCircle2 className="w-8 h-8 text-blue-400" />
            </div>
          </CardContent>
        </Card>
      </div>

      <ViewHeader
        searchTerm={searchTerm}
        onSearchChange={setSearchTerm}
        placeholder="Buscar por título, número ou paciente..."
        viewMode={viewMode}
        onViewModeChange={setViewMode}
      />

      <Card className="border-none shadow-lg">
        <CardContent className="p-6">
          <Tabs value={activeTab} onValueChange={setActiveTab}>
            <TabsList className="bg-slate-100 mb-6">
              <TabsTrigger value="todos">Todos</TabsTrigger>
              <TabsTrigger value="ativo">Ativos</TabsTrigger>
              <TabsTrigger value="rascunho">Rascunhos</TabsTrigger>
              <TabsTrigger value="suspenso">Suspensos</TabsTrigger>
              <TabsTrigger value="renovacao">Renovação</TabsTrigger>
              <TabsTrigger value="finalizado">Finalizados</TabsTrigger>
            </TabsList>
          </Tabs>

          {isLoading ? (
            <div className="text-center py-12">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-cyan-600 mx-auto"></div>
              <p className="text-slate-500 mt-4">Carregando contratos...</p>
            </div>
          ) : contratosFiltrados.length === 0 ? (
            <div className="text-center py-12 bg-slate-50 rounded-lg">
              <FileSignature className="w-16 h-16 text-slate-300 mx-auto mb-4" />
              <h3 className="text-xl font-semibold text-slate-600 mb-2">
                {searchTerm ? 'Nenhum contrato encontrado' : 'Nenhum contrato cadastrado'}
              </h3>
              <p className="text-slate-400 mb-6">
                {searchTerm ? 'Tente buscar com outros termos' : 'Crie seu primeiro contrato para começar'}
              </p>
              <Button
                onClick={() => setShowModal(true)}
                className="bg-gradient-to-r from-cyan-500 to-teal-500"
              >
                <Plus className="w-4 h-4 mr-2" />
                Criar Primeiro Contrato
              </Button>
            </div>
          ) : viewMode === 'cards' ? (
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
              {contratosFiltrados.map((contrato) => (
                <ContratoCard
                  key={contrato.id}
                  contrato={contrato}
                  onEdit={handleEdit}
                  onDelete={handleDelete}
                  statusConfig={statusConfig}
                />
              ))}
            </div>
          ) : (
            <div className="rounded-md border border-slate-200 overflow-hidden">
              <Table>
                <TableHeader>
                  <TableRow className="bg-slate-50 hover:bg-slate-50">
                    <TableHead>Contrato</TableHead>
                    <TableHead>Paciente</TableHead>
                    <TableHead>Vigência</TableHead>
                    <TableHead>Valor</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead className="text-right">Ações</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {contratosFiltrados.map((contrato) => {
                    const StatusIcon = statusConfig[contrato.status]?.icon || FileText;
                    return (
                      <TableRow key={contrato.id}>
                        <TableCell className="font-medium">
                          <div>
                            <p className="text-slate-800 font-semibold">{contrato.titulo}</p>
                            <p className="text-xs text-slate-500">{contrato.numero_contrato || 'Sem número'}</p>
                          </div>
                        </TableCell>
                        <TableCell>{contrato.paciente_nome}</TableCell>
                        <TableCell>
                          <div className="text-sm">
                            <p>Início: {contrato.data_inicio ? new Date(contrato.data_inicio).toLocaleDateString() : '-'}</p>
                            <p className="text-slate-500">Fim: {contrato.data_termino ? new Date(contrato.data_termino).toLocaleDateString() : '-'}</p>
                          </div>
                        </TableCell>
                        <TableCell>
                          <span className="font-medium text-slate-700">
                            {contrato.valor_mensal ? parseFloat(contrato.valor_mensal).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' }) : '-'}
                          </span>
                        </TableCell>
                        <TableCell>
                          <div className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-medium ${statusConfig[contrato.status]?.color}`}>
                            <StatusIcon className="w-3.5 h-3.5" />
                            {statusConfig[contrato.status]?.label}
                          </div>
                        </TableCell>
                        <TableCell className="text-right">
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button variant="ghost" className="h-8 w-8 p-0">
                                <span className="sr-only">Abrir menu</span>
                                <MoreVertical className="h-4 w-4" />
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                              <DropdownMenuLabel>Ações</DropdownMenuLabel>
                              <DropdownMenuItem onClick={() => handleEdit(contrato)}>
                                <Edit className="mr-2 h-4 w-4" />
                                Editar
                              </DropdownMenuItem>
                              <DropdownMenuItem
                                className="text-red-600 focus:text-red-700"
                                onClick={() => handleDelete(contrato.id)}
                              >
                                <Trash2 className="mr-2 h-4 w-4" />
                                Excluir
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

      {showModal && (
        <ContratoModal
          contrato={editingContrato}
          onClose={handleClose}
        />
      )}
    </div>
  );
}