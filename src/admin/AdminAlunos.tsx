import { useEffect, useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { toast } from 'sonner'
import { apiFetch, lerErro } from '../api/api'

// Formato que o back devolve em GET /api/alunos
type Aluno = {
    id: number
    matricula: string | null
    nome: string
    data_nascimento: string // ex: "2021-03-12T00:00:00.000Z"
    sexo: string
    nome_responsavel: string
    telefone: string
    email: string
    endereco: string
    numero: string
    complemento: string | null
    bairro: string
    cidade: string
    cep: string
    turmaId: number
    turma: { id: number; nome: string; turno: string }
}

// Só os campos de turma que esta tela usa
type Turma = {
    id: number
    nome: string
    turno: string
    capacidade: number
    _count: { alunos: number }
}

function mascaraCep(valor: string) {
    return valor
        .replace(/\D/g, '')
        .slice(0, 8)
        .replace(/(\d{5})(\d)/, '$1-$2') // 00000-000
}

const alunoSchema = z.object({
    matricula: z.string().trim().min(1, 'Matrícula é obrigatória').max(20),
    nome: z.string().trim().min(3, 'Nome é obrigatório').max(100),
    data_nascimento: z.string().min(1, 'Data de nascimento é obrigatória'),
    sexo: z.string().min(1, 'Selecione o sexo'),
    turmaId: z.string().min(1, 'Selecione a turma'),
    nome_responsavel: z.string().trim().min(3, 'Nome do responsável é obrigatório').max(100),
    telefone: z.string().trim().min(1, 'Telefone é obrigatório').max(20),
    email: z.string().trim().email('Email inválido').max(100),
    endereco: z.string().trim().min(1, 'Endereço é obrigatório').max(150),
    numero: z.string().trim().min(1, 'Número é obrigatório').max(10),
    complemento: z.string().trim().max(50),
    bairro: z.string().trim().min(1, 'Bairro é obrigatório').max(50),
    cidade: z.string().trim().min(1, 'Cidade é obrigatória').max(50),
    cep: z.string().refine((v) => v.replace(/\D/g, '').length === 8, 'CEP deve ter 8 dígitos'),
})

type AlunoForm = z.infer<typeof alunoSchema>

const FORM_VAZIO: AlunoForm = {
    matricula: '',
    nome: '',
    data_nascimento: '',
    sexo: '',
    turmaId: '',
    nome_responsavel: '',
    telefone: '',
    email: '',
    endereco: '',
    numero: '',
    complemento: '',
    bairro: '',
    cidade: '',
    cep: '',
}

const CLASSE_INPUT =
    'w-full rounded-lg border border-gray-300 px-3 py-2 text-gray-900 outline-none focus:border-emerald-600 dark:border-gray-600 dark:bg-gray-900 dark:text-white'
const CLASSE_LABEL = 'mb-1 block text-sm font-medium text-gray-700 dark:text-gray-300'
const CLASSE_SECAO = 'md:col-span-2 lg:col-span-3 mt-2 text-base font-semibold text-gray-800 dark:text-gray-200'

export default function AdminAlunos() {
    const [alunos, setAlunos] = useState<Aluno[]>([])
    const [turmas, setTurmas] = useState<Turma[]>([])
    const [carregando, setCarregando] = useState(true)
    const [enviando, setEnviando] = useState(false)
    const [excluindoId, setExcluindoId] = useState<number | null>(null)
    // null = cadastrando um novo; número = editando esse aluno
    const [editandoId, setEditandoId] = useState<number | null>(null)
    // Filtro da tabela ('' = todas as turmas)
    const [filtroTurma, setFiltroTurma] = useState('')

    const { register, handleSubmit, reset, setValue, formState: { errors } } =
        useForm<AlunoForm>({
            resolver: zodResolver(alunoSchema),
            defaultValues: FORM_VAZIO,
        })

    async function carregarAlunos() {
        setCarregando(true)
        try {
            const resposta = await apiFetch('/api/alunos')
            if (!resposta.ok) throw new Error('Falha ao carregar alunos')
            const dados = await resposta.json()
            setAlunos(Array.isArray(dados) ? dados : [])
        } catch {
            toast.error('Não foi possível carregar os alunos')
        } finally {
            setCarregando(false)
        }
    }

    async function carregarTurmas() {
        try {
            const resposta = await apiFetch('/api/turmas')
            if (!resposta.ok) throw new Error('Falha ao carregar turmas')
            const dados = await resposta.json()
            setTurmas(Array.isArray(dados) ? dados : [])
        } catch {
            toast.error('Não foi possível carregar as turmas')
        }
    }

    useEffect(() => {
        carregarAlunos()
        carregarTurmas()
    }, [])

    // Preenche o formulário com os dados do aluno escolhido
    function iniciarEdicao(a: Aluno) {
        setEditandoId(a.id)
        reset({
            matricula: a.matricula ?? '',
            nome: a.nome,
            // O input de data precisa do formato AAAA-MM-DD
            data_nascimento: a.data_nascimento.slice(0, 10),
            sexo: a.sexo,
            turmaId: String(a.turmaId),
            nome_responsavel: a.nome_responsavel,
            telefone: a.telefone,
            email: a.email,
            endereco: a.endereco,
            numero: a.numero,
            complemento: a.complemento ?? '',
            bairro: a.bairro,
            cidade: a.cidade,
            cep: mascaraCep(a.cep),
        })
        window.scrollTo({ top: 0, behavior: 'smooth' })
    }

    function cancelarEdicao() {
        setEditandoId(null)
        reset(FORM_VAZIO)
    }

    async function salvarAluno(dados: AlunoForm) {
        const corpo = {
            ...dados,
            turmaId: Number(dados.turmaId),
            complemento: dados.complemento || null,
        }

        setEnviando(true)
        try {
            const resposta = await apiFetch(
                editandoId ? `/api/alunos/${editandoId}` : '/api/alunos',
                {
                    method: editandoId ? 'PUT' : 'POST',
                    body: JSON.stringify(corpo),
                },
            )

            if (!resposta.ok) {
                toast.error(await lerErro(resposta, 'Não foi possível salvar o aluno'))
                return
            }

            toast.success(editandoId ? 'Aluno atualizado com sucesso!' : 'Aluno cadastrado com sucesso!')
            cancelarEdicao()
            // Recarrega as turmas também, porque a contagem de alunos mudou
            await Promise.all([carregarAlunos(), carregarTurmas()])
        } catch {
            toast.error('Erro de conexão com o servidor')
        } finally {
            setEnviando(false)
        }
    }

    async function excluirAluno(id: number) {
        if (!confirm('Excluir este aluno? Essa ação não pode ser desfeita.')) {
            return
        }

        setExcluindoId(id)
        try {
            const resposta = await apiFetch(`/api/alunos/${id}`, { method: 'DELETE' })

            if (!resposta.ok) {
                toast.error(await lerErro(resposta, 'Não foi possível excluir o aluno'))
                return
            }

            toast.success('Aluno excluído com sucesso')
            setAlunos((atual) => atual.filter((item) => item.id !== id))
            if (editandoId === id) cancelarEdicao()
            await carregarTurmas()
        } catch {
            toast.error('Erro de conexão com o servidor')
        } finally {
            setExcluindoId(null)
        }
    }

    // Aplica o filtro de turma na tabela
    const alunosFiltrados = filtroTurma
        ? alunos.filter((a) => String(a.turmaId) === filtroTurma)
        : alunos

    return (
        <div className='mx-auto max-w-5xl'>
            <div className='mb-6'>
                <h1 className='text-3xl font-extrabold text-gray-900 dark:text-white'>
                    Gerenciar Alunos
                </h1>
                <p className='mt-2 text-sm text-gray-600 dark:text-gray-400'>
                    Cadastre os alunos e vincule cada um à sua turma.
                </p>
            </div>

            <form
                onSubmit={handleSubmit(salvarAluno)}
                className='grid gap-4 rounded-xl border border-gray-200 bg-white p-6 shadow-sm dark:border-gray-700 dark:bg-gray-800'
            >
                <h2 className='text-lg font-semibold text-gray-900 dark:text-white'>
                    {editandoId ? 'Editar Aluno' : 'Novo Aluno'}
                </h2>

                <div className='grid gap-4 md:grid-cols-2 lg:grid-cols-3'>
                    {/* ---------- Dados pessoais ---------- */}
                    <h3 className={CLASSE_SECAO}>Dados pessoais</h3>

                    <div>
                        <label className={CLASSE_LABEL}>Matrícula</label>
                        <input type='text' placeholder='Ex: 151014191' {...register('matricula')} className={CLASSE_INPUT} />
                        {errors.matricula && <p className='mt-1 text-sm text-red-600'>{errors.matricula.message}</p>}
                    </div>

                    <div className='md:col-span-1 lg:col-span-2'>
                        <label className={CLASSE_LABEL}>Nome completo</label>
                        <input type='text' placeholder='Ex: Maria Silva' {...register('nome')} className={CLASSE_INPUT} />
                        {errors.nome && <p className='mt-1 text-sm text-red-600'>{errors.nome.message}</p>}
                    </div>

                    <div>
                        <label className={CLASSE_LABEL}>Data de nascimento</label>
                        <input type='date' {...register('data_nascimento')} className={CLASSE_INPUT} />
                        {errors.data_nascimento && <p className='mt-1 text-sm text-red-600'>{errors.data_nascimento.message}</p>}
                    </div>

                    <div>
                        <label className={CLASSE_LABEL}>Sexo</label>
                        <select {...register('sexo')} className={CLASSE_INPUT}>
                            <option value=''>Selecione</option>
                            <option value='Feminino'>Feminino</option>
                            <option value='Masculino'>Masculino</option>
                        </select>
                        {errors.sexo && <p className='mt-1 text-sm text-red-600'>{errors.sexo.message}</p>}
                    </div>

                    <div>
                        <label className={CLASSE_LABEL}>Turma</label>
                        <select {...register('turmaId')} className={CLASSE_INPUT}>
                            <option value=''>Selecione</option>
                            {turmas.map((t) => (
                                <option key={t.id} value={t.id}>
                                    {t.nome} - {t.turno} ({t._count.alunos}/{t.capacidade} alunos)
                                </option>
                            ))}
                        </select>
                        {errors.turmaId && <p className='mt-1 text-sm text-red-600'>{errors.turmaId.message}</p>}
                    </div>

                    {/* ---------- Responsável ---------- */}
                    <h3 className={CLASSE_SECAO}>Responsável</h3>

                    <div>
                        <label className={CLASSE_LABEL}>Nome do responsável</label>
                        <input type='text' placeholder='Ex: Maria' {...register('nome_responsavel')} className={CLASSE_INPUT} />
                        {errors.nome_responsavel && <p className='mt-1 text-sm text-red-600'>{errors.nome_responsavel.message}</p>}
                    </div>

                    <div>
                        <label className={CLASSE_LABEL}>Telefone</label>
                        <input type='text' placeholder='(53) 98126-8536' {...register('telefone')} className={CLASSE_INPUT} />
                        {errors.telefone && <p className='mt-1 text-sm text-red-600'>{errors.telefone.message}</p>}
                    </div>

                    <div>
                        <label className={CLASSE_LABEL}>E-mail</label>
                        <input type='email' placeholder='email@gmail.com' {...register('email')} className={CLASSE_INPUT} />
                        {errors.email && <p className='mt-1 text-sm text-red-600'>{errors.email.message}</p>}
                    </div>

                    {/* ---------- Endereço ---------- */}
                    <h3 className={CLASSE_SECAO}>Endereço</h3>

                    <div className='md:col-span-2'>
                        <label className={CLASSE_LABEL}>Endereço</label>
                        <input type='text' placeholder='Rua das Flores' {...register('endereco')} className={CLASSE_INPUT} />
                        {errors.endereco && <p className='mt-1 text-sm text-red-600'>{errors.endereco.message}</p>}
                    </div>

                    <div>
                        <label className={CLASSE_LABEL}>Número</label>
                        <input type='text' placeholder='123' {...register('numero')} className={CLASSE_INPUT} />
                        {errors.numero && <p className='mt-1 text-sm text-red-600'>{errors.numero.message}</p>}
                    </div>

                    <div>
                        <label className={CLASSE_LABEL}>Complemento (opcional)</label>
                        <input type='text' placeholder='Apartamento 01' {...register('complemento')} className={CLASSE_INPUT} />
                    </div>

                    <div>
                        <label className={CLASSE_LABEL}>Bairro</label>
                        <input type='text' placeholder='Centro' {...register('bairro')} className={CLASSE_INPUT} />
                        {errors.bairro && <p className='mt-1 text-sm text-red-600'>{errors.bairro.message}</p>}
                    </div>

                    <div>
                        <label className={CLASSE_LABEL}>Cidade</label>
                        <input type='text' placeholder='Pelotas' {...register('cidade')} className={CLASSE_INPUT} />
                        {errors.cidade && <p className='mt-1 text-sm text-red-600'>{errors.cidade.message}</p>}
                    </div>

                    <div>
                        <label className={CLASSE_LABEL}>CEP</label>
                        <input
                            type='text'
                            inputMode='numeric'
                            placeholder='96000-000'
                            {...register('cep', {
                                onChange: (e) => setValue('cep', mascaraCep(e.target.value)),
                            })}
                            className={CLASSE_INPUT}
                        />
                        {errors.cep && <p className='mt-1 text-sm text-red-600'>{errors.cep.message}</p>}
                    </div>
                </div>

                <div className='flex gap-3'>
                    <button
                        type='submit'
                        disabled={enviando}
                        className='rounded-lg bg-emerald-700 px-4 py-2 font-medium text-white hover:bg-emerald-800 disabled:opacity-50 disabled:cursor-not-allowed transition-colors'
                    >
                        {enviando ? 'Salvando...' : editandoId ? 'Salvar Alterações' : 'Salvar Aluno'}
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
                <div className='mb-4 flex flex-wrap items-center justify-between gap-3'>
                    <h2 className='text-2xl font-bold text-gray-900 dark:text-white'>
                        Alunos Cadastrados
                    </h2>

                    <select
                        value={filtroTurma}
                        onChange={(e) => setFiltroTurma(e.target.value)}
                        className='rounded-lg border border-gray-300 px-3 py-2 text-sm text-gray-900 outline-none focus:border-emerald-600 dark:border-gray-600 dark:bg-gray-900 dark:text-white'
                    >
                        <option value=''>Todas as turmas</option>
                        {turmas.map((t) => (
                            <option key={t.id} value={t.id}>
                                {t.nome}
                            </option>
                        ))}
                    </select>
                </div>

                {carregando && <p className='text-gray-500 dark:text-gray-400'>Carregando alunos...</p>}

                {!carregando && alunosFiltrados.length === 0 && (
                    <p className='text-gray-500 dark:text-gray-400'>Nenhum aluno encontrado.</p>
                )}

                {!carregando && alunosFiltrados.length > 0 && (
                    <div className='overflow-x-auto rounded-xl border border-gray-200 bg-white shadow-sm dark:border-gray-700 dark:bg-gray-800'>
                        <table className='w-full text-left text-sm'>
                            <thead>
                                <tr className='border-b border-gray-200 text-gray-500 dark:border-gray-700 dark:text-gray-400'>
                                    <th className='px-4 py-3 font-medium'>Matrícula</th>
                                    <th className='px-4 py-3 font-medium'>Nome</th>
                                    <th className='px-4 py-3 font-medium'>Turma</th>
                                    <th className='px-4 py-3 font-medium'>Responsável</th>
                                    <th className='px-4 py-3 font-medium'>Telefone</th>
                                    <th className='px-4 py-3 text-right font-medium'>Ações</th>
                                </tr>
                            </thead>
                            <tbody>
                                {alunosFiltrados.map((a) => (
                                    <tr
                                        key={a.id}
                                        className={`border-b border-gray-100 last:border-0 dark:border-gray-700 ${
                                            editandoId === a.id ? 'bg-emerald-50 dark:bg-emerald-950' : ''
                                        }`}
                                    >
                                        <td className='px-4 py-3 text-gray-700 dark:text-gray-300'>{a.matricula ?? '-'}</td>
                                        <td className='px-4 py-3 text-gray-900 dark:text-white'>{a.nome}</td>
                                        <td className='px-4 py-3 text-gray-700 dark:text-gray-300'>{a.turma?.nome ?? '-'}</td>
                                        <td className='px-4 py-3 text-gray-700 dark:text-gray-300'>{a.nome_responsavel}</td>
                                        <td className='px-4 py-3 text-gray-700 dark:text-gray-300'>{a.telefone}</td>
                                        <td className='px-4 py-3'>
                                            <div className='flex justify-end gap-2'>
                                                <button
                                                    type='button'
                                                    onClick={() => iniciarEdicao(a)}
                                                    className='rounded-lg border border-emerald-700 px-3 py-1.5 text-sm font-medium text-emerald-700 hover:bg-emerald-50 dark:hover:bg-emerald-950'
                                                >
                                                    Editar
                                                </button>
                                                <button
                                                    type='button'
                                                    disabled={excluindoId === a.id}
                                                    onClick={() => excluirAluno(a.id)}
                                                    className='rounded-lg border border-red-600 px-3 py-1.5 text-sm font-medium text-red-600 hover:bg-red-50 disabled:opacity-50 dark:hover:bg-red-950'
                                                >
                                                    {excluindoId === a.id ? 'Excluindo...' : 'Excluir'}
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