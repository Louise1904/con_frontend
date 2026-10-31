import { useEffect } from 'react'
import { Outlet, useNavigate } from 'react-router-dom'
import { useAuthStore } from './context/authStore'

// Protege as rotas internas: quem não estiver logado vai para o Login
export default function Layout() {
    const navigate = useNavigate()
    const user = useAuthStore((state) => state.user)

    useEffect(() => {
        if (!user) {
            navigate('/login', { replace: true })
        }
    }, [user, navigate])

    if (!user) {
        return null
    }

    return <Outlet />
}