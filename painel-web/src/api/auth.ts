import { api } from './cliente'
import type { AuthResponse, UnidadeResumo } from './tipos'

export async function entrar(email: string, senha: string): Promise<AuthResponse> {
  const { data } = await api.post<AuthResponse>('/auth/login', { email, senha })
  return data
}

// Usado pelo administrador para escolher qual unidade gerenciar.
export async function listarUnidades(): Promise<UnidadeResumo[]> {
  const { data } = await api.get<UnidadeResumo[]>('/unidades')
  return data
}
