import { describe, expect, it } from 'vitest'
import { dataCurta, duracao, hora, minutosDesde, porcentagem } from './formatar'

describe('formatar', () => {
  it('mostra a hora no horário de Brasília, não em UTC', () => {
    expect(hora('2026-11-10T13:05:00Z')).toBe('10:05')
    expect(hora('2026-11-10T02:30:00+00:00')).toBe('23:30')   // ainda é dia 09 em Brasília
  })

  it('formata a data do dia sem voltar um dia', () => {
    expect(dataCurta('2026-11-10')).toBe('10/11/2026')
  })

  it('conta minutos inteiros desde um instante, nunca negativo', () => {
    const agora = new Date('2026-11-10T13:30:30Z').getTime()
    expect(minutosDesde('2026-11-10T13:00:00Z', agora)).toBe(30)
    expect(minutosDesde('2026-11-10T14:00:00Z', agora)).toBe(0)
  })

  it.each([
    [null, '—'],
    [0.4, '< 1 min'],
    [12, '12 min'],
    [60, '1 h'],
    [75, '1 h 15 min'],
  ])('duração %s -> %s', (minutos, texto) => {
    expect(duracao(minutos)).toBe(texto)
  })

  it('porcentagem com vírgula decimal', () => {
    expect(porcentagem(0.333)).toBe('33,3%')
    expect(porcentagem(0)).toBe('0%')
  })
})
