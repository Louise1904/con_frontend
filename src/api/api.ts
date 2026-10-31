// Endereço do back. Se a porta mudar, troca só aqui.
export const API_URL = 'http://localhost:3001'

// Faz requisições para o back já com o endereço e o cabeçalho JSON.
// Uso: apiFetch('/api/turmas')  ou  apiFetch('/api/login', { method: 'POST', body: ... })
export function apiFetch(caminho: string, opcoes: RequestInit = {}) {
  return fetch(`${API_URL}${caminho}`, {
    ...opcoes,
    headers: {
      'Content-Type': 'application/json',
      ...opcoes.headers,
    },
  })
}

// Lê a mensagem de erro que o back envia.
// O back responde de dois jeitos:
//   { erro: "Turma não encontrada" }                             -> texto simples
//   { erro: { fieldErrors: { nome: ["Nome é obrigatório"] } } }  -> erro do Zod
export async function lerErro(resposta: Response, mensagemPadrao: string) {
  const dados = await resposta.json().catch(() => ({}))

  if (typeof dados.erro === 'string') return dados.erro

  if (dados.erro?.fieldErrors) {
    const primeira = Object.values(dados.erro.fieldErrors).flat()[0]
    if (typeof primeira === 'string') return primeira
  }

  if (dados.erro?.formErrors?.[0]) return dados.erro.formErrors[0]

  return mensagemPadrao
}