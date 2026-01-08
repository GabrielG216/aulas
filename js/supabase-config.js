// Configuração do Supabase
// As credenciais são injetadas via variáveis de ambiente

export const SUPABASE_URL = process.env.SUPABASE_URL || window.location.origin;
export const SUPABASE_ANON_KEY = process.env.SUPABASE_ANON_KEY || '';

// Importar Supabase (usando CDN no HTML)
