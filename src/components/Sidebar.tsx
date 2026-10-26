import { NavLink } from 'react-router-dom'
import { User } from '../types/disciplina'

interface SidebarProps {
  user: User
  onLogout: () => void
}

const navItems = [
  { label: 'Alunos', to: '/alunos', icon: '👤' },
  { label: 'Funcionários', to: '/funcionarios', icon: '🧑‍💼' },
  { label: 'Chamada', to: '/chamada', icon: '📋' },
  { label: 'Turmas', to: '/turmas', icon: '🏫' },
  { label: 'Disciplinas', to: '/disciplinas', icon: '📚' },
  { label: 'Exportar', to: '/exportar', icon: '📤' },
]

export default function Sidebar({ user, onLogout }: SidebarProps) {
  const handleLogout = () => {
    localStorage.removeItem('user')
    onLogout()
  }

  return (
    <aside className="w-64 min-h-screen bg-emerald-800 flex flex-col">
      {/* Logo */}
      <div className="flex flex-col items-center py-8 border-b border-emerald-700">
        <div className="bg-white rounded-xl w-14 h-14 flex items-center justify-center mb-3 shadow">
          <span className="text-emerald-700 text-xl font-black tracking-tight">CON</span>
        </div>
        <span className="text-white text-sm font-semibold">Controle de Chamada</span>
        <span className="text-emerald-300 text-xs mt-0.5">Acadêmica</span>
      </div>

      {/* Navegação */}
      <nav className="flex-1 py-4 px-3 space-y-1">
        {navItems.map((item) => (
          <NavLink
            key={item.to}
            to={item.to}
            className={({ isActive }) =>
              `flex items-center gap-3 px-4 py-2.5 rounded-lg text-sm font-medium transition-colors duration-150 ${
                isActive
                  ? 'bg-emerald-600 text-white'
                  : 'text-emerald-100 hover:bg-emerald-700 hover:text-white'
              }`
            }
          >
            <span>{item.icon}</span>
            {item.label}
          </NavLink>
        ))}
      </nav>

      {/* Rodapé com usuário e logout */}
      <div className="border-t border-emerald-700 p-4">
        <div className="flex items-center gap-3 mb-3">
          <div className="bg-emerald-600 rounded-full w-9 h-9 flex items-center justify-center flex-shrink-0">
            <span className="text-white text-sm font-bold">
              {user?.email ? user.email.charAt(0).toUpperCase() : 'U'}
            </span>
          </div>
          <div className="min-w-0">
            <p className="text-white text-xs font-semibold truncate">{user?.email || 'Usuário'}</p>
            <p className="text-emerald-300 text-xs">{user?.tipo === 'ADM' ? 'Diretor' : 'Professor'}</p>
          </div>
        </div>
        <button
          onClick={handleLogout}
          className="w-full flex items-center justify-center gap-2 bg-emerald-700 hover:bg-emerald-600 text-white text-sm font-medium py-2 px-3 rounded-lg transition-colors duration-150"
        >
          <span>🚪</span>
          Sair
        </button>
      </div>
    </aside>
  )
}
