import { BrButton, BrInput, BrMessage } from '@govbr-ds/webcomponents-react'
import { useState, type FormEvent } from 'react'
import { Navigate, useLocation } from 'react-router-dom'
import { mensagemDeErro } from '../api/cliente'
import { useAuth } from '../auth/AuthContext'
import { valorDoCampo } from '../componentes/eventos'

export function LoginPage() {
  const { sessao, login, aviso } = useAuth()
  const local = useLocation()
  const [email, setEmail] = useState('')
  const [senha, setSenha] = useState('')
  const [erro, setErro] = useState<string | null>(null)
  const [enviando, setEnviando] = useState(false)

  const voltarPara = (local.state as { voltarPara?: string } | null)?.voltarPara ?? '/'
  if (sessao) return <Navigate to={voltarPara} replace />

  async function enviar(e: FormEvent) {
    e.preventDefault()
    if (!email.trim() || !senha) {
      setErro('Informe o e-mail e a senha.')
      return
    }
    setErro(null)
    setEnviando(true)
    try {
      await login(email.trim(), senha)
    } catch (err) {
      // Erro de regra local (perfil Cidadão) vem como Error comum; erro da API vem do axios.
      setErro(err instanceof Error && !('isAxiosError' in err) ? err.message : mensagemDeErro(err))
    } finally {
      setEnviando(false)
    }
  }

  return (
    <div className="login">
      <div className="login-caixa">
        <h1>FilaVirtual</h1>
        <p className="login-subtitulo">Painel do atendente do CRAS</p>

        {aviso && <BrMessage state="info" message={aviso} />}

        <form onSubmit={enviar} noValidate>
          <BrInput
            name="email"
            type="email"
            label="E-mail"
            placeholder="seu.email@exemplo.com"
            autocomplete="on"
            value={email}
            required
            onInput={(e) => setEmail(valorDoCampo(e))}
          />
          <BrInput
            name="senha"
            type="password"
            label="Senha"
            value={senha}
            required
            onInput={(e) => setSenha(valorDoCampo(e))}
          />

          {erro && <BrMessage state="danger" isFeedback message={erro} role="alert" />}

          <BrButton type="submit" emphasis="primary" disabled={enviando} loading={enviando} className="login-botao">
            {enviando ? 'Entrando...' : 'Entrar'}
          </BrButton>
        </form>
      </div>
    </div>
  )
}
