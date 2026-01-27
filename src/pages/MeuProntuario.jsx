
import React, { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Link } from "react-router-dom";
import { createPageUrl } from "@/utils";
import {
  FileText,
  ArrowLeft,
  Activity,
  Calendar,
  User,
  Heart,
  Stethoscope,
  Pill,
  ClipboardList
} from "lucide-react";
import { format, parseISO } from "date-fns";
import { ptBR } from "date-fns/locale";

export default function MeuProntuario() {
  const [paciente, setPaciente] = useState(null);
  const [isAdmin, setIsAdmin] = useState(false);

  useEffect(() => {
    const loadPaciente = async () => {
      try {
        const userData = await base44.auth.me();
        setIsAdmin(userData.role === 'admin');
        
        if (userData.role === 'admin') {
          // Admin: buscar paciente selecionado do localStorage
          const pacienteSelecionadoId = localStorage.getItem('admin_paciente_selecionado');
          if (pacienteSelecionadoId) {
            const pacientes = await base44.entities.Paciente.filter({ id: pacienteSelecionadoId });
            if (pacientes && pacientes.length > 0) {
              setPaciente(pacientes[0]);
            } else {
              // If patient not found, clear localStorage and set patient to null
              localStorage.removeItem('admin_paciente_selecionado');
              setPaciente(null);
            }
          } else {
            // Admin is logged in but no patient selected
            setPaciente(null);
          }
        } else {
          // Paciente: buscar pelo email
          const pacientes = await base44.entities.Paciente.filter({ email: userData.email });
          if (pacientes && pacientes.length > 0) {
            setPaciente(pacientes[0]);
          } else {
            setPaciente(null);
          }
        }
      } catch (error) {
        console.error("Error loading paciente:", error);
        setPaciente(null); // Ensure patient is null on error
      }
    };
    loadPaciente();
  }, []);

  const { data: anamneses = [] } = useQuery({
    queryKey: ['minhas-anamneses', paciente?.id],
    queryFn: () => paciente ? base44.entities.Anamnese.filter({ paciente_id: paciente.id }, '-data_anamnese') : [],
    enabled: !!paciente,
  });

  const { data: evolucoes = [], isLoading } = useQuery({
    queryKey: ['minhas-evolucoes', paciente?.id],
    queryFn: () => paciente ? base44.entities.Evolucao.filter({ paciente_id: paciente.id }, '-data_atendimento') : [],
    enabled: !!paciente,
  });

  if (isLoading || !paciente) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-cyan-600"></div>
      </div>
    );
  }

  const AnamneseCard = ({ anamnese }) => (
    <Card className="border-none shadow-lg hover:shadow-xl transition-all">
      <CardHeader className="bg-gradient-to-r from-blue-500 to-cyan-500 text-white">
        <CardTitle className="flex items-center gap-2 text-lg">
          <ClipboardList className="w-5 h-5" />
          Anamnese - {format(parseISO(anamnese.data_anamnese), "dd/MM/yyyy")}
        </CardTitle>
      </CardHeader>
      <CardContent className="p-6 space-y-4">
        <div className="flex items-center gap-2 text-sm text-slate-600">
          <User className="w-4 h-4 text-cyan-600" />
          <span className="font-medium">Profissional:</span>
          <span>{anamnese.profissional_nome}</span>
        </div>

        {anamnese.queixa_principal && (
          <div>
            <p className="text-sm font-semibold text-slate-700 mb-1">Queixa Principal:</p>
            <p className="text-sm text-slate-600 bg-blue-50 p-3 rounded-lg">{anamnese.queixa_principal}</p>
          </div>
        )}

        {anamnese.historico_doenca_atual && (
          <div>
            <p className="text-sm font-semibold text-slate-700 mb-1">História da Doença Atual:</p>
            <p className="text-sm text-slate-600 bg-slate-50 p-3 rounded-lg">{anamnese.historico_doenca_atual}</p>
          </div>
        )}

        {(anamnese.peso || anamnese.altura || anamnese.pressao_arterial) && (
          <div className="grid md:grid-cols-3 gap-3">
            {anamnese.peso && (
              <div className="bg-green-50 p-3 rounded-lg">
                <p className="text-xs text-green-700 font-medium">Peso</p>
                <p className="text-lg font-bold text-green-800">{anamnese.peso} kg</p>
              </div>
            )}
            {anamnese.altura && (
              <div className="bg-blue-50 p-3 rounded-lg">
                <p className="text-xs text-blue-700 font-medium">Altura</p>
                <p className="text-lg font-bold text-blue-800">{anamnese.altura} m</p>
              </div>
            )}
            {anamnese.pressao_arterial && (
              <div className="bg-red-50 p-3 rounded-lg">
                <p className="text-xs text-red-700 font-medium">Pressão</p>
                <p className="text-lg font-bold text-red-800">{anamnese.pressao_arterial}</p>
              </div>
            )}
          </div>
        )}

        {anamnese.alergias && (
          <div className="bg-red-50 border border-red-200 p-3 rounded-lg">
            <div className="flex items-center gap-2 text-red-800 mb-1">
              <Heart className="w-4 h-4" />
              <p className="text-sm font-semibold">Alergias:</p>
            </div>
            <p className="text-sm text-red-700">{anamnese.alergias}</p>
          </div>
        )}

        {anamnese.medicamentos_uso && (
          <div className="bg-purple-50 border border-purple-200 p-3 rounded-lg">
            <div className="flex items-center gap-2 text-purple-800 mb-1">
              <Pill className="w-4 h-4" />
              <p className="text-sm font-semibold">Medicamentos em Uso:</p>
            </div>
            <p className="text-sm text-purple-700">{anamnese.medicamentos_uso}</p>
          </div>
        )}

        {anamnese.hipotese_diagnostica && (
          <div>
            <p className="text-sm font-semibold text-slate-700 mb-1">Hipótese Diagnóstica:</p>
            <p className="text-sm text-slate-600 bg-amber-50 p-3 rounded-lg border border-amber-200">
              {anamnese.hipotese_diagnostica}
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  );

  const EvolucaoCard = ({ evolucao }) => (
    <Card className="border-none shadow-lg hover:shadow-xl transition-all">
      <CardHeader className="bg-gradient-to-r from-purple-500 to-indigo-500 text-white">
        <CardTitle className="flex items-center gap-2 text-lg">
          <Activity className="w-5 h-5" />
          Atendimento - {format(parseISO(evolucao.data_atendimento), "dd/MM/yyyy")}
        </CardTitle>
      </CardHeader>
      <CardContent className="p-6 space-y-4">
        <div className="flex items-center gap-2 text-sm text-slate-600">
          <User className="w-4 h-4 text-purple-600" />
          <span className="font-medium">Profissional:</span>
          <span>{evolucao.profissional_nome}</span>
        </div>

        {evolucao.queixa && (
          <div>
            <p className="text-sm font-semibold text-slate-700 mb-1">Queixa:</p>
            <p className="text-sm text-slate-600 bg-purple-50 p-3 rounded-lg">{evolucao.queixa}</p>
          </div>
        )}

        {evolucao.evolucao && (
          <div>
            <p className="text-sm font-semibold text-slate-700 mb-1">Evolução:</p>
            <p className="text-sm text-slate-600 bg-slate-50 p-3 rounded-lg whitespace-pre-wrap">{evolucao.evolucao}</p>
          </div>
        )}

        {(evolucao.peso || evolucao.pressao_arterial || evolucao.temperatura || evolucao.frequencia_cardiaca) && (
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            {evolucao.peso && (
              <div className="bg-green-50 p-3 rounded-lg">
                <p className="text-xs text-green-700 font-medium">Peso</p>
                <p className="text-lg font-bold text-green-800">{evolucao.peso} kg</p>
              </div>
            )}
            {evolucao.pressao_arterial && (
              <div className="bg-red-50 p-3 rounded-lg">
                <p className="text-xs text-red-700 font-medium">PA</p>
                <p className="text-sm font-bold text-red-800">{evolucao.pressao_arterial}</p>
              </div>
            )}
            {evolucao.temperatura && (
              <div className="bg-orange-50 p-3 rounded-lg">
                <p className="text-xs text-orange-700 font-medium">Temp</p>
                <p className="text-lg font-bold text-orange-800">{evolucao.temperatura}°C</p>
              </div>
            )}
            {evolucao.frequencia_cardiaca && (
              <div className="bg-pink-50 p-3 rounded-lg">
                <p className="text-xs text-pink-700 font-medium">FC</p>
                <p className="text-lg font-bold text-pink-800">{evolucao.frequencia_cardiaca} bpm</p>
              </div>
            )}
          </div>
        )}

        {evolucao.exame_fisico && (
          <div>
            <div className="flex items-center gap-2 mb-1">
              <Stethoscope className="w-4 h-4 text-purple-600" />
              <p className="text-sm font-semibold text-slate-700">Exame Físico:</p>
            </div>
            <p className="text-sm text-slate-600 bg-blue-50 p-3 rounded-lg">{evolucao.exame_fisico}</p>
          </div>
        )}

        {evolucao.hipotese_diagnostica && (
          <div>
            <p className="text-sm font-semibold text-slate-700 mb-1">Hipótese Diagnóstica:</p>
            <p className="text-sm text-slate-600 bg-amber-50 p-3 rounded-lg border border-amber-200">
              {evolucao.hipotese_diagnostica}
            </p>
          </div>
        )}

        {evolucao.conduta && (
          <div>
            <p className="text-sm font-semibold text-slate-700 mb-1">Conduta:</p>
            <p className="text-sm text-slate-600 bg-slate-50 p-3 rounded-lg whitespace-pre-wrap">{evolucao.conduta}</p>
          </div>
        )}

        {evolucao.prescricao && (
          <div>
            <div className="flex items-center gap-2 mb-1">
              <Pill className="w-4 h-4 text-purple-600" />
              <p className="text-sm font-semibold text-slate-700">Prescrição:</p>
            </div>
            <p className="text-sm text-slate-600 bg-purple-50 p-3 rounded-lg font-mono whitespace-pre-wrap border border-purple-200">
              {evolucao.prescricao}
            </p>
          </div>
        )}

        {evolucao.retorno_em && (
          <div className="bg-amber-50 border border-amber-200 p-3 rounded-lg">
            <p className="text-sm text-amber-800">
              <strong>Retorno:</strong> {evolucao.retorno_em}
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  );

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50/30 to-teal-50/20 p-6">
      <div className="max-w-6xl mx-auto space-y-6">
        <div className="flex items-center gap-4">
          <Link to={createPageUrl("AreaPaciente")}>
            <Button variant="outline" size="icon">
              <ArrowLeft className="w-4 h-4" />
            </Button>
          </Link>
          <div className="flex-1">
            <h1 className="text-3xl font-bold text-slate-800">Meu Prontuário</h1>
            <p className="text-slate-500 mt-1">
              {isAdmin ? `🔐 Visualizando como: ${paciente.nome_completo}` : 'Histórico de atendimentos e evolução clínica'}
            </p>
          </div>
        </div>

        <div className="grid md:grid-cols-3 gap-4">
          <Card className="border-none shadow-lg">
            <CardContent className="p-6 text-center">
              <ClipboardList className="w-12 h-12 text-blue-600 mx-auto mb-2" />
              <p className="text-sm text-slate-500">Anamneses</p>
              <p className="text-3xl font-bold text-slate-800">{anamneses.length}</p>
            </CardContent>
          </Card>

          <Card className="border-none shadow-lg">
            <CardContent className="p-6 text-center">
              <Activity className="w-12 h-12 text-purple-600 mx-auto mb-2" />
              <p className="text-sm text-slate-500">Atendimentos</p>
              <p className="text-3xl font-bold text-slate-800">{evolucoes.length}</p>
            </CardContent>
          </Card>

          <Card className="border-none shadow-lg">
            <CardContent className="p-6 text-center">
              <Calendar className="w-12 h-12 text-teal-600 mx-auto mb-2" />
              <p className="text-sm text-slate-500">Último Atendimento</p>
              <p className="text-lg font-bold text-slate-800">
                {evolucoes.length > 0 ? format(parseISO(evolucoes[0].data_atendimento), "dd/MM/yyyy") : 'N/A'}
              </p>
            </CardContent>
          </Card>
        </div>

        {anamneses.length > 0 && (
          <Card className="border-none shadow-lg">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <ClipboardList className="w-5 h-5 text-blue-600" />
                Anamneses ({anamneses.length})
              </CardTitle>
            </CardHeader>
            <CardContent className="p-6">
              <div className="space-y-6">
                {anamneses.map((anamnese) => (
                  <AnamneseCard key={anamnese.id} anamnese={anamnese} />
                ))}
              </div>
            </CardContent>
          </Card>
        )}

        <Card className="border-none shadow-lg">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Activity className="w-5 h-5 text-purple-600" />
              Evoluções Clínicas ({evolucoes.length})
            </CardTitle>
          </CardHeader>
          <CardContent className="p-6">
            {evolucoes.length === 0 ? (
              <div className="text-center py-12">
                <FileText className="w-16 h-16 text-slate-300 mx-auto mb-4" />
                <p className="text-slate-500">Nenhum atendimento registrado ainda</p>
              </div>
            ) : (
              <div className="space-y-6">
                {evolucoes.map((evolucao) => (
                  <EvolucaoCard key={evolucao.id} evolucao={evolucao} />
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
