import { useState } from 'react'
import { User } from '../types/disciplina'

interface LoginProps {
  onLoginSuccess: (user: User) => void
}

export default function Login({ onLoginSuccess }: LoginProps) {
  const [email, setEmail] = useState('')
  const [senha, setSenha] = useState('')
  const [erro, setErro] = useState('')
  const [carregando, setCarregando] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setErro('')
    setCarregando(true)

    try {
      const resposta = await fetch('http://localhost:3001/api/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, senha }),
      })

      if (!resposta.ok) {
        const dados = await resposta.json().catch(() => ({}))
        setErro(dados.mensagem || 'E-mail ou senha inválidos.')
        return
      }

      const dados = await resposta.json()
      const userObj: User = dados.user ?? dados
      localStorage.setItem('user', JSON.stringify(userObj))
      onLoginSuccess(userObj)
    } catch {
      setErro('Erro de conexão. Verifique se o servidor está rodando.')
    } finally {
      setCarregando(false)
    }
  }

  return (
    <div className="min-h-screen bg-emerald-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-md overflow-hidden">
        {/* Header verde */}
        <div className="bg-emerald-700 px-8 py-10 flex flex-col items-center">
          <div className="bg-white rounded-2xl w-20 h-20 flex items-center justify-center mb-4 shadow-md">
            <span className="text-emerald-700 text-3xl font-black tracking-tight">CON</span>
          </div>
          <h1 className="text-white text-2xl font-bold">CON - Login</h1>
          <p className="text-emerald-200 text-sm mt-1">Controle de Chamada Acadêmica</p>
        </div>

        {/* Formulário */}
        <form onSubmit={handleSubmit} className="px-8 py-8 space-y-5">
          {erro && (
            <div className="bg-red-50 border border-red-200 text-red-700 rounded-lg px-4 py-3 text-sm">
              {erro}
            </div>
          )}

          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-1">
              E-mail
            </label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              placeholder="seu@email.com"
              className="w-full bg-emerald-50 border border-emerald-200 rounded-lg px-4 py-2.5 text-gray-800 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent transition"
            />
          </div>

          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-1">
              Senha
            </label>
            <input
              type="password"
              value={senha}
              onChange={(e) => setSenha(e.target.value)}
              required
              placeholder="••••••••"
              className="w-full bg-emerald-50 border border-emerald-200 rounded-lg px-4 py-2.5 text-gray-800 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent transition"
            />
          </div>

          <button
            type="submit"
            disabled={carregando}
            className="w-full bg-emerald-700 hover:bg-emerald-800 disabled:bg-emerald-400 text-white font-semibold py-3 rounded-lg transition-colors duration-200 mt-2"
          >
            {carregando ? 'Entrando...' : 'Entrar'}
          </button>
        </form>
      </div>
    </div>
  )
}
