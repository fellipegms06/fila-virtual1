import { fireEvent, screen } from '@testing-library/react-native'
import { router } from 'expo-router'
import * as apiAgendamentos from '@/api/agendamentos'
import * as apiFila from '@/api/fila'
import type { MinhaFila } from '@/api/tipos'
import TelaInicio from '@/app/(tabs)/index'
import { agendamento } from '../dados'
import { renderizar } from '../utilitarios'

jest.mock('@/api/fila')
jest.mock('@/api/agendamentos')

const foraDaFila: MinhaFila = {
  minhaSenha: null, posicao: null, pessoasAFrente: null, tempoEstimadoMinutos: null, senhaChamadaAgora: null, guicheChamadaAgora: null,
}

const naFila: MinhaFila = {
  minhaSenha: {
    id: 'senha-1', codigo: 'N008', status: 'Aguardando', prioridade: 'Normal', unidadeId: 'u-centro', unidade: 'CRAS Centro',
    servicoId: 's-cad', servico: 'Atualização cadastral', emitidaEm: '2026-11-10T12:00:00Z', chamadaEm: null, guiche: null,
  },
  posicao: 8, pessoasAFrente: 7, tempoEstimadoMinutos: 96, senhaChamadaAgora: 'N001', guicheChamadaAgora: 'Guichê 1',
}

describe('Início (prints 01 e 02)', () => {
  it('mostra nome, CPF parcialmente oculto e o card da fila com posição, chamada e espera', async () => {
    jest.mocked(apiFila.consultarMinhaFila).mockResolvedValue(naFila)
    jest.mocked(apiAgendamentos.listarMeusAgendamentos).mockResolvedValue([])
    await renderizar(<TelaInicio />, { logado: true })

    expect(await screen.findByText('Na Fila Agora')).toBeOnTheScreen()
    expect(screen.getByText('Maria da Silva')).toBeOnTheScreen()
    expect(screen.getByText('CPF: ***.982.247-**')).toBeOnTheScreen()
    expect(screen.getByText('8')).toBeOnTheScreen()
    expect(screen.getByText('N001')).toBeOnTheScreen()
    expect(screen.getByText('~1 h 36 min')).toBeOnTheScreen()

    await fireEvent.press(screen.getByRole('button', { name: /^Na fila agora, CRAS Centro/ }))
    expect(router.navigate).toHaveBeenCalledWith('/fila')
  })

  it('fora da fila e sem agendamento: explica e oferece os caminhos; "Ver todos" sempre aparece', async () => {
    jest.mocked(apiFila.consultarMinhaFila).mockResolvedValue(foraDaFila)
    jest.mocked(apiAgendamentos.listarMeusAgendamentos).mockResolvedValue([])
    await renderizar(<TelaInicio />, { logado: true })

    expect(await screen.findByText('Você não está em nenhuma fila agora.')).toBeOnTheScreen()
    expect(await screen.findByText('Você não tem atendimento marcado.')).toBeOnTheScreen()

    await fireEvent.press(screen.getByRole('link', { name: 'Ver todos os meus agendamentos' }))
    expect(router.navigate).toHaveBeenCalledWith('/agendamentos')

    // Sem unidade de referência, "Contato CRAS" abre a lista de unidades no modo detalhe.
    await fireEvent.press(screen.getByRole('button', { name: /^Contato CRAS/ }))
    expect(router.navigate).toHaveBeenCalledWith({ pathname: '/agendar', params: { para: 'detalhe' } })
  })

  it('próximo agendamento com serviço na linguagem do cidadão e código do check-in', async () => {
    jest.mocked(apiFila.consultarMinhaFila).mockResolvedValue(foraDaFila)
    jest.mocked(apiAgendamentos.listarMeusAgendamentos).mockResolvedValue([agendamento()])
    await renderizar(<TelaInicio />, { logado: true })

    expect(await screen.findByText('Preciso atualizar meus dados')).toBeOnTheScreen()
    expect(screen.getByText('✓ Confirmado')).toBeOnTheScreen()
    expect(screen.getByText('Código do check-in')).toBeOnTheScreen()
    expect(screen.getByText('AB12CD34')).toBeOnTheScreen()
    expect(screen.getByRole('link', { name: 'Ver todos os meus agendamentos' })).toBeOnTheScreen()

    // Contato e documentos vão direto para a unidade do próximo atendimento.
    await fireEvent.press(screen.getByRole('button', { name: /^Documentos/ }))
    expect(router.navigate).toHaveBeenCalledWith({ pathname: '/unidade/[id]', params: { id: 'u-sul' } })

    await fireEvent.press(screen.getByRole('button', { name: /^Confirmado\. Preciso atualizar meus dados/ }))
    expect(router.navigate).toHaveBeenCalledWith('/agendamentos')
  })

  it('o botão redondo abre o perfil', async () => {
    jest.mocked(apiFila.consultarMinhaFila).mockResolvedValue(foraDaFila)
    jest.mocked(apiAgendamentos.listarMeusAgendamentos).mockResolvedValue([])
    await renderizar(<TelaInicio />, { logado: true })

    await fireEvent.press(await screen.findByRole('button', { name: 'Abrir meu perfil' }))
    expect(router.navigate).toHaveBeenCalledWith('/perfil')
  })
})
