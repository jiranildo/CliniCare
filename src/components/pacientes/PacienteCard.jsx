import React from "react";
import { useQuery } from "@tanstack/react-query";
import { base44 } from "@/api/base44Client";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Phone, Mail, MapPin, Edit, Trash2, Calendar, Package, CheckCircle2, AlertCircle, Clock } from "lucide-react";
import { format, startOfMonth, endOfMonth, isPast } from "date-fns";
import { ptBR } from "date-fns/locale";

const statusColors = {
  ativo: "bg-green-100 text-green-700 border-green-200",
  inativo: "bg-slate-100 text-slate-700 border-slate-200",
  bloqueado: "bg-red-100 text-red-700 border-red-200"
};

const statusLabels = {
  ativo: "Ativo",
  inativo: "Inativo",
  bloqueado: "Bloqueado"
};

const tipoPagamentoLabels = {
  particular: "Particular",
  convenio: "Convênio",
  plano_saude: "Plano de Saúde",
  pacote: "Pacote"
};

export default function PacienteCard({ paciente, onEdit, onDelete }) {
  // Buscar pagamentos do paciente
  const { data: pagamentos = [] } = useQuery({
    queryKey: ['pagamentos-paciente', paciente.id],
    queryFn: () => base44.entities.Pagamento.filter({ paciente_id: paciente.id }, '-data_vencimento'),
    enabled: !!paciente.id,
  });

  // Verificar pagamento do mês atual
  const hoje = new Date();
  const inicioMes = startOfMonth(hoje);
  const fimMes = endOfMonth(hoje);

  const pagamentoMesAtual = pagamentos.find(p => {
    if (!p.data_vencimento) return false;
    const dataVencimento = new Date(p.data_vencimento);
    return dataVencimento >= inicioMes && dataVencimento <= fimMes;
  });

  const jaFoiPago = pagamentoMesAtual?.status === 'pago';
  const dataVencimento = paciente.dia_vencimento || 10;
  const mesAtual = format(hoje, 'MM/yyyy', { locale: ptBR });

  // Verificar se está atrasado
  const estaAtrasado = pagamentoMesAtual && 
    pagamentoMesAtual.status !== 'pago' && 
    isPast(new Date(pagamentoMesAtual.data_vencimento));

  return (
    <Card className="border-none shadow-lg hover:shadow-xl transition-all duration-300 overflow-hidden">
      <div className={`h-1.5 bg-gradient-to-r ${
        paciente.status === 'ativo' ? 'from-green-400 to-emerald-500' :
        paciente.status === 'inativo' ? 'from-slate-400 to-slate-500' :
        'from-red-400 to-rose-500'
      }`} />
      
      <CardContent className="p-6">
        <div className="flex justify-between items-start mb-4">
          <div className="flex items-center gap-3">
            {paciente.foto_url ? (
              <img 
                src={paciente.foto_url}
                alt={paciente.nome_completo}
                className="w-14 h-14 rounded-full object-cover shadow-lg border-2 border-white"
              />
            ) : (
              <div className="w-14 h-14 rounded-full bg-gradient-to-br from-cyan-500 to-teal-500 flex items-center justify-center text-white font-bold text-xl shadow-lg">
                {paciente.nome_completo?.charAt(0).toUpperCase()}
              </div>
            )}
            <div>
              <h3 className="font-bold text-slate-800 text-lg">
                {paciente.nome_completo}
              </h3>
              {paciente.cpf && (
                <p className="text-sm text-slate-500">
                  CPF: {paciente.cpf}
                </p>
              )}
            </div>
          </div>
          <span className={`px-3 py-1 rounded-full text-xs font-semibold border ${statusColors[paciente.status]}`}>
            {statusLabels[paciente.status]}
          </span>
        </div>

        <div className="space-y-2 mb-4">
          {paciente.telefone && (
            <div className="flex items-center gap-2 text-slate-600">
              <Phone className="w-4 h-4 text-cyan-600" />
              <span className="text-sm">{paciente.telefone}</span>
            </div>
          )}
          {paciente.email && (
            <div className="flex items-center gap-2 text-slate-600">
              <Mail className="w-4 h-4 text-teal-600" />
              <span className="text-sm truncate">{paciente.email}</span>
            </div>
          )}
          {paciente.cidade && (
            <div className="flex items-center gap-2 text-slate-600">
              <MapPin className="w-4 h-4 text-blue-600" />
              <span className="text-sm">{paciente.cidade}{paciente.estado && ` - ${paciente.estado}`}</span>
            </div>
          )}
          {paciente.data_nascimento && (
            <div className="flex items-center gap-2 text-slate-600">
              <Calendar className="w-4 h-4 text-purple-600" />
              <span className="text-sm">
                {format(new Date(paciente.data_nascimento), "dd/MM/yyyy")}
              </span>
            </div>
          )}
        </div>

        {paciente.tipo_pagamento && (
          <div className="mb-4 space-y-2">
            <span className={`inline-block px-3 py-1 rounded-full text-xs font-medium border ${
              paciente.tipo_pagamento === 'particular' ? 'bg-blue-50 text-blue-700 border-blue-200' :
              paciente.tipo_pagamento === 'convenio' ? 'bg-purple-50 text-purple-700 border-purple-200' :
              paciente.tipo_pagamento === 'plano_saude' ? 'bg-indigo-50 text-indigo-700 border-indigo-200' :
              'bg-green-50 text-green-700 border-green-200'
            }`}>
              {tipoPagamentoLabels[paciente.tipo_pagamento] || paciente.tipo_pagamento}
            </span>

            {paciente.tipo_pagamento === 'pacote' && paciente.pacote_nome && (
              <div className="flex items-center gap-2 p-2 bg-green-50 rounded-lg border border-green-200">
                <Package className="w-4 h-4 text-green-700" />
                <span className="text-xs font-medium text-green-700">
                  {paciente.pacote_nome}
                </span>
              </div>
            )}

            {(paciente.tipo_pagamento === 'convenio' || paciente.tipo_pagamento === 'plano_saude') && paciente.convenio && (
              <p className="text-xs text-slate-600">
                {paciente.convenio}
                {paciente.numero_convenio && ` - ${paciente.numero_convenio}`}
              </p>
            )}
          </div>
        )}

        {/* STATUS DE PAGAMENTO DO MÊS */}
        <div className="mb-4 p-3 rounded-lg border-2 bg-gradient-to-r from-slate-50 to-blue-50">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-semibold text-slate-600 uppercase">
              Pagamento {mesAtual}
            </span>
            {jaFoiPago ? (
              <div className="flex items-center gap-1 text-green-700">
                <CheckCircle2 className="w-4 h-4" />
                <span className="text-xs font-bold">PAGO</span>
              </div>
            ) : estaAtrasado ? (
              <div className="flex items-center gap-1 text-red-700">
                <AlertCircle className="w-4 h-4" />
                <span className="text-xs font-bold">ATRASADO</span>
              </div>
            ) : (
              <div className="flex items-center gap-1 text-amber-700">
                <Clock className="w-4 h-4" />
                <span className="text-xs font-bold">PENDENTE</span>
              </div>
            )}
          </div>

          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2 text-slate-700">
              <Calendar className="w-3 h-3" />
              <span className="text-xs font-medium">
                Vencimento: Dia {dataVencimento}
              </span>
            </div>
            
            {pagamentoMesAtual && (
              <span className="text-xs font-bold text-slate-700">
                R$ {(pagamentoMesAtual.valor || 0).toFixed(2)}
              </span>
            )}
          </div>

          {estaAtrasado && (
            <div className="mt-2 text-xs text-red-600 font-medium">
              ⚠️ Venceu em {format(new Date(pagamentoMesAtual.data_vencimento), "dd/MM/yyyy")}
            </div>
          )}
        </div>

        <div className="flex gap-2 pt-4 border-t border-slate-100">
          <Button
            onClick={() => onEdit(paciente)}
            variant="outline"
            size="sm"
            className="flex-1 hover:bg-cyan-50 hover:text-cyan-700 hover:border-cyan-200"
          >
            <Edit className="w-4 h-4 mr-2" />
            Editar
          </Button>
          <Button
            onClick={() => onDelete(paciente.id)}
            variant="outline"
            size="sm"
            className="hover:bg-red-50 hover:text-red-700 hover:border-red-200"
          >
            <Trash2 className="w-4 h-4" />
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}