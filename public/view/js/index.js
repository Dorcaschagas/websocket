let ws = null;
let username = '';
let currentGroupId = 'geral';
let groups = [];
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
const groupsList = document.getElementById('groups-list');
const searchInput = document.getElementById('search-input');
const currentGroupName = document.getElementById('current-group-name');
const currentGroupUsers = document.getElementById('current-group-users');

// Conectar ao WebSocket
function connect() {
    const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
    const wsUrl = `${protocol}//${window.location.host}`;
    console.log('Conectando ao WebSocket em', wsUrl);

    ws = new WebSocket(wsUrl);

    ws.onopen = () => {
        console.log('Conectado ao servidor WebSocket');
        statusDiv.textContent = `Conectado - ${username}`;
        reconnectAttempts = 0;

        // Enviar mensagem de entrada
        ws.send(JSON.stringify({
            type: 'join',
            username: username,
            groupId: currentGroupId
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
        case 'groupList':
            groups = data.groups;
            renderGroups();
            break;

        case 'history':
            if (data.groupId === currentGroupId) {
                messagesDiv.innerHTML = '';
                data.messages.forEach(msg => addMessage(msg, true));
                scrollToBottom(true);
            }
            break;

        case 'message':
            if (!data.groupId || data.groupId === currentGroupId) {
                addMessage(data.message, false);
            } else {
                console.log('Mensagem ignorada - grupo diferente:', data.groupId, 'atual:', currentGroupId);
            }
            break;

        case 'userJoined':
            if (data.groupId === currentGroupId) {
                addSystemMessage(`${data.user.username} entrou no chat (${data.userCount} online)`);
                updateCurrentGroupUsers(data.userCount);
            }
            break;

        case 'userLeft':
            if (data.groupId === currentGroupId) {
                addSystemMessage(`${data.username} saiu do chat (${data.userCount} online)`);
                updateCurrentGroupUsers(data.userCount);
            }
            break;

        case 'typing':
            showTyping(data.username, data.isTyping);
            break;

        case 'messagesCleared':
            clearOldMessagesFromScreen(data.remainingTimestamps);
            break;

        case 'groupSwitched':
            // LIMPAR MENSAGENS ANTIGAS ANTES DE TROCAR
            messagesDiv.innerHTML = '';
            typingIndicator.innerHTML = '';
            
            currentGroupId = data.groupId;
            updateCurrentGroupHeader(data.group);
            renderGroups();
            
            console.log('Grupo trocado para:', data.groupId);
            break;
    }
}
// Renderizar lista de grupos
function renderGroups() {
    const searchTerm = searchInput.value.toLowerCase();
    
    groupsList.innerHTML = '';
    
    groups
        .filter(group => 
            group.name.toLowerCase().includes(searchTerm) ||
            group.description.toLowerCase().includes(searchTerm)
        )
        .forEach(group => {
            const groupItem = document.createElement('div');
            groupItem.className = `group-item ${group.id === currentGroupId ? 'active' : ''}`;
            groupItem.onclick = () => switchGroup(group.id);
            
            groupItem.innerHTML = `
                <div class="group-item-header">
                    <span class="group-name">${escapeHtml(group.name)}</span>
                    <span class="group-user-count">${group.userCount}</span>
                </div>
                <div class="group-description">${escapeHtml(group.description)}</div>
            `;
            
            groupsList.appendChild(groupItem);
        });
}

// Trocar de grupo
function switchGroup(groupId) {
    if (groupId === currentGroupId) return;
    
    console.log('Trocando para grupo:', groupId);
    
    ws.send(JSON.stringify({
        type: 'switchGroup',
        groupId: groupId
    }));
}

// Atualizar header do grupo atual
function updateCurrentGroupHeader(group) {
    currentGroupName.textContent = group.name;
    currentGroupUsers.textContent = `${group.userCount} online`;
}

// Atualizar contador de usuários
function updateCurrentGroupUsers(count) {
    currentGroupUsers.textContent = `${count} online`;
}


// Adicionar mensagem ao chat
function addMessage(message, isHistory = false) {
    const messageDiv = document.createElement('div');
    messageDiv.className = 'message';

    const isOwnMessage = message.username === username;
    if (isOwnMessage) {
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
    
    // Notificar nova mensagem (não notificar se for histórico)
    if (!isHistory) {
        notifyNewMessage(isOwnMessage, message);
    }
}

// Adicionar mensagem do sistema
function addSystemMessage(text) {
    const messageDiv = document.createElement('div');
    messageDiv.className = 'system-message';
    messageDiv.textContent = text;
    messagesDiv.appendChild(messageDiv);
    scrollToBottom();
}

// Scroll para o final
function scrollToBottom(force = false) {
    requestAnimationFrame(() => {
        messagesDiv.scrollTop = messagesDiv.scrollHeight;
    });
}

// Mostrar indicador de digitação
function showTyping(username, isTyping) {
    if (isTyping) {
        typingIndicator.className = 'typing-indicator active';
        typingIndicator.innerHTML = `
            ${username} está digitando
            <span class="typing-dots">
                <span></span>
                <span></span>
                <span></span>
            </span>
        `;
    } else {
        typingIndicator.className = 'typing-indicator';
        typingIndicator.innerHTML = '';
    }
}

// Limpar mensagens antigas
function clearOldMessagesFromScreen(remainingTimestamps) {
    const messageElements = messagesDiv.querySelectorAll('.message');
    const remainingSet = new Set(remainingTimestamps);
    
    messageElements.forEach(messageEl => {
        const timestampEl = messageEl.querySelector('.message-time');
        if (timestampEl) {
            const timeText = timestampEl.textContent;
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
        messageInput.focus();

        ws.send(JSON.stringify({
            type: 'typing',
            isTyping: false
        }));
    }
}

// Escape HTML
function escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
}

// Event Listeners
window.addEventListener('DOMContentLoaded', () => {
    const savedUsername = localStorage.getItem('chatUsername');
    if (savedUsername) {
        usernameInput.value = savedUsername;
        usernameInput.focus();
    }
    
    notificationSound = createNotificationSound();
});

joinButton.addEventListener('click', () => {
    username = usernameInput.value.trim();

    if (username) {
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
        ws.send(JSON.stringify({
            type: 'typing',
            isTyping: true
        }));

        clearTimeout(typingTimeout);

        typingTimeout = setTimeout(() => {
            ws.send(JSON.stringify({
                type: 'typing',
                isTyping: false
            }));
        }, 2000);
    }
});

// Buscar grupos
searchInput.addEventListener('input', () => {
    renderGroups();
});

// Reconexão
document.addEventListener('visibilitychange', () => {
    if (!document.hidden && username) {
        clearNotifications();
        if (!ws || ws.readyState === WebSocket.CLOSED || ws.readyState === WebSocket.CLOSING) {
            console.log('Tela reativada - reconectando...');
            statusDiv.textContent = 'Reconectando...';
            reconnectAttempts = 0;
            connect();
        }
    }
});

window.addEventListener('focus', () => {
    clearNotifications();
    if (username) {
        if (!ws || ws.readyState === WebSocket.CLOSED || ws.readyState === WebSocket.CLOSING) {
            console.log('Janela focada - reconectando...');
            statusDiv.textContent = 'Reconectando...';
            reconnectAttempts = 0;
            connect();
        }
    }
});

window.addEventListener('beforeunload', () => {
    if (ws) {
        ws.close();
    }
});