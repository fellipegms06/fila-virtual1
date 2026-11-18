import { zodResolver } from '@hookform/resolvers/zod'
import { useState } from 'react'
import { Controller, useForm, useWatch } from 'react-hook-form'
import { StyleSheet, Switch, View } from 'react-native'
import { atualizarMeusDados } from '@/api/auth'
import { errosDosCampos, mensagemDeErro } from '@/api/cliente'
import { useAuth } from '@/auth/AuthContext'
import type { Usuario } from '@/api/tipos'
import { esquemaPerfil, type FormPerfil } from '@/auth/esquemas'
import { Alert } from '@/components/Alert'
import { Button } from '@/components/Button'
import { CampoForm } from '@/components/CampoForm'
import { Card } from '@/components/Card'
import { Tela } from '@/components/Tela'
import { Texto } from '@/components/Texto'
import { cores, espaco } from '@/theme/tokens'
import { mascararCpf, mascararTelefone, somenteDigitos } from '@/utils/documentos'
import { diaParaBr } from '@/utils/formatar'

// RF12: a pessoa pode mudar e-mail, celular e senha. Nome, CPF e nascimento não mudam pelo app
// (são os dados que identificam a pessoa no CRAS).
export default function TelaPerfil() {
  const { sessao } = useAuth()
  // Logo depois de "Sim, sair" a tela ainda pode ser desenhada uma vez sem sessão, antes da navegação trocar.
  if (!sessao) return null
  return <FormularioPerfil usuario={sessao.usuario} />
}

function FormularioPerfil({ usuario }: { usuario: Usuario }) {
  const { atualizarUsuario, sair } = useAuth()
  const [mensagem, setMensagem] = useState<{ tipo: 'sucesso' | 'perigo'; texto: string } | null>(null)
  const [confirmandoSaida, setConfirmandoSaida] = useState(false)

  const { control, handleSubmit, reset, setError, formState } = useForm<FormPerfil>({
    resolver: zodResolver(esquemaPerfil),
    defaultValues: {
      email: usuario.email,
      telefone: usuario.telefone ? mascararTelefone(usuario.telefone) : '',
      trocarSenha: false,
      senhaAtual: '',
      novaSenha: '',
      confirmarSenha: '',
    },
  })
  const trocarSenha = useWatch({ control, name: 'trocarSenha' })

  const salvar = handleSubmit(async (dados) => {
    setMensagem(null)
    try {
      const atualizado = await atualizarMeusDados({
        email: dados.email.trim(),
        telefone: dados.telefone.trim() ? somenteDigitos(dados.telefone) : null,
        senhaAtual: dados.trocarSenha ? dados.senhaAtual : null,
        novaSenha: dados.trocarSenha ? dados.novaSenha : null,
      })
      await atualizarUsuario(atualizado)
      // Limpa os campos de senha para não ficarem guardados na tela.
      reset({ ...dados, trocarSenha: false, senhaAtual: '', novaSenha: '', confirmarSenha: '' })
      setMensagem({ tipo: 'sucesso', texto: dados.trocarSenha ? 'Dados e senha atualizados.' : 'Dados atualizados.' })
    } catch (e) {
      const porCampo = errosDosCampos(e)
      for (const campo of ['email', 'telefone', 'senhaAtual', 'novaSenha'] as const)
        if (porCampo[campo]) setError(campo, { message: porCampo[campo] })
      setMensagem({ tipo: 'perigo', texto: mensagemDeErro(e) })
    }
  })

  return (
    <Tela>
      <Card>
        <Texto variante="subtitulo">{usuario.nomeCompleto}</Texto>
        <Texto variante="secundario">CPF {mascararCpf(usuario.cpf)}</Texto>
        <Texto variante="secundario">Nascimento {diaParaBr(usuario.dataNascimento)}</Texto>
      </Card>

      {mensagem && <Alert tipo={mensagem.tipo}>{mensagem.texto}</Alert>}

      <Texto variante="subtitulo">Contato</Texto>
      <CampoForm control={control} nome="email" rotulo="E-mail" keyboardType="email-address" autoCapitalize="none" />
      <CampoForm control={control} nome="telefone" rotulo="Celular (opcional)" mascara={mascararTelefone} keyboardType="phone-pad" />

      <Controller
        control={control}
        name="trocarSenha"
        render={({ field }) => (
          <View style={estilos.linhaChave}>
            <Texto style={estilos.rotuloChave} nativeID="rotulo-trocar-senha">Quero trocar minha senha</Texto>
            <Switch
              value={field.value}
              onValueChange={field.onChange}
              accessibilityLabel="Quero trocar minha senha"
              trackColor={{ true: cores.marinho, false: cores.desabilitado }}
              thumbColor={cores.branco}
            />
          </View>
        )}
      />

      {trocarSenha && (
        <>
          <CampoForm control={control} nome="senhaAtual" rotulo="Senha atual" senha autoComplete="current-password" />
          <CampoForm control={control} nome="novaSenha" rotulo="Nova senha" senha ajuda="Pelo menos 8 caracteres." autoComplete="new-password" />
          <CampoForm control={control} nome="confirmarSenha" rotulo="Repita a nova senha" senha autoComplete="new-password" />
        </>
      )}

      <Button titulo="Salvar alterações" icone="save-outline" onPress={salvar} carregando={formState.isSubmitting} />

      <View style={estilos.saida}>
        {confirmandoSaida ? (
          <Card>
            <Texto>Quer mesmo sair? Para voltar, você vai precisar do e-mail e da senha.</Texto>
            <Button titulo="Sim, sair" enfase="perigo" onPress={() => void sair()} />
            <Button titulo="Continuar no app" enfase="terciaria" onPress={() => setConfirmandoSaida(false)} />
          </Card>
        ) : (
          <Button titulo="Sair da conta" enfase="secundaria" icone="log-out-outline" onPress={() => setConfirmandoSaida(true)} />
        )}
      </View>
    </Tela>
  )
}

const estilos = StyleSheet.create({
  linhaChave: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', minHeight: 48, gap: espaco.x2 },
  rotuloChave: { flex: 1 },
  saida: { marginTop: espaco.x3 },
})
