import { useState, useEffect } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { Disciplina } from '../../types/disciplina'

const formInicial: Disciplina = {
  nome: '',
  cargaHoraria: '',
  professorNome: '',
  sala: '',
  capacidade: '',
  descricao: '',
}

export default function EditarDisciplina() {
  const { id } = useParams<{ id: string }>()
  const [form, setForm] = useState<Disciplina>(formInicial)
  const [carregando, setCarregando] = useState(true)
  const [salvando, setSalvando] = useState(false)
  const [erro, setErro] = useState('')
  const navigate = useNavigate()

  useEffect(() => {
    const buscarDisciplina = async () => {
      try {
        const resposta = await fetch(`http://localhost:3001/api/disciplinas/${id}`)
        if (!resposta.ok) throw new Error('Disciplina não encontrada')
        const dados: Disciplina = await resposta.json()
        setForm(dados)
      } catch {
        setErro('Não foi possível carregar a disciplina.')
      } finally {
        setCarregando(false)
      }
    }

    buscarDisciplina()
  }, [id])

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target
    setForm((prev) => ({ ...prev, [name]: value }))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setErro('')
    setSalvando(true)

    try {
      const resposta = await fetch(`http://localhost:3001/api/disciplinas/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...form,
          capacidade: Number(form.capacidade),
        }),
      })

      if (!resposta.ok) {
        const dados = await resposta.json().catch(() => ({}))
        setErro(dados.mensagem || 'Erro ao salvar disciplina.')
        return
      }

      navigate('/disciplinas')
    } catch {
      setErro('Erro de conexão. Verifique se o servidor está rodando.')
    } finally {
      setSalvando(false)
    }
  }

  if (carregando) {
    return (
      <div className="p-8 flex items-center justify-center py-20">
        <div className="text-emerald-700 text-lg font-medium">Carregando disciplina...</div>
      </div>
    )
  }

  return (
    <div className="p-8">
      <div className="max-w-2xl mx-auto">
        {/* Cabeçalho */}
        <div className="mb-6">
          <button
            onClick={() => navigate('/disciplinas')}
            className="text-emerald-700 hover:text-emerald-900 text-sm font-medium flex items-center gap-1 mb-3"
          >
            ← Voltar para Disciplinas
          </button>
          <h1 className="text-2xl font-bold text-gray-800">Editar Disciplina</h1>
          <p className="text-gray-500 text-sm mt-0.5">Atualize os dados da disciplina</p>
        </div>

        {/* Formulário */}
        <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-8">
          {erro && (
            <div className="bg-red-50 border border-red-200 text-red-700 rounded-lg px-4 py-3 text-sm mb-6">
              {erro}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-5">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
              <div className="sm:col-span-2">
                <label className="block text-sm font-semibold text-gray-700 mb-1">
                  Nome da Disciplina <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  name="nome"
                  value={form.nome}
                  onChange={handleChange}
                  required
                  placeholder="Ex: Matemática"
                  className="w-full bg-emerald-50 border border-emerald-200 rounded-lg px-4 py-2.5 text-gray-800 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent transition"
                />
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1">
                  Carga Horária <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  name="cargaHoraria"
                  value={form.cargaHoraria}
                  onChange={handleChange}
                  required
                  placeholder="Ex: 60h"
                  className="w-full bg-emerald-50 border border-emerald-200 rounded-lg px-4 py-2.5 text-gray-800 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent transition"
                />
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1">
                  Nome do Professor <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  name="professorNome"
                  value={form.professorNome}
                  onChange={handleChange}
                  required
                  placeholder="Ex: João Silva"
                  className="w-full bg-emerald-50 border border-emerald-200 rounded-lg px-4 py-2.5 text-gray-800 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent transition"
                />
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1">
                  Sala <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  name="sala"
                  value={form.sala}
                  onChange={handleChange}
                  required
                  placeholder="Ex: Sala 101"
                  className="w-full bg-emerald-50 border border-emerald-200 rounded-lg px-4 py-2.5 text-gray-800 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent transition"
                />
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1">
                  Capacidade <span className="text-red-500">*</span>
                </label>
                <input
                  type="number"
                  name="capacidade"
                  value={form.capacidade}
                  onChange={handleChange}
                  required
                  min={1}
                  placeholder="Ex: 30"
                  className="w-full bg-emerald-50 border border-emerald-200 rounded-lg px-4 py-2.5 text-gray-800 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent transition"
                />
              </div>

              <div className="sm:col-span-2">
                <label className="block text-sm font-semibold text-gray-700 mb-1">
                  Descrição
                </label>
                <textarea
                  name="descricao"
                  value={form.descricao}
                  onChange={handleChange}
                  rows={3}
                  placeholder="Descrição opcional da disciplina..."
                  className="w-full bg-emerald-50 border border-emerald-200 rounded-lg px-4 py-2.5 text-gray-800 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent transition resize-none"
                />
              </div>
            </div>

            {/* Botões */}
            <div className="flex gap-3 pt-2">
              <button
                type="button"
                onClick={() => navigate('/disciplinas')}
                className="flex-1 border border-gray-300 hover:bg-gray-50 text-gray-700 font-semibold py-2.5 rounded-lg transition-colors duration-200"
              >
                Cancelar
              </button>
              <button
                type="submit"
                disabled={salvando}
                className="flex-1 bg-emerald-700 hover:bg-emerald-800 disabled:bg-emerald-400 text-white font-semibold py-2.5 rounded-lg transition-colors duration-200"
              >
                {salvando ? 'Salvando...' : '✓ Salvar Alterações'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  )
}
