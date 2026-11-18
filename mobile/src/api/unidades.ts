import { api } from './cliente'
import type { Horario, UnidadeDetalhe, UnidadeResumo } from './tipos'

export interface Coordenadas {
  latitude: number
  longitude: number
}

// RF03: com a localização, a API calcula a distância e devolve da mais perto para a mais longe.
export const listarUnidades = (posicao?: Coordenadas | null) =>
  api
    .get<UnidadeResumo[]>('/unidades', { params: posicao ? { lat: posicao.latitude, lng: posicao.longitude } : undefined })
    .then((r) => r.data)

// RF04 e RF05: endereço, horário, telefone e serviços com o checklist de documentos.
export const obterUnidade = (id: string) => api.get<UnidadeDetalhe>(`/unidades/${id}`).then((r) => r.data)

// RF06: horários com vaga nos próximos 14 dias (o app agrupa por dia).
export const listarHorarios = (unidadeId: string, servicoId: string) =>
  api.get<Horario[]>(`/unidades/${unidadeId}/horarios`, { params: { servicoId } }).then((r) => r.data)
