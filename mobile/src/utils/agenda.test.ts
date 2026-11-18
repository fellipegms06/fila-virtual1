import type { Agendamento } from '../api/tipos'
import { agruparPorDia, separarAgendamentos } from './agenda'

const horario = (id: string, dataHora: string, vagasDisponiveis = 2) => ({ id, dataHora, vagasDisponiveis })

describe('agruparPorDia', () => {
  it('agrupa pelo dia de Brasília, em ordem, e esconde horários sem vaga', () => {
    const dias = agruparPorDia([
      horario('c', '2026-11-11T12:00:00Z'),
      horario('a', '2026-11-10T11:00:00Z'),
      horario('lotado', '2026-11-10T11:30:00Z', 0),
      horario('b', '2026-11-11T02:30:00Z'), // 23h30 do dia 10 em Brasília
    ])
    expect(dias.map((d) => [d.dia, d.horarios.map((h) => h.id)])).toEqual([
      ['2026-11-10', ['a', 'b']],
      ['2026-11-11', ['c']],
    ])
  })

  it('dia sem nenhuma vaga não aparece', () => {
    expect(agruparPorDia([horario('x', '2026-11-10T11:00:00Z', 0)])).toEqual([])
  })
})

describe('separarAgendamentos', () => {
  const ag = (id: string, status: Agendamento['status'], dataHora: string) =>
    ({ id, status, dataHora }) as Agendamento
  const agora = new Date('2026-11-10T15:00:00Z').getTime()

  it('próximos em ordem de data; histórico do mais recente para o mais antigo', () => {
    const { proximos, historico } = separarAgendamentos([
      ag('futuro2', 'Confirmado', '2026-11-12T12:00:00Z'),
      ag('futuro1', 'Confirmado', '2026-11-11T12:00:00Z'),
      ag('na-fila', 'Aguardando', '2026-11-10T13:00:00Z'),
      ag('cancelado', 'Cancelado', '2026-11-11T12:00:00Z'),
      ag('perdido', 'Confirmado', '2026-11-09T12:00:00Z'), // passou e não fez check-in
      ag('concluido', 'Concluido', '2026-11-10T12:00:00Z'),
    ], agora)
    expect(proximos.map((a) => a.id)).toEqual(['na-fila', 'futuro1', 'futuro2'])
    expect(historico.map((a) => a.id)).toEqual(['cancelado', 'concluido', 'perdido'])
  })
})
