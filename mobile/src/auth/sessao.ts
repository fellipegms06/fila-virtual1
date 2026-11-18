import type { RespostaAuth, Usuario } from '../api/tipos'
import { apagar, gravar, ler } from './armazenamento'

// O que o app guarda de quem está logado: o token e os dados que a API devolveu no login.
export interface Sessao {
  token: string
  expiraEm: number // milissegundos (Date.now())
  usuario: Usuario
}

const CHAVE = 'filavirtual.sessao'

export const sessaoDaResposta = (r: RespostaAuth): Sessao => ({
  token: r.token,
  expiraEm: new Date(r.expiraEm).getTime(),
  usuario: r.usuario,
})

export const salvarSessao = (sessao: Sessao) => gravar(CHAVE, JSON.stringify(sessao))

export const apagarSessao = () => apagar(CHAVE)

// Lê a sessão salva. Sessão vencida ou corrompida conta como "não logado" (e é apagada).
export async function carregarSessao(agora = Date.now()): Promise<Sessao | null> {
  try {
    const texto = await ler(CHAVE)
    if (!texto) return null
    const sessao = JSON.parse(texto) as Sessao
    if (sessao.expiraEm > agora && sessao.token && sessao.usuario) return sessao
  } catch {
    // JSON inválido: cai no apagar abaixo
  }
  await apagarSessao()
  return null
}
