import { useEffect, useMemo, useState } from 'react'
import {
    ResponsiveContainer,
    AreaChart,
    Area,
    CartesianGrid,
    XAxis,
    YAxis,
    Tooltip,
    ReferenceLine,
    ReferenceDot,
} from 'recharts'
import { toast } from 'sonner'
import { apiFetch, lerErro } from '../api/api'
import { useAuthStore } from '../context/authStore'
import type { Turma } from '../utils/types'
import type { DadosDiario } from '../admin/pdf/DiarioPDF'

// Cada opção é uma combinação turma + disciplina em que este professor está vinculado
type Opcao = {
    turmaId: number
    turmaNome: string
    turno: string
    disciplinaId: number
    disciplinaNome: string
}

// Mês atual no formato AAAA-MM
function mesAtual() {
    const d = new Date()
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`
}

// "2026-11" -> "novembro de 2026"
function nomeDoMes(mes: string) {
    const [ano, numero] = mes.split('-').map(Number)
    return new Date(ano, numero - 1, 1).toLocaleDateString('pt-BR', {
        month: 'long',
        year: 'numeric',
    })
}

// Sábado (6) ou domingo (0)? (mesma lógica do DiarioPDF)
function ehFimDeSemana(mes: string, dia: number) {
    const [ano, numero] = mes.split('-').map(Number)
    const diaDaSemana = new Date(ano, numero - 1, dia).getDay()
    return diaDaSemana === 0 || diaDaSemana === 6
}

const CLASSE_INPUT =
    'w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm text-gray-900 outline-none focus:border-emerald-600 dark:border-gray-600 dark:bg-gray-900 dark:text-white'
const CLASSE_LABEL = 'mb-1 block text-sm font-medium text-gray-700 dark:text-gray-300'

export default function ProfessorHistorico() {
    const user = useAuthStore((state) => state.user)

    const [opcoes, setOpcoes] = useState<Opcao[]>([])
    const [carregandoOpcoes, setCarregandoOpcoes] = useState(true)
    const [opcaoSelecionada, setOpcaoSelecionada] = useState('') // "turmaId-disciplinaId"
    const [mes, setMes] = useState(mesAtual())

    const [dados, setDados] = useState<DadosDiario | null>(null)
    const [carregando, setCarregando] = useState(false)

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
                // Já seleciona a primeira opção, pra não precisar escolher à toa
                if (minhas.length) {
                    setOpcaoSelecionada(`${minhas[0].turmaId}-${minhas[0].disciplinaId}`)
                }
            } catch {
                toast.error('Não foi possível carregar suas turmas')
            } finally {
                setCarregandoOpcoes(false)
            }
        }
        if (user?.id) carregarMinhasOpcoes()
    }, [user?.id])

    // Busca o diário do mês sempre que a opção ou o mês mudam
    useEffect(() => {
        if (!turmaIdSel || !disciplinaIdSel || !mes) return

        async function carregarHistorico() {
            setCarregando(true)
            try {
                const resposta = await apiFetch(
                    `/api/chamadas/exportar?turmaId=${turmaIdSel}&disciplinaId=${disciplinaIdSel}&mes=${mes}`,
                )
                if (!resposta.ok) {
                    toast.error(await lerErro(resposta, 'Não foi possível carregar o histórico'))
                    setDados(null)
                    return
                }
                const resultado: DadosDiario = await resposta.json()
                setDados(resultado)
            } catch {
                toast.error('Erro de conexão com o servidor')
                setDados(null)
            } finally {
                setCarregando(false)
            }
        }
        carregarHistorico()
    }, [turmaIdSel, disciplinaIdSel, mes])

    // % de presença por dia, só nos dias em que houve chamada
    const dadosGrafico = useMemo(() => {
        if (!dados) return []
        return dados.diasComChamada.map((dia) => {
            let presentes = 0
            let total = 0
            dados.alunos.forEach((aluno) => {
                const situacao = aluno.dias[dia - 1]
                if (situacao === 'P') {
                    presentes += 1
                    total += 1
                } else if (situacao === 'F') {
                    total += 1
                }
            })
            return { dia, taxa: total > 0 ? Math.round((presentes / total) * 100) : 0 }
        })
    }, [dados])

    const ultimoPonto = dadosGrafico.length ? dadosGrafico[dadosGrafico.length - 1] : null

    const temChamadas = !!dados && dados.totais.aulas > 0
    const dias = useMemo(
        () => (dados ? Array.from({ length: dados.diasNoMes }, (_, i) => i + 1) : []),
        [dados],
    )

    return (
        <div className="mx-auto max-w-6xl">
            <div className="mb-6">
                <h1 className="text-3xl font-extrabold text-gray-900 dark:text-white">
                    Histórico de Presenças
                </h1>
                <p className="mt-2 text-sm text-gray-600 dark:text-gray-400">
                    Acompanhe a frequência das suas turmas mês a mês.
                </p>
            </div>

            <div className="mb-6 grid gap-4 rounded-xl border border-gray-200 bg-white p-6 shadow-sm dark:border-gray-700 dark:bg-gray-800 sm:grid-cols-2">
                <div>
                    <label className={CLASSE_LABEL}>Turma / Disciplina</label>
                    <select
                        className={CLASSE_INPUT}
                        value={opcaoSelecionada}
                        onChange={(e) => setOpcaoSelecionada(e.target.value)}
                    >
                        <option value="">Selecione</option>
                        {opcoes.map((o) => (
                            <option key={`${o.turmaId}-${o.disciplinaId}`} value={`${o.turmaId}-${o.disciplinaId}`}>
                                {o.turmaNome} ({o.turno}) — {o.disciplinaNome}
                            </option>
                        ))}
                    </select>
                    {!carregandoOpcoes && opcoes.length === 0 && (
                        <p className="mt-1 text-xs text-gray-500">
                            Você ainda não está vinculado(a) a nenhuma turma/disciplina.
                        </p>
                    )}
                </div>

                <div>
                    <label className={CLASSE_LABEL}>Mês</label>
                    <input
                        type="month"
                        className={CLASSE_INPUT}
                        value={mes}
                        max={mesAtual()}
                        onChange={(e) => setMes(e.target.value)}
                    />
                </div>
            </div>

            {dados && (
                <p className="mb-3 text-sm capitalize text-gray-500 dark:text-gray-400">
                    {dados.turma.nome} · {dados.disciplina.nome}
                    {dados.professor ? ` · Prof. ${dados.professor}` : ''} · {nomeDoMes(mes)}
                </p>
            )}

            <div className="mb-8 rounded-xl border border-gray-200 bg-white p-6 shadow-sm dark:border-gray-700 dark:bg-gray-800">
                <div className="mb-4 flex items-baseline justify-between">
                    <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
                        Taxa de presença no mês
                    </h2>
                    {temChamadas && (
                        <span className="text-xs text-gray-400 dark:text-gray-500">
                            Linha tracejada: frequência mínima (75%)
                        </span>
                    )}
                </div>
                {carregando ? (
                    <p className="py-8 text-center text-gray-400 dark:text-gray-500">Carregando...</p>
                ) : !temChamadas ? (
                    <p className="py-8 text-center text-gray-400 dark:text-gray-500">
                        Nenhuma chamada registrada nesse período ainda.
                    </p>
                ) : (
                    <ResponsiveContainer width="100%" height={280}>
                        <AreaChart data={dadosGrafico} margin={{ top: 26, left: -10, right: 24, bottom: 0 }}>
                            <defs>
                                <linearGradient id="gradientePresenca" x1="0" y1="0" x2="0" y2="1">
                                    <stop offset="5%" stopColor="#047857" stopOpacity={0.22} />
                                    <stop offset="95%" stopColor="#047857" stopOpacity={0} />
                                </linearGradient>
                            </defs>

                            <CartesianGrid stroke="#e5e7eb" vertical={false} />

                            <XAxis
                                dataKey="dia"
                                type="number"
                                domain={[1, dados?.diasNoMes ?? 31]}
                                allowDecimals={false}
                                tickLine={false}
                                axisLine={false}
                                tick={{ fontSize: 12, fill: '#9ca3af' }}
                            />
                            <YAxis
                                domain={[0, 100]}
                                ticks={[0, 25, 50, 75, 100]}
                                tickLine={false}
                                axisLine={false}
                                tick={{ fontSize: 12, fill: '#9ca3af' }}
                                unit="%"
                            />

                            <Tooltip
                                cursor={{ stroke: '#047857', strokeDasharray: '4 4', strokeOpacity: 0.4 }}
                                contentStyle={{
                                    borderRadius: 8,
                                    border: '1px solid #e5e7eb',
                                    fontSize: 12,
                                    boxShadow: '0 2px 8px rgba(0,0,0,0.06)',
                                }}
                                formatter={(valor: any) => [`${valor}%`, 'Presença']}
                                labelFormatter={(dia: any) => `Dia ${dia}`}
                            />

                            <ReferenceLine
                                y={75}
                                stroke="#d97706"
                                strokeDasharray="4 4"
                                strokeWidth={1}
                                label={{
                                    value: 'Mín. 75%',
                                    position: 'insideTopRight',
                                    fontSize: 11,
                                    fill: '#9ca3af',
                                }}
                            />

                            <Area
                                type="monotone"
                                dataKey="taxa"
                                stroke="#047857"
                                strokeWidth={2}
                                fill="url(#gradientePresenca)"
                                dot={{ r: 4, fill: '#047857', stroke: '#fff', strokeWidth: 2 }}
                                activeDot={{ r: 6, fill: '#047857', stroke: '#fff', strokeWidth: 2 }}
                            />

                            {ultimoPonto && (
                                <ReferenceDot
                                    x={ultimoPonto.dia}
                                    y={ultimoPonto.taxa}
                                    r={0}
                                    label={{
                                        value: `${ultimoPonto.taxa}%`,
                                        position: 'top',
                                        fontSize: 12,
                                        fontWeight: 600,
                                        fill: '#047857',
                                    }}
                                />
                            )}
                        </AreaChart>
                    </ResponsiveContainer>
                )}
            </div>

            <div className="overflow-x-auto rounded-xl border border-gray-200 bg-white shadow-sm dark:border-gray-700 dark:bg-gray-800">
                {carregando ? (
                    <p className="px-4 py-8 text-center text-gray-400 dark:text-gray-500">
                        Carregando...
                    </p>
                ) : !dados || dados.alunos.length === 0 ? (
                    <p className="px-4 py-8 text-center text-gray-400 dark:text-gray-500">
                        Nenhum aluno cadastrado nessa turma.
                    </p>
                ) : (
                    <table className="w-full min-w-max text-left text-xs">
                        <thead>
                            <tr className="border-b border-gray-200 bg-emerald-50 text-gray-700 dark:border-gray-700 dark:bg-emerald-950 dark:text-gray-200">
                                <th className="sticky left-0 bg-emerald-50 px-3 py-2 font-semibold dark:bg-emerald-950">
                                    Matrícula
                                </th>
                                <th className="px-3 py-2 font-semibold">Aluno</th>
                                {dias.map((dia) => (
                                    <th
                                        key={dia}
                                        className={`w-6 px-1 py-2 text-center font-medium ${
                                            ehFimDeSemana(mes, dia) ? 'bg-gray-100 dark:bg-gray-700' : ''
                                        }`}
                                    >
                                        {dia}
                                    </th>
                                ))}
                                <th className="px-3 py-2 text-center font-semibold">Pres.</th>
                                <th className="px-3 py-2 text-center font-semibold">Faltas</th>
                                <th className="px-3 py-2 text-center font-semibold">Freq.</th>
                            </tr>
                        </thead>
                        <tbody>
                            {dados.alunos.map((aluno) => (
                                <tr
                                    key={aluno.id}
                                    className="border-b border-gray-100 last:border-0 dark:border-gray-700"
                                >
                                    <td className="sticky left-0 bg-white px-3 py-1.5 text-gray-500 dark:bg-gray-800 dark:text-gray-400">
                                        {aluno.matricula ?? '-'}
                                    </td>
                                    <td className="px-3 py-1.5 font-medium text-gray-800 dark:text-gray-100">
                                        {aluno.nome}
                                    </td>
                                    {aluno.dias.map((situacao, i) => (
                                        <td
                                            key={i}
                                            className={`px-1 py-1.5 text-center ${
                                                ehFimDeSemana(mes, i + 1) ? 'bg-gray-50 dark:bg-gray-900' : ''
                                            }`}
                                        >
                                            {situacao === 'P' ? (
                                                <span className="text-emerald-700 dark:text-emerald-400">•</span>
                                            ) : situacao === 'F' ? (
                                                <span className="font-semibold text-red-500">F</span>
                                            ) : (
                                                <span className="text-gray-300 dark:text-gray-600">·</span>
                                            )}
                                        </td>
                                    ))}
                                    <td className="px-3 py-1.5 text-center font-semibold text-gray-800 dark:text-gray-100">
                                        {aluno.presencas}
                                    </td>
                                    <td className="px-3 py-1.5 text-center font-semibold text-gray-800 dark:text-gray-100">
                                        {aluno.faltas}
                                    </td>
                                    <td className="px-3 py-1.5 text-center font-semibold text-gray-800 dark:text-gray-100">
                                        {aluno.frequencia != null ? `${aluno.frequencia}%` : '-'}
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                )}
            </div>
        </div>
    )
}