import React, { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { FileText, Search, Users, User, ClipboardList, Activity, Sparkles } from "lucide-react";
import ProntuarioFichaPaciente from "@/components/prontuarios/ProntuarioFichaPaciente";
import ProntuarioAnamneseTab from "@/components/prontuarios/ProntuarioAnamneseTab";
import ProntuarioEvolucoesTab from "@/components/prontuarios/ProntuarioEvolucoesTab";
import ProntuarioRelatoriosTab from "@/components/prontuarios/ProntuarioRelatoriosTab";

export default function Prontuarios() {
  const [searchTerm, setSearchTerm] = useState('');
  const [pacienteSelecionado, setPacienteSelecionado] = useState(null);
  const [agendamentoInicial, setAgendamentoInicial] = useState(null);

  const { data: pacientes = [], isLoading } = useQuery({
    queryKey: ['pacientes'],
    queryFn: () => base44.entities.Paciente.list(),
  });

  const { data: agendamentos = [] } = useQuery({
    queryKey: ['agendamentos'],
    queryFn: () => base44.entities.Agendamento.list('-data'),
  });

  const { data: anamneses = [] } = useQuery({
    queryKey: ['anamneses'],
    queryFn: () => base44.entities.Anamnese.list('-data_anamnese'),
    enabled: !!pacienteSelecionado,
  });

  const { data: evolucoes = [] } = useQuery({
    queryKey: ['evolucoes'],
    queryFn: () => base44.entities.Evolucao.list('-data_atendimento'),
    enabled: !!pacienteSelecionado,
  });

  // Detectar parâmetros da URL e selecionar paciente automaticamente
  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    const pacienteId = urlParams.get('paciente_id');
    const agendamentoId = urlParams.get('agendamento_id');

    if (pacienteId && pacientes.length > 0) {
      const paciente = pacientes.find(p => p.id === pacienteId);
      if (paciente) {
        setPacienteSelecionado(paciente);

        // Se tem agendamento_id, buscar o agendamento
        if (agendamentoId && agendamentos.length > 0) {
          const agendamento = agendamentos.find(a => a.id === agendamentoId);
          if (agendamento) {
            setAgendamentoInicial(agendamento);
          }
        }
      }
    }
  }, [pacientes, agendamentos]);

  const pacientesFiltrados = pacientes.filter(p =>
    p.nome_completo?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    p.cpf?.includes(searchTerm)
  );

  // Filtrar anamneses e evoluções do paciente selecionado
  const anamnesesDoPaciente = pacienteSelecionado
    ? anamneses.filter(a => a.paciente_id === pacienteSelecionado.id)
    : [];

  const evolucoesDoPaciente = pacienteSelecionado
    ? evolucoes.filter(e => e.paciente_id === pacienteSelecionado.id)
    : [];

  return (
    <div className="p-6 md:p-8 space-y-6">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold text-slate-800 flex items-center gap-3">
            <FileText className="w-8 h-8 text-cyan-600" />
            Prontuários
          </h1>
          <p className="text-slate-500 mt-1">Prontuário completo dos pacientes</p>
        </div>
      </div>

      <div className="grid lg:grid-cols-4 gap-6">
        {/* Lista de Pacientes */}
        <div className="lg:col-span-1">
          <Card className="border-none shadow-lg sticky top-6">
            <CardContent className="p-6">
              <div className="relative mb-4">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400 w-4 h-4" />
                <Input
                  placeholder="Buscar paciente..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>

              {isLoading ? (
                <div className="text-center py-8">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-cyan-600 mx-auto"></div>
                </div>
              ) : pacientesFiltrados.length === 0 ? (
                <div className="text-center py-8 text-slate-400">
                  <Users className="w-12 h-12 mx-auto mb-2 opacity-50" />
                  <p className="text-sm">
                    {searchTerm ? 'Nenhum paciente encontrado' : 'Nenhum paciente cadastrado'}
                  </p>
                </div>
              ) : (
                <div className="space-y-2 max-h-[calc(100vh-300px)] overflow-y-auto">
                  {pacientesFiltrados.map((paciente) => (
                    <button
                      key={paciente.id}
                      onClick={() => {
                        setPacienteSelecionado(paciente);
                        setAgendamentoInicial(null);
                      }}
                      className={`w-full text-left p-3 rounded-lg transition-all ${pacienteSelecionado?.id === paciente.id
                        ? 'bg-gradient-to-r from-cyan-500 to-teal-500 text-white shadow-lg'
                        : 'bg-slate-50 hover:bg-slate-100 text-slate-800'
                        }`}
                    >
                      <div className="flex items-center gap-3">
                        {paciente.foto_url ? (
                          <img
                            src={paciente.foto_url}
                            alt={paciente.nome_completo}
                            className="w-10 h-10 rounded-full object-cover border border-white shadow-sm flex-shrink-0"
                          />
                        ) : (
                          <div className={`w-10 h-10 rounded-full flex items-center justify-center font-bold text-sm flex-shrink-0 ${pacienteSelecionado?.id === paciente.id
                            ? 'bg-white text-cyan-600'
                            : 'bg-gradient-to-br from-cyan-500 to-teal-500 text-white'
                            }`}>
                            {paciente.nome_completo?.charAt(0).toUpperCase()}
                          </div>
                        )}
                        <div className="flex-1 min-w-0">
                          <p className="font-semibold truncate text-sm">
                            {paciente.nome_completo}
                          </p>
                          {paciente.cpf && (
                            <p className={`text-xs truncate ${pacienteSelecionado?.id === paciente.id
                              ? 'text-white/80'
                              : 'text-slate-500'
                              }`}>
                              CPF: {paciente.cpf}
                            </p>
                          )}
                        </div>
                      </div>
                    </button>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Área de Prontuário */}
        <div className="lg:col-span-3">
          {!pacienteSelecionado ? (
            <Card className="border-none shadow-lg">
              <CardContent className="text-center py-20">
                <FileText className="w-20 h-20 text-slate-300 mx-auto mb-4" />
                <h3 className="text-xl font-semibold text-slate-600 mb-2">
                  Selecione um Paciente
                </h3>
                <p className="text-slate-400">
                  Escolha um paciente na lista ao lado para visualizar seu prontuário
                </p>
              </CardContent>
            </Card>
          ) : (
            <Card className="border-none shadow-lg">
              <CardContent className="p-6">
                {/* Cabeçalho do Prontuário */}
                <div className="mb-6 pb-6 border-b">
                  <div className="flex items-start gap-4">
                    {pacienteSelecionado.foto_url ? (
                      <img
                        src={pacienteSelecionado.foto_url}
                        alt={pacienteSelecionado.nome_completo}
                        className="w-16 h-16 rounded-full object-cover border-4 border-white shadow-lg"
                      />
                    ) : (
                      <div className="w-16 h-16 rounded-full bg-gradient-to-br from-cyan-500 to-teal-500 flex items-center justify-center text-white font-bold text-2xl shadow-lg">
                        {pacienteSelecionado.nome_completo?.charAt(0).toUpperCase()}
                      </div>
                    )}
                    <div className="flex-1">
                      <h2 className="text-2xl font-bold text-slate-800 mb-1">
                        {pacienteSelecionado.nome_completo}
                      </h2>
                      <div className="flex flex-wrap gap-3 text-sm text-slate-600">
                        {pacienteSelecionado.cpf && (
                          <span>CPF: {pacienteSelecionado.cpf}</span>
                        )}
                        {pacienteSelecionado.data_nascimento && (
                          <span>• Nascimento: {new Date(pacienteSelecionado.data_nascimento).toLocaleDateString('pt-BR')}</span>
                        )}
                        {pacienteSelecionado.telefone && (
                          <span>• {pacienteSelecionado.telefone}</span>
                        )}
                      </div>
                      {pacienteSelecionado.convenio && (
                        <div className="mt-2">
                          <span className="px-3 py-1 bg-blue-100 text-blue-700 rounded-full text-xs font-medium">
                            {pacienteSelecionado.convenio}
                          </span>
                        </div>
                      )}
                    </div>
                  </div>
                </div>

                {/* Tabs do Prontuário */}
                <Tabs defaultValue="ficha" className="w-full">
                  <TabsList className="grid w-full grid-cols-4 bg-slate-100">
                    <TabsTrigger
                      value="ficha"
                      className="data-[state=active]:bg-gradient-to-r data-[state=active]:from-cyan-500 data-[state=active]:to-teal-500 data-[state=active]:text-white gap-2"
                    >
                      <User className="w-4 h-4" />
                      Ficha
                    </TabsTrigger>
                    <TabsTrigger
                      value="anamnese"
                      className="data-[state=active]:bg-gradient-to-r data-[state=active]:from-cyan-500 data-[state=active]:to-teal-500 data-[state=active]:text-white gap-2"
                    >
                      <ClipboardList className="w-4 h-4" />
                      Anamnese
                    </TabsTrigger>
                    <TabsTrigger
                      value="evolucoes"
                      className="data-[state=active]:bg-gradient-to-r data-[state=active]:from-cyan-500 data-[state=active]:to-teal-500 data-[state=active]:text-white gap-2"
                    >
                      <Activity className="w-4 h-4" />
                      Atendimento
                    </TabsTrigger>
                    <TabsTrigger
                      value="relatorios"
                      className="data-[state=active]:bg-gradient-to-r data-[state=active]:from-purple-500 data-[state=active]:to-blue-500 data-[state=active]:text-white gap-2"
                    >
                      <Sparkles className="w-4 h-4" />
                      Relatórios
                    </TabsTrigger>
                  </TabsList>

                  <TabsContent value="ficha" className="mt-6">
                    <ProntuarioFichaPaciente paciente={pacienteSelecionado} />
                  </TabsContent>

                  <TabsContent value="anamnese" className="mt-6">
                    <ProntuarioAnamneseTab
                      paciente={pacienteSelecionado}
                      agendamentos={agendamentos}
                    />
                  </TabsContent>

                  <TabsContent value="evolucoes" className="mt-6">
                    <ProntuarioEvolucoesTab
                      paciente={pacienteSelecionado}
                      agendamentos={agendamentos}
                      agendamentoInicial={agendamentoInicial}
                      onAgendamentoProcessado={() => setAgendamentoInicial(null)}
                    />
                  </TabsContent>

                  <TabsContent value="relatorios" className="mt-6">
                    <ProntuarioRelatoriosTab
                      paciente={pacienteSelecionado}
                      anamneses={anamnesesDoPaciente}
                      evolucoes={evolucoesDoPaciente}
                    />
                  </TabsContent>
                </Tabs>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
}