import type { ReactNode } from 'react'
import { Link } from 'react-router-dom'
import { useAuthStore } from '../context/authStore'
import {
    IconeAlunos,
    IconeChamada,
    IconeDisciplinas,
    IconeExportar,
    IconeFuncionarios,
    IconeSalas,
    IconeTurmas,
} from './icones'

type Card = { rota: string; titulo: string; descricao: string; icone: ReactNode }

const TAMANHO_ICONE = 'h-7 w-7'

const CARDS: Card[] = [
    { rota: '/admin/chamada', titulo: 'Chamada', descricao: 'Realize e registre a chamada', icone: <IconeChamada className={TAMANHO_ICONE} /> },
    { rota: '/admin/exportar', titulo: 'Exportar', descricao: 'Gere o diário de classe em PDF', icone: <IconeExportar className={TAMANHO_ICONE} /> },
    { rota: '/admin/alunos', titulo: 'Alunos', descricao: 'Gerenciar alunos cadastrados', icone: <IconeAlunos className={TAMANHO_ICONE} /> },
    { rota: '/admin/turmas', titulo: 'Turmas', descricao: 'Gerenciar turmas cadastradas', icone: <IconeTurmas className={TAMANHO_ICONE} /> },
    { rota: '/admin/salas', titulo: 'Salas', descricao: 'Gerenciar salas da escola', icone: <IconeSalas className={TAMANHO_ICONE} /> },
    { rota: '/admin/disciplinas', titulo: 'Disciplinas', descricao: 'Gerenciar disciplinas cadastradas', icone: <IconeDisciplinas className={TAMANHO_ICONE} /> },
    { rota: '/admin/funcionarios', titulo: 'Funcionários', descricao: 'Gerencie os funcionários da escola', icone: <IconeFuncionarios className={TAMANHO_ICONE} /> },
]

export default function AdminInicio() {
    const user = useAuthStore((state) => state.user)

    return (
        <div>
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
                Olá, {user?.nome}!
            </h1>
            <p className="mb-8 text-sm text-gray-500 dark:text-gray-400">Como posso ajudar hoje?</p>

            <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
                {CARDS.map((card) => (
                    <Link
                        key={card.rota}
                        to={card.rota}
                        className="group flex flex-col items-center rounded-2xl border border-emerald-100 bg-white p-6 text-center shadow-sm transition-all hover:-translate-y-1 hover:border-emerald-300 hover:shadow-md dark:border-gray-700 dark:bg-gray-800"
                    >
                        <div className="mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-emerald-100 text-emerald-700 transition-colors group-hover:bg-emerald-700 group-hover:text-white dark:bg-emerald-900 dark:text-emerald-300">
                            {card.icone}
                        </div>
                        <span className="font-semibold text-gray-900 dark:text-white">{card.titulo}</span>
                        <span className="mt-1 text-xs text-gray-500 dark:text-gray-400">{card.descricao}</span>
                    </Link>
                ))}
            </div>
        </div>
    )
}