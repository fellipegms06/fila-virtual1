import { fireEvent, screen } from '@testing-library/react-native'
import { router } from 'expo-router'
import * as apiAgendamentos from '@/api/agendamentos'
import * as apiUnidades from '@/api/unidades'
import TelaAgendar from '@/app/agendar/[unidadeId]'
import { agendamento, unidadeDetalhe } from '../dados'
import { erroDaApi, renderizar } from '../utilitarios'

jest.mock('@/api/unidades')
jest.mock('@/api/agendamentos')

const horarios = [
  { id: 'h-1', dataHora: '2099-11-10T11:00:00Z', vagasDisponiveis: 2 }, // 08:00 em Brasília
  { id: 'h-2', dataHora: '2099-11-10T11:30:00Z', vagasDisponiveis: 1 },
  { id: 'h-3', dataHora: '2099-11-11T12:00:00Z', vagasDisponiveis: 2 },
]

function comParametros(params: Record<string, string>) {
  jest.requireMock('expo-router').useLocalSearchParams.mockReturnValue(params)
  jest.mocked(apiUnidades.obterUnidade).mockResolvedValue(unidadeDetalhe)
  jest.mocked(apiUnidades.listarHorarios).mockResolvedValue(horarios)
}

const tocar = async (nome: string | RegExp) => fireEvent.press(await screen.findByRole('button', { name: nome }))

describe('Agendar (RF06)', () => {
  it('vindo de um serviço, agenda em 3 toques: horário, continuar, confirmar (o 1º dia com vaga já vem escolhido)', async () => {
    comParametros({ unidadeId: 'u-sul', servicoId: 's-cad' })
    jest.mocked(apiAgendamentos.agendar).mockResolvedValue(agendamento({ dataHora: '2099-11-10T11:30:00Z' }))
    await renderizar(<TelaAgendar />, { logado: true })

    expect(await screen.findByText('Escolha a data')).toBeOnTheScreen()
    expect(apiUnidades.listarHorarios).toHaveBeenCalledWith('u-sul', 's-cad')
    expect(screen.getByLabelText('Passo 3 de 4: Data e Hora')).toBeOnTheScreen()
    expect(screen.getByRole('button', { name: /10 de novembro, 2 horários livres/, selected: true })).toBeOnTheScreen()

    await tocar('08:30, 1 vaga') // 1º toque
    await tocar('Continuar') // 2º toque
    expect(screen.getByRole('header', { name: 'Confirmar agendamento' })).toBeOnTheScreen()
    await tocar('Confirmar agendamento') // 3º toque

    expect(apiAgendamentos.agendar).toHaveBeenCalledWith('h-2')
    expect(await screen.findByText('Agendamento confirmado!')).toBeOnTheScreen()
    expect(screen.getByText('AB12CD34')).toBeOnTheScreen()
  })

  it('"Continuar" só funciona depois de escolher o horário', async () => {
    comParametros({ unidadeId: 'u-sul', servicoId: 's-cad' })
    await renderizar(<TelaAgendar />, { logado: true })

    expect(await screen.findByRole('button', { name: 'Continuar' })).toBeDisabled()
    await tocar('08:00, 2 vagas')
    expect(screen.getByRole('button', { name: 'Continuar' })).toBeEnabled()
  })

  it('trocar de dia mostra os horários daquele dia e limpa o horário marcado', async () => {
    comParametros({ unidadeId: 'u-sul', servicoId: 's-cad' })
    await renderizar(<TelaAgendar />, { logado: true })

    await tocar('08:00, 2 vagas')
    await tocar(/11 de novembro, 1 horário livre/)

    expect(screen.getByRole('button', { name: '09:00, 2 vagas' })).toBeOnTheScreen()
    expect(screen.queryByRole('button', { name: '08:00, 2 vagas' })).not.toBeOnTheScreen()
    expect(screen.getByRole('button', { name: 'Continuar' })).toBeDisabled()
  })

  it('sem serviço escolhido, começa pelo serviço na linguagem do cidadão', async () => {
    comParametros({ unidadeId: 'u-sul' })
    await renderizar(<TelaAgendar />, { logado: true })

    expect(await screen.findByText('Qual serviço você precisa?')).toBeOnTheScreen()
    expect(screen.getByRole('button', { name: 'Preciso atualizar meus dados, Atualização cadastral · cerca de 30 minutos' }))
      .toBeOnTheScreen()
    await tocar(/^BPC/)
    expect(await screen.findByText('Escolha a data')).toBeOnTheScreen()
    expect(apiUnidades.listarHorarios).toHaveBeenCalledWith('u-sul', 's-bpc')
  })

  it('"Voltar" no topo: do passo de data volta ao serviço; do serviço sai da tela', async () => {
    comParametros({ unidadeId: 'u-sul' })
    await renderizar(<TelaAgendar />, { logado: true })

    await tocar(/^Preciso atualizar meus dados/)
    expect(await screen.findByText('Escolha a data')).toBeOnTheScreen()
    await tocar('Voltar')
    expect(screen.getByText('Qual serviço você precisa?')).toBeOnTheScreen()
    await tocar('Voltar')
    expect(router.back).toHaveBeenCalled()
  })

  it('o resumo mostra os documentos obrigatórios e pede para chegar 10 minutos antes', async () => {
    comParametros({ unidadeId: 'u-sul', servicoId: 's-cad' })
    await renderizar(<TelaAgendar />, { logado: true })

    await tocar('08:30, 1 vaga')
    await tocar('Continuar')

    expect(screen.getByLabelText('unidade: CRAS Sul')).toBeOnTheScreen()
    expect(screen.getByLabelText('horário: 08:30')).toBeOnTheScreen()
    expect(screen.getByText(/Traga CPF do responsável\./)).toBeOnTheScreen() // a conta de luz é opcional
    expect(screen.getByText('Chegue 10 minutos antes.')).toBeOnTheScreen()
  })

  it('se outra pessoa pegou a vaga (409), avisa e volta para data e hora atualizados', async () => {
    comParametros({ unidadeId: 'u-sul', servicoId: 's-cad' })
    jest.mocked(apiAgendamentos.agendar).mockRejectedValue(erroDaApi(409, { title: 'Não há mais vagas neste horário.' }))
    await renderizar(<TelaAgendar />, { logado: true })

    await tocar('08:30, 1 vaga')
    await tocar('Continuar')
    await tocar('Confirmar agendamento')

    expect(await screen.findByText('Não há mais vagas neste horário.')).toBeOnTheScreen()
    expect(screen.getByText('Escolha o horário')).toBeOnTheScreen()
    expect(apiUnidades.listarHorarios).toHaveBeenCalledTimes(2) // buscou as vagas de novo
  })

  it('se o dia escolhido fica sem vaga ao recarregar, passa para o primeiro dia que ainda tem horário', async () => {
    comParametros({ unidadeId: 'u-sul', servicoId: 's-cad' })
    jest.mocked(apiUnidades.listarHorarios)
      .mockResolvedValueOnce(horarios)
      .mockResolvedValue(horarios.filter((h) => h.id !== 'h-3')) // a única vaga do dia 11 acabou
    jest.mocked(apiAgendamentos.agendar).mockRejectedValue(erroDaApi(409, { title: 'Não há mais vagas neste horário.' }))
    await renderizar(<TelaAgendar />, { logado: true })

    await tocar(/11 de novembro, 1 horário livre/)
    await tocar('09:00, 2 vagas')
    await tocar('Continuar')
    await tocar('Confirmar agendamento')

    expect(await screen.findByText('Não há mais vagas neste horário.')).toBeOnTheScreen()
    expect(await screen.findByRole('button', { name: /10 de novembro, 2 horários livres/, selected: true })).toBeOnTheScreen()
    expect(screen.queryByRole('button', { name: /11 de novembro/ })).not.toBeOnTheScreen()
  })

  it('avisa quando nenhum dia tem vaga e não mostra datas nem "Continuar"', async () => {
    comParametros({ unidadeId: 'u-sul', servicoId: 's-cad' })
    jest.mocked(apiUnidades.listarHorarios).mockResolvedValue([])
    await renderizar(<TelaAgendar />, { logado: true })

    expect(await screen.findByText(/Não há vagas para este serviço nos próximos 14 dias/)).toBeOnTheScreen()
    expect(screen.queryByRole('button', { name: 'Continuar' })).not.toBeOnTheScreen()
    expect(screen.queryByText('Escolha o horário')).not.toBeOnTheScreen()
  })
})
