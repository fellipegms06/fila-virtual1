import { api } from './cliente'
import type { MinhaFila, Senha } from './tipos'

// RF08: entrar na fila virtual de uma unidade, sem agendamento.
export const entrarNaFila = (unidadeId: string, servicoId: string) =>
  api.post<Senha>('/fila/entrar', { unidadeId, servicoId }).then((r) => r.data)

// RF09: minha senha, posição, tempo estimado e senha chamada agora.
export const consultarMinhaFila = () => api.get<MinhaFila>('/fila/minha').then((r) => r.data)

export const sairDaFila = () => api.delete('/fila/minha').then(() => undefined)
