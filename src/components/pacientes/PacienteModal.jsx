
import React, { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { format } from "date-fns";
import {
  User,
  Phone,
  Mail,
  MapPin,
  CreditCard,
  Camera,
  Upload,
  X,
  CheckCircle,
  Users,
  Wallet,
  FileText,
  Package,
  Key,
  Loader2,
  AlertCircle,
  Calendar,
  DollarSign
} from "lucide-react";

export default function PacienteModal({ paciente, onClose }) {
  const queryClient = useQueryClient();
  const [activeTab, setActiveTab] = useState('dados-gerais');
  const [formData, setFormData] = useState(paciente || {
    nome_completo: '',
    cpf: '',
    data_nascimento: '',
    telefone: '',
    telefone_emergencia: '',
    email: '',
    endereco: '',
    cidade: '',
    estado: '',
    cep: '',
    convenio: '',
    numero_convenio: '',
    tipo_pagamento: 'particular',
    pacote_id: '',
    pacote_nome: '',
    contrato_pacote_id: '',
    observacoes: '',
    status: 'ativo',
    foto_url: '',
    nome_responsavel_legal: '',
    cpf_responsavel_legal: '',
    rg_responsavel_legal: '',
    telefone_responsavel_legal: '',
    email_responsavel_legal: '',
    parentesco: '',
    eh_proprio_responsavel_financeiro: true,
    responsavel_financeiro_tipo: 'proprio_paciente',
    nome_responsavel_financeiro: '',
    cpf_responsavel_financeiro: '',
    telefone_responsavel_financeiro: '',
    email_responsavel_financeiro: '',
    forma_pagamento_preferencial: 'pix',
    dados_bancarios: '',
    dia_vencimento: 10,
    observacoes_financeiras: '',
    acesso_plataforma_ativo: false,
    data_convite_acesso: '',
    data_primeiro_acesso: '',
    ultimo_acesso: '',
    usuario_id: ''
  });
  const [uploadingFoto, setUploadingFoto] = useState(false);
  const [fotoPreview, setFotoPreview] = useState(paciente?.foto_url || '');
  const [enviarConviteAcesso, setEnviarConviteAcesso] = useState(false);
  const [enviandoConvite, setEnviandoConvite] = useState(false);

  const { data: pacotes = [] } = useQuery({
    queryKey: ['pacotes'],
    queryFn: () => base44.entities.PacoteServico.list(),
  });

  const { data: contratos = [] } = useQuery({
    queryKey: ['contratos-paciente', paciente?.id],
    queryFn: () => paciente?.id ? base44.entities.Contrato.filter({ paciente_id: paciente.id }) : [],
    enabled: !!paciente?.id,
  });

  const { data: contrato } = useQuery({
    queryKey: ['contrato-paciente', paciente?.id],
    queryFn: async () => {
      if (!paciente?.id) return null;
      const contratos = await base44.entities.Contrato.filter({
        paciente_id: paciente.id,
        status: 'ativo'
      });
      return contratos && contratos.length > 0 ? contratos[0] : null;
    },
    enabled: !!paciente?.id,
  });

  const ehMenorDeIdade = () => {
    if (!formData.data_nascimento) return false;
    const hoje = new Date();
    const nascimento = new Date(formData.data_nascimento);
    const idade = hoje.getFullYear() - nascimento.getFullYear();
    const mesAtual = hoje.getMonth();
    const mesNascimento = nascimento.getMonth();

    if (mesAtual < mesNascimento || (mesAtual === mesNascimento && hoje.getDate() < nascimento.getDate())) {
      return idade - 1 < 18;
    }
    return idade < 18;
  };

  const saveMutation = useMutation({
    mutationFn: async (data) => {
      if (paciente) {
        return await base44.entities.Paciente.update(paciente.id, data);
      } else {
        return await base44.entities.Paciente.create(data);
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries(['pacientes']);
      onClose();
    },
  });

  const handleFotoUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      alert('Por favor, selecione apenas arquivos de imagem');
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      alert('A imagem deve ter no máximo 5MB');
      return;
    }

    setUploadingFoto(true);
    try {
      const { file_url } = await base44.integrations.Core.UploadFile({ file });
      setFormData({ ...formData, foto_url: file_url });
      setFotoPreview(file_url);
    } catch (error) {
      console.error('Erro ao fazer upload da foto:', error);
      alert('Erro ao fazer upload da foto. Tente novamente.');
    } finally {
      setUploadingFoto(false);
    }
  };

  const handleRemoverFoto = () => {
    setFormData({ ...formData, foto_url: '' });
    setFotoPreview('');
  };

  const handlePacoteChange = (pacoteId) => {
    const pacote = pacotes.find(p => p.id === pacoteId);
    setFormData({
      ...formData,
      pacote_id: pacoteId,
      pacote_nome: pacote?.nome || '',
      tipo_pagamento: 'pacote'
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    const dataToSave = { ...formData };

    if (enviarConviteAcesso && formData.email && !formData.acesso_plataforma_ativo) {
      dataToSave.acesso_plataforma_ativo = true;
      dataToSave.data_convite_acesso = new Date().toISOString();
    }

    await saveMutation.mutateAsync(dataToSave);

    if (enviarConviteAcesso && formData.email) {
      try {
        alert(`Convite de acesso enviado para ${formData.email}`);
      } catch (error) {
        console.error('Erro ao enviar convite:', error);
      }
    }
  };

  const pacotesAtivos = pacotes.filter(p => p.ativo);
  const contratoAtivo = contratos.find(c => c.status === 'ativo');

  return (
    <Dialog open={true} onOpenChange={onClose}>
      <DialogContent className="max-w-5xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-2xl font-bold text-slate-800">
            {paciente ? 'Editar Paciente' : 'Novo Paciente'}
          </DialogTitle>
          <div className="text-sm text-slate-500">
            Preencha os dados abaixo para {paciente ? 'editar o' : 'cadastrar um novo'} paciente.
          </div>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-6">
          <Tabs value={activeTab} onValueChange={setActiveTab}>
            <TabsList className="grid w-full grid-cols-5">
              <TabsTrigger value="dados-gerais" className="gap-2">
                <User className="w-4 h-4" />
                Dados Gerais
              </TabsTrigger>
              <TabsTrigger value="responsavel-legal" className="gap-2">
                <Users className="w-4 h-4" />
                Responsável Legal
              </TabsTrigger>
              <TabsTrigger value="responsavel-financeiro" className="gap-2">
                <Wallet className="w-4 h-4" />
                Resp. Financeiro
              </TabsTrigger>
              <TabsTrigger value="servico-contratado" className="gap-2">
                <FileText className="w-4 h-4" />
                Serviço Contratado
              </TabsTrigger>
              <TabsTrigger value="acesso-plataforma" className="gap-2">
                <Key className="w-4 h-4" />
                Acesso
              </TabsTrigger>
            </TabsList>

            <TabsContent value="dados-gerais" className="space-y-6 mt-6">
              <div className="flex items-center gap-6">
                <div className="relative">
                  {fotoPreview ? (
                    <div className="relative w-24 h-24 rounded-full overflow-hidden border-4 border-cyan-200">
                      <img src={fotoPreview} alt="Foto do paciente" className="w-full h-full object-cover" />
                      <button
                        type="button"
                        onClick={handleRemoverFoto}
                        className="absolute top-0 right-0 bg-red-500 text-white rounded-full p-1 hover:bg-red-600"
                      >
                        <X className="w-3 h-3" />
                      </button>
                    </div>
                  ) : (
                    <div className="w-24 h-24 rounded-full bg-slate-100 flex items-center justify-center border-4 border-cyan-200">
                      <Camera className="w-8 h-8 text-slate-400" />
                    </div>
                  )}
                </div>
                <div>
                  <Label htmlFor="foto-upload" className="cursor-pointer">
                    <div className="flex items-center gap-2 px-4 py-2 bg-cyan-50 hover:bg-cyan-100 rounded-lg border-2 border-cyan-200 transition-colors">
                      <Upload className="w-4 h-4 text-cyan-600" />
                      <span className="text-sm font-medium text-cyan-700">
                        {uploadingFoto ? 'Enviando...' : 'Enviar Foto'}
                      </span>
                    </div>
                  </Label>
                  <input
                    id="foto-upload"
                    type="file"
                    accept="image/*"
                    onChange={handleFotoUpload}
                    className="hidden"
                    disabled={uploadingFoto}
                  />
                  <p className="text-xs text-slate-500 mt-1">JPG, PNG até 5MB</p>
                </div>
              </div>

              <div className="grid md:grid-cols-2 gap-4">
                <div className="space-y-2 md:col-span-2">
                  <Label>Nome Completo *</Label>
                  <Input
                    value={formData.nome_completo}
                    onChange={(e) => setFormData({ ...formData, nome_completo: e.target.value })}
                    required
                  />
                </div>

                <div className="space-y-2">
                  <Label>CPF</Label>
                  <Input
                    value={formData.cpf}
                    onChange={(e) => setFormData({ ...formData, cpf: e.target.value })}
                    placeholder="000.000.000-00"
                  />
                </div>

                <div className="space-y-2">
                  <Label>Data de Nascimento</Label>
                  <Input
                    type="date"
                    value={formData.data_nascimento}
                    onChange={(e) => setFormData({ ...formData, data_nascimento: e.target.value })}
                  />
                </div>

                <div className="space-y-2">
                  <Label>Telefone *</Label>
                  <Input
                    value={formData.telefone}
                    onChange={(e) => setFormData({ ...formData, telefone: e.target.value })}
                    placeholder="(00) 00000-0000"
                    required
                  />
                </div>

                <div className="space-y-2">
                  <Label>Telefone Emergência</Label>
                  <Input
                    value={formData.telefone_emergencia}
                    onChange={(e) => setFormData({ ...formData, telefone_emergencia: e.target.value })}
                    placeholder="(00) 00000-0000"
                  />
                </div>

                <div className="space-y-2 md:col-span-2">
                  <Label>Email</Label>
                  <Input
                    type="email"
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    placeholder="email@exemplo.com"
                  />
                </div>

                <div className="space-y-2 md:col-span-2">
                  <Label>Endereço</Label>
                  <Input
                    value={formData.endereco}
                    onChange={(e) => setFormData({ ...formData, endereco: e.target.value })}
                  />
                </div>

                <div className="space-y-2">
                  <Label>Cidade</Label>
                  <Input
                    value={formData.cidade}
                    onChange={(e) => setFormData({ ...formData, cidade: e.target.value })}
                  />
                </div>

                <div className="space-y-2">
                  <Label>Estado</Label>
                  <Input
                    value={formData.estado}
                    onChange={(e) => setFormData({ ...formData, estado: e.target.value })}
                    placeholder="SP"
                  />
                </div>

                <div className="space-y-2">
                  <Label>CEP</Label>
                  <Input
                    value={formData.cep}
                    onChange={(e) => setFormData({ ...formData, cep: e.target.value })}
                    placeholder="00000-000"
                  />
                </div>

                <div className="space-y-2">
                  <Label>Status</Label>
                  <Select value={formData.status} onValueChange={(val) => setFormData({ ...formData, status: val })}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="ativo">Ativo</SelectItem>
                      <SelectItem value="inativo">Inativo</SelectItem>
                      <SelectItem value="bloqueado">Bloqueado</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2 md:col-span-2">
                  <Label>Observações</Label>
                  <Textarea
                    value={formData.observacoes}
                    onChange={(e) => setFormData({ ...formData, observacoes: e.target.value })}
                    rows={3}
                  />
                </div>
              </div>
            </TabsContent>

            <TabsContent value="responsavel-legal" className="space-y-6 mt-6">
              {ehMenorDeIdade() && (
                <Alert className="bg-amber-50 border-amber-200">
                  <AlertCircle className="h-4 w-4 text-amber-600" />
                  <AlertDescription className="text-amber-800">
                    Este paciente é menor de idade. É obrigatório informar um responsável legal.
                  </AlertDescription>
                </Alert>
              )}

              <div className="grid md:grid-cols-2 gap-4">
                <div className="space-y-2 md:col-span-2">
                  <Label>Nome do Responsável Legal</Label>
                  <Input
                    value={formData.nome_responsavel_legal}
                    onChange={(e) => setFormData({ ...formData, nome_responsavel_legal: e.target.value })}
                  />
                </div>

                <div className="space-y-2">
                  <Label>CPF</Label>
                  <Input
                    value={formData.cpf_responsavel_legal}
                    onChange={(e) => setFormData({ ...formData, cpf_responsavel_legal: e.target.value })}
                    placeholder="000.000.000-00"
                  />
                </div>

                <div className="space-y-2">
                  <Label>RG</Label>
                  <Input
                    value={formData.rg_responsavel_legal}
                    onChange={(e) => setFormData({ ...formData, rg_responsavel_legal: e.target.value })}
                  />
                </div>

                <div className="space-y-2">
                  <Label>Telefone</Label>
                  <Input
                    value={formData.telefone_responsavel_legal}
                    onChange={(e) => setFormData({ ...formData, telefone_responsavel_legal: e.target.value })}
                    placeholder="(00) 00000-0000"
                  />
                </div>

                <div className="space-y-2">
                  <Label>Email</Label>
                  <Input
                    type="email"
                    value={formData.email_responsavel_legal}
                    onChange={(e) => setFormData({ ...formData, email_responsavel_legal: e.target.value })}
                  />
                </div>

                <div className="space-y-2 md:col-span-2">
                  <Label>Parentesco</Label>
                  <Input
                    value={formData.parentesco}
                    onChange={(e) => setFormData({ ...formData, parentesco: e.target.value })}
                    placeholder="Ex: Pai, Mãe, Tutor Legal..."
                  />
                </div>
              </div>
            </TabsContent>

            <TabsContent value="responsavel-financeiro" className="space-y-6 mt-6">
              <div className="space-y-4">
                <Label className="text-lg font-semibold">Quem é o Responsável Financeiro?</Label>

                <div className="space-y-3">
                  <div
                    className={`p-4 rounded-lg border-2 cursor-pointer transition-all ${formData.responsavel_financeiro_tipo === 'proprio_paciente'
                        ? 'border-green-500 bg-green-50'
                        : 'border-slate-200 hover:border-green-300'
                      }`}
                    onClick={() => setFormData({
                      ...formData,
                      responsavel_financeiro_tipo: 'proprio_paciente',
                      eh_proprio_responsavel_financeiro: true,
                      nome_responsavel_financeiro: '',
                      cpf_responsavel_financeiro: '',
                      telefone_responsavel_financeiro: '',
                      email_responsavel_financeiro: ''
                    })}
                  >
                    <div className="flex items-center gap-3">
                      <input
                        type="radio"
                        name="resp_financeiro"
                        checked={formData.responsavel_financeiro_tipo === 'proprio_paciente'}
                        onChange={() => { }}
                        className="w-4 h-4 text-green-600"
                      />
                      <div className="flex-1">
                        <div className="flex items-center gap-2">
                          <User className="w-5 h-5 text-green-600" />
                          <span className="font-semibold text-slate-800">O Próprio Paciente</span>
                        </div>
                        <p className="text-sm text-slate-600 mt-1">
                          O paciente é responsável pelos pagamentos
                        </p>
                      </div>
                      {formData.responsavel_financeiro_tipo === 'proprio_paciente' && (
                        <CheckCircle className="w-6 h-6 text-green-600" />
                      )}
                    </div>
                  </div>

                  {formData.nome_responsavel_legal && (
                    <div
                      className={`p-4 rounded-lg border-2 cursor-pointer transition-all ${formData.responsavel_financeiro_tipo === 'responsavel_legal'
                          ? 'border-blue-500 bg-blue-50'
                          : 'border-slate-200 hover:border-blue-300'
                        }`}
                      onClick={() => setFormData({
                        ...formData,
                        responsavel_financeiro_tipo: 'responsavel_legal',
                        eh_proprio_responsavel_financeiro: false,
                        nome_responsavel_financeiro: '',
                        cpf_responsavel_financeiro: '',
                        telefone_responsavel_financeiro: '',
                        email_responsavel_financeiro: ''
                      })}
                    >
                      <div className="flex items-center gap-3">
                        <input
                          type="radio"
                          name="resp_financeiro"
                          checked={formData.responsavel_financeiro_tipo === 'responsavel_legal'}
                          onChange={() => { }}
                          className="w-4 h-4 text-blue-600"
                        />
                        <div className="flex-1">
                          <div className="flex items-center gap-2">
                            <Users className="w-5 h-5 text-blue-600" />
                            <span className="font-semibold text-slate-800">Responsável Legal</span>
                          </div>
                          <p className="text-sm text-slate-600 mt-1">
                            {formData.nome_responsavel_legal} - {formData.cpf_responsavel_legal}
                          </p>
                        </div>
                        {formData.responsavel_financeiro_tipo === 'responsavel_legal' && (
                          <CheckCircle className="w-6 h-6 text-blue-600" />
                        )}
                      </div>
                    </div>
                  )}

                  <div
                    className={`p-4 rounded-lg border-2 cursor-pointer transition-all ${formData.responsavel_financeiro_tipo === 'outra_pessoa'
                        ? 'border-purple-500 bg-purple-50'
                        : 'border-slate-200 hover:border-purple-300'
                      }`}
                    onClick={() => setFormData({
                      ...formData,
                      responsavel_financeiro_tipo: 'outra_pessoa',
                      eh_proprio_responsavel_financeiro: false
                    })}
                  >
                    <div className="flex items-center gap-3">
                      <input
                        type="radio"
                        name="resp_financeiro"
                        checked={formData.responsavel_financeiro_tipo === 'outra_pessoa'}
                        onChange={() => { }}
                        className="w-4 h-4 text-purple-600"
                      />
                      <div className="flex-1">
                        <div className="flex items-center gap-2">
                          <Wallet className="w-5 h-5 text-purple-600" />
                          <span className="font-semibold text-slate-800">Outra Pessoa</span>
                        </div>
                        <p className="text-sm text-slate-600 mt-1">
                          Informar dados de outra pessoa responsável
                        </p>
                      </div>
                      {formData.responsavel_financeiro_tipo === 'outra_pessoa' && (
                        <CheckCircle className="w-6 h-6 text-purple-600" />
                      )}
                    </div>
                  </div>
                </div>

                {formData.responsavel_financeiro_tipo === 'outra_pessoa' && (
                  <div className="mt-6 p-6 bg-purple-50 rounded-lg border-2 border-purple-200">
                    <Label className="text-lg font-semibold text-purple-900 mb-4 block">
                      Dados do Responsável Financeiro
                    </Label>
                    <div className="grid md:grid-cols-2 gap-4">
                      <div className="space-y-2 md:col-span-2">
                        <Label>Nome Completo *</Label>
                        <Input
                          value={formData.nome_responsavel_financeiro}
                          onChange={(e) => setFormData({ ...formData, nome_responsavel_financeiro: e.target.value })}
                          required={formData.responsavel_financeiro_tipo === 'outra_pessoa'}
                        />
                      </div>

                      <div className="space-y-2">
                        <Label>CPF *</Label>
                        <Input
                          value={formData.cpf_responsavel_financeiro}
                          onChange={(e) => setFormData({ ...formData, cpf_responsavel_financeiro: e.target.value })}
                          placeholder="000.000.000-00"
                          required={formData.responsavel_financeiro_tipo === 'outra_pessoa'}
                        />
                      </div>

                      <div className="space-y-2">
                        <Label>Telefone *</Label>
                        <Input
                          value={formData.telefone_responsavel_financeiro}
                          onChange={(e) => setFormData({ ...formData, telefone_responsavel_financeiro: e.target.value })}
                          placeholder="(00) 00000-0000"
                          required={formData.responsavel_financeiro_tipo === 'outra_pessoa'}
                        />
                      </div>

                      <div className="space-y-2 md:col-span-2">
                        <Label>Email</Label>
                        <Input
                          type="email"
                          value={formData.email_responsavel_financeiro}
                          onChange={(e) => setFormData({ ...formData, email_responsavel_financeiro: e.target.value })}
                        />
                      </div>
                    </div>
                  </div>
                )}

                {formData.responsavel_financeiro_tipo === 'proprio_paciente' && (
                  <Alert className="bg-green-50 border-green-200">
                    <AlertDescription className="text-sm text-green-800">
                      ✓ As cobranças e comunicações financeiras serão direcionadas ao próprio paciente: <strong>{formData.nome_completo || 'Paciente'}</strong>
                    </AlertDescription>
                  </Alert>
                )}

                {formData.responsavel_financeiro_tipo === 'responsavel_legal' && (
                  <Alert className="bg-blue-50 border-blue-200">
                    <AlertDescription className="text-sm text-blue-800">
                      ✓ As cobranças e comunicações financeiras serão direcionadas ao responsável legal: <strong>{formData.nome_responsavel_legal}</strong>
                    </AlertDescription>
                  </Alert>
                )}

                {formData.responsavel_financeiro_tipo === 'outra_pessoa' && formData.nome_responsavel_financeiro && (
                  <Alert className="bg-purple-50 border-purple-200">
                    <AlertDescription className="text-sm text-purple-800">
                      ✓ As cobranças e comunicações financeiras serão direcionadas para: <strong>{formData.nome_responsavel_financeiro}</strong>
                    </AlertDescription>
                  </Alert>
                )}
              </div>
            </TabsContent>

            <TabsContent value="servico-contratado" className="space-y-6 mt-6">
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label>Tipo de Pagamento</Label>
                  <Select
                    value={formData.tipo_pagamento}
                    onValueChange={(val) => setFormData({ ...formData, tipo_pagamento: val })}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="particular">Particular</SelectItem>
                      <SelectItem value="convenio">Convênio</SelectItem>
                      <SelectItem value="plano_saude">Plano de Saúde</SelectItem>
                      <SelectItem value="pacote">Pacote</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                {formData.tipo_pagamento === 'convenio' && (
                  <>
                    <div className="space-y-2">
                      <Label>Convênio</Label>
                      <Input
                        value={formData.convenio}
                        onChange={(e) => setFormData({ ...formData, convenio: e.target.value })}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>Número da Carteirinha</Label>
                      <Input
                        value={formData.numero_convenio}
                        onChange={(e) => setFormData({ ...formData, numero_convenio: e.target.value })}
                      />
                    </div>
                  </>
                )}

                {formData.tipo_pagamento === 'pacote' && (
                  <div className="space-y-2">
                    <Label>Pacote</Label>
                    <Select value={formData.pacote_id} onValueChange={handlePacoteChange}>
                      <SelectTrigger>
                        <SelectValue placeholder="Selecione um pacote" />
                      </SelectTrigger>
                      <SelectContent>
                        {pacotesAtivos.map(p => (
                          <SelectItem key={p.id} value={p.id}>
                            {p.nome} - R$ {(p.valor_base || 0).toFixed(2)}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                )}

                {contrato && (
                  <Card className="bg-gradient-to-br from-green-50 to-emerald-50 border-2 border-green-200">
                    <CardHeader className="pb-3">
                      <CardTitle className="text-lg flex items-center gap-2 text-green-800">
                        <Package className="w-5 h-5" />
                        Contrato Ativo
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-2 text-sm">
                      <div className="flex justify-between">
                        <span className="text-slate-600">Número:</span>
                        <span className="font-semibold text-slate-800">{contrato.numero_contrato}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-slate-600">Título:</span>
                        <span className="font-semibold text-slate-800">{contrato.titulo}</span>
                      </div>
                      {contrato.valor_mensal && (
                        <div className="flex justify-between">
                          <span className="text-slate-600">Valor Mensal:</span>
                          <span className="font-semibold text-green-600">
                            R$ {(contrato.valor_mensal || 0).toFixed(2)}
                          </span>
                        </div>
                      )}
                      {contrato.servicos_inclusos && contrato.servicos_inclusos.length > 0 && (
                        <div>
                          <span className="text-slate-600 block mb-1">Serviços:</span>
                          {contrato.servicos_inclusos.map((servico, idx) => (
                            <div key={idx} className="text-xs text-slate-700 ml-2">
                              • {servico.servico}: {servico.quantidade}x
                            </div>
                          ))}
                        </div>
                      )}
                      <div className="flex justify-between">
                        <span className="text-slate-600">Vigência:</span>
                        <span className="font-semibold text-slate-800">
                          {new Date(contrato.data_inicio).toLocaleDateString('pt-BR')}
                          {contrato.data_termino && ` até ${new Date(contrato.data_termino).toLocaleDateString('pt-BR')}`}
                        </span>
                      </div>
                    </CardContent>
                  </Card>
                )}

                {contratoAtivo && !contrato && (
                  <Card className="bg-gradient-to-br from-blue-50 to-cyan-50 border-2 border-blue-200">
                    <CardHeader className="pb-3">
                      <CardTitle className="text-lg flex items-center gap-2 text-blue-800">
                        <FileText className="w-5 h-5" />
                        Contrato Ativo
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-2 text-sm">
                      <div className="flex justify-between">
                        <span className="text-slate-600">Número:</span>
                        <span className="font-semibold text-slate-800">{contratoAtivo.numero_contrato}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-slate-600">Título:</span>
                        <span className="font-semibold text-slate-800">{contratoAtivo.titulo}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-slate-600">Vigência:</span>
                        <span className="font-semibold text-slate-800">
                          {new Date(contratoAtivo.data_inicio).toLocaleDateString('pt-BR')} até {' '}
                          {contratoAtivo.data_termino && new Date(contratoAtivo.data_termino).toLocaleDateString('pt-BR')}
                        </span>
                      </div>
                    </CardContent>
                  </Card>
                )}
              </div>
            </TabsContent>

            <TabsContent value="acesso-plataforma" className="space-y-6 mt-6">
              <div className="space-y-4">
                {formData.acesso_plataforma_ativo ? (
                  <Card className="bg-gradient-to-br from-green-50 to-emerald-50 border-2 border-green-200">
                    <CardContent className="p-6">
                      <div className="flex items-start gap-4">
                        <div className="p-3 bg-green-100 rounded-full">
                          <CheckCircle className="w-6 h-6 text-green-600" />
                        </div>
                        <div className="flex-1">
                          <h3 className="font-semibold text-green-800 mb-1">Acesso Ativo</h3>
                          <p className="text-sm text-green-700 mb-3">
                            Este paciente possui acesso à plataforma
                          </p>
                          {formData.data_convite_acesso && (
                            <p className="text-xs text-green-600">
                              Convite enviado em: {new Date(formData.data_convite_acesso).toLocaleDateString('pt-BR')}
                            </p>
                          )}
                          {formData.data_primeiro_acesso && (
                            <p className="text-xs text-green-600">
                              Primeiro acesso: {new Date(formData.data_primeiro_acesso).toLocaleDateString('pt-BR')}
                            </p>
                          )}
                          {formData.ultimo_acesso && (
                            <p className="text-xs text-green-600">
                              Último acesso: {new Date(formData.ultimo_acesso).toLocaleDateString('pt-BR')}
                            </p>
                          )}
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ) : (
                  <Card className="bg-gradient-to-br from-slate-50 to-slate-100 border-2 border-slate-200">
                    <CardContent className="p-6">
                      <div className="flex items-start gap-4">
                        <div className="p-3 bg-slate-200 rounded-full">
                          <Key className="w-6 h-6 text-slate-600" />
                        </div>
                        <div className="flex-1">
                          <h3 className="font-semibold text-slate-800 mb-1">Sem Acesso</h3>
                          <p className="text-sm text-slate-600 mb-3">
                            Este paciente ainda não tem acesso à plataforma
                          </p>
                          {formData.email && (
                            <div className="flex items-center gap-2">
                              <input
                                type="checkbox"
                                id="enviar-convite"
                                checked={enviarConviteAcesso}
                                onChange={(e) => setEnviarConviteAcesso(e.target.checked)}
                                className="w-4 h-4 text-cyan-600"
                              />
                              <Label htmlFor="enviar-convite" className="text-sm text-slate-700 cursor-pointer">
                                Enviar convite de acesso ao salvar
                              </Label>
                            </div>
                          )}
                          {!formData.email && (
                            <Alert className="mt-3">
                              <AlertCircle className="h-4 w-4" />
                              <AlertDescription className="text-xs">
                                É necessário informar um email para enviar o convite de acesso
                              </AlertDescription>
                            </Alert>
                          )}
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                )}
              </div>
            </TabsContent>
          </Tabs>

          <div className="flex justify-end gap-3 pt-4 border-t">
            <Button type="button" variant="outline" onClick={onClose}>
              Cancelar
            </Button>
            <Button
              type="submit"
              className="bg-gradient-to-r from-cyan-500 to-teal-500 hover:from-cyan-600 hover:to-teal-600"
              disabled={saveMutation.isPending || uploadingFoto || enviandoConvite}
            >
              {saveMutation.isPending || enviandoConvite ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Salvando...
                </>
              ) : (
                <>
                  {enviarConviteAcesso && <Mail className="w-4 h-4 mr-2" />}
                  Salvar{enviarConviteAcesso && ' e Enviar Convite'}
                </>
              )}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
