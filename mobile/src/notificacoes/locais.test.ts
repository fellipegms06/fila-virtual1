import * as Notifications from 'expo-notifications'
import { mostrarNotificacao, prepararNotificacoes } from './locais'

jest.mock('expo-notifications', () => ({
  AndroidImportance: { HIGH: 4 },
  setNotificationHandler: jest.fn(),
  setNotificationChannelAsync: jest.fn(),
  getPermissionsAsync: jest.fn(),
  requestPermissionsAsync: jest.fn(),
  scheduleNotificationAsync: jest.fn(),
}))

describe('notificações locais', () => {
  it('pede permissão só quando ainda não foi dada', async () => {
    jest.mocked(Notifications.getPermissionsAsync).mockResolvedValue({ granted: false } as never)
    jest.mocked(Notifications.requestPermissionsAsync).mockResolvedValue({ granted: true } as never)
    expect(await prepararNotificacoes()).toBe(true)
    expect(Notifications.requestPermissionsAsync).toHaveBeenCalled()

    jest.mocked(Notifications.requestPermissionsAsync).mockClear()
    jest.mocked(Notifications.getPermissionsAsync).mockResolvedValue({ granted: true } as never)
    expect(await prepararNotificacoes()).toBe(true)
    expect(Notifications.requestPermissionsAsync).not.toHaveBeenCalled()
  })

  it('falha do sistema não derruba o app', async () => {
    jest.mocked(Notifications.getPermissionsAsync).mockRejectedValue(new Error('indisponível'))
    expect(await prepararNotificacoes()).toBe(false)

    jest.mocked(Notifications.scheduleNotificationAsync).mockRejectedValue(new Error('indisponível'))
    await expect(mostrarNotificacao('Título', 'Mensagem')).resolves.toBeUndefined()
  })

  it('mostra na hora com título e mensagem', async () => {
    jest.mocked(Notifications.scheduleNotificationAsync).mockResolvedValue('id')
    await mostrarNotificacao('Sua senha foi chamada!', 'Vá ao Guichê 1.')
    expect(Notifications.scheduleNotificationAsync).toHaveBeenCalledWith({
      content: { title: 'Sua senha foi chamada!', body: 'Vá ao Guichê 1.' },
      trigger: null,
    })
  })
})
