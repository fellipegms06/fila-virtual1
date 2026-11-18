import { ActivityIndicator, StyleSheet, View } from 'react-native'
import { mensagemDeErro } from '../api/cliente'
import { cores, espaco } from '../theme/tokens'
import { Alert } from './Alert'
import { Button } from './Button'
import { Texto } from './Texto'

// Estados comuns das telas que buscam dados na API: carregando e erro com "tentar de novo".

export function Carregando({ texto = 'Carregando...' }: { texto?: string }) {
  return (
    <View style={estilos.centro} accessibilityRole="progressbar" accessibilityLabel={texto}>
      <ActivityIndicator size="large" color={cores.marinho} />
      <Texto variante="secundario">{texto}</Texto>
    </View>
  )
}

export function ErroAoCarregar({ erro, aoTentarDeNovo }: { erro: unknown; aoTentarDeNovo: () => void }) {
  return (
    <View style={estilos.erro}>
      <Alert tipo="perigo">{mensagemDeErro(erro)}</Alert>
      <Button titulo="Tentar de novo" enfase="secundaria" icone="refresh" onPress={aoTentarDeNovo} />
    </View>
  )
}

const estilos = StyleSheet.create({
  centro: { alignItems: 'center', gap: espaco.x1, paddingVertical: espaco.x4 },
  erro: { gap: espaco.x2 },
})
