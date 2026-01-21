class Group {
  constructor(id, name, description, icon) {
    this.id = id;
    this.name = name;
    this.description = description;
    this.icon = icon;
    this.messages = [];
    this.users = new Map(); // ws -> User
  }

  addUser(ws, user) {
    this.users.set(ws, user);
  }

  removeUser(ws) {
    const user = this.users.get(ws);
    this.users.delete(ws);
    return user;
  }

  getUser(ws) {
    return this.users.get(ws);
  }

  addMessage(message) {
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

  clearOldMessages() {
    const oneMinuteAgo = new Date(Date.now() - 60000);
    const initialLength = this.messages.length;
    
    this.messages = this.messages.filter(message => 
      new Date(message.timestamp) > oneMinuteAgo
    );
    
    const clearedCount = initialLength - this.messages.length;
    if (clearedCount > 0) {
      console.log(`[${this.name}] ${clearedCount} mensagens antigas foram removidas`);
      return {
        cleared: true,
        clearedCount,
        remainingTimestamps: this.messages.map(m => m.timestamp.toISOString())
      };
    }
    
    return { cleared: false };
  }

  toJSON() {
    return {
      id: this.id,
      name: this.name,
      description: this.description,
      icon: this.icon,
      userCount: this.getUserCount()
    };
  }
}

module.exports = Group;