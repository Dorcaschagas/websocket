# 💬 Chat WebSocket - Arquitetura MVC

Aplicação de chat em tempo real utilizando WebSocket com arquitetura MVC (Model-View-Controller).

## 📋 Características

- ✅ Chat em tempo real com WebSocket
- ✅ Arquitetura MVC organizada
- ✅ Indicador de digitação
- ✅ Histórico de mensagens
- ✅ Contador de usuários online
- ✅ Interface responsiva e moderna
- ✅ Notificações de entrada/saída de usuários

## 🏗️ Estrutura do Projeto

```
websocket/
├── controllers/
│   └── ChatController.js    # Lógica de controle do chat
├── models/
│   ├── Message.js            # Model de mensagem
│   └── User.js               # Model de usuário
├── public/
│   └── index.html            # Interface do usuário (View)
├── server.js                 # Servidor WebSocket e Express
├── package.json
├── .gitignore
└── README.md
```

## 🚀 Como Executar

### Pré-requisitos

- Node.js (versão 14 ou superior)
- npm ou yarn

### Instalação

1. Clone o repositório:
```bash
git clone <seu-repositorio>
cd websocket
```

2. Instale as dependências:
```bash
npm install
```

3. Inicie o servidor:
```bash
npm start
```

4. Acesse no navegador:
```
http://localhost:3000
```

### Modo de Desenvolvimento

Para rodar com auto-reload:
```bash
npm run dev
```

## 🛠️ Tecnologias Utilizadas

- **Backend:**
  - Node.js
  - Express.js
  - WebSocket (ws)

- **Frontend:**
  - HTML5
  - CSS3
  - JavaScript (ES6+)

## 📦 Dependências

```json
{
  "express": "^4.18.2",
  "ws": "^8.14.2"
}
```

## 🏛️ Arquitetura MVC

### Model
- `Message.js`: Define a estrutura de uma mensagem (usuário, texto, timestamp)
- `User.js`: Define a estrutura de um usuário (id, username, connectedAt)

### View
- `index.html`: Interface do usuário com design responsivo

### Controller
- `ChatController.js`: Gerencia lógica de usuários e mensagens
- `server.js`: Orquestra conexões WebSocket e rotas HTTP

## 📡 API WebSocket

### Mensagens do Cliente para Servidor

**Join (Entrar no chat)**
```json
{
  "type": "join",
  "username": "seu_nome"
}
```

**Message (Enviar mensagem)**
```json
{
  "type": "message",
  "text": "sua mensagem"
}
```

**Typing (Indicador de digitação)**
```json
{
  "type": "typing",
  "isTyping": true
}
```

### Mensagens do Servidor para Cliente

**History (Histórico de mensagens)**
```json
{
  "type": "history",
  "messages": [...]
}
```

**Message (Nova mensagem)**
```json
{
  "type": "message",
  "message": {
    "username": "usuario",
    "text": "mensagem",
    "timestamp": "2026-01-20T..."
  }
}
```

**UserJoined (Usuário entrou)**
```json
{
  "type": "userJoined",
  "user": {...},
  "userCount": 5
}
```

**UserLeft (Usuário saiu)**
```json
{
  "type": "userLeft",
  "username": "usuario",
  "userCount": 4
}
```

## 🔒 Segurança

- Escape de HTML para prevenir XSS
- Limite de tamanho de mensagens (500 caracteres)
- Limite de histórico (100 mensagens)
- Validação de entrada de usuário

## 📝 Licença

MIT

## 👨‍💻 Autor

Desenvolvido com ❤️ usando Node.js e WebSocket

---

⭐ Se este projeto foi útil, considere dar uma estrela!
