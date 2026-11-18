import { Ionicons } from '@expo/vector-icons'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { router, Stack, useLocalSearchParams } from 'expo-router'
import { Linking, StyleSheet, View } from 'react-native'
import { mensagemDeErro } from '@/api/cliente'
import { entrarNaFila } from '@/api/fila'
import { obterUnidade } from '@/api/unidades'
import { Accordion } from '@/components/Accordion'
import { Alert } from '@/components/Alert'
import { Button } from '@/components/Button'
import { Card } from '@/components/Card'
import { Carregando, ErroAoCarregar } from '@/components/Estados'
import { StatusTag } from '@/components/StatusTag'
import { Tela } from '@/components/Tela'
import { Texto } from '@/components/Texto'
import { cores, espaco } from '@/theme/tokens'
import { somenteDigitos } from '@/utils/documentos'

// RF04 (dados da unidade) e RF05 (serviços com descrição simples e checklist do que levar).
export default function TelaUnidade() {
  const { id } = useLocalSearchParams<{ id: string }>()
  const unidade = useQuery({ queryKey: ['unidade', id], queryFn: () => obterUnidade(id) })
  const queryClient = useQueryClient()

  // RF08: entrar na fila virtual agora, sem agendamento. Deu certo -> vai direto para a tela da fila.
  const fila = useMutation({
    mutationFn: (servicoId: string) => entrarNaFila(id, servicoId),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ['fila'] })
      router.navigate('/fila')
    },
  })

  if (unidade.isPending) return <Tela><Carregando /></Tela>
  if (unidade.isError) return <Tela><ErroAoCarregar erro={unidade.error} aoTentarDeNovo={() => void unidade.refetch()} /></Tela>

  const u = unidade.data
  const agendar = (servicoId?: string) =>
    router.push({ pathname: '/agendar/[unidadeId]', params: servicoId ? { unidadeId: u.id, servicoId } : { unidadeId: u.id } })

  return (
    <Tela>
      <Stack.Screen options={{ title: u.nome }} />

      <Card>
        <Texto variante="titulo">{u.nome}</Texto>
        <Linha icone="location-outline">{u.endereco}, {u.bairro}</Linha>
        <Linha icone="time-outline">{u.horarioFuncionamento}</Linha>
        <Linha icone="call-outline">{u.telefone}</Linha>
        <Button
          titulo="Ligar para a unidade"
          enfase="secundaria"
          icone="call"
          descricaoAcessivel={`Ligar para ${u.nome}, telefone ${u.telefone}`}
          onPress={() => void Linking.openURL(`tel:${somenteDigitos(u.telefone)}`)}
        />
      </Card>

      <Texto variante="subtitulo">Serviços</Texto>
      <Texto variante="secundario">Toque em um serviço para ver o que levar no dia.</Texto>

      <Card>
        {u.servicos.map((s) => (
          <Accordion key={s.id} titulo={s.nome} subtitulo={`Cerca de ${s.duracaoMediaMinutos} minutos`}>
            <Texto>{s.descricao}</Texto>
            <Texto variante="rotulo">O que levar</Texto>
            {s.documentos.length === 0 ? (
              <Texto variante="secundario">Só um documento com foto.</Texto>
            ) : (
              s.documentos.map((d) => (
                <View key={d.descricao} style={estilos.documento}>
                  <Ionicons name="document-text-outline" size={20} color={cores.marinho} />
                  <View style={estilos.textoDocumento}>
                    <Texto>{d.descricao}</Texto>
                    <StatusTag texto={d.obrigatorio ? 'Obrigatório' : 'Se tiver'} tipo={d.obrigatorio ? 'info' : 'neutro'} />
                  </View>
                </View>
              ))
            )}
            {/* Atalho: já entra no agendamento com o serviço escolhido (menos toques). */}
            <Button titulo="Agendar este serviço" icone="calendar" onPress={() => agendar(s.id)}
              descricaoAcessivel={`Agendar ${s.nome}`} />
            <Button titulo="Entrar na fila agora" enfase="secundaria" icone="people" onPress={() => fila.mutate(s.id)}
              carregando={fila.isPending && fila.variables === s.id} desabilitado={fila.isPending}
              descricaoAcessivel={`Entrar agora na fila de ${s.nome}`} />
            {fila.isError && fila.variables === s.id && (
              <Alert tipo="perigo">{mensagemDeErro(fila.error)}</Alert>
            )}
          </Accordion>
        ))}
      </Card>

      <Button titulo="Agendar atendimento" icone="calendar-outline" onPress={() => agendar()} />
    </Tela>
  )
}

function Linha({ icone, children }: { icone: keyof typeof Ionicons.glyphMap; children: React.ReactNode }) {
  return (
    <View style={estilos.linha}>
      <Ionicons name={icone} size={22} color={cores.textoSecundario} />
      <Texto style={estilos.flex}>{children}</Texto>
    </View>
  )
}

const estilos = StyleSheet.create({
  linha: { flexDirection: 'row', gap: espaco.x1, alignItems: 'flex-start' },
  documento: { flexDirection: 'row', gap: espaco.x1, alignItems: 'flex-start', paddingVertical: espaco.meio },
  textoDocumento: { flex: 1, gap: espaco.meio },
  flex: { flex: 1 },
})
