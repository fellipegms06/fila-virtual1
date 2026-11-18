import { Ionicons } from '@expo/vector-icons'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { StyleSheet, View } from 'react-native'
import { listarNotificacoes, marcarComoLida, marcarTodasComoLidas } from '@/api/notificacoes'
import type { Notificacao, TipoNotificacao } from '@/api/tipos'
import { Button } from '@/components/Button'
import { CabecalhoMarinho } from '@/components/CabecalhoMarinho'
import { Card, type VarianteCard } from '@/components/Card'
import { Carregando, ErroAoCarregar } from '@/components/Estados'
import { Tela } from '@/components/Tela'
import { Texto } from '@/components/Texto'
import { cores, espaco, fonte } from '@/theme/tokens'
import { dataCurta, hora } from '@/utils/formatar'

type Categoria = 'sucesso' | 'info' | 'pendencia'

// Print 04: cada tipo de aviso tem cor e ícone próprios (a cor nunca é a única pista: o ícone e o título também mudam).
const CATEGORIA: Record<TipoNotificacao, Categoria> = {
  AgendamentoConfirmado: 'sucesso',
  SenhaChamada: 'sucesso',
  VezProxima: 'info',
  AlteracaoNaFila: 'info',
  ImprevistoNaUnidade: 'pendencia',
}

const VISUAL: Record<Categoria, { variante: VarianteCard; icone: keyof typeof Ionicons.glyphMap; cor: string }> = {
  sucesso: { variante: 'sucesso', icone: 'checkmark', cor: cores.sucessoTexto },
  info: { variante: 'info', icone: 'information-circle-outline', cor: cores.marinho },
  pendencia: { variante: 'pendencia', icone: 'warning-outline', cor: cores.texto },
}

// RF10: lista de avisos, com marcação de lida. Os não lidos têm ponto amarelo no canto.
export default function TelaNotificacoes() {
  const queryClient = useQueryClient()
  const notificacoes = useQuery({ queryKey: ['notificacoes'], queryFn: listarNotificacoes })
  const atualizar = () => void queryClient.invalidateQueries({ queryKey: ['notificacoes'] })

  const lerUma = useMutation({ mutationFn: (id: string) => marcarComoLida(id), onSuccess: atualizar })
  const lerTodas = useMutation({ mutationFn: marcarTodasComoLidas, onSuccess: atualizar })

  const naoLidas = notificacoes.data?.filter((n) => !n.lida).length ?? 0
  const subtitulo = !notificacoes.data || notificacoes.data.length === 0
    ? undefined
    : naoLidas === 0
      ? 'Todos os avisos foram lidos.'
      : `${naoLidas} ${naoLidas === 1 ? 'não lido' : 'não lidos'}`
  const cabecalho = <CabecalhoMarinho titulo="Avisos" subtitulo={subtitulo} />

  if (notificacoes.isPending) return <Tela cabecalho={cabecalho}><Carregando /></Tela>
  if (notificacoes.isError)
    return <Tela cabecalho={cabecalho}><ErroAoCarregar erro={notificacoes.error} aoTentarDeNovo={() => void notificacoes.refetch()} /></Tela>

  return (
    <Tela cabecalho={cabecalho} atualizando={notificacoes.isRefetching} aoAtualizar={() => void notificacoes.refetch()}>
      {notificacoes.data.length === 0 ? (
        <Card><Texto>Você ainda não tem avisos. Eles aparecem aqui quando você agenda ou entra na fila.</Texto></Card>
      ) : (
        <>
          {/* Não existe no protótipo, mas já existia no app: fica discreto, só quando há algo para marcar. */}
          {naoLidas > 0 && (
            <Button titulo="Marcar todos como lidos" enfase="terciaria" icone="checkmark-done"
              onPress={() => lerTodas.mutate()} carregando={lerTodas.isPending} />
          )}
          {notificacoes.data.map((n) => (
            <ItemNotificacao key={n.id} notificacao={n} aoLer={() => lerUma.mutate(n.id)} />
          ))}
        </>
      )}
    </Tela>
  )
}

function ItemNotificacao({ notificacao: n, aoLer }: { notificacao: Notificacao; aoLer: () => void }) {
  const quando = `${dataCurta(n.criadaEm)} às ${hora(n.criadaEm)}`
  const { variante, icone, cor } = VISUAL[CATEGORIA[n.tipo] ?? 'info']
  return (
    <Card
      variante={variante}
      onPress={n.lida ? undefined : aoLer}
      descricaoAcessivel={`${n.lida ? '' : 'Novo. '}${n.titulo}. ${n.mensagem}. ${quando}.${n.lida ? '' : ' Toque para marcar como lido.'}`}>
      <View style={estilos.linha}>
        <Ionicons name={icone} size={24} color={cor} />
        <View style={estilos.textos}>
          <Texto style={[estilos.titulo, { color: n.lida ? cores.texto : cor }]}>{n.titulo}</Texto>
          <Texto style={n.lida && estilos.lido}>{n.mensagem}</Texto>
          <Texto variante="secundario">{quando}</Texto>
        </View>
      </View>
      {!n.lida && <View style={estilos.pontoNaoLido} />}
    </Card>
  )
}

const estilos = StyleSheet.create({
  linha: { flexDirection: 'row', alignItems: 'flex-start', gap: espaco.x1 + espaco.meio },
  // Espaço à direita para o título não passar por baixo do ponto amarelo.
  textos: { flex: 1, gap: espaco.meio, paddingRight: espaco.x2 },
  titulo: { fontWeight: fonte.pesoNegrito },
  lido: { color: cores.textoApagado },
  // Ponto amarelo de "não lido" no canto, com borda azul-marinho para não sumir no fundo claro.
  pontoNaoLido: {
    position: 'absolute',
    top: espaco.x2,
    right: espaco.x2,
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: cores.alerta,
    borderWidth: 1,
    borderColor: cores.marinho,
  },
})
