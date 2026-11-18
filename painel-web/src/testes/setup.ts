import '@testing-library/jest-dom/vitest'
import { cleanup } from '@testing-library/react'
import { afterEach, vi } from 'vitest'

afterEach(() => {
  cleanup()
  sessionStorage.clear()
})

// Os Web Components do GovBR-DS usam Shadow DOM e carregam estilos/ícones em tempo de execução,
// o que o jsdom (navegador simulado dos testes) não reproduz bem. Nos testes trocamos cada componente
// por um elemento HTML equivalente (stubsGovbr.tsx): assim testamos a lógica do PAINEL, não a biblioteca.
vi.mock('@govbr-ds/webcomponents-react', () => import('./stubsGovbr'))
