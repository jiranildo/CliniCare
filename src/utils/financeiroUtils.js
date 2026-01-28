import { startOfMonth, endOfMonth, isWithinInterval, parseISO, isPast, format } from "date-fns";

/**
 * Retorna o valor mensal do contrato ativo do paciente
 */
export const getValorContratado = (paciente, contratos) => {
    const contratoAtivo = contratos.find(c =>
        c.paciente_id === paciente.id &&
        c.status === 'ativo'
    );

    if (contratoAtivo && contratoAtivo.valor_mensal) {
        return Number(contratoAtivo.valor_mensal);
    }

    return 0;
};

/**
 * Retorna o total de consultas inclusas no contrato do paciente
 */
export const getConsultasTotais = (paciente, contratos) => {
    const contratoAtivo = contratos.find(c =>
        c.paciente_id === paciente.id &&
        c.status === 'ativo'
    );

    if (!contratoAtivo || !contratoAtivo.servicos_inclusos) return 0;

    // Procurar nos serviços inclusos por consultas
    const servicoConsultas = contratoAtivo.servicos_inclusos.find(s =>
        s.servico?.toLowerCase().includes('consulta') ||
        s.periodicidade === 'mensal'
    );

    return servicoConsultas?.quantidade || 0;
};

/**
 * Calcula o valor devido (calculado) com base nas evoluções/atendimentos do mês
 * @param {Object} paciente 
 * @param {Array} contratos 
 * @param {Array} evolucoes 
 * @param {Date} dateReference - Data de referência para o cálculo do mês (default: hoje)
 */
export const calcularValorDevido = (paciente, contratos, evolucoes, dateReference = new Date()) => {
    const inicioMes = startOfMonth(dateReference);
    const fimMes = endOfMonth(dateReference);

    // Contar evoluções do mês
    const evolucoesDoMes = evolucoes.filter(e => {
        if (e.paciente_id !== paciente.id) return false;
        if (!e.data_atendimento) return false;

        try {
            const dataAtendimento = parseISO(e.data_atendimento);
            return isWithinInterval(dataAtendimento, { start: inicioMes, end: fimMes });
        } catch (error) {
            console.error('Erro ao processar data:', e.data_atendimento, error);
            return false;
        }
    });

    const quantidadeEvolucoes = evolucoesDoMes.length;

    // Se não tem evolução no mês, não deve nada (calculado)
    if (quantidadeEvolucoes === 0) return 0;

    // Buscar contrato ativo
    const contratoAtivo = contratos.find(c =>
        c.paciente_id === paciente.id &&
        c.status === 'ativo'
    );

    // Se tem contrato ativo, calcular baseado no valor mensal
    if (contratoAtivo && contratoAtivo.valor_mensal) {
        const consultasTotais = getConsultasTotais(paciente, contratos);

        // Se tem limite de consultas definido
        if (consultasTotais > 0) {
            const valorPorConsulta = Number(contratoAtivo.valor_mensal) / consultasTotais;
            return quantidadeEvolucoes * valorPorConsulta;
        }

        // Se não tem limite, cobra o valor mensal fixo
        return Number(contratoAtivo.valor_mensal);
    }

    // Se não tem contrato, retorna 0
    return 0;
};

/**
 * Retorna todos os dados financeiros processados de um paciente para o mês de referência
 */
export const getDadosFinanceirosPacienteHelper = (paciente, contratos, evolucoes, pagamentos, notasFiscais, dateReference = new Date()) => {
    const inicioMes = startOfMonth(dateReference);
    const fimMes = endOfMonth(dateReference);

    const valorContratado = getValorContratado(paciente, contratos);
    const valorCalculado = calcularValorDevido(paciente, contratos, evolucoes, dateReference);
    const consultasTotais = getConsultasTotais(paciente, contratos);

    const pagamentoMes = pagamentos.find(p => {
        if (p.paciente_id !== paciente.id) return false;
        if (!p.data_vencimento) return false;

        try {
            const dataVencimento = parseISO(p.data_vencimento);
            return isWithinInterval(dataVencimento, { start: inicioMes, end: fimMes });
        } catch (error) {
            return false;
        }
    });

    const notaMes = notasFiscais ? notasFiscais.find(n => {
        if (n.paciente_id !== paciente.id) return false;
        const mesRef = format(dateReference, 'yyyy-MM');
        return n.mes_referencia === mesRef;
    }) : null;

    const evolucoesDoMes = evolucoes.filter(e => {
        if (e.paciente_id !== paciente.id) return false;
        if (!e.data_atendimento) return false;

        try {
            const dataAtendimento = parseISO(e.data_atendimento);
            return isWithinInterval(dataAtendimento, { start: inicioMes, end: fimMes });
        } catch (error) {
            return false;
        }
    });

    const contratoAtivo = contratos.find(c =>
        c.paciente_id === paciente.id &&
        c.status === 'ativo'
    );

    const jaFoiPago = pagamentoMes?.status === 'pago';
    const estaAtrasado = pagamentoMes && pagamentoMes.status !== 'pago' && isPast(parseISO(pagamentoMes.data_vencimento));

    // Status de Pagamento Unificado
    let statusPagamento = 'pendente';
    if (jaFoiPago) {
        statusPagamento = 'pago';
    } else if (estaAtrasado) {
        statusPagamento = 'atrasado';
    } else if (valorCalculado === 0 && !pagamentoMes) {
        statusPagamento = 'sem_atendimento';
    }

    // Valor Final a Considerar (Se tem boleto/pagamento, usamos o valor do boleto. Se não, usamos o calculado)
    const valorFinal = pagamentoMes ? (Number(pagamentoMes.valor) - Number(pagamentoMes.valor_pago || 0)) : valorCalculado;
    // Se for pago, o valor devido é 0
    const valorDevidoReal = jaFoiPago ? 0 : valorFinal;

    const valorPagoReal = jaFoiPago ? (Number(pagamentoMes?.valor_pago) || Number(pagamentoMes?.valor) || 0) : 0;

    return {
        pagamento: pagamentoMes,
        nota: notaMes,
        jaFoiPago,
        estaAtrasado,
        valorContratado,
        valorCalculado,
        quantidadeEvolucoes: evolucoesDoMes.length,
        consultasTotais,
        statusPagamento,
        contratoAtivo,
        valorDevidoReal, // Propriedade extra para facilitar somatórios
        valorPagoReal
    };
};
