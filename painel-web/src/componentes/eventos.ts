// Lê o valor digitado num campo do GovBR-DS (BrInput, BrTextarea) a partir do evento onInput.
//
// Por que existe: na versão 2.6.0 do @govbr-ds/webcomponents, o arquivo de tipos de cada elemento
// importa as definições de um caminho interno do repositório deles (../../../../packages/...),
// que não vem no pacote publicado. Resultado: o TypeScript não sabe que o elemento tem "value",
// embora ele exista em tempo de execução (é o uso indicado no README do wrapper React).
export function valorDoCampo(evento: { currentTarget: unknown }): string {
  return (evento.currentTarget as { value?: string | null }).value ?? ''
}

// Mesmo problema para "checked" do BrSwitch e do BrCheckbox (evento onChange).
export function marcadoDoCampo(evento: { currentTarget: unknown }): boolean {
  return Boolean((evento.currentTarget as { checked?: boolean }).checked)
}
