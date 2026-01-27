import React from "react";
import { useQuery } from "@tanstack/react-query";
import { base44 } from "@/api/base44Client";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { 
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Phone, Mail, MapPin, Edit, Trash2, Calendar, Package, CheckCircle2, AlertCircle, Clock } from "lucide-react";
import { format, startOfMonth, endOfMonth, isPast } from "date-fns";
import { ptBR } from "date-fns/locale";

const statusColors = {
  ativo: "bg-green-100 text-green-700",
  inativo: "bg-slate-100 text-slate-700",
  bloqueado: "bg-red-100 text-red-700"
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

const tipoPagamentoColors = {
  particular: "bg-blue-50 text-blue-700",
  convenio: "bg-purple-50 text-purple-700",
  plano_saude: "bg-indigo-50 text-indigo-700",
  pacote: "bg-green-50 text-green-700"
};

function StatusPagamentoMes({ pacienteId }) {
  const { data: pagamentos = [] } = useQuery({
    queryKey: ['pagamentos-paciente', pacienteId],
    queryFn: () => base44.entities.Pagamento.filter({ paciente_id: pacienteId }, '-data_vencimento'),
    enabled: !!pacienteId,
  });

  const hoje = new Date();
  const inicioMes = startOfMonth(hoje);
  const fimMes = endOfMonth(hoje);

  const pagamentoMesAtual = pagamentos.find(p => {
    if (!p.data_vencimento) return false;
    const dataVencimento = new Date(p.data_vencimento);
    return dataVencimento >= inicioMes && dataVencimento <= fimMes;
  });

  const jaFoiPago = pagamentoMesAtual?.status === 'pago';
  const estaAtrasado = pagamentoMesAtual && 
    pagamentoMesAtual.status !== 'pago' && 
    isPast(new Date(pagamentoMesAtual.data_vencimento));

  if (jaFoiPago) {
    return (
      <div className="flex items-center gap-1 text-green-700">
        <CheckCircle2 className="w-4 h-4" />
        <span className="text-xs font-bold">PAGO</span>
      </div>
    );
  }

  if (estaAtrasado) {
    return (
      <div className="flex items-center gap-1 text-red-700">
        <AlertCircle className="w-4 h-4" />
        <span className="text-xs font-bold">ATRASADO</span>
      </div>
    );
  }

  return (
    <div className="flex items-center gap-1 text-amber-700">
      <Clock className="w-4 h-4" />
      <span className="text-xs font-bold">PENDENTE</span>
    </div>
  );
}

export default function PacienteLista({ pacientes, onEdit, onDelete }) {
  return (
    <Card className="border-none shadow-lg">
      <CardContent className="p-0">
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow className="bg-slate-50">
                <TableHead className="font-semibold">Paciente</TableHead>
                <TableHead className="font-semibold">Contato</TableHead>
                <TableHead className="font-semibold">Localização</TableHead>
                <TableHead className="font-semibold">Tipo Pagamento</TableHead>
                <TableHead className="font-semibold">Vencimento</TableHead>
                <TableHead className="font-semibold">Status Pagamento</TableHead>
                <TableHead className="font-semibold">Status</TableHead>
                <TableHead className="font-semibold text-right">Ações</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {pacientes.map((paciente) => (
                <TableRow 
                  key={paciente.id} 
                  className="hover:bg-slate-50 transition-colors"
                >
                  {/* Coluna: Paciente */}
                  <TableCell>
                    <div className="flex items-center gap-3">
                      {paciente.foto_url ? (
                        <img 
                          src={paciente.foto_url}
                          alt={paciente.nome_completo}
                          className="w-10 h-10 rounded-full object-cover border-2 border-slate-200"
                        />
                      ) : (
                        <div className="w-10 h-10 rounded-full bg-gradient-to-br from-cyan-500 to-teal-500 flex items-center justify-center text-white font-bold text-sm">
                          {paciente.nome_completo?.charAt(0).toUpperCase()}
                        </div>
                      )}
                      <div>
                        <p className="font-semibold text-slate-800">
                          {paciente.nome_completo}
                        </p>
                        {paciente.cpf && (
                          <p className="text-xs text-slate-500">
                            CPF: {paciente.cpf}
                          </p>
                        )}
                        {paciente.data_nascimento && (
                          <p className="text-xs text-slate-500 flex items-center gap-1">
                            <Calendar className="w-3 h-3" />
                            {format(new Date(paciente.data_nascimento), "dd/MM/yyyy")}
                          </p>
                        )}
                      </div>
                    </div>
                  </TableCell>

                  {/* Coluna: Contato */}
                  <TableCell>
                    <div className="space-y-1">
                      {paciente.telefone && (
                        <div className="flex items-center gap-2 text-sm text-slate-600">
                          <Phone className="w-3 h-3 text-cyan-600" />
                          <span>{paciente.telefone}</span>
                        </div>
                      )}
                      {paciente.email && (
                        <div className="flex items-center gap-2 text-sm text-slate-600">
                          <Mail className="w-3 h-3 text-teal-600" />
                          <span className="truncate max-w-[200px]">{paciente.email}</span>
                        </div>
                      )}
                    </div>
                  </TableCell>

                  {/* Coluna: Localização */}
                  <TableCell>
                    {paciente.cidade || paciente.estado ? (
                      <div className="flex items-center gap-2 text-sm text-slate-600">
                        <MapPin className="w-3 h-3 text-blue-600 flex-shrink-0" />
                        <span>
                          {paciente.cidade}
                          {paciente.estado && ` - ${paciente.estado}`}
                        </span>
                      </div>
                    ) : (
                      <span className="text-sm text-slate-400">-</span>
                    )}
                  </TableCell>

                  {/* Coluna: Tipo Pagamento */}
                  <TableCell>
                    <div className="space-y-1">
                      <span className={`inline-block px-2 py-1 rounded-full text-xs font-medium ${
                        tipoPagamentoColors[paciente.tipo_pagamento] || 'bg-slate-100 text-slate-700'
                      }`}>
                        {tipoPagamentoLabels[paciente.tipo_pagamento] || paciente.tipo_pagamento}
                      </span>
                      
                      {paciente.tipo_pagamento === 'pacote' && paciente.pacote_nome && (
                        <div className="flex items-center gap-1 text-xs text-green-700 mt-1">
                          <Package className="w-3 h-3" />
                          <span className="truncate max-w-[150px]">{paciente.pacote_nome}</span>
                        </div>
                      )}
                      
                      {(paciente.tipo_pagamento === 'convenio' || paciente.tipo_pagamento === 'plano_saude') && paciente.convenio && (
                        <p className="text-xs text-slate-500 truncate max-w-[150px]">
                          {paciente.convenio}
                        </p>
                      )}
                    </div>
                  </TableCell>

                  {/* Coluna: Vencimento */}
                  <TableCell>
                    <div className="flex items-center gap-2 text-sm text-slate-700">
                      <Calendar className="w-4 h-4 text-purple-600" />
                      <span className="font-medium">Dia {paciente.dia_vencimento || 10}</span>
                    </div>
                  </TableCell>

                  {/* Coluna: Status Pagamento */}
                  <TableCell>
                    <StatusPagamentoMes pacienteId={paciente.id} />
                  </TableCell>

                  {/* Coluna: Status */}
                  <TableCell>
                    <span className={`inline-block px-3 py-1 rounded-full text-xs font-semibold ${statusColors[paciente.status]}`}>
                      {statusLabels[paciente.status]}
                    </span>
                  </TableCell>

                  {/* Coluna: Ações */}
                  <TableCell className="text-right">
                    <div className="flex gap-2 justify-end">
                      <Button
                        onClick={() => onEdit(paciente)}
                        variant="ghost"
                        size="sm"
                        className="hover:bg-cyan-50 hover:text-cyan-700"
                      >
                        <Edit className="w-4 h-4" />
                      </Button>
                      <Button
                        onClick={() => onDelete(paciente.id)}
                        variant="ghost"
                        size="sm"
                        className="hover:bg-red-50 hover:text-red-700"
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      </CardContent>
    </Card>
  );
}