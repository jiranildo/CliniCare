import React, { useState } from "react";
import { base44 } from "@/api/base44Client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  FileText,
  Plus,
  Search,
  Edit,
  Trash2,
  Copy,
  FileSignature,
  LayoutGrid,
  List,
  MoreVertical,
  CheckCircle2,
  XCircle
} from "lucide-react";
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
import ContratoModeloModal from "@/components/contratos/ContratoModeloModal";
import ContratoModeloCard from "@/components/contratos/ContratoModeloCard";
import { useViewPreference } from "@/hooks/useViewPreference";
import ViewHeader from "@/components/common/ViewHeader";

export default function ContratoModelos() {
  const [showModal, setShowModal] = useState(false);
  const [editingModelo, setEditingModelo] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [viewMode, setViewMode] = useViewPreference('contrato-modelos-view-mode', 'cards');
  const queryClient = useQueryClient();

  const { data: modelos = [], isLoading } = useQuery({
    queryKey: ['contrato-modelos'],
    queryFn: () => base44.entities.ContratoModelo.list('-created_at'),
  });

  const deleteModelo = useMutation({
    mutationFn: (id) => base44.entities.ContratoModelo.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries(['contrato-modelos']);
    },
  });

  const handleEdit = (modelo) => {
    setEditingModelo(modelo);
    setShowModal(true);
  };

  const handleDelete = async (id) => {
    if (confirm('Tem certeza que deseja excluir este modelo?')) {
      await deleteModelo.mutateAsync(id);
    }
  };

  const handleClose = () => {
    setShowModal(false);
    setEditingModelo(null);
  };

  const modelosFiltrados = modelos.filter(m =>
    m.nome_modelo?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    m.titulo?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    m.tipo_contrato?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const estatisticas = {
    total: modelos.length,
    ativos: modelos.filter(m => m.ativo).length,
  };

  return (
    <div className="p-6 md:p-8 space-y-6">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold text-slate-800 flex items-center gap-3">
            <FileSignature className="w-8 h-8 text-purple-600" />
            Modelos de Contrato
          </h1>
          <p className="text-slate-500 mt-1">Crie modelos reutilizáveis para agilizar contratos</p>
        </div>
        <Button
          onClick={() => setShowModal(true)}
          className="bg-gradient-to-r from-purple-500 to-indigo-500 hover:from-purple-600 hover:to-indigo-600 shadow-lg"
        >
          <Plus className="w-4 h-4 mr-2" />
          Novo Modelo
        </Button>
      </div>

      {/* Estatísticas */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card className="border-none shadow-lg bg-gradient-to-br from-purple-50 to-indigo-50">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-slate-500 mb-1">Total de Modelos</p>
                <p className="text-3xl font-bold text-slate-800">{estatisticas.total}</p>
              </div>
              <FileText className="w-8 h-8 text-purple-400" />
            </div>
          </CardContent>
        </Card>

        <Card className="border-none shadow-lg bg-gradient-to-br from-green-50 to-emerald-50">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-slate-500 mb-1">Modelos Ativos</p>
                <p className="text-3xl font-bold text-green-600">{estatisticas.ativos}</p>
              </div>
              <FileSignature className="w-8 h-8 text-green-400" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Lista de Modelos */}
      <ViewHeader
        searchTerm={searchTerm}
        onSearchChange={setSearchTerm}
        placeholder="Buscar modelos..."
        viewMode={viewMode}
        onViewModeChange={setViewMode}
      />

      {isLoading ? (
        <div className="text-center py-12">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600 mx-auto"></div>
          <p className="text-slate-500 mt-4">Carregando modelos...</p>
        </div>
      ) : modelosFiltrados.length === 0 ? (
        <Card className="border-none shadow-lg">
          <CardContent className="text-center py-12">
            <FileSignature className="w-16 h-16 text-slate-300 mx-auto mb-4" />
            <h3 className="text-xl font-semibold text-slate-600 mb-2">
              {searchTerm ? 'Nenhum modelo encontrado' : 'Nenhum modelo cadastrado'}
            </h3>
            <p className="text-slate-400 mb-6">
              {searchTerm ? 'Tente buscar com outros termos' : 'Crie seu primeiro modelo para começar'}
            </p>
            <Button
              onClick={() => setShowModal(true)}
              className="bg-gradient-to-r from-purple-500 to-indigo-500"
            >
              <Plus className="w-4 h-4 mr-2" />
              Criar Primeiro Modelo
            </Button>
          </CardContent>
        </Card>
      ) : viewMode === 'cards' ? (
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
          {modelosFiltrados.map((modelo) => (
            <ContratoModeloCard
              key={modelo.id}
              modelo={modelo}
              onEdit={handleEdit}
              onDelete={handleDelete}
            />
          ))}
        </div>
      ) : (
        <Card className="border-none shadow-lg overflow-hidden">
          <Table>
            <TableHeader>
              <TableRow className="bg-slate-50 hover:bg-slate-50">
                <TableHead>Modelo</TableHead>
                <TableHead>Tipo</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-right">Ações</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {modelosFiltrados.map((modelo) => (
                <TableRow key={modelo.id}>
                  <TableCell className="font-medium">
                    <div>
                      <p className="text-slate-800 font-semibold">{modelo.nome_modelo}</p>
                      <p className="text-xs text-slate-500">{modelo.titulo}</p>
                    </div>
                  </TableCell>
                  <TableCell>
                    <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-slate-100 text-slate-800">
                      {modelo.tipo_contrato || 'Geral'}
                    </span>
                  </TableCell>
                  <TableCell>
                    <div className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-medium ${modelo.ativo ? 'bg-green-100 text-green-700' : 'bg-slate-100 text-slate-700'
                      }`}>
                      {modelo.ativo ? (
                        <>
                          <CheckCircle2 className="w-3.5 h-3.5" />
                          Ativo
                        </>
                      ) : (
                        <>
                          <XCircle className="w-3.5 h-3.5" />
                          Inativo
                        </>
                      )}
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
                        <DropdownMenuItem onClick={() => handleEdit(modelo)}>
                          <Edit className="mr-2 h-4 w-4" />
                          Editar
                        </DropdownMenuItem>
                        <DropdownMenuItem
                          className="text-red-600 focus:text-red-700"
                          onClick={() => handleDelete(modelo.id)}
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
        <ContratoModeloModal
          modelo={editingModelo}
          onClose={handleClose}
        />
      )}
    </div>
  );
}