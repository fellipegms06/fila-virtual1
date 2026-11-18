import type { ReactNode } from 'react'
import { Navigate, useLocation } from 'react-router-dom'
import { useAuth } from './AuthContext'

// Sem sessão, manda para o login e lembra a página pedida para voltar depois.
export function RotaProtegida({ children }: { children: ReactNode }) {
  const { sessao } = useAuth()
  const local = useLocation()
  if (!sessao) return <Navigate to="/login" replace state={{ voltarPara: local.pathname }} />
  return <>{children}</>
}
