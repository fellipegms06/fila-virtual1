// Preparação comum dos testes (jest-expo).

// Armazenamento seguro em memória: cada teste começa sem sessão salva.
// (O prefixo "mock" é exigido pelo Jest para variáveis usadas dentro de jest.mock.)
const mockMemoria = new Map<string, string>()
jest.mock('expo-secure-store', () => ({
  getItemAsync: jest.fn(async (chave: string) => mockMemoria.get(chave) ?? null),
  setItemAsync: jest.fn(async (chave: string, valor: string) => void mockMemoria.set(chave, valor)),
  deleteItemAsync: jest.fn(async (chave: string) => void mockMemoria.delete(chave)),
}))

// Navegação: as telas só chamam router.push/back/replace; nos testes basta registrar as chamadas.
jest.mock('expo-router', () => ({
  router: { push: jest.fn(), back: jest.fn(), replace: jest.fn(), navigate: jest.fn() },
  useRouter: () => ({ push: jest.fn(), back: jest.fn(), replace: jest.fn() }),
  useLocalSearchParams: jest.fn(() => ({})),
  useFocusEffect: jest.fn(),
  Stack: { Screen: () => null },
  Link: ({ children }: { children: unknown }) => children,
}))

beforeEach(() => {
  mockMemoria.clear()
  jest.clearAllMocks()
})
