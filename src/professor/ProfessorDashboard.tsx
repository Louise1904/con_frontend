import { useEffect, useState } from 'react'
import { apiFetch } from '../api/api'
import { useAuthStore } from '../context/authStore'
import type { Turma } from '../utils/types'

export default function ProfessorDashboard() {
    const user = useAuthStore((state) => state.user)
    const [turmas, setTurmas] = useState<Turma[]>([])
    const [carregando, setCarregando] = useState(true)

    useEffect(() => {
        apiFetch('/api/turmas')
            .then((resposta) => {
                if (!resposta.ok) throw new Error('Falha ao carregar turmas')
                return resposta.json()
            })
            .then((dados: Turma[]) => {
                // Filtrar apenas turmas onde este professor está associado
                const minhasTurmas = Array.isArray(dados)
                    ? dados.filter((t) => t.professores?.some((p: any) => p.funcionarioId === user?.id))
                    : []
                setTurmas(minhasTurmas)
            })
            .catch(() => setTurmas([]))
            .finally(() => setCarregando(false))
    }, [user?.id])

    return (
        <div>
            <h1 className='mb-6 text-3xl font-extrabold text-gray-900 dark:text-white'>
                Minhas Turmas
            </h1>

            <div className='mb-8 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4'>
                <div className='flex items-center gap-2'>
                    <span className='flex items-center justify-center w-10 h-10 rounded-full bg-emerald-100 font-semibold text-emerald-800 text-sm'>
                        {user?.nome?.charAt(0).toUpperCase()}
                    </span>
                    <div>
                        <p className='text-sm font-medium text-gray-900 dark:text-white'>{user?.nome}</p>
                        <p className='text-xs text-emerald-600 dark:text-emerald-400 uppercase'>Professor</p>
                    </div>
                </div>
            </div>

            {carregando ? (
                <p className='text-gray-500 dark:text-gray-400'>Carregando...</p>
            ) : turmas.length === 0 ? (
                <p className='text-gray-500 dark:text-gray-400'>Nenhuma turma encontrada.</p>
            ) : (
                <div className='grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4'>
                    {turmas.map((t) => (
                        <TurmaCard key={t.id} t={t} />
                    ))}
                </div>
            )}
        </div>
    )
}

function TurmaCard({ t }: { t: Turma }) {
    return (
        <div className='rounded-xl border border-gray-200 bg-white p-6 shadow-sm dark:border-gray-700 dark:bg-gray-800'>
            <h3 className='mb-2 text-lg font-bold text-gray-900 dark:text-white'>{t.nome}</h3>
            <p className='mb-1 text-sm text-gray-600 dark:text-gray-300'><strong>Ano:</strong> {t.ano_letivo}</p>
            <p className='mb-1 text-sm text-gray-600 dark:text-gray-300'><strong>Turno:</strong> {t.turno}</p>
            <p className='mb-1 text-sm text-gray-600 dark:text-gray-300'><strong>Sala:</strong> {t.salaId}</p>
            <p className='mb-1 text-sm text-gray-600 dark:text-gray-300'><strong>Capacidade:</strong> {t.capacidade}</p>
            {t.observacao && (
                <p className='mt-2 text-sm text-gray-500 dark:text-gray-400'>{t.observacao}</p>
            )}
        </div>
    )
}