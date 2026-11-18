import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { act, renderHook, waitFor } from '@testing-library/react'
import type { ReactNode } from 'react'
import { MemoryRouter } from 'react-router-dom'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { AuthProvider } from '../auth/AuthContext'
import { salvarSessao } from '../auth/sessao'
import { sessaoDeAtendente } from '../testes/utilitarios'
import { useFilaTempoReal } from './useFilaTempoReal'

// Conexão SignalR falsa: guarda os handlers registrados para o teste disparar eventos "da API".
const falsa = vi.hoisted(() => ({
  handlers: {} as Record<string, (...args: unknown[]) => void>,
  invocacoes: [] as unknown[][],
  url: '',
  token: '',
}))

vi.mock('@microsoft/signalr', () => {
  class Builder {
    withUrl(url: string, opcoes: { accessTokenFactory: () => string }) {
      falsa.url = url
      falsa.token = opcoes.accessTokenFactory()
      return this
    }
    withAutomaticReconnect() { return this }
    configureLogging() { return this }
    build() {
      return {
        state: 'Connected',
        on: (evento: string, fn: (...args: unknown[]) => void) => { falsa.handlers[evento] = fn },
        onreconnecting: () => {},
        onreconnected: () => {},
        onclose: () => {},
        start: async () => {},
        stop: async () => {},
        invoke: async (...args: unknown[]) => { falsa.invocacoes.push(args) },
      }
    }
  }
  return { HubConnectionBuilder: Builder, HubConnectionState: { Disconnected: 'Disconnected' }, LogLevel: { Warning: 3 } }
})

function montar(queryClient: QueryClient) {
  return ({ children }: { children: ReactNode }) => (
    <QueryClientProvider client={queryClient}>
      <MemoryRouter><AuthProvider>{children}</AuthProvider></MemoryRouter>
    </QueryClientProvider>
  )
}

describe('useFilaTempoReal', () => {
  beforeEach(() => {
    falsa.handlers = {}
    falsa.invocacoes = []
  })

  it('conecta no hub com o token, entra no grupo da unidade e recarrega a fila a cada evento', async () => {
    const sessao = sessaoDeAtendente()
    salvarSessao(sessao)
    const queryClient = new QueryClient()
    const invalidar = vi.spyOn(queryClient, 'invalidateQueries')
    const aoChamar = vi.fn()

    const { result } = renderHook(() => useFilaTempoReal(aoChamar), { wrapper: montar(queryClient) })

    await waitFor(() => expect(result.current).toBe('conectado'))
    expect(falsa.url).toMatch(/\/hubs\/fila$/)
    expect(falsa.token).toBe(sessao.token)
    expect(falsa.invocacoes).toContainEqual(['EntrarNaUnidade', 'unidade-1'])

    act(() => falsa.handlers.FilaAtualizada({ unidadeId: 'unidade-1' }))
    expect(invalidar).toHaveBeenCalledWith({ queryKey: ['fila', 'unidade-1'] })

    const evento = { unidadeId: 'unidade-1', senhaId: 'x', codigo: 'P003', guiche: 'Guichê 2', servico: 'Atualização' }
    act(() => falsa.handlers.SenhaChamada(evento))
    expect(aoChamar).toHaveBeenCalledWith(evento)
  })
})
