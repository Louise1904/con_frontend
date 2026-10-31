import { useEffect, useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { toast } from 'sonner'
import { apiFetch } from '../api/api'
import type { Funcionario } from '../utils/types'

const funcionarioSchema = z.object({
    nome: z.string().trim().min(3, 'Nome é obrigatório').max(100),
    cpf: z.string().trim().min(14, 'CPF é obrigatório').max(14),
    matricula: z.string().trim().min(1, 'Matrícula é obrigatória').max(20),
    cargo: z.string().trim().min(1, 'Cargo é obrigatório').max(50),
    telefone: z.string().trim().min(1, 'Telefone é obrigatório').max(20),
    email: z.string().trim().min(1, 'Email é obrigatório').email('Email inválido').max(100),
    senha: z.string().trim().min(6, 'Senha deve ter no mínimo 6 caracteres').max(60),
    endereco: z.string().trim().min(1, 'Endereço é obrigatório').max(150),
    numero: z.string().trim().min(1, 'Número é obrigatório'),
    complemento: z.string().trim().max(100).optional(),
    bairro: z.string().trim().min(1, 'Bairro é obrigatório').max(50),
    cidade: z.string().trim().min(1, 'Cidade é obrigatória').max(50),
    cep: z.string().trim().min(8, 'CEP é obrigatório(8 dígitos)').max(8),
})

type FuncionarioForm = z.infer<typeof funcionarioSchema>

export default function AdminFuncionarios() {
    const [funcionarios, setFuncionarios] = useState<Funcionario[]>([])
    const [carregando, setCarregando] = useState(true)
    const [enviando, setEnviando] = useState(false)
    const [excluindoId, setExcluindoId] = useState<number | null>(null)

    const { register, handleSubmit, reset, formState: { errors } } =
        useForm<FuncionarioForm>({
            resolver: zodResolver(funcionarioSchema),
            defaultValues: {
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
            },
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

    async function cadastrarFuncionario(dados: FuncionarioForm) {
        setEnviando(true)
        try {
            const resposta = await apiFetch('/api/funcionarios', {
                method: 'POST',
                body: JSON.stringify({
                    nome: dados.nome.trim(),
                    cpf: dados.cpf.trim(),
                    matricula: dados.matricula.trim(),
                    cargo: dados.cargo.trim(),
                    telefone: dados.telefone.trim(),
                    email: dados.email.trim(),
                    senha: dados.senha.trim(),
                    endereco: dados.endereco.trim(),
                    numero: dados.numero.trim(),
                    complemento: dados.complemento?.trim() || '',
                    bairro: dados.bairro.trim(),
                    cidade: dados.cidade.trim(),
                    cep: dados.cep.trim(),
                }),
            })

            if (!resposta.ok) {
                const corpo = await resposta.json().catch(() => null)
                toast.error(corpo?.erro ?? 'Não foi possível cadastrar o funcionário')
                return
            }

            toast.success('Funcionário cadastrado com sucesso!')
            reset({
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
            })
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
                const corpo = await resposta.json().catch(() => null)
                toast.error(corpo?.erro ?? 'Não foi possível excluir o funcionário')
                return
            }

            toast.success('Funcionário excluído com sucesso')
            setFuncionarios((atual) => atual.filter((item) => item.id !== id))
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
                onSubmit={handleSubmit(cadastrarFuncionario)}
                className='grid gap-4 rounded-xl border border-gray-200 bg-white p-6 shadow-sm dark:border-gray-700 dark:bg-gray-800'
            >
                <div className='grid gap-4 md:grid-cols-2 lg:grid-cols-3'>
                    <div>
                        <label className='mb-1 block text-sm font-medium text-gray-700 dark:text-gray-300'>
                            Nome
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
                            CPF
                        </label>
                        <input
                            type='text'
                            placeholder='000.000.000-00'
                            {...register('cpf')}
                            className='w-full rounded-lg border border-gray-300 px-3 py-2 text-gray-900 outline-none focus:border-emerald-600 dark:border-gray-600 dark:bg-gray-900 dark:text-white'
                        />
                        {errors.cpf && (
                            <p className='mt-1 text-sm text-red-600'>{errors.cpf.message}</p>
                        )}
                    </div>

                    <div>
                        <label className='mb-1 block text-sm font-medium text-gray-700 dark:text-gray-300'>
                            Matrícula
                        </label>
                        <input
                            type='text'
                            {...register('matricula')}
                            className='w-full rounded-lg border border-gray-300 px-3 py-2 text-gray-900 outline-none focus:border-emerald-600 dark:border-gray-600 dark:bg-gray-900 dark:text-white'
                        />
                        {errors.matricula && (
                            <p className='mt-1 text-sm text-red-600'>{errors.matricula.message}</p>
                        )}
                    </div>

                    <div>
                        <label className='mb-1 block text-sm font-medium text-gray-700 dark:text-gray-300'>
                            Cargo
                        </label>
                        <input
                            type='text'
                            {...register('cargo')}
                            className='w-full rounded-lg border border-gray-300 px-3 py-2 text-gray-900 outline-none focus:border-emerald-600 dark:border-gray-600 dark:bg-gray-900 dark:text-white'
                        />
                        {errors.cargo && (
                            <p className='mt-1 text-sm text-red-600'>{errors.cargo.message}</p>
                        )}
                    </div>

                    <div>
                        <label className='mb-1 block text-sm font-medium text-gray-700 dark:text-gray-300'>
                            Telefone
                        </label>
                        <input
                            type='text'
                            {...register('telefone')}
                            className='w-full rounded-lg border border-gray-300 px-3 py-2 text-gray-900 outline-none focus:border-emerald-600 dark:border-gray-600 dark:bg-gray-900 dark:text-white'
                        />
                        {errors.telefone && (
                            <p className='mt-1 text-sm text-red-600'>{errors.telefone.message}</p>
                        )}
                    </div>

                    <div>
                        <label className='mb-1 block text-sm font-medium text-gray-700 dark:text-gray-300'>
                            Email
                        </label>
                        <input
                            type='email'
                            {...register('email')}
                            className='w-full rounded-lg border border-gray-300 px-3 py-2 text-gray-900 outline-none focus:border-emerald-600 dark:border-gray-600 dark:bg-gray-900 dark:text-white'
                        />
                        {errors.email && (
                            <p className='mt-1 text-sm text-red-600'>{errors.email.message}</p>
                        )}
                    </div>

                    <div>
                        <label className='mb-1 block text-sm font-medium text-gray-700 dark:text-gray-300'>
                            Senha
                        </label>
                        <input
                            type='password'
                            {...register('senha')}
                            className='w-full rounded-lg border border-gray-300 px-3 py-2 text-gray-900 outline-none focus:border-emerald-600 dark:border-gray-600 dark:bg-gray-900 dark:text-white'
                        />
                        {errors.senha && (
                            <p className='mt-1 text-sm text-red-600'>{errors.senha.message}</p>
                        )}
                    </div>

                    <div className='md:col-span-2 lg:col-span-3'>
                        <label className='mb-1 block text-sm font-medium text-gray-700 dark:text-gray-300'>
                            Endereço
                        </label>
                        <input
                            type='text'
                            {...register('endereco')}
                            className='w-full rounded-lg border border-gray-300 px-3 py-2 text-gray-900 outline-none focus:border-emerald-600 dark:border-gray-600 dark:bg-gray-900 dark:text-white'
                        />
                        {errors.endereco && (
                            <p className='mt-1 text-sm text-red-600'>{errors.endereco.message}</p>
                        )}
                    </div>

                    <div>
                        <label className='mb-1 block text-sm font-medium text-gray-700 dark:text-gray-300'>
                            Número
                        </label>
                        <input
                            type='text'
                            {...register('numero')}
                            className='w-full rounded-lg border border-gray-300 px-3 py-2 text-gray-900 outline-none focus:border-emerald-600 dark:border-gray-600 dark:bg-gray-900 dark:text-white'
                        />
                        {errors.numero && (
                            <p className='mt-1 text-sm text-red-600'>{errors.numero.message}</p>
                        )}
                    </div>

                    <div>
                        <label className='mb-1 block text-sm font-medium text-gray-700 dark:text-gray-300'>
                            Complemento (opcional)
                        </label>
                        <input
                            type='text'
                            {...register('complemento')}
                            className='w-full rounded-lg border border-gray-300 px-3 py-2 text-gray-900 outline-none focus:border-emerald-600 dark:border-gray-600 dark:bg-gray-900 dark:text-white'
                        />
                    </div>

                    <div>
                        <label className='mb-1 block text-sm font-medium text-gray-700 dark:text-gray-300'>
                            Bairro
                        </label>
                        <input
                            type='text'
                            {...register('bairro')}
                            className='w-full rounded-lg border border-gray-300 px-3 py-2 text-gray-900 outline-none focus:border-emerald-600 dark:border-gray-600 dark:bg-gray-900 dark:text-white'
                        />
                        {errors.bairro && (
                            <p className='mt-1 text-sm text-red-600'>{errors.bairro.message}</p>
                        )}
                    </div>

                    <div>
                        <label className='mb-1 block text-sm font-medium text-gray-700 dark:text-gray-300'>
                            Cidade
                        </label>
                        <input
                            type='text'
                            {...register('cidade')}
                            className='w-full rounded-lg border border-gray-300 px-3 py-2 text-gray-900 outline-none focus:border-emerald-600 dark:border-gray-600 dark:bg-gray-900 dark:text-white'
                        />
                        {errors.cidade && (
                            <p className='mt-1 text-sm text-red-600'>{errors.cidade.message}</p>
                        )}
                    </div>

                    <div>
                        <label className='mb-1 block text-sm font-medium text-gray-700 dark:text-gray-300'>
                            CEP
                        </label>
                        <input
                            type='text'
                            placeholder='00000000'
                            {...register('cep')}
                            className='w-full rounded-lg border border-gray-300 px-3 py-2 text-gray-900 outline-none focus:border-emerald-600 dark:border-gray-600 dark:bg-gray-900 dark:text-white'
                        />
                        {errors.cep && (
                            <p className='mt-1 text-sm text-red-600'>{errors.cep.message}</p>
                        )}
                    </div>
                </div>

                <div className='flex gap-3'>
                    <button
                        type='submit'
                        disabled={enviando}
                        className='rounded-lg bg-emerald-700 px-4 py-2 font-medium text-white hover:bg-emerald-800 disabled:opacity-50 disabled:cursor-not-allowed transition-colors'
                    >
                        {enviando ? 'Cadastrando...' : 'Cadastrar Funcionário'}
                    </button>
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
                                    <tr key={f.id} className='border-b border-gray-100 last:border-0 dark:border-gray-700'>
                                        <td className='px-4 py-3 text-gray-900 dark:text-white'>{f.nome}</td>
                                        <td className='px-4 py-3 text-gray-700 dark:text-gray-300'>{f.cpf}</td>
                                        <td className='px-4 py-3 text-gray-700 dark:text-gray-300'>{f.matricula}</td>
                                        <td className='px-4 py-3 text-gray-700 dark:text-gray-300'>{f.cargo}</td>
                                        <td className='px-4 py-3 text-gray-700 dark:text-gray-300'>{f.email}</td>
                                        <td className='px-4 py-3'>
                                            <div className='flex justify-end gap-2'>
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