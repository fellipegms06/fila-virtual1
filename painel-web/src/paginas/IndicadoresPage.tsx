import { BrMessage } from '@govbr-ds/webcomponents-react'
import { useQuery } from '@tanstack/react-query'
import { useState } from 'react'
import { mensagemDeErro } from '../api/cliente'
import { obterIndicadores } from '../api/painel'
import { useAuth } from '../auth/AuthContext'
import { IndicadorConexao } from '../componentes/IndicadorConexao'
import { FUSO_HORARIO } from '../config'
import { useFilaTempoReal } from '../realtime/useFilaTempoReal'
import { dataCurta, duracao, porcentagem } from '../utils/formatar'

// "Hoje" no horário de Brasília, no formato do <input type="date"> (AAAA-MM-DD).
function hojeEmBrasilia(): string {
  return new Intl.DateTimeFormat('en-CA', { timeZone: FUSO_HORARIO }).format(new Date())
}

function Cartao({ titulo, valor, detalhe }: { titulo: string; valor: string; detalhe?: string }) {
  return (
    <div className="indicador">
      <span className="indicador-titulo">{titulo}</span>
      <span className="indicador-valor">{valor}</span>
      {detalhe && <span className="indicador-detalhe">{detalhe}</span>}
    </div>
  )
}

// RF11 / RN10: indicadores operacionais do dia. O dia de hoje se atualiza sozinho pelo SignalR;
// dias anteriores servem para comparar.
export function IndicadoresPage() {
  const { unidadeId, parametrosUnidade } = useAuth()
  const [dia, setDia] = useState(hojeEmBrasilia)
  const conexao = useFilaTempoReal()

  const { data, error, isLoading } = useQuery({
    queryKey: ['indicadores', unidadeId, dia],
    queryFn: () => obterIndicadores(parametrosUnidade, dia),
    enabled: !!unidadeId,
  })

  return (
    <section>
      <div className="titulo-pagina">
        <h2>Indicadores</h2>
        <IndicadorConexao estado={conexao} />
      </div>

      {/* <input type="date"> nativo: o seletor de datas do próprio navegador é acessível e funciona em qualquer tela. */}
      <div className="seletor-data">
        <label htmlFor="dia">Dia</label>
        <input id="dia" type="date" value={dia} max={hojeEmBrasilia()} onChange={(e) => e.target.value && setDia(e.target.value)} />
      </div>

      {isLoading && <p>Carregando indicadores...</p>}
      {error && <BrMessage state="danger" message={mensagemDeErro(error)} role="alert" />}

      {data && (
        <>
          <p className="subtitulo">Dados de {dataCurta(data.data)}</p>

          <h3>Atendimento</h3>
          <div className="indicadores">
            <Cartao titulo="Senhas emitidas" valor={String(data.senhasEmitidas)} />
            <Cartao titulo="Atendimentos concluídos" valor={String(data.atendimentosConcluidos)} />
            <Cartao titulo="Aguardando agora" valor={String(data.aguardando)} />
            <Cartao titulo="Canceladas / ausentes" valor={String(data.canceladas)} />
          </div>

          <h3>Tempos médios</h3>
          <div className="indicadores">
            <Cartao titulo="Espera" valor={duracao(data.tempoMedioEsperaMinutos)} detalhe="da emissão da senha até a chamada" />
            <Cartao titulo="Atendimento" valor={duracao(data.tempoMedioAtendimentoMinutos)} detalhe="da chamada até a conclusão" />
          </div>

          <h3>Agendamentos</h3>
          <div className="indicadores">
            <Cartao titulo="Agendados para o dia" valor={String(data.agendamentosDoDia)} detalhe="sem contar os cancelados pelo cidadão" />
            <Cartao titulo="Não compareceram" valor={String(data.agendamentosSemCheckin)} detalhe="sem check-in até 30 min depois do horário" />
            <Cartao titulo="Taxa de absenteísmo" valor={porcentagem(data.taxaAbsenteismo)} detalhe="não compareceram ÷ agendados" />
          </div>
        </>
      )}
    </section>
  )
}
