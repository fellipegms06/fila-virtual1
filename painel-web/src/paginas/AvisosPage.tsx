import { BrButton, BrMessage, BrTextarea } from '@govbr-ds/webcomponents-react'
import { useMutation } from '@tanstack/react-query'
import { useState, type FormEvent } from 'react'
import { mensagemDeErro } from '../api/cliente'
import { enviarAviso } from '../api/painel'
import { useAuth } from '../auth/AuthContext'
import { valorDoCampo } from '../componentes/eventos'

const LIMITE = 500

const EXEMPLO = 'Estamos sem sistema no momento. O atendimento deve atrasar cerca de 30 minutos.'

// RN09: aviso de imprevisto para todos que têm senha ativa ou agendamento hoje nesta unidade.
// Como vai para muita gente, o envio pede confirmação.
export function AvisosPage() {
  const { parametrosUnidade } = useAuth()
  const [mensagem, setMensagem] = useState('')
  const [confirmando, setConfirmando] = useState(false)

  const envio = useMutation({
    mutationFn: () => enviarAviso(mensagem.trim(), parametrosUnidade),
    onSuccess: () => {
      setMensagem('')
      setConfirmando(false)
    },
    onError: () => setConfirmando(false),
  })

  function pedirConfirmacao(e: FormEvent) {
    e.preventDefault()
    envio.reset()
    if (mensagem.trim()) setConfirmando(true)
  }

  return (
    <section className="formulario-pagina">
      <h2>Aviso de imprevisto</h2>
      <p>
        A mensagem aparece na hora no aplicativo de todos que estão na fila ou têm agendamento hoje nesta unidade.
        Escreva de forma curta e direta.
      </p>

      <form onSubmit={pedirConfirmacao} noValidate>
        <BrTextarea name="mensagem" label="Mensagem" rows={4} maxlength={LIMITE} showCounter value={mensagem}
          placeholder={EXEMPLO} onInput={(e) => { setMensagem(valorDoCampo(e).slice(0, LIMITE)); setConfirmando(false) }} />

        {!confirmando && (
          <BrButton type="submit" emphasis="primary" disabled={!mensagem.trim() || envio.isPending}>
            <i className="fas fa-bullhorn" aria-hidden="true" /> Enviar aviso
          </BrButton>
        )}
      </form>

      {confirmando && (
        <div className="confirmacao" role="alertdialog" aria-labelledby="confirmacao-titulo">
          <p id="confirmacao-titulo"><strong>Confirma o envio?</strong> Todas as pessoas com senha ou agendamento hoje vão receber este aviso.</p>
          <div className="confirmacao-acoes">
            <BrButton emphasis="primary" onClick={() => envio.mutate()} disabled={envio.isPending} loading={envio.isPending}>
              Sim, enviar
            </BrButton>
            <BrButton emphasis="secondary" onClick={() => setConfirmando(false)} disabled={envio.isPending}>
              Voltar
            </BrButton>
          </div>
        </div>
      )}

      {envio.error && <BrMessage state="danger" message={mensagemDeErro(envio.error)} role="alert" />}
      {envio.data && (
        <BrMessage state="success" message={envio.data.pessoasAvisadas === 0
          ? 'Ninguém tem senha ou agendamento hoje nesta unidade, então ninguém foi avisado.'
          : `Aviso enviado para ${envio.data.pessoasAvisadas} ${envio.data.pessoasAvisadas === 1 ? 'pessoa' : 'pessoas'}.`} />
      )}
    </section>
  )
}
