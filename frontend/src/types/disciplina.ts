export interface Disciplina {
  id?: number;
  nome: string;
  cargaHoraria: string;
  professorNome: string;
  sala: string;
  capacidade: number | string;
  descricao: string;
}

export interface User {
  email: string;
  tipo: 'PROFESSOR' | 'ADM';
}
