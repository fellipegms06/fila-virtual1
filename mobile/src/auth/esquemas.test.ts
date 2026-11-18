import { esquemaCadastro, esquemaPerfil } from './esquemas'

const cadastroValido = {
  nomeCompleto: 'Maria da Silva',
  cpf: '529.982.247-25',
  dataNascimento: '25/12/1950',
  email: 'maria@exemplo.com',
  telefone: '',
  senha: 'senha1234',
  confirmarSenha: 'senha1234',
}

const mensagens = (r: { success: boolean; error?: { issues: { path: PropertyKey[]; message: string }[] } }) =>
  Object.fromEntries((r.error?.issues ?? []).map((i) => [String(i.path[0]), i.message]))

describe('esquemas dos formulários', () => {
  it('cadastro válido passa (telefone é opcional)', () => {
    expect(esquemaCadastro.safeParse(cadastroValido).success).toBe(true)
  })

  it('cadastro mostra as mesmas mensagens da API', () => {
    const r = esquemaCadastro.safeParse({
      ...cadastroValido, cpf: '111.111.111-11', email: 'maria', senha: 'curta', confirmarSenha: 'curta', telefone: '(11) 9',
    })
    expect(mensagens(r)).toMatchObject({
      cpf: 'CPF inválido.',
      email: 'Informe um e-mail válido.',
      senha: 'A senha deve ter pelo menos 8 caracteres.',
      telefone: 'Informe o telefone com DDD (10 ou 11 dígitos).',
    })
  })

  it('recusa data inexistente, futura e senhas diferentes', () => {
    expect(mensagens(esquemaCadastro.safeParse({ ...cadastroValido, dataNascimento: '31/02/1950' })).dataNascimento)
      .toBe('Informe uma data válida, no formato dia/mês/ano.')
    expect(mensagens(esquemaCadastro.safeParse({ ...cadastroValido, dataNascimento: '01/01/2999' })).dataNascimento)
      .toBe('A data de nascimento deve estar no passado.')
    expect(mensagens(esquemaCadastro.safeParse({ ...cadastroValido, confirmarSenha: 'outra1234' })).confirmarSenha)
      .toBe('As senhas não são iguais.')
  })

  it('perfil só exige as senhas quando a pessoa quer trocar', () => {
    const base = { email: 'maria@exemplo.com', telefone: '', trocarSenha: false, senhaAtual: '', novaSenha: '', confirmarSenha: '' }
    expect(esquemaPerfil.safeParse(base).success).toBe(true)
    expect(mensagens(esquemaPerfil.safeParse({ ...base, trocarSenha: true }))).toMatchObject({
      senhaAtual: 'Informe a senha atual.',
      novaSenha: 'Informe a senha.',
    })
  })
})
