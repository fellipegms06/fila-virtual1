import { Ionicons } from '@expo/vector-icons'
import type { ReactNode } from 'react'
import { StyleSheet, View } from 'react-native'
import { cores, espaco, raio } from '../theme/tokens'
import { Texto } from './Texto'

type Tipo = 'info' | 'sucesso' | 'alerta' | 'perigo'

interface Props {
  tipo?: Tipo
  titulo?: string
  children: ReactNode
}

// Mensagem do GovBR-DS (br-message): faixa colorida com ícone. Erros e sucessos são anunciados
// pelo leitor de tela assim que aparecem (accessibilityLiveRegion / role="alert").
export function Alert({ tipo = 'info', titulo, children }: Props) {
  const { fundo, cor, icone } = visual[tipo]
  return (
    <View
      style={[estilos.caixa, { backgroundColor: fundo, borderLeftColor: cor }]}
      accessibilityRole={tipo === 'perigo' ? 'alert' : undefined}
      accessibilityLiveRegion={tipo === 'perigo' || tipo === 'sucesso' ? 'assertive' : 'polite'}>
      <Ionicons name={icone} size={24} color={cor} accessibilityElementsHidden importantForAccessibility="no" />
      <View style={estilos.textos}>
        {titulo && <Texto variante="rotulo">{titulo}</Texto>}
        {typeof children === 'string' ? <Texto>{children}</Texto> : children}
      </View>
    </View>
  )
}

const visual: Record<Tipo, { fundo: string; cor: string; icone: keyof typeof Ionicons.glyphMap }> = {
  info: { fundo: cores.infoFundo, cor: cores.info, icone: 'information-circle' },
  sucesso: { fundo: cores.sucessoFundo, cor: cores.sucesso, icone: 'checkmark-circle' },
  alerta: { fundo: cores.alertaFundo, cor: cores.texto, icone: 'warning' },
  perigo: { fundo: cores.perigoFundo, cor: cores.perigoTexto, icone: 'close-circle' },
}

const estilos = StyleSheet.create({
  caixa: {
    flexDirection: 'row',
    gap: espaco.x1 + espaco.meio,
    padding: espaco.x2,
    borderRadius: raio.medio,
    borderLeftWidth: 6,
    alignItems: 'flex-start',
  },
  textos: { flex: 1, gap: espaco.meio },
})
