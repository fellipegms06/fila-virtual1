import { Ionicons } from '@expo/vector-icons'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { router, useLocalSearchParams } from 'expo-router'
import { useMemo, useState } from 'react'
import { Pressable, ScrollView, StyleSheet, View } from 'react-native'
import { agendar } from '@/api/agendamentos'
import { mensagemDeErro } from '@/api/cliente'
import type { Agendamento, Horario, Servico } from '@/api/tipos'
import { listarHorarios, obterUnidade } from '@/api/unidades'
import { AbasPassos } from '@/components/AbasPassos'
import { Alert } from '@/components/Alert'
import { Button } from '@/components/Button'
import { Card } from '@/components/Card'
import { Carregando, ErroAoCarregar } from '@/components/Estados'
import { Opcao } from '@/components/Opcao'
import { Tela } from '@/components/Tela'
import { Texto } from '@/components/Texto'
import { ALVO_TOQUE, cores, espaco, fonte, raio } from '@/theme/tokens'
import { agruparPorDia, PASSOS_AGENDAMENTO, type DiaComHorarios } from '@/utils/agenda'
import { dataCompacta, dataPorExtenso, hora, partesDoDia } from '@/utils/formatar'
import { textoCidadao } from '@/utils/servicos'

// Índices em PASSOS_AGENDAMENTO. O passo 0 (Unidade) é a lista da aba Agendar, que abre esta tela.
const SERVICO = 1
const DATA_HORA = 2
const CONFIRMAR = 3

// RF06: agendar em passos curtos (prints 08 a 10 do protótipo).
// Toques depois de escolher o serviço: horário → Continuar → Confirmar = 3, os mesmos de antes
// (dia → horário → confirmar), porque o primeiro dia com vaga já vem selecionado.
// Vindo do botão "Agendar este serviço" (detalhe da unidade), o passo do serviço é pulado.
export default function TelaAgendar() {
  const params = useLocalSearchParams<{ unidadeId: string; servicoId?: string }>()
  const queryClient = useQueryClient()

  const [servicoId, setServicoId] = useState<string | undefined>(params.servicoId)
  const [passo, setPasso] = useState(params.servicoId ? DATA_HORA : SERVICO)
  const [diaEscolhido, setDiaEscolhido] = useState<string | null>(null)
  const [horarioId, setHorarioId] = useState<string | null>(null)
  const [horario, setHorario] = useState<Horario | null>(null) // o que vai ser confirmado
  const [aviso, setAviso] = useState<string | null>(null)
  const [confirmado, setConfirmado] = useState<Agendamento | null>(null)

  const unidade = useQuery({ queryKey: ['unidade', params.unidadeId], queryFn: () => obterUnidade(params.unidadeId) })
  const horarios = useQuery({
    queryKey: ['horarios', params.unidadeId, servicoId],
    queryFn: () => listarHorarios(params.unidadeId, servicoId!),
    enabled: !!servicoId,
    staleTime: 0, // vagas mudam o tempo todo: sempre busca de novo ao entrar no passo
  })
  // agruparPorDia já deixa de fora os dias sem vaga.
  const dias = useMemo(() => agruparPorDia(horarios.data ?? []), [horarios.data])
  // Sem escolha (ou se o dia escolhido ficou sem vaga depois de recarregar), vale o primeiro dia com vaga.
  const dia = dias.find((d) => d.dia === diaEscolhido) ?? dias[0]
  // Se o horário marcado sumiu ao recarregar (alguém pegou a vaga), a marcação some junto.
  const horarioMarcado = dia?.horarios.find((h) => h.id === horarioId)

  const envio = useMutation({
    mutationFn: () => agendar(horario!.id),
    onSuccess: (agendamento) => {
      void queryClient.invalidateQueries({ queryKey: ['agendamentos'] })
      setConfirmado(agendamento)
    },
    onError: (erro) => {
      // Alguém pegou a última vaga antes (409): volta para data e hora já atualizados.
      setAviso(mensagemDeErro(erro))
      setHorario(null)
      setHorarioId(null)
      setPasso(DATA_HORA)
      void horarios.refetch()
    },
  })

  if (unidade.isPending) return <Tela><Carregando /></Tela>
  if (unidade.isError) return <Tela><ErroAoCarregar erro={unidade.error} aoTentarDeNovo={() => void unidade.refetch()} /></Tela>

  const u = unidade.data
  const servico = u.servicos.find((s) => s.id === servicoId)

  if (confirmado) {
    return (
      <Tela>
        <Alert tipo="sucesso" titulo="Agendamento confirmado!">
          {`${textoCidadao(confirmado.servico)}: ${dataPorExtenso(confirmado.dataHora)}, às ${hora(confirmado.dataHora)}.`}
        </Alert>
        <Card>
          <Texto style={estilos.rotulo}>CÓDIGO PARA O CHECK-IN</Texto>
          <Texto variante="destaque" style={estilos.codigo}
            accessibilityLabel={`Código ${confirmado.codigoCheckin.split('').join(' ')}`}>
            {confirmado.codigoCheckin}
          </Texto>
          <Texto variante="secundario">
            Chegue 10 minutos antes e mostre este código (ou o QR Code em Meus agendamentos) na recepção.
          </Texto>
        </Card>
        <Button titulo="Ver meus agendamentos" icone="calendar" onPress={() => router.navigate('/agendamentos')} />
        <Button titulo="Voltar ao início" enfase="terciaria" onPress={() => router.navigate('/')} />
      </Tela>
    )
  }

  const voltar = () => {
    setAviso(null)
    // Do primeiro passo desta tela (ou se o serviço veio escolhido), "voltar" sai da tela.
    if (passo === SERVICO || (passo === DATA_HORA && params.servicoId)) router.back()
    else setPasso(passo - 1)
  }

  const continuar = () => {
    if (!horarioMarcado) return
    setHorario(horarioMarcado)
    setAviso(null)
    setPasso(CONFIRMAR)
  }

  return (
    <Tela cabecalho={<AbasPassos passos={PASSOS_AGENDAMENTO} atual={passo} />}>
      <Pressable
        onPress={voltar}
        disabled={envio.isPending}
        accessibilityRole="button"
        accessibilityLabel="Voltar"
        style={estilos.voltar}>
        <Ionicons name="chevron-back" size={22} color={cores.marinho} />
        <Texto style={estilos.voltarTexto}>Voltar</Texto>
      </Pressable>

      {aviso && <Alert tipo="perigo">{aviso}</Alert>}

      {passo === SERVICO && (
        <>
          <Texto variante="subtitulo">Qual serviço você precisa?</Texto>
          {u.servicos.map((s) => (
            <Opcao
              key={s.id}
              titulo={textoCidadao(s.nome)}
              detalhe={detalheDoServico(s)}
              selecionada={s.id === servicoId}
              onPress={() => {
                setServicoId(s.id)
                setDiaEscolhido(null)
                setHorarioId(null)
                setPasso(DATA_HORA)
              }}
            />
          ))}
        </>
      )}

      {passo === DATA_HORA && (
        <>
          <Texto variante="subtitulo">Escolha a data</Texto>
          {horarios.isPending ? (
            <Carregando texto="Buscando dias com vaga..." />
          ) : horarios.isError ? (
            <ErroAoCarregar erro={horarios.error} aoTentarDeNovo={() => void horarios.refetch()} />
          ) : !dia ? (
            <Alert tipo="info">
              Não há vagas para este serviço nos próximos 14 dias. Tente outro serviço ou outra unidade.
            </Alert>
          ) : (
            <>
              <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={estilos.chipsDias}>
                {dias.map((d) => (
                  <ChipDia
                    key={d.dia}
                    dia={d}
                    selecionado={d.dia === dia.dia}
                    onPress={() => {
                      setDiaEscolhido(d.dia)
                      setHorarioId(null)
                      setAviso(null)
                    }}
                  />
                ))}
              </ScrollView>

              <Texto variante="subtitulo">Escolha o horário</Texto>
              <View style={estilos.grade}>
                {dia.horarios.map((h) => (
                  <Opcao
                    key={h.id}
                    variante="chip"
                    titulo={hora(h.dataHora)}
                    descricaoAcessivel={`${hora(h.dataHora)}, ${h.vagasDisponiveis} ${h.vagasDisponiveis === 1 ? 'vaga' : 'vagas'}`}
                    selecionada={h.id === horarioMarcado?.id}
                    onPress={() => setHorarioId(h.id)}
                  />
                ))}
              </View>

              <Button titulo="Continuar" iconeDepois="arrow-forward" onPress={continuar} desabilitado={!horarioMarcado} />
            </>
          )}
        </>
      )}

      {passo === CONFIRMAR && horario && servico && (
        <>
          <Texto variante="subtitulo">Confirmar agendamento</Texto>
          <Card>
            <LinhaResumo rotulo="UNIDADE" valor={u.nome} />
            <LinhaResumo rotulo="ENDEREÇO" valor={`${u.endereco} — ${u.bairro}`} />
            <LinhaResumo rotulo="SERVIÇO" valor={textoCidadao(servico.nome)} />
            <LinhaResumo rotulo="DATA" valor={dataCompacta(horario.dataHora)} />
            <LinhaResumo rotulo="HORÁRIO" valor={hora(horario.dataHora)} ultima />
          </Card>

          <View style={estilos.avisoDocumentos}>
            <Ionicons name="warning" size={22} color={cores.ambarTexto} />
            <Texto style={estilos.flex}>
              {textoDocumentos(servico)} <Texto style={estilos.negrito}>Chegue 10 minutos antes.</Texto>
            </Texto>
          </View>

          <Button titulo="Confirmar agendamento" icone="checkmark" onPress={() => envio.mutate()} carregando={envio.isPending} />
        </>
      )}
    </Tela>
  )
}

// Nome oficial e duração ficam como linha de apoio, para não perder a informação técnica.
function detalheDoServico(s: Servico) {
  const traduzido = textoCidadao(s.nome) !== s.nome
  return traduzido ? `${s.nome} · cerca de ${s.duracaoMediaMinutos} minutos` : `Cerca de ${s.duracaoMediaMinutos} minutos`
}

// "Traga CPF do responsável e Conta de luz." Só os documentos obrigatórios (o checklist completo está na unidade).
function textoDocumentos(s: Servico) {
  const obrigatorios = s.documentos.filter((d) => d.obrigatorio).map((d) => d.descricao)
  if (obrigatorios.length === 0) return 'Traga um documento com foto.'
  const lista = obrigatorios.length === 1
    ? obrigatorios[0]
    : `${obrigatorios.slice(0, -1).join(', ')} e ${obrigatorios[obrigatorios.length - 1]}`
  return `Traga ${lista}.`
}

function ChipDia({ dia, selecionado, onPress }: { dia: DiaComHorarios; selecionado: boolean; onPress: () => void }) {
  const { semana, dia: numero, mes } = partesDoDia(dia.primeiroHorario)
  const livres = dia.horarios.length
  const cor = { color: selecionado ? cores.branco : cores.marinho }
  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="button"
      accessibilityState={{ selected: selecionado }}
      accessibilityLabel={`${dataPorExtenso(dia.primeiroHorario)}, ${livres} ${livres === 1 ? 'horário livre' : 'horários livres'}`}
      style={({ pressed }) => [estilos.chipDia, selecionado && estilos.chipDiaSelecionado, pressed && !selecionado && estilos.pressionado]}>
      <Texto style={[estilos.chipSemana, cor]}>{semana}</Texto>
      <Texto style={[estilos.chipNumero, cor]}>{numero}</Texto>
      <Texto style={[estilos.chipSemana, cor]}>{mes}</Texto>
    </Pressable>
  )
}

function LinhaResumo({ rotulo, valor, ultima }: { rotulo: string; valor: string; ultima?: boolean }) {
  return (
    <View style={[estilos.resumo, !ultima && estilos.resumoDivisor]} accessible accessibilityLabel={`${rotulo.toLowerCase()}: ${valor}`}>
      <Texto style={estilos.rotulo}>{rotulo}</Texto>
      <Texto style={estilos.negrito}>{valor}</Texto>
    </View>
  )
}

const estilos = StyleSheet.create({
  flex: { flex: 1 },
  negrito: { fontWeight: fonte.pesoNegrito },
  voltar: { flexDirection: 'row', alignItems: 'center', alignSelf: 'flex-start', minHeight: ALVO_TOQUE, paddingRight: espaco.x2 },
  voltarTexto: { color: cores.marinho, fontWeight: fonte.pesoSemiNegrito },
  rotulo: { fontSize: fonte.rotuloCaixaAlta, fontWeight: fonte.pesoSemiNegrito, color: cores.textoSecundario, letterSpacing: 1 },
  codigo: { color: cores.marinho, letterSpacing: 2 },
  chipsDias: { gap: espaco.x1, paddingVertical: espaco.meio },
  chipDia: {
    minWidth: 64,
    alignItems: 'center',
    paddingVertical: espaco.x1,
    paddingHorizontal: espaco.x1 + espaco.meio,
    borderRadius: raio.medio,
    borderWidth: 1,
    borderColor: cores.divisor,
    backgroundColor: cores.branco,
  },
  chipDiaSelecionado: { backgroundColor: cores.marinho, borderColor: cores.marinho },
  pressionado: { backgroundColor: cores.azulFundo },
  chipSemana: { fontSize: fonte.pequena },
  chipNumero: { fontSize: fonte.grande, lineHeight: fonte.grande * 1.2, fontWeight: fonte.pesoNegrito },
  grade: { flexDirection: 'row', flexWrap: 'wrap', gap: espaco.x1 },
  resumo: { gap: 2, paddingVertical: espaco.x1 },
  resumoDivisor: { borderBottomWidth: 1, borderBottomColor: cores.cinzaClaro },
  avisoDocumentos: {
    flexDirection: 'row',
    gap: espaco.x1,
    alignItems: 'flex-start',
    padding: espaco.x2,
    borderRadius: raio.cartao,
    borderWidth: 1,
    borderColor: cores.alerta,
    backgroundColor: cores.alertaFundo,
  },
})
