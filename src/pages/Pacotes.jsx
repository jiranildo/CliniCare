import React, { useState } from "react";
import { base44 } from "@/api/base44Client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Package,
  Plus,
  Search,
  Edit,
  Trash2,
  DollarSign,
  AlertCircle
} from "lucide-react";

import { Alert, AlertDescription } from "@/components/ui/alert";

export default function Pacotes() {
  // const [showPacoteModal, setShowPacoteModal] = useState(false);
  // const [editingPacote, setEditingPacote] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const queryClient = useQueryClient();

  const { data: pacotes = [], isLoading: loadingPacotes } = useQuery({
    queryKey: ['pacotes'],
    queryFn: () => base44.entities.PacoteServico.list('-created_date'),
  });

  const { data: contratos = [] } = useQuery({
    queryKey: ['contratos-todos'],
    queryFn: () => base44.entities.Contrato.list('-created_date'),
  });

  const deletePacote = useMutation({
    mutationFn: (id) => base44.entities.PacoteServico.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries(['pacotes']);
    },
  });

  const handleEditPacote = (pacote) => {
    // setEditingPacote(pacote);
    // setShowPacoteModal(true);
    alert("Para editar pacotes, use o módulo de Contratos.");
  };

  const handleDeletePacote = async (id) => {
    if (confirm('Tem certeza que deseja excluir este pacote?')) {
      await deletePacote.mutateAsync(id);
    }
  };

  const pacotesFiltrados = pacotes.filter(p =>
    p.nome?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    p.descricao?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  // Estatísticas baseadas em contratos
  const stats = {
    pacotesAtivos: pacotes.filter(p => p.ativo).length,
    contratosAtivos: contratos.filter(c => c.status === 'ativo').length,
    receitaMensal: contratos
      .filter(c => c.status === 'ativo' && c.forma_pagamento === 'mensal')
      .reduce((acc, c) => acc + (c.valor_mensal || 0), 0),
    totalContratos: contratos.length
  };

  return (
    <div className="p-6 md:p-8 space-y-6">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold text-slate-800 flex items-center gap-3">
            <Package className="w-8 h-8 text-cyan-600" />
            Pacotes de Serviços
          </h1>
          <p className="text-slate-500 mt-1">Gerencie pacotes de serviços</p>
        </div>
      </div>

      {/* Alerta sobre integração com Contratos */}
      <Alert className="bg-blue-50 border-blue-200">
        <AlertCircle className="h-4 w-4 text-blue-600" />
        <AlertDescription className="text-blue-800">
          <strong>ℹ️ Novo Fluxo:</strong> Os pacotes agora são gerenciados através da funcionalidade de <strong>Contratos</strong>.
          Use esta página para criar modelos de pacotes, e depois associe-os aos pacientes através de <strong>Contratos</strong>.
        </AlertDescription>
      </Alert>

      {/* Estatísticas */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <Card className="border-none shadow-lg bg-gradient-to-br from-blue-50 to-cyan-50">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-slate-600">
              Pacotes Ativos
            </CardTitle>
            <Package className="w-5 h-5 text-blue-600" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-slate-800">{stats.pacotesAtivos}</div>
          </CardContent>
        </Card>

        <Card className="border-none shadow-lg bg-gradient-to-br from-green-50 to-emerald-50">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-slate-600">
              Contratos Ativos
            </CardTitle>
            <Package className="w-5 h-5 text-green-600" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-slate-800">{stats.contratosAtivos}</div>
          </CardContent>
        </Card>

        <Card className="border-none shadow-lg bg-gradient-to-br from-purple-50 to-pink-50">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-slate-600">
              Receita Mensal
            </CardTitle>
            <DollarSign className="w-5 h-5 text-purple-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-slate-800">
              R$ {stats.receitaMensal.toFixed(2)}
            </div>
          </CardContent>
        </Card>

        <Card className="border-none shadow-lg bg-gradient-to-br from-amber-50 to-orange-50">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-slate-600">
              Total Contratos
            </CardTitle>
            <Package className="w-5 h-5 text-amber-600" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-slate-800">{stats.totalContratos}</div>
          </CardContent>
        </Card>
      </div>

      {/* Lista de Pacotes */}
      <Card className="border-none shadow-lg">
        <CardContent className="p-6">
          <div className="flex justify-between items-center mb-6">
            <div className="relative flex-1 max-w-md">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400 w-5 h-5" />
              <Input
                placeholder="Buscar pacotes..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
            <Button
              onClick={() => {
                alert("Use o módulo de Contratos para criar novos pacotes.");
              }}
              className="bg-slate-300 cursor-not-allowed"
            >
              <Plus className="w-4 h-4 mr-2" />
              Novo Pacote
            </Button>
          </div>

          {loadingPacotes ? (
            <div className="text-center py-12">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-cyan-600 mx-auto"></div>
              <p className="text-slate-500 mt-4">Carregando pacotes...</p>
            </div>
          ) : pacotesFiltrados.length === 0 ? (
            <div className="text-center py-12 bg-slate-50 rounded-lg">
              <Package className="w-16 h-16 text-slate-300 mx-auto mb-4" />
              <p className="text-slate-500 mb-4">Nenhum pacote encontrado</p>
              <Button
                onClick={() => alert("Use o módulo de Contratos.")}
                className="bg-slate-300 cursor-not-allowed"
              >
                <Plus className="w-4 h-4 mr-2" />
                Criar Primeiro Pacote
              </Button>
            </div>
          ) : (
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
              {pacotesFiltrados.map((pacote) => (
                <Card key={pacote.id} className="border-2 hover:shadow-xl transition-all">
                  <CardHeader className="pb-3">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <CardTitle className="text-lg font-bold text-slate-800 mb-1">
                          {pacote.nome}
                        </CardTitle>
                        <p className="text-sm text-slate-600 line-clamp-2">
                          {pacote.descricao}
                        </p>
                      </div>
                      <div className={`ml-2 px-2 py-1 rounded-full text-xs font-semibold ${pacote.ativo ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'
                        }`}>
                        {pacote.ativo ? 'Ativo' : 'Inativo'}
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    <div className="flex items-center justify-between py-2 border-t">
                      <span className="text-sm text-slate-600">Valor Base</span>
                      <span className="text-lg font-bold text-green-600">
                        R$ {(pacote.valor_base || 0).toFixed(2)}
                      </span>
                    </div>

                    {pacote.quantidade_consultas && (
                      <div className="flex items-center justify-between">
                        <span className="text-xs text-slate-500">Consultas</span>
                        <span className="text-sm font-semibold text-slate-700">
                          {pacote.quantidade_consultas}x
                        </span>
                      </div>
                    )}

                    {pacote.validade_dias && (
                      <div className="flex items-center justify-between">
                        <span className="text-xs text-slate-500">Validade</span>
                        <span className="text-sm font-semibold text-slate-700">
                          {pacote.validade_dias} dias
                        </span>
                      </div>
                    )}

                    {pacote.desconto_percentual > 0 && (
                      <div className="bg-green-50 px-2 py-1 rounded">
                        <span className="text-xs text-green-700 font-semibold">
                          {pacote.desconto_percentual}% de desconto
                        </span>
                      </div>
                    )}

                    <div className="flex gap-2 pt-3 border-t">
                      <Button
                        onClick={() => handleEditPacote(pacote)}
                        variant="outline"
                        size="sm"
                        className="flex-1"
                      >
                        <Edit className="w-4 h-4 mr-1" />
                        Editar
                      </Button>
                      <Button
                        onClick={() => handleDeletePacote(pacote.id)}
                        variant="outline"
                        size="sm"
                        className="text-red-600 hover:bg-red-50"
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </CardContent>
      </Card>


    </div>
  );
}