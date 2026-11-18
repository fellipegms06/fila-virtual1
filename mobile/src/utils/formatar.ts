// A API manda os horários em UTC; o cidadão lê no horário de Brasília, seja qual for o fuso do celular.
// O Brasil não tem horário de verão desde 2019, então o fuso de Brasília é sempre UTC-3.
// Fazemos a conta à mão em vez de usar Intl com timeZone: o suporte a fusos do motor JavaScript
// do app (Hermes) varia entre aparelhos Android, e assim o resultado é o mesmo em todos.
const DESLOCAMENTO_BRASILIA_MS = -3 * 60 * 60 * 1000

const DIAS_SEMANA = ['domingo', 'segunda-feira', 'terça-feira', 'quarta-feira', 'quinta-feira', 'sexta-feira', 'sábado']
const MESES = ['janeiro', 'fevereiro', 'março', 'abril', 'maio', 'junho', 'julho', 'agosto', 'setembro', 'outubro', 'novembro', 'dezembro']

const doisDigitos = (n: number) => String(n).padStart(2, '0')

// Um Date "deslocado": os getters UTC passam a devolver a hora de Brasília.
const emBrasilia = (iso: string | Date) => new Date(new Date(iso).getTime() + DESLOCAMENTO_BRASILIA_MS)

// "2026-11-10T13:05:00Z" -> "10:05"
export function hora(iso: string): string {
  const d = emBrasilia(iso)
  return `${doisDigitos(d.getUTCHours())}:${doisDigitos(d.getUTCMinutes())}`
}

// "2026-11-10T13:05:00Z" -> "10/11/2026"
export function dataCurta(iso: string): string {
  const d = emBrasilia(iso)
  return `${doisDigitos(d.getUTCDate())}/${doisDigitos(d.getUTCMonth() + 1)}/${d.getUTCFullYear()}`
}

// "2026-11-10T13:05:00Z" -> "terça-feira, 10 de novembro"
export function dataPorExtenso(iso: string): string {
  const d = emBrasilia(iso)
  return `${DIAS_SEMANA[d.getUTCDay()]}, ${d.getUTCDate()} de ${MESES[d.getUTCMonth()]}`
}

// "2026-11-10" (dia) a partir de um instante, no horário de Brasília. Usado para pedir horários de um dia.
export function diaIso(instante: Date | string): string {
  const d = emBrasilia(instante)
  return `${d.getUTCFullYear()}-${doisDigitos(d.getUTCMonth() + 1)}-${doisDigitos(d.getUTCDate())}`
}

// "1950-12-25" (DateOnly da API) -> "25/12/1950"
export function diaParaBr(dia: string): string {
  const [ano, mes, d] = dia.split('-')
  return `${d}/${mes}/${ano}`
}

// 2.345 -> "2,3 km"; 0,4 -> "400 m"
export function distancia(km: number): string {
  if (km < 1) return `${Math.round(km * 1000)} m`
  return `${String(Math.round(km * 10) / 10).replace('.', ',')} km` // vírgula à mão: mesmo motivo do Intl acima
}

// 0 -> "agora"; 12 -> "cerca de 12 minutos"; 75 -> "cerca de 1 h 15 min"
export function tempoEstimado(minutos: number): string {
  if (minutos < 1) return 'agora'
  if (minutos < 60) return `cerca de ${minutos} ${minutos === 1 ? 'minuto' : 'minutos'}`
  const h = Math.floor(minutos / 60)
  const resto = minutos % 60
  return `cerca de ${h} h${resto ? ` ${resto} min` : ''}`
}

const DIAS_CURTOS = ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb']
const MESES_CURTOS = ['Jan', 'Fev', 'Mar', 'Abr', 'Mai', 'Jun', 'Jul', 'Ago', 'Set', 'Out', 'Nov', 'Dez']

// Partes da data para os chips do passo "Data e Hora": "Qua" / "11" / "Nov" (horário de Brasília).
export function partesDoDia(iso: string): { semana: string; dia: string; mes: string } {
  const d = emBrasilia(iso)
  return { semana: DIAS_CURTOS[d.getUTCDay()], dia: String(d.getUTCDate()), mes: MESES_CURTOS[d.getUTCMonth()] }
}

// "2026-11-26T12:30:00Z" -> "Qui, 26 de Nov" (data compacta do card "Próximo Agendamento").
export function dataCompacta(iso: string): string {
  const { semana, dia, mes } = partesDoDia(iso)
  return `${semana}, ${dia} de ${mes}`
}

// 0 -> "agora"; 12 -> "~12 min"; 96 -> "~1 h 36 min". Versão curta do tempoEstimado para os quadros pequenos.
export function tempoCurto(minutos: number): string {
  if (minutos < 1) return 'agora'
  if (minutos < 60) return `~${minutos} min`
  const resto = minutos % 60
  return `~${Math.floor(minutos / 60)} h${resto ? ` ${resto} min` : ''}`
}
