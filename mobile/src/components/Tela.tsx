import type { ReactNode } from 'react'
import { KeyboardAvoidingView, Platform, RefreshControl, ScrollView, StyleSheet, View } from 'react-native'
import { SafeAreaView, type Edge } from 'react-native-safe-area-context'
import { cores, espaco } from '../theme/tokens'
import { Texto } from './Texto'

interface Props {
  titulo?: string
  subtitulo?: string
  // Cabeçalho azul-marinho (CabecalhoMarinho). Rola junto com o conteúdo, como no protótipo do Início.
  cabecalho?: ReactNode
  children: ReactNode
  // Puxar para atualizar (listas que vêm da API).
  atualizando?: boolean
  aoAtualizar?: () => void
  // Telas dentro das abas já têm cabeçalho próprio; só precisam da margem de baixo/lados.
  bordas?: Edge[]
}

// Moldura padrão das telas: área segura (entalhe, barra de gestos), rolagem, teclado sem cobrir campos
// e conteúdo limitado a 600 dp de largura, para não esticar demais em tablets.
export function Tela({ titulo, subtitulo, cabecalho, children, atualizando, aoAtualizar, bordas = ['left', 'right'] }: Props) {
  return (
    <SafeAreaView style={estilos.raiz} edges={bordas}>
      <KeyboardAvoidingView style={estilos.raiz} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <ScrollView
          contentContainerStyle={estilos.rolagem}
          keyboardShouldPersistTaps="handled"
          refreshControl={
            aoAtualizar ? <RefreshControl refreshing={!!atualizando} onRefresh={aoAtualizar} colors={[cores.marinho]} /> : undefined
          }>
          {cabecalho}
          <View style={estilos.conteudo}>
            {titulo && <Texto variante="titulo">{titulo}</Texto>}
            {subtitulo && <Texto variante="secundario">{subtitulo}</Texto>}
            {children}
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  )
}

const estilos = StyleSheet.create({
  raiz: { flex: 1, backgroundColor: cores.fundoApp },
  rolagem: { flexGrow: 1, paddingBottom: espaco.x5 },
  conteudo: { width: '100%', maxWidth: 600, alignSelf: 'center', gap: espaco.x2, padding: espaco.x2 },
})
