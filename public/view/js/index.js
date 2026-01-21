let ws = null;
let username = '';
let typingTimeout = null;
let reconnectAttempts = 0;
const MAX_RECONNECT_ATTEMPTS = 5;
const RECONNECT_DELAY = 3000;

const loginScreen = document.getElementById('login-screen');
const chatScreen = document.getElementById('chat-screen');
const usernameInput = document.getElementById('username-input');
const joinButton = document.getElementById('join-button');
const messagesDiv = document.getElementById('messages');
const messageInput = document.getElementById('message-input');
const sendButton = document.getElementById('send-button');
const statusDiv = document.getElementById('status');
const typingIndicator = document.getElementById('typing-indicator');

// Conectar ao WebSocket
function connect() {
    const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
    const wsUrl = `${protocol}//${window.location.host}`;
    console.log('Conectando ao WebSocket em', wsUrl);

    ws = new WebSocket(wsUrl);

    ws.onopen = () => {
        console.log('Conectado ao servidor WebSocket');
        statusDiv.textContent = `Conectado - ${username}`;
        reconnectAttempts = 0; // Resetar contador ao conectar com sucesso

        // Enviar mensagem de entrada
        ws.send(JSON.stringify({
            type: 'join',
            username: username
        }));
    };

    ws.onmessage = (event) => {
        const data = JSON.parse(event.data);
        console.log('Mensagem recebida:', data);
        handleMessage(data);
    };

    ws.onerror = (error) => {
        console.error('Erro no WebSocket:', error);
        statusDiv.textContent = 'Erro na conexão';
    };

    ws.onclose = () => {
        console.log('Desconectado do servidor');
        statusDiv.textContent = 'Desconectado';
        
        // Tentar reconectar automaticamente
        if (reconnectAttempts < MAX_RECONNECT_ATTEMPTS) {
            reconnectAttempts++;
            statusDiv.textContent = `Reconectando (${reconnectAttempts}/${MAX_RECONNECT_ATTEMPTS})...`;
            console.log(`Tentativa de reconexão ${reconnectAttempts}...`);
            
            setTimeout(() => {
                connect();
            }, RECONNECT_DELAY);
        } else {
            statusDiv.textContent = 'Falha na conexão. Recarregue a página.';
        }
    };
}

// Processar mensagens recebidas
function handleMessage(data) {
    switch (data.type) {
        case 'history':
            data.messages.forEach(msg => addMessage(msg));
            scrollToBottom(true); // Forçar scroll ao carregar histórico
            break;

        case 'message':
            addMessage(data.message);
            break;

        case 'userJoined':
            addSystemMessage(`${data.user.username} entrou no chat (${data.userCount} online)`);
            break;

        case 'userLeft':
            addSystemMessage(`${data.username} saiu do chat (${data.userCount} online)`);
            break;

        case 'typing':
            showTyping(data.username, data.isTyping);
            break;

        case 'messagesCleared':
            clearOldMessagesFromScreen(data.remainingTimestamps);
            break;
    }
}

// Adicionar mensagem ao chat
function addMessage(message) {
    const messageDiv = document.createElement('div');
    messageDiv.className = 'message';

    // Adicionar classe 'own' se a mensagem for do usuário atual
    if (message.username === username) {
        messageDiv.classList.add('own');
    }

    const time = new Date(message.timestamp).toLocaleTimeString('pt-BR', {
        hour: '2-digit',
        minute: '2-digit'
    });

    messageDiv.innerHTML = `
        <div class="message-info">
            <span class="message-username">${escapeHtml(message.username)}</span>
            <span class="message-time">${time}</span>
        </div>
        <div class="message-text">${escapeHtml(message.text)}</div>
    `;

    messagesDiv.appendChild(messageDiv);
    scrollToBottom();
}

// Adicionar mensagem do sistema
function addSystemMessage(text) {
    const messageDiv = document.createElement('div');
    messageDiv.className = 'system-message';
    messageDiv.textContent = text;
    messagesDiv.appendChild(messageDiv);
    scrollToBottom();
}

// Scroll inteligente para o final
function scrollToBottom(force = false) {
    // Verificar se o usuário está perto do final (dentro de 100px)
    const isNearBottom = messagesDiv.scrollHeight - messagesDiv.scrollTop - messagesDiv.clientHeight < 100;
    
    // Rolar apenas se estiver perto do final ou se for forçado
    if (isNearBottom || force) {
        setTimeout(() => {
            messagesDiv.scrollTop = messagesDiv.scrollHeight;
        }, 0);
    }
}

// Mostrar indicador de digitação
function showTyping(username, isTyping) {
    if (isTyping) {
        typingIndicator.textContent = `${username} está digitando...`;
    } else {
        typingIndicator.textContent = '';
    }
}

// Limpar mensagens antigas da tela
function clearOldMessagesFromScreen(remainingTimestamps) {
    const messageElements = messagesDiv.querySelectorAll('.message');
    const remainingSet = new Set(remainingTimestamps);
    
    messageElements.forEach(messageEl => {
        const timestampEl = messageEl.querySelector('.message-time');
        if (timestampEl) {
            const timeText = timestampEl.textContent;
            // Verificar se a mensagem ainda está na lista de mensagens restantes
            let shouldKeep = false;
            
            for (const timestamp of remainingTimestamps) {
                const date = new Date(timestamp);
                const formattedTime = date.toLocaleTimeString('pt-BR', {
                    hour: '2-digit',
                    minute: '2-digit'
                });
                
                if (formattedTime === timeText) {
                    shouldKeep = true;
                    break;
                }
            }
            
            if (!shouldKeep) {
                messageEl.remove();
            }
        }
    });
}

// Enviar mensagem
function sendMessage() {
    const text = messageInput.value.trim();

    if (text && ws && ws.readyState === WebSocket.OPEN) {
        ws.send(JSON.stringify({
            type: 'message',
            text: text
        }));

        messageInput.value = '';

        // Notificar que parou de digitar
        ws.send(JSON.stringify({
            type: 'typing',
            isTyping: false
        }));
    }
}

// Escape HTML para prevenir XSS
function escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
}

// Carregar username do localStorage ao iniciar
window.addEventListener('DOMContentLoaded', () => {
    const savedUsername = localStorage.getItem('chatUsername');
    if (savedUsername) {
        usernameInput.value = savedUsername;
        usernameInput.focus();
    }
});

// Event Listeners
joinButton.addEventListener('click', () => {
    username = usernameInput.value.trim();

    if (username) {
        // Salvar username no localStorage
        localStorage.setItem('chatUsername', username);

        loginScreen.style.display = 'none';
        chatScreen.style.display = 'flex';
        connect();
    } else {
        alert('Por favor, digite um nome de usuário');
    }
});

usernameInput.addEventListener('keypress', (e) => {
    if (e.key === 'Enter') {
        joinButton.click();
    }
});

sendButton.addEventListener('click', sendMessage);

messageInput.addEventListener('keypress', (e) => {
    if (e.key === 'Enter') {
        sendMessage();
    }
});

messageInput.addEventListener('input', () => {
    if (ws && ws.readyState === WebSocket.OPEN) {
        // Notificar que está digitando
        ws.send(JSON.stringify({
            type: 'typing',
            isTyping: true
        }));

        // Limpar timeout anterior
        clearTimeout(typingTimeout);

        // Notificar que parou de digitar após 2 segundos
        typingTimeout = setTimeout(() => {
            ws.send(JSON.stringify({
                type: 'typing',
                isTyping: false
            }));
        }, 2000);
    }
});

// Limpar username do localStorage (opcional - descomente se quiser)
// function clearUsername() {
//     localStorage.removeItem('chatUsername');
// }

// Reconectar quando a página voltar a ficar ativa
document.addEventListener('visibilitychange', () => {
    if (!document.hidden && username) {
        // Página voltou a ficar visível
        if (!ws || ws.readyState === WebSocket.CLOSED || ws.readyState === WebSocket.CLOSING) {
            console.log('Tela reativada - reconectando...');
            statusDiv.textContent = 'Reconectando...';
            reconnectAttempts = 0; // Resetar tentativas
            connect();
        }
    }
});

// Reconectar quando a janela receber foco
window.addEventListener('focus', () => {
    if (username) {
        if (!ws || ws.readyState === WebSocket.CLOSED || ws.readyState === WebSocket.CLOSING) {
            console.log('Janela focada - reconectando...');
            statusDiv.textContent = 'Reconectando...';
            reconnectAttempts = 0; // Resetar tentativas
            connect();
        }
    }
});

// Fechar conexão ao sair da página
window.addEventListener('beforeunload', () => {
    if (ws) {
        ws.close();
    }
});