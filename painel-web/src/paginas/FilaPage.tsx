import { BrButton, BrInput, BrMessage, BrTag } from '@govbr-ds/webcomponents-react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { useEffect, useState, type FormEvent } from 'react'
import { mensagemDeErro } from '../api/cliente'
import { cancelarSenha, chamarProximo, concluirAtendimento, obterFila } from '../api/painel'
import type { PainelSenha } from '../api/tipos'
import { useAuth } from '../auth/AuthContext'
import { valorDoCampo } from '../componentes/eventos'
import { IndicadorConexao } from '../componentes/IndicadorConexao'
import { useFilaTempoReal } from '../realtime/useFilaTempoReal'
import { dataCurta, duracao, hora, minutosDesde } from '../utils/formatar'

// O guichê é uma preferência do COMPUTADOR (não da pessoa), por isso fica no localStorage.
const CHAVE_GUICHE = 'filavirtual.painel.guiche'
function lerGuiche(): string {
  try {
    return localStorage.getItem(CHAVE_GUICHE) ?? ''
  } catch {
    return ''
  }
}

function origem(s: PainelSenha): string {
  if (s.temAgendamento) return 'Agendamento'
  return s.cidadao ? 'Fila pelo app' : 'Balcão'
}

type Retorno = { tipo: 'success' | 'danger'; texto: string } | null

// RF11: tela principal do atendente. Chama a próxima senha, conclui ou registra ausência,
// e mostra a fila na mesma ordem que o cidadão vê no app.
export function FilaPage() {
  const { unidadeId, parametrosUnidade } = useAuth()
  const queryClient = useQueryClient()
  const [guiche, setGuiche] = useState(lerGuiche)
  const [retorno, setRetorno] = useState<Retorno>(null)
  const [agora, setAgora] = useState(() => Date.now())

  const conexao = useFilaTempoReal()

  // Atualiza o "esperando há X min" a cada 30 segundos.
  useEffect(() => {
    const t = setInterval(() => setAgora(Date.now()), 30_000)
    return () => clearInterval(t)
  }, [])

  const fila = useQuery({ queryKey: ['fila', unidadeId], queryFn: () => obterFila(parametrosUnidade), enabled: !!unidadeId })

  const recarregar = () => queryClient.invalidateQueries({ queryKey: ['fila', unidadeId] })
  const aoErrar = (erro: unknown) => setRetorno({ tipo: 'danger', texto: mensagemDeErro(erro) })

  const chamar = useMutation({
    mutationFn: () => chamarProximo(guiche.trim(), parametrosUnidade),
    onSuccess: (s) => {
      setRetorno({ tipo: 'success', texto: `Senha ${s.codigo} chamada no ${s.guiche}${s.cidadao ? ` (${s.cidadao})` : ''}.` })
      recarregar()
    },
    onError: (e) => {
      aoErrar(e)
      recarregar()   // em caso de disputa entre guichês, a lista mudou
    },
  })

  const concluir = useMutation({
    mutationFn: (s: PainelSenha) => concluirAtendimento(s.id, parametrosUnidade),
    onSuccess: (s) => {
      setRetorno({ tipo: 'success', texto: `Atendimento da senha ${s.codigo} concluído.` })
      recarregar()
    },
    onError: aoErrar,
  })

  const ausente = useMutation({
    mutationFn: (s: PainelSenha) => cancelarSenha(s.id, parametrosUnidade),
    onSuccess: (s) => {
      setRetorno({ tipo: 'success', texto: `Senha ${s.codigo} retirada da fila.` })
      recarregar()
    },
    onError: aoErrar,
  })

  function enviarChamada(e: FormEvent) {
    e.preventDefault()
    if (!guiche.trim()) {
      setRetorno({ tipo: 'danger', texto: 'Informe o guichê antes de chamar.' })
      return
    }
    try {
      localStorage.setItem(CHAVE_GUICHE, guiche.trim())
    } catch {
      // sem armazenamento: só não lembra o guichê da próxima vez
    }
    chamar.mutate()
  }

  const ocupado = chamar.isPending || concluir.isPending || ausente.isPending

  return (
    <section className="fila">
      <div className="titulo-pagina">
        <h2>Fila do dia{fila.data ? ` · ${fila.data.unidade}` : ''}</h2>
        <IndicadorConexao estado={conexao} />
      </div>
      {fila.data && <p className="subtitulo">{dataCurta(fila.data.data)}</p>}

      <form className="chamar" onSubmit={enviarChamada}>
        <BrInput name="guiche" label="Seu guichê" placeholder="Ex.: Guichê 1" value={guiche}
          onInput={(e) => setGuiche(valorDoCampo(e))} />
        <BrButton type="submit" emphasis="primary" disabled={ocupado} loading={chamar.isPending}>
          <i className="fas fa-bullhorn" aria-hidden="true" /> Chamar próximo
        </BrButton>
      </form>

      {retorno && <BrMessage state={retorno.tipo} message={retorno.texto} role={retorno.tipo === 'danger' ? 'alert' : 'status'} />}

      {fila.isLoading && <p>Carregando a fila...</p>}
      {fila.error && <BrMessage state="danger" message={mensagemDeErro(fila.error)} role="alert" />}

      {fila.data && (
        <>
          <div className="resumo">
            <span><strong>{fila.data.aguardando.length}</strong> aguardando</span>
            <span><strong>{fila.data.emAtendimento.length}</strong> em atendimento</span>
            <span><strong>{fila.data.concluidasHoje}</strong> concluídas hoje</span>
            <span><strong>{fila.data.canceladasHoje}</strong> canceladas</span>
          </div>

          <h3>Em atendimento</h3>
          {fila.data.emAtendimento.length === 0 ? (
            <p className="vazio">Nenhuma senha em atendimento.</p>
          ) : (
            <ul className="cartoes" aria-label="Senhas em atendimento">
              {fila.data.emAtendimento.map((s) => (
                <li key={s.id} className="cartao">
                  <div className="cartao-codigo">{s.codigo}</div>
                  <div className="cartao-dados">
                    <strong>{s.cidadao ?? 'Atendimento presencial'}</strong>
                    <span>{s.servico}</span>
                    <span>{s.guiche} · chamada às {s.chamadaEm ? hora(s.chamadaEm) : '—'}</span>
                  </div>
                  <div className="cartao-acoes">
                    <BrButton emphasis="primary" density="small" disabled={ocupado}
                      onClick={() => concluir.mutate(s)} aria-label={`Concluir atendimento da senha ${s.codigo}`}>
                      Concluir
                    </BrButton>
                    <BrButton emphasis="secondary" density="small" disabled={ocupado}
                      onClick={() => ausente.mutate(s)} aria-label={`Registrar que a senha ${s.codigo} não compareceu`}>
                      Não compareceu
                    </BrButton>
                  </div>
                </li>
              ))}
            </ul>
          )}

          <h3>Aguardando ({fila.data.aguardando.length})</h3>
          {fila.data.aguardando.length === 0 ? (
            <p className="vazio">Ninguém aguardando no momento.</p>
          ) : (
            <div className="tabela-rolavel">
              <table className="tabela">
                <caption className="sr-only">Senhas aguardando, na ordem em que serão chamadas</caption>
                <thead>
                  <tr>
                    <th scope="col">Posição</th>
                    <th scope="col">Senha</th>
                    <th scope="col">Cidadão</th>
                    <th scope="col">Serviço</th>
                    <th scope="col">Origem</th>
                    <th scope="col">Esperando</th>
                    <th scope="col"><span className="sr-only">Ações</span></th>
                  </tr>
                </thead>
                <tbody>
                  {fila.data.aguardando.map((s) => (
                    <tr key={s.id}>
                      <td>{s.posicao}º</td>
                      <td>
                        <strong>{s.codigo}</strong>{' '}
                        {s.prioridade === 'Preferencial' && <BrTag label="Preferencial" density="small" />}
                      </td>
                      <td>{s.cidadao ?? '—'}</td>
                      <td>{s.servico}</td>
                      <td>{origem(s)}</td>
                      <td>{duracao(minutosDesde(s.emitidaEm, agora))} <small>(desde {hora(s.emitidaEm)})</small></td>
                      <td>
                        <BrButton emphasis="tertiary" density="small" disabled={ocupado}
                          onClick={() => ausente.mutate(s)} aria-label={`Retirar a senha ${s.codigo} da fila`}>
                          Retirar
                        </BrButton>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </>
      )}
    </section>
  )
}
