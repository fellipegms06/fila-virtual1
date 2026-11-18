import { zodResolver } from '@hookform/resolvers/zod'
import { router } from 'expo-router'
import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { StyleSheet, View } from 'react-native'
import { mensagemDeErro } from '@/api/cliente'
import { MENSAGEM_SO_CIDADAO, useAuth } from '@/auth/AuthContext'
import { esquemaLogin, type FormLogin } from '@/auth/esquemas'
import { Alert } from '@/components/Alert'
import { CabecalhoMarinho } from '@/components/CabecalhoMarinho'
import { Button } from '@/components/Button'
import { CampoForm } from '@/components/CampoForm'
import { Tela } from '@/components/Tela'
import { Texto } from '@/components/Texto'
import { espaco } from '@/theme/tokens'

// RF02: entrar com e-mail e senha.
export default function TelaLogin() {
  const { entrar, aviso } = useAuth()
  const [erro, setErro] = useState<string | null>(null)
  const { control, handleSubmit, formState } = useForm<FormLogin>({
    resolver: zodResolver(esquemaLogin),
    defaultValues: { email: '', senha: '' },
  })

  const enviar = handleSubmit(async ({ email, senha }) => {
    setErro(null)
    try {
      await entrar(email, senha)
      // Não precisa navegar: com a sessão aberta, o layout raiz troca para as abas sozinho.
    } catch (e) {
      setErro(e instanceof Error && e.message === MENSAGEM_SO_CIDADAO ? e.message : mensagemDeErro(e))
    }
  })

  return (
    <Tela
      cabecalho={
        <CabecalhoMarinho logo titulo="Entrar" subtitulo="Agende seu atendimento no CRAS e acompanhe a fila pelo celular." />
      }>

      {aviso && <Alert tipo="info">{aviso}</Alert>}
      {erro && <Alert tipo="perigo">{erro}</Alert>}

      <CampoForm control={control} nome="email" rotulo="E-mail" keyboardType="email-address"
        autoCapitalize="none" autoComplete="email" textContentType="emailAddress" returnKeyType="next" />
      <CampoForm control={control} nome="senha" rotulo="Senha" senha autoComplete="current-password"
        textContentType="password" returnKeyType="done" onSubmitEditing={() => enviar()} />

      <Button titulo="Entrar" onPress={enviar} carregando={formState.isSubmitting} />

      <View style={estilos.cadastro}>
        <Texto variante="secundario" style={estilos.centro}>Ainda não tem conta?</Texto>
        <Button titulo="Criar conta" enfase="secundaria" onPress={() => router.push('/cadastro')} />
      </View>
    </Tela>
  )
}

const estilos = StyleSheet.create({
  cadastro: { gap: espaco.x1, marginTop: espaco.x2 },
  centro: { textAlign: 'center' },
})
