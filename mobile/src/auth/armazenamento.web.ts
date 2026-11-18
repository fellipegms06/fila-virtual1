// Versão para o navegador (expo start --web), usada só em desenvolvimento: o expo-secure-store
// não existe na web. sessionStorage: fechar a aba encerra a sessão.

export async function ler(chave: string): Promise<string | null> {
  try {
    return sessionStorage.getItem(chave)
  } catch {
    return null
  }
}

export async function gravar(chave: string, valor: string): Promise<void> {
  try {
    sessionStorage.setItem(chave, valor)
  } catch {
    // navegador sem armazenamento: a sessão vale enquanto a página estiver aberta
  }
}

export async function apagar(chave: string): Promise<void> {
  try {
    sessionStorage.removeItem(chave)
  } catch {
    // ignora
  }
}
