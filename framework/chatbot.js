'use strict';

const request = require('request-promise-native');

const config = require('../config.json');

const utils = require('./utils');

class ChatModule {
  constructor(client) {
    this.client = client;
    this.chatbotUrl = config.chatbotUrl;
  }

  async sendMessage(message) {
    let options = {
      uri: this.chatbotUrl,
      qs: {
        s: message.content.slice(`<@${client.user.id}>`.length)
      },
      headers: {
        'User-Agent': 'Request'
      },
      json: true
    };
    request(options)
    .then(success => {
      console.log(success);
      message.channel.sendMessage(utils.getRichEmbed(this.client, 0xffffff, client.user.name, "hi"))
    }).catch(reason => {
      message.channel.sendMessage(utils.getRichEmbed(this.client, 0xff0000, client.user.name, "Bro something radom"));
    });
  }

  getTime() {
    let time = new Date();
    return time.toDateString();
  }
}

module.exports = ChatModule;