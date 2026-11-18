import { api } from './cliente'
import type { DadosCadastro, DadosPerfil, RespostaAuth, Usuario } from './tipos'

// RF02
export const entrar = (email: string, senha: string) =>
  api.post<RespostaAuth>('/auth/login', { email, senha }).then((r) => r.data)

// RF01: a API já devolve o token, então a pessoa entra direto depois de se cadastrar.
export const cadastrar = (dados: DadosCadastro) =>
  api.post<RespostaAuth>('/auth/cadastro', dados).then((r) => r.data)

// RF12
export const obterMeusDados = () => api.get<Usuario>('/usuarios/me').then((r) => r.data)

export const atualizarMeusDados = (dados: DadosPerfil) =>
  api.put<Usuario>('/usuarios/me', dados).then((r) => r.data)
