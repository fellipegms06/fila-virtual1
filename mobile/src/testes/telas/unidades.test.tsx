import { fireEvent, screen } from '@testing-library/react-native'
import * as Location from 'expo-location'
import { router } from 'expo-router'
import * as apiUnidades from '@/api/unidades'
import TelaUnidades from '@/app/(tabs)/agendar'
import TelaUnidade from '@/app/unidade/[id]'
import { unidadeDetalhe, unidadesResumo } from '../dados'
import { renderizar } from '../utilitarios'

jest.mock('@/api/unidades')
jest.mock('expo-location', () => ({
  Accuracy: { Balanced: 3 },
  requestForegroundPermissionsAsync: jest.fn(),
  getLastKnownPositionAsync: jest.fn(),
  getCurrentPositionAsync: jest.fn(),
}))

describe('Lista de unidades (RF03)', () => {
  it('com localização, manda as coordenadas e destaca a mais perto', async () => {
    jest.mocked(Location.requestForegroundPermissionsAsync).mockResolvedValue({ status: 'granted' } as never)
    jest.mocked(Location.getLastKnownPositionAsync).mockResolvedValue({ coords: { latitude: -15.86, longitude: -47.94 } } as never)
    jest.mocked(apiUnidades.listarUnidades).mockResolvedValue(unidadesResumo)

    await renderizar(<TelaUnidades />, { logado: true })

    expect(await screen.findByText('CRAS Sul')).toBeOnTheScreen()
    expect(apiUnidades.listarUnidades).toHaveBeenCalledWith({ latitude: -15.86, longitude: -47.94 })
    expect(screen.getByText('Mais perto de você')).toBeOnTheScreen()
    expect(screen.getByText(/1,5 km/)).toBeOnTheScreen()
  })

  it('sem permissão, avisa e mostra a lista mesmo assim', async () => {
    jest.mocked(Location.requestForegroundPermissionsAsync).mockResolvedValue({ status: 'denied' } as never)
    jest.mocked(apiUnidades.listarUnidades).mockResolvedValue(unidadesResumo.map((u) => ({ ...u, distanciaKm: null })))

    await renderizar(<TelaUnidades />, { logado: true })

    expect(await screen.findByText(/ordem alfabética/)).toBeOnTheScreen()
    expect(await screen.findByText('CRAS Centro')).toBeOnTheScreen()
    expect(apiUnidades.listarUnidades).toHaveBeenCalledWith(null)
    expect(screen.queryByText('Mais perto de você')).not.toBeOnTheScreen()
  })

  it('é o 1º passo do agendamento: tocar na unidade já abre a escolha do serviço', async () => {
    jest.mocked(Location.requestForegroundPermissionsAsync).mockResolvedValue({ status: 'denied' } as never)
    jest.mocked(apiUnidades.listarUnidades).mockResolvedValue(unidadesResumo)
    await renderizar(<TelaUnidades />, { logado: true })

    expect(screen.getByLabelText('Passo 1 de 4: Unidade')).toBeOnTheScreen()
    await fireEvent.press(await screen.findByRole('button', { name: /^CRAS Sul/ }))
    expect(router.push).toHaveBeenCalledWith({ pathname: '/agendar/[unidadeId]', params: { unidadeId: 'u-sul' } })
  })

  it('no modo "para=detalhe" (contato, documentos, fila), tocar na unidade abre o detalhe', async () => {
    const { useLocalSearchParams } = jest.requireMock('expo-router')
    useLocalSearchParams.mockReturnValue({ para: 'detalhe' })
    jest.mocked(Location.requestForegroundPermissionsAsync).mockResolvedValue({ status: 'denied' } as never)
    jest.mocked(apiUnidades.listarUnidades).mockResolvedValue(unidadesResumo)
    await renderizar(<TelaUnidades />, { logado: true })

    expect(screen.queryByLabelText(/^Passo 1 de 4/)).not.toBeOnTheScreen()
    await fireEvent.press(await screen.findByRole('button', { name: /^CRAS Sul/ }))
    expect(router.push).toHaveBeenCalledWith({ pathname: '/unidade/[id]', params: { id: 'u-sul' } })
  })
})

describe('Detalhe da unidade (RF04, RF05)', () => {
  it('mostra o checklist de documentos ao abrir um serviço e leva para o agendamento já com o serviço', async () => {
    const { useLocalSearchParams } = jest.requireMock('expo-router')
    useLocalSearchParams.mockReturnValue({ id: 'u-sul' })
    jest.mocked(apiUnidades.obterUnidade).mockResolvedValue(unidadeDetalhe)
    await renderizar(<TelaUnidade />, { logado: true })

    expect(await screen.findByText('(61) 3000-0003')).toBeOnTheScreen()
    expect(screen.queryByText('CPF do responsável')).not.toBeOnTheScreen() // acordeão fechado

    await fireEvent.press(screen.getByRole('button', { name: /^Atualização cadastral/ }))
    expect(screen.getByText('CPF do responsável')).toBeOnTheScreen()
    expect(screen.getByText('Obrigatório')).toBeOnTheScreen()
    expect(screen.getByText('Se tiver')).toBeOnTheScreen()

    await fireEvent.press(screen.getByRole('button', { name: 'Agendar Atualização cadastral' }))
    expect(router.push).toHaveBeenCalledWith({ pathname: '/agendar/[unidadeId]', params: { unidadeId: 'u-sul', servicoId: 's-cad' } })
  })
})
