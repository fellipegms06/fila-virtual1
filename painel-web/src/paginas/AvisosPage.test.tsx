import { screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import * as painel from '../api/painel'
import { renderizar, sessaoDeAtendente } from '../testes/utilitarios'
import { AvisosPage } from './AvisosPage'

vi.mock('../api/painel')

describe('AvisosPage', () => {
  beforeEach(() => {
    vi.mocked(painel.enviarAviso).mockReset()
  })

  it('pede confirmação antes de enviar e mostra quantas pessoas foram avisadas', async () => {
    vi.mocked(painel.enviarAviso).mockResolvedValue({ pessoasAvisadas: 3 })
    renderizar(<AvisosPage />, { sessao: sessaoDeAtendente() })

    await userEvent.type(screen.getByLabelText('Mensagem'), 'Sistema fora do ar.')
    await userEvent.click(screen.getByRole('button', { name: /Enviar aviso/ }))

    expect(painel.enviarAviso).not.toHaveBeenCalled()   // só a confirmação apareceu
    expect(screen.getByRole('alertdialog')).toHaveTextContent('Confirma o envio?')

    await userEvent.click(screen.getByRole('button', { name: 'Sim, enviar' }))

    expect(painel.enviarAviso).toHaveBeenCalledWith('Sistema fora do ar.', {})
    expect(await screen.findByText('Aviso enviado para 3 pessoas.')).toBeInTheDocument()
  })

  it('"Voltar" cancela sem enviar', async () => {
    renderizar(<AvisosPage />, { sessao: sessaoDeAtendente() })

    await userEvent.type(screen.getByLabelText('Mensagem'), 'Teste')
    await userEvent.click(screen.getByRole('button', { name: /Enviar aviso/ }))
    await userEvent.click(screen.getByRole('button', { name: 'Voltar' }))

    expect(screen.queryByRole('alertdialog')).not.toBeInTheDocument()
    expect(painel.enviarAviso).not.toHaveBeenCalled()
  })

  it('mensagem vazia não pode ser enviada', () => {
    renderizar(<AvisosPage />, { sessao: sessaoDeAtendente() })
    expect(screen.getByRole('button', { name: /Enviar aviso/ })).toBeDisabled()
  })
})
