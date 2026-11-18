import { useQueryClient } from '@tanstack/react-query'
import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState, type ReactNode } from 'react'
import { cadastrar as cadastrarNaApi, entrar as entrarNaApi } from '../api/auth'
import { configurarAutenticacao } from '../api/cliente'
import type { DadosCadastro, RespostaAuth, Usuario } from '../api/tipos'
import { apagarSessao, carregarSessao, salvarSessao, sessaoDaResposta, type Sessao } from './sessao'

interface ValorAuth {
  carregando: boolean // lendo a sessão salva ao abrir o app
  sessao: Sessao | null
  aviso: string | null // motivo de ter voltado ao login (ex.: sessão expirou)
  entrar: (email: string, senha: string) => Promise<void>
  cadastrar: (dados: DadosCadastro) => Promise<void>
  sair: (aviso?: string) => Promise<void>
  atualizarUsuario: (usuario: Usuario) => Promise<void>
}

const AuthContext = createContext<ValorAuth | null>(null)

export const MENSAGEM_SO_CIDADAO = 'Este aplicativo é para cidadãos. Servidores do CRAS usam o painel web.'
const MENSAGEM_EXPIROU = 'Sua sessão terminou. Entre de novo para continuar.'

export function AuthProvider({ children }: { children: ReactNode }) {
  const queryClient = useQueryClient()
  const [carregando, setCarregando] = useState(true)
  const [sessao, setSessao] = useState<Sessao | null>(null)
  const [aviso, setAviso] = useState<string | null>(null)

  // O interceptor do axios lê o token por esta ref, sempre com o valor mais novo.
  const tokenRef = useRef<string | null>(null)
  useEffect(() => {
    tokenRef.current = sessao?.token ?? null
  }, [sessao])

  const sair = useCallback(async (motivo?: string) => {
    tokenRef.current = null
    await apagarSessao()
    queryClient.clear() // não deixa dados de uma pessoa aparecerem para a próxima
    setAviso(motivo ?? null)
    setSessao(null)
  }, [queryClient])

  useEffect(() => {
    configurarAutenticacao(() => tokenRef.current, () => void sair(MENSAGEM_EXPIROU))
  }, [sair])

  // Ao abrir o app, recupera a sessão salva (a pessoa não precisa logar toda vez).
  useEffect(() => {
    carregarSessao().then((salva) => {
      setSessao(salva)
      setCarregando(false)
    })
  }, [])

  // O token vale 8 horas. Quando vencer com o app aberto, volta para o login com um aviso.
  useEffect(() => {
    if (!sessao) return
    const restante = sessao.expiraEm - Date.now()
    const timer = setTimeout(() => void sair(MENSAGEM_EXPIROU), Math.max(0, Math.min(restante, 2 ** 31 - 1)))
    return () => clearTimeout(timer)
  }, [sessao, sair])

  const abrirSessao = useCallback(async (resposta: RespostaAuth) => {
    // O app é só do cidadão; atendente e administrador usam o painel (o login deles é válido, mas não aqui).
    if (resposta.usuario.perfil !== 'Cidadao') throw new Error(MENSAGEM_SO_CIDADAO)
    const nova = sessaoDaResposta(resposta)
    await salvarSessao(nova)
    tokenRef.current = nova.token // já vale para as requisições das telas que vão abrir em seguida
    setAviso(null)
    setSessao(nova)
  }, [])

  const entrar = useCallback(
    async (email: string, senha: string) => abrirSessao(await entrarNaApi(email.trim(), senha)),
    [abrirSessao],
  )

  const cadastrar = useCallback(
    async (dados: DadosCadastro) => abrirSessao(await cadastrarNaApi(dados)),
    [abrirSessao],
  )

  // Depois de editar o perfil, a sessão guarda os dados novos (o token continua o mesmo).
  const atualizarUsuario = useCallback(async (usuario: Usuario) => {
    setSessao((atual) => {
      if (!atual) return atual
      const nova = { ...atual, usuario }
      void salvarSessao(nova)
      return nova
    })
  }, [])

  const valor = useMemo(
    () => ({ carregando, sessao, aviso, entrar, cadastrar, sair, atualizarUsuario }),
    [carregando, sessao, aviso, entrar, cadastrar, sair, atualizarUsuario],
  )

  return <AuthContext.Provider value={valor}>{children}</AuthContext.Provider>
}

export function useAuth(): ValorAuth {
  const valor = useContext(AuthContext)
  if (!valor) throw new Error('useAuth precisa estar dentro de <AuthProvider>.')
  return valor
}
