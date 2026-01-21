
function setupWebSocket(wss, chatController, broadcast, server) {
  // Gerenciar conexões WebSocket
  wss.on('connection', (ws) => {
    console.log('Novo cliente conectado');

    ws.on('message', (data) => {
      try {
        const messageData = JSON.parse(data);
        console.log(messageData)

        switch (messageData.type) {
          case 'join':
            // Adicionar usuário
            const user = chatController.addUser(ws, messageData.username);
            
            // Enviar mensagens recentes para o novo usuário
            ws.send(JSON.stringify({
              type: 'history',
              messages: chatController.getRecentMessages()
            }));

            // Notificar todos sobre novo usuário
            broadcast({
              type: 'userJoined',
              user: user.toJSON(),
              userCount: chatController.getUserCount()
            });

            // Enviar lista de usuários para o novo cliente
            ws.send(JSON.stringify({
              type: 'userList',
              users: chatController.getUserList()
            }));
            break;

          case 'message':
            const currentUser = chatController.getUser(ws);
            if (currentUser) {
              const message = chatController.addMessage(
                currentUser.username,
                messageData.text
              );

              // Broadcast da mensagem para todos
              broadcast({
                type: 'message',
                message: message.toJSON()
              }, null); // Enviar para todos, incluindo o remetente
            }
            break;

          case 'typing':
            const typingUser = chatController.getUser(ws);
            if (typingUser) {
              broadcast({
                type: 'typing',
                username: typingUser.username,
                isTyping: messageData.isTyping
              }, ws); // Não enviar para o próprio usuário
            }
            break;
        }
      } catch (error) {
        console.error('Erro ao processar mensagem:', error);
      }
    });

    ws.on('close', () => {
      const user = chatController.removeUser(ws);
      if (user) {
        console.log(`Cliente desconectado: ${user.username}`);
        
        broadcast({
          type: 'userLeft',
          username: user.username,
          userCount: chatController.getUserCount()
        });
      }
    });

    ws.on('error', (error) => {
      console.error('Erro no WebSocket:', error);
    });
  });

  // Tratamento de encerramento gracioso
  process.on('SIGTERM', () => {
    console.log('SIGTERM recebido. Encerrando servidor...');
    server.close(() => {
      console.log('Servidor encerrado');
      process.exit(0);
    });
  });
}

module.exports = setupWebSocket;
