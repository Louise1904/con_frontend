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
// Também salva uma cópia no localStorage para manter a sessão após recarregar (F5).
export const useAuthStore = create<AuthStore>((set, get) => ({
    user: null,
    token: null,

    // Chamado no Login quando o back aprova o acesso
    login: (user, token) => {
        localStorage.setItem('conToken', token)
        localStorage.setItem('conUser', JSON.stringify(user))
        set({ user, token })
    },

    // Chamado no botão "Sair"
    logout: () => {
        localStorage.removeItem('conToken')
        localStorage.removeItem('conUser')
        set({ user: null, token: null })
    },

    isAdmin: () => get().user?.tipo === 'ADM',

    isProfessor: () => get().user?.tipo === 'PROFESSOR',

    // Recupera o login salvo no localStorage (usado quando a página recarrega)
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

// Recupera o login salvo assim que o app abre (para não deslogar no F5)
useAuthStore.getState().hydrate()