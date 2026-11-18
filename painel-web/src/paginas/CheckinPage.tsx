import { BrButton, BrInput, BrMessage, BrSwitch } from '@govbr-ds/webcomponents-react'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { useState, type FormEvent } from 'react'
import { mensagemDeErro } from '../api/cliente'
import { fazerCheckin } from '../api/painel'
import { useAuth } from '../auth/AuthContext'
import { marcadoDoCampo, valorDoCampo } from '../componentes/eventos'
import { SenhaEmitida } from '../componentes/SenhaEmitida'

// RF11 / RN08: o cidadão chegou com agendamento. O atendente digita o código de 8 caracteres
// que aparece no app (ou embaixo do QR Code) e o agendamento vira uma senha na fila.
export function CheckinPage() {
  const { unidadeId, parametrosUnidade } = useAuth()
  const queryClient = useQueryClient()
  const [codigo, setCodigo] = useState('')
  const [preferencial, setPreferencial] = useState(false)
  const [erroLocal, setErroLocal] = useState<string | null>(null)

  const checkin = useMutation({
    mutationFn: () => fazerCheckin(codigo, preferencial, parametrosUnidade),
    onSuccess: () => {
      setCodigo('')
      setPreferencial(false)
      queryClient.invalidateQueries({ queryKey: ['fila', unidadeId] })
    },
  })

  function enviar(e: FormEvent) {
    e.preventDefault()
    if (codigo.length !== 8) {
      setErroLocal('O código do agendamento tem 8 caracteres (letras e números).')
      return
    }
    setErroLocal(null)
    checkin.mutate()
  }

  // Aceita colar com espaços ou em minúsculas: guarda só letras/números, em maiúsculas.
  const normalizar = (texto: string) => texto.replace(/[^0-9a-z]/gi, '').toUpperCase().slice(0, 8)

  return (
    <section className="formulario-pagina">
      <h2>Check-in de agendamento</h2>
      <p>Peça ao cidadão o código do agendamento que aparece no aplicativo.</p>

      <form onSubmit={enviar} noValidate>
        <BrInput name="codigo" label="Código do agendamento" placeholder="Ex.: 7C5E1F89" value={codigo}
          className="campo-codigo" onInput={(e) => setCodigo(normalizar(valorDoCampo(e)))} />
        <BrSwitch name="preferencial" label="Atendimento preferencial (gestante, pessoa com deficiência, lactante...)"
          checked={preferencial} onChange={(e) => setPreferencial(marcadoDoCampo(e))} />
        <p className="dica">Pessoas com 60 anos ou mais já recebem senha preferencial automaticamente.</p>

        {erroLocal && <BrMessage state="danger" message={erroLocal} role="alert" />}
        {checkin.error && <BrMessage state="danger" message={mensagemDeErro(checkin.error)} role="alert" />}

        <BrButton type="submit" emphasis="primary" disabled={checkin.isPending} loading={checkin.isPending}>
          Fazer check-in
        </BrButton>
      </form>

      {checkin.data && <SenhaEmitida senha={checkin.data} titulo="Check-in feito!" />}
    </section>
  )
}
