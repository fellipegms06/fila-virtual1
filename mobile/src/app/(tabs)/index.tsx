import { Ionicons } from '@expo/vector-icons'
import { useQuery } from '@tanstack/react-query'
import { router, type Href } from 'expo-router'
import { useEffect } from 'react'
import { Pressable, StyleSheet, View } from 'react-native'
import { listarMeusAgendamentos } from '@/api/agendamentos'
import { consultarMinhaFila } from '@/api/fila'
import type { Agendamento, MinhaFila } from '@/api/tipos'
import { useAuth } from '@/auth/AuthContext'
import { Button } from '@/components/Button'
import { CabecalhoMarinho } from '@/components/CabecalhoMarinho'
import { Card } from '@/components/Card'
import { Carregando, ErroAoCarregar } from '@/components/Estados'
import { StatusTag } from '@/components/StatusTag'
import { Tela } from '@/components/Tela'
import { Texto } from '@/components/Texto'
import { useTempoReal } from '@/realtime/TempoReal'
import { ALVO_TOQUE, cores, espaco, fonte, raio } from '@/theme/tokens'
import { separarAgendamentos, STATUS_AGENDAMENTO } from '@/utils/agenda'
import { cpfOculto } from '@/utils/documentos'
import { dataCompacta, hora, tempoCurto } from '@/utils/formatar'
import { textoCidadao } from '@/utils/servicos'

// Quanto o card da fila "sobe" por cima do cabeçalho azul-marinho (print 01 do protótipo).
const SOBREPOSICAO = 48

// Destinos usados mais de uma vez. A aba Agendar sempre recebe o modo explícito (veja _layout.tsx).
const AGENDAR: Href = { pathname: '/agendar', params: { para: 'agendamento' } }
const ESCOLHER_UNIDADE: Href = { pathname: '/agendar', params: { para: 'detalhe' } }

// Início (prints 01 e 02): resumo do que importa agora. Não tem regra nova: só junta as mesmas
// consultas das abas Fila (RF09) e Meus agendamentos (RF07), que ficam em cache e são compartilhadas.
export default function TelaInicio() {
  const { sessao } = useAuth()
  const { estado, acompanharUnidade } = useTempoReal()

  const fila = useQuery({
    queryKey: ['fila', 'minha'],
    queryFn: consultarMinhaFila,
    refetchInterval: estado === 'conectado' ? false : 30_000, // mesmo critério da aba Fila
  })
  const agendamentos = useQuery({ queryKey: ['agendamentos'], queryFn: listarMeusAgendamentos })

  // Entra no grupo da unidade no SignalR para o "Chamando agora" mudar sozinho também aqui.
  const unidadeDaFila = fila.data?.minhaSenha?.unidadeId ?? null
  useEffect(() => acompanharUnidade(unidadeDaFila), [unidadeDaFila, acompanharUnidade])

  const proximo = agendamentos.data ? separarAgendamentos(agendamentos.data).proximos[0] : undefined
  // Contato e documentos: da unidade onde a pessoa está na fila ou tem o próximo atendimento.
  const unidadeId = unidadeDaFila ?? proximo?.unidadeId
  const daUnidade: Href = unidadeId ? { pathname: '/unidade/[id]', params: { id: unidadeId } } : ESCOLHER_UNIDADE

  const usuario = sessao?.usuario
  const cabecalho = (
    <CabecalhoMarinho logo sobreposicao={SOBREPOSICAO} direita={<BotaoPerfil />}>
      <Texto style={estilos.saudacao}>Olá, cidadão(ã)</Texto>
      <Texto style={estilos.nome} accessibilityRole="header">{usuario?.nomeCompleto}</Texto>
      {usuario && (
        <Texto style={estilos.cpf} accessibilityLabel={`CPF parcialmente oculto: ${cpfOculto(usuario.cpf).replace(/\*/g, '')}`}>
          CPF: {cpfOculto(usuario.cpf)}
        </Texto>
      )}
    </CabecalhoMarinho>
  )

  return (
    <Tela
      cabecalho={cabecalho}
      atualizando={fila.isRefetching || agendamentos.isRefetching}
      aoAtualizar={() => {
        void fila.refetch()
        void agendamentos.refetch()
      }}>
      <View style={estilos.sobreposto}>
        {fila.isPending ? (
          <Card><Carregando /></Card>
        ) : fila.isError ? (
          <Card><ErroAoCarregar erro={fila.error} aoTentarDeNovo={() => void fila.refetch()} /></Card>
        ) : (
          <CardFila fila={fila.data} />
        )}
      </View>

      <View style={estilos.tituloSecao}>
        <Texto variante="subtitulo" style={estilos.flex}>Próximo Agendamento</Texto>
        <Pressable
          onPress={() => router.navigate('/agendamentos')}
          accessibilityRole="link"
          accessibilityLabel="Ver todos os meus agendamentos"
          hitSlop={4}
          style={estilos.verTodos}>
          <Texto style={estilos.link}>Ver todos</Texto>
        </Pressable>
      </View>
      {agendamentos.isPending ? (
        <Carregando />
      ) : agendamentos.isError ? (
        <ErroAoCarregar erro={agendamentos.error} aoTentarDeNovo={() => void agendamentos.refetch()} />
      ) : proximo ? (
        <CardProximo agendamento={proximo} />
      ) : (
        <Card>
          <Texto>Você não tem atendimento marcado.</Texto>
          <Button titulo="Agendar atendimento" icone="calendar-outline" onPress={() => router.navigate(AGENDAR)} />
        </Card>
      )}

      <Texto variante="subtitulo">Acesso Rápido</Texto>
      <View style={estilos.grade}>
        <Atalho icone="calendar" cor="info" titulo="Novo Agendamento" detalhe="Marque seu atendimento" destino={AGENDAR} />
        <Atalho icone="people" cor="alerta" titulo="Fila Virtual" detalhe="Acompanhe sua posição" destino="/fila" />
        <Atalho icone="call" cor="perigo" titulo="Contato CRAS" detalhe="Fale com a unidade" destino={daUnidade} />
        <Atalho icone="document-text" cor="sucesso" titulo="Documentos" detalhe="Lista do que levar" destino={daUnidade} />
      </View>
    </Tela>
  )
}

function BotaoPerfil() {
  return (
    <Pressable
      onPress={() => router.navigate('/perfil')}
      accessibilityRole="button"
      accessibilityLabel="Abrir meu perfil"
      style={({ pressed }) => [estilos.perfil, pressed && estilos.perfilPressionado]}>
      <Ionicons name="person-outline" size={24} color={cores.branco} />
    </Pressable>
  )
}

// Card "Na Fila Agora": posição, senha chamada agora e espera estimada.
function CardFila({ fila }: { fila: MinhaFila }) {
  const senha = fila.minhaSenha
  if (!senha) {
    return (
      <Card>
        <Texto style={estilos.negrito}>Você não está em nenhuma fila agora.</Texto>
        <Texto variante="secundario">Para entrar, escolha a unidade e o serviço. Com agendamento, a senha sai no check-in.</Texto>
        <Button titulo="Entrar na fila de uma unidade" enfase="secundaria" icone="people-outline"
          onPress={() => router.navigate(ESCOLHER_UNIDADE)} />
      </Card>
    )
  }

  const chamada = senha.status === 'EmAtendimento'
  const resumo = chamada
    ? `Sua senha ${senha.codigo} foi chamada${senha.guiche ? `: ${senha.guiche}` : ''}.`
    : `Na fila agora, ${senha.unidade}. Sua posição: ${fila.posicao}º.` +
      (fila.senhaChamadaAgora ? ` Chamando agora: ${fila.senhaChamadaAgora}.` : '') +
      (fila.tempoEstimadoMinutos != null ? ` Espera estimada: ${tempoCurto(fila.tempoEstimadoMinutos).replace('~', 'cerca de ')}.` : '')

  return (
    <Card onPress={() => router.navigate('/fila')} descricaoAcessivel={`${resumo} Toque para acompanhar a fila.`}>
      <View style={estilos.linhaEntre}>
        <View style={estilos.naFila}>
          <View style={estilos.bolinhaVerde} />
          <Texto style={estilos.naFilaTexto}>Na Fila Agora</Texto>
        </View>
        <Texto variante="secundario" numberOfLines={1} style={estilos.unidade}>{senha.unidade}</Texto>
      </View>

      {chamada ? (
        <View style={estilos.chamada}>
          <Texto style={estilos.chamadaTitulo}>Sua senha {senha.codigo} foi chamada!</Texto>
          <Texto style={estilos.sucessoTexto}>{senha.guiche ? `Vá agora ao ${senha.guiche}.` : 'Vá agora ao atendimento.'}</Texto>
        </View>
      ) : (
        <View style={estilos.colunas}>
          <View style={estilos.colunaPosicao}>
            <Texto variante="secundario">Sua posição</Texto>
            <Texto style={estilos.posicao}>{fila.posicao}</Texto>
            <Texto variante="secundario">na fila</Texto>
          </View>
          <View style={estilos.colunaDireita}>
            <Texto variante="secundario">Chamando agora</Texto>
            <Texto style={estilos.chamandoAgora}>{fila.senhaChamadaAgora ?? '—'}</Texto>
            <Texto variante="secundario">Espera estimada</Texto>
            <Texto style={estilos.espera}>
              {fila.tempoEstimadoMinutos != null ? tempoCurto(fila.tempoEstimadoMinutos) : '—'}
            </Texto>
          </View>
        </View>
      )}

      <Card variante="sucesso" style={estilos.faixa}>
        <View style={estilos.linhaIcone}>
          <Ionicons name="notifications-outline" size={20} color={cores.sucessoTexto} />
          <Texto style={[estilos.sucessoTexto, estilos.flex]}>Você será avisado(a) quando sua vez se aproximar</Texto>
        </View>
      </Card>
    </Card>
  )
}

// Card "Próximo Agendamento". Antes do check-in ainda não existe senha: mostramos o código do check-in.
function CardProximo({ agendamento: a }: { agendamento: Agendamento }) {
  const status = STATUS_AGENDAMENTO[a.status]
  const servico = textoCidadao(a.servico)
  const temSenha = !!a.senha
  return (
    <Card
      onPress={() => router.navigate('/agendamentos')}
      descricaoAcessivel={`${status.texto}. ${servico}, ${dataCompacta(a.dataHora)} às ${hora(a.dataHora)}, ${a.unidade}. ` +
        `${temSenha ? `Senha ${a.senha}` : `Código do check-in ${a.codigoCheckin}`}. Toque para ver o QR Code e os detalhes.`}>
      <View style={estilos.linhaEntre}>
        <StatusTag texto={a.status === 'Confirmado' ? `✓ ${status.texto}` : status.texto} tipo={status.tipo} />
        <Texto style={estilos.hora}>{hora(a.dataHora)}</Texto>
      </View>
      <View style={estilos.linhaEntre}>
        <Texto style={[estilos.negrito, estilos.flex]}>{servico}</Texto>
        <Texto variante="secundario">{dataCompacta(a.dataHora)}</Texto>
      </View>
      <Texto variante="secundario">{a.unidade}</Texto>
      <View style={estilos.caixaSenha}>
        <Texto variante="secundario">{temSenha ? 'Senha' : 'Código do check-in'}</Texto>
        <Texto style={estilos.codigo}>{temSenha ? a.senha : a.codigoCheckin}</Texto>
      </View>
    </Card>
  )
}

type CorAtalho = 'info' | 'alerta' | 'perigo' | 'sucesso'

// Quadrado colorido do ícone de cada atalho: fundo claro + ícone escuro da mesma família (contraste ≥ 3:1).
const COR_ATALHO: Record<CorAtalho, { fundo: string; icone: string }> = {
  info: { fundo: cores.infoFundo, icone: cores.marinho },
  alerta: { fundo: cores.alertaFundo, icone: cores.ambarTexto },
  perigo: { fundo: cores.perigoFundo, icone: cores.perigoTexto },
  sucesso: { fundo: cores.sucessoFundo, icone: cores.sucessoTexto },
}

interface PropsAtalho {
  icone: keyof typeof Ionicons.glyphMap
  cor: CorAtalho
  titulo: string
  detalhe: string
  destino: Href
}

function Atalho({ icone, cor, titulo, detalhe, destino }: PropsAtalho) {
  const { fundo, icone: corIcone } = COR_ATALHO[cor]
  return (
    <Card onPress={() => router.navigate(destino)} descricaoAcessivel={`${titulo}. ${detalhe}`} style={estilos.atalho}>
      <View style={[estilos.quadradoIcone, { backgroundColor: fundo }]}>
        <Ionicons name={icone} size={24} color={corIcone} />
      </View>
      <Texto style={estilos.negrito}>{titulo}</Texto>
      <Texto variante="secundario">{detalhe}</Texto>
    </Card>
  )
}

const estilos = StyleSheet.create({
  flex: { flex: 1 },
  negrito: { fontWeight: fonte.pesoNegrito },
  saudacao: { color: cores.textoSobreMarinho, fontSize: fonte.pequena },
  nome: { color: cores.branco, fontSize: fonte.grande, lineHeight: fonte.grande * 1.25, fontWeight: fonte.pesoNegrito },
  cpf: { color: cores.textoSobreMarinho, fontSize: fonte.pequena },
  perfil: {
    width: ALVO_TOQUE,
    height: ALVO_TOQUE,
    borderRadius: ALVO_TOQUE / 2,
    borderWidth: 1,
    borderColor: cores.textoSobreMarinho,
    alignItems: 'center',
    justifyContent: 'center',
  },
  perfilPressionado: { backgroundColor: cores.marinhoClaro },
  // Sobe o card por cima do cabeçalho: compensa a sobreposição e o espaço de cima do conteúdo.
  sobreposto: { marginTop: -(SOBREPOSICAO + espaco.x2) },
  linhaEntre: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: espaco.x1 },
  naFila: { flexDirection: 'row', alignItems: 'center', gap: espaco.x1 },
  bolinhaVerde: { width: 10, height: 10, borderRadius: 5, backgroundColor: cores.sucesso },
  naFilaTexto: { color: cores.sucesso, fontWeight: fonte.pesoNegrito },
  unidade: { flexShrink: 1, textAlign: 'right' },
  colunas: { flexDirection: 'row', gap: espaco.x2 },
  colunaPosicao: { minWidth: 96, paddingRight: espaco.x2, borderRightWidth: 1, borderRightColor: cores.cinzaClaro },
  colunaDireita: { flex: 1 },
  posicao: { fontSize: fonte.gigante, lineHeight: fonte.gigante * 1.1, fontWeight: fonte.pesoNegrito, color: cores.marinho },
  chamandoAgora: { fontSize: fonte.titulo, lineHeight: fonte.titulo * 1.2, fontWeight: fonte.pesoNegrito, color: cores.sucesso },
  espera: { fontWeight: fonte.pesoNegrito, color: cores.ambarTexto },
  chamada: { gap: espaco.meio },
  chamadaTitulo: { fontSize: fonte.media, fontWeight: fonte.pesoNegrito, color: cores.sucessoTexto },
  sucessoTexto: { color: cores.sucessoTexto },
  faixa: { padding: espaco.x1 + espaco.meio },
  linhaIcone: { flexDirection: 'row', alignItems: 'center', gap: espaco.x1 },
  tituloSecao: { flexDirection: 'row', alignItems: 'center', gap: espaco.x1, marginTop: espaco.x1 },
  verTodos: { minHeight: ALVO_TOQUE, minWidth: ALVO_TOQUE, justifyContent: 'center', paddingHorizontal: espaco.x1 },
  link: { color: cores.primaria, fontWeight: fonte.pesoSemiNegrito, textDecorationLine: 'underline' },
  hora: { fontSize: fonte.grande, fontWeight: fonte.pesoNegrito, color: cores.marinho },
  caixaSenha: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: cores.fundoApp,
    borderRadius: raio.medio,
    paddingHorizontal: espaco.x2,
    paddingVertical: espaco.x1,
    marginTop: espaco.meio,
  },
  codigo: { fontSize: fonte.media, fontWeight: fonte.pesoNegrito, color: cores.marinho, letterSpacing: 1 },
  grade: { flexDirection: 'row', flexWrap: 'wrap', gap: espaco.x2 },
  atalho: { flexBasis: '45%', flexGrow: 1 },
  quadradoIcone: { width: 44, height: 44, borderRadius: raio.medio, alignItems: 'center', justifyContent: 'center' },
})
