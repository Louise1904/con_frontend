import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { useNavigate } from 'react-router-dom'
import { toast } from 'sonner'
import { useAuthStore } from './context/authStore'
import { apiFetch, lerErro } from './api/api'

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
                toast.error(await lerErro(resposta, 'Usuário ou senha incorretos.'))
                return
            }

            const corpo = await resposta.json()
            // O back ainda não gera token (JWT fica para depois do MVP).
            // Por enquanto guardamos um identificador simples da sessão.
            login(corpo.user, `token-${corpo.user.id}`)

            toast.success(`Bem-vindo(a), ${corpo.user.nome}!`)

            // Redireciona conforme o tipo de usuário
            if (corpo.user.tipo === 'ADM') {
                navigate('/admin/inicio')
            } else {
                navigate('/professor/dashboard')
            }
        } catch {
            toast.error('Erro de conexão com o servidor')
        }
    }

    return (
        <div className="flex min-h-screen items-center justify-center bg-gradient-to-b from-emerald-50 via-white to-white px-4 py-16 dark:from-gray-900 dark:via-gray-900 dark:to-gray-900">
            <div className="w-full max-w-md rounded-xl border border-gray-200 bg-white p-8 shadow-md dark:border-gray-700 dark:bg-gray-800">
                <div className="mb-6 flex flex-col items-center text-center">
                    <svg viewBox="0 0 64 64" className="h-10 w-10" aria-hidden="true">
                        <circle cx="32" cy="32" r="26" fill="none" stroke="#047857" strokeWidth="7" />
                        <path
                            d="M20 33 L28 41 L45 22"
                            fill="none"
                            stroke="#047857"
                            strokeWidth="7"
                            strokeLinecap="round"
                            strokeLinejoin="round"
                        />
                    </svg>
                    <h1 className="mt-3 text-3xl font-bold text-emerald-900 dark:text-white">
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
                            direcao@con.local / Admin@123 (Diretor)
                        </p>
                        {/* <p className="text-xs">
                            ana.souza@con.local / Professor@123 (Professor)
                        </p> */}
                    </div>
                </form>
            </div>
        </div>
    )
}
