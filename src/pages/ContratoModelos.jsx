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
  FileSignature
} from "lucide-react";
import ContratoModeloModal from "@/components/contratos/ContratoModeloModal";
import ContratoModeloCard from "@/components/contratos/ContratoModeloCard";

export default function ContratoModelos() {
  const [showModal, setShowModal] = useState(false);
  const [editingModelo, setEditingModelo] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
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
      <Card className="border-none shadow-lg">
        <CardContent className="p-6">
          <div className="flex flex-col md:flex-row gap-4 mb-6">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400 w-5 h-5" />
              <Input
                placeholder="Buscar modelos..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
          </div>

          {isLoading ? (
            <div className="text-center py-12">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600 mx-auto"></div>
              <p className="text-slate-500 mt-4">Carregando modelos...</p>
            </div>
          ) : modelosFiltrados.length === 0 ? (
            <div className="text-center py-12 bg-slate-50 rounded-lg">
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
            </div>
          ) : (
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
          )}
        </CardContent>
      </Card>

      {showModal && (
        <ContratoModeloModal
          modelo={editingModelo}
          onClose={handleClose}
        />
      )}
    </div>
  );
}