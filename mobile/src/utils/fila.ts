// Barra de progresso da tela "Acompanhar Fila".
// A API não informa em que posição a pessoa entrou, então a tela guarda a primeira posição que viu
// (posicaoInicial) e mede quanto a fila andou desde então. Ex.: entrou em 10º, está em 8º -> 20%.
// Posição 0 = já foi chamada -> 100%.
export function progressoFila(posicaoInicial: number, posicaoAtual: number): number {
  if (posicaoAtual <= 0) return 100
  if (posicaoInicial <= 0 || posicaoAtual >= posicaoInicial) return 0
  return Math.round(((posicaoInicial - posicaoAtual) / posicaoInicial) * 100)
}

// 8 -> "8º"
export const ordinal = (n: number) => `${n}º`
