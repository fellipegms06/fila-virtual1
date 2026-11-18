import { StyleSheet, View } from 'react-native'
import type { EstadoConexao } from '../realtime/TempoReal'
import { cores, espaco } from '../theme/tokens'
import { Texto } from './Texto'

const TEXTOS: Record<EstadoConexao, { texto: string; cor: string }> = {
  conectado: { texto: 'Atualizando sozinho', cor: cores.sucesso },
  conectando: { texto: 'Conectando...', cor: cores.textoSecundario },
  reconectando: { texto: 'Reconectando...', cor: cores.textoSecundario },
  desconectado: { texto: 'Sem atualização automática. Puxe a tela para baixo para atualizar.', cor: cores.perigoTexto },
}

// Mostra se a tela está recebendo as mudanças da fila em tempo real (a bolinha não é a única pista: tem texto).
export function IndicadorConexao({ estado }: { estado: EstadoConexao }) {
  const { texto, cor } = TEXTOS[estado]
  return (
    <View style={estilos.linha} accessibilityLiveRegion="polite">
      <View style={[estilos.bolinha, { backgroundColor: cor }]} />
      <Texto variante="secundario" style={{ color: cor, flex: 1 }}>{texto}</Texto>
    </View>
  )
}

const estilos = StyleSheet.create({
  linha: { flexDirection: 'row', alignItems: 'center', gap: espaco.x1 },
  bolinha: { width: 10, height: 10, borderRadius: 5 },
})
