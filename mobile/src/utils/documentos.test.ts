import { cpfOculto, cpfValido, dataBrParaIso, mascararCpf, mascararData, mascararTelefone } from './documentos'

describe('documentos', () => {
  it.each([
    ['5', '5'],
    ['5299', '529.9'],
    ['5299822', '529.982.2'],
    ['52998224725', '529.982.247-25'],
    ['529.982.247-25999', '529.982.247-25'], // ignora o que passar de 11 dígitos
  ])('máscara de CPF %s -> %s', (digitado, esperado) => {
    expect(mascararCpf(digitado)).toBe(esperado)
  })

  it('aceita CPF válido com ou sem pontuação e recusa os inválidos', () => {
    expect(cpfValido('529.982.247-25')).toBe(true)
    expect(cpfValido('52998224725')).toBe(true)
    expect(cpfValido('529.982.247-26')).toBe(false) // dígito verificador errado
    expect(cpfValido('111.111.111-11')).toBe(false) // todos iguais
    expect(cpfValido('1234')).toBe(false)
  })

  it.each([
    ['11', '(11'],
    ['119876', '(11) 9876'],
    ['1133334444', '(11) 3333-4444'],
    ['11987654321', '(11) 98765-4321'],
  ])('máscara de telefone %s -> %s', (digitado, esperado) => {
    expect(mascararTelefone(digitado)).toBe(esperado)
  })

  it('máscara e conversão da data de nascimento', () => {
    expect(mascararData('25121950')).toBe('25/12/1950')
    expect(dataBrParaIso('25/12/1950')).toBe('1950-12-25')
    expect(dataBrParaIso('31/02/1950')).toBeNull() // 31 de fevereiro não existe
    expect(dataBrParaIso('25/12/50')).toBeNull()
  })
})

describe('cpfOculto', () => {
  it('mostra só os 6 dígitos do meio', () => {
    expect(cpfOculto('52998224725')).toBe('***.982.247-**')
    expect(cpfOculto('529.982.247-25')).toBe('***.982.247-**')
  })

  it('CPF incompleto fica todo oculto', () => {
    expect(cpfOculto('123')).toBe('***.***.***-**')
  })
})
