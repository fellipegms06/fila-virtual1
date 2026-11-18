import { Ionicons } from '@expo/vector-icons'
import { ActivityIndicator, Pressable, StyleSheet, View } from 'react-native'
import { ALVO_TOQUE, cores, espaco, fonte, raio } from '../theme/tokens'
import { Texto } from './Texto'

// perigoSuave: fundo vermelho claro com borda vermelha (botão "Sair da fila" do protótipo).
type Enfase = 'primaria' | 'secundaria' | 'terciaria' | 'perigo' | 'perigoSuave'

interface Props {
  titulo: string
  onPress: () => void
  enfase?: Enfase
  icone?: keyof typeof Ionicons.glyphMap
  // Ícone depois do texto (ex.: "Continuar →").
  iconeDepois?: keyof typeof Ionicons.glyphMap
  carregando?: boolean
  desabilitado?: boolean
  // Texto lido pelo leitor de tela quando o título sozinho não explica (ex.: "Cancelar agendamento das 9h").
  descricaoAcessivel?: string
}

// Botão do GovBR-DS (br-button) no visual do protótipo: principal azul-marinho cheio, cantos de 8.
// Altura mínima de 48 dp (alvo de toque do RNF01) e estado de carregando que impede toque duplo.
export function Button({ titulo, onPress, enfase = 'primaria', icone, iconeDepois, carregando, desabilitado, descricaoAcessivel }: Props) {
  const inativo = desabilitado || carregando
  const corTexto = COR_TEXTO[enfase]
  const iconeOculto = { accessibilityElementsHidden: true, importantForAccessibility: 'no' as const }

  return (
    <Pressable
      onPress={onPress}
      disabled={inativo}
      accessibilityRole="button"
      accessibilityLabel={descricaoAcessivel ?? titulo}
      accessibilityState={{ disabled: !!inativo, busy: !!carregando }}
      style={({ pressed }) => [
        estilos.base,
        estilos[enfase],
        pressed && !inativo && estilosPressionado[enfase],
        inativo && estilos.inativo,
      ]}>
      <View style={estilos.conteudo}>
        {carregando ? (
          <ActivityIndicator color={corTexto} />
        ) : (
          icone && <Ionicons name={icone} size={22} color={corTexto} {...iconeOculto} />
        )}
        <Texto style={[estilos.texto, { color: corTexto }]}>{titulo}</Texto>
        {iconeDepois && !carregando && <Ionicons name={iconeDepois} size={22} color={corTexto} {...iconeOculto} />}
      </View>
    </Pressable>
  )
}

const COR_TEXTO: Record<Enfase, string> = {
  primaria: cores.branco,
  secundaria: cores.marinho,
  terciaria: cores.marinho,
  perigo: cores.branco,
  perigoSuave: cores.perigoTexto,
}

const estilos = StyleSheet.create({
  base: {
    minHeight: ALVO_TOQUE + 4,
    borderRadius: raio.medio,
    paddingHorizontal: espaco.x3,
    paddingVertical: espaco.x1,
    justifyContent: 'center',
  },
  conteudo: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: espaco.x1 },
  texto: { fontSize: fonte.base, fontWeight: fonte.pesoNegrito, textAlign: 'center' },
  primaria: { backgroundColor: cores.marinho },
  secundaria: { backgroundColor: cores.branco, borderWidth: 1, borderColor: cores.marinho },
  terciaria: { backgroundColor: 'transparent' },
  perigo: { backgroundColor: cores.perigoTexto },
  perigoSuave: { backgroundColor: cores.perigoFundo, borderWidth: 1, borderColor: cores.perigoBorda },
  inativo: { opacity: 0.45 },
})

// Retorno visual ao tocar, de acordo com a ênfase.
const estilosPressionado = StyleSheet.create({
  primaria: { backgroundColor: cores.marinhoClaro },
  secundaria: { backgroundColor: cores.azulFundo },
  terciaria: { backgroundColor: cores.azulFundo },
  perigo: { opacity: 0.85 },
  perigoSuave: { backgroundColor: cores.cinzaClaro },
})
