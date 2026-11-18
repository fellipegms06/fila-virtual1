import type { Agendamento, Horario, StatusAtendimento } from '../api/tipos'
import type { TipoTag } from '../components/StatusTag'
import { diaIso } from './formatar'

export interface DiaComHorarios {
  dia: string // "2026-11-10" (no horário de Brasília)
  primeiroHorario: string // ISO do primeiro horário, usado para escrever o dia por extenso
  horarios: Horario[]
}

// A API manda uma lista corrida de horários dos próximos 14 dias; a tela mostra primeiro os dias
// e depois os horários do dia escolhido. Só aparecem dias que têm pelo menos uma vaga.
export function agruparPorDia(horarios: Horario[]): DiaComHorarios[] {
  const porDia = new Map<string, Horario[]>()
  for (const h of [...horarios].sort((a, b) => a.dataHora.localeCompare(b.dataHora))) {
    if (h.vagasDisponiveis <= 0) continue
    const dia = diaIso(h.dataHora)
    porDia.set(dia, [...(porDia.get(dia) ?? []), h])
  }
  return [...porDia].map(([dia, lista]) => ({ dia, primeiroHorario: lista[0].dataHora, horarios: lista }))
}

// Como cada status aparece para o cidadão (texto simples + cor da etiqueta).
export const STATUS_AGENDAMENTO: Record<StatusAtendimento, { texto: string; tipo: TipoTag }> = {
  Confirmado: { texto: 'Confirmado', tipo: 'sucesso' }, // verde claro, como a tag "✓ Confirmado" do protótipo
  Aguardando: { texto: 'Na fila', tipo: 'alerta' },
  EmAtendimento: { texto: 'Em atendimento', tipo: 'sucesso' },
  Concluido: { texto: 'Concluído', tipo: 'neutro' },
  Cancelado: { texto: 'Cancelado', tipo: 'neutro' },
}

// "Próximos" = ainda vão acontecer ou estão acontecendo; o resto vai para o histórico.
export function separarAgendamentos(lista: Agendamento[], agora = Date.now()) {
  const ativo = (a: Agendamento) =>
    a.status === 'Aguardando' || a.status === 'EmAtendimento' ||
    // Confirmado continua "próximo" até 1 hora depois do horário (a pessoa pode estar chegando).
    (a.status === 'Confirmado' && new Date(a.dataHora).getTime() > agora - 3600_000)

  const porData = (a: Agendamento, b: Agendamento) => a.dataHora.localeCompare(b.dataHora)
  return {
    proximos: lista.filter(ativo).sort(porData),
    historico: lista.filter((a) => !ativo(a)).sort((a, b) => porData(b, a)),
  }
}

// Passos do agendamento como aparecem nas abas do protótipo (o 1º é a lista de unidades da aba Agendar).
export const PASSOS_AGENDAMENTO = ['Unidade', 'Serviço', 'Data e Hora', 'Confirmar']
