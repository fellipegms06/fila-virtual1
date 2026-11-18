import { StyleSheet, Text, type TextProps } from 'react-native'
import { cores, ESCALA_MAXIMA_FONTE, fonte } from '../theme/tokens'

type Variante = 'corpo' | 'secundario' | 'titulo' | 'subtitulo' | 'rotulo' | 'destaque'

interface Props extends TextProps {
  variante?: Variante
}

// Texto padrão do app: fonte do sistema, no mínimo 16, cor de texto do DS.
// Acompanha o tamanho de fonte escolhido no celular até 2x (para não quebrar as telas).
export function Texto({ variante = 'corpo', style, ...props }: Props) {
  return (
    <Text
      maxFontSizeMultiplier={ESCALA_MAXIMA_FONTE}
      accessibilityRole={variante === 'titulo' || variante === 'subtitulo' ? 'header' : undefined}
      style={[estilos.base, estilos[variante], style]}
      {...props}
    />
  )
}

const estilos = StyleSheet.create({
  base: { color: cores.texto, fontSize: fonte.base, lineHeight: fonte.base * 1.4 },
  corpo: {},
  secundario: { color: cores.textoSecundario, fontSize: fonte.pequena, lineHeight: fonte.pequena * 1.4 },
  titulo: { fontSize: fonte.titulo, lineHeight: fonte.titulo * 1.25, fontWeight: fonte.pesoNegrito },
  subtitulo: { fontSize: fonte.media, lineHeight: fonte.media * 1.3, fontWeight: fonte.pesoSemiNegrito },
  rotulo: { fontSize: fonte.pequena, fontWeight: fonte.pesoSemiNegrito },
  destaque: { fontSize: fonte.destaque, lineHeight: fonte.destaque * 1.15, fontWeight: fonte.pesoNegrito, color: cores.marinho },
})
