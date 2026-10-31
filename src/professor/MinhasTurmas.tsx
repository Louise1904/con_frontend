import { useEffect, useState } from 'react'
import { apiFetch } from '../api/api'
import { useAuthStore } from '../context/authStore'
import type { Turma } from '../utils/types'

export default function MinhasTurmas() {
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
        <div className='mx-auto max-w-5xl'>
            <h1 className='mb-6 text-3xl font-extrabold text-gray-900 dark:text-white'>
                Minhas Turmas
            </h1>

            {carregando && <p className='text-gray-500 dark:text-gray-400'>Carregando turmas...</p>}

            {!carregando && turmas.length === 0 && (
                <p className='text-gray-500 dark:text-gray-400'>
                    Nenhuma turma atribuída a você.
                </p>
            )}

            {!carregando && turmas.length > 0 && (
                <div className='overflow-x-auto rounded-xl border border-gray-200 bg-white shadow-sm dark:border-gray-700 dark:bg-gray-800'>
                    <table className='w-full text-left text-sm'>
                        <thead>
                            <tr className='border-b border-gray-200 text-gray-500 dark:border-gray-700 dark:text-gray-400'>
                                <th className='px-4 py-3 font-medium'>Nome</th>
                                <th className='px-4 py-3 font-medium'>Ano</th>
                                <th className='px-4 py-3 font-medium'>Turno</th>
                                <th className='px-4 py-3 font-medium'>Sala</th>
                                <th className='px-4 py-3 font-medium'>Capacidade</th>
                            </tr>
                        </thead>
                        <tbody>
                            {turmas.map((t) => (
                                <tr key={t.id} className='border-b border-gray-100 last:border-0 dark:border-gray-700'>
                                    <td className='px-4 py-3 text-gray-900 dark:text-white'>{t.nome}</td>
                                    <td className='px-4 py-3 text-gray-700 dark:text-gray-300'>{t.ano_letivo}</td>
                                    <td className='px-4 py-3 text-gray-700 dark:text-gray-300'>{t.turno}</td>
                                    <td className='px-4 py-3 text-gray-700 dark:text-gray-300'>{t.salaId}</td>
                                    <td className='px-4 py-3 text-gray-700 dark:text-gray-300'>{t.capacidade}</td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            )}
        </div>
    )
}