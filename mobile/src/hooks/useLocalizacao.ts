import * as Location from 'expo-location'
import { useEffect, useState } from 'react'
import type { Coordenadas } from '../api/unidades'

export type EstadoLocalizacao = 'carregando' | 'permitida' | 'negada'

// RF03: pede a localização uma vez para ordenar as unidades por distância.
// Se a pessoa negar (ou o GPS falhar), o app continua funcionando: a lista só não vem ordenada.
// Precisão "Balanced" basta para saber qual CRAS fica mais perto e responde rápido.
export function useLocalizacao() {
  const [estado, setEstado] = useState<EstadoLocalizacao>('carregando')
  const [posicao, setPosicao] = useState<Coordenadas | null>(null)

  useEffect(() => {
    let ativo = true
    ;(async () => {
      try {
        const { status } = await Location.requestForegroundPermissionsAsync()
        if (status !== 'granted') throw new Error('sem permissão')
        const local =
          (await Location.getLastKnownPositionAsync()) ??
          (await Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.Balanced }))
        if (!ativo) return
        setPosicao({ latitude: local.coords.latitude, longitude: local.coords.longitude })
        setEstado('permitida')
      } catch {
        if (ativo) setEstado('negada')
      }
    })()
    return () => {
      ativo = false
    }
  }, [])

  return { estado, posicao }
}
