import { Ionicons } from '@expo/vector-icons'
import { useQuery } from '@tanstack/react-query'
import { router } from 'expo-router'
import { Tabs } from 'expo-router/tabs'
import { Pressable, StyleSheet, Text, type ColorValue } from 'react-native'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import { consultarMinhaFila } from '@/api/fila'
import { listarNotificacoes } from '@/api/notificacoes'
import { cores, fonte } from '@/theme/tokens'

type NomeIcone = keyof typeof Ionicons.glyphMap

const icone = (nome: NomeIcone) =>
  function IconeDaAba({ color, size }: { color: ColorValue; size: number }) {
    return <Ionicons name={nome} color={color as string} size={size} />
  }

// Rótulo da aba: a ativa fica em negrito, além da cor (a cor nunca é a única pista).
// Acompanha a fonte do celular só até 1,4x: com 2x os 4 nomes não cabem lado a lado em 360 dp.
function RotuloDaAba({ focused, color, children }: { focused: boolean; color: ColorValue; children: string }) {
  return (
    <Text maxFontSizeMultiplier={1.4} style={[estilos.rotulo, { color }, focused && estilos.rotuloAtivo]}>
      {children}
    </Text>
  )
}

// Esconde só o botão da aba, tirando-o do layout (sem isso, o espaço vazio empurra as 4 abas para a esquerda).
// Não usamos href: null porque, no expo-router 58, ele também bloqueia a rota
// (quem abre /agendamentos ou /perfil é mandado de volta para o Início).
const semBotao = { tabBarItemStyle: { display: 'none' as const } }

// Seta de voltar das telas que abrem por dentro do Início (Meus agendamentos e Perfil) e não aparecem na barra.
function BotaoVoltar() {
  return (
    <Pressable
      onPress={() => router.back()}
      accessibilityRole="button"
      accessibilityLabel="Voltar"
      hitSlop={8}
      style={estilos.voltar}>
      <Ionicons name="arrow-back" size={24} color={cores.branco} />
    </Pressable>
  )
}

// Abas de baixo como no protótipo: Início, Agendar, Fila e Avisos. Rótulos curtos e sempre visíveis
// (ícone sozinho confunde quem tem pouca familiaridade com celular).
// "Meus agendamentos" (agendamentos) e "Perfil" continuam sendo rotas das abas, mas sem botão na barra:
// abrem pelo card "Próximo Agendamento", pelo "Ver todos" e pelo botão redondo do Início.
export default function LayoutAbas() {
  // A barra padrão é baixa demais para rótulos legíveis; somamos a área da barra de gestos do celular.
  const margem = useSafeAreaInsets().bottom
  // Selos amarelos: avisos não lidos e a posição na fila. São as mesmas consultas das telas
  // (mesma queryKey), então os dados vêm do cache e não há busca duplicada.
  const naoLidas = useQuery({ queryKey: ['notificacoes'], queryFn: listarNotificacoes }).data?.filter((n) => !n.lida).length ?? 0
  const fila = useQuery({ queryKey: ['fila', 'minha'], queryFn: consultarMinhaFila }).data
  const posicao = fila?.minhaSenha?.status === 'Aguardando' && fila.posicao ? fila.posicao : null

  return (
    <Tabs
      backBehavior="history"
      screenOptions={{
        headerStyle: { backgroundColor: cores.marinho },
        headerTintColor: cores.branco,
        headerTitleStyle: { fontWeight: '700' },
        tabBarActiveTintColor: cores.marinho,
        tabBarInactiveTintColor: cores.textoSecundario,
        tabBarLabel: RotuloDaAba,
        tabBarBadgeStyle: estilos.selo,
        tabBarStyle: { height: 68 + margem, paddingTop: 6, paddingBottom: 6 + margem },
        sceneStyle: { backgroundColor: cores.fundoApp },
      }}>
      <Tabs.Screen name="index" options={{ title: 'Início', headerShown: false, tabBarIcon: icone('home-outline') }} />
      <Tabs.Screen
        name="agendar"
        options={{ title: 'Agendar', headerShown: false, tabBarIcon: icone('calendar-outline') }}
        listeners={{
          // A mesma lista serve também para "ver o contato/documentos da unidade" (?para=detalhe).
          // Tocar na aba sempre volta ao modo agendamento, mesmo se a aba ficou aberta no outro modo.
          tabPress: (e) => {
            e.preventDefault()
            router.navigate({ pathname: '/agendar', params: { para: 'agendamento' } })
          },
        }}
      />
      <Tabs.Screen
        name="fila"
        options={{
          title: 'Fila',
          headerShown: false,
          tabBarIcon: icone('people-outline'),
          tabBarBadge: posicao ?? undefined,
          tabBarAccessibilityLabel: posicao ? `Fila, você é o ${posicao}º` : 'Fila',
        }}
      />
      <Tabs.Screen
        name="notificacoes"
        options={{
          title: 'Avisos',
          headerShown: false,
          tabBarIcon: icone('notifications-outline'),
          tabBarBadge: naoLidas > 0 ? naoLidas : undefined,
          tabBarAccessibilityLabel: naoLidas > 0 ? `Avisos, ${naoLidas} não lidos` : 'Avisos',
        }}
      />
      <Tabs.Screen name="agendamentos" options={{ title: 'Meus agendamentos', ...semBotao, headerLeft: BotaoVoltar }} />
      <Tabs.Screen name="perfil" options={{ title: 'Meu perfil', ...semBotao, headerLeft: BotaoVoltar }} />
    </Tabs>
  )
}

const estilos = StyleSheet.create({
  rotulo: { fontSize: 14, lineHeight: 18, fontWeight: fonte.pesoMedio, flexShrink: 0 },
  rotuloAtivo: { fontWeight: fonte.pesoNegrito },
  // Selo amarelo do protótipo com número azul-marinho (contraste 11:1).
  selo: { backgroundColor: cores.alerta, color: cores.marinho, fontWeight: fonte.pesoNegrito },
  voltar: { minWidth: 48, minHeight: 48, alignItems: 'center', justifyContent: 'center' },
})

