const Message = require('../models/Message');
const User = require('../models/User');
const Group = require('../models/Group');

class ChatController {
  constructor() {
    this.users = new Map(); // ws -> { user, groupId }
    this.groups = new Map();
    this.initializeGroups();
  }

  initializeGroups() {
    const defaultGroups = [
      { id: 'geral', name: '💬 Geral', description: 'Conversa geral', icon: '💬' },
      { id: 'tecnologia', name: '💻 Tecnologia', description: 'Discussões sobre tech', icon: '💻' },
      { id: 'jogos', name: '🎮 Jogos', description: 'Gamers reunidos', icon: '🎮' },
      { id: 'musica', name: '🎵 Música', description: 'Compartilhe suas músicas', icon: '🎵' },
      { id: 'random', name: '🎲 Random', description: 'Tópicos aleatórios', icon: '🎲' }
    ];

    defaultGroups.forEach(g => {
      this.groups.set(g.id, new Group(g.id, g.name, g.description, g.icon));
    });

    console.log(`${this.groups.size} grupos inicializados`);
  }

  addUser(ws, username, groupId = 'geral') {
    const userId = this.generateUserId();
    const user = new User(userId, username);
    
    // Adicionar usuário ao grupo
    const group = this.groups.get(groupId);
    if (group) {
      group.addUser(ws, user);
      this.users.set(ws, { user, groupId });
      console.log(`Usuário ${username} entrou no grupo ${group.name}`);
    }
    
    return user;
  }

  switchGroup(ws, newGroupId) {
    const userData = this.users.get(ws);
    if (!userData) return null;

    const oldGroup = this.groups.get(userData.groupId);
    const newGroup = this.groups.get(newGroupId);

    if (!newGroup) return null;

    // Remover do grupo antigo
    if (oldGroup) {
      oldGroup.removeUser(ws);
    }

    // Adicionar ao novo grupo
    newGroup.addUser(ws, userData.user);
    userData.groupId = newGroupId;
    
    console.log(`Usuário ${userData.user.username} mudou de ${oldGroup?.name} para ${newGroup.name}`);
    
    return {
      oldGroup: oldGroup?.toJSON(),
      newGroup: newGroup.toJSON(),
      user: userData.user
    };
  }

  removeUser(ws) {
    const userData = this.users.get(ws);
    if (!userData) return null;

    const group = this.groups.get(userData.groupId);
    if (group) {
      group.removeUser(ws);
    }

    this.users.delete(ws);
    return { user: userData.user, groupId: userData.groupId };
  }

  getUser(ws) {
    const userData = this.users.get(ws);
    return userData ? userData.user : null;
  }

  getUserData(ws) {
    return this.users.get(ws);
  }

  addMessage(ws, text) {
    const userData = this.users.get(ws);
    if (!userData) return null;

    const group = this.groups.get(userData.groupId);
    if (!group) return null;

    const message = new Message(userData.user.username, text);
    group.addMessage(message);
    
    return { message, groupId: userData.groupId };
  }

  getRecentMessages(groupId, limit = 50) {
    const group = this.groups.get(groupId);
    return group ? group.getRecentMessages(limit) : [];
  }

  getUserCount(groupId) {
    const group = this.groups.get(groupId);
    return group ? group.getUserCount() : 0;
  }

  getUserList(groupId) {
    const group = this.groups.get(groupId);
    return group ? group.getUserList() : [];
  }

  getAllGroups() {
    return Array.from(this.groups.values()).map(g => g.toJSON());
  }

  getGroup(groupId) {
    return this.groups.get(groupId);
  }

  generateUserId() {
    return `user_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  clearOldMessages() {
    const results = [];
    
    this.groups.forEach((group, groupId) => {
      const result = group.clearOldMessages();
      if (result.cleared) {
        results.push({
          groupId,
          ...result
        });
      }
    });
    
    return results;
  }
}

module.exports = ChatController;