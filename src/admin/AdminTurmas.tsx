import { useEffect, useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { toast } from 'sonner'
import { apiFetch, lerErro } from '../api/api'

// Formato que o back devolve em GET /api/turmas
type Turma = {
    id: number
    nome: string
    ano_letivo: number
    turno: string
    capacidade: number
    observacao: string | null
    salaId: number
    sala: { id: number; nome: string; numero: string }
    professores: { funcionario: { id: number; nome: string } }[]
    _count: { alunos: number }
}

// Formato que o back devolve em GET /api/salas
type Sala = {
    id: number
    nome: string
    numero: string
    capacidade: number
    ativa: boolean
}

const TURNOS = ['Manhã', 'Tarde', 'Integral']

const turmaSchema = z.object({
    nome: z.string().trim().min(1, 'Nome da turma é obrigatório').max(50),
    ano_letivo: z.string().regex(/^\d{4}$/, 'Informe o ano com 4 dígitos'),
    turno: z.string().min(1, 'Selecione o turno'),
    salaId: z.string().min(1, 'Selecione a sala'),
    capacidade: z.string().regex(/^\d+$/, 'Capacidade deve ser um número'),
    observacao: z.string().trim().max(10000),
})

type TurmaForm = z.infer<typeof turmaSchema>

const FORM_VAZIO: TurmaForm = {
    nome: '',
    ano_letivo: String(new Date().getFullYear()),
    turno: '',
    salaId: '',
    capacidade: '',
    observacao: '',
}

const CLASSE_INPUT =
    'w-full rounded-lg border border-gray-300 px-3 py-2 text-gray-900 outline-none focus:border-emerald-600 dark:border-gray-600 dark:bg-gray-900 dark:text-white'
const CLASSE_LABEL = 'mb-1 block text-sm font-medium text-gray-700 dark:text-gray-300'

export default function AdminTurmas() {
    const [turmas, setTurmas] = useState<Turma[]>([])
    const [salas, setSalas] = useState<Sala[]>([])
    const [carregando, setCarregando] = useState(true)
    const [enviando, setEnviando] = useState(false)
    const [excluindoId, setExcluindoId] = useState<number | null>(null)
    // null = cadastrando uma nova; número = editando essa turma
    const [editandoId, setEditandoId] = useState<number | null>(null)

    const { register, handleSubmit, reset, formState: { errors } } =
        useForm<TurmaForm>({
            resolver: zodResolver(turmaSchema),
            defaultValues: FORM_VAZIO,
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

    async function carregarSalas() {
        try {
            const resposta = await apiFetch('/api/salas')
            if (!resposta.ok) throw new Error('Falha ao carregar salas')
            const dados = await resposta.json()
            setSalas(Array.isArray(dados) ? dados : [])
        } catch {
            toast.error('Não foi possível carregar as salas')
        }
    }

    useEffect(() => {
        carregarTurmas()
        carregarSalas()
    }, [])

    // Preenche o formulário com os dados da turma escolhida
    function iniciarEdicao(t: Turma) {
        setEditandoId(t.id)
        reset({
            nome: t.nome,
            ano_letivo: String(t.ano_letivo),
            turno: t.turno,
            salaId: String(t.salaId),
            capacidade: String(t.capacidade),
            observacao: t.observacao ?? '',
        })
        window.scrollTo({ top: 0, behavior: 'smooth' })
    }

    function cancelarEdicao() {
        setEditandoId(null)
        reset(FORM_VAZIO)
    }

    async function salvarTurma(dados: TurmaForm) {
        // O formulário trabalha com texto; o back espera números
        const corpo = {
            nome: dados.nome,
            ano_letivo: Number(dados.ano_letivo),
            turno: dados.turno,
            salaId: Number(dados.salaId),
            capacidade: Number(dados.capacidade),
            observacao: dados.observacao || null,
        }

        setEnviando(true)
        try {
            const resposta = await apiFetch(
                editandoId ? `/api/turmas/${editandoId}` : '/api/turmas',
                {
                    method: editandoId ? 'PUT' : 'POST',
                    body: JSON.stringify(corpo),
                },
            )

            if (!resposta.ok) {
                toast.error(await lerErro(resposta, 'Não foi possível salvar a turma'))
                return
            }

            toast.success(editandoId ? 'Turma atualizada com sucesso!' : 'Turma cadastrada com sucesso!')
            cancelarEdicao()
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
            const resposta = await apiFetch(`/api/turmas/${id}`, { method: 'DELETE' })

            if (!resposta.ok) {
                toast.error(await lerErro(resposta, 'Não foi possível excluir a turma'))
                return
            }

            toast.success('Turma excluída com sucesso')
            setTurmas((atual) => atual.filter((item) => item.id !== id))
            if (editandoId === id) cancelarEdicao()
        } catch {
            toast.error('Erro de conexão com o servidor')
        } finally {
            setExcluindoId(null)
        }
    }

    // Se a turma editada tiver um turno fora da lista (ex: "Manha" do seed), mantém como opção
    const turnosDasTurmas = turmas.map((t) => t.turno).filter((t) => !TURNOS.includes(t))
    const opcoesTurno = [...TURNOS, ...new Set(turnosDasTurmas)]

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
                onSubmit={handleSubmit(salvarTurma)}
                className='grid gap-4 rounded-xl border border-gray-200 bg-white p-6 shadow-sm dark:border-gray-700 dark:bg-gray-800'
            >
                <h2 className='text-lg font-semibold text-gray-900 dark:text-white'>
                    {editandoId ? 'Editar Turma' : 'Nova Turma'}
                </h2>

                <div className='grid gap-4 md:grid-cols-2 lg:grid-cols-3'>
                    <div>
                        <label className={CLASSE_LABEL}>Nome da turma</label>
                        <input type='text' placeholder='Ex: Maternal A' {...register('nome')} className={CLASSE_INPUT} />
                        {errors.nome && <p className='mt-1 text-sm text-red-600'>{errors.nome.message}</p>}
                    </div>

                    <div>
                        <label className={CLASSE_LABEL}>Ano letivo</label>
                        <input type='text' inputMode='numeric' placeholder='2026' {...register('ano_letivo')} className={CLASSE_INPUT} />
                        {errors.ano_letivo && <p className='mt-1 text-sm text-red-600'>{errors.ano_letivo.message}</p>}
                    </div>

                    <div>
                        <label className={CLASSE_LABEL}>Turno</label>
                        <select {...register('turno')} className={CLASSE_INPUT}>
                            <option value=''>Selecione</option>
                            {opcoesTurno.map((turno) => (
                                <option key={turno} value={turno}>
                                    {turno}
                                </option>
                            ))}
                        </select>
                        {errors.turno && <p className='mt-1 text-sm text-red-600'>{errors.turno.message}</p>}
                    </div>

                    <div>
                        <label className={CLASSE_LABEL}>Sala</label>
                        <select {...register('salaId')} className={CLASSE_INPUT}>
                            <option value=''>Selecione</option>
                            {salas.map((s) => (
                                <option key={s.id} value={s.id} disabled={!s.ativa}>
                                    {s.nome} ({s.numero}) - até {s.capacidade} alunos
                                    {!s.ativa ? ' - inativa' : ''}
                                </option>
                            ))}
                        </select>
                        {salas.length === 0 && (
                            <p className='mt-1 text-xs text-gray-500'>Nenhuma sala cadastrada no sistema.</p>
                        )}
                        {errors.salaId && <p className='mt-1 text-sm text-red-600'>{errors.salaId.message}</p>}
                    </div>

                    <div>
                        <label className={CLASSE_LABEL}>Capacidade</label>
                        <input type='text' inputMode='numeric' placeholder='Ex: 25' {...register('capacidade')} className={CLASSE_INPUT} />
                        {errors.capacidade && <p className='mt-1 text-sm text-red-600'>{errors.capacidade.message}</p>}
                    </div>

                    <div className='md:col-span-2 lg:col-span-3'>
                        <label className={CLASSE_LABEL}>Observação (opcional)</label>
                        <textarea
                            rows={3}
                            placeholder='Digite uma observação'
                            {...register('observacao')}
                            className={CLASSE_INPUT}
                        />
                    </div>
                </div>

                <div className='flex gap-3'>
                    <button
                        type='submit'
                        disabled={enviando}
                        className='rounded-lg bg-emerald-700 px-4 py-2 font-medium text-white hover:bg-emerald-800 disabled:opacity-50 disabled:cursor-not-allowed transition-colors'
                    >
                        {enviando ? 'Salvando...' : editandoId ? 'Salvar Alterações' : 'Salvar Turma'}
                    </button>

                    {editandoId && (
                        <button
                            type='button'
                            onClick={cancelarEdicao}
                            className='rounded-lg border border-gray-300 px-4 py-2 font-medium text-gray-700 hover:bg-gray-100 dark:border-gray-600 dark:text-gray-300 dark:hover:bg-gray-700'
                        >
                            Cancelar
                        </button>
                    )}
                </div>
            </form>

            <section className='mt-10'>
                <h2 className='mb-4 text-2xl font-bold text-gray-900 dark:text-white'>
                    Turmas Cadastradas
                </h2>

                {carregando && <p className='text-gray-500 dark:text-gray-400'>Carregando turmas...</p>}

                {!carregando && turmas.length === 0 && (
                    <p className='text-gray-500 dark:text-gray-400'>Nenhuma turma cadastrada ainda.</p>
                )}

                {!carregando && turmas.length > 0 && (
                    <div className='overflow-x-auto rounded-xl border border-gray-200 bg-white shadow-sm dark:border-gray-700 dark:bg-gray-800'>
                        <table className='w-full text-left text-sm'>
                            <thead>
                                <tr className='border-b border-gray-200 text-gray-500 dark:border-gray-700 dark:text-gray-400'>
                                    <th className='px-4 py-3 font-medium'>Turma</th>
                                    <th className='px-4 py-3 font-medium'>Ano</th>
                                    <th className='px-4 py-3 font-medium'>Turno</th>
                                    <th className='px-4 py-3 font-medium'>Sala</th>
                                    <th className='px-4 py-3 font-medium'>Alunos</th>
                                    <th className='px-4 py-3 font-medium'>Professor(a)</th>
                                    <th className='px-4 py-3 text-right font-medium'>Ações</th>
                                </tr>
                            </thead>
                            <tbody>
                                {turmas.map((t) => (
                                    <tr
                                        key={t.id}
                                        className={`border-b border-gray-100 last:border-0 dark:border-gray-700 ${
                                            editandoId === t.id ? 'bg-emerald-50 dark:bg-emerald-950' : ''
                                        }`}
                                    >
                                        <td className='px-4 py-3 text-gray-900 dark:text-white'>{t.nome}</td>
                                        <td className='px-4 py-3 text-gray-700 dark:text-gray-300'>{t.ano_letivo}</td>
                                        <td className='px-4 py-3 text-gray-700 dark:text-gray-300'>{t.turno}</td>
                                        <td className='px-4 py-3 text-gray-700 dark:text-gray-300'>{t.sala?.nome ?? '-'}</td>
                                        <td className='px-4 py-3 text-gray-700 dark:text-gray-300'>
                                            {t._count.alunos}/{t.capacidade}
                                        </td>
                                        <td className='px-4 py-3 text-gray-700 dark:text-gray-300'>
                                            {t.professores.length > 0
                                                ? t.professores.map((p) => p.funcionario.nome).join(', ')
                                                : '-'}
                                        </td>
                                        <td className='px-4 py-3'>
                                            <div className='flex justify-end gap-2'>
                                                <button
                                                    type='button'
                                                    onClick={() => iniciarEdicao(t)}
                                                    className='rounded-lg border border-emerald-700 px-3 py-1.5 text-sm font-medium text-emerald-700 hover:bg-emerald-50 dark:hover:bg-emerald-950'
                                                >
                                                    Editar
                                                </button>
                                                <button
                                                    type='button'
                                                    disabled={excluindoId === t.id}
                                                    onClick={() => excluirTurma(t.id)}
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