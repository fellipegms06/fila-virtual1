import { BrButton, BrMessage } from '@govbr-ds/webcomponents-react'
import { NavLink, Outlet } from 'react-router-dom'
import { useAuth } from '../auth/AuthContext'
import { SeletorDeUnidade } from './SeletorDeUnidade'

const LINKS = [
  { para: '/', texto: 'Fila do dia', icone: 'fa-list-ol' },
  { para: '/checkin', texto: 'Check-in', icone: 'fa-qrcode' },
  { para: '/senha-presencial', texto: 'Senha presencial', icone: 'fa-ticket' },
  { para: '/indicadores', texto: 'Indicadores', icone: 'fa-chart-column' },
  { para: '/avisos', texto: 'Avisos', icone: 'fa-bullhorn' },
]

// Estrutura comum de todas as telas logadas: cabeçalho, menu e conteúdo.
// Sem brasão nem logotipo do gov.br: usamos só a identidade visual (cores, fonte, componentes).
export function Layout() {
  const { sessao, unidadeId, logout } = useAuth()

  return (
    <div className="app">
      <header className="cabecalho">
        <div className="container-lg cabecalho-conteudo">
          <div>
            <span className="cabecalho-titulo">FilaVirtual</span>
            <span className="cabecalho-subtitulo">Painel do atendente · CRAS</span>
          </div>
          <div className="cabecalho-usuario">
            <span>
              <i className="fas fa-user" aria-hidden="true" /> {sessao?.nome}{' '}
              <small>({sessao?.perfil === 'Administrador' ? 'Administrador' : 'Atendente'})</small>
            </span>
            <BrButton emphasis="secondary" colorMode="dark" density="small" onClick={() => logout()} aria-label="Sair do painel">
              Sair
            </BrButton>
          </div>
        </div>
      </header>

      <div className="container-lg">
        {sessao?.perfil === 'Administrador' && <SeletorDeUnidade />}

        <nav className="menu" aria-label="Menu do painel">
          {LINKS.map((l) => (
            <NavLink key={l.para} to={l.para} end className={({ isActive }) => `menu-link${isActive ? ' ativo' : ''}`}>
              <i className={`fas ${l.icone}`} aria-hidden="true" /> {l.texto}
            </NavLink>
          ))}
        </nav>

        <main className="conteudo">
          {unidadeId ? (
            <Outlet />
          ) : (
            <BrMessage state="info" message="Escolha acima a unidade CRAS que você quer gerenciar." />
          )}
        </main>
      </div>
    </div>
  )
}
