import { useState } from 'react'

// A API não informa em que posição a pessoa entrou na fila. Guardamos a maior posição vista para esta senha
// (enquanto o app está aberto) e a barra de progresso mostra quanto a fila andou desde então.
// Senha nova (saiu e entrou de novo) recomeça a contagem.
export function usePosicaoInicial(senhaId: string, posicao: number | null) {
  const [maior, setMaior] = useState({ senhaId, posicao: posicao ?? 0 })
  const atual = maior.senhaId === senhaId ? Math.max(maior.posicao, posicao ?? 0) : (posicao ?? 0)
  // Atualizar estado durante o render é o jeito indicado pelo React para valores derivados de props
  // (https://react.dev/learn/you-might-not-need-an-effect#adjusting-some-state-when-a-prop-changes).
  if (maior.senhaId !== senhaId || maior.posicao !== atual) setMaior({ senhaId, posicao: atual })
  return atual
}
