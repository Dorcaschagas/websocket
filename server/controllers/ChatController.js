const Message = require('../models/Message');
const User = require('../models/User');

class ChatController {
  constructor() {
    this.users = new Map();
    this.messages = [];
  }

  addUser(ws, username) {
    const userId = this.generateUserId();
    const user = new User(userId, username);
    this.users.set(ws, user);
    return user;
  }

  removeUser(ws) {
    const user = this.users.get(ws);
    this.users.delete(ws);
    return user;
  }

  getUser(ws) {
    return this.users.get(ws);
  }

  addMessage(username, text) {
    const message = new Message(username, text);
    this.messages.push(message);
    
    // Manter apenas as últimas 100 mensagens
    if (this.messages.length > 100) {
      this.messages.shift();
    }
    
    return message;
  }

  getRecentMessages(limit = 50) {
    return this.messages.slice(-limit);
  }

  getUserCount() {
    return this.users.size;
  }

  getUserList() {
    return Array.from(this.users.values()).map(user => user.toJSON());
  }

  generateUserId() {
    return `user_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  clearOldMessages() {
    const oneMinuteAgo = new Date(Date.now() - 60000);
    const initialLength = this.messages.length;
    
    this.messages = this.messages.filter(message => 
      new Date(message.timestamp) > oneMinuteAgo
    );
    
    const clearedCount = initialLength - this.messages.length;
    if (clearedCount > 0) {
      console.log(`${clearedCount} mensagens antigas foram removidas`);
      return {
        cleared: true,
        clearedCount,
        remainingTimestamps: this.messages.map(m => m.timestamp.toISOString())
      };
    }
    
    return { cleared: false };
  }
}

module.exports = ChatController;
