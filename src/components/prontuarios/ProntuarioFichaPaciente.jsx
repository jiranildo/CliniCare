import React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  User,
  Phone,
  Mail,
  MapPin,
  Calendar,
  CreditCard,
  Users,
  Wallet,
  FileText,
  AlertCircle,
  Building,
  DollarSign,
  Package,
  CheckCircle2,
  Circle
} from "lucide-react";
import { format, parseISO, differenceInYears } from "date-fns";
import { ptBR } from "date-fns/locale";

export default function ProntuarioFichaPaciente({ paciente }) {
  const calcularIdade = () => {
    if (!paciente.data_nascimento) return null;
    return differenceInYears(new Date(), new Date(paciente.data_nascimento));
  };

  const idade = calcularIdade();
  const ehMenorDeIdade = idade !== null && idade < 18;

  const tipoPagamentoLabels = {
    particular: "Particular",
    convenio: "Convênio",
    plano_saude: "Plano de Saúde",
    pacote: "Pacote de Serviços"
  };

  const formaPagamentoLabels = {
    dinheiro: "Dinheiro",
    cartao_credito: "Cartão de Crédito",
    cartao_debito: "Cartão de Débito",
    pix: "PIX",
    transferencia: "Transferência",
    boleto: "Boleto",
    debito_automatico: "Débito Automático"
  };

  const parentescoLabels = {
    pai: "Pai",
    mae: "Mãe",
    avo: "Avô/Avó",
    tio: "Tio/Tia",
    irmao: "Irmão/Irmã",
    tutor: "Tutor Legal",
    outro: "Outro"
  };

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

  return (
    <div className="space-y-6">
      {/* Cabeçalho com Foto e Dados Principais */}
      <Card className="border-none shadow-lg bg-gradient-to-br from-white to-slate-50">
        <CardContent className="p-6">
          <div className="flex items-start gap-6">
            {paciente.foto_url ? (
              <img
                src={paciente.foto_url}
                alt={paciente.nome_completo}
                className="w-32 h-32 rounded-full object-cover border-4 border-white shadow-xl"
              />
            ) : (
              <div className="w-32 h-32 rounded-full bg-gradient-to-br from-cyan-500 to-teal-500 flex items-center justify-center text-white font-bold text-4xl shadow-xl border-4 border-white">
                {paciente.nome_completo?.charAt(0).toUpperCase()}
              </div>
            )}

            <div className="flex-1">
              <div className="flex items-start justify-between mb-4">
                <div>
                  <h2 className="text-3xl font-bold text-slate-800 mb-2">
                    {paciente.nome_completo}
                  </h2>
                  {idade !== null && (
                    <p className="text-lg text-slate-600">
                      {idade} anos
                      {ehMenorDeIdade && (
                        <span className="ml-2 px-2 py-1 bg-amber-100 text-amber-700 rounded text-sm font-medium">
                          Menor de idade
                        </span>
                      )}
                    </p>
                  )}
                </div>
                <span className={`px-4 py-2 rounded-full text-sm font-semibold border ${statusColors[paciente.status]}`}>
                  {statusLabels[paciente.status]}
                </span>
              </div>

              <div className="grid md:grid-cols-2 gap-3">
                {paciente.cpf && (
                  <div className="flex items-center gap-2 text-slate-600">
                    <FileText className="w-4 h-4 text-cyan-600" />
                    <span className="text-sm">
                      <strong>CPF:</strong> {paciente.cpf}
                    </span>
                  </div>
                )}
                {paciente.data_nascimento && (
                  <div className="flex items-center gap-2 text-slate-600">
                    <Calendar className="w-4 h-4 text-purple-600" />
                    <span className="text-sm">
                      <strong>Nascimento:</strong> {format(new Date(paciente.data_nascimento), "dd/MM/yyyy")}
                    </span>
                  </div>
                )}
                {paciente.telefone && (
                  <div className="flex items-center gap-2 text-slate-600">
                    <Phone className="w-4 h-4 text-green-600" />
                    <span className="text-sm">
                      <strong>Telefone:</strong> {paciente.telefone}
                    </span>
                  </div>
                )}
                {paciente.telefone_emergencia && (
                  <div className="flex items-center gap-2 text-slate-600">
                    <AlertCircle className="w-4 h-4 text-red-600" />
                    <span className="text-sm">
                      <strong>Emergência:</strong> {paciente.telefone_emergencia}
                    </span>
                  </div>
                )}
                {paciente.email && (
                  <div className="flex items-center gap-2 text-slate-600 md:col-span-2">
                    <Mail className="w-4 h-4 text-blue-600" />
                    <span className="text-sm">
                      <strong>Email:</strong> {paciente.email}
                    </span>
                  </div>
                )}
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      <div className="grid md:grid-cols-2 gap-6">
        {/* Dados de Endereço */}
        {(paciente.endereco || paciente.cidade || paciente.estado || paciente.cep) && (
          <Card className="border-none shadow-lg">
            <CardHeader className="pb-3">
              <CardTitle className="flex items-center gap-2 text-lg">
                <MapPin className="w-5 h-5 text-cyan-600" />
                Endereço
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              {paciente.endereco && (
                <p className="text-sm text-slate-700">
                  <strong>Logradouro:</strong> {paciente.endereco}
                </p>
              )}
              <div className="flex gap-4 text-sm text-slate-700">
                {paciente.cidade && (
                  <p><strong>Cidade:</strong> {paciente.cidade}</p>
                )}
                {paciente.estado && (
                  <p><strong>Estado:</strong> {paciente.estado}</p>
                )}
              </div>
              {paciente.cep && (
                <p className="text-sm text-slate-700">
                  <strong>CEP:</strong> {paciente.cep}
                </p>
              )}
            </CardContent>
          </Card>
        )}

        {/* Convênio */}
        {(paciente.convenio || paciente.numero_convenio) && (
          <Card className="border-none shadow-lg">
            <CardHeader className="pb-3">
              <CardTitle className="flex items-center gap-2 text-lg">
                <Building className="w-5 h-5 text-purple-600" />
                Convênio / Plano de Saúde
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              {paciente.convenio && (
                <p className="text-sm text-slate-700">
                  <strong>Convênio:</strong> {paciente.convenio}
                </p>
              )}
              {paciente.numero_convenio && (
                <p className="text-sm text-slate-700">
                  <strong>Número da Carteirinha:</strong> {paciente.numero_convenio}
                </p>
              )}
            </CardContent>
          </Card>
        )}
      </div>

      {/* Responsável Legal */}
      {(ehMenorDeIdade || paciente.nome_responsavel_legal) && (
        <Card className="border-none shadow-lg bg-amber-50/50">
          <CardHeader className="pb-3 border-b border-amber-200">
            <CardTitle className="flex items-center gap-2 text-lg">
              <Users className="w-5 h-5 text-amber-600" />
              Responsável Legal
              {ehMenorDeIdade && (
                <span className="text-xs bg-amber-100 text-amber-700 px-2 py-1 rounded">
                  Obrigatório - Menor de idade
                </span>
              )}
            </CardTitle>
          </CardHeader>
          <CardContent className="pt-4">
            {paciente.nome_responsavel_legal ? (
              <div className="grid md:grid-cols-2 gap-4">
                <div>
                  <p className="text-sm text-slate-600 mb-1">Nome Completo</p>
                  <p className="text-base font-semibold text-slate-800">
                    {paciente.nome_responsavel_legal}
                  </p>
                </div>
                {paciente.parentesco && (
                  <div>
                    <p className="text-sm text-slate-600 mb-1">Parentesco</p>
                    <p className="text-base font-semibold text-slate-800">
                      {parentescoLabels[paciente.parentesco] || paciente.parentesco}
                    </p>
                  </div>
                )}
                {paciente.cpf_responsavel_legal && (
                  <div>
                    <p className="text-sm text-slate-600 mb-1">CPF</p>
                    <p className="text-base font-semibold text-slate-800">
                      {paciente.cpf_responsavel_legal}
                    </p>
                  </div>
                )}
                {paciente.rg_responsavel_legal && (
                  <div>
                    <p className="text-sm text-slate-600 mb-1">RG</p>
                    <p className="text-base font-semibold text-slate-800">
                      {paciente.rg_responsavel_legal}
                    </p>
                  </div>
                )}
                {paciente.telefone_responsavel_legal && (
                  <div>
                    <p className="text-sm text-slate-600 mb-1">Telefone</p>
                    <p className="text-base font-semibold text-slate-800">
                      {paciente.telefone_responsavel_legal}
                    </p>
                  </div>
                )}
                {paciente.email_responsavel_legal && (
                  <div>
                    <p className="text-sm text-slate-600 mb-1">Email</p>
                    <p className="text-base font-semibold text-slate-800">
                      {paciente.email_responsavel_legal}
                    </p>
                  </div>
                )}
              </div>
            ) : ehMenorDeIdade ? (
              <div className="text-center py-4">
                <AlertCircle className="w-12 h-12 text-amber-400 mx-auto mb-2" />
                <p className="text-amber-700 font-medium">
                  Responsável legal não cadastrado
                </p>
                <p className="text-sm text-amber-600 mt-1">
                  É obrigatório cadastrar um responsável legal para menores de idade
                </p>
              </div>
            ) : null}
          </CardContent>
        </Card>
      )}

      {/* Responsável Financeiro */}
      <Card className="border-none shadow-lg bg-blue-50/50">
        <CardHeader className="pb-3 border-b border-blue-200">
          <CardTitle className="flex items-center gap-2 text-lg">
            <Wallet className="w-5 h-5 text-blue-600" />
            Responsável Financeiro
          </CardTitle>
        </CardHeader>
        <CardContent className="pt-4 space-y-4">
          {/* Opção 1: Próprio Paciente */}
          <div className={`flex items-start gap-3 p-4 rounded-xl border-2 transition-all ${paciente.responsavel_financeiro_tipo === 'proprio_paciente' || paciente.eh_proprio_responsavel_financeiro
              ? 'border-blue-500 bg-blue-50/50'
              : 'border-slate-200 bg-white opacity-60'
            }`}>
            <div className={`mt-1 ${paciente.responsavel_financeiro_tipo === 'proprio_paciente' || paciente.eh_proprio_responsavel_financeiro
                ? 'text-blue-600'
                : 'text-slate-400'
              }`}>
              {paciente.responsavel_financeiro_tipo === 'proprio_paciente' || paciente.eh_proprio_responsavel_financeiro ? (
                <CheckCircle2 className="w-5 h-5 fill-blue-100" />
              ) : (
                <Circle className="w-5 h-5" />
              )}
            </div>
            <div>
              <p className={`font-semibold text-base ${paciente.responsavel_financeiro_tipo === 'proprio_paciente' || paciente.eh_proprio_responsavel_financeiro
                  ? 'text-blue-900'
                  : 'text-slate-700'
                }`}>
                O Próprio Paciente
              </p>
              <p className="text-sm text-slate-500">
                O paciente é responsável pelos pagamentos
              </p>
            </div>
            {(paciente.responsavel_financeiro_tipo === 'proprio_paciente' || paciente.eh_proprio_responsavel_financeiro) && (
              <CheckCircle2 className="w-6 h-6 text-blue-500 ml-auto" />
            )}
          </div>

          {/* Opção 2: Responsável Legal */}
          <div className={`flex items-start gap-3 p-4 rounded-xl border-2 transition-all ${paciente.responsavel_financeiro_tipo === 'responsavel_legal'
              ? 'border-blue-500 bg-blue-50/50'
              : 'border-slate-200 bg-white opacity-60'
            }`}>
            <div className={`mt-1 ${paciente.responsavel_financeiro_tipo === 'responsavel_legal'
                ? 'text-blue-600'
                : 'text-slate-400'
              }`}>
              {paciente.responsavel_financeiro_tipo === 'responsavel_legal' ? (
                <CheckCircle2 className="w-5 h-5 fill-blue-100" />
              ) : (
                <Circle className="w-5 h-5" />
              )}
            </div>
            <div className="flex-1">
              <p className={`font-semibold text-base ${paciente.responsavel_financeiro_tipo === 'responsavel_legal'
                  ? 'text-blue-900'
                  : 'text-slate-700'
                }`}>
                Responsável Legal
              </p>
              <p className="text-sm text-slate-500">
                {paciente.nome_responsavel_legal || 'Nome não informado'}
                {paciente.telefone_responsavel_legal && ` - ${paciente.telefone_responsavel_legal}`}
                {paciente.cpf_responsavel_legal && ` - ${paciente.cpf_responsavel_legal}`}
              </p>
            </div>
            {paciente.responsavel_financeiro_tipo === 'responsavel_legal' && (
              <CheckCircle2 className="w-6 h-6 text-blue-500 ml-auto" />
            )}
          </div>

          {/* Opção 3: Outra Pessoa */}
          <div className={`flex items-start gap-3 p-4 rounded-xl border-2 transition-all ${!['proprio_paciente', 'responsavel_legal'].includes(paciente.responsavel_financeiro_tipo) && paciente.responsavel_financeiro_tipo
              ? 'border-blue-500 bg-blue-50/50'
              : 'border-slate-200 bg-white opacity-60'
            }`}>
            <div className={`mt-1 ${!['proprio_paciente', 'responsavel_legal'].includes(paciente.responsavel_financeiro_tipo) && paciente.responsavel_financeiro_tipo
                ? 'text-blue-600'
                : 'text-slate-400'
              }`}>
              {!['proprio_paciente', 'responsavel_legal'].includes(paciente.responsavel_financeiro_tipo) && paciente.responsavel_financeiro_tipo ? (
                <CheckCircle2 className="w-5 h-5 fill-blue-100" />
              ) : (
                <Circle className="w-5 h-5" />
              )}
            </div>
            <div className="flex-1">
              <p className={`font-semibold text-base ${!['proprio_paciente', 'responsavel_legal'].includes(paciente.responsavel_financeiro_tipo) && paciente.responsavel_financeiro_tipo
                  ? 'text-blue-900'
                  : 'text-slate-700'
                }`}>
                Outra Pessoa
              </p>
              <p className="text-sm text-slate-500">
                {(!['proprio_paciente', 'responsavel_legal'].includes(paciente.responsavel_financeiro_tipo) && paciente.responsavel_financeiro_tipo) ? (
                  `${paciente.nome_responsavel_financeiro || 'Nome não informado'} - ${paciente.telefone_responsavel_financeiro || paciente.cpf_responsavel_financeiro || 'Sem contato'}`
                ) : (
                  "Informar dados de outra pessoa responsável"
                )}
              </p>
            </div>
            {(!['proprio_paciente', 'responsavel_legal'].includes(paciente.responsavel_financeiro_tipo) && paciente.responsavel_financeiro_tipo) && (
              <CheckCircle2 className="w-6 h-6 text-blue-500 ml-auto" />
            )}
          </div>

          <div className="mt-4 p-3 bg-blue-50 rounded-lg border border-blue-100 flex items-center gap-2 text-sm text-blue-800">
            <CheckCircle2 className="w-4 h-4 text-blue-600" />
            <span>
              As cobranças e comunicações financeiras serão direcionadas ao responsável: <strong>
                {paciente.responsavel_financeiro_tipo === 'proprio_paciente' || paciente.eh_proprio_responsavel_financeiro ? paciente.nome_completo :
                  paciente.responsavel_financeiro_tipo === 'responsavel_legal' ? paciente.nome_responsavel_legal :
                    paciente.nome_responsavel_financeiro || 'Não definido'}
              </strong>
            </span>
          </div>

        </CardContent>
      </Card>

      {/* Informações de Pagamento */}
      <Card className="border-none shadow-lg bg-gradient-to-br from-green-50 to-emerald-50">
        <CardHeader className="pb-3 border-b border-green-200">
          <CardTitle className="flex items-center gap-2 text-lg">
            <DollarSign className="w-5 h-5 text-green-600" />
            Informações de Pagamento
          </CardTitle>
        </CardHeader>
        <CardContent className="pt-4">
          <div className="grid md:grid-cols-2 gap-4">
            {paciente.tipo_pagamento && (
              <div>
                <p className="text-sm text-slate-600 mb-1">Tipo de Pagamento</p>
                <p className="text-base font-semibold text-slate-800">
                  {tipoPagamentoLabels[paciente.tipo_pagamento] || paciente.tipo_pagamento}
                </p>
              </div>
            )}
            {paciente.forma_pagamento_preferencial && (
              <div>
                <p className="text-sm text-slate-600 mb-1">Forma de Pagamento Preferencial</p>
                <p className="text-base font-semibold text-slate-800">
                  {formaPagamentoLabels[paciente.forma_pagamento_preferencial] || paciente.forma_pagamento_preferencial}
                </p>
              </div>
            )}
            {paciente.dia_vencimento && (
              <div>
                <p className="text-sm text-slate-600 mb-1">Dia de Vencimento</p>
                <p className="text-base font-semibold text-slate-800">
                  Dia {paciente.dia_vencimento}
                </p>
              </div>
            )}
            {paciente.tipo_pagamento === 'pacote' && paciente.pacote_nome && (
              <div className="md:col-span-2">
                <div className="flex items-center gap-2 p-3 bg-green-100 rounded-lg border border-green-200">
                  <Package className="w-5 h-5 text-green-700" />
                  <div>
                    <p className="text-sm text-green-600">Pacote Contratado</p>
                    <p className="font-semibold text-green-900">{paciente.pacote_nome}</p>
                  </div>
                </div>
              </div>
            )}
            {paciente.dados_bancarios && (
              <div className="md:col-span-2">
                <p className="text-sm text-slate-600 mb-1">Dados Bancários (Débito Automático)</p>
                <div className="p-3 bg-white rounded-lg border border-slate-200">
                  <p className="text-sm text-slate-800 whitespace-pre-wrap">
                    {paciente.dados_bancarios}
                  </p>
                </div>
              </div>
            )}
            {paciente.observacoes_financeiras && (
              <div className="md:col-span-2">
                <p className="text-sm text-slate-600 mb-1">Observações Financeiras</p>
                <div className="p-3 bg-white rounded-lg border border-slate-200">
                  <p className="text-sm text-slate-800 whitespace-pre-wrap">
                    {paciente.observacoes_financeiras}
                  </p>
                </div>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Observações Gerais */}
      {paciente.observacoes && (
        <Card className="border-none shadow-lg">
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-2 text-lg">
              <FileText className="w-5 h-5 text-slate-600" />
              Observações Gerais
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="p-4 bg-slate-50 rounded-lg border border-slate-200">
              <p className="text-sm text-slate-800 whitespace-pre-wrap">
                {paciente.observacoes}
              </p>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}