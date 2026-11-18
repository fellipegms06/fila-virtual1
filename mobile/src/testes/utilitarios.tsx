import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { render } from '@testing-library/react-native'
import * as SecureStore from 'expo-secure-store'
import type { ReactElement, ReactNode } from 'react'
import { SafeAreaProvider } from 'react-native-safe-area-context'
import type { RespostaAuth, Usuario } from '@/api/tipos'
import { AuthProvider, useAuth } from '@/auth/AuthContext'
import { sessaoDaResposta } from '@/auth/sessao'

export const usuarioCidadao = (extra: Partial<Usuario> = {}): Usuario => ({
  id: 'usuario-1',
  nomeCompleto: 'Maria da Silva',
  cpf: '52998224725',
  dataNascimento: '1950-12-25',
  email: 'maria@exemplo.com',
  telefone: '11987654321',
  perfil: 'Cidadao',
  unidadeCrasId: null,
  ...extra,
})

export const respostaAuth = (usuario: Usuario = usuarioCidadao()): RespostaAuth => ({
  token: 'token-de-teste',
  expiraEm: new Date(Date.now() + 8 * 3600_000).toISOString(),
  usuario,
})

// Medidas fixas de um celular de 360x800 sem entalhe: o cabeçalho azul-marinho lê a área segura do topo.
const METRICAS = { frame: { x: 0, y: 0, width: 360, height: 800 }, insets: { top: 0, left: 0, right: 0, bottom: 0 } }

export function AreaSegura({ children }: { children: ReactNode }) {
  return <SafeAreaProvider initialMetrics={METRICAS}>{children}</SafeAreaProvider>
}

// Só mostra a tela depois que o AuthProvider terminou de ler a sessão salva (como no app real).
function DepoisDeCarregar({ children }: { children: ReactNode }) {
  const { carregando } = useAuth()
  return carregando ? null : children
}

// Renderiza uma tela com os mesmos provedores do app. Com `logado`, já existe uma sessão salva.
export async function renderizar(tela: ReactElement, { logado = false, usuario }: { logado?: boolean; usuario?: Usuario } = {}) {
  if (logado) {
    await SecureStore.setItemAsync('filavirtual.sessao', JSON.stringify(sessaoDaResposta(respostaAuth(usuario))))
  }
  // gcTime Infinity: sem timers de limpeza de cache pendurados depois do teste.
  const queryClient = new QueryClient({ defaultOptions: { queries: { retry: false, gcTime: Infinity }, mutations: { retry: false, gcTime: Infinity } } })
  return render(
    <AreaSegura>
      <QueryClientProvider client={queryClient}>
        <AuthProvider>
          <DepoisDeCarregar>{tela}</DepoisDeCarregar>
        </AuthProvider>
      </QueryClientProvider>
    </AreaSegura>,
  )
}

// Erro no formato que o axios gera quando a API responde com ProblemDetails.
export function erroDaApi(status: number, problema: { title?: string; detail?: string; errors?: Record<string, string[]> }) {
  return Object.assign(new Error(`HTTP ${status}`), {
    isAxiosError: true,
    response: { status, data: { status, ...problema } },
  })
}
