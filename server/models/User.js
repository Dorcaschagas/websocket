class User {
  constructor(id, username) {
    this.id = id;
    this.username = username;
    this.connectedAt = new Date();
  }

  toJSON() {
    return {
      id: this.id,
      username: this.username,
      connectedAt: this.connectedAt.toISOString()
    };
  }
}

module.exports = User;