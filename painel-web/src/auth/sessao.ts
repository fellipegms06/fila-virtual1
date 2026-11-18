import type { Perfil } from '../api/tipos'

// Dados que o painel precisa saber sobre quem está logado, lidos do próprio token JWT.
export interface Sessao {
  token: string
  usuarioId: string
  nome: string
  perfil: Perfil
  unidadeId: string | null   // só atendentes têm
  expiraEm: number           // milissegundos (Date.now())
}

// sessionStorage (e não localStorage): fechar a aba encerra a sessão. Faz sentido num computador
// de atendimento que pode ser usado por mais de um servidor.
const CHAVE = 'filavirtual.painel.sessao'

// O JWT tem três partes separadas por ponto; a do meio é um JSON em base64url.
// Ler o conteúdo NÃO valida a assinatura: isso é trabalho da API. Aqui só usamos para mostrar dados na tela.
export function lerToken(token: string): { sub: string; role: Perfil; unidade?: string; exp: number } | null {
  try {
    const parte = token.split('.')[1]
    const base64 = parte.replace(/-/g, '+').replace(/_/g, '/').padEnd(Math.ceil(parte.length / 4) * 4, '=')
    const json = new TextDecoder().decode(Uint8Array.from(atob(base64), (c) => c.charCodeAt(0)))
    return JSON.parse(json)
  } catch {
    return null
  }
}

export function criarSessao(token: string, nome: string): Sessao | null {
  const dados = lerToken(token)
  if (!dados) return null
  return {
    token,
    usuarioId: dados.sub,
    nome,
    perfil: dados.role,
    unidadeId: dados.unidade ?? null,
    expiraEm: dados.exp * 1000,
  }
}

export const podeUsarPainel = (perfil: Perfil) => perfil === 'Atendente' || perfil === 'Administrador'

export function salvarSessao(sessao: Sessao) {
  try {
    sessionStorage.setItem(CHAVE, JSON.stringify(sessao))
  } catch {
    // Navegador sem armazenamento (modo privado restrito): a sessão vale só enquanto a página estiver aberta.
  }
}

export function carregarSessao(agora = Date.now()): Sessao | null {
  try {
    const texto = sessionStorage.getItem(CHAVE)
    if (!texto) return null
    const sessao = JSON.parse(texto) as Sessao
    return sessao.expiraEm > agora ? sessao : null
  } catch {
    return null
  }
}

export function apagarSessao() {
  try {
    sessionStorage.removeItem(CHAVE)
  } catch {
    // ignora
  }
}
