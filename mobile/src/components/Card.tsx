import type { ReactNode } from 'react'
import { Pressable, StyleSheet, View, type StyleProp, type ViewStyle } from 'react-native'
import { cores, espaco, raio, sombraCartao } from '../theme/tokens'

// padrao: branco com sombra. As outras variantes são as faixas coloridas do protótipo
// (avisos por tipo, "Notificações ativas", linha "Em atendimento").
export type VarianteCard = 'padrao' | 'sucesso' | 'info' | 'pendencia' | 'destaque'

interface Props {
  children: ReactNode
  onPress?: () => void // cartão inteiro tocável (ex.: item da lista de unidades)
  descricaoAcessivel?: string
  variante?: VarianteCard
  style?: StyleProp<ViewStyle>
}

// Cartão do GovBR-DS (br-card) no visual do protótipo: cantos de 12, sombra leve no lugar da borda cinza.
export function Card({ children, onPress, descricaoAcessivel, variante = 'padrao', style }: Props) {
  const visual = [estilos.cartao, estilos[variante], style]
  if (!onPress) return <View style={visual}>{children}</View>

  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="button"
      accessibilityLabel={descricaoAcessivel}
      style={({ pressed }) => [visual, pressed && estilos.pressionado]}>
      {children}
    </Pressable>
  )
}

const estilos = StyleSheet.create({
  cartao: {
    backgroundColor: cores.branco,
    borderRadius: raio.cartao,
    borderWidth: 1,
    borderColor: 'transparent',
    padding: espaco.x2,
    gap: espaco.x1,
  },
  padrao: { boxShadow: sombraCartao },
  sucesso: { backgroundColor: cores.sucessoFundo, borderColor: cores.sucessoBorda },
  info: { backgroundColor: cores.infoFundo, borderColor: cores.infoBorda },
  pendencia: { backgroundColor: cores.fundoSuave, borderColor: cores.cinzaClaro },
  destaque: { boxShadow: sombraCartao, borderColor: cores.marinho, borderWidth: 2 },
  pressionado: { backgroundColor: cores.azulFundo, borderColor: cores.marinho },
})
