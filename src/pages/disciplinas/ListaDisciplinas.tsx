import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { Disciplina } from '../../types/disciplina'

export default function ListaDisciplinas() {
  const [disciplinas, setDisciplinas] = useState<Disciplina[]>([])
  const [carregando, setCarregando] = useState(true)
  const [erro, setErro] = useState('')
  const navigate = useNavigate()

  const buscarDisciplinas = async () => {
    setCarregando(true)
    setErro('')
    try {
      const resposta = await fetch('http://localhost:3001/api/disciplinas')
      if (!resposta.ok) throw new Error('Erro ao buscar disciplinas')
      const dados: Disciplina[] = await resposta.json()
      setDisciplinas(dados)
    } catch {
      setErro('Não foi possível carregar as disciplinas.')
    } finally {
      setCarregando(false)
    }
  }

  const excluirDisciplina = async (id: number) => {
    if (!confirm('Tem certeza que deseja excluir esta disciplina?')) return
    try {
      const resposta = await fetch(`http://localhost:3001/api/disciplinas/${id}`, {
        method: 'DELETE',
      })
      if (!resposta.ok) throw new Error('Erro ao excluir')
      setDisciplinas((prev) => prev.filter((d) => d.id !== id))
    } catch {
      alert('Erro ao excluir disciplina.')
    }
  }

  useEffect(() => {
    buscarDisciplinas()
  }, [])

  return (
    <div className="p-8">
      {/* Cabeçalho */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-800">Disciplinas</h1>
          <p className="text-gray-500 text-sm mt-0.5">Gerencie as disciplinas cadastradas</p>
        </div>
        <button
          onClick={() => navigate('/disciplinas/nova')}
          className="bg-emerald-700 hover:bg-emerald-800 text-white font-semibold px-5 py-2.5 rounded-lg transition-colors duration-200 flex items-center gap-2"
        >
          <span>+</span>
          Nova Disciplina
        </button>
      </div>

      {/* Conteúdo */}
      {carregando ? (
        <div className="flex items-center justify-center py-20">
          <div className="text-emerald-700 text-lg font-medium">Carregando disciplinas...</div>
        </div>
      ) : erro ? (
        <div className="bg-red-50 border border-red-200 text-red-700 rounded-lg px-6 py-4">
          {erro}
          <button
            onClick={buscarDisciplinas}
            className="ml-4 underline text-red-600 hover:text-red-800"
          >
            Tentar novamente
          </button>
        </div>
      ) : disciplinas.length === 0 ? (
        <div className="bg-white rounded-xl border border-gray-200 py-20 flex flex-col items-center justify-center text-gray-400">
          <span className="text-5xl mb-4">📚</span>
          <p className="text-lg font-medium">Nenhuma disciplina cadastrada</p>
          <p className="text-sm mt-1">Clique em "Nova Disciplina" para começar</p>
        </div>
      ) : (
        <div className="bg-white rounded-xl border border-gray-200 overflow-hidden shadow-sm">
          <table className="w-full">
            <thead>
              <tr className="bg-emerald-50 border-b border-emerald-100">
                <th className="text-left text-xs font-semibold text-emerald-800 uppercase tracking-wide px-6 py-3">Nome</th>
                <th className="text-left text-xs font-semibold text-emerald-800 uppercase tracking-wide px-6 py-3">Carga Horária</th>
                <th className="text-left text-xs font-semibold text-emerald-800 uppercase tracking-wide px-6 py-3">Professor</th>
                <th className="text-left text-xs font-semibold text-emerald-800 uppercase tracking-wide px-6 py-3">Sala</th>
                <th className="text-left text-xs font-semibold text-emerald-800 uppercase tracking-wide px-6 py-3">Capacidade</th>
                <th className="text-right text-xs font-semibold text-emerald-800 uppercase tracking-wide px-6 py-3">Ações</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {disciplinas.map((disciplina) => (
                <tr key={disciplina.id} className="hover:bg-gray-50 transition-colors">
                  <td className="px-6 py-4 text-gray-800 font-medium">{disciplina.nome}</td>
                  <td className="px-6 py-4 text-gray-600">{disciplina.cargaHoraria}</td>
                  <td className="px-6 py-4 text-gray-600">{disciplina.professorNome}</td>
                  <td className="px-6 py-4 text-gray-600">{disciplina.sala}</td>
                  <td className="px-6 py-4 text-gray-600">{disciplina.capacidade}</td>
                  <td className="px-6 py-4 text-right space-x-2">
                    <button
                      onClick={() => navigate(`/disciplinas/${disciplina.id}/editar`)}
                      className="bg-emerald-100 hover:bg-emerald-200 text-emerald-800 text-sm font-medium px-3 py-1.5 rounded-lg transition-colors"
                    >
                      ✏️ Editar
                    </button>
                    <button
                      onClick={() => excluirDisciplina(disciplina.id!)}
                      className="bg-red-100 hover:bg-red-200 text-red-700 text-sm font-medium px-3 py-1.5 rounded-lg transition-colors"
                    >
                      🗑️ Excluir
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}
