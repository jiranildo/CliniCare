import React, { useState, useEffect } from "react";
import { useViewPreference } from "@/hooks/useViewPreference";
import { base44 } from "@/api/base44Client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { UserCog, Plus, Users, Shield, AlertTriangle, MoreVertical, Edit, Trash2 } from "lucide-react";
import ViewHeader from "@/components/common/ViewHeader";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Alert, AlertDescription } from "@/components/ui/alert";
import ProfissionalModal from "@/components/profissionais/ProfissionalModal";
import ProfissionalCard from "@/components/profissionais/ProfissionalCard";

export default function Profissionais() {
  const [showModal, setShowModal] = useState(false);
  const [editingProfissional, setEditingProfissional] = useState(null);
  const [deletingProfissional, setDeletingProfissional] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [viewMode, setViewMode] = useViewPreference('profissionais-view-mode', 'cards');
  const [currentUser, setCurrentUser] = useState(null);
  const queryClient = useQueryClient();

  useEffect(() => {
    const loadUser = async () => {
      try {
        const userData = await base44.auth.me();
        setCurrentUser(userData);
      } catch (error) {
        console.error("Error loading user:", error);
      }
    };
    loadUser();
  }, []);

  const { data: profissionais = [], isLoading } = useQuery({
    queryKey: ['profissionais'],
    queryFn: async () => {
      try {
        const users = await base44.entities.User.list('-created_date');
        return users.filter(u => ['admin', 'user', 'profissional', 'secretaria', 'paciente'].includes(u.role));
      } catch (error) {
        console.error("Error loading professionals:", error);
        return [];
      }
    },
  });

  const deleteProfissional = useMutation({
    mutationFn: async (id) => {
      return await base44.entities.User.delete(id);
    },
    onSuccess: () => {
      queryClient.invalidateQueries(['profissionais']);
      setDeletingProfissional(null);
    },
    onError: (error) => {
      console.error("Error deleting professional:", error);
      alert('Erro ao excluir profissional. Verifique se não há dados associados.');
      setDeletingProfissional(null);
    }
  });

  const handleEdit = (profissional) => {
    setEditingProfissional(profissional);
    setShowModal(true);
  };

  const handleDeleteRequest = (profissional) => {
    if (profissional.id === currentUser?.id) {
      alert('Você não pode excluir seu próprio usuário.');
      return;
    }
    setDeletingProfissional(profissional);
  };

  const handleConfirmDelete = async () => {
    if (deletingProfissional) {
      await deleteProfissional.mutateAsync(deletingProfissional.id);
    }
  };

  const handleClose = () => {
    setShowModal(false);
    setEditingProfissional(null);
  };

  const handleNovoProfissional = () => {
    if (currentUser?.role !== 'admin') {
      alert('Apenas administradores podem cadastrar novos profissionais.');
      return;
    }
    setEditingProfissional(null);
    setShowModal(true);
  };

  const profissionaisFiltrados = profissionais.filter(p =>
    p.full_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    p.especialidade?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    p.registro_profissional?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    p.email?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const estatisticas = {
    total: profissionais.length,
    profissionais: profissionais.filter(p =>
      p.tipo_profissional === 'profissional_saude' ||
      (!p.tipo_profissional && p.especialidade) // Para compatibilidade com dados antigos
    ).length,
    admins: profissionais.filter(p => p.role === 'admin').length,
    secretarias: profissionais.filter(p => p.tipo_profissional === 'secretaria').length
  };

  const isAdmin = currentUser?.role === 'admin';

  return (
    <div className="p-6 md:p-8 space-y-6">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold text-slate-800 flex items-center gap-3">
            <UserCog className="w-8 h-8 text-cyan-600" />
            Profissionais
          </h1>
          <p className="text-slate-500 mt-1">Gerencie os profissionais de saúde</p>
          {isAdmin && (
            <div className="flex items-center gap-2 mt-2 text-sm text-purple-600">
              <Shield className="w-4 h-4" />
              <span className="font-semibold">Modo Administrador</span>
            </div>
          )}
        </div>
        <Button
          onClick={handleNovoProfissional}
          className="bg-gradient-to-r from-cyan-500 to-teal-500 hover:from-cyan-600 hover:to-teal-600 shadow-lg"
        >
          <Plus className="w-4 h-4 mr-2" />
          Novo Profissional
        </Button>
      </div>

      {isAdmin && (
        <Alert className="bg-green-50 border-green-200">
          <Shield className="h-4 w-4 text-green-600" />
          <AlertDescription className="text-green-800">
            <strong>✅ Cadastro Direto Habilitado</strong>
            <p className="text-sm mt-1">
              Como administrador, você pode cadastrar novos profissionais diretamente no sistema,
              sem necessidade de enviar convite por email. O profissional terá acesso imediato após o cadastro.
            </p>
          </AlertDescription>
        </Alert>
      )}

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card className="border-none shadow-lg">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-slate-500 mb-1">Total</p>
                <p className="text-3xl font-bold text-slate-800">{estatisticas.total}</p>
              </div>
              <div className="w-12 h-12 rounded-full bg-blue-100 flex items-center justify-center">
                <Users className="w-6 h-6 text-blue-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border-none shadow-lg">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-slate-500 mb-1">Profissionais</p>
                <p className="text-3xl font-bold text-cyan-600">{estatisticas.profissionais}</p>
              </div>
              <div className="w-12 h-12 rounded-full bg-cyan-100 flex items-center justify-center">
                <UserCog className="w-6 h-6 text-cyan-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border-none shadow-lg">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-slate-500 mb-1">Administradores</p>
                <p className="text-3xl font-bold text-purple-600">{estatisticas.admins}</p>
              </div>
              <div className="w-12 h-12 rounded-full bg-purple-100 flex items-center justify-center">
                <Shield className="w-6 h-6 text-purple-600" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <ViewHeader
        searchTerm={searchTerm}
        onSearchChange={setSearchTerm}
        placeholder="Buscar por nome, especialidade, registro ou email..."
        viewMode={viewMode}
        onViewModeChange={setViewMode}
      />

      {
        isLoading ? (
          <div className="text-center py-12">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-cyan-600 mx-auto"></div>
            <p className="text-slate-500 mt-4">Carregando profissionais...</p>
          </div>
        ) : profissionaisFiltrados.length === 0 ? (
          <Card className="border-none shadow-lg">
            <CardContent className="text-center py-12">
              <UserCog className="w-16 h-16 text-slate-300 mx-auto mb-4" />
              <h3 className="text-xl font-semibold text-slate-600 mb-2">
                {searchTerm ? 'Nenhum profissional encontrado' : 'Nenhum profissional cadastrado'}
              </h3>
              <p className="text-slate-400 mb-6">
                {searchTerm ? 'Tente buscar com outros termos' : 'Cadastre o primeiro profissional do sistema'}
              </p>
              {isAdmin && !searchTerm && (
                <Button
                  onClick={handleNovoProfissional}
                  className="bg-gradient-to-r from-cyan-500 to-teal-500"
                >
                  <Plus className="w-4 h-4 mr-2" />
                  Cadastrar Primeiro Profissional
                </Button>
              )}
            </CardContent>
          </Card>
        ) : viewMode === 'cards' ? (
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {profissionaisFiltrados.map((profissional) => (
              <ProfissionalCard
                key={profissional.id}
                profissional={profissional}
                onEdit={handleEdit}
                onDelete={isAdmin ? handleDeleteRequest : undefined}
                isCurrentUser={profissional.id === currentUser?.id}
              />
            ))}
          </div>
        ) : (
          <Card className="border-none shadow-lg overflow-hidden">
            <Table>
              <TableHeader>
                <TableRow className="bg-slate-50 hover:bg-slate-50">
                  <TableHead className="w-[300px]">Profissional</TableHead>
                  <TableHead>Especialidade</TableHead>
                  <TableHead>Registro</TableHead>
                  <TableHead>Contato</TableHead>
                  <TableHead className="text-right">Ações</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {profissionaisFiltrados.map((profissional) => (
                  <TableRow key={profissional.id}>
                    <TableCell className="font-medium">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-full bg-cyan-100 flex items-center justify-center text-cyan-700 font-bold overflow-hidden">
                          {profissional.avatar_url ? (
                            <img src={profissional.avatar_url} alt={profissional.full_name} className="w-full h-full object-cover" />
                          ) : (
                            profissional.full_name?.substring(0, 2).toUpperCase()
                          )}
                        </div>
                        <div>
                          <p className="text-slate-800 font-semibold">{profissional.full_name}</p>
                          {profissional.tipo_profissional && (
                            <p className="text-xs text-slate-500 capitalize">{profissional.tipo_profissional.replace('_', ' ')}</p>
                          )}
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>{profissional.especialidade || '-'}</TableCell>
                    <TableCell>{profissional.registro_profissional || '-'}</TableCell>
                    <TableCell>
                      <div className="text-sm">
                        <p>{profissional.email}</p>
                        <p className="text-slate-500">{profissional.telefone || '-'}</p>
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
                          <DropdownMenuItem onClick={() => handleEdit(profissional)}>
                            <Edit className="mr-2 h-4 w-4" />
                            Editar
                          </DropdownMenuItem>
                          {isAdmin && profissional.id !== currentUser?.id && (
                            <>
                              <DropdownMenuSeparator />
                              <DropdownMenuItem
                                className="text-red-600 focus:text-red-700"
                                onClick={() => handleDeleteRequest(profissional)}
                              >
                                <Trash2 className="mr-2 h-4 w-4" />
                                Excluir
                              </DropdownMenuItem>
                            </>
                          )}
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </Card>
        )
      }

      {
        showModal && (
          <ProfissionalModal
            profissional={editingProfissional}
            onClose={handleClose}
          />
        )
      }

      <AlertDialog open={!!deletingProfissional} onOpenChange={() => setDeletingProfissional(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle className="flex items-center gap-2 text-red-600">
              <AlertTriangle className="w-5 h-5" />
              Confirmar Exclusão
            </AlertDialogTitle>
            <AlertDialogDescription>
              Tem certeza que deseja excluir o profissional <strong>{deletingProfissional?.full_name}</strong>?
              <br /><br />
              <span className="text-red-600 font-semibold">
                ⚠️ Esta ação não pode ser desfeita!
              </span>
              <br /><br />
              Todos os dados associados a este profissional permanecerão no sistema, mas o acesso será removido.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleConfirmDelete}
              className="bg-red-600 hover:bg-red-700"
            >
              Excluir Profissional
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div >
  );
}