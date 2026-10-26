import { useState } from 'react'
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { User } from './types/disciplina'
import Login from './pages/Login'
import Layout from './components/Layout'
import ListaDisciplinas from './pages/disciplinas/ListaDisciplinas'
import CadastrarDisciplina from './pages/disciplinas/CadastrarDisciplina'
import EditarDisciplina from './pages/disciplinas/EditarDisciplina'

function ProfessorHome({ user }: { user: User }) {
  return (
    <div className="p-8 flex items-center justify-center min-h-[60vh]">
      <div className="text-center">
        <div className="text-6xl mb-4">👨‍🏫</div>
        <h1 className="text-2xl font-bold text-gray-800">
          Bem-vindo, Professor!
        </h1>
        <p className="text-gray-500 mt-2">
          Logado como: <span className="font-medium text-emerald-700">{user?.email || 'Professor'}</span>
        </p>
        <p className="text-gray-400 text-sm mt-4">
          As demais funcionalidades estarão disponíveis em breve.
        </p>
      </div>
    </div>
  )
}

export default function App() {
  // Carrega direto do localStorage na inicialização síncrona
  const [user, setUser] = useState<User | null>(() => {
    try {
      const userSalvo = localStorage.getItem('user')
      if (!userSalvo) return null
      const parsed = JSON.parse(userSalvo)
      // Valida se o objeto salvo tem os dados esperados
      if (parsed && typeof parsed === 'object' && (parsed.email || parsed.tipo)) {
        return parsed
      }
      localStorage.removeItem('user')
      return null
    } catch {
      localStorage.removeItem('user')
      return null
    }
  })

  const handleLoginSuccess = (novoUser: User) => {
    setUser(novoUser)
  }

  const handleLogout = () => {
    localStorage.removeItem('user')
    setUser(null)
  }

  return (
    <BrowserRouter>
      {!user ? (
        <Login onLoginSuccess={handleLoginSuccess} />
      ) : (
        <Layout user={user} onLogout={handleLogout}>
          <Routes>
            {user.tipo === 'ADM' ? (
              <>
                <Route path="/disciplinas" element={<ListaDisciplinas />} />
                <Route path="/disciplinas/nova" element={<CadastrarDisciplina />} />
                <Route path="/disciplinas/:id/editar" element={<EditarDisciplina />} />
                <Route path="*" element={<Navigate to="/disciplinas" replace />} />
              </>
            ) : (
              <>
                <Route path="*" element={<ProfessorHome user={user} />} />
              </>
            )}
          </Routes>
        </Layout>
      )}
    </BrowserRouter>
  )
}
