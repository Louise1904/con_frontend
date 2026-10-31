import { useEffect, type ReactNode } from 'react'
import { Link, NavLink, Outlet, useNavigate } from 'react-router-dom'
import { useAuthStore } from '../context/authStore'
import {
    IconeAlunos,
    IconeChamada,
    IconeDisciplinas,
    IconeExportar,
    IconeFuncionarios,
    IconeSalas,
    IconeTurmas,
} from './icones'

type ItemMenu = { rota: string; label: string; icone: ReactNode }

// Menu agrupado por seções (o Início é acessado clicando em "CON" no cabeçalho)
const SECOES_MENU: { titulo: string; itens: ItemMenu[] }[] = [
    {
        titulo: 'Frequência',
        itens: [
            { rota: 'chamada', label: 'Chamada', icone: <IconeChamada /> },
            { rota: 'exportar', label: 'Exportar', icone: <IconeExportar /> },
        ],
    },
    {
        titulo: 'Cadastros',
        itens: [
            { rota: 'alunos', label: 'Alunos', icone: <IconeAlunos /> },
            { rota: 'turmas', label: 'Turmas', icone: <IconeTurmas /> },
            { rota: 'salas', label: 'Salas', icone: <IconeSalas /> },
            { rota: 'disciplinas', label: 'Disciplinas', icone: <IconeDisciplinas /> },
            { rota: 'funcionarios', label: 'Funcionários', icone: <IconeFuncionarios /> },
        ],
    },
]

// "Direcao Geral" -> "DG" (para o avatar)
function iniciais(nome?: string) {
    if (!nome) return '?'
    const partes = nome.trim().split(/\s+/)
    const primeira = partes[0]?.[0] ?? ''
    const ultima = partes.length > 1 ? partes[partes.length - 1][0] : ''
    return (primeira + ultima).toUpperCase()
}

export default function AdminLayout() {
    const navigate = useNavigate()
    const user = useAuthStore((state) => state.user)
    const logout = useAuthStore((state) => state.logout)
    const isAdmin = useAuthStore((state) => state.isAdmin)

    const autenticado = isAdmin()

    // Só diretores entram na área de admin
    useEffect(() => {
        if (!autenticado) {
            navigate('/login', { replace: true })
        }
    }, [autenticado, navigate])

    if (!autenticado) {
        return null
    }

    function sair() {
        logout()
        navigate('/login', { replace: true })
    }

    return (
        <div className="flex min-h-screen flex-col bg-con-fundo">
            {/* ---------- Cabeçalho (largura total) ---------- */}
            <header className="sticky top-0 z-50 h-16 shrink-0 bg-emerald-800 shadow-md dark:bg-emerald-950">
                <div className="flex h-full items-center justify-between px-6">
                    {/* Nome do sistema: clicar leva para o Início */}
                    <Link
                        to="/admin/inicio"
                        title="Voltar ao início"
                        className="leading-tight transition-opacity hover:opacity-80"
                    >
                        <p className="text-xl font-extrabold tracking-tight text-white">CON</p>
                        <p className="text-xs text-emerald-100">Controle Acadêmico</p>
                    </Link>

                    {/* Usuário logado + Sair */}
                    <div className="flex items-center gap-4">
                        <div className="flex items-center gap-3">
                            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-white text-sm font-bold text-emerald-800">
                                {iniciais(user?.nome)}
                            </div>
                            <div className="hidden leading-tight sm:block">
                                <p className="text-sm font-semibold text-white">{user?.nome}</p>
                                <span className="inline-block rounded-full bg-emerald-600 px-2 py-0.5 text-[11px] font-semibold uppercase tracking-wide text-white">
                                    Direção
                                </span>
                            </div>
                        </div>

                        <div className="h-8 w-px bg-emerald-600" />

                        <button
                            type="button"
                            onClick={sair}
                            className="flex items-center gap-2 rounded-lg border border-white/40 px-3 py-1.5 text-sm font-medium text-white transition-colors hover:bg-white hover:text-emerald-800"
                        >
                            <svg
                                xmlns="http://www.w3.org/2000/svg"
                                viewBox="0 0 24 24"
                                fill="none"
                                stroke="currentColor"
                                strokeWidth={2}
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                className="h-4 w-4"
                                aria-hidden="true"
                            >
                                <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
                                <polyline points="16 17 21 12 16 7" />
                                <line x1="21" y1="12" x2="9" y2="12" />
                            </svg>
                            Sair
                        </button>
                    </div>
                </div>
            </header>

            <div className="flex flex-1 flex-col md:flex-row">
                {/* ---------- Menu lateral colado à esquerda ---------- */}
                <aside className="flex shrink-0 flex-col border-b border-emerald-100 bg-emerald-50 md:sticky md:top-16 md:h-[calc(100vh-4rem)] md:w-60 md:border-b-0 md:border-r dark:border-gray-800 dark:bg-gray-900">
                    <nav className="flex-1 overflow-x-auto px-3 py-3 md:overflow-y-auto md:py-6">
                        <div className="flex gap-1 md:flex-col md:gap-5">
                            {SECOES_MENU.map((secao) => (
                                <div key={secao.titulo} className="flex gap-1 md:flex-col">
                                    {/* Título da seção (só no computador) */}
                                    <p className="mb-1 hidden px-4 text-[11px] font-semibold uppercase tracking-wider text-emerald-700/70 md:block dark:text-emerald-400/70">
                                        {secao.titulo}
                                    </p>

                                    {secao.itens.map((item) => (
                                        <NavLink
                                            key={item.rota}
                                            to={item.rota}
                                            className={({ isActive }) =>
                                                `flex items-center gap-3 whitespace-nowrap rounded-r-lg border-l-4 px-4 py-2.5 text-sm font-medium transition-colors ${
                                                    isActive
                                                        ? 'border-emerald-700 bg-white text-emerald-800 shadow-sm dark:bg-gray-800 dark:text-emerald-300'
                                                        : 'border-transparent text-gray-600 hover:bg-emerald-100 hover:text-emerald-800 dark:text-gray-400 dark:hover:bg-gray-800'
                                                }`
                                            }
                                        >
                                            {item.icone}
                                            {item.label}
                                        </NavLink>
                                    ))}
                                </div>
                            ))}
                        </div>
                    </nav>

                    {/* Rodapé da barra (só no computador) */}
                    <div className="hidden border-t border-emerald-100 px-6 py-4 text-xs text-emerald-700/70 md:block dark:border-gray-800 dark:text-gray-500">
                        CON · Controle Acadêmico
                    </div>
                </aside>

                {/* ---------- Conteúdo da página ---------- */}
                <main className="min-w-0 flex-1 px-4 py-6 md:px-8">
                    <Outlet />
                </main>
            </div>
        </div>
    )
}