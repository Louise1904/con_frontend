import { useEffect, useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { toast } from 'sonner'
import { apiFetch, lerErro } from '../api/api'

// Formato que o back devolve em GET /api/salas
type Sala = {
    id: number
    nome: string
    numero: string
    capacidade: number
    andar: number | null
    bloco: string | null
    tipo: string
    descricao: string | null
    ativa: boolean
    turmas: { id: number; nome: string }[]
}

const TIPOS = ['Sala regular', 'Sala de recursos', 'Brinquedoteca', 'Laboratório', 'Refeitório', 'Outro']

const salaSchema = z.object({
    nome: z.string().trim().min(1, 'Nome da sala é obrigatório').max(50),
    numero: z.string().trim().min(1, 'Número da sala é obrigatório').max(20),
    capacidade: z.string().regex(/^\d+$/, 'Capacidade deve ser um número'),
    andar: z.string().refine((v) => v === '' || /^-?\d+$/.test(v), 'Andar deve ser um número'),
    bloco: z.string().trim().max(30),
    tipo: z.string().min(1, 'Selecione o tipo'),
    descricao: z.string().trim().max(10000),
    ativa: z.boolean(),
})

type SalaForm = z.infer<typeof salaSchema>

const FORM_VAZIO: SalaForm = {
    nome: '',
    numero: '',
    capacidade: '',
    andar: '',
    bloco: '',
    tipo: '',
    descricao: '',
    ativa: true,
}

const CLASSE_INPUT =
    'w-full rounded-lg border border-gray-300 px-3 py-2 text-gray-900 outline-none focus:border-emerald-600 dark:border-gray-600 dark:bg-gray-900 dark:text-white'
const CLASSE_LABEL = 'mb-1 block text-sm font-medium text-gray-700 dark:text-gray-300'

export default function AdminSalas() {
    const [salas, setSalas] = useState<Sala[]>([])
    const [carregando, setCarregando] = useState(true)
    const [enviando, setEnviando] = useState(false)
    const [excluindoId, setExcluindoId] = useState<number | null>(null)
    // null = cadastrando uma nova; número = editando essa sala
    const [editandoId, setEditandoId] = useState<number | null>(null)

    const { register, handleSubmit, reset, formState: { errors } } =
        useForm<SalaForm>({
            resolver: zodResolver(salaSchema),
            defaultValues: FORM_VAZIO,
        })

    async function carregarSalas() {
        setCarregando(true)
        try {
            const resposta = await apiFetch('/api/salas')
            if (!resposta.ok) throw new Error('Falha ao carregar salas')
            const dados = await resposta.json()
            setSalas(Array.isArray(dados) ? dados : [])
        } catch {
            toast.error('Não foi possível carregar as salas')
        } finally {
            setCarregando(false)
        }
    }

    useEffect(() => {
        carregarSalas()
    }, [])

    // Preenche o formulário com os dados da sala escolhida
    function iniciarEdicao(s: Sala) {
        setEditandoId(s.id)
        reset({
            nome: s.nome,
            numero: s.numero,
            capacidade: String(s.capacidade),
            andar: s.andar != null ? String(s.andar) : '',
            bloco: s.bloco ?? '',
            tipo: s.tipo,
            descricao: s.descricao ?? '',
            ativa: s.ativa,
        })
        window.scrollTo({ top: 0, behavior: 'smooth' })
    }

    function cancelarEdicao() {
        setEditandoId(null)
        reset(FORM_VAZIO)
    }

    async function salvarSala(dados: SalaForm) {
        // O formulário trabalha com texto; o back espera números (ou null)
        const corpo = {
            nome: dados.nome,
            numero: dados.numero,
            capacidade: Number(dados.capacidade),
            andar: dados.andar === '' ? null : Number(dados.andar),
            bloco: dados.bloco || null,
            tipo: dados.tipo,
            descricao: dados.descricao || null,
            ativa: dados.ativa,
        }

        setEnviando(true)
        try {
            const resposta = await apiFetch(
                editandoId ? `/api/salas/${editandoId}` : '/api/salas',
                {
                    method: editandoId ? 'PUT' : 'POST',
                    body: JSON.stringify(corpo),
                },
            )

            if (!resposta.ok) {
                toast.error(await lerErro(resposta, 'Não foi possível salvar a sala'))
                return
            }

            toast.success(editandoId ? 'Sala atualizada com sucesso!' : 'Sala cadastrada com sucesso!')
            cancelarEdicao()
            await carregarSalas()
        } catch {
            toast.error('Erro de conexão com o servidor')
        } finally {
            setEnviando(false)
        }
    }

    async function excluirSala(id: number) {
        if (!confirm('Excluir esta sala? Essa ação não pode ser desfeita.')) {
            return
        }

        setExcluindoId(id)
        try {
            const resposta = await apiFetch(`/api/salas/${id}`, { method: 'DELETE' })

            if (!resposta.ok) {
                toast.error(await lerErro(resposta, 'Não foi possível excluir a sala'))
                return
            }

            toast.success('Sala excluída com sucesso')
            setSalas((atual) => atual.filter((item) => item.id !== id))
            if (editandoId === id) cancelarEdicao()
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
                    Gerenciar Salas
                </h1>
                <p className='mt-2 text-sm text-gray-600 dark:text-gray-400'>
                    Cadastre as salas da escola. Cada turma é vinculada a uma sala.
                </p>
            </div>

            <form
                onSubmit={handleSubmit(salvarSala)}
                className='grid gap-4 rounded-xl border border-gray-200 bg-white p-6 shadow-sm dark:border-gray-700 dark:bg-gray-800'
            >
                <h2 className='text-lg font-semibold text-gray-900 dark:text-white'>
                    {editandoId ? 'Editar Sala' : 'Nova Sala'}
                </h2>

                <div className='grid gap-4 md:grid-cols-2 lg:grid-cols-3'>
                    <div>
                        <label className={CLASSE_LABEL}>Nome da sala</label>
                        <input type='text' placeholder='Ex: Sala Jardim A' {...register('nome')} className={CLASSE_INPUT} />
                        {errors.nome && <p className='mt-1 text-sm text-red-600'>{errors.nome.message}</p>}
                    </div>

                    <div>
                        <label className={CLASSE_LABEL}>Número</label>
                        <input type='text' placeholder='Ex: 201' {...register('numero')} className={CLASSE_INPUT} />
                        {errors.numero && <p className='mt-1 text-sm text-red-600'>{errors.numero.message}</p>}
                    </div>

                    <div>
                        <label className={CLASSE_LABEL}>Capacidade</label>
                        <input type='text' inputMode='numeric' placeholder='Ex: 25' {...register('capacidade')} className={CLASSE_INPUT} />
                        {errors.capacidade && <p className='mt-1 text-sm text-red-600'>{errors.capacidade.message}</p>}
                    </div>

                    <div>
                        <label className={CLASSE_LABEL}>Tipo</label>
                        <select {...register('tipo')} className={CLASSE_INPUT}>
                            <option value=''>Selecione</option>
                            {TIPOS.map((tipo) => (
                                <option key={tipo} value={tipo}>
                                    {tipo}
                                </option>
                            ))}
                        </select>
                        {errors.tipo && <p className='mt-1 text-sm text-red-600'>{errors.tipo.message}</p>}
                    </div>

                    <div>
                        <label className={CLASSE_LABEL}>Andar (opcional)</label>
                        <input type='text' inputMode='numeric' placeholder='Ex: 1' {...register('andar')} className={CLASSE_INPUT} />
                        {errors.andar && <p className='mt-1 text-sm text-red-600'>{errors.andar.message}</p>}
                    </div>

                    <div>
                        <label className={CLASSE_LABEL}>Bloco (opcional)</label>
                        <input type='text' placeholder='Ex: Bloco A' {...register('bloco')} className={CLASSE_INPUT} />
                    </div>

                    <div className='md:col-span-2 lg:col-span-3'>
                        <label className={CLASSE_LABEL}>Descrição (opcional)</label>
                        <textarea
                            rows={3}
                            placeholder='Ex: Sala com cantinho de leitura'
                            {...register('descricao')}
                            className={CLASSE_INPUT}
                        />
                    </div>

                    <label className='flex items-center gap-2 text-sm font-medium text-gray-700 dark:text-gray-300'>
                        <input type='checkbox' {...register('ativa')} className='h-4 w-4 accent-emerald-700' />
                        Sala ativa (disponível para novas turmas)
                    </label>
                </div>

                <div className='flex gap-3'>
                    <button
                        type='submit'
                        disabled={enviando}
                        className='rounded-lg bg-emerald-700 px-4 py-2 font-medium text-white hover:bg-emerald-800 disabled:opacity-50 disabled:cursor-not-allowed transition-colors'
                    >
                        {enviando ? 'Salvando...' : editandoId ? 'Salvar Alterações' : 'Salvar Sala'}
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
                    Salas Cadastradas
                </h2>

                {carregando && <p className='text-gray-500 dark:text-gray-400'>Carregando salas...</p>}

                {!carregando && salas.length === 0 && (
                    <p className='text-gray-500 dark:text-gray-400'>Nenhuma sala cadastrada ainda.</p>
                )}

                {!carregando && salas.length > 0 && (
                    <div className='overflow-x-auto rounded-xl border border-gray-200 bg-white shadow-sm dark:border-gray-700 dark:bg-gray-800'>
                        <table className='w-full text-left text-sm'>
                            <thead>
                                <tr className='border-b border-gray-200 text-gray-500 dark:border-gray-700 dark:text-gray-400'>
                                    <th className='px-4 py-3 font-medium'>Nome</th>
                                    <th className='px-4 py-3 font-medium'>Número</th>
                                    <th className='px-4 py-3 font-medium'>Tipo</th>
                                    <th className='px-4 py-3 font-medium'>Capacidade</th>
                                    <th className='px-4 py-3 font-medium'>Turmas</th>
                                    <th className='px-4 py-3 font-medium'>Situação</th>
                                    <th className='px-4 py-3 text-right font-medium'>Ações</th>
                                </tr>
                            </thead>
                            <tbody>
                                {salas.map((s) => (
                                    <tr
                                        key={s.id}
                                        className={`border-b border-gray-100 last:border-0 dark:border-gray-700 ${
                                            editandoId === s.id ? 'bg-emerald-50 dark:bg-emerald-950' : ''
                                        }`}
                                    >
                                        <td className='px-4 py-3 text-gray-900 dark:text-white'>{s.nome}</td>
                                        <td className='px-4 py-3 text-gray-700 dark:text-gray-300'>{s.numero}</td>
                                        <td className='px-4 py-3 text-gray-700 dark:text-gray-300'>{s.tipo}</td>
                                        <td className='px-4 py-3 text-gray-700 dark:text-gray-300'>{s.capacidade}</td>
                                        <td className='px-4 py-3 text-gray-700 dark:text-gray-300'>
                                            {s.turmas.length > 0 ? s.turmas.map((t) => t.nome).join(', ') : '-'}
                                        </td>
                                        <td className='px-4 py-3'>
                                            <span
                                                className={`rounded-full px-2.5 py-1 text-xs font-semibold ${
                                                    s.ativa
                                                        ? 'bg-emerald-100 text-emerald-800'
                                                        : 'bg-gray-200 text-gray-600'
                                                }`}
                                            >
                                                {s.ativa ? 'Ativa' : 'Inativa'}
                                            </span>
                                        </td>
                                        <td className='px-4 py-3'>
                                            <div className='flex justify-end gap-2'>
                                                <button
                                                    type='button'
                                                    onClick={() => iniciarEdicao(s)}
                                                    className='rounded-lg border border-emerald-700 px-3 py-1.5 text-sm font-medium text-emerald-700 hover:bg-emerald-50 dark:hover:bg-emerald-950'
                                                >
                                                    Editar
                                                </button>
                                                <button
                                                    type='button'
                                                    disabled={excluindoId === s.id}
                                                    onClick={() => excluirSala(s.id)}
                                                    className='rounded-lg border border-red-600 px-3 py-1.5 text-sm font-medium text-red-600 hover:bg-red-50 disabled:opacity-50 dark:hover:bg-red-950'
                                                >
                                                    {excluindoId === s.id ? 'Excluindo...' : 'Excluir'}
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