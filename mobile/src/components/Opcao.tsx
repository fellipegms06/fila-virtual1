import { Ionicons } from '@expo/vector-icons'
import { Pressable, StyleSheet, View } from 'react-native'
import { ALVO_TOQUE, cores, espaco, fonte, raio } from '../theme/tokens'
import { Texto } from './Texto'

interface Props {
  titulo: string
  detalhe?: string
  onPress: () => void
  descricaoAcessivel?: string
  // linha: item de lista com seta (serviço). chip: botão pequeno de grade (horário, 4 por linha).
  variante?: 'linha' | 'chip'
  selecionada?: boolean
}

// Opção tocável dos passos do agendamento. A selecionada ganha borda azul-marinho (linha)
// ou fundo azul-marinho (chip); o leitor de tela anuncia "selecionado".
export function Opcao({ titulo, detalhe, onPress, descricaoAcessivel, variante = 'linha', selecionada = false }: Props) {
  const chip = variante === 'chip'
  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="button"
      accessibilityState={{ selected: selecionada }}
      accessibilityLabel={descricaoAcessivel ?? (detalhe ? `${titulo}, ${detalhe}` : titulo)}
      style={({ pressed }) => [
        estilos.base,
        chip ? estilos.chip : estilos.linha,
        selecionada && (chip ? estilos.chipSelecionado : estilos.linhaSelecionada),
        pressed && !selecionada && estilos.pressionado,
      ]}>
      {chip ? (
        <Texto style={[estilos.tituloChip, selecionada && estilos.tituloChipSelecionado]}>{titulo}</Texto>
      ) : (
        <>
          <View style={estilos.textos}>
            <Texto style={estilos.titulo}>{titulo}</Texto>
            {detalhe && <Texto variante="secundario">{detalhe}</Texto>}
          </View>
          <Ionicons name="chevron-forward" size={22} color={cores.marinho} accessibilityElementsHidden importantForAccessibility="no" />
        </>
      )}
    </Pressable>
  )
}

const estilos = StyleSheet.create({
  base: { minHeight: ALVO_TOQUE, borderWidth: 1, borderColor: cores.divisor, borderRadius: raio.medio, backgroundColor: cores.branco },
  linha: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: espaco.x1,
    paddingHorizontal: espaco.x2,
    paddingVertical: espaco.x1 + espaco.meio,
  },
  linhaSelecionada: { borderColor: cores.marinho, borderWidth: 2 },
  // 4 por linha em 360 dp: 22% + espaços de 8.
  chip: { flexBasis: '22%', flexGrow: 1, alignItems: 'center', justifyContent: 'center', paddingVertical: espaco.x1 },
  chipSelecionado: { backgroundColor: cores.marinho, borderColor: cores.marinho },
  pressionado: { backgroundColor: cores.azulFundo },
  textos: { flex: 1, gap: 2 },
  titulo: { color: cores.marinho, fontWeight: fonte.pesoSemiNegrito },
  tituloChip: { color: cores.marinho, fontWeight: fonte.pesoNegrito, fontSize: fonte.pequena },
  tituloChipSelecionado: { color: cores.branco },
})
