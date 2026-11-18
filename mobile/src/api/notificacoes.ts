import { api } from './cliente'
import type { Notificacao } from './tipos'

// RF10
export const listarNotificacoes = () => api.get<Notificacao[]>('/notificacoes').then((r) => r.data)

export const marcarComoLida = (id: string) => api.patch(`/notificacoes/${id}/lida`).then(() => undefined)

export const marcarTodasComoLidas = () => api.patch('/notificacoes/lidas').then(() => undefined)
