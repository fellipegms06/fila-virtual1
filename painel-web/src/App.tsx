import { Navigate, Route, Routes } from 'react-router-dom'
import { RotaProtegida } from './auth/RotaProtegida'
import { Layout } from './componentes/Layout'
import { AvisosPage } from './paginas/AvisosPage'
import { CheckinPage } from './paginas/CheckinPage'
import { FilaPage } from './paginas/FilaPage'
import { IndicadoresPage } from './paginas/IndicadoresPage'
import { LoginPage } from './paginas/LoginPage'
import { SenhaPresencialPage } from './paginas/SenhaPresencialPage'

export function App() {
  return (
    <Routes>
      <Route path="/login" element={<LoginPage />} />
      <Route
        element={
          <RotaProtegida>
            <Layout />
          </RotaProtegida>
        }
      >
        <Route index element={<FilaPage />} />
        <Route path="checkin" element={<CheckinPage />} />
        <Route path="senha-presencial" element={<SenhaPresencialPage />} />
        <Route path="indicadores" element={<IndicadoresPage />} />
        <Route path="avisos" element={<AvisosPage />} />
      </Route>
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  )
}
