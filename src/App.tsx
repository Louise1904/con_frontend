import { createBrowserRouter, Navigate, RouterProvider } from 'react-router-dom'
import Layout from './Layout.tsx'
import Login from './Login.tsx'
import AdminLayout from './admin/AdminLayout.tsx'
import AdminDashboard from './admin/AdminDashboard.tsx'
import AdminTurmas from './admin/AdminTurmas.tsx'
import AdminFuncionarios from './admin/AdminFuncionarios.tsx'
import ProfessorLayout from './professor/ProfessorLayout.tsx'
import ProfessorDashboard from './professor/ProfessorDashboard.tsx'
import MinhasTurmas from './professor/MinhasTurmas.tsx'

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
                element: (
                    <Navigate
                        to={
                            localStorage.getItem('conToken')?.startsWith('token-')
                                ? '/admin/dashboard'
                                : '/professor/dashboard'
                        }
                        replace
                    />
                ),
            },
            {
                path: '/admin',
                element: <AdminLayout />,
                children: [
                    {
                        index: true,
                        element: <Navigate to='dashboard' replace />,
                    },
                    { path: 'dashboard', element: <AdminDashboard /> },
                    { path: 'turmas', element: <AdminTurmas /> },
                    { path: 'funcionarios', element: <AdminFuncionarios /> },
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
    return <RouterProvider router={rotas} />
}