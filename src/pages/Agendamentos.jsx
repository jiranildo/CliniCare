import React, { useState } from "react";
import { base44 } from "@/api/base44Client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Calendar, Plus, Filter, LayoutGrid, List, X, Search, Users } from "lucide-react";
import { format, parseISO, isWithinInterval } from "date-fns";
import { ptBR } from "date-fns/locale";
import AgendamentoModal from "@/components/agendamentos/AgendamentoModal";
import AgendamentoCard from "@/components/agendamentos/AgendamentoCard";
import AgendamentoLista from "@/components/agendamentos/AgendamentoLista";
import AgendamentoPacienteCard from "@/components/agendamentos/AgendamentoPacienteCard";

export default function Agendamentos() {
  const [showModal, setShowModal] = useState(false);
  const [editingAgendamento, setEditingAgendamento] = useState(null);
  const [visualizacao, setVisualizacao] = useState('pacientes'); // 'cards', 'lista', 'pacientes'
  const [mostrarFiltros, setMostrarFiltros] = useState(false);
  const [filtros, setFiltros] = useState({
    status: 'todos',
    paciente_id: 'todos',
    profissional_id: 'todos',
    tipo_consulta: 'todos',
    data_inicio: '',
    data_fim: '',
    busca: ''
  });
  const queryClient = useQueryClient();

  const { data: agendamentos = [], isLoading } = useQuery({
    queryKey: ['agendamentos'],
    queryFn: () => base44.entities.Agendamento.list('-data'),
  });

  const { data: pacientes = [] } = useQuery({
    queryKey: ['pacientes'],
    queryFn: () => base44.entities.Paciente.list(),
  });

  const { data: profissionais = [] } = useQuery({
    queryKey: ['profissionais'],
    queryFn: async () => {
      try {
        const users = await base44.entities.User.list();
        return users.filter(u => u.role === 'profissional_saude' || u.role === 'admin');
      } catch (error) {
        console.error("Error loading professionals:", error);
        return [];
      }
    },
  });

  const deleteAgendamento = useMutation({
    mutationFn: (id) => base44.entities.Agendamento.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries(['agendamentos']);
    },
  });

  const handleEdit = (agendamento) => {
    setEditingAgendamento(agendamento);
    setShowModal(true);
  };

  const handleDelete = async (id) => {
    if (confirm('Tem certeza que deseja excluir este agendamento?')) {
      await deleteAgendamento.mutateAsync(id);
    }
  };

  const handleClose = () => {
    setShowModal(false);
    setEditingAgendamento(null);
  };

  const limparFiltros = () => {
    setFiltros({
      status: 'todos',
      paciente_id: 'todos',
      profissional_id: 'todos',
      tipo_consulta: 'todos',
      data_inicio: '',
      data_fim: '',
      busca: ''
    });
  };

  const agendamentosFiltrados = agendamentos.filter(ag => {
    // Filtro por status
    if (filtros.status !== 'todos' && ag.status !== filtros.status) return false;
    
    // Filtro por paciente
    if (filtros.paciente_id !== 'todos' && ag.paciente_id !== filtros.paciente_id) return false;
    
    // Filtro por profissional
    if (filtros.profissional_id !== 'todos' && ag.profissional_id !== filtros.profissional_id) return false;
    
    // Filtro por tipo de consulta
    if (filtros.tipo_consulta !== 'todos' && ag.tipo_consulta !== filtros.tipo_consulta) return false;
    
    // Filtro por período de datas
    if (filtros.data_inicio && filtros.data_fim) {
      try {
        const dataAgendamento = parseISO(ag.data);
        const dataInicio = parseISO(filtros.data_inicio);
        const dataFim = parseISO(filtros.data_fim);
        if (!isWithinInterval(dataAgendamento, { start: dataInicio, end: dataFim })) return false;
      } catch (error) {
        console.error("Erro ao filtrar por data:", error);
      }
    } else if (filtros.data_inicio) {
      try {
        const dataAgendamento = parseISO(ag.data);
        const dataInicio = parseISO(filtros.data_inicio);
        if (dataAgendamento < dataInicio) return false;
      } catch (error) {
        console.error("Erro ao filtrar por data:", error);
      }
    } else if (filtros.data_fim) {
      try {
        const dataAgendamento = parseISO(ag.data);
        const dataFim = parseISO(filtros.data_fim);
        if (dataAgendamento > dataFim) return false;
      } catch (error) {
        console.error("Erro ao filtrar por data:", error);
      }
    }
    
    // Filtro por busca (nome do paciente ou profissional)
    if (filtros.busca) {
      const busca = filtros.busca.toLowerCase();
      const matchPaciente = ag.paciente_nome?.toLowerCase().includes(busca);
      const matchProfissional = ag.profissional_nome?.toLowerCase().includes(busca);
      const matchObservacoes = ag.observacoes?.toLowerCase().includes(busca);
      if (!matchPaciente && !matchProfissional && !matchObservacoes) return false;
    }
    
    return true;
  });

  // Agrupar agendamentos por paciente
  const agendamentosPorPaciente = agendamentosFiltrados.reduce((acc, ag) => {
    if (!acc[ag.paciente_id]) {
      acc[ag.paciente_id] = {
        paciente: {
          id: ag.paciente_id,
          nome: ag.paciente_nome
        },
        agendamentos: []
      };
    }
    acc[ag.paciente_id].agendamentos.push(ag);
    return acc;
  }, {});

  const statusOptions = [
    { value: 'todos', label: 'Todos' },
    { value: 'agendado', label: 'Agendado' },
    { value: 'confirmado', label: 'Confirmado' },
    { value: 'concluido', label: 'Concluído' },
    { value: 'cancelado', label: 'Cancelado' },
    { value: 'faltou', label: 'Faltou' }
  ];

  const tipoConsultaOptions = [
    { value: 'todos', label: 'Todos' },
    { value: 'primeira_vez', label: 'Primeira Vez' },
    { value: 'retorno', label: 'Retorno' },
    { value: 'exame', label: 'Exame' },
    { value: 'procedimento', label: 'Procedimento' }
  ];

  const filtrosAtivos = Object.entries(filtros).filter(([key, value]) => {
    if (key === 'busca') return value !== '';
    if (key === 'data_inicio' || key === 'data_fim') return value !== '';
    return value !== 'todos';
  }).length;

  return (
    <div className="p-6 md:p-8 space-y-6">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold text-slate-800 flex items-center gap-3">
            <Calendar className="w-8 h-8 text-cyan-600" />
            Agendamentos
          </h1>
          <p className="text-slate-500 mt-1">Gerencie as consultas e agendamentos</p>
        </div>
        <div className="flex gap-2">
          <div className="flex gap-1 bg-slate-100 p-1 rounded-lg">
            <Button
              variant={visualizacao === 'pacientes' ? 'default' : 'ghost'}
              size="sm"
              onClick={() => setVisualizacao('pacientes')}
              className={visualizacao === 'pacientes' ? 'bg-white shadow-sm' : ''}
              title="Por Paciente"
            >
              <Users className="w-4 h-4" />
            </Button>
            <Button
              variant={visualizacao === 'cards' ? 'default' : 'ghost'}
              size="sm"
              onClick={() => setVisualizacao('cards')}
              className={visualizacao === 'cards' ? 'bg-white shadow-sm' : ''}
              title="Cards"
            >
              <LayoutGrid className="w-4 h-4" />
            </Button>
            <Button
              variant={visualizacao === 'lista' ? 'default' : 'ghost'}
              size="sm"
              onClick={() => setVisualizacao('lista')}
              className={visualizacao === 'lista' ? 'bg-white shadow-sm' : ''}
              title="Lista"
            >
              <List className="w-4 h-4" />
            </Button>
          </div>
          <Button 
            onClick={() => setShowModal(true)}
            className="bg-gradient-to-r from-cyan-500 to-teal-500 hover:from-cyan-600 hover:to-teal-600 shadow-lg"
          >
            <Plus className="w-4 h-4 mr-2" />
            Novo Agendamento
          </Button>
        </div>
      </div>

      <Card className="border-none shadow-lg">
        <CardHeader>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Filter className="w-5 h-5 text-slate-600" />
              <span className="text-sm font-medium text-slate-600">Filtros</span>
              {filtrosAtivos > 0 && (
                <span className="px-2 py-0.5 bg-cyan-100 text-cyan-700 rounded-full text-xs font-semibold">
                  {filtrosAtivos}
                </span>
              )}
            </div>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setMostrarFiltros(!mostrarFiltros)}
            >
              {mostrarFiltros ? 'Ocultar' : 'Mostrar'} Filtros
            </Button>
          </div>
        </CardHeader>
        
        {mostrarFiltros && (
          <CardContent className="space-y-4 border-t pt-4">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              <div className="space-y-2">
                <Label>Buscar</Label>
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400 w-4 h-4" />
                  <Input
                    placeholder="Paciente, profissional..."
                    value={filtros.busca}
                    onChange={(e) => setFiltros({...filtros, busca: e.target.value})}
                    className="pl-10"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label>Status</Label>
                <Select 
                  value={filtros.status} 
                  onValueChange={(val) => setFiltros({...filtros, status: val})}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {statusOptions.map(opt => (
                      <SelectItem key={opt.value} value={opt.value}>
                        {opt.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label>Paciente</Label>
                <Select 
                  value={filtros.paciente_id} 
                  onValueChange={(val) => setFiltros({...filtros, paciente_id: val})}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="todos">Todos os Pacientes</SelectItem>
                    {pacientes.map(p => (
                      <SelectItem key={p.id} value={p.id}>
                        {p.nome_completo}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label>Profissional</Label>
                <Select 
                  value={filtros.profissional_id} 
                  onValueChange={(val) => setFiltros({...filtros, profissional_id: val})}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="todos">Todos os Profissionais</SelectItem>
                    {profissionais.map(p => (
                      <SelectItem key={p.id} value={p.id}>
                        {p.full_name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label>Tipo de Consulta</Label>
                <Select 
                  value={filtros.tipo_consulta} 
                  onValueChange={(val) => setFiltros({...filtros, tipo_consulta: val})}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {tipoConsultaOptions.map(opt => (
                      <SelectItem key={opt.value} value={opt.value}>
                        {opt.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label>Data Início</Label>
                <Input
                  type="date"
                  value={filtros.data_inicio}
                  onChange={(e) => setFiltros({...filtros, data_inicio: e.target.value})}
                />
              </div>

              <div className="space-y-2">
                <Label>Data Fim</Label>
                <Input
                  type="date"
                  value={filtros.data_fim}
                  onChange={(e) => setFiltros({...filtros, data_fim: e.target.value})}
                />
              </div>
            </div>

            {filtrosAtivos > 0 && (
              <div className="flex justify-end">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={limparFiltros}
                  className="gap-2"
                >
                  <X className="w-4 h-4" />
                  Limpar Filtros
                </Button>
              </div>
            )}
          </CardContent>
        )}
      </Card>

      <div className="flex items-center justify-between">
        <p className="text-sm text-slate-600">
          {visualizacao === 'pacientes' ? (
            <>
              Mostrando <span className="font-semibold">{Object.keys(agendamentosPorPaciente).length}</span> paciente(s) com{' '}
              <span className="font-semibold">{agendamentosFiltrados.length}</span> agendamento(s)
            </>
          ) : (
            <>
              Mostrando <span className="font-semibold">{agendamentosFiltrados.length}</span> de{' '}
              <span className="font-semibold">{agendamentos.length}</span> agendamentos
            </>
          )}
        </p>
      </div>

      {isLoading ? (
        <div className="text-center py-12">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-cyan-600 mx-auto"></div>
          <p className="text-slate-500 mt-4">Carregando agendamentos...</p>
        </div>
      ) : agendamentosFiltrados.length === 0 ? (
        <Card className="border-none shadow-lg">
          <CardContent className="text-center py-12">
            <Calendar className="w-16 h-16 text-slate-300 mx-auto mb-4" />
            <h3 className="text-xl font-semibold text-slate-600 mb-2">
              Nenhum agendamento encontrado
            </h3>
            <p className="text-slate-400 mb-6">
              {filtrosAtivos > 0 ? 'Tente ajustar os filtros' : 'Comece criando um novo agendamento'}
            </p>
            {filtrosAtivos > 0 ? (
              <Button 
                onClick={limparFiltros}
                variant="outline"
              >
                <X className="w-4 h-4 mr-2" />
                Limpar Filtros
              </Button>
            ) : (
              <Button 
                onClick={() => setShowModal(true)}
                className="bg-gradient-to-r from-cyan-500 to-teal-500 hover:from-cyan-600 hover:to-teal-600"
              >
                <Plus className="w-4 h-4 mr-2" />
                Criar Agendamento
              </Button>
            )}
          </CardContent>
        </Card>
      ) : visualizacao === 'pacientes' ? (
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
          {Object.values(agendamentosPorPaciente).map(({ paciente, agendamentos }) => (
            <AgendamentoPacienteCard
              key={paciente.id}
              paciente={paciente}
              agendamentos={agendamentos}
              onEdit={handleEdit}
              onDelete={handleDelete}
            />
          ))}
        </div>
      ) : visualizacao === 'cards' ? (
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
          {agendamentosFiltrados.map((agendamento) => (
            <AgendamentoCard
              key={agendamento.id}
              agendamento={agendamento}
              onEdit={handleEdit}
              onDelete={handleDelete}
            />
          ))}
        </div>
      ) : (
        <AgendamentoLista
          agendamentos={agendamentosFiltrados}
          onEdit={handleEdit}
          onDelete={handleDelete}
        />
      )}

      {showModal && (
        <AgendamentoModal
          agendamento={editingAgendamento}
          pacientes={pacientes}
          profissionais={profissionais}
          onClose={handleClose}
        />
      )}
    </div>
  );
}