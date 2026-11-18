import { StyleSheet, View } from 'react-native'
import { cores, espaco, fonte } from '../theme/tokens'
import { Texto } from './Texto'

interface Props {
  passos: string[]
  atual: number // índice começando em 0
}

// Passos do agendamento em forma de abas, como no protótipo: "Unidade | Serviço | Data e Hora | Confirmar".
// Ativa sublinhada em azul-marinho, concluídas em verde com ✓. Não são tocáveis (para voltar, há o "‹ Voltar"),
// então o leitor de tela lê tudo de uma vez: "Passo 2 de 4: Serviço".
// A cor nunca é a única pista: as concluídas têm ✓ e a ativa tem sublinhado e negrito.
export function AbasPassos({ passos, atual }: Props) {
  return (
    <View
      style={estilos.linha}
      accessible
      accessibilityRole="progressbar"
      accessibilityLabel={`Passo ${atual + 1} de ${passos.length}: ${passos[atual]}`}>
      {passos.map((nome, i) => {
        const feito = i < atual
        const ativo = i === atual
        return (
          <View key={nome} style={[estilos.aba, ativo && estilos.abaAtiva, feito && estilos.abaFeita]}>
            <Texto
              numberOfLines={2}
              maxFontSizeMultiplier={1.4}
              style={[estilos.nome, feito && estilos.nomeFeito, ativo && estilos.nomeAtivo]}>
              {feito ? `✓ ${nome}` : nome}
            </Texto>
          </View>
        )
      })}
    </View>
  )
}

const estilos = StyleSheet.create({
  linha: { flexDirection: 'row', backgroundColor: cores.branco },
  aba: {
    flex: 1,
    minHeight: 44,
    justifyContent: 'center',
    paddingHorizontal: espaco.meio,
    borderBottomWidth: 3,
    borderBottomColor: cores.cinzaClaro,
  },
  abaAtiva: { borderBottomColor: cores.marinho },
  abaFeita: { borderBottomColor: cores.sucesso },
  // 14 aqui: são 4 rótulos curtos lado a lado em 360 dp (com 16, "Data e Hora" quebra em 3 linhas).
  nome: { fontSize: fonte.rotuloCaixaAlta, lineHeight: 18, textAlign: 'center', color: cores.textoSecundario },
  nomeFeito: { color: cores.sucessoTexto, fontWeight: fonte.pesoSemiNegrito },
  nomeAtivo: { color: cores.marinho, fontWeight: fonte.pesoNegrito },
})
