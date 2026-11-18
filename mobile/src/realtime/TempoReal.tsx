import { HubConnectionBuilder, HubConnectionState, LogLevel, type HubConnection } from '@microsoft/signalr'
import { useQueryClient } from '@tanstack/react-query'
import { createContext, useCallback, useContext, useEffect, useRef, useState, type ReactNode } from 'react'
import { AppState } from 'react-native'
import { useAuth } from '../auth/AuthContext'
import { API_URL } from '../config'
import { mostrarNotificacao, prepararNotificacoes } from '../notificacoes/locais'

export type EstadoConexao = 'conectando' | 'conectado' | 'reconectando' | 'desconectado'

// Eventos que a API manda (nomes iguais aos do SignalRFilaNotifier no backend).
interface NotificacaoEvento {
  id: string
  titulo: string
  mensagem: string
  tipo: string
  criadaEm: string
}

interface ValorTempoReal {
  estado: EstadoConexao
  // A tela da fila informa de qual unidade a pessoa tem senha, para receber o movimento daquela fila.
  acompanharUnidade: (unidadeId: string | null) => void
}

const TempoRealContext = createContext<ValorTempoReal>({ estado: 'desconectado', acompanharUnidade: () => {} })

// Uma conexão SignalR por sessão, aberta enquanto a pessoa está logada (RN07).
// - "Notificacao" (só para esta pessoa): atualiza a aba Avisos e mostra aviso na barra do celular.
// - "SenhaChamada" e "FilaAtualizada" (da unidade): a tela da fila busca posição e tempo de novo.
// Os eventos não trazem os dados em si: o app consulta a API, que é a fonte da verdade.
export function TempoRealProvider({ children }: { children: ReactNode }) {
  const { sessao } = useAuth()
  const queryClient = useQueryClient()
  const [estado, setEstado] = useState<EstadoConexao>('conectando')
  const conexaoRef = useRef<HubConnection | null>(null)
  const unidadeRef = useRef<string | null>(null)
  const token = sessao?.token

  const atualizarFila = useCallback(() => {
    void queryClient.invalidateQueries({ queryKey: ['fila'] })
    void queryClient.invalidateQueries({ queryKey: ['agendamentos'] })
  }, [queryClient])

  // Entra no grupo da unidade acompanhada (ao conectar, ao reconectar e quando a unidade muda).
  const entrarNoGrupo = useCallback(async () => {
    const conexao = conexaoRef.current
    if (conexao?.state === HubConnectionState.Connected && unidadeRef.current)
      await conexao.invoke('EntrarNaUnidade', unidadeRef.current).catch(() => {})
  }, [])

  const acompanharUnidade = useCallback((unidadeId: string | null) => {
    if (unidadeRef.current === unidadeId) return
    const anterior = unidadeRef.current
    unidadeRef.current = unidadeId
    const conexao = conexaoRef.current
    if (anterior && conexao?.state === HubConnectionState.Connected)
      void conexao.invoke('SairDaUnidade', anterior).catch(() => {})
    void entrarNoGrupo()
  }, [entrarNoGrupo])

  useEffect(() => {
    if (!token) return
    void prepararNotificacoes()

    const conexao = new HubConnectionBuilder()
      // WebSocket não aceita cabeçalho Authorization: o token vai na URL (a API só aceita isso em /hubs).
      .withUrl(`${API_URL}/hubs/fila`, { accessTokenFactory: () => token })
      .withAutomaticReconnect()
      .configureLogging(LogLevel.None)
      .build()
    conexaoRef.current = conexao
    let cancelado = false

    conexao.on('FilaAtualizada', atualizarFila)
    conexao.on('SenhaChamada', atualizarFila)
    conexao.on('Notificacao', (n: NotificacaoEvento) => {
      void queryClient.invalidateQueries({ queryKey: ['notificacoes'] })
      atualizarFila() // "sua senha foi chamada", "faltam 3"... também mudam a tela da fila
      void mostrarNotificacao(n.titulo, n.mensagem)
    })
    conexao.onreconnecting(() => setEstado('reconectando'))
    conexao.onreconnected(async () => {
      setEstado('conectado')
      await entrarNoGrupo() // o servidor esquece os grupos de uma conexão que caiu
      atualizarFila() // pode ter perdido eventos enquanto estava fora
      void queryClient.invalidateQueries({ queryKey: ['notificacoes'] })
    })
    conexao.onclose(() => {
      if (!cancelado) setEstado('desconectado')
    })

    const iniciar = () =>
      conexao
        .start()
        .then(async () => {
          if (cancelado) return
          setEstado('conectado')
          await entrarNoGrupo()
        })
        .catch(() => {
          if (!cancelado) setEstado('desconectado')
        })
    void iniciar()

    // Celular em segundo plano costuma derrubar a conexão. Ao voltar para o app, reconecta e atualiza tudo.
    const assinatura = AppState.addEventListener('change', (situacao) => {
      if (situacao !== 'active' || cancelado) return
      if (conexao.state === HubConnectionState.Disconnected) {
        setEstado('conectando')
        void iniciar()
      }
      atualizarFila()
      void queryClient.invalidateQueries({ queryKey: ['notificacoes'] })
    })

    return () => {
      cancelado = true
      assinatura.remove()
      conexaoRef.current = null
      setEstado('conectando')
      if (conexao.state !== HubConnectionState.Disconnected) void conexao.stop()
    }
  }, [token, queryClient, atualizarFila, entrarNoGrupo])

  return <TempoRealContext.Provider value={{ estado, acompanharUnidade }}>{children}</TempoRealContext.Provider>
}

export const useTempoReal = () => useContext(TempoRealContext)
