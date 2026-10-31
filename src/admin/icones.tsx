import type { ReactNode } from 'react'

// Base de todos os ícones: traço fino que herda a cor do texto (currentColor)
function Icone({ children, className = 'h-5 w-5' }: { children: ReactNode; className?: string }) {
    return (
        <svg
            xmlns="http://www.w3.org/2000/svg"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth={2}
            strokeLinecap="round"
            strokeLinejoin="round"
            className={`shrink-0 ${className}`}
            aria-hidden="true"
        >
            {children}
        </svg>
    )
}

type PropsIcone = { className?: string }

export function IconeInicio({ className }: PropsIcone) {
    return (
        <Icone className={className}>
            <path d="M3 9.5 12 3l9 6.5V20a1 1 0 0 1-1 1h-5v-7H9v7H4a1 1 0 0 1-1-1z" />
        </Icone>
    )
}

export function IconeAlunos({ className }: PropsIcone) {
    return (
        <Icone className={className}>
            <path d="M22 10 12 5 2 10l10 5 10-5z" />
            <path d="M6 12v5c3 2 9 2 12 0v-5" />
        </Icone>
    )
}

export function IconeFuncionarios({ className }: PropsIcone) {
    return (
        <Icone className={className}>
            <circle cx="9" cy="7" r="4" />
            <path d="M3 21v-2a4 4 0 0 1 4-4h4a4 4 0 0 1 4 4v2" />
            <path d="M16 3.13a4 4 0 0 1 0 7.75" />
            <path d="M21 21v-2a4 4 0 0 0-3-3.85" />
        </Icone>
    )
}

export function IconeTurmas({ className }: PropsIcone) {
    return (
        <Icone className={className}>
            <path d="M4 21V10l8-6 8 6v11" />
            <path d="M9 21v-6h6v6" />
        </Icone>
    )
}

export function IconeSalas({ className }: PropsIcone) {
    return (
        <Icone className={className}>
            <path d="M3 21h18" />
            <path d="M6 21V4a1 1 0 0 1 1-1h10a1 1 0 0 1 1 1v17" />
            <circle cx="14" cy="12" r="1" />
        </Icone>
    )
}

export function IconeDisciplinas({ className }: PropsIcone) {
    return (
        <Icone className={className}>
            <path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20" />
            <path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z" />
        </Icone>
    )
}

export function IconeChamada({ className }: PropsIcone) {
    return (
        <Icone className={className}>
            <rect x="8" y="2" width="8" height="4" rx="1" />
            <path d="M16 4h2a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2h2" />
            <path d="m9 14 2 2 4-4" />
        </Icone>
    )
}

export function IconeExportar({ className }: PropsIcone) {
    return (
        <Icone className={className}>
            <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
            <polyline points="14 2 14 8 20 8" />
            <path d="M12 18v-6" />
            <path d="m9 15 3 3 3-3" />
        </Icone>
    )
}