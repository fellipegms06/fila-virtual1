import { screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it, vi } from 'vitest'
import * as painel from '../api/painel'
import { senha } from '../testes/dados'
import { renderizar, sessaoDeAtendente } from '../testes/utilitarios'
import { SenhaPresencialPage } from './SenhaPresencialPage'

vi.mock('../api/painel')

describe('SenhaPresencialPage', () => {
  it('lista os serviços da unidade e emite a senha com um clique', async () => {
    vi.mocked(painel.listarServicos).mockResolvedValue([
      { id: 's1', nome: 'Atualização cadastral', descricao: '', duracaoMediaMinutos: 30 },
      { id: 's2', nome: 'Inscrição no CadÚnico', descricao: '', duracaoMediaMinutos: 40 },
    ])
    vi.mocked(painel.emitirSenhaPresencial).mockResolvedValue(senha({ codigo: 'P004', prioridade: 'Preferencial', servico: 'Inscrição no CadÚnico' }))
    renderizar(<SenhaPresencialPage />, { sessao: sessaoDeAtendente() })

    await userEvent.click(screen.getByLabelText(/Atendimento preferencial/))
    await userEvent.click(await screen.findByRole('button', { name: 'Emitir senha para Inscrição no CadÚnico' }))

    expect(painel.listarServicos).toHaveBeenCalledWith('unidade-1')
    expect(painel.emitirSenhaPresencial).toHaveBeenCalledWith('s2', true, {})
    expect(await screen.findByLabelText('Senha P004')).toBeInTheDocument()
  })

  it('administrador manda a unidade escolhida nas chamadas', async () => {
    sessionStorage.setItem('filavirtual.painel.unidadeAdmin', 'unidade-9')
    vi.mocked(painel.listarServicos).mockResolvedValue([{ id: 's1', nome: 'Atualização cadastral', descricao: '', duracaoMediaMinutos: 30 }])
    vi.mocked(painel.emitirSenhaPresencial).mockResolvedValue(senha())
    renderizar(<SenhaPresencialPage />, {
      sessao: sessaoDeAtendente({ perfil: 'Administrador', unidadeId: null }),
    })

    await userEvent.click(await screen.findByRole('button', { name: 'Emitir senha para Atualização cadastral' }))

    expect(painel.listarServicos).toHaveBeenCalledWith('unidade-9')
    expect(painel.emitirSenhaPresencial).toHaveBeenCalledWith('s1', false, { unidadeId: 'unidade-9' })
  })
})
