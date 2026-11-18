import { Ionicons } from '@expo/vector-icons'
import { useQuery } from '@tanstack/react-query'
import { router, useLocalSearchParams } from 'expo-router'
import { StyleSheet, View } from 'react-native'
import { listarUnidades } from '@/api/unidades'
import { AbasPassos } from '@/components/AbasPassos'
import { Alert } from '@/components/Alert'
import { CabecalhoMarinho } from '@/components/CabecalhoMarinho'
import { Card } from '@/components/Card'
import { Carregando, ErroAoCarregar } from '@/components/Estados'
import { Tela } from '@/components/Tela'
import { Texto } from '@/components/Texto'
import { useLocalizacao } from '@/hooks/useLocalizacao'
import { cores, espaco, fonte } from '@/theme/tokens'
import { PASSOS_AGENDAMENTO } from '@/utils/agenda'
import { distancia } from '@/utils/formatar'

// RF03: lista das unidades do CRAS, da mais perto para a mais longe quando há localização.
// É o 1º passo do agendamento (print 07 do protótipo): tocar na unidade já abre a escolha do serviço.
// Com ?para=detalhe (atalhos "Contato CRAS", "Documentos" e "Entrar na fila"), o toque abre o detalhe
// da unidade, onde ficam telefone, checklist de documentos (RF04/RF05) e o "Entrar na fila agora" (RF08).
export default function TelaAgendar() {
  const { para } = useLocalSearchParams<{ para?: string }>()
  const paraDetalhe = para === 'detalhe'
  const { estado, posicao } = useLocalizacao()

  // Espera a resposta da localização para não buscar a lista duas vezes (sem e com distância).
  const unidades = useQuery({
    queryKey: ['unidades', posicao?.latitude, posicao?.longitude],
    queryFn: () => listarUnidades(posicao),
    enabled: estado !== 'carregando',
  })

  const abrir = (id: string) =>
    paraDetalhe
      ? router.push({ pathname: '/unidade/[id]', params: { id } })
      : router.push({ pathname: '/agendar/[unidadeId]', params: { unidadeId: id } })

  const cabecalho = paraDetalhe ? (
    <CabecalhoMarinho titulo="Unidades do CRAS" subtitulo="Telefone, endereço, documentos e fila" />
  ) : (
    <>
      <CabecalhoMarinho titulo="Agendar Atendimento" />
      <AbasPassos passos={PASSOS_AGENDAMENTO} atual={0} />
    </>
  )

  return (
    <Tela cabecalho={cabecalho} atualizando={unidades.isRefetching} aoAtualizar={() => void unidades.refetch()}>
      <Texto variante="subtitulo">{paraDetalhe ? 'Escolha a unidade' : 'Qual unidade CRAS deseja?'}</Texto>

      {estado === 'negada' && (
        <Alert tipo="info">Sem acesso à localização, as unidades aparecem em ordem alfabética.</Alert>
      )}

      {estado === 'carregando' || unidades.isPending ? (
        <Carregando texto="Procurando as unidades..." />
      ) : unidades.isError ? (
        <ErroAoCarregar erro={unidades.error} aoTentarDeNovo={() => void unidades.refetch()} />
      ) : (
        unidades.data.map((u, i) => {
          const maisPerto = i === 0 && u.distanciaKm != null
          return (
            <Card
              key={u.id}
              onPress={() => abrir(u.id)}
              descricaoAcessivel={[
                u.nome,
                u.distanciaKm != null ? `a ${distancia(u.distanciaKm)}` : null,
                `${u.endereco}, ${u.bairro}`,
                maisPerto ? 'Unidade mais perto de você' : null,
              ].filter(Boolean).join('. ')}>
              <View style={estilos.linha}>
                <View style={estilos.textos}>
                  <Texto style={estilos.nome}>{u.nome}</Texto>
                  {maisPerto && <Texto style={estilos.maisPerto}>Mais perto de você</Texto>}
                  <Texto variante="secundario">
                    {u.endereco} · {u.bairro}
                  </Texto>
                  {u.distanciaKm != null && (
                    <View style={estilos.distancia}>
                      <Ionicons name="location-outline" size={20} color={cores.marinho} />
                      <Texto variante="secundario">{distancia(u.distanciaKm)}</Texto>
                    </View>
                  )}
                </View>
                <Ionicons name="chevron-forward" size={24} color={cores.marinho} />
              </View>
            </Card>
          )
        })
      )}
    </Tela>
  )
}

const estilos = StyleSheet.create({
  linha: { flexDirection: 'row', alignItems: 'center', gap: espaco.x1 },
  textos: { flex: 1, gap: espaco.meio },
  nome: { fontWeight: fonte.pesoNegrito, color: cores.marinho },
  maisPerto: { color: cores.sucesso, fontWeight: fonte.pesoSemiNegrito },
  distancia: { flexDirection: 'row', alignItems: 'center', gap: espaco.meio },
})
