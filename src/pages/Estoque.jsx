import React, { useState } from "react";
import { base44 } from "@/api/base44Client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Package, Plus, Search, AlertTriangle, Filter } from "lucide-react";
import EstoqueModal from "@/components/estoque/EstoqueModal";
import EstoqueCard from "@/components/estoque/EstoqueCard";

export default function Estoque() {
  const [showModal, setShowModal] = useState(false);
  const [editingItem, setEditingItem] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [filtroCategoria, setFiltroCategoria] = useState('todas');
  const queryClient = useQueryClient();

  const { data: itens = [], isLoading } = useQuery({
    queryKey: ['estoque'],
    queryFn: () => base44.entities.EstoqueItem.list('-created_date'),
  });

  const deleteItem = useMutation({
    mutationFn: (id) => base44.entities.EstoqueItem.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries(['estoque']);
    },
  });

  const handleEdit = (item) => {
    setEditingItem(item);
    setShowModal(true);
  };

  const handleDelete = async (id) => {
    if (confirm('Tem certeza que deseja excluir este item?')) {
      await deleteItem.mutateAsync(id);
    }
  };

  const handleClose = () => {
    setShowModal(false);
    setEditingItem(null);
  };

  const itensFiltrados = itens.filter(i => {
    const matchSearch = i.nome?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                       i.codigo?.toLowerCase().includes(searchTerm.toLowerCase());
    const matchCategoria = filtroCategoria === 'todas' || i.categoria === filtroCategoria;
    return matchSearch && matchCategoria;
  });

  const itensEstoqueBaixo = itens.filter(i => 
    i.quantidade <= (i.estoque_minimo || 0)
  ).length;

  const valorTotal = itens.reduce((acc, i) => 
    acc + ((i.quantidade || 0) * (i.valor_unitario || 0)), 0
  );

  const categorias = [
    { value: 'todas', label: 'Todas' },
    { value: 'medicamento', label: 'Medicamentos' },
    { value: 'material_descartavel', label: 'Materiais Descartáveis' },
    { value: 'equipamento', label: 'Equipamentos' },
    { value: 'insumo', label: 'Insumos' },
    { value: 'outros', label: 'Outros' }
  ];

  return (
    <div className="p-6 md:p-8 space-y-6">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold text-slate-800 flex items-center gap-3">
            <Package className="w-8 h-8 text-cyan-600" />
            Estoque
          </h1>
          <p className="text-slate-500 mt-1">Controle de materiais e medicamentos</p>
        </div>
        <Button 
          onClick={() => setShowModal(true)}
          className="bg-gradient-to-r from-cyan-500 to-teal-500 hover:from-cyan-600 hover:to-teal-600 shadow-lg"
        >
          <Plus className="w-4 h-4 mr-2" />
          Novo Item
        </Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card className="border-none shadow-lg">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-slate-500 mb-1">Total de Itens</p>
                <p className="text-3xl font-bold text-slate-800">{itens.length}</p>
              </div>
              <div className="w-12 h-12 rounded-full bg-blue-100 flex items-center justify-center">
                <Package className="w-6 h-6 text-blue-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border-none shadow-lg">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-slate-500 mb-1">Estoque Baixo</p>
                <p className="text-3xl font-bold text-red-600">{itensEstoqueBaixo}</p>
              </div>
              <div className="w-12 h-12 rounded-full bg-red-100 flex items-center justify-center">
                <AlertTriangle className="w-6 h-6 text-red-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border-none shadow-lg">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-slate-500 mb-1">Valor Total</p>
                <p className="text-3xl font-bold text-green-600">R$ {valorTotal.toFixed(2)}</p>
              </div>
              <div className="w-12 h-12 rounded-full bg-green-100 flex items-center justify-center">
                <Package className="w-6 h-6 text-green-600" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <Card className="border-none shadow-lg">
        <CardContent className="p-6 space-y-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400 w-5 h-5" />
            <Input
              placeholder="Buscar por nome ou código..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
            />
          </div>

          <div className="flex items-center gap-2 flex-wrap">
            <Filter className="w-5 h-5 text-slate-600" />
            <span className="text-sm font-medium text-slate-600">Categoria:</span>
            {categorias.map(cat => (
              <Button
                key={cat.value}
                variant={filtroCategoria === cat.value ? "default" : "outline"}
                size="sm"
                onClick={() => setFiltroCategoria(cat.value)}
                className={filtroCategoria === cat.value ? "bg-gradient-to-r from-cyan-500 to-teal-500" : ""}
              >
                {cat.label}
              </Button>
            ))}
          </div>
        </CardContent>
      </Card>

      {isLoading ? (
        <div className="text-center py-12">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-cyan-600 mx-auto"></div>
          <p className="text-slate-500 mt-4">Carregando estoque...</p>
        </div>
      ) : itensFiltrados.length === 0 ? (
        <Card className="border-none shadow-lg">
          <CardContent className="text-center py-12">
            <Package className="w-16 h-16 text-slate-300 mx-auto mb-4" />
            <h3 className="text-xl font-semibold text-slate-600 mb-2">
              {searchTerm ? 'Nenhum item encontrado' : 'Nenhum item no estoque'}
            </h3>
            <p className="text-slate-400 mb-6">
              {searchTerm ? 'Tente buscar com outros termos' : 'Comece adicionando um novo item'}
            </p>
            {!searchTerm && (
              <Button 
                onClick={() => setShowModal(true)}
                className="bg-gradient-to-r from-cyan-500 to-teal-500 hover:from-cyan-600 hover:to-teal-600"
              >
                <Plus className="w-4 h-4 mr-2" />
                Adicionar Item
              </Button>
            )}
          </CardContent>
        </Card>
      ) : (
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
          {itensFiltrados.map((item) => (
            <EstoqueCard
              key={item.id}
              item={item}
              onEdit={handleEdit}
              onDelete={handleDelete}
            />
          ))}
        </div>
      )}

      {showModal && (
        <EstoqueModal
          item={editingItem}
          onClose={handleClose}
        />
      )}
    </div>
  );
}