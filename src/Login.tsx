import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { useNavigate } from 'react-router-dom'
import { toast } from 'sonner'
import { useAuthStore } from './context/authStore'
import { apiFetch } from './api/api'

const loginSchema = z.object({
    email: z.string().email({ message: 'Informe um e-mail válido' }),
    senha: z.string().min(1, { message: 'Informe a senha' }),
})

type LoginForm = z.infer<typeof loginSchema>

export default function Login() {
    const navigate = useNavigate()
    const login = useAuthStore((state) => state.login)

    const { register, handleSubmit, formState: { errors, isSubmitting } } =
        useForm<LoginForm>({ resolver: zodResolver(loginSchema) })

    async function entrar(dados: LoginForm) {
        try {
            const resposta = await apiFetch('/api/login', {
                method: 'POST',
                body: JSON.stringify(dados),
            })

            if (!resposta.ok) {
                const corpo = await resposta.json().catch(() => null)
                toast.error(corpo?.message ?? 'Usuário ou senha incorretos.')
                return
            }

            const corpo = await resposta.json()
            login(corpo.user, `token-${corpo.user.id}`)

            toast.success(`Bem-vindo(a), ${corpo.user.nome}!`)

            // Redireciona conforme o tipo de usuário
            if (corpo.user.tipo === 'ADM') {
                navigate('/admin/dashboard')
            } else {
                navigate('/professor/dashboard')
            }
        } catch {
            toast.error('Erro de conexão com o servidor')
        }
    }

    return (
        <div className="mx-auto mt-10 max-w-md rounded-xl border border-gray-200 bg-white p-6 shadow-sm dark:border-gray-700 dark:bg-gray-800">
            <div className="text-center mb-6">
                <h1 className="text-3xl font-bold text-emerald-900 dark:text-white">
                    CON - Entrar
                </h1>
                <p className="mt-2 text-sm text-gray-500 dark:text-gray-400">
                    Controle de Chamada Acadêmica
                </p>
            </div>

            <form onSubmit={handleSubmit(entrar)} className="flex flex-col gap-4">
                <div>
                    <label className="mb-1 block text-sm font-medium text-gray-700 dark:text-gray-300">
                        E-mail
                    </label>
                    <input
                        type="email"
                        {...register('email')}
                        className="w-full rounded-lg border border-gray-300 px-3 py-2 text-gray-900 outline-none focus:border-emerald-600 dark:border-gray-600 dark:bg-gray-900 dark:text-white"
                    />
                    {errors.email && (
                        <p className="mt-1 text-sm text-red-600">
                            {errors.email.message}
                        </p>
                    )}
                </div>

                <div>
                    <label className="mb-1 block text-sm font-medium text-gray-700 dark:text-gray-300">
                        Senha
                    </label>
                    <input
                        type="password"
                        {...register('senha')}
                        className="w-full rounded-lg border border-gray-300 px-3 py-2 text-gray-900 outline-none focus:border-emerald-600 dark:border-gray-600 dark:bg-gray-900 dark:text-white"
                    />
                    {errors.senha && (
                        <p className="mt-1 text-sm text-red-600">
                            {errors.senha.message}
                        </p>
                    )}
                </div>

                <button
                    type="submit"
                    disabled={isSubmitting}
                    className="mt-2 rounded-lg bg-emerald-700 px-4 py-2 font-medium text-white hover:bg-emerald-800 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                    {isSubmitting ? 'Entrando...' : 'Entrar'}
                </button>

                <div className="mt-4 text-center text-sm text-gray-500 dark:text-gray-400">
                    <p>Usuários de teste:</p>
                    <p className="text-xs">
                        admin@con.edu.br / 123456 (Diretor)
                    </p>
                    <p className="text-xs">
                        professor@con.edu.br / 123456 (Professor)
                    </p>
                </div>
            </form>
        </div>
    )
}
