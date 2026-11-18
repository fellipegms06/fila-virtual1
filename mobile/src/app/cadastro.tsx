import { zodResolver } from '@hookform/resolvers/zod'
import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { errosDosCampos, mensagemDeErro } from '@/api/cliente'
import { useAuth } from '@/auth/AuthContext'
import { esquemaCadastro, type FormCadastro } from '@/auth/esquemas'
import { Alert } from '@/components/Alert'
import { Button } from '@/components/Button'
import { CampoForm } from '@/components/CampoForm'
import { Tela } from '@/components/Tela'
import { dataBrParaIso, mascararCpf, mascararData, mascararTelefone, somenteDigitos } from '@/utils/documentos'

const CAMPOS: (keyof FormCadastro)[] = ['nomeCompleto', 'cpf', 'dataNascimento', 'email', 'telefone', 'senha']

// RF01: cadastro do cidadão. Depois de cadastrar, a pessoa já entra no app (a API devolve o token).
export default function TelaCadastro() {
  const { cadastrar } = useAuth()
  const [erro, setErro] = useState<string | null>(null)
  const { control, handleSubmit, setError, formState } = useForm<FormCadastro>({
    resolver: zodResolver(esquemaCadastro),
    defaultValues: { nomeCompleto: '', cpf: '', dataNascimento: '', email: '', telefone: '', senha: '', confirmarSenha: '' },
  })

  const enviar = handleSubmit(async (dados) => {
    setErro(null)
    try {
      await cadastrar({
        nomeCompleto: dados.nomeCompleto.trim(),
        cpf: somenteDigitos(dados.cpf),
        dataNascimento: dataBrParaIso(dados.dataNascimento)!, // o esquema já garantiu que é válida
        email: dados.email.trim(),
        senha: dados.senha,
        telefone: dados.telefone.trim() ? somenteDigitos(dados.telefone) : null,
      })
    } catch (e) {
      // Erro de um campo específico (ex.: CPF inválido para a API) aparece embaixo do campo.
      const porCampo = errosDosCampos(e)
      for (const campo of CAMPOS) if (porCampo[campo]) setError(campo, { message: porCampo[campo] })
      setErro(mensagemDeErro(e)) // e a mensagem geral (ex.: "Já existe uma conta com este CPF.") no topo
    }
  })

  return (
    <Tela subtitulo="Preencha seus dados. Os campos com * são obrigatórios.">
      {erro && <Alert tipo="perigo">{erro}</Alert>}

      <CampoForm control={control} nome="nomeCompleto" rotulo="Nome completo *" autoCapitalize="words" autoComplete="name" />
      <CampoForm control={control} nome="cpf" rotulo="CPF *" mascara={mascararCpf} keyboardType="number-pad"
        placeholder="000.000.000-00" ajuda="Só os números; os pontos aparecem sozinhos." />
      <CampoForm control={control} nome="dataNascimento" rotulo="Data de nascimento *" mascara={mascararData}
        keyboardType="number-pad" placeholder="dd/mm/aaaa" ajuda="Quem tem 60 anos ou mais recebe atendimento preferencial." />
      <CampoForm control={control} nome="email" rotulo="E-mail *" keyboardType="email-address" autoCapitalize="none" autoComplete="email" />
      <CampoForm control={control} nome="telefone" rotulo="Celular (opcional)" mascara={mascararTelefone}
        keyboardType="phone-pad" placeholder="(00) 00000-0000" autoComplete="tel" />
      <CampoForm control={control} nome="senha" rotulo="Senha *" senha ajuda="Pelo menos 8 caracteres." autoComplete="new-password" />
      <CampoForm control={control} nome="confirmarSenha" rotulo="Repita a senha *" senha autoComplete="new-password" />

      <Button titulo="Criar conta" onPress={enviar} carregando={formState.isSubmitting} />
    </Tela>
  )
}
