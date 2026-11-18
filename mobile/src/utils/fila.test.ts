import { ordinal, progressoFila } from './fila'

describe('progressoFila', () => {
  it.each([
    [10, 10, 0],
    [10, 8, 20],
    [10, 1, 90],
    [10, 0, 100],
    [5, 7, 0], // alguém preferencial entrou na frente: não fica negativo
    [0, 3, 0],
  ])('entrou em %s, está em %s -> %s%%', (inicial, atual, esperado) => {
    expect(progressoFila(inicial, atual)).toBe(esperado)
  })

  it('ordinal', () => {
    expect(ordinal(8)).toBe('8º')
  })
})
