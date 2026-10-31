import { useEffect, useState } from 'react'
import { pdf } from '@react-pdf/renderer'
import { toast } from 'sonner'
import { apiFetch, lerErro } from '../api/api'
import DiarioPDF, { type DadosDiario } from './pdf/DiarioPDF'

type Turma = { id: number; nome: string; turno: string }
type Disciplina = { id: number; nome: string }

// Mês atual no formato AAAA-MM (no fuso do navegador)
function mesAtual() {
    const d = new Date()
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`
}

// "Jardim A" -> "jardim-a" (para o nome do arquivo)
function paraNomeDeArquivo(texto: string) {
    return texto
        .normalize('NFD')
        .replace(/[\u0300-\u036f]/g, '') // tira acentos
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/(^-|-$)/g, '')
}

const CLASSE_INPUT =
    'w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm text-gray-900 outline-none focus:border-emerald-600 dark:border-gray-600 dark:bg-gray-900 dark:text-white'
const CLASSE_LABEL = 'mb-1 block text-sm font-medium text-gray-700 dark:text-gray-300'

export default function AdminExportar() {
    const [turmas, setTurmas] = useState<Turma[]>([])
    const [disciplinas, setDisciplinas] = useState<Disciplina[]>([])

    const [turmaId, setTurmaId] = useState('')
    const [disciplinaId, setDisciplinaId] = useState('')
    const [mes, setMes] = useState(mesAtual())

    const [gerando, setGerando] = useState(false)
    // Dados da última exportação (mostra o resumo e permite baixar de novo)
    const [ultimo, setUltimo] = useState<DadosDiario | null>(null)

    useEffect(() => {
        async function carregarListas() {
            try {
                const [rTurmas, rDisciplinas] = await Promise.all([
                    apiFetch('/api/turmas'),
                    apiFetch('/api/disciplinas'),
                ])
                if (!rTurmas.ok || !rDisciplinas.ok) throw new Error()
                setTurmas(await rTurmas.json())
                setDisciplinas(await rDisciplinas.json())
            } catch {
                toast.error('Não foi possível carregar turmas e disciplinas')
            }
        }
        carregarListas()
    }, [])

    // Gera o PDF a partir dos dados e faz o navegador baixar o arquivo
    async function baixarPdf(dados: DadosDiario) {
        const arquivo = await pdf(<DiarioPDF dados={dados} />).toBlob()
        const url = URL.createObjectURL(arquivo)

        const link = document.createElement('a')
        link.href = url
        link.download = `diario-${paraNomeDeArquivo(dados.turma.nome)}-${paraNomeDeArquivo(dados.disciplina.nome)}-${dados.mes}.pdf`
        link.click()

        URL.revokeObjectURL(url) // libera a memória
    }

    async function exportar() {
        if (!turmaId || !disciplinaId || !mes) {
            toast.error('Selecione a turma, a disciplina e o mês')
            return
        }

        setGerando(true)
        try {
            // 1. Busca no back os dados do mês já organizados
            const resposta = await apiFetch(
                `/api/chamadas/exportar?turmaId=${turmaId}&disciplinaId=${disciplinaId}&mes=${mes}`,
            )
            if (!resposta.ok) {
                toast.error(await lerErro(resposta, 'Não foi possível buscar os dados da chamada'))
                return
            }
            const dados: DadosDiario = await resposta.json()

            if (dados.totais.aulas === 0) {
                toast.warning('Não há chamadas registradas nesse mês para essa turma e disciplina')
                return
            }

            // 2. Monta o PDF no navegador e baixa
            await baixarPdf(dados)
            setUltimo(dados)
            toast.success('PDF gerado com sucesso!')
        } catch {
            toast.error('Erro ao gerar o PDF')
        } finally {
            setGerando(false)
        }
    }

    return (
        <div className='mx-auto max-w-5xl'>
            <h1 className='mb-6 text-3xl font-extrabold text-gray-900 dark:text-white'>Exportar Dados</h1>

            <div className='mx-auto max-w-md rounded-xl border border-gray-200 bg-white p-6 shadow-sm dark:border-gray-700 dark:bg-gray-800'>
                <div className='grid gap-4'>
                    <div>
                        <label className={CLASSE_LABEL}>Turma</label>
                        <select value={turmaId} onChange={(e) => setTurmaId(e.target.value)} className={CLASSE_INPUT}>
                            <option value=''>Selecione a turma</option>
                            {turmas.map((t) => (
                                <option key={t.id} value={t.id}>
                                    {t.nome} - {t.turno}
                                </option>
                            ))}
                        </select>
                    </div>

                    <div>
                        <label className={CLASSE_LABEL}>Disciplina</label>
                        <select value={disciplinaId} onChange={(e) => setDisciplinaId(e.target.value)} className={CLASSE_INPUT}>
                            <option value=''>Selecione a disciplina</option>
                            {disciplinas.map((d) => (
                                <option key={d.id} value={d.id}>
                                    {d.nome}
                                </option>
                            ))}
                        </select>
                    </div>

                    <div>
                        <label className={CLASSE_LABEL}>Mês</label>
                        <input
                            type='month'
                            value={mes}
                            max={mesAtual()}
                            onChange={(e) => setMes(e.target.value)}
                            className={CLASSE_INPUT}
                        />
                    </div>

                    <button
                        type='button'
                        onClick={exportar}
                        disabled={gerando}
                        className='mt-2 rounded-lg bg-emerald-700 px-4 py-2 font-medium text-white hover:bg-emerald-800 disabled:opacity-50'
                    >
                        {gerando ? 'Gerando PDF...' : 'Exportar PDF'}
                    </button>
                </div>
            </div>

            {/* ---------- Resumo da última exportação ---------- */}
            {ultimo && (
                <div className='mx-auto mt-6 max-w-md rounded-xl border border-emerald-200 bg-emerald-50 p-5 dark:border-emerald-900 dark:bg-emerald-950'>
                    <h2 className='mb-3 font-semibold text-emerald-900 dark:text-emerald-100'>
                        ✓ Diário gerado
                    </h2>
                    <dl className='grid grid-cols-2 gap-y-1 text-sm'>
                        <dt className='text-gray-600 dark:text-gray-300'>Turma:</dt>
                        <dd className='font-medium'>{ultimo.turma.nome}</dd>
                        <dt className='text-gray-600 dark:text-gray-300'>Disciplina:</dt>
                        <dd className='font-medium'>{ultimo.disciplina.nome}</dd>
                        <dt className='text-gray-600 dark:text-gray-300'>Alunos:</dt>
                        <dd className='font-medium'>{ultimo.alunos.length}</dd>
                        <dt className='text-gray-600 dark:text-gray-300'>Aulas no mês:</dt>
                        <dd className='font-medium'>{ultimo.totais.aulas}</dd>
                        <dt className='text-gray-600 dark:text-gray-300'>Frequência média:</dt>
                        <dd className='font-medium'>
                            {ultimo.totais.frequenciaMedia != null ? `${ultimo.totais.frequenciaMedia}%` : '-'}
                        </dd>
                    </dl>
                    <button
                        type='button'
                        onClick={() => baixarPdf(ultimo)}
                        className='mt-4 w-full rounded-lg border border-emerald-700 px-4 py-2 text-sm font-medium text-emerald-700 hover:bg-emerald-100 dark:hover:bg-emerald-900'
                    >
                        Baixar novamente
                    </button>
                </div>
            )}
        </div>
    )
}