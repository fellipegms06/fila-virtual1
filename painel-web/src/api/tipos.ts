// Tipos espelhando os DTOs da API (backend/src/FilaVirtual.Application/UseCases/**/…Dtos.cs).
// Datas chegam como texto ISO em UTC.

export type Perfil = 'Cidadao' | 'Atendente' | 'Administrador'
export type StatusAtendimento = 'Confirmado' | 'Aguardando' | 'EmAtendimento' | 'Concluido' | 'Cancelado'
export type Prioridade = 'Normal' | 'Preferencial'

export interface Usuario {
  id: string
  nomeCompleto: string
  email: string
  telefone: string | null
  perfil: Perfil
  unidadeCrasId: string | null
}

export interface AuthResponse {
  token: string
  expiraEm: string
  usuario: Usuario
}

export interface UnidadeResumo {
  id: string
  nome: string
  endereco: string
  bairro: string
}

export interface Servico {
  id: string
  nome: string
  descricao: string
  duracaoMediaMinutos: number
}

export interface PainelSenha {
  id: string
  codigo: string
  status: StatusAtendimento
  prioridade: Prioridade
  servicoId: string
  servico: string
  cidadao: string | null
  temAgendamento: boolean
  emitidaEm: string
  chamadaEm: string | null
  guiche: string | null
  posicao: number | null
}

export interface FilaDoDia {
  unidadeId: string
  unidade: string
  data: string
  emAtendimento: PainelSenha[]
  aguardando: PainelSenha[]
  concluidasHoje: number
  canceladasHoje: number
}

export interface Indicadores {
  unidadeId: string
  data: string
  senhasEmitidas: number
  atendimentosConcluidos: number
  aguardando: number
  canceladas: number
  tempoMedioEsperaMinutos: number | null
  tempoMedioAtendimentoMinutos: number | null
  agendamentosDoDia: number
  agendamentosSemCheckin: number
  taxaAbsenteismo: number
}

// Formato de erro da API (ProblemDetails).
export interface Problema {
  title?: string
  detail?: string
  status?: number
  errors?: Record<string, string[]>
}
