import { Navigate, Route, Routes } from 'react-router-dom'
import { ProtectedRoute } from './components/layout/ProtectedRoute'
import { LoginPage } from './features/auth/LoginPage'
import { AlunoDashboard } from './features/dashboard/AlunoDashboard'
import { ProfessorDashboard } from './features/professor/ProfessorDashboard'
import { MacuPage } from './features/macu/MacuPage'
import { RekoPage } from './features/reko/RekoPage'
import { AyvuHomePage } from './features/ayvu/AyvuHomePage'
import { AyvuTemaPage } from './features/ayvu/AyvuTemaPage'

export default function App() {
  return (
    <Routes>
      <Route path="/login" element={<LoginPage />} />

      <Route
        path="/aluno"
        element={
          <ProtectedRoute tipoEsperado="aluno">
            <AlunoDashboard />
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
            <AyvuHomePage />
          </ProtectedRoute>
        }
      />
      <Route
        path="/aluno/ayvu/:temaId"
        element={
          <ProtectedRoute tipoEsperado="aluno">
            <AyvuTemaPage />
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
