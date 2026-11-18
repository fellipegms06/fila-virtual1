import { dataCompacta, dataCurta, dataPorExtenso, diaIso, diaParaBr, distancia, hora, partesDoDia, tempoCurto, tempoEstimado } from './formatar'

describe('formatar', () => {
  it('mostra hora e data no horário de Brasília, não em UTC', () => {
    expect(hora('2026-11-10T13:05:00Z')).toBe('10:05')
    expect(hora('2026-11-10T02:30:00Z')).toBe('23:30') // ainda é dia 09 em Brasília
    expect(dataCurta('2026-11-10T02:30:00Z')).toBe('09/11/2026')
    expect(diaIso('2026-11-10T02:30:00Z')).toBe('2026-11-09')
  })

  it('data por extenso para o cidadão', () => {
    expect(dataPorExtenso('2026-11-10T13:00:00Z')).toBe('terça-feira, 10 de novembro')
  })

  it('converte a data de nascimento da API', () => {
    expect(diaParaBr('1950-12-25')).toBe('25/12/1950')
  })

  it.each([
    [0.4, '400 m'],
    [2.345, '2,3 km'],
    [12, '12 km'],
  ])('distância %s km -> %s', (km, texto) => {
    expect(distancia(km)).toBe(texto)
  })

  it.each([
    [0, 'agora'],
    [1, 'cerca de 1 minuto'],
    [25, 'cerca de 25 minutos'],
    [60, 'cerca de 1 h'],
    [75, 'cerca de 1 h 15 min'],
  ])('tempo estimado %s -> %s', (minutos, texto) => {
    expect(tempoEstimado(minutos)).toBe(texto)
  })
})

describe('datas curtas e tempo curto', () => {
  it('partes do dia no horário de Brasília', () => {
    expect(partesDoDia('2026-11-11T12:00:00Z')).toEqual({ semana: 'Qua', dia: '11', mes: 'Nov' })
    expect(partesDoDia('2026-11-12T02:00:00Z')).toEqual({ semana: 'Qua', dia: '11', mes: 'Nov' }) // 23h do dia 11
  })

  it('data compacta', () => {
    expect(dataCompacta('2026-11-26T12:30:00Z')).toBe('Qui, 26 de Nov')
  })

  it.each([
    [0, 'agora'],
    [12, '~12 min'],
    [60, '~1 h'],
    [96, '~1 h 36 min'],
  ])('tempo curto %s -> %s', (minutos, texto) => {
    expect(tempoCurto(minutos)).toBe(texto)
  })
})
