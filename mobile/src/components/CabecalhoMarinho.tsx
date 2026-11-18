import type { ReactNode } from 'react'
import { StyleSheet, View } from 'react-native'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import { cores, espaco, fonte } from '../theme/tokens'
import { Texto } from './Texto'

interface Props {
  titulo?: string
  subtitulo?: string
  // Logo em texto "Fila Virtual" ("Fila" em amarelo e "Virtual" em verde, como no protótipo).
  // Não usamos brasão nem logotipo do gov.br.
  logo?: boolean
  // Encaixe à direita do título (ex.: botão redondo do perfil no Início).
  direita?: ReactNode
  // Conteúdo livre abaixo do título (ex.: saudação, nome e CPF no Início).
  children?: ReactNode
  // Espaço extra embaixo para um cartão "subir" por cima do cabeçalho (card da fila no Início).
  sobreposicao?: number
}

// Cabeçalho azul-marinho das abas, como nos prints do protótipo. Fica fora da rolagem e
// respeita a área segura do topo (entalhe / barra de status), já que as abas não usam o cabeçalho nativo.
export function CabecalhoMarinho({ titulo, subtitulo, logo, direita, children, sobreposicao = 0 }: Props) {
  const topo = useSafeAreaInsets().top

  return (
    <View style={[estilos.fundo, { paddingTop: topo + espaco.x2, paddingBottom: espaco.x2 + sobreposicao }]}>
      <View style={estilos.conteudo}>
        <View style={estilos.linha}>
          <View style={estilos.textos}>
            {logo && <Logo />}
            {titulo && (
              <Texto variante="titulo" style={estilos.titulo}>
                {titulo}
              </Texto>
            )}
            {subtitulo && <Texto style={estilos.subtitulo}>{subtitulo}</Texto>}
            {children}
          </View>
          {direita}
        </View>
      </View>
    </View>
  )
}

// Cada palavra é um Texto aninhado com a sua cor. O estilo base (tamanho e negrito) é repetido em cada um
// porque o componente Texto aplica a cor padrão do DS em toda instância, inclusive nas aninhadas.
// O amarelo (token de alerta) só tem contraste sobre o azul-marinho; no fundo branco não passaria no AA.
export function Logo() {
  return (
    <Texto style={estilos.logo} accessibilityLabel="Fila Virtual">
      <Texto style={[estilos.logo, estilos.logoAmarelo]}>Fila</Texto>{' '}
      <Texto style={[estilos.logo, estilos.logoVerde]}>Virtual</Texto>
    </Texto>
  )
}

const estilos = StyleSheet.create({
  fundo: { backgroundColor: cores.marinho, paddingHorizontal: espaco.x2 },
  conteudo: { width: '100%', maxWidth: 600, alignSelf: 'center' },
  linha: { flexDirection: 'row', alignItems: 'flex-start', gap: espaco.x2 },
  textos: { flex: 1, gap: espaco.meio },
  logo: { color: cores.branco, fontSize: fonte.base, fontWeight: fonte.pesoNegrito },
  logoAmarelo: { color: cores.alerta },
  logoVerde: { color: cores.verdeLogo },
  titulo: { color: cores.branco },
  subtitulo: { color: cores.textoSobreMarinho, fontSize: fonte.pequena },
})
