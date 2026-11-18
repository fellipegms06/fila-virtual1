import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { render } from '@testing-library/react'
import type { ReactElement } from 'react'
import { MemoryRouter } from 'react-router-dom'
import { AuthProvider } from '../auth/AuthContext'
import { salvarSessao, type Sessao } from '../auth/sessao'

// Monta um token JWT de mentira (só o conteúdo importa: o painel não valida assinatura).
export function tokenFalso(dados: Record<string, unknown>): string {
  const base64url = (o: object) =>
    // Codifica em UTF-8 antes do base64, como um JWT de verdade (senão nomes com acento quebram).
    btoa(String.fromCharCode(...new TextEncoder().encode(JSON.stringify(o)))).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '')
  return `${base64url({ alg: 'HS256', typ: 'JWT' })}.${base64url(dados)}.assinatura`
}

export function sessaoDeAtendente(parcial: Partial<Sessao> = {}): Sessao {
  return {
    token: tokenFalso({ sub: 'u1', role: 'Atendente', unidade: 'unidade-1', exp: 9999999999 }),
    usuarioId: 'u1',
    nome: 'Ana Atendente',
    perfil: 'Atendente',
    unidadeId: 'unidade-1',
    expiraEm: Date.now() + 3600_000,
    ...parcial,
  }
}

// Renderiza uma tela com tudo o que ela precisa em volta (rotas, sessão, cache de consultas).
export function renderizar(ui: ReactElement, { rota = '/', sessao }: { rota?: string; sessao?: Sessao } = {}) {
  if (sessao) salvarSessao(sessao)
  const queryClient = new QueryClient({ defaultOptions: { queries: { retry: false }, mutations: { retry: false } } })
  return render(
    <QueryClientProvider client={queryClient}>
      <MemoryRouter initialEntries={[rota]}>
        <AuthProvider>{ui}</AuthProvider>
      </MemoryRouter>
    </QueryClientProvider>,
  )
}
