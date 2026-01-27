
import React, { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Link } from "react-router-dom";
import { createPageUrl } from "@/utils";
import {
  DollarSign,
  ArrowLeft,
  CheckCircle,
  Clock,
  AlertTriangle,
  XCircle,
  CreditCard,
  Calendar
} from "lucide-react";
import { format, isPast } from "date-fns";
import { ptBR } from "date-fns/locale";

export default function MeusPagamentos() {
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
            }
          }
        } else {
          // Paciente: buscar pelo email
          const pacientes = await base44.entities.Paciente.filter({ email: userData.email });
          if (pacientes && pacientes.length > 0) {
            setPaciente(pacientes[0]);
          }
        }
      } catch (error) {
        console.error("Error loading paciente:", error);
      }
    };
    loadPaciente();
  }, []);

  const { data: pagamentos = [], isLoading } = useQuery({
    queryKey: ['meus-pagamentos', paciente?.id],
    queryFn: () => paciente ? base44.entities.Pagamento.filter({ paciente_id: paciente.id }, '-data_vencimento') : [],
    enabled: !!paciente,
  });

  if (isLoading || !paciente) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-cyan-600"></div>
      </div>
    );
  }

  const pagamentosPendentes = pagamentos.filter(p => p.status === 'pendente' || p.status === 'parcial' || p.status === 'atrasado');
  const pagamentosPagos = pagamentos.filter(p => p.status === 'pago');

  const totalPendente = pagamentosPendentes.reduce((acc, p) => acc + (p.valor - (p.valor_pago || 0)), 0);
  const totalPago = pagamentosPagos.reduce((acc, p) => acc + (p.valor_pago || p.valor || 0), 0);

  const statusConfig = {
    pendente: { label: 'Pendente', color: 'bg-amber-100 text-amber-700 border-amber-200', icon: Clock },
    pago: { label: 'Pago', color: 'bg-green-100 text-green-700 border-green-200', icon: CheckCircle },
    parcial: { label: 'Parcial', color: 'bg-blue-100 text-blue-700 border-blue-200', icon: AlertTriangle },
    atrasado: { label: 'Atrasado', color: 'bg-red-100 text-red-700 border-red-200', icon: AlertTriangle },
    cancelado: { label: 'Cancelado', color: 'bg-slate-100 text-slate-700 border-slate-200', icon: XCircle }
  };

  const formasPagamento = {
    dinheiro: 'Dinheiro',
    cartao_credito: 'Cartão de Crédito',
    cartao_debito: 'Cartão de Débito',
    pix: 'PIX',
    transferencia: 'Transferência',
    cheque: 'Cheque',
    convenio: 'Convênio'
  };

  const PagamentoCard = ({ pagamento }) => {
    const StatusIcon = statusConfig[pagamento.status]?.icon || Clock;
    const isAtrasado = pagamento.status === 'pendente' && isPast(new Date(pagamento.data_vencimento));
    const statusFinal = isAtrasado ? 'atrasado' : pagamento.status;
    
    return (
      <Card className={`border-2 ${statusConfig[statusFinal]?.color || 'border-slate-200'} hover:shadow-lg transition-all`}>
        <CardContent className="p-6">
          <div className="flex flex-col md:flex-row justify-between gap-4">
            <div className="flex-1">
              <div className="flex items-center gap-3 mb-3">
                <div className={`w-12 h-12 rounded-full flex items-center justify-center ${statusConfig[statusFinal]?.color || 'bg-slate-100'}`}>
                  <StatusIcon className="w-6 h-6" />
                </div>
                <div>
                  <h3 className="font-bold text-xl text-slate-800">
                    R$ {(pagamento.valor || 0).toFixed(2)}
                  </h3>
                  <span className={`text-xs font-semibold ${statusConfig[statusFinal]?.color || 'text-slate-600'}`}>
                    {statusConfig[statusFinal]?.label || pagamento.status}
                  </span>
                </div>
              </div>

              <div className="space-y-2">
                <div className="flex items-center gap-2 text-sm text-slate-600">
                  <Calendar className="w-4 h-4 text-cyan-600" />
                  <span className="font-medium">Vencimento:</span>
                  <span>{format(new Date(pagamento.data_vencimento), "dd/MM/yyyy")}</span>
                  {isAtrasado && (
                    <span className="text-red-600 font-semibold ml-2">
                      ⚠️ VENCIDO
                    </span>
                  )}
                </div>

                {pagamento.forma_pagamento && (
                  <div className="flex items-center gap-2 text-sm text-slate-600">
                    <CreditCard className="w-4 h-4 text-cyan-600" />
                    <span className="font-medium">Forma:</span>
                    <span>{formasPagamento[pagamento.forma_pagamento] || pagamento.forma_pagamento}</span>
                  </div>
                )}

                {pagamento.data_pagamento && (
                  <div className="flex items-center gap-2 text-sm text-green-600">
                    <CheckCircle className="w-4 h-4" />
                    <span className="font-medium">Pago em:</span>
                    <span>{format(new Date(pagamento.data_pagamento), "dd/MM/yyyy")}</span>
                  </div>
                )}

                {pagamento.valor_pago && pagamento.valor_pago < pagamento.valor && (
                  <div className="text-sm text-blue-600">
                    <span className="font-medium">Valor pago:</span> R$ {(pagamento.valor_pago).toFixed(2)}
                    <span className="ml-2">•</span>
                    <span className="ml-2 font-medium">Restante:</span> R$ {(pagamento.valor - pagamento.valor_pago).toFixed(2)}
                  </div>
                )}

                {pagamento.parcela && (
                  <div className="text-xs text-slate-500">
                    Parcela {pagamento.parcela}
                  </div>
                )}

                {pagamento.observacoes && (
                  <div className="mt-3 p-3 bg-slate-50 rounded-lg border">
                    <p className="text-sm text-slate-700">
                      <strong>Obs:</strong> {pagamento.observacoes}
                    </p>
                  </div>
                )}
              </div>
            </div>

            {pagamento.comprovante_url && (
              <div>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => window.open(pagamento.comprovante_url, '_blank')}
                >
                  Ver Comprovante
                </Button>
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    );
  };

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
            <h1 className="text-3xl font-bold text-slate-800">Meus Pagamentos</h1>
            <p className="text-slate-500 mt-1">
              {isAdmin ? `🔐 Visualizando como: ${paciente.nome_completo}` : 'Acompanhe suas finanças'}
            </p>
          </div>
        </div>

        <div className="grid md:grid-cols-2 gap-6">
          <Card className="border-none shadow-lg">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-slate-500 mb-1">Total Pendente</p>
                  <p className="text-3xl font-bold text-amber-600">R$ {totalPendente.toFixed(2)}</p>
                  <p className="text-xs text-slate-500 mt-1">{pagamentosPendentes.length} pagamento(s)</p>
                </div>
                <div className="w-14 h-14 rounded-full bg-amber-100 flex items-center justify-center">
                  <Clock className="w-7 h-7 text-amber-600" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="border-none shadow-lg">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-slate-500 mb-1">Total Pago</p>
                  <p className="text-3xl font-bold text-green-600">R$ {totalPago.toFixed(2)}</p>
                  <p className="text-xs text-slate-500 mt-1">{pagamentosPagos.length} pagamento(s)</p>
                </div>
                <div className="w-14 h-14 rounded-full bg-green-100 flex items-center justify-center">
                  <CheckCircle className="w-7 h-7 text-green-600" />
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {pagamentosPendentes.length > 0 && (
          <Card className="border-none shadow-lg">
            <CardHeader className="bg-gradient-to-r from-amber-500 to-orange-500 text-white rounded-t-lg">
              <CardTitle className="flex items-center gap-2">
                <AlertTriangle className="w-5 h-5" />
                Pagamentos Pendentes ({pagamentosPendentes.length})
              </CardTitle>
            </CardHeader>
            <CardContent className="p-6">
              <div className="space-y-4">
                {pagamentosPendentes.map((pagamento) => (
                  <PagamentoCard key={pagamento.id} pagamento={pagamento} />
                ))}
              </div>
            </CardContent>
          </Card>
        )}

        <Card className="border-none shadow-lg">
          <CardHeader className="bg-gradient-to-r from-green-500 to-emerald-500 text-white rounded-t-lg">
            <CardTitle className="flex items-center gap-2">
              <CheckCircle className="w-5 h-5" />
              Pagamentos Realizados ({pagamentosPagos.length})
            </CardTitle>
          </CardHeader>
          <CardContent className="p-6">
            {pagamentosPagos.length === 0 ? (
              <div className="text-center py-12">
                <DollarSign className="w-16 h-16 text-slate-300 mx-auto mb-4" />
                <p className="text-slate-500">Nenhum pagamento realizado ainda</p>
              </div>
            ) : (
              <div className="space-y-4">
                {pagamentosPagos.slice(0, 10).map((pagamento) => (
                  <PagamentoCard key={pagamento.id} pagamento={pagamento} />
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
