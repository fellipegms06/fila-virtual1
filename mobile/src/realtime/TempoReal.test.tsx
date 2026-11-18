import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { act, fireEvent, render, screen } from '@testing-library/react-native'
import * as SecureStore from 'expo-secure-store'
import { useEffect, useState } from 'react'
import { Text } from 'react-native'
import { AuthProvider } from '@/auth/AuthContext'
import { sessaoDaResposta } from '@/auth/sessao'
import { mostrarNotificacao } from '@/notificacoes/locais'
import { respostaAuth } from '@/testes/utilitarios'
import { TempoRealProvider, useTempoReal } from './TempoReal'

jest.mock('@/notificacoes/locais', () => ({
  prepararNotificacoes: jest.fn(async () => true),
  mostrarNotificacao: jest.fn(async () => {}),
}))

// Conexão SignalR falsa: guarda os handlers para o teste disparar eventos "da API".
const mockConexao = {
  url: '',
  token: '',
  handlers: {} as Record<string, (...args: unknown[]) => unknown>,
  aoReconectar: null as null | (() => Promise<void>),
  invocacoes: [] as unknown[][],
}
jest.mock('@microsoft/signalr', () => {
  class Builder {
    withUrl(url: string, opcoes: { accessTokenFactory: () => string }) {
      mockConexao.url = url
      mockConexao.token = opcoes.accessTokenFactory()
      return this
    }
    withAutomaticReconnect() { return this }
    configureLogging() { return this }
    build() {
      return {
        state: 'Connected',
        on: (evento: string, fn: (...args: unknown[]) => unknown) => { mockConexao.handlers[evento] = fn },
        onreconnecting: () => {},
        onreconnected: (fn: () => Promise<void>) => { mockConexao.aoReconectar = fn },
        onclose: () => {},
        start: async () => {},
        stop: async () => {},
        invoke: async (...args: unknown[]) => { mockConexao.invocacoes.push(args) },
      }
    }
  }
  return {
    HubConnectionBuilder: Builder,
    HubConnectionState: { Connected: 'Connected', Disconnected: 'Disconnected' },
    LogLevel: { None: 6 },
  }
})

// Tela de mentira que acompanha uma unidade e mostra o estado da conexão.
function Acompanha({ unidadeId }: { unidadeId: string | null }) {
  const { estado, acompanharUnidade } = useTempoReal()
  useEffect(() => acompanharUnidade(unidadeId), [unidadeId, acompanharUnidade])
  return <Text>{estado}</Text>
}

// Permite trocar a unidade acompanhada sem desmontar a conexão.
function Trocavel() {
  const [unidadeId, setUnidadeId] = useState('unidade-1')
  return (
    <>
      <Acompanha unidadeId={unidadeId} />
      <Text onPress={() => setUnidadeId('unidade-2')}>trocar</Text>
    </>
  )
}

async function montar(unidadeId: string | null = 'unidade-1', conteudo = <Acompanha unidadeId={unidadeId} />) {
  await SecureStore.setItemAsync('filavirtual.sessao', JSON.stringify(sessaoDaResposta(respostaAuth())))
  const queryClient = new QueryClient({ defaultOptions: { queries: { gcTime: Infinity } } })
  const invalidar = jest.spyOn(queryClient, 'invalidateQueries')
  await render(
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <TempoRealProvider>
          {conteudo}
        </TempoRealProvider>
      </AuthProvider>
    </QueryClientProvider>,
  )
  await screen.findByText('conectado')
  return { invalidar }
}

const chaves = (invalidar: jest.SpyInstance) => invalidar.mock.calls.map((c) => (c[0] as { queryKey: string[] }).queryKey[0])

describe('TempoRealProvider (SignalR)', () => {
  beforeEach(() => {
    mockConexao.handlers = {}
    mockConexao.invocacoes = []
    mockConexao.aoReconectar = null
  })

  it('conecta no hub com o token da sessão e entra no grupo da unidade acompanhada', async () => {
    await montar('unidade-1')
    expect(mockConexao.url).toMatch(/\/hubs\/fila$/)
    expect(mockConexao.token).toBe('token-de-teste')
    expect(mockConexao.invocacoes).toContainEqual(['EntrarNaUnidade', 'unidade-1'])
  })

  it('movimento da fila faz a tela buscar posição e tempo de novo', async () => {
    const { invalidar } = await montar()
    await act(async () => { mockConexao.handlers.FilaAtualizada({ unidadeId: 'unidade-1' }) })
    expect(chaves(invalidar)).toEqual(expect.arrayContaining(['fila', 'agendamentos']))
  })

  it('notificação pessoal atualiza Avisos e aparece na barra do celular', async () => {
    const { invalidar } = await montar()
    await act(async () => {
      mockConexao.handlers.Notificacao({ id: 'n1', titulo: 'Sua senha foi chamada!', mensagem: 'Vá ao Guichê 1.', tipo: 'SenhaChamada', criadaEm: '' })
    })
    expect(chaves(invalidar)).toContain('notificacoes')
    expect(mostrarNotificacao).toHaveBeenCalledWith('Sua senha foi chamada!', 'Vá ao Guichê 1.')
  })

  it('ao reconectar, volta ao grupo da unidade (o servidor esquece) e recarrega a fila', async () => {
    const { invalidar } = await montar('unidade-1')
    mockConexao.invocacoes = []
    invalidar.mockClear()

    await act(async () => { await mockConexao.aoReconectar!() })

    expect(mockConexao.invocacoes).toContainEqual(['EntrarNaUnidade', 'unidade-1'])
    expect(chaves(invalidar)).toEqual(expect.arrayContaining(['fila', 'notificacoes']))
  })

  it('trocar de unidade sai do grupo antigo e entra no novo', async () => {
    await montar('unidade-1', <Trocavel />)
    await fireEvent.press(screen.getByText('trocar'))
    expect(mockConexao.invocacoes).toContainEqual(['SairDaUnidade', 'unidade-1'])
    expect(mockConexao.invocacoes).toContainEqual(['EntrarNaUnidade', 'unidade-2'])
  })
})
