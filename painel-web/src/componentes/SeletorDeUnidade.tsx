import { useQuery } from '@tanstack/react-query'
import { listarUnidades } from '../api/auth'
import { mensagemDeErro } from '../api/cliente'
import { useAuth } from '../auth/AuthContext'

// Só aparece para o administrador: o atendente já tem a unidade fixa no token (RN10).
// Usa um <select> nativo com o visual do GovBR-DS: é o controle mais acessível para leitores de tela.
export function SeletorDeUnidade() {
  const { unidadeId, escolherUnidade } = useAuth()
  const { data: unidades, error, isLoading } = useQuery({ queryKey: ['unidades'], queryFn: listarUnidades })

  if (error) return <p className="texto-erro">{mensagemDeErro(error)}</p>

  return (
    <div className="seletor-unidade">
      <label htmlFor="unidade">Unidade CRAS</label>
      <select
        id="unidade"
        value={unidadeId ?? ''}
        disabled={isLoading}
        onChange={(e) => escolherUnidade(e.target.value)}
      >
        <option value="" disabled>
          {isLoading ? 'Carregando unidades...' : 'Escolha a unidade'}
        </option>
        {unidades?.map((u) => (
          <option key={u.id} value={u.id}>
            {u.nome}
          </option>
        ))}
      </select>
    </div>
  )
}
