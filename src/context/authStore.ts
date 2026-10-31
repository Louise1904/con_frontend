import { create } from 'zustand'
import type { User } from '../utils/types'

type AuthStore = {
    user: User | null
    token: string | null
    login: (user: User, token: string) => void
    logout: () => void
    isAdmin: () => boolean
    isProfessor: () => boolean
    hydrate: () => void
}

// Guarda o usuário logado em memória (via zustand) durante a navegação.
// O token é persistido em localStorage para manter a sessão entre recargas.
export const useAuthStore = create<AuthStore>((set, get) => ({
    user: null,
    token: null,

    login: (user, token) => {
        localStorage.setItem('conToken', token)
        localStorage.setItem('conUser', JSON.stringify(user))
        set({ user, token })
    },

    logout: () => {
        localStorage.removeItem('conToken')
        localStorage.removeItem('conUser')
        set({ user: null, token: null })
    },

    isAdmin: () => get().user?.tipo === 'ADM',

    isProfessor: () => get().user?.tipo === 'PROFESSOR',

    hydrate: () => {
        const tokenGuardado = localStorage.getItem('conToken')
        const userGuardado = localStorage.getItem('conUser')
        if (tokenGuardado && userGuardado) {
            try {
                const user = JSON.parse(userGuardado) as User
                set({ user, token: tokenGuardado })
            } catch {
                localStorage.removeItem('conToken')
                localStorage.removeItem('conUser')
            }
        }
    },
}))