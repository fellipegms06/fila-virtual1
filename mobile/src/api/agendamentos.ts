import { api } from './cliente'
import type { Agendamento } from './tipos'

// RF06
export const agendar = (horarioAtendimentoId: string) =>
  api.post<Agendamento>('/agendamentos', { horarioAtendimentoId }).then((r) => r.data)

// RF07
export const listarMeusAgendamentos = () => api.get<Agendamento[]>('/agendamentos/meus').then((r) => r.data)

export const cancelarAgendamento = (id: string) => api.delete(`/agendamentos/${id}`).then(() => undefined)
