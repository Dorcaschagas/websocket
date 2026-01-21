// Adicionar após a linha 16 (após declaração de typingIndicator)
let newMessageCount = 0;
let notificationSound = null;
let audioContext = null;

// Inicializar AudioContext (precisa de interação do usuário)
function initAudioContext() {
    if (!audioContext) {
        audioContext = new (window.AudioContext || window.webkitAudioContext)();
    }
    
    // Retomar contexto se estiver suspenso
    if (audioContext.state === 'suspended') {
        audioContext.resume().then((_) => {});
    }
}

// Criar som de notificação
function createNotificationSound() {
    
    return function playSound() {
        
        if (!audioContext) {
            console.error('AudioContext não inicializado');
            return;
        }
        
        try {
            const oscillator = audioContext.createOscillator();
            const gainNode = audioContext.createGain();
            
            oscillator.connect(gainNode);
            gainNode.connect(audioContext.destination);
            
            oscillator.frequency.value = 800;
            oscillator.type = 'sine';
            
            gainNode.gain.setValueAtTime(0.3, audioContext.currentTime);
            gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.5);
            
            oscillator.start(audioContext.currentTime);
            oscillator.stop(audioContext.currentTime + 0.5);
            
        } catch (e) {
            console.error('Erro ao criar oscillator:', e);
        }
    };
}

// Notificar nova mensagem
function notifyNewMessage(isOwnMessage = false, message = null) {
    console.log('notifyNewMessage chamado:', { isOwnMessage, notificationSound: !!notificationSound });
    
    // Não notificar se for mensagem própria
    if (isOwnMessage) {
        console.log('Mensagem própria, não notificando');
        return;
    }
    
    if (notificationSound) {
        try {
            notificationSound();
        } catch (e) {
            console.error('Erro ao tocar som:', e);
        }
    } else {
        console.warn('notificationSound não está inicializado!');
    }
    
    // Se a página não estiver visível, mostrar badge
    if (document.hidden) {
        newMessageCount++;
        updateNotificationBadge();
        document.title = `(${newMessageCount}) 💬 Nova mensagem!`;
    }
    
    // Criar notificação flutuante (toast)
    showToastNotification(message);
    
    console.log('Notificação mostrada!');
}

// Mostrar notificação flutuante (toast)
function showToastNotification(message) {
    // Remover notificação anterior se existir
    const existingToast = document.querySelector('.toast-notification');
    if (existingToast) {
        existingToast.remove();
    }
    
    // Criar nova notificação
    const toast = document.createElement('div');
    toast.className = 'toast-notification';
    
    const username = message?.username || 'Alguém';
    const text = message?.text || 'enviou uma mensagem';
    
    toast.innerHTML = `
        <div class="toast-content">
            <div class="toast-username">${escapeHtmlToast(username)}</div>
            <div class="toast-message">${escapeHtmlToast(text)}</div>
        </div>
    `;
    
    document.body.appendChild(toast);
    
    // Remover após 1.5 segundos (animação completa)
    setTimeout(() => {
        if (toast.parentElement) {
            toast.remove();
        }
    }, 1500);
}

// Escape HTML para toast
function escapeHtmlToast(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
}

// Atualizar badge de notificação
function updateNotificationBadge() {
    let badge = document.querySelector('.notification-badge');
    
    if (newMessageCount > 0) {
        if (!badge) {
            badge = document.createElement('span');
            badge.className = 'notification-badge';
            document.querySelector('.header h1').appendChild(badge);
        }
        badge.textContent = newMessageCount > 99 ? '99+' : newMessageCount;
    } else if (badge) {
        badge.remove(); 
    }
}

// Limpar notificações
function clearNotifications() {
    newMessageCount = 0;
    updateNotificationBadge();
    document.title = 'Chat WebSocket - MVC';
}

// Inicializar ao carregar a página
window.addEventListener('DOMContentLoaded', () => {
    initAudioContext();
    notificationSound = createNotificationSound();
});

// Inicializar AudioContext com primeira interação do usuário
document.addEventListener('click', () => {
    initAudioContext();
}, { once: false });