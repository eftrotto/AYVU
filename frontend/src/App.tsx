import { Navigate, Route, Routes } from 'react-router-dom'
import { ProtectedRoute } from './components/layout/ProtectedRoute'
import { LoginPage } from './features/auth/LoginPage'
import { AlunoEntrada } from './features/dashboard/AlunoEntrada'
import { ProfessorDashboard } from './features/professor/ProfessorDashboard'
import { MacuPage } from './features/macu/MacuPage'
import { RekoPage } from './features/reko/RekoPage'
import { LagoaCena } from './features/ayvu/lagoa/LagoaCena'
import { ComoEstudarPage } from './features/ayvu/lagoa/ComoEstudarPage'
import { TemaExploracaoPage } from './features/ayvu/lagoa/TemaExploracaoPage'

export default function App() {
  return (
    <Routes>
      <Route path="/login" element={<LoginPage />} />

      <Route
        path="/aluno"
        element={
          <ProtectedRoute tipoEsperado="aluno">
            <AlunoEntrada />
          </ProtectedRoute>
        }
      />
      <Route
        path="/aluno/macu"
        element={
          <ProtectedRoute tipoEsperado="aluno">
            <MacuPage />
          </ProtectedRoute>
        }
      />
      <Route
        path="/aluno/reko"
        element={
          <ProtectedRoute tipoEsperado="aluno">
            <RekoPage />
          </ProtectedRoute>
        }
      />
      <Route
        path="/aluno/ayvu"
        element={
          <ProtectedRoute tipoEsperado="aluno">
            <LagoaCena />
          </ProtectedRoute>
        }
      />
      <Route
        path="/aluno/ayvu/estudar/:tema"
        element={
          <ProtectedRoute tipoEsperado="aluno">
            <ComoEstudarPage />
          </ProtectedRoute>
        }
      />
      <Route
        path="/aluno/ayvu/explorar/:tema/:modo"
        element={
          <ProtectedRoute tipoEsperado="aluno">
            <TemaExploracaoPage />
          </ProtectedRoute>
        }
      />

      <Route
        path="/professor"
        element={
          <ProtectedRoute tipoEsperado="professor">
            <ProfessorDashboard />
          </ProtectedRoute>
        }
      />

      <Route path="*" element={<Navigate to="/login" replace />} />
    </Routes>
  )
}
