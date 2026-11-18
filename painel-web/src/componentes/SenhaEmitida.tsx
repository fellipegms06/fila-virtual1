import { BrButton } from '@govbr-ds/webcomponents-react'
import type { PainelSenha } from '../api/tipos'

// Destaque com o número da senha para o atendente informar (ou imprimir) para o cidadão.
export function SenhaEmitida({ senha, titulo }: { senha: PainelSenha; titulo: string }) {
  return (
    <div className="senha-emitida" role="status" aria-live="polite">
      <p className="senha-emitida-titulo">{titulo}</p>
      <p className="senha-emitida-codigo" aria-label={`Senha ${senha.codigo}`}>{senha.codigo}</p>
      <p>
        {senha.servico}
        {senha.cidadao ? ` · ${senha.cidadao}` : ''}
        {senha.prioridade === 'Preferencial' ? ' · Preferencial' : ''}
      </p>
      {senha.posicao != null && <p>Posição na fila: {senha.posicao}º</p>}
      <BrButton emphasis="tertiary" density="small" onClick={() => window.print()} className="nao-imprimir">
        <i className="fas fa-print" aria-hidden="true" /> Imprimir
      </BrButton>
    </div>
  )
}
