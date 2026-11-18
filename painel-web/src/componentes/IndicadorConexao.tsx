import type { EstadoConexao } from '../realtime/useFilaTempoReal'

const TEXTOS: Record<EstadoConexao, { texto: string; classe: string; icone: string }> = {
  conectado: { texto: 'Atualizando em tempo real', classe: 'ok', icone: 'fa-circle-check' },
  conectando: { texto: 'Conectando...', classe: 'aviso', icone: 'fa-spinner fa-spin' },
  reconectando: { texto: 'Conexão instável, reconectando...', classe: 'aviso', icone: 'fa-spinner fa-spin' },
  desconectado: { texto: 'Sem tempo real: atualize a página', classe: 'erro', icone: 'fa-triangle-exclamation' },
}

// Mostra ao atendente se a lista está se atualizando sozinha (role="status" é lido por leitores de tela).
export function IndicadorConexao({ estado }: { estado: EstadoConexao }) {
  const t = TEXTOS[estado]
  return (
    <span className={`indicador-conexao ${t.classe}`} role="status">
      <i className={`fas ${t.icone}`} aria-hidden="true" /> {t.texto}
    </span>
  )
}
