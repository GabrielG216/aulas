// Sistema de Temas - Claro e Escuro

// Função para inicializar tema
function initTheme() {
    const savedTheme = localStorage.getItem('theme') || 'dark';
    applyTheme(savedTheme);
}

// Função para aplicar tema
function applyTheme(theme) {
    const body = document.body;
    
    if (theme === 'light') {
        body.classList.add('light-theme');
        localStorage.setItem('theme', 'light');
    } else {
        body.classList.remove('light-theme');
        localStorage.setItem('theme', 'dark');
    }
}

// Função para toggle tema
function toggleTheme() {
    const body = document.body;
    const isLight = body.classList.contains('light-theme');
    applyTheme(isLight ? 'dark' : 'light');
}

// Obter tema atual
function getCurrentTheme() {
    return document.body.classList.contains('light-theme') ? 'light' : 'dark';
}

// Inicializar ao carregar a página
document.addEventListener('DOMContentLoaded', initTheme);
