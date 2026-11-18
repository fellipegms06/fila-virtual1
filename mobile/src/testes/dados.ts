import type { Agendamento, UnidadeDetalhe, UnidadeResumo } from '@/api/tipos'

// Dados fictícios usados nos testes das telas.

export const unidadesResumo: UnidadeResumo[] = [
  { id: 'u-sul', nome: 'CRAS Sul', endereco: 'Rua A, 1', bairro: 'Setor Sul', horarioFuncionamento: 'Seg a sex, 8h às 17h',
    telefone: '(61) 3000-0003', latitude: -15.85, longitude: -47.93, distanciaKm: 1.5 },
  { id: 'u-centro', nome: 'CRAS Centro', endereco: 'Rua B, 2', bairro: 'Centro', horarioFuncionamento: 'Seg a sex, 8h às 17h',
    telefone: '(61) 3000-0001', latitude: -15.79, longitude: -47.88, distanciaKm: 9.6 },
]

export const unidadeDetalhe: UnidadeDetalhe = {
  id: 'u-sul', nome: 'CRAS Sul', endereco: 'Rua A, 1', bairro: 'Setor Sul', horarioFuncionamento: 'Seg a sex, 8h às 17h',
  telefone: '(61) 3000-0003', latitude: -15.85, longitude: -47.93,
  servicos: [
    { id: 's-cad', nome: 'Atualização cadastral', descricao: 'Atualizar os dados da família.', duracaoMediaMinutos: 30,
      documentos: [{ descricao: 'CPF do responsável', obrigatorio: true }, { descricao: 'Conta de luz', obrigatorio: false }] },
    { id: 's-bpc', nome: 'BPC', descricao: 'Benefício para idosos e pessoas com deficiência.', duracaoMediaMinutos: 40, documentos: [] },
  ],
}

export const agendamento = (extra: Partial<Agendamento> = {}): Agendamento => ({
  id: 'ag-1', unidadeId: 'u-sul', unidade: 'CRAS Sul', enderecoUnidade: 'Rua A, 1', servicoId: 's-cad',
  servico: 'Atualização cadastral', dataHora: '2099-11-11T12:00:00Z', status: 'Confirmado', codigoCheckin: 'AB12CD34', senha: null,
  ...extra,
})
