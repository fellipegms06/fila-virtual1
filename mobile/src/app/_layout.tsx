import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { Stack } from 'expo-router'
import * as SplashScreen from 'expo-splash-screen'
import { StatusBar } from 'expo-status-bar'
import { useEffect, useState } from 'react'
import { AuthProvider, useAuth } from '@/auth/AuthContext'
import { TempoRealProvider } from '@/realtime/TempoReal'
import { opcoesCabecalho } from '@/theme/navegacao'

// Mantém a tela de abertura até sabermos se há sessão salva (evita piscar a tela de login).
SplashScreen.preventAutoHideAsync()

function Navegacao() {
  const { carregando, sessao } = useAuth()

  useEffect(() => {
    if (!carregando) SplashScreen.hideAsync()
  }, [carregando])

  if (carregando) return null

  // Rotas protegidas: sem sessão só existem login e cadastro; com sessão, só as abas e telas internas.
  // Quando a sessão muda (entrou/saiu), o Expo Router leva a pessoa para a primeira rota permitida.
  return (
    <Stack screenOptions={opcoesCabecalho}>
      <Stack.Protected guard={!!sessao}>
        <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
        <Stack.Screen name="unidade/[id]" options={{ title: 'Unidade' }} />
        <Stack.Screen name="agendar/[unidadeId]" options={{ title: 'Agendar Atendimento' }} />
      </Stack.Protected>
      <Stack.Protected guard={!sessao}>
        <Stack.Screen name="login" options={{ headerShown: false, title: 'Entrar' }} />
        <Stack.Screen name="cadastro" options={{ title: 'Criar conta' }} />
      </Stack.Protected>
    </Stack>
  )
}

export default function RootLayout() {
  const [queryClient] = useState(
    () => new QueryClient({ defaultOptions: { queries: { retry: 1, staleTime: 30_000 } } }),
  )

  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <TempoRealProvider>
          <StatusBar style="light" />
          <Navegacao />
        </TempoRealProvider>
      </AuthProvider>
    </QueryClientProvider>
  )
}
