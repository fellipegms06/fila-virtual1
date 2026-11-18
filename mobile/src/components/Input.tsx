import { Ionicons } from '@expo/vector-icons'
import { useState, type ComponentRef, type Ref } from 'react'
import { Platform, Pressable, StyleSheet, TextInput, View, type TextInputProps } from 'react-native'
import { ALVO_TOQUE, cores, ESCALA_MAXIMA_FONTE, espaco, fonte, raio } from '../theme/tokens'
import { Texto } from './Texto'

interface Props extends Omit<TextInputProps, 'style'> {
  rotulo: string
  erro?: string
  ajuda?: string // dica curta embaixo do campo (ex.: "Só números")
  senha?: boolean // mostra o botão de ver/esconder a senha
  ref?: Ref<ComponentRef<typeof TextInput>> // o react-hook-form usa para focar o campo com erro
}

// Campo de texto do GovBR-DS (br-input): rótulo SEMPRE acima (nunca só placeholder, que some ao digitar),
// borda cinza, borda azul no foco e mensagem de erro vermelha embaixo, com ícone.
export function Input({ rotulo, erro, ajuda, senha, ref, ...props }: Props) {
  const [focado, setFocado] = useState(false)
  const [senhaVisivel, setSenhaVisivel] = useState(false)

  return (
    <View style={estilos.grupo}>
      <Texto variante="rotulo" nativeID={`rotulo-${rotulo}`}>{rotulo}</Texto>
      <View style={[estilos.caixa, focado && estilos.caixaFocada, !!erro && estilos.caixaErro]}>
        <TextInput
          ref={ref}
          accessibilityLabel={rotulo}
          accessibilityHint={erro ?? ajuda}
          aria-invalid={!!erro}
          maxFontSizeMultiplier={ESCALA_MAXIMA_FONTE}
          placeholderTextColor={cores.textoSecundario}
          secureTextEntry={senha && !senhaVisivel}
          autoCapitalize={senha ? 'none' : props.autoCapitalize}
          style={estilos.campo}
          {...props}
          onFocus={(e) => {
            setFocado(true)
            props.onFocus?.(e)
          }}
          onBlur={(e) => {
            setFocado(false)
            props.onBlur?.(e)
          }}
        />
        {senha && (
          <Pressable
            onPress={() => setSenhaVisivel((v) => !v)}
            accessibilityRole="button"
            accessibilityLabel={senhaVisivel ? 'Esconder senha' : 'Mostrar senha'}
            style={estilos.olho}
            hitSlop={8}>
            <Ionicons name={senhaVisivel ? 'eye-off-outline' : 'eye-outline'} size={24} color={cores.primaria} />
          </Pressable>
        )}
      </View>
      {erro ? (
        <View style={estilos.linhaErro} accessibilityLiveRegion="polite">
          <Ionicons name="close-circle" size={20} color={cores.perigoTexto} />
          <Texto style={estilos.textoErro}>{erro}</Texto>
        </View>
      ) : (
        ajuda && <Texto variante="secundario">{ajuda}</Texto>
      )}
    </View>
  )
}

const estilos = StyleSheet.create({
  grupo: { gap: espaco.meio },
  caixa: {
    flexDirection: 'row',
    alignItems: 'center',
    minHeight: ALVO_TOQUE,
    borderWidth: 1,
    borderColor: cores.borda,
    borderRadius: raio.medio,
    backgroundColor: cores.branco,
  },
  caixaFocada: { borderColor: cores.primaria, borderWidth: 2 },
  caixaErro: { borderColor: cores.perigoTexto, borderWidth: 2 },
  campo: {
    flex: 1, fontSize: fonte.base, color: cores.texto, paddingHorizontal: espaco.x2, paddingVertical: espaco.x1,
    // No navegador, o contorno padrão duplicaria a borda azul de foco da caixa.
    ...(Platform.OS === 'web' ? { outlineWidth: 0 } : {}),
  },
  olho: { width: ALVO_TOQUE, height: ALVO_TOQUE, alignItems: 'center', justifyContent: 'center' },
  linhaErro: { flexDirection: 'row', alignItems: 'center', gap: espaco.meio },
  textoErro: { color: cores.perigoTexto, fontSize: fonte.pequena, flexShrink: 1 },
})
