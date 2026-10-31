export async function apiFetch(
    input: RequestInfo | URL,
    init: RequestInit = {},
) {
    const token = localStorage.getItem('conToken')
    const headers = new Headers(init.headers)

    if (token) {
        headers.set('Authorization', `Bearer ${token}`)
    }

    if (init.body && typeof init.body === 'string' && !headers.has('Content-Type')) {
        headers.set('Content-Type', 'application/json')
    }

    const resposta = fetch(input, {
        ...init,
        headers,
    })

    return resposta
}
