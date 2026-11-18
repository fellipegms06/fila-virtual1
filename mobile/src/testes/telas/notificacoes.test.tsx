import { fireEvent, screen } from '@testing-library/react-native'
import * as apiNotificacoes from '@/api/notificacoes'
import type { Notificacao } from '@/api/tipos'
import TelaNotificacoes from '@/app/(tabs)/notificacoes'
import { renderizar } from '../utilitarios'

jest.mock('@/api/notificacoes')

const aviso = (extra: Partial<Notificacao> = {}): Notificacao => ({
  id: 'n-1', titulo: 'Sua senha foi chamada!', mensagem: 'Senha N001: dirija-se ao Guichê 1.', tipo: 'SenhaChamada',
  lida: false, criadaEm: '2026-11-10T13:05:00Z', ...extra,
})

describe('Avisos (RF10)', () => {
  it('lista com data no horário de Brasília e conta os não lidos', async () => {
    jest.mocked(apiNotificacoes.listarNotificacoes).mockResolvedValue([
      aviso(), aviso({ id: 'n-2', titulo: 'Agendamento confirmado', tipo: 'AgendamentoConfirmado', lida: true }),
    ])
    await renderizar(<TelaNotificacoes />, { logado: true })

    expect(await screen.findByText('1 não lido')).toBeOnTheScreen()
    expect(screen.getAllByText('10/11/2026 às 10:05')).toHaveLength(2)
  })

  it('tocar num aviso novo marca como lido', async () => {
    jest.mocked(apiNotificacoes.listarNotificacoes).mockResolvedValue([aviso()])
    jest.mocked(apiNotificacoes.marcarComoLida).mockResolvedValue(undefined)
    await renderizar(<TelaNotificacoes />, { logado: true })

    await fireEvent.press(await screen.findByRole('button', { name: /^Novo\. Sua senha foi chamada!/ }))
    expect(apiNotificacoes.marcarComoLida).toHaveBeenCalledWith('n-1')
  })

  it('"marcar todos como lidos" e lista atualizada', async () => {
    jest.mocked(apiNotificacoes.listarNotificacoes)
      .mockResolvedValueOnce([aviso(), aviso({ id: 'n-2' })])
      .mockResolvedValue([aviso({ lida: true }), aviso({ id: 'n-2', lida: true })])
    jest.mocked(apiNotificacoes.marcarTodasComoLidas).mockResolvedValue(undefined)
    await renderizar(<TelaNotificacoes />, { logado: true })

    await fireEvent.press(await screen.findByRole('button', { name: 'Marcar todos como lidos' }))
    expect(apiNotificacoes.marcarTodasComoLidas).toHaveBeenCalled()
    expect(await screen.findByText('Todos os avisos foram lidos.')).toBeOnTheScreen()
  })

  it('sem avisos, explica quando eles aparecem', async () => {
    jest.mocked(apiNotificacoes.listarNotificacoes).mockResolvedValue([])
    await renderizar(<TelaNotificacoes />, { logado: true })
    expect(await screen.findByText(/Você ainda não tem avisos/)).toBeOnTheScreen()
  })
})
