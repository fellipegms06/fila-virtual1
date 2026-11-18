import { FUSO_HORARIO } from '../config'

// A API manda horários em UTC; o atendente lê no horário de Brasília, seja qual for o fuso do computador.
const formatoHora = new Intl.DateTimeFormat('pt-BR', { hour: '2-digit', minute: '2-digit', timeZone: FUSO_HORARIO })
const formatoData = new Intl.DateTimeFormat('pt-BR', { day: '2-digit', month: '2-digit', year: 'numeric', timeZone: FUSO_HORARIO })

export const hora = (iso: string) => formatoHora.format(new Date(iso))

// "2026-11-10" (DateOnly da API) -> "10/11/2026". Lido como meio-dia UTC para não "voltar um dia" no fuso.
export const dataCurta = (diaIso: string) => formatoData.format(new Date(`${diaIso}T12:00:00Z`))

export function minutosDesde(iso: string, agora: number = Date.now()): number {
  return Math.max(0, Math.floor((agora - new Date(iso).getTime()) / 60000))
}

// 0,4 -> "< 1 min", 12 -> "12 min", 75 -> "1 h 15 min"
export function duracao(minutos: number | null | undefined): string {
  if (minutos == null) return '—'
  const m = Math.round(minutos)
  if (m < 1) return '< 1 min'
  if (m < 60) return `${m} min`
  const h = Math.floor(m / 60)
  const resto = m % 60
  return resto ? `${h} h ${resto} min` : `${h} h`
}

export const porcentagem = (fracao: number) => `${(fracao * 100).toLocaleString('pt-BR', { maximumFractionDigits: 1 })}%`
