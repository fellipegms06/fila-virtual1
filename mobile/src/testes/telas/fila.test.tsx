import { fireEvent, screen } from '@testing-library/react-native'
import { router } from 'expo-router'
import * as apiFila from '@/api/fila'
import type { MinhaFila, Senha } from '@/api/tipos'
import * as apiUnidades from '@/api/unidades'
import TelaFila from '@/app/(tabs)/fila'
import TelaUnidade from '@/app/unidade/[id]'
import { unidadeDetalhe } from '../dados'
import { erroDaApi, renderizar } from '../utilitarios'

jest.mock('@/api/fila')
jest.mock('@/api/unidades')

const senha = (extra: Partial<Senha> = {}): Senha => ({
  id: 'senha-1', codigo: 'N004', status: 'Aguardando', prioridade: 'Normal', unidadeId: 'u-sul', unidade: 'CRAS Sul',
  servicoId: 's-cad', servico: 'Atualização cadastral', emitidaEm: '2026-11-10T12:00:00Z', chamadaEm: null, guiche: null,
  ...extra,
})

const naFila = (extra: Partial<MinhaFila> = {}): MinhaFila => ({
  minhaSenha: senha(), posicao: 3, pessoasAFrente: 2, tempoEstimadoMinutos: 45,
  senhaChamadaAgora: 'N001', guicheChamadaAgora: 'Guichê 2', ...extra,
})

describe('Fila virtual (RF08, RF09)', () => {
  it('fora da fila, explica como entrar', async () => {
    jest.mocked(apiFila.consultarMinhaFila).mockResolvedValue({
      minhaSenha: null, posicao: null, pessoasAFrente: null, tempoEstimadoMinutos: null, senhaChamadaAgora: null, guicheChamadaAgora: null,
    })
    await renderizar(<TelaFila />, { logado: true })
    expect(await screen.findByText('Você não está em nenhuma fila agora.')).toBeOnTheScreen()
  })

  it('mostra senha, quantas pessoas na frente, tempo estimado e a senha chamada agora', async () => {
    jest.mocked(apiFila.consultarMinhaFila).mockResolvedValue(naFila())
    await renderizar(<TelaFila />, { logado: true })

    expect(await screen.findByText('N004')).toBeOnTheScreen()
    expect(screen.getByText('2 pessoas na sua frente')).toBeOnTheScreen()
    expect(screen.getByLabelText('Espera: ~45 min')).toBeOnTheScreen()
    expect(screen.getByText('3º')).toBeOnTheScreen()
    expect(screen.getByText('0%')).toBeOnTheScreen() // acabou de entrar: a fila ainda não andou
    expect(screen.getByText('N001 · Guichê 2')).toBeOnTheScreen()
  })

  it('primeiro da fila e preferencial', async () => {
    jest.mocked(apiFila.consultarMinhaFila).mockResolvedValue(
      naFila({ minhaSenha: senha({ codigo: 'P002', prioridade: 'Preferencial' }), posicao: 1, pessoasAFrente: 0, tempoEstimadoMinutos: 0 }))
    await renderizar(<TelaFila />, { logado: true })

    expect(await screen.findByText('Você é o próximo!')).toBeOnTheScreen()
    expect(screen.getByText('Preferencial')).toBeOnTheScreen()
  })

  it('quando a senha é chamada, mostra o guichê em destaque e esconde "sair da fila"', async () => {
    jest.mocked(apiFila.consultarMinhaFila).mockResolvedValue(
      naFila({ minhaSenha: senha({ status: 'EmAtendimento', guiche: 'Guichê 3' }), posicao: 0 }))
    await renderizar(<TelaFila />, { logado: true })

    expect(await screen.findByText('Sua senha foi chamada!')).toBeOnTheScreen()
    expect(screen.getByText('Vá agora ao Guichê 3.')).toBeOnTheScreen()
    expect(screen.queryByRole('button', { name: 'Sair da fila' })).not.toBeOnTheScreen()
  })

  it('sair da fila pede confirmação', async () => {
    jest.mocked(apiFila.consultarMinhaFila).mockResolvedValue(naFila())
    jest.mocked(apiFila.sairDaFila).mockResolvedValue(undefined)
    await renderizar(<TelaFila />, { logado: true })

    await fireEvent.press(await screen.findByRole('button', { name: 'Sair da fila' }))
    expect(apiFila.sairDaFila).not.toHaveBeenCalled()
    await fireEvent.press(screen.getByRole('button', { name: 'Sim, sair da fila' }))
    expect(apiFila.sairDaFila).toHaveBeenCalled()
  })
})

describe('Entrar na fila pela unidade (RF08)', () => {
  beforeEach(() => {
    jest.requireMock('expo-router').useLocalSearchParams.mockReturnValue({ id: 'u-sul' })
    jest.mocked(apiUnidades.obterUnidade).mockResolvedValue(unidadeDetalhe)
  })

  it('entra e vai para a tela da fila', async () => {
    jest.mocked(apiFila.entrarNaFila).mockResolvedValue(senha())
    await renderizar(<TelaUnidade />, { logado: true })

    await fireEvent.press(await screen.findByRole('button', { name: /^Atualização cadastral/ }))
    await fireEvent.press(screen.getByRole('button', { name: 'Entrar agora na fila de Atualização cadastral' }))

    expect(apiFila.entrarNaFila).toHaveBeenCalledWith('u-sul', 's-cad')
    expect(router.navigate).toHaveBeenCalledWith('/fila')
  })

  it('quem já tem senha ativa vê o aviso da API (uma senha por pessoa)', async () => {
    jest.mocked(apiFila.entrarNaFila).mockRejectedValue(erroDaApi(409, { title: 'Você já está na fila com a senha N001.' }))
    await renderizar(<TelaUnidade />, { logado: true })

    await fireEvent.press(await screen.findByRole('button', { name: /^Atualização cadastral/ }))
    await fireEvent.press(screen.getByRole('button', { name: 'Entrar agora na fila de Atualização cadastral' }))

    expect(await screen.findByText('Você já está na fila com a senha N001.')).toBeOnTheScreen()
    expect(router.navigate).not.toHaveBeenCalled()
  })
})
