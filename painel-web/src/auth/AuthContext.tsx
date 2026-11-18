import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from 'react'
import { entrar } from '../api/auth'
import { configurarAutenticacao } from '../api/cliente'
import { apagarSessao, carregarSessao, criarSessao, podeUsarPainel, salvarSessao, type Sessao } from './sessao'

interface AuthValor {
  sessao: Sessao | null
  // Unidade que o painel está gerenciando: a do token (atendente) ou a escolhida (administrador).
  unidadeId: string | null
  escolherUnidade: (id: string) => void
  // Parâmetro "unidadeId" que vai nas chamadas: só o administrador precisa mandar.
  parametrosUnidade: { unidadeId?: string }
  aviso: string | null
  login: (email: string, senha: string) => Promise<void>
  logout: (aviso?: string) => void
}

const AuthContext = createContext<AuthValor | null>(null)
const CHAVE_UNIDADE = 'filavirtual.painel.unidadeAdmin'

function lerUnidadeAdmin(): string | null {
  try {
    return sessionStorage.getItem(CHAVE_UNIDADE)
  } catch {
    return null
  }
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [sessao, setSessao] = useState<Sessao | null>(() => carregarSessao())
  const [unidadeAdmin, setUnidadeAdmin] = useState<string | null>(() => lerUnidadeAdmin())
  const [aviso, setAviso] = useState<string | null>(null)

  const logout = useCallback((mensagem?: string) => {
    apagarSessao()
    try {
      sessionStorage.removeItem(CHAVE_UNIDADE)
    } catch {
      // ignora
    }
    setSessao(null)
    setUnidadeAdmin(null)
    setAviso(mensagem ?? null)
  }, [])

  // Liga o cliente HTTP à sessão: ele lê o token atual e avisa quando a API responder 401.
  useEffect(() => {
    configurarAutenticacao(
      () => sessao?.token ?? null,
      () => logout('Sua sessão expirou. Entre novamente.'),
    )
  }, [sessao, logout])

  // Sai sozinho quando o token vence (8 horas depois do login).
  useEffect(() => {
    if (!sessao) return
    const restante = sessao.expiraEm - Date.now()
    const timer = setTimeout(() => logout('Sua sessão expirou. Entre novamente.'), Math.max(restante, 0))
    return () => clearTimeout(timer)
  }, [sessao, logout])

  const login = useCallback(async (email: string, senha: string) => {
    const resposta = await entrar(email, senha)
    const nova = criarSessao(resposta.token, resposta.usuario.nomeCompleto)
    if (!nova) throw new Error('Resposta de login inválida.')
    // O cidadão tem conta válida, mas o painel é só para servidores do CRAS (RN10).
    if (!podeUsarPainel(nova.perfil)) throw new Error('Este painel é só para servidores do CRAS. Cidadãos usam o aplicativo.')
    salvarSessao(nova)
    setAviso(null)
    setSessao(nova)
  }, [])

  const escolherUnidade = useCallback((id: string) => {
    try {
      sessionStorage.setItem(CHAVE_UNIDADE, id)
    } catch {
      // ignora
    }
    setUnidadeAdmin(id)
  }, [])

  const valor = useMemo<AuthValor>(() => {
    const ehAdmin = sessao?.perfil === 'Administrador'
    const unidadeId = ehAdmin ? unidadeAdmin : (sessao?.unidadeId ?? null)
    return {
      sessao,
      unidadeId,
      escolherUnidade,
      parametrosUnidade: ehAdmin && unidadeId ? { unidadeId } : {},
      aviso,
      login,
      logout,
    }
  }, [sessao, unidadeAdmin, escolherUnidade, aviso, login, logout])

  return <AuthContext.Provider value={valor}>{children}</AuthContext.Provider>
}

// oxlint-disable-next-line react/only-export-components -- o hook mora junto do provider de propósito
export function useAuth(): AuthValor {
  const valor = useContext(AuthContext)
  if (!valor) throw new Error('useAuth precisa estar dentro de <AuthProvider>.')
  return valor
}
