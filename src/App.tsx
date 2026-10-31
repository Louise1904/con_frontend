import { createBrowserRouter, Navigate, RouterProvider } from 'react-router-dom'
import { Toaster } from 'sonner'
import Layout from './Layout.tsx'
import Login from './Login.tsx'
import AdminLayout from './admin/AdminLayout.tsx'
import AdminInicio from './admin/AdminInicio.tsx'
import AdminAlunos from './admin/AdminAlunos.tsx'
import AdminTurmas from './admin/AdminTurmas.tsx'
import AdminFuncionarios from './admin/AdminFuncionarios.tsx'
import AdminDisciplinas from './admin/AdminDisciplinas.tsx'
import AdminSalas from './admin/AdminSalas.tsx'
import AdminChamada from './admin/AdminChamada.tsx'
import AdminExportar from './admin/AdminExportar.tsx'
import ProfessorLayout from './professor/ProfessorLayout.tsx'
import ProfessorDashboard from './professor/ProfessorDashboard.tsx'
import MinhasTurmas from './professor/MinhasTurmas.tsx'
import { useAuthStore } from './context/authStore'

// Decide para onde mandar quem acessa "/" usando o tipo do usuário logado
function RedirecionaInicio() {
    const user = useAuthStore((state) => state.user)

    return (
        <Navigate
            to={user?.tipo === 'ADM' ? '/admin/inicio' : '/professor/dashboard'}
            replace
        />
    )
}

const rotas = createBrowserRouter([
    {
        path: '/login',
        element: <Login />,
    },
    {
        path: '/',
        element: <Layout />,
        children: [
            {
                index: true,
                element: <RedirecionaInicio />,
            },
            {
                path: '/admin',
                element: <AdminLayout />,
                children: [
                    {
                        index: true,
                        element: <Navigate to='inicio' replace />,
                    },
                    { path: 'inicio', element: <AdminInicio /> },
                    { path: 'alunos', element: <AdminAlunos /> },
                    { path: 'funcionarios', element: <AdminFuncionarios /> },
                    { path: 'chamada', element: <AdminChamada /> },
                    { path: 'turmas', element: <AdminTurmas /> },
                    { path: 'salas', element: <AdminSalas /> },
                    { path: 'disciplinas', element: <AdminDisciplinas /> },
                    { path: 'exportar', element: <AdminExportar /> },
                ],
            },
            {
                path: '/professor',
                element: <ProfessorLayout />,
                children: [
                    {
                        index: true,
                        element: <Navigate to='dashboard' replace />,
                    },
                    { path: 'dashboard', element: <ProfessorDashboard /> },
                    { path: 'turmas', element: <MinhasTurmas /> },
                ],
            },
        ],
    },
])

export default function App() {
    return (
        <>
            {/* Fica fora das rotas para os avisos aparecerem em todas as telas, inclusive no Login */}
            <Toaster richColors position="top-center" />
            <RouterProvider router={rotas} />
        </>
    )
}