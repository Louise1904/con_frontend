import { ReactNode } from 'react'
import Sidebar from './Sidebar'
import { User } from '../types/disciplina'

interface LayoutProps {
  user: User
  onLogout: () => void
  children: ReactNode
}

export default function Layout({ user, onLogout, children }: LayoutProps) {
  return (
    <div className="flex min-h-screen bg-gray-50">
      <Sidebar user={user} onLogout={onLogout} />
      <main className="flex-1 overflow-auto">
        {children}
      </main>
    </div>
  )
}
