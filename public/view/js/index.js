let ws = null;
let username = '';
let typingTimeout = null;

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
    };
}

// Processar mensagens recebidas
function handleMessage(data) {
    switch (data.type) {
        case 'history':
            data.messages.forEach(msg => addMessage(msg));
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
    messagesDiv.scrollTop = messagesDiv.scrollHeight;
}

// Adicionar mensagem do sistema
function addSystemMessage(text) {
    const messageDiv = document.createElement('div');
    messageDiv.className = 'system-message';
    messageDiv.textContent = text;
    messagesDiv.appendChild(messageDiv);
    messagesDiv.scrollTop = messagesDiv.scrollHeight;
}

// Mostrar indicador de digitação
function showTyping(username, isTyping) {
    if (isTyping) {
        typingIndicator.textContent = `${username} está digitando...`;
    } else {
        typingIndicator.textContent = '';
    }
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

// Fechar conexão ao sair da página
window.addEventListener('beforeunload', () => {
    if (ws) {
        ws.close();
    }
});