import { describe, expect, it } from 'vitest'
import { tokenFalso } from '../testes/utilitarios'
import { carregarSessao, criarSessao, lerToken, podeUsarPainel, salvarSessao } from './sessao'

describe('sessão do painel', () => {
  it('lê as claims do token, inclusive com acentos no conteúdo', () => {
    const token = tokenFalso({ sub: 'abc', role: 'Atendente', unidade: 'u-1', exp: 2000000000, nome: 'João' })
    expect(lerToken(token)).toMatchObject({ sub: 'abc', role: 'Atendente', unidade: 'u-1', nome: 'João' })
  })

  it('token malformado não quebra a tela', () => {
    expect(lerToken('isto-nao-e-um-jwt')).toBeNull()
    expect(criarSessao('x.y.z', 'Fulano')).toBeNull()
  })

  it('monta a sessão com a unidade e a expiração em milissegundos', () => {
    const sessao = criarSessao(tokenFalso({ sub: 'abc', role: 'Atendente', unidade: 'u-1', exp: 2000000000 }), 'Ana')
    expect(sessao).toMatchObject({ usuarioId: 'abc', perfil: 'Atendente', unidadeId: 'u-1', nome: 'Ana', expiraEm: 2000000000000 })
  })

  it('administrador não tem unidade fixa', () => {
    const sessao = criarSessao(tokenFalso({ sub: 'adm', role: 'Administrador', exp: 2000000000 }), 'Admin')
    expect(sessao?.unidadeId).toBeNull()
  })

  it('só atendente e administrador podem usar o painel', () => {
    expect(podeUsarPainel('Atendente')).toBe(true)
    expect(podeUsarPainel('Administrador')).toBe(true)
    expect(podeUsarPainel('Cidadao')).toBe(false)
  })

  it('sessão vencida é descartada ao recarregar a página', () => {
    const sessao = criarSessao(tokenFalso({ sub: 'abc', role: 'Atendente', exp: 1000 }), 'Ana')!
    salvarSessao(sessao)
    expect(carregarSessao(999_000)).not.toBeNull()
    expect(carregarSessao(1_000_001)).toBeNull()
  })
})
