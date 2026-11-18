import { z } from 'zod'
import { cpfValido, dataBrParaIso, somenteDigitos } from '../utils/documentos'

// Regras dos formulários, com as mesmas mensagens do backend (RegrasComuns.cs).
// Validar no app dá resposta imediata; a API valida de novo, porque é ela quem garante as regras.

const TAMANHO_MINIMO_SENHA = 8

const email = z.string().trim().min(1, 'Informe o e-mail.').max(150, 'O e-mail deve ter no máximo 150 caracteres.')
  .email('Informe um e-mail válido.')

const senhaNova = z.string().min(1, 'Informe a senha.')
  .min(TAMANHO_MINIMO_SENHA, `A senha deve ter pelo menos ${TAMANHO_MINIMO_SENHA} caracteres.`)
  .max(100, 'A senha deve ter no máximo 100 caracteres.')

const telefone = z.string().refine((t) => !t.trim() || [10, 11].includes(somenteDigitos(t).length),
  'Informe o telefone com DDD (10 ou 11 dígitos).')

export const esquemaLogin = z.object({
  email,
  senha: z.string().min(1, 'Informe a senha.'),
})
export type FormLogin = z.infer<typeof esquemaLogin>

export const esquemaCadastro = z.object({
  nomeCompleto: z.string().trim().min(1, 'Informe o nome completo.').max(150, 'O nome deve ter no máximo 150 caracteres.'),
  cpf: z.string().min(1, 'Informe o CPF.').refine(cpfValido, 'CPF inválido.'),
  dataNascimento: z.string().min(1, 'Informe a data de nascimento.').superRefine((texto, ctx) => {
    const iso = dataBrParaIso(texto)
    if (!iso || Number(iso.slice(0, 4)) < 1900) ctx.addIssue({ code: 'custom', message: 'Informe uma data válida, no formato dia/mês/ano.' })
    else if (new Date(`${iso}T00:00:00Z`).getTime() >= Date.now()) ctx.addIssue({ code: 'custom', message: 'A data de nascimento deve estar no passado.' })
  }),
  email,
  telefone,
  senha: senhaNova,
  confirmarSenha: z.string(),
}).refine((d) => d.senha === d.confirmarSenha, { path: ['confirmarSenha'], message: 'As senhas não são iguais.' })
export type FormCadastro = z.infer<typeof esquemaCadastro>

export const esquemaPerfil = z.object({
  email,
  telefone,
  trocarSenha: z.boolean(),
  senhaAtual: z.string(),
  novaSenha: z.string(),
  confirmarSenha: z.string(),
}).superRefine((d, ctx) => {
  if (!d.trocarSenha) return
  if (!d.senhaAtual) ctx.addIssue({ code: 'custom', path: ['senhaAtual'], message: 'Informe a senha atual.' })
  const nova = senhaNova.safeParse(d.novaSenha)
  if (!nova.success) ctx.addIssue({ code: 'custom', path: ['novaSenha'], message: nova.error.issues[0].message })
  else if (d.novaSenha !== d.confirmarSenha) ctx.addIssue({ code: 'custom', path: ['confirmarSenha'], message: 'As senhas não são iguais.' })
})
export type FormPerfil = z.infer<typeof esquemaPerfil>
