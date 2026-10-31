import { useEffect, useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { toast } from 'sonner'
import { apiFetch } from '../api/api'
import type { Turma } from '../utils/types'

const turmaSchema = z.object({
    nome: z.string().trim().min(1, 'Nome da turma é obrigatório').max(50),
    ano_letivo: z.string().trim().min(1, 'Ano letivo é obrigatório').regex(/^\d+$/, 'Ano letivo deve ser um número'),
    turno: z.string().trim().min(1, 'Turno é obrigatório').max(20),
    salaId: z.string().trim().min(1, 'Sala é obrigatória').regex(/^\d+$/, 'Sala deve ser um número'),
    capacidade: z.string().trim().min(1, 'Capacidade é obrigatória').regex(/^\d+$/, 'Capacidade deve ser um número'),
    observacao: z.string().trim().max(10000).optional(),
})

type TurmaForm = z.infer<typeof turmaSchema>

export default function AdminTurmas() {
    const [turmas, setTurmas] = useState<Turma[]>([])
    const [carregando, setCarregando] = useState(true)
    const [enviando, setEnviando] = useState(false)
    const [excluindoId, setExcluindoId] = useState<number | null>(null)

    const { register, handleSubmit, reset, formState: { errors } } =
        useForm<TurmaForm>({
            resolver: zodResolver(turmaSchema),
            defaultValues: {
                nome: '',
                ano_letivo: '',
                turno: '',
                salaId: '',
                capacidade: '',
                observacao: '',
            },
        })

    async function carregarTurmas() {
        setCarregando(true)
        try {
            const resposta = await apiFetch('/api/turmas')
            if (!resposta.ok) throw new Error('Falha ao carregar turmas')
            const dados = await resposta.json()
            setTurmas(Array.isArray(dados) ? dados : [])
        } catch {
            toast.error('Não foi possível carregar as turmas')
        } finally {
            setCarregando(false)
        }
    }

    useEffect(() => {
        carregarTurmas()
    }, [])

    async function cadastrarTurma(dados: TurmaForm) {
        setEnviando(true)
        try {
            const resposta = await apiFetch('/api/turmas', {
                method: 'POST',
                body: JSON.stringify({
                    nome: dados.nome.trim(),
                    ano_letivo: Number(dados.ano_letivo),
                    turno: dados.turno.trim(),
                    salaId: Number(dados.salaId),
                    capacidade: Number(dados.capacidade),
                    observacao: dados.observacao?.trim() || null,
                }),
            })

            if (!resposta.ok) {
                const corpo = await resposta.json().catch(() => null)
                toast.error(corpo?.erro ?? 'Não foi possível cadastrar a turma')
                return
            }

            toast.success('Turma cadastrada com sucesso!')
            reset({
                nome: '',
                ano_letivo: '',
                turno: '',
                salaId: '',
                capacidade: '',
                observacao: '',
            })
            await carregarTurmas()
        } catch {
            toast.error('Erro de conexão com o servidor')
        } finally {
            setEnviando(false)
        }
    }

    async function excluirTurma(id: number) {
        if (!confirm('Excluir esta turma? Essa ação não pode ser desfeita.')) {
            return
        }

        setExcluindoId(id)
        try {
            const resposta = await apiFetch(`/api/turmas/${id}`, {
                method: 'DELETE',
            })

            if (!resposta.ok) {
                const corpo = await resposta.json().catch(() => null)
                toast.error(corpo?.erro ?? 'Não foi possível excluir a turma')
                return
            }

            toast.success('Turma excluída com sucesso')
            setTurmas((atual) => atual.filter((item) => item.id !== id))
        } catch {
            toast.error('Erro de conexão com o servidor')
        } finally {
            setExcluindoId(null)
        }
    }

    return (
        <div className='mx-auto max-w-5xl'>
            <div className='mb-6'>
                <h1 className='text-3xl font-extrabold text-gray-900 dark:text-white'>
                    Gerenciar Turmas
                </h1>
                <p className='mt-2 text-sm text-gray-600 dark:text-gray-400'>
                    Somente diretores podem criar, editar ou excluir turmas.
                </p>
            </div>

            <form
                onSubmit={handleSubmit(cadastrarTurma)}
                className='grid gap-4 rounded-xl border border-gray-200 bg-white p-6 shadow-sm dark:border-gray-700 dark:bg-gray-800'
            >
                <div className='grid gap-4 md:grid-cols-3'>
                    <div>
                        <label className='mb-1 block text-sm font-medium text-gray-700 dark:text-gray-300'>
                            Nome da Turma
                        </label>
                        <input
                            type='text'
                            {...register('nome')}
                            className='w-full rounded-lg border border-gray-300 px-3 py-2 text-gray-900 outline-none focus:border-emerald-600 dark:border-gray-600 dark:bg-gray-900 dark:text-white'
                        />
                        {errors.nome && (
                            <p className='mt-1 text-sm text-red-600'>{errors.nome.message}</p>
                        )}
                    </div>

                    <div>
                        <label className='mb-1 block text-sm font-medium text-gray-700 dark:text-gray-300'>
                            Ano Letivo
                        </label>
                        <input
                            type='number'
                            placeholder='Ex: 2024'
                            {...register('ano_letivo')}
                            className='w-full rounded-lg border border-gray-300 px-3 py-2 text-gray-900 outline-none focus:border-emerald-600 dark:border-gray-600 dark:bg-gray-900 dark:text-white'
                        />
                        {errors.ano_letivo && (
                            <p className='mt-1 text-sm text-red-600'>{errors.ano_letivo.message}</p>
                        )}
                    </div>

                    <div>
                        <label className='mb-1 block text-sm font-medium text-gray-700 dark:text-gray-300'>
                            Turno
                        </label>
                        <input
                            type='text'
                            placeholder='Ex: Manhã, Tarde, Integral'
                            {...register('turno')}
                            className='w-full rounded-lg border border-gray-300 px-3 py-2 text-gray-900 outline-none focus:border-emerald-600 dark:border-gray-600 dark:bg-gray-900 dark:text-white'
                        />
                        {errors.turno && (
                            <p className='mt-1 text-sm text-red-600'>{errors.turno.message}</p>
                        )}
                    </div>

                    <div>
                        <label className='mb-1 block text-sm font-medium text-gray-700 dark:text-gray-300'>
                            Sala (ID)
                        </label>
                        <input
                            type='number'
                            placeholder='ID da sala'
                            {...register('salaId')}
                            className='w-full rounded-lg border border-gray-300 px-3 py-2 text-gray-900 outline-none focus:border-emerald-600 dark:border-gray-600 dark:bg-gray-900 dark:text-white'
                        />
                        {errors.salaId && (
                            <p className='mt-1 text-sm text-red-600'>{errors.salaId.message}</p>
                        )}
                    </div>

                    <div>
                        <label className='mb-1 block text-sm font-medium text-gray-700 dark:text-gray-300'>
                            Capacidade
                        </label>
                        <input
                            type='number'
                            min='1'
                            {...register('capacidade')}
                            className='w-full rounded-lg border border-gray-300 px-3 py-2 text-gray-900 outline-none focus:border-emerald-600 dark:border-gray-600 dark:bg-gray-900 dark:text-white'
                        />
                        {errors.capacidade && (
                            <p className='mt-1 text-sm text-red-600'>{errors.capacidade.message}</p>
                        )}
                    </div>

                    <div>
                        <label className='mb-1 block text-sm font-medium text-gray-700 dark:text-gray-300'>
                            Observação (opcional)
                        </label>
                        <textarea
                            rows={3}
                            {...register('observacao')}
                            className='w-full rounded-lg border border-gray-300 px-3 py-2 text-gray-900 outline-none focus:border-emerald-600 dark:border-gray-600 dark:bg-gray-900 dark:text-white'
                        />
                    </div>
                </div>

                <div className='flex gap-3'>
                    <button
                        type='submit'
                        disabled={enviando}
                        className='rounded-lg bg-emerald-700 px-4 py-2 font-medium text-white hover:bg-emerald-800 disabled:opacity-50 disabled:cursor-not-allowed transition-colors'
                    >
                        {enviando ? 'Cadastrando...' : 'Cadastrar Turma'}
                    </button>
                </div>
            </form>

            <section className='mt-10'>
                <div className='mb-4 flex items-center justify-between gap-3'>
                    <h2 className='text-2xl font-bold text-gray-900 dark:text-white'>
                        Turmas Cadastradas
                    </h2>
                </div>

                {carregando && <p className='text-gray-500 dark:text-gray-400'>Carregando turmas...</p>}

                {!carregando && turmas.length === 0 && (
                    <p className='text-gray-500 dark:text-gray-400'>
                        Nenhuma turma cadastrada ainda.
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
                                    <th className='px-4 py-3 text-right font-medium'>Ações</th>
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
                                        <td className='px-4 py-3'>
                                            <div className='flex justify-end gap-2'>
                                                <button
                                                    type='button'
                                                    disabled={excluindoId === t.id}
                                                    onClick={() => excluirTurma(Number(t.id))}
                                                    className='rounded-lg border border-red-600 px-3 py-1.5 text-sm font-medium text-red-600 hover:bg-red-50 disabled:opacity-50 dark:hover:bg-red-950'
                                                >
                                                    {excluindoId === t.id ? 'Excluindo...' : 'Excluir'}
                                                </button>
                                            </div>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                )}
            </section>
        </div>
    )
}