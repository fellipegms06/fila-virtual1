// Máscaras e validações dos campos do cadastro.
// A validação do CPF é a mesma regra do backend (CpfValidator): o app avisa antes de enviar,
// mas quem decide de verdade é a API.

export const somenteDigitos = (texto: string) => texto.replace(/\D/g, '')

// "12345678909" -> "123.456.789-09" (vai formatando enquanto a pessoa digita)
export function mascararCpf(texto: string): string {
  const d = somenteDigitos(texto).slice(0, 11)
  return d
    .replace(/^(\d{3})(\d)/, '$1.$2')
    .replace(/^(\d{3})\.(\d{3})(\d)/, '$1.$2.$3')
    .replace(/\.(\d{3})(\d{1,2})$/, '.$1-$2')
}

export function cpfValido(texto: string): boolean {
  const cpf = somenteDigitos(texto)
  if (cpf.length !== 11 || /^(\d)\1{10}$/.test(cpf)) return false // 111.111.111-11 passa na conta, mas não existe

  const digito = (tamanho: number) => {
    let soma = 0
    for (let i = 0; i < tamanho; i++) soma += Number(cpf[i]) * (tamanho + 1 - i)
    const resto = (soma * 10) % 11
    return resto === 10 ? 0 : resto
  }
  return digito(9) === Number(cpf[9]) && digito(10) === Number(cpf[10])
}

// "11987654321" -> "(11) 98765-4321"; "1133334444" -> "(11) 3333-4444"
export function mascararTelefone(texto: string): string {
  const d = somenteDigitos(texto).slice(0, 11)
  if (d.length <= 2) return d.length ? `(${d}` : ''
  const meio = d.length === 11 ? 7 : 6
  if (d.length <= meio) return `(${d.slice(0, 2)}) ${d.slice(2)}`
  return `(${d.slice(0, 2)}) ${d.slice(2, meio)}-${d.slice(meio)}`
}

// Data digitada "dd/mm/aaaa".
export function mascararData(texto: string): string {
  const d = somenteDigitos(texto).slice(0, 8)
  return d.replace(/^(\d{2})(\d)/, '$1/$2').replace(/^(\d{2})\/(\d{2})(\d)/, '$1/$2/$3')
}

// "25/12/1950" -> "1950-12-25" (formato que a API espera). Devolve null se a data não existir (ex.: 31/02).
export function dataBrParaIso(texto: string): string | null {
  const m = /^(\d{2})\/(\d{2})\/(\d{4})$/.exec(texto)
  if (!m) return null
  const [, dia, mes, ano] = m.map(Number)
  const data = new Date(Date.UTC(ano, mes - 1, dia))
  const existe = data.getUTCFullYear() === ano && data.getUTCMonth() === mes - 1 && data.getUTCDate() === dia
  return existe ? `${m[3]}-${m[2]}-${m[1]}` : null
}

// "52998224725" -> "***.982.247-**": CPF parcialmente oculto na tela inicial, no padrão de LGPD usado pelo gov.br
// (só os 6 dígitos do meio aparecem). Protege quando alguém está olhando a tela por cima do ombro.
export function cpfOculto(cpf: string): string {
  const d = somenteDigitos(cpf)
  if (d.length !== 11) return '***.***.***-**'
  return `***.${d.slice(3, 6)}.${d.slice(6, 9)}-**`
}
