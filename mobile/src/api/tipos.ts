// Formato das respostas da API (espelham os records do backend, em camelCase).
// Datas com hora chegam como texto ISO em UTC; datas sem hora (DateOnly) chegam como "aaaa-mm-dd".

export type Perfil = 'Cidadao' | 'Atendente' | 'Administrador'

export interface Usuario {
  id: string
  nomeCompleto: string
  cpf: string
  dataNascimento: string
  email: string
  telefone: string | null
  perfil: Perfil
  unidadeCrasId: string | null
}

export interface RespostaAuth {
  token: string
  expiraEm: string
  usuario: Usuario
}

export interface DadosCadastro {
  nomeCompleto: string
  cpf: string
  dataNascimento: string
  email: string
  senha: string
  telefone: string | null
}

export interface DadosPerfil {
  email: string
  telefone: string | null
  senhaAtual: string | null
  novaSenha: string | null
}

// ProblemDetails (RFC 7807) que a API devolve em todo erro.
export interface Problema {
  status?: number
  title?: string
  detail?: string
  errors?: Record<string, string[]>
}

// RF03: item da lista de unidades. distanciaKm só vem quando o app manda a localização.
export interface UnidadeResumo {
  id: string
  nome: string
  endereco: string
  bairro: string
  horarioFuncionamento: string
  telefone: string
  latitude: number
  longitude: number
  distanciaKm: number | null
}

export interface Documento {
  descricao: string
  obrigatorio: boolean
}

// RF05
export interface Servico {
  id: string
  nome: string
  descricao: string
  duracaoMediaMinutos: number
  documentos: Documento[]
}

// RF04
export interface UnidadeDetalhe extends Omit<UnidadeResumo, 'distanciaKm'> {
  servicos: Servico[]
}

export interface Horario {
  id: string
  dataHora: string
  vagasDisponiveis: number
}

export type StatusAtendimento = 'Confirmado' | 'Aguardando' | 'EmAtendimento' | 'Concluido' | 'Cancelado'

// RF07
export interface Agendamento {
  id: string
  unidadeId: string
  unidade: string
  enderecoUnidade: string
  servicoId: string
  servico: string
  dataHora: string
  status: StatusAtendimento
  codigoCheckin: string
  senha: string | null
}

export type StatusSenha = 'Aguardando' | 'EmAtendimento' | 'Concluido' | 'Cancelado'

export interface Senha {
  id: string
  codigo: string
  status: StatusSenha
  prioridade: 'Normal' | 'Preferencial'
  unidadeId: string
  unidade: string
  servicoId: string
  servico: string
  emitidaEm: string
  chamadaEm: string | null
  guiche: string | null
}

// RF09: tudo o que a tela da fila precisa numa resposta só. Fora da fila, minhaSenha vem nula.
export interface MinhaFila {
  minhaSenha: Senha | null
  posicao: number | null // 1 = é o próximo; 0 = já foi chamado
  pessoasAFrente: number | null
  tempoEstimadoMinutos: number | null
  senhaChamadaAgora: string | null
  guicheChamadaAgora: string | null
}

export type TipoNotificacao = 'AgendamentoConfirmado' | 'VezProxima' | 'SenhaChamada' | 'AlteracaoNaFila' | 'ImprevistoNaUnidade'

// RF10
export interface Notificacao {
  id: string
  titulo: string
  mensagem: string
  tipo: TipoNotificacao
  lida: boolean
  criadaEm: string
}
