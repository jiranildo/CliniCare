
import React, { useState } from "react";
import { format } from "date-fns";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { FileText, DollarSign, Calendar, CheckCircle2, Clock, AlertCircle } from "lucide-react";

export default function HistoricoFinanceiroModal({ paciente, pagamentos, notasFiscais, onClose }) {
    const pagamentosPaciente = pagamentos.filter(p => p.paciente_id === paciente.id);
    const notasPaciente = notasFiscais.filter(n => n.paciente_id === paciente.id);

    const getStatusBadge = (status) => {
        switch (status) {
            case 'pago': return <Badge className="bg-green-100 text-green-700 hover:bg-green-200">Pago</Badge>;
            case 'pendente': return <Badge className="bg-amber-100 text-amber-700 hover:bg-amber-200">Pendente</Badge>;
            case 'atrasado': return <Badge className="bg-red-100 text-red-700 hover:bg-red-200">Atrasado</Badge>;
            case 'emitida': return <Badge className="bg-blue-100 text-blue-700 hover:bg-blue-200">Emitida</Badge>;
            default: return <Badge variant="outline">{status}</Badge>;
        }
    };

    return (
        <Dialog open={true} onOpenChange={onClose}>
            <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
                <DialogHeader>
                    <DialogTitle className="flex items-center gap-2 text-xl font-bold text-slate-800">
                        <FileText className="w-5 h-5 text-cyan-600" />
                        Histórico Financeiro - {paciente.nome_completo}
                    </DialogTitle>
                </DialogHeader>

                <Tabs defaultValue="pagamentos" className="w-full mt-4">
                    <TabsList className="grid w-full grid-cols-2">
                        <TabsTrigger value="pagamentos" className="flex items-center gap-2">
                            <DollarSign className="w-4 h-4" /> Pagamentos
                        </TabsTrigger>
                        <TabsTrigger value="notas" className="flex items-center gap-2">
                            <FileText className="w-4 h-4" /> Notas Fiscais
                        </TabsTrigger>
                    </TabsList>

                    <TabsContent value="pagamentos" className="mt-4">
                        {pagamentosPaciente.length === 0 ? (
                            <div className="text-center py-8 text-slate-500">
                                Nenhum pagamento registrado.
                            </div>
                        ) : (
                            <Table>
                                <TableHeader>
                                    <TableRow>
                                        <TableHead>Vencimento</TableHead>
                                        <TableHead>Pagamento</TableHead>
                                        <TableHead>Valor</TableHead>
                                        <TableHead>Tipo</TableHead>
                                        <TableHead>Status</TableHead>
                                        <TableHead>Obs</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {pagamentosPaciente.map(p => (
                                        <TableRow key={p.id}>
                                            <TableCell>
                                                <div className="flex items-center gap-2">
                                                    <Calendar className="w-4 h-4 text-slate-400" />
                                                    {p.data_vencimento ? format(new Date(p.data_vencimento), 'dd/MM/yyyy') : '-'}
                                                </div>
                                            </TableCell>
                                            <TableCell>
                                                {p.data_pagamento ? format(new Date(p.data_pagamento), 'dd/MM/yyyy') : '-'}
                                            </TableCell>
                                            <TableCell className="font-medium">
                                                R$ {Number(p.valor).toFixed(2)}
                                            </TableCell>
                                            <TableCell className="capitalize">{p.tipo}</TableCell>
                                            <TableCell>{getStatusBadge(p.status)}</TableCell>
                                            <TableCell className="max-w-[150px] truncate" title={p.observacoes}>
                                                {p.observacoes || '-'}
                                            </TableCell>
                                        </TableRow>
                                    ))}
                                </TableBody>
                            </Table>
                        )}
                    </TabsContent>

                    <TabsContent value="notas" className="mt-4">
                        {notasPaciente.length === 0 ? (
                            <div className="text-center py-8 text-slate-500">
                                Nenhuma nota fiscal registrada.
                            </div>
                        ) : (
                            <Table>
                                <TableHeader>
                                    <TableRow>
                                        <TableHead>Número</TableHead>
                                        <TableHead>Emissão</TableHead>
                                        <TableHead>Referência</TableHead>
                                        <TableHead>Valor</TableHead>
                                        <TableHead>Status</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {notasPaciente.map(n => (
                                        <TableRow key={n.id}>
                                            <TableCell className="font-mono">{n.numero_nota || 'S/N'}</TableCell>
                                            <TableCell>
                                                {n.data_emissao ? format(new Date(n.data_emissao), 'dd/MM/yyyy') : '-'}
                                            </TableCell>
                                            <TableCell>{n.mes_referencia}</TableCell>
                                            <TableCell className="font-medium">
                                                R$ {Number(n.valor_total).toFixed(2)}
                                            </TableCell>
                                            <TableCell>{getStatusBadge(n.status)}</TableCell>
                                        </TableRow>
                                    ))}
                                </TableBody>
                            </Table>
                        )}
                    </TabsContent>
                </Tabs>
            </DialogContent>
        </Dialog>
    );
}
