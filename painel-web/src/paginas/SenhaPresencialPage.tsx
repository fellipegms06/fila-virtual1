import { BrButton, BrMessage, BrSwitch } from '@govbr-ds/webcomponents-react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { useState } from 'react'
import { mensagemDeErro } from '../api/cliente'
import { emitirSenhaPresencial, listarServicos } from '../api/painel'
import { useAuth } from '../auth/AuthContext'
import { marcadoDoCampo } from '../componentes/eventos'
import { SenhaEmitida } from '../componentes/SenhaEmitida'

// RF11: senha para quem chegou sem agendamento e sem o app. O atendente escolhe o serviço
// com um clique (botões grandes) e entrega o número ao cidadão.
export function SenhaPresencialPage() {
  const { unidadeId, parametrosUnidade } = useAuth()
  const queryClient = useQueryClient()
  const [preferencial, setPreferencial] = useState(false)

  const servicos = useQuery({
    queryKey: ['servicos', unidadeId],
    queryFn: () => listarServicos(unidadeId!),
    enabled: !!unidadeId,
    staleTime: 5 * 60_000,   // serviços quase nunca mudam
  })

  const emitir = useMutation({
    mutationFn: (servicoId: string) => emitirSenhaPresencial(servicoId, preferencial, parametrosUnidade),
    onSuccess: () => {
      setPreferencial(false)
      queryClient.invalidateQueries({ queryKey: ['fila', unidadeId] })
    },
  })

  return (
    <section className="formulario-pagina">
      <h2>Senha presencial</h2>
      <p>Para quem chegou ao CRAS sem agendamento. Marque se for preferencial e escolha o serviço.</p>

      <BrSwitch name="preferencial" label="Atendimento preferencial (idoso, gestante, pessoa com deficiência...)"
        checked={preferencial} onChange={(e) => setPreferencial(marcadoDoCampo(e))} />

      {servicos.isLoading && <p>Carregando serviços...</p>}
      {servicos.error && <BrMessage state="danger" message={mensagemDeErro(servicos.error)} role="alert" />}

      <div className="grade-servicos" role="group" aria-label="Serviços desta unidade">
        {servicos.data?.map((s) => (
          <BrButton key={s.id} emphasis="secondary" disabled={emitir.isPending} onClick={() => emitir.mutate(s.id)}
            aria-label={`Emitir senha para ${s.nome}`}>
            {s.nome}
          </BrButton>
        ))}
      </div>

      {emitir.error && <BrMessage state="danger" message={mensagemDeErro(emitir.error)} role="alert" />}
      {emitir.data && <SenhaEmitida senha={emitir.data} titulo="Senha emitida!" />}
    </section>
  )
}
