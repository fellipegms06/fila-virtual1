import axios, { AxiosError } from 'axios'
import { API_URL } from '../config'
import type { Problema } from './tipos'

// Cliente HTTP único do painel. O token é lido a cada requisição (função injetada pela sessão),
// assim o cliente não precisa ser recriado quando o atendente entra ou sai.
export const api = axios.create({ baseURL: `${API_URL}/api`, timeout: 15000 })

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

// Transforma qualquer erro numa frase para mostrar ao atendente.
// A API já manda a mensagem em português (ProblemDetails.title / detail).
export function mensagemDeErro(erro: unknown): string {
  if (axios.isAxiosError(erro)) {
    if (!erro.response) return 'Não foi possível falar com o servidor. Verifique a conexão e se a API está rodando.'
    const problema = erro.response.data as Problema | undefined
    if (problema?.status === 400 && problema.detail) return problema.detail
    if (problema?.title) return problema.title
    return `Erro inesperado (código ${erro.response.status}).`
  }
  return 'Ocorreu um erro inesperado.'
}
