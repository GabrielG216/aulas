// Sistema de Toast Notifications

// Criar container se não existir
if (!document.querySelector('.toast-container')) {
    const container = document.createElement('div');
    container.className = 'toast-container';
    document.body.appendChild(container);
}

/**
 * Mostrar notificação toast
 * @param {string} message - Mensagem a exibir
 * @param {string} type - Tipo: 'success', 'error', 'warning', 'info'
 * @param {number} duration - Duração em ms (0 = sem auto-remover)
 */
function showToast(message, type = 'info', duration = 3000) {
    const container = document.querySelector('.toast-container');
    
    // Ícones para cada tipo
    const icons = {
        success: '✓',
        error: '✕',
        warning: '⚠',
        info: 'ℹ'
    };

    const toast = document.createElement('div');
    toast.className = `toast ${type}`;
    toast.innerHTML = `
        <span class="toast-icon">${icons[type] || icons.info}</span>
        <span class="toast-message">${message}</span>
        <button class="toast-close" onclick="this.parentElement.remove();">×</button>
    `;

    container.appendChild(toast);

    // Auto-remover após duration
    if (duration > 0) {
        setTimeout(() => {
            if (toast.parentElement) {
                toast.classList.add('removing');
                setTimeout(() => {
                    if (toast.parentElement) {
                        toast.remove();
                    }
                }, 300);
            }
        }, duration);
    }

    return toast;
}

// Aliases para facilitar uso
const Toast = {
    success: (msg, duration = 3000) => showToast(msg, 'success', duration),
    error: (msg, duration = 4000) => showToast(msg, 'error', duration),
    warning: (msg, duration = 3000) => showToast(msg, 'warning', duration),
    info: (msg, duration = 3000) => showToast(msg, 'info', duration)
};
