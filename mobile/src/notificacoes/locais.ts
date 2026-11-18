import {
  AndroidImportance,
  getPermissionsAsync,
  requestPermissionsAsync,
  scheduleNotificationAsync,
  setNotificationChannelAsync,
  setNotificationHandler,
} from 'expo-notifications'
import { Platform } from 'react-native'

// RF10: aviso no celular (na barra de notificações) quando chega um evento da API pelo SignalR.
// É notificação LOCAL: o próprio app cria quando recebe o evento. Funciona com o app aberto ou em segundo
// plano recente; com o app fechado, quem entregaria é o push (FCM), que ficou como opcional no roteiro.
// Quando a pessoa abre o app, a lista em "Avisos" mostra tudo, porque a API grava cada notificação.

const CANAL = 'fila'

// Chamada uma vez depois do login (pelo TempoRealProvider).
export async function prepararNotificacoes(): Promise<boolean> {
  try {
    // Mostra a notificação mesmo com o app aberto (por padrão o sistema esconde).
    setNotificationHandler({
      handleNotification: async () => ({
        shouldShowBanner: true,
        shouldShowList: true,
        shouldPlaySound: true,
        shouldSetBadge: false,
      }),
    })
    if (Platform.OS === 'android') {
      // Android exige um canal; importância alta = aparece no topo da tela e toca som.
      await setNotificationChannelAsync(CANAL, {
        name: 'Fila e agendamentos',
        importance: AndroidImportance.HIGH,
      })
    }
    const atual = await getPermissionsAsync()
    if (atual.granted) return true
    return (await requestPermissionsAsync()).granted
  } catch {
    return false // sem permissão o app funciona igual; só não aparece aviso na barra
  }
}

export async function mostrarNotificacao(titulo: string, mensagem: string) {
  try {
    await scheduleNotificationAsync({
      content: { title: titulo, body: mensagem },
      trigger: Platform.OS === 'android' ? { channelId: CANAL } : null, // null = mostrar agora
    })
  } catch {
    // falha ao mostrar não pode derrubar a tela; o aviso continua na lista do app
  }
}
