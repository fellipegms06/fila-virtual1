import * as SecureStore from 'expo-secure-store'

// No celular, o token fica no armazenamento seguro do sistema (Keystore no Android, Keychain no iOS),
// criptografado e acessível só por este app. Nada de AsyncStorage, que é texto aberto.
// No navegador (usado só para desenvolvimento) o Metro escolhe armazenamento.web.ts no lugar deste.

export const ler = (chave: string) => SecureStore.getItemAsync(chave)
export const gravar = (chave: string, valor: string) => SecureStore.setItemAsync(chave, valor)
export const apagar = (chave: string) => SecureStore.deleteItemAsync(chave)
