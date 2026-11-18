import { renderHook } from '@testing-library/react-native'
import { usePosicaoInicial } from './usePosicaoInicial'

describe('usePosicaoInicial', () => {
  it('guarda a posição de entrada enquanto a fila anda', async () => {
    const { result, rerender } = await renderHook((p: { id: string; pos: number | null }) => usePosicaoInicial(p.id, p.pos), {
      initialProps: { id: 'senha-1', pos: 10 },
    })
    expect(result.current).toBe(10)

    await rerender({ id: 'senha-1', pos: 8 })
    expect(result.current).toBe(10)
  })

  it('se alguém preferencial entra na frente, a referência sobe junto', async () => {
    const { result, rerender } = await renderHook((p: { id: string; pos: number | null }) => usePosicaoInicial(p.id, p.pos), {
      initialProps: { id: 'senha-1', pos: 5 },
    })
    await rerender({ id: 'senha-1', pos: 6 })
    expect(result.current).toBe(6)
  })

  it('senha nova recomeça a contagem', async () => {
    const { result, rerender } = await renderHook((p: { id: string; pos: number | null }) => usePosicaoInicial(p.id, p.pos), {
      initialProps: { id: 'senha-1', pos: 10 },
    })
    await rerender({ id: 'senha-2', pos: 4 })
    expect(result.current).toBe(4)
  })
})
