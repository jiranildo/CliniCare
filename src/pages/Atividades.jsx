import React, { useState } from "react";
import { base44 } from "@/api/base44Client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { ClipboardList, Plus, Search, Filter, LayoutGrid, List, MoreVertical, Edit, Trash2, CheckCircle, Clock, AlertCircle, Ban } from "lucide-react";
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
import AtividadeModal from "@/components/atividades/AtividadeModal";
import AtividadeCard from "@/components/atividades/AtividadeCard";
import { useViewPreference } from "@/hooks/useViewPreference";
import ViewHeader from "@/components/common/ViewHeader";

export default function Atividades() {
  const [showModal, setShowModal] = useState(false);
  const [editingAtividade, setEditingAtividade] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [filtroStatus, setFiltroStatus] = useState('todos');
  const [viewMode, setViewMode] = useViewPreference('atividades-view-mode', 'cards');
  const queryClient = useQueryClient();

  const { data: atividades = [], isLoading } = useQuery({
    queryKey: ['atividades'],
    queryFn: () => base44.entities.Atividade.list('-created_at'),
  });

  const { data: pacientes = [] } = useQuery({
    queryKey: ['pacientes'],
    queryFn: () => base44.entities.Paciente.list(),
  });

  const deleteAtividade = useMutation({
    mutationFn: (id) => base44.entities.Atividade.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries(['atividades']);
    },
  });

  const updateAtividade = useMutation({
    mutationFn: ({ id, data }) => base44.entities.Atividade.update(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries(['atividades']);
    },
  });

  const handleEdit = (atividade) => {
    setEditingAtividade(atividade);
    setShowModal(true);
  };

  const handleDelete = async (id) => {
    if (confirm('Tem certeza que deseja excluir esta atividade?')) {
      await deleteAtividade.mutateAsync(id);
    }
  };

  const handleStatusChange = async (atividade, novoStatus) => {
    const updateData = {
      ...atividade,
      status: novoStatus
    };

    if (novoStatus === 'concluido') {
      updateData.concluido_em = new Date().toISOString();
    }

    await updateAtividade.mutateAsync({
      id: atividade.id,
      data: updateData
    });
  };

  const handleClose = () => {
    setShowModal(false);
    setEditingAtividade(null);
  };

  const atividadesFiltradas = atividades.filter(a => {
    const matchSearch = a.titulo?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      a.paciente_nome?.toLowerCase().includes(searchTerm.toLowerCase());
    const matchStatus = filtroStatus === 'todos' || a.status === filtroStatus;
    return matchSearch && matchStatus;
  });

  const statusOptions = [
    { value: 'todos', label: 'Todos' },
    { value: 'pendente', label: 'Pendente' },
    { value: 'em_andamento', label: 'Em Andamento' },
    { value: 'concluido', label: 'Concluído' },
    { value: 'cancelado', label: 'Cancelado' }
  ];

  const estatisticas = {
    total: atividades.length,
    pendente: atividades.filter(a => a.status === 'pendente').length,
    em_andamento: atividades.filter(a => a.status === 'em_andamento').length,
    concluido: atividades.filter(a => a.status === 'concluido').length
  };

  return (
    <div className="p-6 md:p-8 space-y-6">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold text-slate-800 flex items-center gap-3">
            <ClipboardList className="w-8 h-8 text-cyan-600" />
            Atividades
          </h1>
          <p className="text-slate-500 mt-1">Controle de atividades e tarefas dos pacientes</p>
        </div>
        <Button
          onClick={() => setShowModal(true)}
          className="bg-gradient-to-r from-cyan-500 to-teal-500 hover:from-cyan-600 hover:to-teal-600 shadow-lg"
        >
          <Plus className="w-4 h-4 mr-2" />
          Nova Atividade
        </Button>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card className="border-none shadow-lg">
          <CardContent className="p-4">
            <p className="text-sm text-slate-500">Total</p>
            <p className="text-2xl font-bold text-slate-800">{estatisticas.total}</p>
          </CardContent>
        </Card>
        <Card className="border-none shadow-lg">
          <CardContent className="p-4">
            <p className="text-sm text-slate-500">Pendentes</p>
            <p className="text-2xl font-bold text-amber-600">{estatisticas.pendente}</p>
          </CardContent>
        </Card>
        <Card className="border-none shadow-lg">
          <CardContent className="p-4">
            <p className="text-sm text-slate-500">Em Andamento</p>
            <p className="text-2xl font-bold text-blue-600">{estatisticas.em_andamento}</p>
          </CardContent>
        </Card>
        <Card className="border-none shadow-lg">
          <CardContent className="p-4">
            <p className="text-sm text-slate-500">Concluídas</p>
            <p className="text-2xl font-bold text-green-600">{estatisticas.concluido}</p>
          </CardContent>
        </Card>
      </div>

      <ViewHeader
        searchTerm={searchTerm}
        onSearchChange={setSearchTerm}
        placeholder="Buscar por título ou paciente..."
        viewMode={viewMode}
        onViewModeChange={setViewMode}
      >
        <div className="flex items-center gap-2 flex-wrap">
          <Filter className="w-5 h-5 text-slate-600" />
          <span className="text-sm font-medium text-slate-600">Status:</span>
          {statusOptions.map(opt => (
            <Button
              key={opt.value}
              variant={filtroStatus === opt.value ? "default" : "outline"}
              size="sm"
              onClick={() => setFiltroStatus(opt.value)}
              className={filtroStatus === opt.value ? "bg-gradient-to-r from-cyan-500 to-teal-500" : ""}
            >
              {opt.label}
            </Button>
          ))}
        </div>
      </ViewHeader>

      {isLoading ? (
        <div className="text-center py-12">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-cyan-600 mx-auto"></div>
          <p className="text-slate-500 mt-4">Carregando atividades...</p>
        </div>
      ) : atividadesFiltradas.length === 0 ? (
        <Card className="border-none shadow-lg">
          <CardContent className="text-center py-12">
            <ClipboardList className="w-16 h-16 text-slate-300 mx-auto mb-4" />
            <h3 className="text-xl font-semibold text-slate-600 mb-2">
              {searchTerm ? 'Nenhuma atividade encontrada' : 'Nenhuma atividade registrada'}
            </h3>
            <p className="text-slate-400 mb-6">
              {searchTerm ? 'Tente buscar com outros termos' : 'Comece criando uma nova atividade'}
            </p>
            {!searchTerm && (
              <Button
                onClick={() => setShowModal(true)}
                className="bg-gradient-to-r from-cyan-500 to-teal-500 hover:from-cyan-600 hover:to-teal-600"
              >
                <Plus className="w-4 h-4 mr-2" />
                Criar Atividade
              </Button>
            )}
          </CardContent>
        </Card>
      ) : viewMode === 'cards' ? (
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
          {atividadesFiltradas.map((atividade) => (
            <AtividadeCard
              key={atividade.id}
              atividade={atividade}
              onEdit={handleEdit}
              onDelete={handleDelete}
              onStatusChange={handleStatusChange}
            />
          ))}
        </div>
      ) : (
        <Card className="border-none shadow-lg overflow-hidden">
          <Table>
            <TableHeader>
              <TableRow className="bg-slate-50 hover:bg-slate-50">
                <TableHead className="w-[300px]">Atividade</TableHead>
                <TableHead>Paciente</TableHead>
                <TableHead>Prazo</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-right">Ações</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {atividadesFiltradas.map((atividade) => (
                <TableRow key={atividade.id}>
                  <TableCell className="font-medium">
                    <div className="flex items-center gap-3">
                      <div className={`w-8 h-8 rounded-full flex items-center justify-center ${atividade.status === 'concluido' ? 'bg-green-100 text-green-600' :
                        atividade.status === 'pendente' ? 'bg-amber-100 text-amber-600' :
                          atividade.status === 'cancelado' ? 'bg-red-100 text-red-600' :
                            'bg-blue-100 text-blue-600'
                        }`}>
                        {atividade.status === 'concluido' ? <CheckCircle className="w-4 h-4" /> :
                          atividade.status === 'pendente' ? <AlertCircle className="w-4 h-4" /> :
                            atividade.status === 'cancelado' ? <Ban className="w-4 h-4" /> :
                              <Clock className="w-4 h-4" />}
                      </div>
                      <div>
                        <p className="text-slate-800 font-semibold">{atividade.titulo}</p>
                        <p className="text-xs text-slate-500 line-clamp-1">{atividade.descricao}</p>
                      </div>
                    </div>
                  </TableCell>
                  <TableCell>{atividade.paciente_nome || 'N/A'}</TableCell>
                  <TableCell>{atividade.data_prazo ? new Date(atividade.data_prazo).toLocaleDateString() : '-'}</TableCell>
                  <TableCell>
                    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${atividade.status === 'concluido' ? 'bg-green-100 text-green-800' :
                      atividade.status === 'pendente' ? 'bg-amber-100 text-amber-800' :
                        atividade.status === 'cancelado' ? 'bg-red-100 text-red-800' :
                          'bg-blue-100 text-blue-800'
                      }`}>
                      {statusOptions.find(o => o.value === atividade.status)?.label || atividade.status}
                    </span>
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
                        <DropdownMenuItem onClick={() => handleEdit(atividade)}>
                          <Edit className="mr-2 h-4 w-4" />
                          Editar
                        </DropdownMenuItem>
                        <DropdownMenuItem
                          className="text-red-600 focus:text-red-700"
                          onClick={() => handleDelete(atividade.id)}
                        >
                          <Trash2 className="mr-2 h-4 w-4" />
                          Excluir
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </Card>
      )}

      {showModal && (
        <AtividadeModal
          atividade={editingAtividade}
          pacientes={pacientes}
          onClose={handleClose}
        />
      )}
    </div>
  );
}