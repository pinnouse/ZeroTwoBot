'use strict';

const axios = require('axios');

const config = require('../config.json');

const utils = require('./utils');

class ChatModule {
  constructor(client) {
    this.client = client;
    this.chatbotUrl = config.chatbotUrl;
  }

  async sendMessage(message) {
    try {
      const { status, data } = await axios({
        url: this.chatbotUrl,
        method: 'POST',
        data: {
          inputs: [message.content.slice(`<@${this.client.user.id}>`.length),],
        },
        headers: {
          'Authorization': config.chatbotAuth,
        },
      })
      if (status !== 200) {
        console.error('Could not reach chatbot server');
        return false;
      }
      let sentence = data['response'];
      let cmdRE = new RegExp(/\$([a-z]+)/, 'gim');
      if (cmdRE.test(sentence)) {
        cmdRE = new RegExp(/\$([a-z]+)/, 'gim');
        let item = cmdRE.exec(sentence)[1];
        switch(item) {
          case 'time':
            sentence = this.getTime();
            break;
          case 'name':
            sentence = this.client.user.username;
            break;
          case 'news':

            break;
          case 'website':
            sentence = config.homeUrl || "*No website set for this bot.*"
            break;
        }
      } else {
        sentence = sentence.replace(/[<]?EOS[>]?/gim, '');
        sentence = sentence.replace(/\s(\.|\?|\!)/g, "$1").replace(/\s\\?(\'|\"|\`)\s?/g, "$1");
        sentence = sentence.replace('&gt;', '>').replace('&lt;', '<');
      }
      message.channel.send(utils.getRichEmbed(this.client, 0xffffff, this.client.user.username, sentence));
    } catch(e) {
      if (e.response) {
        console.error('Could not reach chatbot server', e.response.data);
      } else {
        console.error(e);
      }
      message.channel.send(utils.getRichEmbed(this.client, 0xff0000, this.client.user.username, "Something has happened whilst connecting to the server,\nplease contact the bot owner."));
    }
  }

  getTime() {
    let time = new Date();
    return `${time.toTimeString()}, ${time.toDateString()}`;
  }
}

module.exports = ChatModule;