import { HubConnectionBuilder, HubConnectionState, LogLevel, type HubConnection } from '@microsoft/signalr'
import { useQueryClient } from '@tanstack/react-query'
import { useEffect, useRef, useState } from 'react'
import { useAuth } from '../auth/AuthContext'
import { API_URL } from '../config'

export type EstadoConexao = 'conectando' | 'conectado' | 'reconectando' | 'desconectado'

export interface SenhaChamadaEvento {
  unidadeId: string
  senhaId: string
  codigo: string
  guiche: string
  servico: string
}

// Liga o painel ao hub /hubs/fila (SignalR, RN07). Quando a API avisa que a fila mudou,
// as consultas da tela são marcadas como desatualizadas e o React Query busca de novo.
// Assim o painel de todos os guichês fica igual sem ninguém apertar F5.
export function useFilaTempoReal(aoChamarSenha?: (evento: SenhaChamadaEvento) => void): EstadoConexao {
  const { sessao, unidadeId } = useAuth()
  const queryClient = useQueryClient()
  const [estado, setEstado] = useState<EstadoConexao>('conectando')
  // Guarda sempre a versão mais nova do callback, sem precisar refazer a conexão quando ele muda.
  const callbackRef = useRef(aoChamarSenha)
  useEffect(() => {
    callbackRef.current = aoChamarSenha
  })

  useEffect(() => {
    if (!sessao || !unidadeId) return

    const conexao: HubConnection = new HubConnectionBuilder()
      // O navegador não deixa mandar cabeçalho num WebSocket: o token vai na URL (a API aceita isso só em /hubs).
      .withUrl(`${API_URL}/hubs/fila`, { accessTokenFactory: () => sessao.token })
      .withAutomaticReconnect()
      .configureLogging(LogLevel.Warning)
      .build()

    const atualizar = () => {
      queryClient.invalidateQueries({ queryKey: ['fila', unidadeId] })
      queryClient.invalidateQueries({ queryKey: ['indicadores', unidadeId] })
    }

    // O atendente já entra no grupo da unidade pelo token; o administrador precisa pedir.
    const entrarNoGrupo = () => conexao.invoke('EntrarNaUnidade', unidadeId)

    conexao.on('FilaAtualizada', atualizar)
    conexao.on('SenhaChamada', (evento: SenhaChamadaEvento) => {
      atualizar()
      callbackRef.current?.(evento)
    })
    conexao.onreconnecting(() => setEstado('reconectando'))
    conexao.onreconnected(async () => {
      setEstado('conectado')
      await entrarNoGrupo()
      atualizar()   // pode ter perdido eventos enquanto estava fora
    })
    let cancelado = false
    // Ao trocar de unidade, a conexão antiga é fechada de propósito: isso não deve aparecer como "desconectado".
    conexao.onclose(() => {
      if (!cancelado) setEstado('desconectado')
    })

    conexao
      .start()
      .then(async () => {
        if (cancelado) return
        await entrarNoGrupo()
        setEstado('conectado')
      })
      .catch(() => {
        if (!cancelado) setEstado('desconectado')
      })

    return () => {
      cancelado = true
      setEstado('conectando')   // a próxima conexão (se houver) começa do zero
      if (conexao.state !== HubConnectionState.Disconnected) void conexao.stop()
    }
  }, [sessao, unidadeId, queryClient])

  return estado
}
