import { erroDaApi } from '@/testes/utilitarios'
import { errosDosCampos, mensagemDeErro } from './cliente'

describe('mensagens de erro da API', () => {
  it('validação (400) mostra a primeira mensagem, que vem no detail', () => {
    const erro = erroDaApi(400, { title: 'Dados inválidos.', detail: 'CPF inválido.', errors: { cpf: ['CPF inválido.'] } })
    expect(mensagemDeErro(erro)).toBe('CPF inválido.')
    expect(errosDosCampos(erro)).toEqual({ cpf: 'CPF inválido.' })
  })

  it('demais erros mostram o title', () => {
    expect(mensagemDeErro(erroDaApi(409, { title: 'Já existe uma conta com este CPF.' }))).toBe('Já existe uma conta com este CPF.')
  })

  it('sem resposta do servidor = problema de conexão', () => {
    const semRede = Object.assign(new Error('Network Error'), { isAxiosError: true })
    expect(mensagemDeErro(semRede)).toMatch(/Sem conexão/)
  })
})
