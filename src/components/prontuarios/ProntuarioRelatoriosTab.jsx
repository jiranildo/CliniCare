import React, { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
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
import {
  FileText,
  Upload,
  Loader2,
  Sparkles,
  Download,
  Eye,
  Trash2,
  File,
  Calendar,
  User,
  History,
  Printer
} from "lucide-react";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import ReactMarkdown from "react-markdown";
import html2pdf from 'html2pdf.js';

export default function ProntuarioRelatoriosTab({ paciente, anamneses, evolucoes }) {
  const [tipoRelatorio, setTipoRelatorio] = useState('resumo');
  const [instrucaoPersonalizada, setInstrucaoPersonalizada] = useState('');
  const [gerandoRelatorio, setGerandoRelatorio] = useState(false);
  const [relatorioAtual, setRelatorioAtual] = useState(null);
  const [showVisualizacao, setShowVisualizacao] = useState(false);
  const [uploadingArquivo, setUploadingArquivo] = useState(false);
  const [arquivosSelecionados, setArquivosSelecionados] = useState([]);
  const [currentUser, setCurrentUser] = useState(null);
  const queryClient = useQueryClient();

  // Load current user for saving reports
  useEffect(() => {
    const loadUser = async () => {
      try {
        const userData = await base44.auth.me();
        setCurrentUser(userData);
      } catch (error) {
        console.error("Error loading user:", error);
      }
    };
    loadUser();
  }, []);

  // Fetch saved reports
  const { data: historicoRelatorios = [] } = useQuery({
    queryKey: ['relatorios_gerados', paciente.id],
    queryFn: () => base44.entities.RelatorioGerado.filter({ paciente_id: paciente.id }, '-created_at'),
  });

  const updatePaciente = useMutation({
    mutationFn: async ({ id, data }) => {
      return await base44.entities.Paciente.update(id, data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries(['pacientes']);
    },
  });

  const saveRelatorio = useMutation({
    mutationFn: async (relatorioData) => {
      return await base44.entities.RelatorioGerado.create(relatorioData);
    },
    onSuccess: () => {
      queryClient.invalidateQueries(['relatorios_gerados', paciente.id]);
    }
  });

  const tiposRelatorio = {
    resumo: {
      label: "Resumo Geral",
      descricao: "Resumo completo do histórico clínico do paciente"
    },
    evolucao: {
      label: "Relatório de Atendimentos",
      descricao: "Análise da evolução do tratamento ao longo do tempo"
    },
    alta: {
      label: "Relatório de Alta",
      descricao: "Documento para alta médica com recomendações"
    },
    encaminhamento: {
      label: "Relatório de Encaminhamento",
      descricao: "Encaminhamento para outro profissional ou especialidade"
    },
    pericial: {
      label: "Relatório Pericial",
      descricao: "Relatório para fins periciais ou legais"
    },
    personalizado: {
      label: "Relatório Personalizado",
      descricao: "Relatório customizado com suas próprias instruções"
    }
  };

  const handleArquivoUpload = async (e) => {
    const files = Array.from(e.target.files || []);
    if (files.length === 0) return;

    setUploadingArquivo(true);
    try {
      const uploadPromises = files.map(async (file) => {
        const { file_url } = await base44.integrations.Core.UploadFile({ file });
        return {
          nome: file.name,
          url: file_url,
          tipo: file.type,
          data_upload: new Date().toISOString(),
          tamanho: file.size
        };
      });

      const novosArquivos = await Promise.all(uploadPromises);

      const arquivosAtualizados = [
        ...(paciente.arquivos || []),
        ...novosArquivos
      ];

      await updatePaciente.mutateAsync({
        id: paciente.id,
        data: { ...paciente, arquivos: arquivosAtualizados }
      });

      alert('Arquivo(s) enviado(s) com sucesso!');
    } catch (error) {
      console.error('Erro ao fazer upload:', error);
      alert('Erro ao fazer upload do arquivo. Tente novamente.');
    } finally {
      setUploadingArquivo(false);
      e.target.value = '';
    }
  };

  const handleRemoverArquivo = async (indexRemover) => {
    if (!confirm('Tem certeza que deseja remover este arquivo?')) return;

    const arquivosAtualizados = (paciente.arquivos || []).filter((_, index) => index !== indexRemover);

    await updatePaciente.mutateAsync({
      id: paciente.id,
      data: { ...paciente, arquivos: arquivosAtualizados }
    });
  };

  const handleGerarRelatorio = async () => {
    setGerandoRelatorio(true);
    try {
      const contextoFichaPaciente = `
## FICHA DO PACIENTE

**Nome:** ${paciente.nome_completo}
**CPF:** ${paciente.cpf || 'Não informado'}
**Data de Nascimento:** ${paciente.data_nascimento ? format(new Date(paciente.data_nascimento), "dd/MM/yyyy") : 'Não informado'}
**Telefone:** ${paciente.telefone}
**Email:** ${paciente.email || 'Não informado'}
**Endereço:** ${paciente.endereco || 'Não informado'}, ${paciente.cidade || ''} - ${paciente.estado || ''}
**Convênio:** ${paciente.convenio || 'Particular'}
${paciente.observacoes ? `\n**Observações Gerais:** ${paciente.observacoes}` : ''}
`;

      const contextoAnamneses = anamneses && anamneses.length > 0 ? `
## ANAMNESES

${anamneses.map((a, idx) => `
### Anamnese ${idx + 1} - ${a.data_anamnese ? format(new Date(a.data_anamnese), "dd/MM/yyyy") : 'Data não informada'}

**Profissional:** ${a.profissional_nome}
**Queixa Principal:** ${a.queixa_principal || 'Não informado'}
**História da Doença Atual:** ${a.historico_doenca_atual || 'Não informado'}
**Histórico Médico:** ${a.historico_medico || 'Não informado'}
**Alergias:** ${a.alergias || 'Nenhuma alergia conhecida'}
**Medicamentos em Uso:** ${a.medicamentos_uso || 'Nenhum'}
**Doenças Pré-existentes:** ${a.doencas_preexistentes || 'Nenhuma'}
**Cirurgias Anteriores:** ${a.cirurgias_anteriores || 'Nenhuma'}
**Histórico Familiar:** ${a.historico_familiar || 'Não informado'}
**Hábitos:** ${a.habitos || 'Não informado'}
**Exame Físico:** ${a.exame_fisico || 'Não realizado'}
**Hipótese Diagnóstica:** ${a.hipotese_diagnostica || 'Não informado'}
**Conduta:** ${a.conduta || 'Não informado'}
**Prescrição:** ${a.prescricao || 'Nenhuma'}
`).join('\n---\n')}
` : '';

      const contextoEvolucoes = evolucoes && evolucoes.length > 0 ? `
## ATENDIMENTOS CLÍNICOS

${evolucoes.map((e, idx) => `
### Atendimento ${idx + 1} - ${e.data_atendimento ? format(new Date(e.data_atendimento), "dd/MM/yyyy") : 'Data não informada'}

**Profissional:** ${e.profissional_nome}
**Tipo de Atendimento:** ${e.tipo_atendimento}
**Queixa:** ${e.queixa || 'Não informado'}
**Descrição do Atendimento:** ${e.evolucao || 'Não informado'}
**Exame Físico:** ${e.exame_fisico || 'Não realizado'}
**Sinais Vitais:**
- Pressão Arterial: ${e.pressao_arterial || 'Não aferida'}
- Peso: ${e.peso ? `${e.peso} kg` : 'Não aferido'}
- Temperatura: ${e.temperatura || 'Não aferida'}
- Frequência Cardíaca: ${e.frequencia_cardiaca || 'Não aferida'}

**Hipótese Diagnóstica:** ${e.hipotese_diagnostica || 'Não informado'}
**Conduta:** ${e.conduta || 'Não informado'}
**Prescrição:** ${e.prescricao || 'Nenhuma'}
**Retorno:** ${e.retorno_em || 'Não agendado'}
`).join('\n---\n')}
` : '';

      const contextoArquivos = paciente.arquivos && paciente.arquivos.length > 0 ? `
## ARQUIVOS ANEXADOS

Total de arquivos: ${paciente.arquivos.length}
${paciente.arquivos.map((a, idx) => `${idx + 1}. ${a.nome} (${a.tipo}) - Enviado em ${a.data_upload ? format(new Date(a.data_upload), "dd/MM/yyyy HH:mm", { locale: ptBR }) : 'Data desconhecida'}`).join('\n')}

**Nota:** Os arquivos foram anexados ao prontuário mas não podem ser analisados diretamente. Considere os nomes dos arquivos para contexto adicional.
` : '';

      const instrucoesPorTipo = {
        resumo: `Crie um RESUMO GERAL COMPLETO do histórico clínico do paciente. 

Inclua:
1. Dados demográficos e identificação
2. Resumo da história clínica (anamnese)
3. Principais diagnósticos
4. Evolução do tratamento
5. Medicações atuais
6. Alergias e restrições
7. Resumo da evolução do quadro
8. Próximos passos recomendados

Use linguagem médica profissional, seja claro e objetivo.`,

        evolucao: `Crie um RELATÓRIO DE ATENDIMENTO detalhado analisando a progressão do tratamento do paciente.

Inclua:
1. Condição inicial (primeira anamnese)
2. Evolução ao longo dos atendimentos
3. Comparação dos sinais vitais
4. Efetividade das intervenções
5. Mudanças no quadro clínico
6. Análise de melhora/piora
7. Recomendações para continuidade

Use linguagem técnica e seja analítico.`,

        alta: `Crie um RELATÓRIO DE ALTA MÉDICA formal para o paciente.

Inclua:
1. Identificação do paciente
2. Período de tratamento
3. Diagnóstico final
4. Tratamentos realizados
5. Estado atual do paciente
6. Medicações para continuar em casa
7. Recomendações e cuidados pós-alta
8. Orientações de retorno/acompanhamento

Use formato oficial e linguagem clara.`,

        encaminhamento: `Crie um RELATÓRIO DE ENCAMINHAMENTO profissional.

Inclua:
1. Identificação do paciente
2. Motivo do encaminhamento
3. Resumo da história clínica relevante
4. Diagnóstico presumido
5. Tratamentos já realizados
6. Exames complementares disponíveis
7. Dúvidas ou pontos de atenção
8. Objetivo do encaminhamento

Use linguagem técnica entre profissionais.`,

        pericial: `Crie um RELATÓRIO PERICIAL detalhado e formal.

Inclua:
1. Identificação completa do paciente
2. Histórico clínico detalhado
3. Diagnósticos com CID quando aplicável
4. Cronologia dos atendimentos
5. Exames realizados
6. Tratamentos instituídos
7. Evolução documentada
8. Estado atual e prognóstico
9. Conclusões técnicas

Use linguagem formal e objetiva, adequada para fins legais.`,

        personalizado: instrucaoPersonalizada || 'Crie um relatório detalhado baseado nas informações disponíveis.'
      };

      const contextoArquivosSelecionados = arquivosSelecionados.length > 0
        ? `\n\n## ARQUIVOS SELECIONADOS PARA ANÁLISE\n\n${arquivosSelecionados.map(a => `- ${a.nome}`).join('\n')}\n`
        : '';

      const promptCompleto = `Você é um assistente médico especializado em elaboração de relatórios clínicos.

${contextoFichaPaciente}

${contextoAnamneses}

${contextoEvolucoes}

${contextoArquivos}

${contextoArquivosSelecionados}

---

${instrucoesPorTipo[tipoRelatorio]}

---

**INSTRUÇÕES IMPORTANTES:**
- Use formato Markdown para estruturação
- Seja profissional e técnico
- Baseie-se APENAS nas informações fornecidas
- Se alguma informação importante estiver faltando, mencione isso
- Use terminologia médica apropriada
- Organize o relatório de forma clara e lógica
- Inclua data e hora da geração no final

Gere o relatório agora:`;

      const fileUrls = arquivosSelecionados.length > 0
        ? arquivosSelecionados.map(a => a.url)
        : undefined;

      const response = await base44.integrations.Core.InvokeLLM({
        prompt: promptCompleto,
        file_urls: fileUrls
      });

      const novoRelatorio = {
        paciente_id: paciente.id,
        profissional_id: currentUser?.id,
        tipo_relatorio: tipoRelatorio,
        conteudo: response,
        metadata: {
          tipo_label: tiposRelatorio[tipoRelatorio].label,
          paciente_nome: paciente.nome_completo,
          arquivos_incluidos: arquivosSelecionados.map(a => a.nome),
          instrucao_personalizada: tipoRelatorio === 'personalizado' ? instrucaoPersonalizada : null
        }
      };

      // Save report to DB
      await saveRelatorio.mutateAsync(novoRelatorio);

      // Just for viewing immediately (metadata structure is slightly different in filtered items vs local object)
      // We will refresh the list from DB anyway, but let's show viewing modal
      const relatorioVisualizacao = {
        ...novoRelatorio,
        tipoLabel: tiposRelatorio[tipoRelatorio].label,
        data_geracao: new Date().toISOString(),
        paciente_nome: paciente.nome_completo,
        arquivos_incluidos: arquivosSelecionados.map(a => a.nome)
      };

      setRelatorioAtual(relatorioVisualizacao);
      setShowVisualizacao(true);
    } catch (error) {
      console.error('Erro ao gerar relatório:', error);
      alert('Erro ao gerar relatório. Tente novamente.');
    } finally {
      setGerandoRelatorio(false);
    }
  };

  const downloadText = (conteudo, filename) => {
    const blob = new Blob([conteudo], { type: 'text/plain' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    window.URL.revokeObjectURL(url);
    a.remove();
  };

  const downloadHTML = (conteudo, filename) => {
    // Simple HTML wrap for "DOCX" style usage (Word opens HTML fine)
    const htmlContent = `
      <html>
      <head>
        <meta charset="utf-8">
        <style>body { font-family: Arial, sans-serif; padding: 20px; line-height: 1.6; }</style>
      </head>
      <body>
        ${conteudo.replace(/\n/g, '<br>').replace(/\*\*(.*?)\*\*/g, '<b>$1</b>').replace(/# (.*?)(<br>|$)/g, '<h1>$1</h1>').replace(/## (.*?)(<br>|$)/g, '<h2>$1</h2>')}
      </body>
      </html>
      `;
    const blob = new Blob([htmlContent], { type: 'application/msword' }); // MIME type specifically to trigger Word
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    window.URL.revokeObjectURL(url);
    a.remove();
  };

  const handleDownloadRelatorio = (formatType) => {
    if (!relatorioAtual) return;

    const timestamp = format(new Date(), 'yyyyMMdd_HHmmss');
    const filenameBase = `relatorio_${relatorioAtual.tipo_relatorio || relatorioAtual.tipo}_${paciente.nome_completo}_${timestamp}`;

    const cabecalho = `CLINICARE PRO - RELATÓRIO MÉDICO
Tipo: ${relatorioAtual.tipoLabel || relatorioAtual.metadata?.tipo_label}
Paciente: ${relatorioAtual.paciente_nome || relatorioAtual.metadata?.paciente_nome}
Data: ${format(new Date(relatorioAtual.data_geracao || relatorioAtual.created_at || new Date()), "dd/MM/yyyy HH:mm")}
--------------------------------------------------\n\n`;

    const conteudoCompleto = cabecalho + relatorioAtual.conteudo;

    if (formatType === 'txt') {
      downloadText(conteudoCompleto, `${filenameBase}.txt`);
    } else if (formatType === 'doc') {
      downloadHTML(conteudoCompleto, `${filenameBase}.doc`);
    } else if (formatType === 'pdf') {
      const element = document.getElementById('report-content-pdf');
      if (element) {
        const opt = {
          margin: 10,
          filename: `${filenameBase}.pdf`,
          image: { type: 'jpeg', quality: 0.98 },
          html2canvas: { scale: 2 },
          jsPDF: { unit: 'mm', format: 'a4', orientation: 'portrait' }
        };
        html2pdf().set(opt).from(element).save();
      }
    } else if (formatType === 'print') {
      const printWindow = window.open('', '_blank');
      printWindow.document.write(`
            <html>
            <head>
                <title>${filenameBase}</title>
                <style>
                    body { font-family: Arial, sans-serif; padding: 40px; line-height: 1.6; max-width: 800px; margin: 0 auto; }
                    h1 { border-bottom: 2px solid #333; padding-bottom: 10px; }
                    .header { margin-bottom: 30px; color: #555; }
                    .content { white-space: pre-wrap; }
                </style>
            </head>
            <body>
                <h1>${relatorioAtual.tipoLabel || relatorioAtual.metadata?.tipo_label}</h1>
                <div class="header">
                    <strong>Paciente:</strong> ${relatorioAtual.paciente_nome || relatorioAtual.metadata?.paciente_nome}<br>
                    <strong>Data:</strong> ${format(new Date(relatorioAtual.data_geracao || relatorioAtual.created_at || new Date()), "dd/MM/yyyy HH:mm")}
                </div>
                <div class="content">${relatorioAtual.conteudo.replace(/\n/g, '<br>')}</div>
                <script>
                    window.onload = function() { window.print(); window.close(); }
                </script>
            </body>
            </html>
        `);
    }
  };

  const handleVerHistorico = (relatorio) => {
    setRelatorioAtual({
      ...relatorio,
      tipoLabel: relatorio.metadata?.tipo_label,
      paciente_nome: relatorio.metadata?.paciente_nome,
      arquivos_incluidos: relatorio.metadata?.arquivos_incluidos
    });
    setShowVisualizacao(true);
  };

  return (
    <div className="space-y-6">
      <Card className="border-none shadow-lg bg-gradient-to-br from-purple-50 to-blue-50">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-xl">
            <Sparkles className="w-6 h-6 text-purple-600" />
            Gerador de Relatórios com IA
          </CardTitle>
          <p className="text-sm text-slate-600 mt-2">
            Utilize inteligência artificial para gerar relatórios completos baseados no prontuário do paciente
          </p>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Tipo de Relatório</Label>
              <Select value={tipoRelatorio} onValueChange={setTipoRelatorio}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {Object.entries(tiposRelatorio).map(([key, value]) => (
                    <SelectItem key={key} value={key}>
                      {value.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <p className="text-xs text-slate-500">
                {tiposRelatorio[tipoRelatorio].descricao}
              </p>
            </div>

            <div className="space-y-2">
              <Label>Arquivos do Paciente</Label>
              <div className="flex gap-2">
                <input
                  type="file"
                  id="arquivo-upload"
                  multiple
                  onChange={handleArquivoUpload}
                  className="hidden"
                  disabled={uploadingArquivo}
                />
                <label
                  htmlFor="arquivo-upload"
                  className={`flex-1 flex items-center justify-center gap-2 px-4 py-2 border-2 border-dashed rounded-lg cursor-pointer hover:border-purple-500 transition-colors ${uploadingArquivo ? 'opacity-50 cursor-not-allowed' : ''
                    }`}
                >
                  {uploadingArquivo ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      <span className="text-sm">Enviando...</span>
                    </>
                  ) : (
                    <>
                      <Upload className="w-4 h-4" />
                      <span className="text-sm">Enviar Arquivos</span>
                    </>
                  )}
                </label>
              </div>
              <p className="text-xs text-slate-500">
                {paciente.arquivos?.length || 0} arquivo(s) anexado(s)
              </p>
            </div>
          </div>

          {tipoRelatorio === 'personalizado' && (
            <div className="space-y-2">
              <Label>Instruções Personalizadas</Label>
              <Textarea
                value={instrucaoPersonalizada}
                onChange={(e) => setInstrucaoPersonalizada(e.target.value)}
                rows={4}
                placeholder="Descreva o que você deseja incluir no relatório personalizado..."
              />
            </div>
          )}

          <div className="flex justify-end">
            <Button
              onClick={handleGerarRelatorio}
              disabled={gerandoRelatorio || (tipoRelatorio === 'personalizado' && !instrucaoPersonalizada)}
              className="bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700"
            >
              {gerandoRelatorio ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Gerando Relatório...
                </>
              ) : (
                <>
                  <Sparkles className="w-4 h-4 mr-2" />
                  Gerar Relatório com IA
                </>
              )}
            </Button>
          </div>
        </CardContent>
      </Card>

      <Card className="border-none shadow-lg bg-slate-50">
        <CardContent className="p-6">
          <h3 className="font-semibold text-slate-800 mb-3">Dados disponíveis para geração:</h3>
          <div className="grid md:grid-cols-2 gap-3 text-sm">
            <div className="flex items-center gap-2">
              <div className={`w-3 h-3 rounded-full ${paciente.nome_completo ? 'bg-green-500' : 'bg-red-500'}`} />
              <span>Ficha do Paciente</span>
            </div>
            <div className="flex items-center gap-2">
              <div className={`w-3 h-3 rounded-full ${anamneses?.length > 0 ? 'bg-green-500' : 'bg-amber-500'}`} />
              <span>Anamneses ({anamneses?.length || 0})</span>
            </div>
            <div className="flex items-center gap-2">
              <div className={`w-3 h-3 rounded-full ${evolucoes?.length > 0 ? 'bg-green-500' : 'bg-amber-500'}`} />
              <span>Atendimentos ({evolucoes?.length || 0})</span>
            </div>
            <div className="flex items-center gap-2">
              <div className={`w-3 h-3 rounded-full ${paciente.arquivos?.length > 0 ? 'bg-green-500' : 'bg-amber-500'}`} />
              <span>Arquivos ({paciente.arquivos?.length || 0})</span>
            </div>
          </div>
          <p className="text-xs text-slate-500 mt-3">
            * A qualidade do relatório gerado depende da quantidade e qualidade das informações disponíveis
          </p>
        </CardContent>
      </Card>

      {historicoRelatorios.length > 0 && (
        <Card className="border-none shadow-md bg-white">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-lg">
              <History className="w-5 h-5 text-slate-600" />
              Histórico de Relatórios Gerados
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {historicoRelatorios.map((relatorio) => (
                <div key={relatorio.id} className="flex items-center justify-between p-4 border rounded-lg hover:bg-slate-50 transition-colors">
                  <div className="flex items-center gap-4">
                    <div className="p-2 bg-purple-100 rounded-full">
                      <FileText className="w-5 h-5 text-purple-600" />
                    </div>
                    <div>
                      <h4 className="font-semibold text-slate-800">{relatorio.metadata?.tipo_label || relatorio.tipo_relatorio}</h4>
                      <p className="text-xs text-slate-500 flex items-center gap-1 mt-1">
                        <Calendar className="w-3 h-3" />
                        {format(new Date(relatorio.created_at), "dd/MM/yyyy 'às' HH:mm")}
                        <span className="mx-1">•</span>
                        <User className="w-3 h-3" />
                        {currentUser?.id === relatorio.profissional_id ? 'Você' : 'Outro Profissional'}
                      </p>
                    </div>
                  </div>
                  <Button variant="outline" size="sm" onClick={() => handleVerHistorico(relatorio)}>
                    <Eye className="w-4 h-4 mr-2" /> Visualizar
                  </Button>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {paciente.arquivos && paciente.arquivos.length > 0 && (
        <Card className="border-none shadow-lg">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <File className="w-5 h-5 text-cyan-600" />
              Arquivos Anexados ({paciente.arquivos.length})
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {paciente.arquivos.map((arquivo, index) => (
                <div
                  key={index}
                  className="flex items-center justify-between p-3 bg-slate-50 rounded-lg border hover:shadow-md transition-all"
                >
                  <div className="flex items-center gap-3 flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <input
                        type="checkbox"
                        checked={arquivosSelecionados.some(a => a.url === arquivo.url)}
                        onChange={(e) => {
                          if (e.target.checked) {
                            setArquivosSelecionados([...arquivosSelecionados, arquivo]);
                          } else {
                            setArquivosSelecionados(arquivosSelecionados.filter(a => a.url !== arquivo.url));
                          }
                        }}
                        className="w-4 h-4"
                      />
                      <File className="w-5 h-5 text-blue-600 flex-shrink-0" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-medium text-sm truncate">{arquivo.nome}</p>
                      <p className="text-xs text-slate-500">
                        {arquivo.data_upload && format(new Date(arquivo.data_upload), "dd/MM/yyyy 'às' HH:mm", { locale: ptBR })}
                        {arquivo.tamanho && ` • ${(arquivo.tamanho / 1024).toFixed(2)} KB`}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => window.open(arquivo.url, '_blank')}
                    >
                      <Eye className="w-4 h-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleRemoverArquivo(index)}
                      className="text-red-600 hover:bg-red-50"
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>
            {arquivosSelecionados.length > 0 && (
              <div className="mt-4 p-3 bg-blue-50 rounded-lg border border-blue-200">
                <p className="text-sm text-blue-800">
                  ✓ {arquivosSelecionados.length} arquivo(s) selecionado(s) para incluir no contexto da IA
                </p>
              </div>
            )}
          </CardContent>
        </Card>
      )}

      <Dialog open={showVisualizacao} onOpenChange={setShowVisualizacao}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <FileText className="w-5 h-5 text-purple-600" />
              {relatorioAtual?.tipoLabel || relatorioAtual?.metadata?.tipo_label}
            </DialogTitle>
          </DialogHeader>

          {relatorioAtual && (
            <div className="space-y-4">
              <div id="report-content-pdf" className="bg-white p-2">
                <div className="bg-slate-50 p-4 rounded-lg border space-y-2 mb-4">
                  <div className="flex items-center gap-2 text-sm">
                    <User className="w-4 h-4 text-slate-600" />
                    <span className="font-medium">Paciente:</span>
                    <span>{relatorioAtual.paciente_nome || relatorioAtual.metadata?.paciente_nome}</span>
                  </div>
                  <div className="flex items-center gap-2 text-sm">
                    <Calendar className="w-4 h-4 text-slate-600" />
                    <span className="font-medium">Gerado em:</span>
                    <span>
                      {format(new Date(relatorioAtual.data_geracao || relatorioAtual.created_at || new Date()), "dd/MM/yyyy 'às' HH:mm", { locale: ptBR })}
                    </span>
                  </div>
                  {(relatorioAtual.arquivos_incluidos?.length > 0 || relatorioAtual.metadata?.arquivos_incluidos?.length > 0) && (
                    <div className="flex items-start gap-2 text-sm">
                      <File className="w-4 h-4 text-slate-600 mt-0.5" />
                      <div>
                        <span className="font-medium">Arquivos incluídos:</span>
                        <ul className="list-disc list-inside ml-2 text-slate-600">
                          {(relatorioAtual.arquivos_incluidos || relatorioAtual.metadata?.arquivos_incluidos).map((nome, idx) => (
                            <li key={idx}>{nome}</li>
                          ))}
                        </ul>
                      </div>
                    </div>
                  )}
                </div>

                <div className="prose prose-sm max-w-none bg-white p-6 rounded-lg border">
                  <ReactMarkdown>{relatorioAtual.conteudo}</ReactMarkdown>
                </div>
              </div>

              <div className="flex flex-wrap justify-end gap-3 pt-4 border-t">
                <Button variant="ghost" onClick={() => setShowVisualizacao(false)}>
                  Fechar
                </Button>
                <Button variant="outline" onClick={() => handleDownloadRelatorio('txt')}>
                  <FileText className="w-4 h-4 mr-2" /> TXT
                </Button>
                <Button variant="outline" onClick={() => handleDownloadRelatorio('doc')}>
                  <File className="w-4 h-4 mr-2" /> DOCX
                </Button>
                <Button variant="outline" onClick={() => handleDownloadRelatorio('pdf')}>
                  <Download className="w-4 h-4 mr-2" /> PDF
                </Button>
                <Button variant="default" className="bg-purple-600 hover:bg-purple-700" onClick={() => handleDownloadRelatorio('print')}>
                  <Printer className="w-4 h-4 mr-2" /> Imprimir
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>


    </div>
  );
}