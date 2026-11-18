import { screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { AxiosError, AxiosHeaders } from 'axios'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import * as painel from '../api/painel'
import { senha } from '../testes/dados'
import { renderizar, sessaoDeAtendente } from '../testes/utilitarios'
import { CheckinPage } from './CheckinPage'

vi.mock('../api/painel')

describe('CheckinPage', () => {
  beforeEach(() => {
    vi.mocked(painel.fazerCheckin).mockReset()
  })

  it('aceita o código colado em minúsculas e com espaço, e mostra a senha gerada', async () => {
    vi.mocked(painel.fazerCheckin).mockResolvedValue(senha({ codigo: 'N007', cidadao: 'Cidadã de Teste', temAgendamento: true }))
    renderizar(<CheckinPage />, { sessao: sessaoDeAtendente() })

    await userEvent.type(screen.getByLabelText('Código do agendamento'), '7c5e 1f89')
    await userEvent.click(screen.getByLabelText(/Atendimento preferencial/))
    await userEvent.click(screen.getByRole('button', { name: 'Fazer check-in' }))

    expect(painel.fazerCheckin).toHaveBeenCalledWith('7C5E1F89', true, {})
    expect(await screen.findByLabelText('Senha N007')).toBeInTheDocument()
    expect(screen.getByText(/Cidadã de Teste/)).toBeInTheDocument()
  })

  it('código incompleto é barrado antes de chamar a API', async () => {
    renderizar(<CheckinPage />, { sessao: sessaoDeAtendente() })

    await userEvent.type(screen.getByLabelText('Código do agendamento'), 'ABC')
    await userEvent.click(screen.getByRole('button', { name: 'Fazer check-in' }))

    expect(screen.getByRole('alert')).toHaveTextContent('8 caracteres')
    expect(painel.fazerCheckin).not.toHaveBeenCalled()
  })

  it('agendamento de outro dia: mostra o motivo vindo da API', async () => {
    vi.mocked(painel.fazerCheckin).mockImplementation(async () => {
      throw new AxiosError('422', 'ERR', undefined, undefined, {
        status: 422, statusText: '', headers: {}, config: { headers: new AxiosHeaders() },
        data: { title: 'Este agendamento é para 12/11 às 09:00, não para hoje.', status: 422 },
      })
    })
    renderizar(<CheckinPage />, { sessao: sessaoDeAtendente() })

    await userEvent.type(screen.getByLabelText('Código do agendamento'), 'ABCDEF12')
    await userEvent.click(screen.getByRole('button', { name: 'Fazer check-in' }))

    expect(await screen.findByRole('alert')).toHaveTextContent('não para hoje')
  })
})
