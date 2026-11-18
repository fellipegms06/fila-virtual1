import { AxiosError, create, isAxiosError } from 'axios'
import { API_URL } from '../config'
import type { Problema } from './tipos'

// Cliente HTTP único do app. O token é lido a cada requisição (função injetada pela sessão),
// assim o cliente não precisa ser recriado quando a pessoa entra ou sai.
export const api = create({ baseURL: `${API_URL}/api`, timeout: 15000 })

let obterToken: () => string | null = () => null
let aoExpirarSessao: () => void = () => {}

export function configurarAutenticacao(token: () => string | null, sessaoExpirada: () => void) {
  obterToken = token
  aoExpirarSessao = sessaoExpirada
}

api.interceptors.request.use((config) => {
  const token = obterToken()
  if (token) config.headers.Authorization = `Bearer ${token}`
  return config
})

api.interceptors.response.use(
  (resposta) => resposta,
  (erro: AxiosError) => {
    // 401 com sessão aberta = token vencido ou inválido: volta para o login.
    if (erro.response?.status === 401 && obterToken()) aoExpirarSessao()
    return Promise.reject(erro)
  },
)

// Transforma qualquer erro numa frase curta para mostrar ao cidadão.
// A API já manda a mensagem em português (ProblemDetails.title / detail).
export function mensagemDeErro(erro: unknown): string {
  if (isAxiosError(erro)) {
    if (!erro.response) return 'Sem conexão com o servidor. Verifique sua internet e tente de novo.'
    const problema = erro.response.data as Problema | undefined
    if (problema?.status === 400 && problema.detail) return problema.detail
    if (problema?.title) return problema.title
    return `Algo deu errado (código ${erro.response.status}). Tente de novo.`
  }
  return 'Algo deu errado. Tente de novo.'
}

// Erros de validação por campo ({ cpf: "CPF inválido." }), para mostrar embaixo de cada campo.
export function errosDosCampos(erro: unknown): Record<string, string> {
  if (!isAxiosError(erro)) return {}
  const errors = (erro.response?.data as Problema | undefined)?.errors ?? {}
  return Object.fromEntries(Object.entries(errors).map(([campo, msgs]) => [campo, msgs[0]]))
}
