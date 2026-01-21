function setupWebSocket(wss, chatController, broadcast, server) {
  // Gerenciar conexões WebSocket
  wss.on('connection', (ws) => {
    console.log('Novo cliente conectado');

    const clearMessagesInterval = setInterval(() => {
      const results = chatController.clearOldMessages();
      results.forEach(result => {
        // Notificar clientes do grupo sobre a limpeza
        broadcast({
          type: 'messagesCleared',
          remainingTimestamps: result.remainingTimestamps
        }, null, result.groupId);
      });
    }, 60000);

    ws.on('message', (data) => {
      try {
        const messageData = JSON.parse(data);

        switch (messageData.type) {
          case 'join':
            // Adicionar usuário ao grupo (padrão: geral)
            const user = chatController.addUser(ws, messageData.username, messageData.groupId || 'geral');
            const userData = chatController.getUserData(ws);

            // Enviar lista de grupos
            ws.send(JSON.stringify({
              type: 'groupList',
              groups: chatController.getAllGroups()
            }));

            // Enviar mensagens recentes do grupo
            ws.send(JSON.stringify({
              type: 'history',
              messages: chatController.getRecentMessages(userData.groupId),
              groupId: userData.groupId
            }));

            // Notificar todos do grupo sobre novo usuário
            broadcast({
              type: 'userJoined',
              user: user.toJSON(),
              userCount: chatController.getUserCount(userData.groupId),
              groupId: userData.groupId
            }, null, userData.groupId);

            // Atualizar contadores de todos os grupos
            broadcast({
              type: 'groupList',
              groups: chatController.getAllGroups()
            });
            break;

          case 'switchGroup':
            const switchResult = chatController.switchGroup(ws, messageData.groupId);

            if (switchResult) {
              // Notificar grupo antigo
              if (switchResult.oldGroup) {
                broadcast({
                  type: 'userLeft',
                  username: switchResult.user.username,
                  userCount: chatController.getUserCount(switchResult.oldGroup.id),
                  groupId: switchResult.oldGroup.id
                }, null, switchResult.oldGroup.id);
              }

              // Enviar histórico do novo grupo
              ws.send(JSON.stringify({
                type: 'history',
                messages: chatController.getRecentMessages(messageData.groupId),
                groupId: messageData.groupId
              }));

              // Notificar novo grupo
              broadcast({
                type: 'userJoined',
                user: switchResult.user.toJSON(),
                userCount: chatController.getUserCount(messageData.groupId),
                groupId: messageData.groupId
              }, null, messageData.groupId);

              // Confirmar mudança para o usuário
              ws.send(JSON.stringify({
                type: 'groupSwitched',
                groupId: messageData.groupId,
                group: switchResult.newGroup
              }));

              // Atualizar contadores
              broadcast({
                type: 'groupList',
                groups: chatController.getAllGroups()
              });
            }
            break;

          case 'message':
              const result = chatController.addMessage(ws, messageData.text);
              
              if (result) {
                  // Broadcast apenas para o grupo COM groupId
                  broadcast({
                      type: 'message',
                      message: result.message.toJSON(),
                      groupId: result.groupId 
                  }, null, result.groupId);
              }
              break;

          case 'typing':
            const typingUserData = chatController.getUserData(ws);
            if (typingUserData) {
              broadcast({
                type: 'typing',
                username: typingUserData.user.username,
                isTyping: messageData.isTyping
              }, ws, typingUserData.groupId); // Não enviar para o próprio usuário
            }
            break;
        }
      } catch (error) {
        console.error('Erro ao processar mensagem:', error);
      }
    });

    ws.on('close', () => {
      clearInterval(clearMessagesInterval);
      const removed = chatController.removeUser(ws);

      if (removed) {
        console.log(`Cliente desconectado: ${removed.user.username}`);

        // Notificar grupo
        broadcast({
          type: 'userLeft',
          username: removed.user.username,
          userCount: chatController.getUserCount(removed.groupId),
          groupId: removed.groupId
        }, null, removed.groupId);

        // Atualizar contadores
        broadcast({
          type: 'groupList',
          groups: chatController.getAllGroups()
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