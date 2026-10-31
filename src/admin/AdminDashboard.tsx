import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { apiFetch } from '../api/api'
import { useAuthStore } from '../context/authStore'
import type { Turma } from '../utils/types'

export default function AdminDashboard() {
    const user = useAuthStore((state) => state.user)
    const [turmas, setTurmas] = useState<Turma[]>([])
    const [carregando, setCarregando] = useState(true)

    useEffect(() => {
        apiFetch('/api/turmas')
            .then((resposta) => {
                if (!resposta.ok) throw new Error('Falha ao carregar turmas')
                return resposta.json()
            })
            .then((dados: Turma[]) => setTurmas(Array.isArray(dados) ? dados : []))
            .catch(() => setTurmas([]))
            .finally(() => setCarregando(false))
    }, [])

    return (
        <div>
            <h1 className="mb-6 text-3xl font-extrabold text-gray-900 dark:text-white">
                Painel do Diretor
            </h1>

            <div className="mb-8 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                <div className="flex items-center gap-2">
                    <span className="flex items-center justify-center w-10 h-10 rounded-full bg-emerald-100 font-semibold text-emerald-800 text-sm">
                        {user?.nome?.charAt(0).toUpperCase()}
                    </span>
                    <div>
                        <p className="text-sm font-medium text-gray-900 dark:text-white">
                            {user?.nome}
                        </p>
                        <p className="text-xs text-emerald-600 dark:text-emerald-400 uppercase">
                            Diretor (ADM)
                        </p>
                    </div>
                </div>

                <div className="flex gap-2">
                    <LinkTurmas />
                </div>
            </div>

            {carregando && (
                <p className="text-gray-500 dark:text-gray-400">Carregando...</p>
            )}

            {!carregando && (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                    <StatCard
                        titulo="Turmas cadastradas"
                        valor={turmas.length}
                        icone="🏫"
                    />
                    <StatCard
                        titulo="Total de alunos"
                        valor="—"
                        icone="👨‍🎓"
                    />
                    <StatCard
                        titulo="Chamadas realizadas"
                        valor="—"
                        icone="✅"
                    />
                </div>
            )}
        </div>
    )
}

function LinkTurmas() {
    return (
        <Link
            to='/admin/turmas'
            className='rounded-lg bg-emerald-700 px-4 py-2 font-medium text-white hover:bg-emerald-800 transition-colors'
        >
            Gerenciar Turmas
        </Link>
    )
}

function StatCard({
    titulo,
    valor,
    icone,
}: {
    titulo: string
    valor: string | number
    icone: string
}) {
    return (
        <div className='rounded-xl border border-gray-200 bg-white p-6 shadow-sm dark:border-gray-700 dark:bg-gray-800'>
            <div className='flex items-center gap-4'>
                <span className='text-2xl'>{icone}</span>
                <div>
                    <p className='text-sm text-gray-500 dark:text-gray-400'>{titulo}</p>
                    <p className='text-2xl font-bold text-gray-900 dark:text-white'>{valor}</p>
                </div>
            </div>
        </div>
    )
}