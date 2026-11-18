// Tokens do GovBR-DS recriados para o React Native.
// Os componentes oficiais do GovBR-DS são Web Components (HTML/CSS) e não rodam no app nativo,
// então copiamos os VALORES do design system. Fonte: @govbr-ds/core 3.7.0 (dist/core.min.css),
// a mesma versão usada no painel web, para os dois terem a mesma cara.
// (O pacote @govbr-ds/tokens só tem versões 4.0 "next", ainda instáveis e com outro azul.)

export const cores = {
  // Azul principal (--color-primary-default / --blue-warm-vivid-70) e variações
  primaria: '#1351B4',
  primariaEscura: '#0C326F', // --color-primary-darken-01 (pressionado)
  primariaClara: '#2670E8', // --color-primary-lighten-01
  primariaPastel: '#DBE8FB', // --color-primary-pastel-02 (fundo de destaque)
  azulFundo: '#EDF5FF', // --blue-warm-vivid-5

  texto: '#333333', // --gray-80
  textoSecundario: '#555555', // --gray-70 (contraste 7,5:1 no branco)
  borda: '#888888', // --gray-40 (borda de campo)
  divisor: '#CCCCCC', // --gray-20
  fundo: '#FFFFFF',
  fundoSuave: '#F8F8F8', // --gray-2
  fundoCinza: '#F0F0F0', // --gray-5
  desabilitado: '#ADADAD', // --gray-30

  sucesso: '#168821', // --green-cool-vivid-50
  sucessoFundo: '#E3F5E1', // --green-cool-vivid-5
  perigo: '#E52207', // --red-vivid-50
  perigoTexto: '#B50909', // --red-vivid-60 (texto de erro com contraste 4,5:1+)
  perigoFundo: '#FFF3F2', // --red-vivid-5
  alerta: '#FFCD07', // --yellow-vivid-20
  alertaFundo: '#FFF5C2', // --yellow-vivid-5
  info: '#155BCB', // --blue-warm-vivid-60
  infoFundo: '#EDF5FF',

  foco: '#C2850C', // --gold-vivid-40 (contorno de foco do DS)
  branco: '#FFFFFF',

  // Visual do protótipo (prints em docs/prototipo), sempre com o token do DS mais próximo da cor desenhada.
  marinho: '#071D41', // --blue-warm-vivid-90: cabeçalho, aba ativa, botão principal, item selecionado
  marinhoClaro: '#0C326F', // --blue-warm-vivid-80: botão principal pressionado
  fundoApp: '#ECF1F7', // --blue-warm-5: fundo azulado claro das telas
  textoSobreMarinho: '#D4E5FF', // --blue-warm-vivid-10: textos secundários no cabeçalho (contraste 13:1)
  verdeLogo: '#21C834', // --green-cool-vivid-30: "Virtual" do logo, só sobre o azul-marinho
  sucessoTexto: '#216E1F', // --green-cool-vivid-60: texto verde sobre o fundo verde claro (5,6:1; o vivid-50 dá só 4,0:1)
  sucessoBorda: '#B7F5BD', // --green-cool-vivid-10: borda das faixas verdes
  infoBorda: '#D4E5FF', // --blue-warm-vivid-10: borda dos avisos de informação
  // O âmbar do protótipo (#FFCD07 / #C2850C) não passa no contraste AA sobre branco.
  // --gold-vivid-60 dá 6,4:1 e continua com cara de "atenção".
  ambarTexto: '#7A591A',
  perigoBorda: '#E52207', // --red-vivid-50: borda do botão "Sair da fila"
  cinzaClaro: '#E6E6E6', // --gray-10: divisórias suaves e quadros
  textoApagado: '#636363', // --gray-60: itens já lidos/atendidos (5,9:1 no branco)
  sombra: '#000000', // usado só com opacidade baixa na sombra dos cartões
} as const

// Sombra leve dos cartões (o protótipo usa sombra no lugar da borda cinza do br-card).
// boxShadow funciona igual no Android, iOS e web desde o React Native 0.76 (nova arquitetura).
export const sombraCartao = '0px 1px 4px rgba(7, 29, 65, 0.12)' // azul-marinho a 12%

// Escala de espaçamento do DS: múltiplos de 8 px (--spacing-scale-*).
export const espaco = {
  meio: 4,
  x1: 8,
  x2: 16,
  x3: 24,
  x4: 32,
  x5: 40,
  x6: 48,
} as const

// Arredondamento das superfícies (--surface-rounder-*). Botões do DS são "pílula" (--button-radius: 100em).
export const raio = {
  pequeno: 4,
  medio: 8,
  cartao: 12, // cartões do protótipo, um pouco mais arredondados que o br-card
  grande: 16,
  pilula: 999,
} as const

// Tipografia. O DS usa base 14 px na web, mas o roteiro pede 16 pt ou mais no app (RNF01, idosos).
// Mantivemos a proporção da escala do DS (1,2) a partir de 16.
// O tamanho acompanha a configuração de fonte do celular (allowFontScaling é o padrão do <Text>).
export const fonte = {
  rotuloCaixaAlta: 14, // só rótulos curtos em CAIXA-ALTA ("SUA SENHA", "UNIDADE"): exceção ao mínimo de 16
  pequena: 16, // nunca abaixo de 16 para texto corrido
  base: 18,
  media: 20,
  grande: 24,
  titulo: 28,
  destaque: 48, // código da senha
  gigante: 56, // senha e posição na tela da fila
  pesoNormal: '400',
  pesoMedio: '500',
  pesoSemiNegrito: '600',
  pesoNegrito: '700',
} as const

// Alvo mínimo de toque (RNF01): 48 dp.
export const ALVO_TOQUE = 48

// Limite do zoom de fonte do sistema: acompanha até 2x sem quebrar o layout.
export const ESCALA_MAXIMA_FONTE = 2
