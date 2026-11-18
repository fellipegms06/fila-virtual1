// O protótipo mostra os serviços na linguagem do cidadão ("Preciso atualizar meus dados") em vez do nome
// técnico do CadÚnico. A API devolve o nome oficial (seed do backend); aqui traduzimos só para exibição.
// Nome desconhecido (serviço criado depois) aparece como veio: nunca some da lista.
const TEXTO_CIDADAO: Record<string, string> = {
  'Inscrição no CadÚnico': 'Quero me cadastrar pela primeira vez',
  'Atualização cadastral': 'Preciso atualizar meus dados',
  'Revisão cadastral': 'Fui convocado(a) para revisar o cadastro',
  'Atualização de endereço': 'Mudei de endereço',
  'Inclusão de membro da família': 'Quero incluir alguém da família',
}

export function textoCidadao(nomeServico: string): string {
  return TEXTO_CIDADAO[nomeServico.trim()] ?? nomeServico
}
