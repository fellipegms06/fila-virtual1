import { StyleSheet, View } from 'react-native'
import { cores, espaco, fonte, raio } from '../theme/tokens'
import { Texto } from './Texto'

export type TipoTag = 'info' | 'sucesso' | 'alerta' | 'perigo' | 'neutro'

// Etiqueta de status do GovBR-DS (br-tag) no tom suave do protótipo ("✓ Confirmado" verde claro).
// A cor nunca é a única pista: o texto sempre diz o status.
export function StatusTag({ texto, tipo = 'neutro' }: { texto: string; tipo?: TipoTag }) {
  const { fundo, cor, borda } = paleta[tipo]
  return (
    <View style={[estilos.tag, { backgroundColor: fundo, borderColor: borda }]} accessibilityLabel={`Situação: ${texto}`}>
      <Texto style={[estilos.texto, { color: cor }]}>{texto}</Texto>
    </View>
  )
}

// Pares fundo/texto com contraste de pelo menos 4,5:1.
const paleta: Record<TipoTag, { fundo: string; cor: string; borda: string }> = {
  info: { fundo: cores.infoFundo, cor: cores.primariaEscura, borda: cores.infoBorda },
  sucesso: { fundo: cores.sucessoFundo, cor: cores.sucessoTexto, borda: cores.sucessoBorda },
  alerta: { fundo: cores.alertaFundo, cor: cores.texto, borda: cores.alerta },
  perigo: { fundo: cores.perigoFundo, cor: cores.perigoTexto, borda: cores.perigoBorda },
  neutro: { fundo: cores.fundoCinza, cor: cores.texto, borda: cores.cinzaClaro },
}

const estilos = StyleSheet.create({
  tag: {
    alignSelf: 'flex-start',
    borderRadius: raio.pilula,
    borderWidth: 1,
    paddingHorizontal: espaco.x1 + espaco.meio,
    paddingVertical: 2,
  },
  texto: { fontSize: fonte.pequena, fontWeight: fonte.pesoSemiNegrito },
})
