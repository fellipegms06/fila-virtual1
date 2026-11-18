import { AxiosError, AxiosHeaders } from 'axios'
import { describe, expect, it } from 'vitest'
import { mensagemDeErro } from './cliente'

function erroHttp(status: number, data: unknown) {
  return new AxiosError('falhou', 'ERR', undefined, undefined, {
    status, data, statusText: '', headers: {}, config: { headers: new AxiosHeaders() },
  })
}

describe('mensagemDeErro', () => {
  it('usa o título do ProblemDetails da API', () => {
    expect(mensagemDeErro(erroHttp(409, { title: 'Não há mais vagas neste horário.', status: 409 })))
      .toBe('Não há mais vagas neste horário.')
  })

  it('em erro de validação, mostra a primeira mensagem (detail)', () => {
    expect(mensagemDeErro(erroHttp(400, { title: 'Dados inválidos.', detail: 'Informe o guichê.', status: 400 })))
      .toBe('Informe o guichê.')
  })

  it('sem resposta do servidor, orienta a verificar a conexão', () => {
    expect(mensagemDeErro(new AxiosError('Network Error'))).toMatch(/Não foi possível falar com o servidor/)
  })

  it('resposta sem corpo mostra o código', () => {
    expect(mensagemDeErro(erroHttp(502, ''))).toBe('Erro inesperado (código 502).')
  })
})
