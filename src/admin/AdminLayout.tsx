import { useEffect } from 'react'
import { Link, NavLink, Outlet, useLocation, useNavigate } from 'react-router-dom'
import { useAuthStore } from '../context/authStore'

const ITENS_MENU = [
    { rota: 'dashboard', label: 'Dashboard' },
    { rota: 'turmas', label: 'Turmas' },
    { rota: 'funcionarios', label: 'Funcionários' },
]

export default function AdminLayout() {
    const navigate = useNavigate()
    const location = useLocation()
    const user = useAuthStore((state) => state.user)
    const logout = useAuthStore((state) => state.logout)
    const isAdmin = useAuthStore((state) => state.isAdmin)

    const estaNaLogin = location.pathname === '/login'
    const autenticado = isAdmin()

    useEffect(() => {
        if (!autenticado && !estaNaLogin) {
            navigate('/login', { replace: true })
        }
    }, [autenticado, estaNaLogin, navigate])

    if (!autenticado && estaNaLogin) {
        return (
            <div className="min-h-screen bg-con-fundo">
                <header className="bg-emerald-800 dark:bg-emerald-950 shadow-md">
                    <div className="max-w-7xl mx-auto px-4 py-3 flex items-center justify-between">
                        <div className="flex items-center gap-2">
                            <span className="text-xl font-bold tracking-tight text-white">
                                CON
                            </span>
                            <span className="bg-emerald-700 text-white text-xs font-semibold uppercase tracking-wide rounded-full px-2.5 py-1">
                                Diretor
                            </span>
                        </div>
                        <Link to="/" className="text-sm text-white/80 hover:text-white hover:underline">
                            Voltar ao início
                        </Link>
                    </div>
                </header>
                <main className="max-w-7xl mx-auto px-4 py-6">
                    <Outlet />
                </main>
            </div>
        )
    }

    if (!autenticado && !estaNaLogin) {
        return null
    }

    return (
        <div className="min-h-screen bg-con-fundo">
            <header className="bg-emerald-800 dark:bg-emerald-950 shadow-md sticky top-0 z-50">
                <div className="max-w-7xl mx-auto px-4 py-3 flex items-center justify-between">
                    <Link to="/admin/dashboard" className="flex items-center gap-2">
                        <span className="text-xl font-bold tracking-tight text-white">
                            CON
                        </span>
                        <span className="bg-emerald-700 text-white text-xs font-semibold uppercase tracking-wide rounded-full px-2.5 py-1">
                            Diretor
                        </span>
                    </Link>

                    <div className="flex items-center gap-3">
                        <span className="text-sm text-white/90">
                            {user?.nome}
                        </span>
                        <button
                            type="button"
                            onClick={() => {
                                logout()
                                navigate('/login', { replace: true })
                            }}
                            className="text-sm font-medium text-white/90 hover:text-white transition-colors"
                        >
                            Sair
                        </button>
                    </div>
                </div>
            </header>

            <div className="max-w-7xl mx-auto px-4 py-6 flex flex-col md:flex-row gap-6">
                <nav className="md:w-48 shrink-0">
                    <ul className="flex gap-1 overflow-x-auto md:flex-col md:overflow-visible">
                        {ITENS_MENU.map((item) => (
                            <li key={item.rota} className="shrink-0">
                                <NavLink
                                    to={item.rota}
                                    className={({ isActive }) =>
                                        `block whitespace-nowrap rounded-lg px-3 py-2 text-sm font-medium transition-colors ${
                                            isActive
                                                ? 'bg-emerald-700 text-white'
                                                : 'text-gray-700 hover:bg-gray-200 dark:text-gray-300 dark:hover:bg-gray-800'
                                        }`
                                    }
                                >
                                    {item.label}
                                </NavLink>
                            </li>
                        ))}
                    </ul>
                </nav>

                <main className="min-w-0 flex-1">
                    <Outlet />
                </main>
            </div>
        </div>
    )
}
