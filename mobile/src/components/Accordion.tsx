import { Ionicons } from '@expo/vector-icons'
import { useState, type ReactNode } from 'react'
import { Pressable, StyleSheet, View } from 'react-native'
import { ALVO_TOQUE, cores, espaco } from '../theme/tokens'
import { Texto } from './Texto'

interface Props {
  titulo: string
  subtitulo?: string
  children: ReactNode
  inicialmenteAberto?: boolean
}

// Acordeão do GovBR-DS (br-accordion): título tocável que abre e fecha o conteúdo.
// Usado no checklist de documentos de cada serviço (RF05), para a tela não ficar comprida demais.
export function Accordion({ titulo, subtitulo, children, inicialmenteAberto = false }: Props) {
  const [aberto, setAberto] = useState(inicialmenteAberto)

  return (
    <View style={estilos.item}>
      <Pressable
        onPress={() => setAberto((a) => !a)}
        accessibilityRole="button"
        accessibilityState={{ expanded: aberto }}
        accessibilityLabel={subtitulo ? `${titulo}. ${subtitulo}` : titulo}
        accessibilityHint={aberto ? 'Toque para fechar' : 'Toque para ver os detalhes'}
        style={({ pressed }) => [estilos.cabecalho, pressed && estilos.pressionado]}>
        <View style={estilos.textos}>
          <Texto variante="rotulo" style={estilos.titulo}>{titulo}</Texto>
          {subtitulo && <Texto variante="secundario">{subtitulo}</Texto>}
        </View>
        <Ionicons name={aberto ? 'chevron-up' : 'chevron-down'} size={24} color={cores.marinho} />
      </Pressable>
      {aberto && <View style={estilos.conteudo}>{children}</View>}
    </View>
  )
}

const estilos = StyleSheet.create({
  item: { borderBottomWidth: 1, borderBottomColor: cores.divisor },
  cabecalho: {
    flexDirection: 'row',
    alignItems: 'center',
    minHeight: ALVO_TOQUE,
    paddingVertical: espaco.x1 + espaco.meio,
    gap: espaco.x1,
  },
  pressionado: { backgroundColor: cores.azulFundo },
  textos: { flex: 1, gap: 2 },
  titulo: { color: cores.marinho, fontSize: 18, fontWeight: '700' },
  conteudo: { paddingBottom: espaco.x2, gap: espaco.x1 },
})
