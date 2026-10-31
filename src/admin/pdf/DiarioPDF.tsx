import { Document, Page, View, Text, Image, StyleSheet } from '@react-pdf/renderer'
import logoCon from '../../assets/logo-con.png'
import brasao from '../../assets/prefeitura.png'

// Formato que o back devolve em GET /api/chamadas/exportar
export type DadosDiario = {
    turma: { id: number; nome: string; turno: string; ano_letivo: number }
    disciplina: { id: number; nome: string; cargaHoraria: string | null }
    professor: string | null
    mes: string // "2026-10"
    diasNoMes: number
    diasComChamada: number[]
    alunos: {
        numero: number
        id: number
        matricula: string | null
        nome: string
        dias: ('P' | 'F' | null)[]
        presencas: number
        faltas: number
        frequencia: number | null
    }[]
    totais: {
        aulas: number
        presencas: number
        faltas: number
        frequenciaMedia: number | null
    }
}

// Nome da escola que aparece no cabeçalho (troque pelo nome real da EMEI)
const NOME_ESCOLA = 'EMEI - ESCOLA MUNICIPAL DE EDUCAÇÃO INFANTIL'

// Símbolos usados nas células de cada dia
const SIMBOLO_PRESENCA = '•'
const SIMBOLO_FALTA = 'F'

// Larguras das colunas (em pontos; A4 deitado tem ~794pt úteis)
const LARGURA_MATRICULA = 55
const LARGURA_ALUNO = 150
const LARGURA_NUMERO = 20
const LARGURA_DIA = 14
const LARGURA_TOTAL = 30

const PRETO = '#000000'
const CINZA_TEXTO = '#4b5563'
const CINZA_FDS = '#f0f0f0'

const estilos = StyleSheet.create({
    pagina: {
        paddingTop: 22,
        paddingBottom: 40,
        paddingHorizontal: 24,
        fontSize: 8,
        fontFamily: 'Helvetica',
        color: PRETO,
    },

    // ---------- Cabeçalho (estilo do diário da prefeitura) ----------
    cabecalho: {
        flexDirection: 'row',
        alignItems: 'flex-start',
        marginBottom: 10,
    },
    brasao: { width: 54, height: 62, marginRight: 14 },
    cabecalhoConteudo: { flex: 1 },
    secretaria: {
        fontSize: 9,
        fontFamily: 'Helvetica-Bold',
        textAlign: 'center',
        marginBottom: 6,
    },
    colunasInfo: { flexDirection: 'row' },
    colunaEsquerda: { width: '62%' },
    colunaDireita: { width: '38%' },
    linhaInfo: { flexDirection: 'row', marginBottom: 2 },
    rotulo: { width: 70 },
    valor: { flex: 1, textTransform: 'uppercase' },

    // ---------- Tabela ----------
    tabela: {
        borderTopWidth: 0.8,
        borderLeftWidth: 0.8,
        borderColor: PRETO,
    },
    linha: {
        flexDirection: 'row',
        minHeight: 13,
    },
    linhaCabecalho: {
        fontFamily: 'Helvetica-Bold',
        minHeight: 18,
    },
    celula: {
        borderRightWidth: 0.8,
        borderBottomWidth: 0.8,
        borderColor: PRETO,
        justifyContent: 'center',
        alignItems: 'center',
        paddingVertical: 1.5,
    },
    celulaAluno: { alignItems: 'flex-start', paddingHorizontal: 3 },
    fimDeSemana: { backgroundColor: CINZA_FDS },
    simbolo: { fontSize: 9 },
    falta: { fontFamily: 'Helvetica-Bold' },

    // ---------- Resumo, assinaturas e rodapé ----------
    resumo: { flexDirection: 'row', marginTop: 8, gap: 18 },
    resumoItem: { flexDirection: 'row' },
    resumoRotulo: { fontFamily: 'Helvetica-Bold', marginRight: 3 },
    legenda: { marginTop: 4, color: CINZA_TEXTO, fontSize: 7 },
    assinaturas: {
        flexDirection: 'row',
        justifyContent: 'space-around',
        marginTop: 30,
    },
    assinatura: {
        width: 200,
        borderTopWidth: 0.8,
        borderTopColor: PRETO,
        paddingTop: 3,
        textAlign: 'center',
    },
    rodape: {
        position: 'absolute',
        bottom: 14,
        left: 24,
        right: 24,
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        fontSize: 7,
        color: CINZA_TEXTO,
    },
    rodapeEsquerda: { flexDirection: 'row', alignItems: 'center' },
    logoRodape: { width: 16, height: 16, marginRight: 4 },
})

// "2026-10" -> "Outubro de 2026"
function nomeDoMes(mes: string) {
    const [ano, numero] = mes.split('-').map(Number)
    const nome = new Date(ano, numero - 1, 1).toLocaleString('pt-BR', { month: 'long' })
    return `${nome.charAt(0).toUpperCase()}${nome.slice(1)} de ${ano}`
}

// Sábado (6) ou domingo (0)?
function ehFimDeSemana(mes: string, dia: number) {
    const [ano, numero] = mes.split('-').map(Number)
    const diaDaSemana = new Date(ano, numero - 1, dia).getDay()
    return diaDaSemana === 0 || diaDaSemana === 6
}

// Uma linha "Rótulo:   VALOR" do cabeçalho
function Info({ rotulo, valor }: { rotulo: string; valor: string }) {
    return (
        <View style={estilos.linhaInfo}>
            <Text style={estilos.rotulo}>{rotulo}:</Text>
            <Text style={estilos.valor}>{valor}</Text>
        </View>
    )
}

export default function DiarioPDF({ dados }: { dados: DadosDiario }) {
    const dias = Array.from({ length: dados.diasNoMes }, (_, i) => i + 1)
    const geradoEm = new Date().toLocaleString('pt-BR')

    return (
        <Document title={`Diário de Classe - ${dados.turma.nome} - ${dados.mes}`} author='CON - Controle Acadêmico'>
            <Page size='A4' orientation='landscape' style={estilos.pagina}>
                {/* ---------- Cabeçalho ---------- */}
                <View style={estilos.cabecalho}>
                    <Image src={brasao} style={estilos.brasao} />

                    <View style={estilos.cabecalhoConteudo}>
                        <Text style={estilos.secretaria}>SECRETARIA MUNICIPAL DE EDUCAÇÃO</Text>

                        <View style={estilos.colunasInfo}>
                            <View style={estilos.colunaEsquerda}>
                                <Info rotulo='Escola' valor={NOME_ESCOLA} />
                                <Info rotulo='Período Letivo' valor={nomeDoMes(dados.mes)} />
                                <Info rotulo='Ano/Turma' valor={`${dados.turma.ano_letivo} / ${dados.turma.nome}`} />
                                <Info rotulo='Disciplina' valor={dados.disciplina.nome} />
                                <Info rotulo='Professor' valor={dados.professor ?? ''} />
                            </View>

                            <View style={estilos.colunaDireita}>
                                <Info rotulo='Turno' valor={dados.turma.turno} />
                                <Info rotulo='Carga Horária' valor={dados.disciplina.cargaHoraria ?? '-'} />
                            </View>
                        </View>
                    </View>
                </View>

                {/* ---------- Tabela ---------- */}
                <View style={estilos.tabela}>
                    {/* Cabeçalho da tabela (fixed = repete em cada página) */}
                    <View style={[estilos.linha, estilos.linhaCabecalho]} fixed>
                        <View style={[estilos.celula, { width: LARGURA_MATRICULA }]}>
                            <Text>Matrícula</Text>
                        </View>
                        <View style={[estilos.celula, { width: LARGURA_ALUNO }]}>
                            <Text>Aluno</Text>
                        </View>
                        <View style={[estilos.celula, { width: LARGURA_NUMERO }]}>
                            <Text>Nº</Text>
                        </View>
                        {dias.map((dia) => (
                            <View
                                key={dia}
                                style={[
                                    estilos.celula,
                                    { width: LARGURA_DIA },
                                    ehFimDeSemana(dados.mes, dia) ? estilos.fimDeSemana : {},
                                ]}
                            >
                                <Text>{dia}</Text>
                            </View>
                        ))}
                        <View style={[estilos.celula, { width: LARGURA_TOTAL }]}>
                            <Text>Pres.</Text>
                        </View>
                        <View style={[estilos.celula, { width: LARGURA_TOTAL }]}>
                            <Text>Faltas</Text>
                        </View>
                        <View style={[estilos.celula, { width: LARGURA_TOTAL }]}>
                            <Text>Freq.</Text>
                        </View>
                    </View>

                    {/* Uma linha por aluno */}
                    {dados.alunos.map((aluno) => (
                        <View key={aluno.id} style={estilos.linha} wrap={false}>
                            <View style={[estilos.celula, { width: LARGURA_MATRICULA }]}>
                                <Text>{aluno.matricula ?? ''}</Text>
                            </View>
                            <View style={[estilos.celula, estilos.celulaAluno, { width: LARGURA_ALUNO }]}>
                                <Text>{aluno.nome.toUpperCase()}</Text>
                            </View>
                            <View style={[estilos.celula, { width: LARGURA_NUMERO }]}>
                                <Text>{aluno.numero}</Text>
                            </View>
                            {aluno.dias.map((situacao, i) => (
                                <View
                                    key={i}
                                    style={[
                                        estilos.celula,
                                        { width: LARGURA_DIA },
                                        ehFimDeSemana(dados.mes, i + 1) ? estilos.fimDeSemana : {},
                                    ]}
                                >
                                    <Text style={situacao === 'F' ? estilos.falta : estilos.simbolo}>
                                        {situacao === 'P' ? SIMBOLO_PRESENCA : situacao === 'F' ? SIMBOLO_FALTA : ''}
                                    </Text>
                                </View>
                            ))}
                            <View style={[estilos.celula, { width: LARGURA_TOTAL }]}>
                                <Text>{aluno.presencas}</Text>
                            </View>
                            <View style={[estilos.celula, { width: LARGURA_TOTAL }]}>
                                <Text>{aluno.faltas}</Text>
                            </View>
                            <View style={[estilos.celula, { width: LARGURA_TOTAL }]}>
                                <Text>{aluno.frequencia != null ? `${aluno.frequencia}%` : '-'}</Text>
                            </View>
                        </View>
                    ))}
                </View>

                {/* ---------- Resumo ---------- */}
                <View style={estilos.resumo} wrap={false}>
                    <View style={estilos.resumoItem}>
                        <Text style={estilos.resumoRotulo}>Aulas no mês:</Text>
                        <Text>{dados.totais.aulas}</Text>
                    </View>
                    <View style={estilos.resumoItem}>
                        <Text style={estilos.resumoRotulo}>Total de presenças:</Text>
                        <Text>{dados.totais.presencas}</Text>
                    </View>
                    <View style={estilos.resumoItem}>
                        <Text style={estilos.resumoRotulo}>Total de faltas:</Text>
                        <Text>{dados.totais.faltas}</Text>
                    </View>
                    <View style={estilos.resumoItem}>
                        <Text style={estilos.resumoRotulo}>Frequência média:</Text>
                        <Text>
                            {dados.totais.frequenciaMedia != null ? `${dados.totais.frequenciaMedia}%` : '-'}
                        </Text>
                    </View>
                </View>
                <Text style={estilos.legenda}>
                    Legenda: {SIMBOLO_PRESENCA} = Presente | {SIMBOLO_FALTA} = Falta | colunas em cinza = fim de semana
                </Text>

                {/* ---------- Assinaturas ---------- */}
                <View style={estilos.assinaturas} wrap={false}>
                    <Text style={estilos.assinatura}>Professor(a)</Text>
                    <Text style={estilos.assinatura}>Direção</Text>
                </View>

                {/* ---------- Rodapé (fixed = aparece em todas as páginas) ---------- */}
                <View style={estilos.rodape} fixed>
                    <View style={estilos.rodapeEsquerda}>
                        <Image src={logoCon} style={estilos.logoRodape} />
                        <Text>Gerado em {geradoEm} pelo sistema CON - Controle Acadêmico</Text>
                    </View>
                    <Text render={({ pageNumber, totalPages }) => `Página ${pageNumber} de ${totalPages}`} />
                </View>
            </Page>
        </Document>
    )
}