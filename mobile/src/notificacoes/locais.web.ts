// No navegador (usado só em desenvolvimento) não há barra de notificações do celular.
// Os avisos continuam aparecendo na aba "Avisos", que é atualizada pelo SignalR.

export async function prepararNotificacoes(): Promise<boolean> {
  return false
}

export async function mostrarNotificacao(_titulo: string, _mensagem: string): Promise<void> {}
