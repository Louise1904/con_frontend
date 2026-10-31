import { useEffect, useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { toast } from 'sonner'
import { apiFetch, lerErro } from '../api/api'

// Formato que o back devolve em GET /api/disciplinas
type Disciplina = {
    id: number
    nome: string
    cargaHoraria: string | null
    professorNome: string | null
    descricao: string | null
}

// Só os campos de funcionário que esta tela usa
type Professor = {
    id: number
    nome: string
    cargo: string
}

const disciplinaSchema = z.object({
    nome: z.string().trim().min(1, 'Nome da disciplina é obrigatório').max(100),
    cargaHoraria: z.string().trim().max(20),
    professorNome: z.string().trim().max(100),
    descricao: z.string().trim().max(10000),
})

type DisciplinaForm = z.infer<typeof disciplinaSchema>

const FORM_VAZIO: DisciplinaForm = {
    nome: '',
    cargaHoraria: '',
    professorNome: '',
    descricao: '',
}

const CLASSE_INPUT =
    'w-full rounded-lg border border-gray-300 px-3 py-2 text-gray-900 outline-none focus:border-emerald-600 dark:border-gray-600 dark:bg-gray-900 dark:text-white'
const CLASSE_LABEL = 'mb-1 block text-sm font-medium text-gray-700 dark:text-gray-300'

export default function AdminDisciplinas() {
    const [disciplinas, setDisciplinas] = useState<Disciplina[]>([])
    const [professores, setProfessores] = useState<Professor[]>([])
    const [carregando, setCarregando] = useState(true)
    const [enviando, setEnviando] = useState(false)
    const [excluindoId, setExcluindoId] = useState<number | null>(null)
    // null = cadastrando uma nova; número = editando essa disciplina
    const [editandoId, setEditandoId] = useState<number | null>(null)

    const { register, handleSubmit, reset, watch, formState: { errors } } =
        useForm<DisciplinaForm>({
            resolver: zodResolver(disciplinaSchema),
            defaultValues: FORM_VAZIO,
        })

    // Valor escolhido no seletor de professor (usado para não perder nomes antigos)
    const professorSelecionado = watch('professorNome')

    async function carregarDisciplinas() {
        setCarregando(true)
        try {
            const resposta = await apiFetch('/api/disciplinas')
            if (!resposta.ok) throw new Error('Falha ao carregar disciplinas')
            const dados = await resposta.json()
            setDisciplinas(Array.isArray(dados) ? dados : [])
        } catch {
            toast.error('Não foi possível carregar as disciplinas')
        } finally {
            setCarregando(false)
        }
    }

    // Busca os funcionários e guarda só quem tem cargo de professor
    async function carregarProfessores() {
        try {
            const resposta = await apiFetch('/api/funcionarios')
            if (!resposta.ok) throw new Error('Falha ao carregar professores')
            const dados: Professor[] = await resposta.json()
            setProfessores(dados.filter((f) => f.cargo.toLowerCase().includes('prof')))
        } catch {
            toast.error('Não foi possível carregar a lista de professores')
        }
    }

    useEffect(() => {
        carregarDisciplinas()
        carregarProfessores()
    }, [])

    // Preenche o formulário com os dados da disciplina escolhida
    function iniciarEdicao(d: Disciplina) {
        setEditandoId(d.id)
        reset({
            nome: d.nome,
            cargaHoraria: d.cargaHoraria ?? '',
            professorNome: d.professorNome ?? '',
            descricao: d.descricao ?? '',
        })
        window.scrollTo({ top: 0, behavior: 'smooth' })
    }

    function cancelarEdicao() {
        setEditandoId(null)
        reset(FORM_VAZIO)
    }

    async function salvarDisciplina(dados: DisciplinaForm) {
        setEnviando(true)
        try {
            const resposta = await apiFetch(
                editandoId ? `/api/disciplinas/${editandoId}` : '/api/disciplinas',
                {
                    method: editandoId ? 'PUT' : 'POST',
                    body: JSON.stringify(dados),
                },
            )

            if (!resposta.ok) {
                toast.error(await lerErro(resposta, 'Não foi possível salvar a disciplina'))
                return
            }

            toast.success(
                editandoId ? 'Disciplina atualizada com sucesso!' : 'Disciplina cadastrada com sucesso!',
            )
            cancelarEdicao()
            await carregarDisciplinas()
        } catch {
            toast.error('Erro de conexão com o servidor')
        } finally {
            setEnviando(false)
        }
    }

    async function excluirDisciplina(id: number) {
        if (!confirm('Excluir esta disciplina? Essa ação não pode ser desfeita.')) {
            return
        }

        setExcluindoId(id)
        try {
            const resposta = await apiFetch(`/api/disciplinas/${id}`, { method: 'DELETE' })

            if (!resposta.ok) {
                toast.error(await lerErro(resposta, 'Não foi possível excluir a disciplina'))
                return
            }

            toast.success('Disciplina excluída com sucesso')
            setDisciplinas((atual) => atual.filter((item) => item.id !== id))
            if (editandoId === id) cancelarEdicao()
        } catch {
            toast.error('Erro de conexão com o servidor')
        } finally {
            setExcluindoId(null)
        }
    }

    // Se a disciplina editada tiver um professor que não está na lista
    // (ex: digitado antes do seletor existir), mantém ele como opção
    const nomeForaDaLista =
        professorSelecionado && !professores.some((p) => p.nome === professorSelecionado)

    return (
        <div className='mx-auto max-w-5xl'>
            <div className='mb-6'>
                <h1 className='text-3xl font-extrabold text-gray-900 dark:text-white'>
                    Gerenciar Disciplinas
                </h1>
                <p className='mt-2 text-sm text-gray-600 dark:text-gray-400'>
                    Cadastre as disciplinas usadas na chamada.
                </p>
            </div>

            <form
                onSubmit={handleSubmit(salvarDisciplina)}
                className='grid gap-4 rounded-xl border border-gray-200 bg-white p-6 shadow-sm dark:border-gray-700 dark:bg-gray-800'
            >
                <h2 className='text-lg font-semibold text-gray-900 dark:text-white'>
                    {editandoId ? 'Editar Disciplina' : 'Nova Disciplina'}
                </h2>

                <div className='grid gap-4 md:grid-cols-3'>
                    <div>
                        <label className={CLASSE_LABEL}>Nome da disciplina</label>
                        <input type='text' placeholder='Ex: Música' {...register('nome')} className={CLASSE_INPUT} />
                        {errors.nome && <p className='mt-1 text-sm text-red-600'>{errors.nome.message}</p>}
                    </div>

                    <div>
                        <label className={CLASSE_LABEL}>Carga horária</label>
                        <input type='text' placeholder='Ex: 40h' {...register('cargaHoraria')} className={CLASSE_INPUT} />
                        {errors.cargaHoraria && <p className='mt-1 text-sm text-red-600'>{errors.cargaHoraria.message}</p>}
                    </div>

                    <div>
                        <label className={CLASSE_LABEL}>Professor(a)</label>
                        <select {...register('professorNome')} className={CLASSE_INPUT}>
                            <option value=''>Selecione</option>
                            {professores.map((p) => (
                                <option key={p.id} value={p.nome}>
                                    {p.nome}
                                </option>
                            ))}
                            {nomeForaDaLista && (
                                <option value={professorSelecionado}>{professorSelecionado}</option>
                            )}
                        </select>
                        {professores.length === 0 && (
                            <p className='mt-1 text-xs text-gray-500'>
                                Nenhum professor cadastrado. Cadastre em Funcionários com o cargo "Professor".
                            </p>
                        )}
                    </div>

                    <div className='md:col-span-3'>
                        <label className={CLASSE_LABEL}>Descrição (opcional)</label>
                        <textarea
                            rows={4}
                            placeholder='Digite uma descrição para a disciplina'
                            {...register('descricao')}
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
                        {enviando ? 'Salvando...' : editandoId ? 'Salvar Alterações' : 'Salvar Disciplina'}
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
                    Disciplinas Cadastradas
                </h2>

                {carregando && <p className='text-gray-500 dark:text-gray-400'>Carregando disciplinas...</p>}

                {!carregando && disciplinas.length === 0 && (
                    <p className='text-gray-500 dark:text-gray-400'>Nenhuma disciplina cadastrada ainda.</p>
                )}

                {!carregando && disciplinas.length > 0 && (
                    <div className='overflow-x-auto rounded-xl border border-gray-200 bg-white shadow-sm dark:border-gray-700 dark:bg-gray-800'>
                        <table className='w-full text-left text-sm'>
                            <thead>
                                <tr className='border-b border-gray-200 text-gray-500 dark:border-gray-700 dark:text-gray-400'>
                                    <th className='px-4 py-3 font-medium'>Nome</th>
                                    <th className='px-4 py-3 font-medium'>Carga horária</th>
                                    <th className='px-4 py-3 font-medium'>Professor(a)</th>
                                    <th className='px-4 py-3 text-right font-medium'>Ações</th>
                                </tr>
                            </thead>
                            <tbody>
                                {disciplinas.map((d) => (
                                    <tr
                                        key={d.id}
                                        className={`border-b border-gray-100 last:border-0 dark:border-gray-700 ${
                                            editandoId === d.id ? 'bg-emerald-50 dark:bg-emerald-950' : ''
                                        }`}
                                    >
                                        <td className='px-4 py-3 text-gray-900 dark:text-white'>{d.nome}</td>
                                        <td className='px-4 py-3 text-gray-700 dark:text-gray-300'>{d.cargaHoraria || '-'}</td>
                                        <td className='px-4 py-3 text-gray-700 dark:text-gray-300'>{d.professorNome || '-'}</td>
                                        <td className='px-4 py-3'>
                                            <div className='flex justify-end gap-2'>
                                                <button
                                                    type='button'
                                                    onClick={() => iniciarEdicao(d)}
                                                    className='rounded-lg border border-emerald-700 px-3 py-1.5 text-sm font-medium text-emerald-700 hover:bg-emerald-50 dark:hover:bg-emerald-950'
                                                >
                                                    Editar
                                                </button>
                                                <button
                                                    type='button'
                                                    disabled={excluindoId === d.id}
                                                    onClick={() => excluirDisciplina(d.id)}
                                                    className='rounded-lg border border-red-600 px-3 py-1.5 text-sm font-medium text-red-600 hover:bg-red-50 disabled:opacity-50 dark:hover:bg-red-950'
                                                >
                                                    {excluindoId === d.id ? 'Excluindo...' : 'Excluir'}
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