// Endereço da API. Em desenvolvimento vem do .env.local (VITE_API_URL); sem ele, usa a porta padrão do backend.
export const API_URL: string = (import.meta.env.VITE_API_URL as string | undefined) ?? 'http://localhost:5171'

// Todo horário vindo da API está em UTC; a tela mostra no horário de Brasília.
export const FUSO_HORARIO = 'America/Sao_Paulo'
