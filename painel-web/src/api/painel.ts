import { api } from './cliente'
import type { FilaDoDia, Indicadores, PainelSenha, Servico } from './tipos'

// Chamadas das rotas /api/painel (RF11). "unidade" só é preenchida para o administrador;
// para o atendente a API usa a unidade do token.
type Unidade = { unidadeId?: string }

export async function obterFila(unidade: Unidade): Promise<FilaDoDia> {
  const { data } = await api.get<FilaDoDia>('/painel/fila', { params: unidade })
  return data
}

export async function chamarProximo(guiche: string, unidade: Unidade): Promise<PainelSenha> {
  const { data } = await api.post<PainelSenha>('/painel/chamar-proximo', { guiche, ...unidade })
  return data
}

export async function concluirAtendimento(senhaId: string, unidade: Unidade): Promise<PainelSenha> {
  const { data } = await api.post<PainelSenha>(`/painel/senhas/${senhaId}/concluir`, null, { params: unidade })
  return data
}

export async function cancelarSenha(senhaId: string, unidade: Unidade): Promise<PainelSenha> {
  const { data } = await api.post<PainelSenha>(`/painel/senhas/${senhaId}/cancelar`, null, { params: unidade })
  return data
}

export async function fazerCheckin(codigo: string, preferencial: boolean, unidade: Unidade): Promise<PainelSenha> {
  const { data } = await api.post<PainelSenha>('/painel/checkin', { codigo, preferencial, ...unidade })
  return data
}

export async function emitirSenhaPresencial(servicoId: string, preferencial: boolean, unidade: Unidade): Promise<PainelSenha> {
  const { data } = await api.post<PainelSenha>('/painel/senhas', { servicoId, preferencial, ...unidade })
  return data
}

export async function listarServicos(unidadeId: string): Promise<Servico[]> {
  const { data } = await api.get<Servico[]>(`/unidades/${unidadeId}/servicos`)
  return data
}

export async function obterIndicadores(unidade: Unidade, data?: string): Promise<Indicadores> {
  const { data: resposta } = await api.get<Indicadores>('/painel/indicadores', { params: { ...unidade, data } })
  return resposta
}

export async function enviarAviso(mensagem: string, unidade: Unidade): Promise<{ pessoasAvisadas: number }> {
  const { data } = await api.post<{ pessoasAvisadas: number }>('/painel/avisos', { mensagem, ...unidade })
  return data
}
