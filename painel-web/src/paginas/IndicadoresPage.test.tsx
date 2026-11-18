import { fireEvent, screen } from '@testing-library/react'
import { describe, expect, it, vi } from 'vitest'
import * as painel from '../api/painel'
import { renderizar, sessaoDeAtendente } from '../testes/utilitarios'
import { IndicadoresPage } from './IndicadoresPage'

vi.mock('../api/painel')
vi.mock('../realtime/useFilaTempoReal', () => ({ useFilaTempoReal: () => 'conectado' }))

const valores = {
  unidadeId: 'unidade-1', data: '2026-11-10', senhasEmitidas: 12, atendimentosConcluidos: 9, aguardando: 2, canceladas: 1,
  tempoMedioEsperaMinutos: 18.4, tempoMedioAtendimentoMinutos: 75, agendamentosDoDia: 6, agendamentosSemCheckin: 2,
  taxaAbsenteismo: 0.333,
}

describe('IndicadoresPage', () => {
  it('mostra os indicadores formatados para leitura rápida', async () => {
    vi.mocked(painel.obterIndicadores).mockResolvedValue(valores)
    renderizar(<IndicadoresPage />, { sessao: sessaoDeAtendente() })

    expect(await screen.findByText('Dados de 10/11/2026')).toBeInTheDocument()
    const cartao = (titulo: string) => screen.getByText(titulo, { selector: '.indicador-titulo' }).parentElement!
    expect(cartao('Senhas emitidas')).toHaveTextContent('12')
    expect(cartao('Espera')).toHaveTextContent('18 min')
    expect(cartao('Atendimento')).toHaveTextContent('1 h 15 min')
    expect(cartao('Taxa de absenteísmo')).toHaveTextContent('33,3%')
  })

  it('consulta outro dia quando o atendente troca a data', async () => {
    vi.mocked(painel.obterIndicadores).mockResolvedValue(valores)
    renderizar(<IndicadoresPage />, { sessao: sessaoDeAtendente() })
    await screen.findByText('Dados de 10/11/2026')

    fireEvent.change(screen.getByLabelText('Dia'), { target: { value: '2026-11-05' } })

    await vi.waitFor(() => expect(painel.obterIndicadores).toHaveBeenLastCalledWith({}, '2026-11-05'))
  })
})
