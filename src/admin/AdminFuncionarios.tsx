import { useEffect, useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { toast } from 'sonner'
import { apiFetch, lerErro } from '../api/api'
import type { Funcionario } from '../utils/types'

// Máscaras: vão formatando enquanto a pessoa digita
function mascaraCpf(valor: string) {
    return valor
        .replace(/\D/g, '')                        // só números
        .slice(0, 11)                              // no máximo 11 dígitos
        .replace(/(\d{3})(\d)/, '$1.$2')           // 000.0
        .replace(/(\d{3})\.(\d{3})(\d)/, '$1.$2.$3') // 000.000.0
        .replace(/(\d{3})(\d{1,2})$/, '$1-$2')     // 000.000.000-00
}

function mascaraCep(valor: string) {
    return valor
        .replace(/\D/g, '')
        .slice(0, 8)
        .replace(/(\d{5})(\d)/, '$1-$2')           // 00000-000
}

const somenteDigitos = (valor: string) => valor.replace(/\D/g, '')

const funcionarioSchema = z.object({
    nome: z.string().trim().min(3, 'Nome é obrigatório').max(100),
    cpf: z.string().refine((v) => somenteDigitos(v).length === 11, 'CPF deve ter 11 dígitos'),
    matricula: z.string().trim().min(1, 'Matrícula é obrigatória').max(20),
    cargo: z.string().trim().min(1, 'Cargo é obrigatório').max(50),
    telefone: z.string().trim().min(1, 'Telefone é obrigatório').max(20),
    email: z.string().trim().min(1, 'Email é obrigatório').email('Email inválido').max(100),
    // Na edição a senha pode ficar em branco (mantém a atual)
    senha: z
        .string()
        .trim()
        .max(60)
        .refine((v) => v === '' || v.length >= 6, 'Senha deve ter no mínimo 6 caracteres'),
    endereco: z.string().trim().min(1, 'Endereço é obrigatório').max(150),
    numero: z.string().trim().min(1, 'Número é obrigatório'),
    complemento: z.string().trim().max(100).optional(),
    bairro: z.string().trim().min(1, 'Bairro é obrigatório').max(50),
    cidade: z.string().trim().min(1, 'Cidade é obrigatória').max(50),
    cep: z.string().refine((v) => somenteDigitos(v).length === 8, 'CEP deve ter 8 dígitos'),
})

type FuncionarioForm = z.infer<typeof funcionarioSchema>

const FORM_VAZIO: FuncionarioForm = {
    nome: '',
    cpf: '',
    matricula: '',
    cargo: '',
    telefone: '',
    email: '',
    senha: '',
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

export default function AdminFuncionarios() {
    const [funcionarios, setFuncionarios] = useState<Funcionario[]>([])
    const [carregando, setCarregando] = useState(true)
    const [enviando, setEnviando] = useState(false)
    const [excluindoId, setExcluindoId] = useState<number | null>(null)
    // null = cadastrando um novo; número = editando esse funcionário
    const [editandoId, setEditandoId] = useState<number | null>(null)

    const { register, handleSubmit, reset, setValue, setError, formState: { errors } } =
        useForm<FuncionarioForm>({
            resolver: zodResolver(funcionarioSchema),
            defaultValues: FORM_VAZIO,
        })

    async function carregarFuncionarios() {
        setCarregando(true)
        try {
            const resposta = await apiFetch('/api/funcionarios')
            if (!resposta.ok) throw new Error('Falha ao carregar funcionários')
            const dados = await resposta.json()
            setFuncionarios(Array.isArray(dados) ? dados : [])
        } catch {
            toast.error('Não foi possível carregar os funcionários')
        } finally {
            setCarregando(false)
        }
    }

    useEffect(() => {
        carregarFuncionarios()
    }, [])

    // Preenche o formulário com os dados do funcionário escolhido
    function iniciarEdicao(f: Funcionario) {
        setEditandoId(Number(f.id))
        reset({
            nome: f.nome,
            cpf: mascaraCpf(f.cpf),
            matricula: f.matricula,
            cargo: f.cargo,
            telefone: f.telefone,
            email: f.email,
            senha: '', // a senha nunca volta preenchida
            endereco: f.endereco,
            numero: f.numero,
            complemento: f.complemento ?? '',
            bairro: f.bairro,
            cidade: f.cidade,
            cep: mascaraCep(f.cep),
        })
        window.scrollTo({ top: 0, behavior: 'smooth' })
    }

    function cancelarEdicao() {
        setEditandoId(null)
        reset(FORM_VAZIO)
    }

    async function salvarFuncionario(dados: FuncionarioForm) {
        // No cadastro a senha é obrigatória; na edição, em branco = manter a atual
        if (!editandoId && !dados.senha) {
            setError('senha', { message: 'Senha é obrigatória' })
            return
        }

        const corpo = {
            nome: dados.nome.trim(),
            cpf: dados.cpf,
            matricula: dados.matricula.trim(),
            cargo: dados.cargo.trim(),
            telefone: dados.telefone.trim(),
            email: dados.email.trim(),
            endereco: dados.endereco.trim(),
            numero: dados.numero.trim(),
            complemento: dados.complemento?.trim() || '',
            bairro: dados.bairro.trim(),
            cidade: dados.cidade.trim(),
            cep: dados.cep,
            // Só envia a senha se ela foi digitada
            ...(dados.senha ? { senha: dados.senha } : {}),
        }

        setEnviando(true)
        try {
            const resposta = await apiFetch(
                editandoId ? `/api/funcionarios/${editandoId}` : '/api/funcionarios',
                {
                    method: editandoId ? 'PUT' : 'POST',
                    body: JSON.stringify(corpo),
                },
            )

            if (!resposta.ok) {
                toast.error(await lerErro(resposta, 'Não foi possível salvar o funcionário'))
                return
            }

            toast.success(
                editandoId ? 'Funcionário atualizado com sucesso!' : 'Funcionário cadastrado com sucesso!',
            )
            cancelarEdicao()
            await carregarFuncionarios()
        } catch {
            toast.error('Erro de conexão com o servidor')
        } finally {
            setEnviando(false)
        }
    }

    async function excluirFuncionario(id: number) {
        if (!confirm('Excluir este funcionário? Essa ação não pode ser desfeita.')) {
            return
        }

        setExcluindoId(id)
        try {
            const resposta = await apiFetch(`/api/funcionarios/${id}`, {
                method: 'DELETE',
            })

            if (!resposta.ok) {
                toast.error(await lerErro(resposta, 'Não foi possível excluir o funcionário'))
                return
            }

            toast.success('Funcionário excluído com sucesso')
            setFuncionarios((atual) => atual.filter((item) => item.id !== id))
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
                    Gerenciar Funcionários
                </h1>
                <p className='mt-2 text-sm text-gray-600 dark:text-gray-400'>
                    Somente diretores podem criar, editar ou excluir funcionários.
                </p>
            </div>

            <form
                onSubmit={handleSubmit(salvarFuncionario)}
                className='grid gap-4 rounded-xl border border-gray-200 bg-white p-6 shadow-sm dark:border-gray-700 dark:bg-gray-800'
            >
                <h2 className='text-lg font-semibold text-gray-900 dark:text-white'>
                    {editandoId ? 'Editar Funcionário' : 'Novo Funcionário'}
                </h2>

                <div className='grid gap-4 md:grid-cols-2 lg:grid-cols-3'>
                    <div>
                        <label className={CLASSE_LABEL}>Nome</label>
                        <input type='text' {...register('nome')} className={CLASSE_INPUT} />
                        {errors.nome && <p className='mt-1 text-sm text-red-600'>{errors.nome.message}</p>}
                    </div>

                    <div>
                        <label className={CLASSE_LABEL}>CPF</label>
                        <input
                            type='text'
                            inputMode='numeric'
                            placeholder='000.000.000-00'
                            {...register('cpf', {
                                onChange: (e) => setValue('cpf', mascaraCpf(e.target.value)),
                            })}
                            className={CLASSE_INPUT}
                        />
                        {errors.cpf && <p className='mt-1 text-sm text-red-600'>{errors.cpf.message}</p>}
                    </div>

                    <div>
                        <label className={CLASSE_LABEL}>Matrícula</label>
                        <input type='text' {...register('matricula')} className={CLASSE_INPUT} />
                        {errors.matricula && <p className='mt-1 text-sm text-red-600'>{errors.matricula.message}</p>}
                    </div>

                    <div>
                        <label className={CLASSE_LABEL}>Cargo</label>
                        <input type='text' {...register('cargo')} className={CLASSE_INPUT} />
                        {errors.cargo && <p className='mt-1 text-sm text-red-600'>{errors.cargo.message}</p>}
                    </div>

                    <div>
                        <label className={CLASSE_LABEL}>Telefone</label>
                        <input type='text' {...register('telefone')} className={CLASSE_INPUT} />
                        {errors.telefone && <p className='mt-1 text-sm text-red-600'>{errors.telefone.message}</p>}
                    </div>

                    <div>
                        <label className={CLASSE_LABEL}>Email</label>
                        <input type='email' {...register('email')} className={CLASSE_INPUT} />
                        {errors.email && <p className='mt-1 text-sm text-red-600'>{errors.email.message}</p>}
                    </div>

                    <div>
                        <label className={CLASSE_LABEL}>
                            {editandoId ? 'Nova senha (deixe em branco para manter)' : 'Senha'}
                        </label>
                        <input type='password' {...register('senha')} className={CLASSE_INPUT} />
                        {errors.senha && <p className='mt-1 text-sm text-red-600'>{errors.senha.message}</p>}
                    </div>

                    <div className='md:col-span-2 lg:col-span-3'>
                        <label className={CLASSE_LABEL}>Endereço</label>
                        <input type='text' {...register('endereco')} className={CLASSE_INPUT} />
                        {errors.endereco && <p className='mt-1 text-sm text-red-600'>{errors.endereco.message}</p>}
                    </div>

                    <div>
                        <label className={CLASSE_LABEL}>Número</label>
                        <input type='text' {...register('numero')} className={CLASSE_INPUT} />
                        {errors.numero && <p className='mt-1 text-sm text-red-600'>{errors.numero.message}</p>}
                    </div>

                    <div>
                        <label className={CLASSE_LABEL}>Complemento (opcional)</label>
                        <input type='text' {...register('complemento')} className={CLASSE_INPUT} />
                    </div>

                    <div>
                        <label className={CLASSE_LABEL}>Bairro</label>
                        <input type='text' {...register('bairro')} className={CLASSE_INPUT} />
                        {errors.bairro && <p className='mt-1 text-sm text-red-600'>{errors.bairro.message}</p>}
                    </div>

                    <div>
                        <label className={CLASSE_LABEL}>Cidade</label>
                        <input type='text' {...register('cidade')} className={CLASSE_INPUT} />
                        {errors.cidade && <p className='mt-1 text-sm text-red-600'>{errors.cidade.message}</p>}
                    </div>

                    <div>
                        <label className={CLASSE_LABEL}>CEP</label>
                        <input
                            type='text'
                            inputMode='numeric'
                            placeholder='00000-000'
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
                        {enviando
                            ? 'Salvando...'
                            : editandoId
                              ? 'Salvar Alterações'
                              : 'Cadastrar Funcionário'}
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
                <div className='mb-4 flex items-center justify-between gap-3'>
                    <h2 className='text-2xl font-bold text-gray-900 dark:text-white'>
                        Funcionários Cadastrados
                    </h2>
                </div>

                {carregando && <p className='text-gray-500 dark:text-gray-400'>Carregando funcionários...</p>}

                {!carregando && funcionarios.length === 0 && (
                    <p className='text-gray-500 dark:text-gray-400'>
                        Nenhum funcionário cadastrado ainda.
                    </p>
                )}

                {!carregando && funcionarios.length > 0 && (
                    <div className='overflow-x-auto rounded-xl border border-gray-200 bg-white shadow-sm dark:border-gray-700 dark:bg-gray-800'>
                        <table className='w-full text-left text-sm'>
                            <thead>
                                <tr className='border-b border-gray-200 text-gray-500 dark:border-gray-700 dark:text-gray-400'>
                                    <th className='px-4 py-3 font-medium'>Nome</th>
                                    <th className='px-4 py-3 font-medium'>CPF</th>
                                    <th className='px-4 py-3 font-medium'>Matrícula</th>
                                    <th className='px-4 py-3 font-medium'>Cargo</th>
                                    <th className='px-4 py-3 font-medium'>Email</th>
                                    <th className='px-4 py-3 text-right font-medium'>Ações</th>
                                </tr>
                            </thead>
                            <tbody>
                                {funcionarios.map((f) => (
                                    <tr
                                        key={f.id}
                                        className={`border-b border-gray-100 last:border-0 dark:border-gray-700 ${
                                            editandoId === f.id ? 'bg-emerald-50 dark:bg-emerald-950' : ''
                                        }`}
                                    >
                                        <td className='px-4 py-3 text-gray-900 dark:text-white'>{f.nome}</td>
                                        <td className='px-4 py-3 text-gray-700 dark:text-gray-300'>{f.cpf}</td>
                                        <td className='px-4 py-3 text-gray-700 dark:text-gray-300'>{f.matricula}</td>
                                        <td className='px-4 py-3 text-gray-700 dark:text-gray-300'>{f.cargo}</td>
                                        <td className='px-4 py-3 text-gray-700 dark:text-gray-300'>{f.email}</td>
                                        <td className='px-4 py-3'>
                                            <div className='flex justify-end gap-2'>
                                                <button
                                                    type='button'
                                                    onClick={() => iniciarEdicao(f)}
                                                    className='rounded-lg border border-emerald-700 px-3 py-1.5 text-sm font-medium text-emerald-700 hover:bg-emerald-50 dark:hover:bg-emerald-950'
                                                >
                                                    Editar
                                                </button>
                                                <button
                                                    type='button'
                                                    disabled={excluindoId === f.id}
                                                    onClick={() => excluirFuncionario(Number(f.id))}
                                                    className='rounded-lg border border-red-600 px-3 py-1.5 text-sm font-medium text-red-600 hover:bg-red-50 disabled:opacity-50 dark:hover:bg-red-950'
                                                >
                                                    {excluindoId === f.id ? 'Excluindo...' : 'Excluir'}
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