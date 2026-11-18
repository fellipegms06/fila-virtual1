import { fireEvent, screen } from '@testing-library/react-native'
import * as apiAgendamentos from '@/api/agendamentos'
import TelaAgendamentos from '@/app/(tabs)/agendamentos'
import { agendamento } from '../dados'
import { erroDaApi, renderizar } from '../utilitarios'

jest.mock('@/api/agendamentos')
// O QR Code desenha SVG nativo; no teste basta saber que recebeu o código certo.
jest.mock('react-native-qrcode-svg', () => {
  const { Text } = jest.requireActual('react-native')
  return function QRCodeFalso({ value }: { value: string }) {
    return <Text>{`QR:${value}`}</Text>
  }
})

describe('Meus agendamentos (RF07)', () => {
  it('mostra status, QR Code e código do check-in do agendamento confirmado', async () => {
    jest.mocked(apiAgendamentos.listarMeusAgendamentos).mockResolvedValue([agendamento()])
    await renderizar(<TelaAgendamentos />, { logado: true })

    expect(await screen.findByText('Confirmado')).toBeOnTheScreen()
    expect(screen.getByText('QR:AB12CD34')).toBeOnTheScreen()
    expect(screen.getByLabelText('QR Code do check-in, código A B 1 2 C D 3 4')).toBeOnTheScreen()
  })

  it('depois do check-in mostra a senha da fila no lugar do QR Code', async () => {
    jest.mocked(apiAgendamentos.listarMeusAgendamentos).mockResolvedValue([agendamento({ status: 'Aguardando', senha: 'N004' })])
    await renderizar(<TelaAgendamentos />, { logado: true })

    expect(await screen.findByText('Na fila')).toBeOnTheScreen()
    expect(screen.getByText('N004')).toBeOnTheScreen()
    expect(screen.queryByText(/^QR:/)).not.toBeOnTheScreen()
  })

  it('cancelar pede confirmação e recarrega a lista', async () => {
    jest.mocked(apiAgendamentos.listarMeusAgendamentos)
      .mockResolvedValueOnce([agendamento()])
      .mockResolvedValueOnce([agendamento({ status: 'Cancelado' })])
    jest.mocked(apiAgendamentos.cancelarAgendamento).mockResolvedValue(undefined)
    await renderizar(<TelaAgendamentos />, { logado: true })

    await fireEvent.press(await screen.findByRole('button', { name: /^Cancelar agendamento de Atualização cadastral/ }))
    expect(apiAgendamentos.cancelarAgendamento).not.toHaveBeenCalled()
    await fireEvent.press(screen.getByRole('button', { name: 'Sim, cancelar' }))

    expect(apiAgendamentos.cancelarAgendamento).toHaveBeenCalledWith('ag-1')
    expect(await screen.findByText('Cancelado')).toBeOnTheScreen()
    expect(screen.getByText('Anteriores')).toBeOnTheScreen()
  })

  it('erro ao cancelar aparece no cartão', async () => {
    jest.mocked(apiAgendamentos.listarMeusAgendamentos).mockResolvedValue([agendamento()])
    jest.mocked(apiAgendamentos.cancelarAgendamento).mockRejectedValue(erroDaApi(422, { title: 'Este agendamento não pode mais ser cancelado.' }))
    await renderizar(<TelaAgendamentos />, { logado: true })

    await fireEvent.press(await screen.findByRole('button', { name: /^Cancelar agendamento de/ }))
    await fireEvent.press(screen.getByRole('button', { name: 'Sim, cancelar' }))
    expect(await screen.findByText('Este agendamento não pode mais ser cancelado.')).toBeOnTheScreen()
  })

  it('sem agendamentos, oferece agendar', async () => {
    jest.mocked(apiAgendamentos.listarMeusAgendamentos).mockResolvedValue([])
    await renderizar(<TelaAgendamentos />, { logado: true })
    expect(await screen.findByText('Você não tem atendimento marcado.')).toBeOnTheScreen()
  })
})
