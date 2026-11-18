import { screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { AxiosError, AxiosHeaders } from 'axios'
import { Route, Routes } from 'react-router-dom'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import * as authApi from '../api/auth'
import type { AuthResponse } from '../api/tipos'
import { RotaProtegida } from '../auth/RotaProtegida'
import { carregarSessao } from '../auth/sessao'
import { renderizar, tokenFalso } from '../testes/utilitarios'
import { LoginPage } from './LoginPage'

vi.mock('../api/auth')

function telas() {
  return (
    <Routes>
      <Route path="/login" element={<LoginPage />} />
      <Route path="/" element={<RotaProtegida><h1>Área logada</h1></RotaProtegida>} />
    </Routes>
  )
}

function respostaDeLogin(role: string) {
  return {
    token: tokenFalso({ sub: 'u1', role, unidade: 'unidade-1', exp: Math.floor(Date.now() / 1000) + 3600 }),
    expiraEm: new Date().toISOString(),
    usuario: { id: 'u1', nomeCompleto: 'Ana Atendente', email: 'ana@x', telefone: null, perfil: role, unidadeCrasId: 'unidade-1' },
  } as AuthResponse
}

describe('LoginPage', () => {
  // Com chaves de propósito: se o beforeEach RETORNAR uma função, o Vitest a executa como limpeza após o teste.
  beforeEach(() => {
    vi.mocked(authApi.entrar).mockReset()
  })

  it('sem sessão, a área logada manda para o login', () => {
    renderizar(telas(), { rota: '/' })
    expect(screen.getByRole('heading', { name: 'FilaVirtual' })).toBeInTheDocument()
  })

  it('atendente entra e é levado para o painel', async () => {
    vi.mocked(authApi.entrar).mockResolvedValue(respostaDeLogin('Atendente'))
    renderizar(telas(), { rota: '/login' })

    await userEvent.type(screen.getByLabelText('E-mail'), 'ana@cras.dev')
    await userEvent.type(screen.getByLabelText('Senha'), 'atendente123')
    await userEvent.click(screen.getByRole('button', { name: 'Entrar' }))

    expect(await screen.findByRole('heading', { name: 'Área logada' })).toBeInTheDocument()
    expect(authApi.entrar).toHaveBeenCalledWith('ana@cras.dev', 'atendente123')
    expect(carregarSessao()?.unidadeId).toBe('unidade-1')
  })

  it('cidadão não entra no painel', async () => {
    vi.mocked(authApi.entrar).mockResolvedValue(respostaDeLogin('Cidadao'))
    renderizar(telas(), { rota: '/login' })

    await userEvent.type(screen.getByLabelText('E-mail'), 'maria@email.com')
    await userEvent.type(screen.getByLabelText('Senha'), 'cidadao123')
    await userEvent.click(screen.getByRole('button', { name: 'Entrar' }))

    expect(await screen.findByRole('alert')).toHaveTextContent('Este painel é só para servidores do CRAS')
    expect(carregarSessao()).toBeNull()
  })

  it('mostra a mensagem da API quando a senha está errada', async () => {
    // mockImplementation (e não mockRejectedValue): a promise só é rejeitada quando o login é chamado.
    const erro401 = new AxiosError('401', 'ERR', undefined, undefined, {
      status: 401, statusText: '', headers: {}, config: { headers: new AxiosHeaders() },
      data: { title: 'E-mail ou senha incorretos.', status: 401 },
    })
    vi.mocked(authApi.entrar).mockImplementation(async () => { throw erro401 })
    renderizar(telas(), { rota: '/login' })

    await userEvent.type(screen.getByLabelText('E-mail'), 'ana@cras.dev')
    await userEvent.type(screen.getByLabelText('Senha'), 'errada')
    await userEvent.click(screen.getByRole('button', { name: 'Entrar' }))

    expect(await screen.findByRole('alert')).toHaveTextContent('E-mail ou senha incorretos.')
  })

  it('campos vazios são avisados sem chamar a API', async () => {
    renderizar(telas(), { rota: '/login' })
    await userEvent.click(screen.getByRole('button', { name: 'Entrar' }))

    await waitFor(() => expect(screen.getByRole('alert')).toHaveTextContent('Informe o e-mail e a senha.'))
    expect(authApi.entrar).not.toHaveBeenCalled()
  })
})
