export interface User {
    id?: string | number
    email: string
    senha?: string
    tipo: 'PROFESSOR' | 'ADM'
    nome?: string
}

export interface TurmaProfessor {
    id: number
    turmaId: number
    funcionarioId: number
    disciplinaId: number
    funcionario: { id: number; nome: string }
    disciplina: { id: number; nome: string }
}

export interface Turma {
    id?: number
    nome: string
    ano_letivo: number
    turno: string
    salaId: number
    capacidade: number
    observacao?: string | null
    createdAt?: string
    updatedAt?: string
    professores?: TurmaProfessor[]
}

export interface Funcionario {
    id?: number
    nome: string
    cpf: string
    matricula: string
    cargo: string
    telefone: string
    email: string
    senha?: string
    endereco: string
    numero: string
    complemento?: string
    bairro: string
    cidade: string
    cep: string
}

export interface LoginResponse {
    message: string
    user: {
        id: string | number
        email: string
        tipo: 'PROFESSOR' | 'ADM'
        nome: string
    }
}