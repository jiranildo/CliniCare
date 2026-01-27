import React, { useState } from "react";
import { base44 } from "@/api/base44Client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Plus, Calendar, User, AlertCircle } from "lucide-react";
import { format, parseISO } from "date-fns";
import { ptBR } from "date-fns/locale";
import { Alert, AlertDescription } from "@/components/ui/alert";
import ProntuarioModal from "@/components/prontuarios/ProntuarioModal";
import ProntuarioDetalhes from "@/components/prontuarios/ProntuarioDetalhes";

export default function ProntuarioAnamneseTab({ paciente, agendamentos }) {
  const [showModal, setShowModal] = useState(false);
  const [editingAnamnese, setEditingAnamnese] = useState(null);
  const queryClient = useQueryClient();

  const { data: anamneses = [], isLoading } = useQuery({
    queryKey: ['anamneses', paciente.id],
    queryFn: () => base44.entities.Anamnese.filter({ paciente_id: paciente.id }, '-data_anamnese'),
  });

  const { data: pacientes = [] } = useQuery({
    queryKey: ['pacientes'],
    queryFn: () => base44.entities.Paciente.list(),
  });

  const deleteAnamnese = useMutation({
    mutationFn: (id) => base44.entities.Anamnese.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries(['anamneses', paciente.id]);
    },
  });

  const handleEdit = (anamnese) => {
    setEditingAnamnese(anamnese);
    setShowModal(true);
  };

  const handleDelete = async (id) => {
    if (confirm('Tem certeza que deseja excluir esta anamnese?')) {
      await deleteAnamnese.mutateAsync(id);
    }
  };

  const handleClose = () => {
    setShowModal(false);
    setEditingAnamnese(null);
  };

  // Verificar se tem consulta de primeira vez sem anamnese
  const consultaPrimeiraVezSemAnamnese = agendamentos.find(ag => 
    ag.paciente_id === paciente.id && 
    ag.tipo_consulta === 'primeira_vez' && 
    !anamneses.some(an => an.agendamento_id === ag.id)
  );

  return (
    <div className="space-y-6">
      {consultaPrimeiraVezSemAnamnese && (
        <Alert className="border-amber-200 bg-amber-50">
          <AlertCircle className="h-4 w-4 text-amber-600" />
          <AlertDescription className="text-amber-800">
            <strong>Consulta de primeira vez pendente de anamnese!</strong>
            <span className="block mt-1 text-sm">
              Agendamento em {format(parseISO(consultaPrimeiraVezSemAnamnese.data), "dd/MM/yyyy")} às {consultaPrimeiraVezSemAnamnese.horario}
            </span>
          </AlertDescription>
        </Alert>
      )}

      <div className="flex justify-between items-center">
        <h3 className="text-lg font-bold text-slate-800">
          {anamneses.length > 0 ? 'Anamneses Registradas' : 'Nenhuma anamnese registrada'}
        </h3>
        <Button 
          onClick={() => setShowModal(true)}
          size="sm"
          className="bg-gradient-to-r from-cyan-500 to-teal-500 hover:from-cyan-600 hover:to-teal-600"
        >
          <Plus className="w-4 h-4 mr-2" />
          Nova Anamnese
        </Button>
      </div>

      {isLoading ? (
        <div className="text-center py-12">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-cyan-600 mx-auto"></div>
          <p className="text-slate-500 mt-4">Carregando anamneses...</p>
        </div>
      ) : anamneses.length === 0 ? (
        <div className="text-center py-12 bg-slate-50 rounded-lg border-2 border-dashed border-slate-200">
          <Calendar className="w-16 h-16 text-slate-300 mx-auto mb-4" />
          <p className="text-slate-500 mb-4">Nenhuma anamnese registrada para este paciente</p>
          <Button 
            onClick={() => setShowModal(true)}
            className="bg-gradient-to-r from-cyan-500 to-teal-500 hover:from-cyan-600 hover:to-teal-600"
          >
            <Plus className="w-4 h-4 mr-2" />
            Criar Primeira Anamnese
          </Button>
        </div>
      ) : (
        <div className="space-y-4">
          {anamneses.map((anamnese) => (
            <div key={anamnese.id} className="bg-white border border-slate-200 rounded-lg p-4 hover:shadow-md transition-all">
              <div className="flex items-start justify-between mb-3">
                <div className="flex items-center gap-3">
                  <Calendar className="w-5 h-5 text-cyan-600" />
                  <div>
                    <p className="font-semibold text-slate-800">
                      {format(parseISO(anamnese.data_anamnese), "dd 'de' MMMM 'de' yyyy", { locale: ptBR })}
                    </p>
                    <p className="text-sm text-slate-500 flex items-center gap-1">
                      <User className="w-3 h-3" />
                      {anamnese.profissional_nome}
                    </p>
                  </div>
                </div>
                <div className="flex gap-2">
                  <Button
                    onClick={() => handleEdit(anamnese)}
                    variant="outline"
                    size="sm"
                  >
                    Editar
                  </Button>
                  <Button
                    onClick={() => handleDelete(anamnese.id)}
                    variant="outline"
                    size="sm"
                    className="text-red-600 hover:bg-red-50"
                  >
                    Excluir
                  </Button>
                </div>
              </div>

              {anamnese.queixa_principal && (
                <div className="mb-2">
                  <p className="text-sm font-medium text-slate-700">Queixa Principal:</p>
                  <p className="text-sm text-slate-600">{anamnese.queixa_principal}</p>
                </div>
              )}

              {anamnese.hipotese_diagnostica && (
                <div className="mb-2">
                  <p className="text-sm font-medium text-slate-700">Hipótese Diagnóstica:</p>
                  <p className="text-sm text-slate-600">{anamnese.hipotese_diagnostica}</p>
                </div>
              )}

              <details className="mt-3">
                <summary className="cursor-pointer text-sm text-cyan-600 hover:text-cyan-700 font-medium">
                  Ver Detalhes Completos
                </summary>
                <div className="mt-3">
                  <ProntuarioDetalhes
                    prontuario={anamnese}
                    onEdit={handleEdit}
                    onDelete={handleDelete}
                    hideActions={true}
                  />
                </div>
              </details>
            </div>
          ))}
        </div>
      )}

      {showModal && (
        <ProntuarioModal
          prontuario={editingAnamnese}
          pacientes={pacientes}
          agendamentos={agendamentos}
          pacienteId={paciente.id}
          onClose={handleClose}
        />
      )}
    </div>
  );
}