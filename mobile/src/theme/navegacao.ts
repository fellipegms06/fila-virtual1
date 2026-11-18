import { cores } from './tokens'

// Opções comuns dos cabeçalhos das pilhas de telas (unidade, agendar, cadastro):
// barra azul-marinho do protótipo com texto branco.
export const opcoesCabecalho = {
  headerStyle: { backgroundColor: cores.marinho },
  headerTintColor: cores.branco,
  headerTitleStyle: { fontWeight: '700' as const },
  contentStyle: { backgroundColor: cores.fundoApp },
}
