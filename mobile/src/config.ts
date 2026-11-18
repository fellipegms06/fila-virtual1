import { Platform } from 'react-native'

// Endereço da API. Pode ser trocado no arquivo .env (veja .env.example) sem mexer no código.
// Sem .env: o emulador Android enxerga o computador pelo IP especial 10.0.2.2;
// no navegador (expo start --web) e no simulador iOS, localhost funciona.
// Num celular de verdade, use o IP do computador na rede Wi-Fi (ex.: http://192.168.0.10:5171).
const padrao = Platform.OS === 'android' ? 'http://10.0.2.2:5171' : 'http://localhost:5171'

export const API_URL = (process.env.EXPO_PUBLIC_API_URL || padrao).replace(/\/$/, '')
