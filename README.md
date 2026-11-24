<div align="center">

# 🎓 CON — Controle de Chamada Acadêmica
### Frontend

## Sobre

Interface web do **CON**, sistema de controle de chamada acadêmica desenvolvido
como projeto da disciplina de Gestão Ágil (4º Semestre — ADS), simulando o
cenário de uma **EMEI** (Escola Municipal de Educação Infantil).

Dois perfis de acesso:

- **Direção (admin)** — acesso completo: cadastro de alunos, turmas, salas,
  disciplinas, funcionários, vínculo de professores, chamada, histórico e
  exportação de diário em PDF.
- **Professor** — acesso restrito às próprias turmas/disciplinas: chamada,
  histórico de presença e exportação de diário.

---

## Tecnologias

| Categoria | Ferramenta |
|---|---|
| Framework | React + Vite |
| Linguagem | TypeScript |
| Estilização | Tailwind CSS |
| Formulários | React Hook Form + Zod |
| Estado de autenticação | Zustand |
| Gráficos | Recharts |
| Geração de PDF | @react-pdf/renderer |
| Notificações | Sonner |

---

## Como rodar

```bash
npm install
npm run dev
```

Antes de iniciar, crie um arquivo `.env` na raiz do projeto com o endereço da API:

```env
VITE_API_URL=http://localhost:3001
```

---

## Estrutura de telas

### Admin (`/admin/...`)

| Rota | Tela |
|---|---|
| `inicio` | Página inicial com atalhos |
| `chamada` | Registrar chamada (qualquer turma/disciplina) |
| `historico` | Histórico de frequência (gráfico + tabela) |
| `exportar` | Exportar diário de classe em PDF |
| `alunos` | Gerenciar alunos |
| `turmas` | Gerenciar turmas e vincular professor a disciplina |
| `salas` | Gerenciar salas |
| `disciplinas` | Gerenciar disciplinas |
| `funcionarios` | Gerenciar funcionários |

### Professor (`/professor/...`)

| Rota | Tela |
|---|---|
| `chamada` | Registrar chamada (só das próprias turmas/disciplinas) |
| `historico` | Histórico de frequência das próprias turmas |
| `exportar` | Exportar diário de classe das próprias turmas |
| `turmas` | Visualizar as turmas vinculadas |

---

## Usuário de teste

| Perfil | E-mail | Senha |
|---|---|---|
| Direção (admin) | `direcao@con.local` | `Admin@123` |

Para testar o perfil de professor, crie um funcionário com cargo **"Professor"**
pelo painel admin e vincule-o a uma turma/disciplina na tela de Turmas.

---

<div align="center">
Projeto acadêmico — ADS, 4º Semestre, Gestão Ágil
</div>
