import { Ionicons } from '@expo/vector-icons'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { router } from 'expo-router'
import { useEffect, useState } from 'react'
import { StyleSheet, View } from 'react-native'
import { mensagemDeErro } from '@/api/cliente'
import { consultarMinhaFila, sairDaFila } from '@/api/fila'
import type { MinhaFila } from '@/api/tipos'
import { Alert } from '@/components/Alert'
import { Button } from '@/components/Button'
import { CabecalhoMarinho } from '@/components/CabecalhoMarinho'
import { Card } from '@/components/Card'
import { Carregando, ErroAoCarregar } from '@/components/Estados'
import { IndicadorConexao } from '@/components/IndicadorConexao'
import { StatusTag } from '@/components/StatusTag'
import { Tela } from '@/components/Tela'
import { Texto } from '@/components/Texto'
import { usePosicaoInicial } from '@/hooks/usePosicaoInicial'
import { useTempoReal } from '@/realtime/TempoReal'
import { cores, espaco, fonte, raio } from '@/theme/tokens'
import { ordinal, progressoFila } from '@/utils/fila'
import { dataCurta, tempoCurto } from '@/utils/formatar'

// RF09 (print 03 "Acompanhar Fila"): senha, posição, progresso, senha chamada agora e tempo estimado,
// atualizados pelo SignalR.
export default function TelaFila() {
  const { estado, acompanharUnidade } = useTempoReal()
  const fila = useQuery({
    queryKey: ['fila', 'minha'],
    queryFn: consultarMinhaFila,
    // Sem tempo real (conexão caiu), consulta a cada 30 s para a posição não ficar parada.
    refetchInterval: estado === 'conectado' ? false : 30_000,
  })

  const senha = fila.data?.minhaSenha
  const unidadeId = senha?.unidadeId ?? null
  useEffect(() => acompanharUnidade(unidadeId), [unidadeId, acompanharUnidade])

  const cabecalho = (
    <CabecalhoMarinho
      logo
      titulo="Acompanhar Fila"
      subtitulo={senha ? `${senha.unidade} — ${dataCurta(senha.emitidaEm)}` : 'Fila virtual'}
    />
  )

  if (fila.isPending) return <Tela cabecalho={cabecalho}><Carregando /></Tela>
  if (fila.isError)
    return <Tela cabecalho={cabecalho}><ErroAoCarregar erro={fila.error} aoTentarDeNovo={() => void fila.refetch()} /></Tela>

  return (
    <Tela cabecalho={cabecalho} atualizando={fila.isRefetching} aoAtualizar={() => void fila.refetch()}>
      {fila.data.minhaSenha ? <MinhaSenha fila={fila.data} /> : <ForaDaFila />}
      {fila.data.minhaSenha && <IndicadorConexao estado={estado} />}
    </Tela>
  )
}

function ForaDaFila() {
  return (
    <Card>
      <Texto variante="subtitulo">Você não está em nenhuma fila agora.</Texto>
      <Texto>
        Para entrar, escolha uma unidade, abra o serviço e toque em &quot;Entrar na fila agora&quot;.
        Se você tem agendamento, a senha sai quando fizer o check-in na recepção.
      </Texto>
      <Button titulo="Escolher unidade" icone="business"
        onPress={() => router.navigate({ pathname: '/agendar', params: { para: 'detalhe' } })} />
    </Card>
  )
}

function MinhaSenha({ fila }: { fila: MinhaFila }) {
  const senha = fila.minhaSenha!
  const queryClient = useQueryClient()
  const [confirmandoSaida, setConfirmandoSaida] = useState(false)
  const chamada = senha.status === 'EmAtendimento'
  const posicaoInicial = usePosicaoInicial(senha.id, fila.posicao)
  const progresso = chamada ? 100 : fila.posicao != null ? progressoFila(posicaoInicial, fila.posicao) : 0

  const saida = useMutation({
    mutationFn: sairDaFila,
    onSuccess: () => void queryClient.invalidateQueries({ queryKey: ['fila'] }),
    onSettled: () => setConfirmandoSaida(false),
  })

  return (
    <>
      {chamada && (
        <Alert tipo="sucesso" titulo="Sua senha foi chamada!">
          {senha.guiche ? `Vá agora ao ${senha.guiche}.` : 'Vá agora ao atendimento.'}
        </Alert>
      )}

      <Card variante={chamada ? 'destaque' : 'padrao'}>
        <View style={estilos.linhaEntre}>
          <View>
            <Texto style={estilos.rotulo}>SUA SENHA</Texto>
            <Texto style={estilos.senha} accessibilityLabel={`Sua senha é ${senha.codigo.split('').join(' ')}`}>
              {senha.codigo}
            </Texto>
          </View>
          {!chamada && fila.posicao != null && fila.posicao > 0 && (
            <View style={estilos.alinhaDireita}>
              <Texto style={estilos.rotulo}>POSIÇÃO</Texto>
              <Texto style={estilos.posicao} accessibilityLabel={`Posição ${fila.posicao}`}>{ordinal(fila.posicao)}</Texto>
            </View>
          )}
        </View>
        {senha.prioridade === 'Preferencial' && <StatusTag texto="Preferencial" tipo="info" />}

        {!chamada && fila.posicao != null && (
          // O leitor de tela anuncia sozinho quando a posição muda.
          <Texto style={estilos.negrito} accessibilityLiveRegion="polite">
            {fila.posicao === 1
              ? 'Você é o próximo!'
              : `${fila.pessoasAFrente} ${fila.pessoasAFrente === 1 ? 'pessoa' : 'pessoas'} na sua frente`}
          </Texto>
        )}

        <View style={estilos.linhaEntre}>
          <Texto variante="secundario">Progresso</Texto>
          <Texto style={estilos.percentual}>{progresso}%</Texto>
        </View>
        <View
          style={estilos.trilho}
          accessible
          accessibilityRole="progressbar"
          accessibilityLabel="Quanto a fila andou desde que você entrou"
          accessibilityValue={{ min: 0, max: 100, now: progresso }}>
          <View style={[estilos.preenchido, { width: `${progresso}%` }]} />
        </View>

        <View style={estilos.quadros}>
          <Quadro rotulo="Chamando" valor={fila.senhaChamadaAgora ?? '—'} />
          <Quadro rotulo="Espera" valor={fila.tempoEstimadoMinutos != null ? tempoCurto(fila.tempoEstimadoMinutos) : '—'} cor={cores.ambarTexto} />
          <Quadro rotulo="Serviço" valor={senha.servico} />
        </View>
      </Card>

      {!chamada && (
        <Card variante="sucesso">
          <View style={estilos.linhaIcone}>
            <Ionicons name="notifications" size={22} color={cores.sucessoTexto} />
            <View style={estilos.flex}>
              <Texto style={[estilos.negrito, estilos.verde]}>Notificações ativas</Texto>
              <Texto style={estilos.verde}>Avisamos quando faltarem 3 senhas e quando for a sua vez.</Texto>
            </View>
          </View>
        </Card>
      )}

      {/* O protótipo mostra "Últimas chamadas" com histórico, mas a API só informa a senha chamada agora. */}
      <Card>
        <Texto variante="subtitulo">Chamando agora</Texto>
        {fila.senhaChamadaAgora ? (
          <View style={estilos.linhaChamada}>
            <Texto style={[estilos.negrito, estilos.flex]}>
              {fila.senhaChamadaAgora}
              {fila.guicheChamadaAgora ? ` · ${fila.guicheChamadaAgora}` : ''}
            </Texto>
            <Ionicons name="volume-high-outline" size={20} color={cores.marinho} />
            <Texto style={estilos.emAtendimento}>Em atendimento</Texto>
          </View>
        ) : (
          <Texto variante="secundario">Nenhuma senha foi chamada ainda hoje.</Texto>
        )}
      </Card>

      {saida.isError && <Alert tipo="perigo">{mensagemDeErro(saida.error)}</Alert>}

      {senha.status === 'Aguardando' &&
        (confirmandoSaida ? (
          <Card>
            <Texto>Sair da fila? Você perde o seu lugar e precisa pegar outra senha para voltar.</Texto>
            <Button titulo="Sim, sair da fila" enfase="perigo" onPress={() => saida.mutate()} carregando={saida.isPending} />
            <Button titulo="Continuar na fila" enfase="terciaria" onPress={() => setConfirmandoSaida(false)} />
          </Card>
        ) : (
          <Button titulo="Sair da fila" enfase="perigoSuave" icone="exit-outline" onPress={() => setConfirmandoSaida(true)} />
        ))}
    </>
  )
}

function Quadro({ rotulo, valor, cor }: { rotulo: string; valor: string; cor?: string }) {
  return (
    <View style={estilos.quadro} accessible accessibilityLabel={`${rotulo}: ${valor}`}>
      <Texto variante="secundario" style={estilos.centro}>{rotulo}</Texto>
      <Texto style={[estilos.valorQuadro, cor ? { color: cor } : null]}>{valor}</Texto>
    </View>
  )
}

const estilos = StyleSheet.create({
  flex: { flex: 1 },
  negrito: { fontWeight: fonte.pesoNegrito },
  centro: { textAlign: 'center' },
  verde: { color: cores.sucessoTexto },
  linhaEntre: { flexDirection: 'row', alignItems: 'flex-end', justifyContent: 'space-between', gap: espaco.x1 },
  alinhaDireita: { alignItems: 'flex-end' },
  rotulo: {
    fontSize: fonte.rotuloCaixaAlta,
    fontWeight: fonte.pesoSemiNegrito,
    color: cores.textoSecundario,
    letterSpacing: 1,
  },
  senha: { fontSize: fonte.gigante, lineHeight: fonte.gigante * 1.1, fontWeight: fonte.pesoNegrito, color: cores.marinho },
  posicao: { fontSize: fonte.gigante, lineHeight: fonte.gigante * 1.1, fontWeight: fonte.pesoNegrito, color: cores.ambarTexto },
  percentual: { fontWeight: fonte.pesoNegrito, color: cores.sucessoTexto },
  trilho: { height: 8, borderRadius: raio.pilula, backgroundColor: cores.cinzaClaro, overflow: 'hidden' },
  preenchido: { height: '100%', backgroundColor: cores.sucesso },
  quadros: { flexDirection: 'row', gap: espaco.x1, marginTop: espaco.x1 },
  quadro: {
    flex: 1,
    alignItems: 'center',
    gap: 2,
    padding: espaco.x1,
    borderRadius: raio.medio,
    borderWidth: 1,
    borderColor: cores.cinzaClaro,
    backgroundColor: cores.fundoSuave,
  },
  valorQuadro: { fontWeight: fonte.pesoNegrito, color: cores.marinho, textAlign: 'center' },
  linhaIcone: { flexDirection: 'row', alignItems: 'flex-start', gap: espaco.x1 },
  linhaChamada: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: espaco.x1,
    padding: espaco.x1 + espaco.meio,
    borderRadius: raio.medio,
    borderWidth: 1,
    borderColor: cores.infoBorda,
    backgroundColor: cores.infoFundo,
  },
  emAtendimento: { color: cores.marinho, fontWeight: fonte.pesoSemiNegrito },
})
