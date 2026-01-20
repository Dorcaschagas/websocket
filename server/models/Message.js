class Message {
  constructor(username, text, timestamp = new Date()) {
    this.username = username;
    this.text = text;
    this.timestamp = timestamp;
  }

  toJSON() {
    return {
      username: this.username,
      text: this.text,
      timestamp: this.timestamp.toISOString()
    };
  }

  static fromJSON(json) {
    return new Message(
      json.username,
      json.text,
      new Date(json.timestamp)
    );
  }
}

module.exports = Message;
