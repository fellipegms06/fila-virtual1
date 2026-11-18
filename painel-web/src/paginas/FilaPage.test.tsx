import { screen, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { AxiosError, AxiosHeaders } from 'axios'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import * as painel from '../api/painel'
import { fila, senha } from '../testes/dados'
import { renderizar, sessaoDeAtendente } from '../testes/utilitarios'
import { FilaPage } from './FilaPage'

vi.mock('../api/painel')
// A conexão SignalR tem teste próprio; aqui a tela só precisa de um estado.
vi.mock('../realtime/useFilaTempoReal', () => ({ useFilaTempoReal: () => 'conectado' }))

function erroDaApi(status: number, title: string) {
  return new AxiosError(String(status), 'ERR', undefined, undefined, {
    status, statusText: '', headers: {}, config: { headers: new AxiosHeaders() }, data: { title, status },
  })
}

describe('FilaPage', () => {
  beforeEach(() => {
    vi.mocked(painel.obterFila).mockReset()
    vi.mocked(painel.chamarProximo).mockReset()
    vi.mocked(painel.concluirAtendimento).mockReset()
    localStorage.clear()
  })

  it('mostra quem está em atendimento e a fila na ordem da API, com preferenciais marcados', async () => {
    vi.mocked(painel.obterFila).mockResolvedValue(fila({
      emAtendimento: [senha({ codigo: 'N001', status: 'EmAtendimento', cidadao: 'Maria', guiche: 'Guichê 1', chamadaEm: new Date().toISOString() })],
      aguardando: [
        senha({ codigo: 'P003', prioridade: 'Preferencial', posicao: 1, cidadao: 'José', temAgendamento: true }),
        senha({ codigo: 'N002', posicao: 2 }),
      ],
      concluidasHoje: 4,
    }))
    renderizar(<FilaPage />, { sessao: sessaoDeAtendente() })

    const emAtendimento = await screen.findByRole('list', { name: 'Senhas em atendimento' })
    expect(within(emAtendimento).getByText('Maria')).toBeInTheDocument()

    const linhas = screen.getAllByRole('row').slice(1)   // pula o cabeçalho
    expect(linhas[0]).toHaveTextContent('1º')
    expect(linhas[0]).toHaveTextContent('P003')
    expect(linhas[0]).toHaveTextContent('Preferencial')
    expect(linhas[0]).toHaveTextContent('Agendamento')
    expect(linhas[1]).toHaveTextContent('N002')
    expect(linhas[1]).toHaveTextContent('Balcão')
    expect(screen.getByText('concluídas hoje').parentElement).toHaveTextContent('4')
  })

  it('não chama sem guichê', async () => {
    vi.mocked(painel.obterFila).mockResolvedValue(fila())
    renderizar(<FilaPage />, { sessao: sessaoDeAtendente() })

    await userEvent.click(await screen.findByRole('button', { name: /Chamar próximo/ }))

    expect(screen.getByRole('alert')).toHaveTextContent('Informe o guichê antes de chamar.')
    expect(painel.chamarProximo).not.toHaveBeenCalled()
  })

  it('chama o próximo com o guichê e lembra o guichê neste computador', async () => {
    vi.mocked(painel.obterFila).mockResolvedValue(fila())
    vi.mocked(painel.chamarProximo).mockResolvedValue(senha({ codigo: 'P003', guiche: 'Guichê 2', cidadao: 'José', status: 'EmAtendimento' }))
    renderizar(<FilaPage />, { sessao: sessaoDeAtendente() })

    await userEvent.type(await screen.findByLabelText('Seu guichê'), 'Guichê 2')
    await userEvent.click(screen.getByRole('button', { name: /Chamar próximo/ }))

    expect(await screen.findByText('Senha P003 chamada no Guichê 2 (José).')).toBeInTheDocument()
    expect(painel.chamarProximo).toHaveBeenCalledWith('Guichê 2', {})   // atendente: sem unidadeId
    expect(localStorage.getItem('filavirtual.painel.guiche')).toBe('Guichê 2')
  })

  it('fila vazia: mostra a mensagem da API', async () => {
    localStorage.setItem('filavirtual.painel.guiche', 'Guichê 1')
    vi.mocked(painel.obterFila).mockResolvedValue(fila())
    vi.mocked(painel.chamarProximo).mockImplementation(async () => { throw erroDaApi(422, 'Não há ninguém aguardando na fila.') })
    renderizar(<FilaPage />, { sessao: sessaoDeAtendente() })

    await userEvent.click(await screen.findByRole('button', { name: /Chamar próximo/ }))

    expect(await screen.findByRole('alert')).toHaveTextContent('Não há ninguém aguardando na fila.')
  })

  it('conclui o atendimento da senha escolhida', async () => {
    const emAtendimento = senha({ codigo: 'N001', status: 'EmAtendimento', guiche: 'Guichê 1' })
    vi.mocked(painel.obterFila).mockResolvedValue(fila({ emAtendimento: [emAtendimento] }))
    vi.mocked(painel.concluirAtendimento).mockResolvedValue({ ...emAtendimento, status: 'Concluido' })
    renderizar(<FilaPage />, { sessao: sessaoDeAtendente() })

    await userEvent.click(await screen.findByRole('button', { name: 'Concluir atendimento da senha N001' }))

    expect(painel.concluirAtendimento).toHaveBeenCalledWith(emAtendimento.id, {})
    expect(await screen.findByText('Atendimento da senha N001 concluído.')).toBeInTheDocument()
  })
})
