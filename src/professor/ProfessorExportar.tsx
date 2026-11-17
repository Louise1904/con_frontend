import { useEffect, useState } from 'react'
import { pdf } from '@react-pdf/renderer'
import { toast } from 'sonner'
import { apiFetch, lerErro } from '../api/api'
import { useAuthStore } from '../context/authStore'
import type { Turma } from '../utils/types'
import DiarioPDF, { type DadosDiario } from '../admin/pdf/DiarioPDF'

// Cada opção é uma combinação turma + disciplina em que este professor está vinculado
type Opcao = {
    turmaId: number
    turmaNome: string
    turno: string
    disciplinaId: number
    disciplinaNome: string
}

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

export default function ProfessorExportar() {
    const user = useAuthStore((state) => state.user)

    const [opcoes, setOpcoes] = useState<Opcao[]>([])
    const [carregandoOpcoes, setCarregandoOpcoes] = useState(true)
    const [opcaoSelecionada, setOpcaoSelecionada] = useState('') // "turmaId-disciplinaId"
    const [mes, setMes] = useState(mesAtual())

    const [gerando, setGerando] = useState(false)
    const [ultimo, setUltimo] = useState<DadosDiario | null>(null)

    const [turmaIdSel, disciplinaIdSel] = opcaoSelecionada ? opcaoSelecionada.split('-') : ['', '']

    useEffect(() => {
        async function carregarMinhasOpcoes() {
            setCarregandoOpcoes(true)
            try {
                const resposta = await apiFetch('/api/turmas')
                if (!resposta.ok) throw new Error()
                const turmas: Turma[] = await resposta.json()

                const minhas: Opcao[] = []
                turmas.forEach((t) => {
                    t.professores
                        ?.filter((p) => Number(p.funcionario.id) === Number(user?.id))
                        .forEach((p) => {
                            minhas.push({
                                turmaId: t.id!,
                                turmaNome: t.nome,
                                turno: t.turno,
                                disciplinaId: p.disciplinaId,
                                disciplinaNome: p.disciplina.nome,
                            })
                        })
                })
                setOpcoes(minhas)
            } catch {
                toast.error('Não foi possível carregar suas turmas')
            } finally {
                setCarregandoOpcoes(false)
            }
        }
        if (user?.id) carregarMinhasOpcoes()
    }, [user?.id])

    // Gera o PDF a partir dos dados e faz o navegador baixar o arquivo
    async function baixarPdf(dados: DadosDiario) {
        const arquivo = await pdf(<DiarioPDF dados={dados} />).toBlob()
        const url = URL.createObjectURL(arquivo)

        const link = document.createElement('a')
        link.href = url
        link.download = `diario-${paraNomeDeArquivo(dados.turma.nome)}-${paraNomeDeArquivo(dados.disciplina.nome)}-${dados.mes}.pdf`
        link.click()

        URL.revokeObjectURL(url)
    }

    async function exportar() {
        if (!turmaIdSel || !disciplinaIdSel || !mes) {
            toast.error('Selecione a turma/disciplina e o mês')
            return
        }

        setGerando(true)
        try {
            const resposta = await apiFetch(
                `/api/chamadas/exportar?turmaId=${turmaIdSel}&disciplinaId=${disciplinaIdSel}&mes=${mes}`,
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
                        <label className={CLASSE_LABEL}>Turma / Disciplina</label>
                        <select
                            value={opcaoSelecionada}
                            onChange={(e) => setOpcaoSelecionada(e.target.value)}
                            className={CLASSE_INPUT}
                        >
                            <option value=''>Selecione</option>
                            {opcoes.map((o) => (
                                <option key={`${o.turmaId}-${o.disciplinaId}`} value={`${o.turmaId}-${o.disciplinaId}`}>
                                    {o.turmaNome} ({o.turno}) — {o.disciplinaNome}
                                </option>
                            ))}
                        </select>
                        {!carregandoOpcoes && opcoes.length === 0 && (
                            <p className='mt-1 text-xs text-gray-500'>
                                Você ainda não está vinculado(a) a nenhuma turma/disciplina.
                            </p>
                        )}
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