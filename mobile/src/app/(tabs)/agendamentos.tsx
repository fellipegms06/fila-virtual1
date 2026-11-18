import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { router } from 'expo-router'
import { useState } from 'react'
import { StyleSheet, View } from 'react-native'
import QRCode from 'react-native-qrcode-svg'
import { cancelarAgendamento, listarMeusAgendamentos } from '@/api/agendamentos'
import { mensagemDeErro } from '@/api/cliente'
import type { Agendamento } from '@/api/tipos'
import { Alert } from '@/components/Alert'
import { Button } from '@/components/Button'
import { Card } from '@/components/Card'
import { Carregando, ErroAoCarregar } from '@/components/Estados'
import { StatusTag } from '@/components/StatusTag'
import { Tela } from '@/components/Tela'
import { Texto } from '@/components/Texto'
import { cores, espaco } from '@/theme/tokens'
import { separarAgendamentos, STATUS_AGENDAMENTO } from '@/utils/agenda'
import { dataPorExtenso, hora } from '@/utils/formatar'
import { textoCidadao } from '@/utils/servicos'

// RF07: meus agendamentos, com status, QR Code do check-in e botão de cancelar.
export default function TelaAgendamentos() {
  const agendamentos = useQuery({ queryKey: ['agendamentos'], queryFn: listarMeusAgendamentos })

  if (agendamentos.isPending) return <Tela><Carregando /></Tela>
  if (agendamentos.isError)
    return <Tela><ErroAoCarregar erro={agendamentos.error} aoTentarDeNovo={() => void agendamentos.refetch()} /></Tela>

  const { proximos, historico } = separarAgendamentos(agendamentos.data)

  return (
    <Tela atualizando={agendamentos.isRefetching} aoAtualizar={() => void agendamentos.refetch()}>
      {/* O título "Meus agendamentos" já está no cabeçalho azul-marinho (veja (tabs)/_layout.tsx). */}
      {proximos.length === 0 ? (
        <Card>
          <Texto>Você não tem atendimento marcado.</Texto>
          <Button titulo="Agendar atendimento" icone="calendar" onPress={() => router.navigate('/')} />
        </Card>
      ) : (
        proximos.map((a) => <CartaoAgendamento key={a.id} agendamento={a} />)
      )}

      {historico.length > 0 && (
        <>
          <Texto variante="subtitulo">Anteriores</Texto>
          {historico.map((a) => <CartaoAgendamento key={a.id} agendamento={a} />)}
        </>
      )}
    </Tela>
  )
}

function CartaoAgendamento({ agendamento: a }: { agendamento: Agendamento }) {
  const queryClient = useQueryClient()
  const [confirmando, setConfirmando] = useState(false)
  const status = STATUS_AGENDAMENTO[a.status]

  const cancelamento = useMutation({
    mutationFn: () => cancelarAgendamento(a.id),
    onSuccess: () => void queryClient.invalidateQueries({ queryKey: ['agendamentos'] }),
    onSettled: () => setConfirmando(false),
  })

  return (
    <Card>
      <StatusTag texto={status.texto} tipo={status.tipo} />
      <Texto variante="subtitulo">{textoCidadao(a.servico)}</Texto>
      {textoCidadao(a.servico) !== a.servico && <Texto variante="secundario">{a.servico}</Texto>}
      <Texto>{dataPorExtenso(a.dataHora)}, às {hora(a.dataHora)}</Texto>
      <Texto variante="secundario">{a.unidade} · {a.enderecoUnidade}</Texto>

      {a.status === 'Confirmado' && (
        <View style={estilos.checkin}>
          <Texto variante="rotulo">Mostre na recepção para fazer o check-in</Texto>
          {/* O QR Code carrega só o código do check-in (nada de nome ou CPF). */}
          <View accessible accessibilityLabel={`QR Code do check-in, código ${a.codigoCheckin.split('').join(' ')}`}>
            <QRCode value={a.codigoCheckin} size={160} color={cores.texto} backgroundColor={cores.branco} />
          </View>
          <Texto variante="destaque" style={estilos.codigo} importantForAccessibility="no" accessibilityElementsHidden>
            {a.codigoCheckin}
          </Texto>
        </View>
      )}

      {a.senha && (a.status === 'Aguardando' || a.status === 'EmAtendimento') && (
        <>
          <Texto>Sua senha: <Texto style={estilos.senha}>{a.senha}</Texto></Texto>
          <Button titulo="Acompanhar a fila" enfase="secundaria" icone="people" onPress={() => router.navigate('/fila')} />
        </>
      )}

      {cancelamento.isError && <Alert tipo="perigo">{mensagemDeErro(cancelamento.error)}</Alert>}

      {a.status === 'Confirmado' &&
        (confirmando ? (
          <View style={estilos.confirmacao}>
            <Texto>Cancelar este agendamento? A vaga fica livre para outra pessoa.</Texto>
            <Button titulo="Sim, cancelar" enfase="perigo" onPress={() => cancelamento.mutate()} carregando={cancelamento.isPending} />
            <Button titulo="Manter agendamento" enfase="terciaria" onPress={() => setConfirmando(false)} />
          </View>
        ) : (
          <Button titulo="Cancelar agendamento" enfase="secundaria" icone="close-circle-outline"
            descricaoAcessivel={`Cancelar agendamento de ${a.servico} em ${dataPorExtenso(a.dataHora)}, às ${hora(a.dataHora)}`}
            onPress={() => setConfirmando(true)} />
        ))}
    </Card>
  )
}

const estilos = StyleSheet.create({
  checkin: { alignItems: 'center', gap: espaco.x1, paddingVertical: espaco.x1 },
  codigo: { letterSpacing: 4 },
  senha: { fontWeight: '700', color: cores.marinho },
  confirmacao: { gap: espaco.x1 },
})
