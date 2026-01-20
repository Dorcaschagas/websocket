const express = require('express');
const WebSocket = require('ws');
const path = require('path');
const ChatController = require('./controllers/ChatController');
const setupWebSocket = require('./webSocket');

const app = express();
const PORT = process.env.PORT || 3015;

// Servir arquivos estáticos
app.use(express.static(path.join(__dirname, '../public')));

// Rota principal - serve o index.html
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, '../public/view', 'index.html'));
});

// Criar servidor HTTP
const server = app.listen(PORT, () => {
  console.log(`Servidor HTTP rodando na porta ${PORT}`);
  console.log(`Acesse: http://localhost:${PORT}`);
});

// Criar servidor WebSocket
const wss = new WebSocket.Server({ server });

// Instanciar o controller
const chatController = new ChatController();

// Broadcast para todos os clientes conectados
function broadcast(data, excludeWs = null) {
  wss.clients.forEach(client => {
    if (client !== excludeWs && client.readyState === WebSocket.OPEN) {
      client.send(JSON.stringify(data));
    }
  });
}

// Configurar WebSocket
setupWebSocket(wss, chatController, broadcast, server);
