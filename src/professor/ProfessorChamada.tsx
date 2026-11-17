import { useEffect, useState } from 'react'
import { toast } from 'sonner'
import { apiFetch, lerErro } from '../api/api'
import { useAuthStore } from '../context/authStore'
import type { Turma } from '../utils/types'

// Cada opção é uma combinação turma + disciplina em que este professor está vinculado
type Opcao = {
    turmaId: number
    turmaNome: string
    turno: string
    disciplinaId: number
    disciplinaNome: string
}

// Aluno como vem do GET /api/chamadas (presente = null quando ainda não marcado)
type AlunoChamada = { id: number; nome: string; presente: boolean | null }

type Resumo = {
    data: string
    turma: string
    disciplina: string
    presentes: number
    ausentes: number
}

// Data de hoje no fuso do navegador (AAAA-MM-DD)
function hoje() {
    const d = new Date()
    const mes = String(d.getMonth() + 1).padStart(2, '0')
    const dia = String(d.getDate()).padStart(2, '0')
    return `${d.getFullYear()}-${mes}-${dia}`
}

function formatarData(data: string) {
    const [ano, mes, dia] = data.split('-')
    return `${dia}/${mes}/${ano}`
}

const CLASSE_SELECT =
    'w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm text-gray-900 outline-none focus:border-emerald-600 dark:border-gray-600 dark:bg-gray-900 dark:text-white'
const CLASSE_LABEL = 'mb-1 block text-xs font-medium text-gray-700 dark:text-gray-300'

export default function ProfessorChamada() {
    const user = useAuthStore((state) => state.user)

    const [opcoes, setOpcoes] = useState<Opcao[]>([])
    const [carregandoOpcoes, setCarregandoOpcoes] = useState(true)
    const [opcaoSelecionada, setOpcaoSelecionada] = useState('') // "turmaId-disciplinaId"
    const [data, setData] = useState(hoje())

    const [alunos, setAlunos] = useState<AlunoChamada[]>([])
    const [jaRealizada, setJaRealizada] = useState(false)
    const [carregandoAlunos, setCarregandoAlunos] = useState(false)
    const [salvando, setSalvando] = useState(false)
    const [resumo, setResumo] = useState<Resumo | null>(null)

    const [turmaIdSel, disciplinaIdSel] = opcaoSelecionada ? opcaoSelecionada.split('-') : ['', '']

    // Busca as turmas e extrai só as combinações turma+disciplina vinculadas a este professor
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

    // Sempre que a opção ou a data mudam, busca a chamada daquele dia
    useEffect(() => {
        if (!turmaIdSel || !disciplinaIdSel || !data) {
            setAlunos([])
            setJaRealizada(false)
            return
        }

        async function carregarChamada() {
            setCarregandoAlunos(true)
            try {
                const resposta = await apiFetch(
                    `/api/chamadas?turmaId=${turmaIdSel}&disciplinaId=${disciplinaIdSel}&data=${data}`,
                )
                if (!resposta.ok) {
                    toast.error(await lerErro(resposta, 'Não foi possível carregar a chamada'))
                    return
                }
                const dados = await resposta.json()
                setAlunos(dados.alunos)
                setJaRealizada(dados.jaRealizada)
            } catch {
                toast.error('Erro de conexão com o servidor')
            } finally {
                setCarregandoAlunos(false)
            }
        }
        carregarChamada()
    }, [turmaIdSel, disciplinaIdSel, data])

    function marcar(alunoId: number, presente: boolean) {
        setAlunos((atual) => atual.map((a) => (a.id === alunoId ? { ...a, presente } : a)))
    }

    function marcarTodosPresentes() {
        setAlunos((atual) => atual.map((a) => ({ ...a, presente: true })))
    }

    async function salvarChamada() {
        if (!user?.id) return

        const semMarcacao = alunos.filter((a) => a.presente === null).length
        if (semMarcacao > 0) {
            toast.error(`Falta marcar ${semMarcacao} aluno(s)`)
            return
        }

        setSalvando(true)
        try {
            const resposta = await apiFetch('/api/chamadas', {
                method: 'POST',
                body: JSON.stringify({
                    turmaId: Number(turmaIdSel),
                    disciplinaId: Number(disciplinaIdSel),
                    data,
                    funcionarioId: Number(user.id),
                    presencas: alunos.map((a) => ({ alunoId: a.id, presente: a.presente })),
                }),
            })

            if (!resposta.ok) {
                toast.error(await lerErro(resposta, 'Não foi possível salvar a chamada'))
                return
            }

            setResumo(await resposta.json())
            setJaRealizada(true)
        } catch {
            toast.error('Erro de conexão com o servidor')
        } finally {
            setSalvando(false)
        }
    }

    const presentes = alunos.filter((a) => a.presente === true).length
    const ausentes = alunos.filter((a) => a.presente === false).length

    return (
        <div className='mx-auto max-w-5xl'>
            <h1 className='mb-6 text-3xl font-extrabold text-gray-900 dark:text-white'>Chamada</h1>

            {/* ---------- Filtros ---------- */}
            <div className='grid gap-4 rounded-xl border border-gray-200 bg-white p-5 shadow-sm sm:grid-cols-2 dark:border-gray-700 dark:bg-gray-800'>
                <div>
                    <label className={CLASSE_LABEL}>Turma / Disciplina</label>
                    <select
                        value={opcaoSelecionada}
                        onChange={(e) => setOpcaoSelecionada(e.target.value)}
                        className={CLASSE_SELECT}
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
                    <label className={CLASSE_LABEL}>Data</label>
                    <input
                        type='date'
                        value={data}
                        max={hoje()}
                        onChange={(e) => setData(e.target.value)}
                        className={CLASSE_SELECT}
                    />
                </div>
            </div>

            {/* ---------- Lista de alunos ---------- */}
            <section className='mt-6'>
                {!opcaoSelecionada && (
                    <p className='text-gray-500 dark:text-gray-400'>
                        Selecione a turma e a disciplina para carregar a lista de alunos.
                    </p>
                )}

                {carregandoAlunos && <p className='text-gray-500 dark:text-gray-400'>Carregando alunos...</p>}

                {!carregandoAlunos && opcaoSelecionada && alunos.length === 0 && (
                    <p className='text-gray-500 dark:text-gray-400'>Esta turma ainda não tem alunos cadastrados.</p>
                )}

                {!carregandoAlunos && alunos.length > 0 && (
                    <>
                        <div className='mb-3 flex flex-wrap items-center gap-3'>
                            <button
                                type='button'
                                onClick={marcarTodosPresentes}
                                className='rounded-lg bg-emerald-700 px-3 py-2 text-sm font-medium text-white hover:bg-emerald-800'
                            >
                                ✓ Marcar todos como presente
                            </button>

                            {jaRealizada && (
                                <span className='rounded-full bg-amber-100 px-3 py-1 text-xs font-medium text-amber-800'>
                                    Chamada já registrada neste dia. Você pode corrigir e salvar de novo.
                                </span>
                            )}
                        </div>

                        <ul className='space-y-2'>
                            {alunos.map((aluno) => (
                                <li
                                    key={aluno.id}
                                    className='flex items-center justify-between rounded-lg border border-gray-200 bg-white px-4 py-2.5 dark:border-gray-700 dark:bg-gray-800'
                                >
                                    <span className='text-sm text-gray-900 dark:text-white'>{aluno.nome}</span>

                                    <div className='flex gap-2'>
                                        <button
                                            type='button'
                                            onClick={() => marcar(aluno.id, true)}
                                            aria-label={`Marcar ${aluno.nome} como presente`}
                                            className={`h-9 w-9 rounded-lg text-lg font-bold transition-colors ${
                                                aluno.presente === true
                                                    ? 'bg-emerald-600 text-white'
                                                    : 'bg-emerald-50 text-emerald-700 hover:bg-emerald-100'
                                            }`}
                                        >
                                            ✓
                                        </button>
                                        <button
                                            type='button'
                                            onClick={() => marcar(aluno.id, false)}
                                            aria-label={`Marcar ${aluno.nome} como ausente`}
                                            className={`h-9 w-9 rounded-lg text-lg font-bold transition-colors ${
                                                aluno.presente === false
                                                    ? 'bg-red-600 text-white'
                                                    : 'bg-red-50 text-red-600 hover:bg-red-100'
                                            }`}
                                        >
                                            ✗
                                        </button>
                                    </div>
                                </li>
                            ))}
                        </ul>

                        <div className='mt-4 flex flex-wrap items-center justify-between gap-4'>
                            <div className='flex gap-6 text-sm'>
                                <span className='text-gray-700 dark:text-gray-300'>
                                    Total de alunos: <strong>{alunos.length}</strong>
                                </span>
                                <span className='text-emerald-700'>
                                    Presentes: <strong>{presentes}</strong>
                                </span>
                                <span className='text-red-600'>
                                    Ausentes: <strong>{ausentes}</strong>
                                </span>
                            </div>

                            <button
                                type='button'
                                onClick={salvarChamada}
                                disabled={salvando}
                                className='rounded-lg bg-emerald-700 px-5 py-2 font-medium text-white hover:bg-emerald-800 disabled:opacity-50'
                            >
                                {salvando ? 'Salvando...' : 'Salvar Chamada'}
                            </button>
                        </div>
                    </>
                )}
            </section>

            {/* ---------- Popup de sucesso ---------- */}
            {resumo && (
                <div className='fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4'>
                    <div className='w-full max-w-sm rounded-xl bg-white p-6 text-center shadow-lg dark:bg-gray-800'>
                        <div className='mx-auto mb-3 flex h-16 w-16 items-center justify-center rounded-full bg-emerald-100 text-3xl text-emerald-700'>
                            ✓
                        </div>
                        <h2 className='mb-4 text-lg font-bold text-gray-900 dark:text-white'>
                            Chamada registrada com sucesso!
                        </h2>

                        <dl className='mb-5 grid grid-cols-2 gap-y-1 rounded-lg bg-emerald-50 p-4 text-left text-sm dark:bg-emerald-950'>
                            <dt className='text-gray-600 dark:text-gray-300'>Data:</dt>
                            <dd className='font-medium text-gray-900 dark:text-white'>{formatarData(resumo.data)}</dd>
                            <dt className='text-gray-600 dark:text-gray-300'>Turma:</dt>
                            <dd className='font-medium text-gray-900 dark:text-white'>{resumo.turma}</dd>
                            <dt className='text-gray-600 dark:text-gray-300'>Disciplina:</dt>
                            <dd className='font-medium text-gray-900 dark:text-white'>{resumo.disciplina}</dd>
                            <dt className='text-gray-600 dark:text-gray-300'>Presentes:</dt>
                            <dd className='font-medium text-emerald-700'>{resumo.presentes}</dd>
                            <dt className='text-gray-600 dark:text-gray-300'>Ausentes:</dt>
                            <dd className='font-medium text-red-600'>{resumo.ausentes}</dd>
                        </dl>

                        <button
                            type='button'
                            onClick={() => setResumo(null)}
                            className='w-full rounded-lg bg-emerald-700 px-4 py-2 font-medium text-white hover:bg-emerald-800'
                        >
                            Ok
                        </button>
                    </div>
                </div>
            )}
        </div>
    )
}