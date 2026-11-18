import type { FilaDoDia, PainelSenha } from '../api/tipos'

// Dados de exemplo no formato que a API devolve, usados pelos testes das telas.
export function senha(parcial: Partial<PainelSenha> = {}): PainelSenha {
  return {
    id: crypto.randomUUID(),
    codigo: 'N001',
    status: 'Aguardando',
    prioridade: 'Normal',
    servicoId: 's1',
    servico: 'Atualização cadastral',
    cidadao: null,
    temAgendamento: false,
    emitidaEm: new Date(Date.now() - 10 * 60000).toISOString(),
    chamadaEm: null,
    guiche: null,
    posicao: null,
    ...parcial,
  }
}

export function fila(parcial: Partial<FilaDoDia> = {}): FilaDoDia {
  return {
    unidadeId: 'unidade-1',
    unidade: 'CRAS Simulado Unidade Central',
    data: '2026-11-10',
    emAtendimento: [],
    aguardando: [],
    concluidasHoje: 0,
    canceladasHoje: 0,
    ...parcial,
  }
}
