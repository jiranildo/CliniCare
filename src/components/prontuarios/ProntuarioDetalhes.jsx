
import React from "react";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Edit, Trash2, Calendar, User, FileText, Activity, Heart } from "lucide-react";
import { format, parseISO } from "date-fns";
import { ptBR } from "date-fns/locale";

export default function ProntuarioDetalhes({ prontuario, onEdit, onDelete, hideActions }) {
  return (
    <Card className="border-none shadow-lg">
      {!hideActions && (
        <CardHeader className="border-b">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-bold text-slate-800">Detalhes da Anamnese</h3>
            <div className="flex gap-2">
              <Button
                onClick={() => onEdit(prontuario)}
                variant="outline"
                size="sm"
                className="hover:bg-cyan-50"
              >
                <Edit className="w-4 h-4" />
              </Button>
              <Button
                onClick={() => onDelete(prontuario.id)}
                variant="outline"
                size="sm"
                className="hover:bg-red-50"
              >
                <Trash2 className="w-4 h-4" />
              </Button>
            </div>
          </div>
        </CardHeader>
      )}
      <CardContent className={hideActions ? "p-0 space-y-4" : "p-6 space-y-4 max-h-[calc(100vh-250px)] overflow-y-auto"}>
        <div className="space-y-2">
          <div className="flex items-center gap-2 text-sm text-slate-500">
            <User className="w-4 h-4" />
            <span>Paciente</span>
          </div>
          <p className="font-semibold text-slate-800">{prontuario.paciente_nome}</p>
        </div>

        <div className="space-y-2">
          <div className="flex items-center gap-2 text-sm text-slate-500">
            <Calendar className="w-4 h-4" />
            <span>Data da Anamnese</span>
          </div>
          <p className="font-medium text-slate-800">
            {format(parseISO(prontuario.data_anamnese), "dd 'de' MMMM 'de' yyyy", { locale: ptBR })}
          </p>
        </div>

        <div className="space-y-2">
          <div className="flex items-center gap-2 text-sm text-slate-500">
            <User className="w-4 h-4" />
            <span>Profissional</span>
          </div>
          <p className="font-medium text-slate-800">{prontuario.profissional_nome}</p>
        </div>

        <div className="pt-4 border-t space-y-4">
          {prontuario.queixa_principal && (
            <div>
              <p className="text-sm font-semibold text-slate-700 mb-1 flex items-center gap-2">
                <FileText className="w-4 h-4" />
                Queixa Principal:
              </p>
              <p className="text-sm text-slate-600">{prontuario.queixa_principal}</p>
            </div>
          )}

          {prontuario.historico_doenca_atual && (
            <div>
              <p className="text-sm font-semibold text-slate-700 mb-1">História da Doença Atual:</p>
              <p className="text-sm text-slate-600 whitespace-pre-wrap">{prontuario.historico_doenca_atual}</p>
            </div>
          )}

          {prontuario.historico_medico && (
            <div>
              <p className="text-sm font-semibold text-slate-700 mb-1">Histórico Médico:</p>
              <p className="text-sm text-slate-600 whitespace-pre-wrap">{prontuario.historico_medico}</p>
            </div>
          )}

          {prontuario.alergias && (
            <div>
              <p className="text-sm font-semibold text-red-700 mb-1 flex items-center gap-2">
                <Heart className="w-4 h-4" />
                Alergias:
              </p>
              <p className="text-sm text-slate-600 bg-red-50 p-2 rounded">{prontuario.alergias}</p>
            </div>
          )}

          {prontuario.medicamentos_uso && (
            <div>
              <p className="text-sm font-semibold text-slate-700 mb-1">Medicamentos em Uso:</p>
              <p className="text-sm text-slate-600 whitespace-pre-wrap">{prontuario.medicamentos_uso}</p>
            </div>
          )}

          {prontuario.doencas_preexistentes && (
            <div>
              <p className="text-sm font-semibold text-slate-700 mb-1">Doenças Pré-existentes:</p>
              <p className="text-sm text-slate-600">{prontuario.doencas_preexistentes}</p>
            </div>
          )}

          {prontuario.cirurgias_anteriores && (
            <div>
              <p className="text-sm font-semibold text-slate-700 mb-1">Cirurgias Anteriores:</p>
              <p className="text-sm text-slate-600">{prontuario.cirurgias_anteriores}</p>
            </div>
          )}

          {prontuario.historico_familiar && (
            <div>
              <p className="text-sm font-semibold text-slate-700 mb-1">Histórico Familiar:</p>
              <p className="text-sm text-slate-600 whitespace-pre-wrap">{prontuario.historico_familiar}</p>
            </div>
          )}

          {prontuario.habitos && (
            <div>
              <p className="text-sm font-semibold text-slate-700 mb-1">Hábitos de Vida:</p>
              <p className="text-sm text-slate-600">{prontuario.habitos}</p>
            </div>
          )}

          {(prontuario.pressao_arterial || prontuario.peso || prontuario.altura || prontuario.tipo_sanguineo) && (
            <div className="bg-blue-50 p-3 rounded-lg">
              <p className="text-sm font-semibold text-slate-700 mb-2 flex items-center gap-2">
                <Activity className="w-4 h-4" />
                Dados Vitais:
              </p>
              <div className="grid grid-cols-2 gap-2 text-sm">
                {prontuario.pressao_arterial && (
                  <div>
                    <span className="text-slate-500">PA:</span>
                    <span className="ml-1 text-slate-700 font-medium">{prontuario.pressao_arterial}</span>
                  </div>
                )}
                {prontuario.peso && (
                  <div>
                    <span className="text-slate-500">Peso:</span>
                    <span className="ml-1 text-slate-700 font-medium">{prontuario.peso} kg</span>
                  </div>
                )}
                {prontuario.altura && (
                  <div>
                    <span className="text-slate-500">Altura:</span>
                    <span className="ml-1 text-slate-700 font-medium">{prontuario.altura} m</span>
                  </div>
                )}
                {prontuario.imc && (
                  <div>
                    <span className="text-slate-500">IMC:</span>
                    <span className="ml-1 text-slate-700 font-medium">{prontuario.imc}</span>
                  </div>
                )}
                {prontuario.tipo_sanguineo && (
                  <div>
                    <span className="text-slate-500">Tipo Sang.:</span>
                    <span className="ml-1 text-slate-700 font-medium">{prontuario.tipo_sanguineo}</span>
                  </div>
                )}
              </div>
            </div>
          )}

          {prontuario.exame_fisico && (
            <div>
              <p className="text-sm font-semibold text-slate-700 mb-1">Exame Físico:</p>
              <p className="text-sm text-slate-600 whitespace-pre-wrap">{prontuario.exame_fisico}</p>
            </div>
          )}

          {prontuario.hipotese_diagnostica && (
            <div>
              <p className="text-sm font-semibold text-slate-700 mb-1">Hipótese Diagnóstica:</p>
              <p className="text-sm text-slate-600">{prontuario.hipotese_diagnostica}</p>
            </div>
          )}

          {prontuario.conduta && (
            <div>
              <p className="text-sm font-semibold text-slate-700 mb-1">Conduta:</p>
              <p className="text-sm text-slate-600 whitespace-pre-wrap">{prontuario.conduta}</p>
            </div>
          )}

          {prontuario.prescricao && (
            <div>
              <p className="text-sm font-semibold text-slate-700 mb-1">Prescrição:</p>
              <p className="text-sm text-slate-600 whitespace-pre-wrap font-mono bg-slate-50 p-3 rounded">
                {prontuario.prescricao}
              </p>
            </div>
          )}

          {prontuario.observacoes && (
            <div>
              <p className="text-sm font-semibold text-slate-700 mb-1">Observações:</p>
              <p className="text-sm text-slate-600">{prontuario.observacoes}</p>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
