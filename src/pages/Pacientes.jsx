import React, { useState } from "react";
import { base44 } from "@/api/base44Client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Users, Plus, Search, Grid3x3, List } from "lucide-react";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import PacienteModal from "@/components/pacientes/PacienteModal";
import PacienteCard from "@/components/pacientes/PacienteCard";
import PacienteLista from "@/components/pacientes/PacienteLista";

export default function Pacientes() {
  const [showModal, setShowModal] = useState(false);
  const [editingPaciente, setEditingPaciente] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [visualizacao, setVisualizacao] = useState('cards'); // 'cards' ou 'lista'
  const queryClient = useQueryClient();

  const { data: pacientes = [], isLoading } = useQuery({
    queryKey: ['pacientes'],
    queryFn: () => base44.entities.Paciente.list('-created_date'),
  });

  const deletePaciente = useMutation({
    mutationFn: (id) => base44.entities.Paciente.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries(['pacientes']);
    },
  });

  const handleEdit = (paciente) => {
    setEditingPaciente(paciente);
    setShowModal(true);
  };

  const handleDelete = async (id) => {
    if (confirm('Tem certeza que deseja excluir este paciente?')) {
      await deletePaciente.mutateAsync(id);
    }
  };

  const handleClose = () => {
    setShowModal(false);
    setEditingPaciente(null);
  };

  const pacientesFiltrados = pacientes.filter(p =>
    p.nome_completo?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    p.cpf?.includes(searchTerm) ||
    p.telefone?.includes(searchTerm)
  );

  return (
    <div className="p-6 md:p-8 space-y-6">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold text-slate-800 flex items-center gap-3">
            <Users className="w-8 h-8 text-cyan-600" />
            Pacientes
          </h1>
          <p className="text-slate-500 mt-1">Gerencie o cadastro de pacientes</p>
        </div>
        <Button 
          onClick={() => setShowModal(true)}
          className="bg-gradient-to-r from-cyan-500 to-teal-500 hover:from-cyan-600 hover:to-teal-600 shadow-lg"
        >
          <Plus className="w-4 h-4 mr-2" />
          Novo Paciente
        </Button>
      </div>

      <Card className="border-none shadow-lg">
        <CardContent className="p-6">
          <div className="flex flex-col md:flex-row gap-4 justify-between items-start md:items-center">
            <div className="relative flex-1 max-w-md w-full">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400 w-5 h-5" />
              <Input
                placeholder="Buscar por nome, CPF ou telefone..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
            
            <Tabs value={visualizacao} onValueChange={setVisualizacao}>
              <TabsList className="bg-slate-100">
                <TabsTrigger value="cards" className="gap-2">
                  <Grid3x3 className="w-4 h-4" />
                  Cards
                </TabsTrigger>
                <TabsTrigger value="lista" className="gap-2">
                  <List className="w-4 h-4" />
                  Lista
                </TabsTrigger>
              </TabsList>
            </Tabs>
          </div>
        </CardContent>
      </Card>

      {isLoading ? (
        <div className="text-center py-12">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-cyan-600 mx-auto"></div>
          <p className="text-slate-500 mt-4">Carregando pacientes...</p>
        </div>
      ) : pacientesFiltrados.length === 0 ? (
        <Card className="border-none shadow-lg">
          <CardContent className="text-center py-12">
            <Users className="w-16 h-16 text-slate-300 mx-auto mb-4" />
            <h3 className="text-xl font-semibold text-slate-600 mb-2">
              {searchTerm ? 'Nenhum paciente encontrado' : 'Nenhum paciente cadastrado'}
            </h3>
            <p className="text-slate-400 mb-6">
              {searchTerm ? 'Tente buscar com outros termos' : 'Comece adicionando um novo paciente'}
            </p>
            {!searchTerm && (
              <Button 
                onClick={() => setShowModal(true)}
                className="bg-gradient-to-r from-cyan-500 to-teal-500 hover:from-cyan-600 hover:to-teal-600"
              >
                <Plus className="w-4 h-4 mr-2" />
                Adicionar Paciente
              </Button>
            )}
          </CardContent>
        </Card>
      ) : (
        <>
          {visualizacao === 'cards' ? (
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
              {pacientesFiltrados.map((paciente) => (
                <PacienteCard
                  key={paciente.id}
                  paciente={paciente}
                  onEdit={handleEdit}
                  onDelete={handleDelete}
                />
              ))}
            </div>
          ) : (
            <PacienteLista
              pacientes={pacientesFiltrados}
              onEdit={handleEdit}
              onDelete={handleDelete}
            />
          )}
        </>
      )}

      {showModal && (
        <PacienteModal
          paciente={editingPaciente}
          onClose={handleClose}
        />
      )}
    </div>
  );
}