'use strict';

const request = require('request-promise-native');

const config = require('../config.json');

const utils = require('./utils');

class ChatModule {
  constructor(client) {
    this.client = client;
    this.chatbotUrl = config.chatbotUrl;
  }

  sendMessage(message) {
    let options = {
      uri: this.chatbotUrl,
      qs: {
        s: message.content.slice(`<@${this.client.user.id}>`.length)
      },
      headers: {
        'User-Agent': 'Request'
      },
      json: true
    };
    request(options)
    .then(success => {
      // console.log(success);
      let sentence = success['out_sentence'];
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
        }
      } else {
        sentence = sentence.replace(/[<]?EOS[>]?/gim, '');
        sentence = sentence.replace(/\s(\.|\?|\!)/g, "$1").replace(/\s\\?(\'|\"|\`)\s?/g, "$1");
        sentence = sentence.replace('&gt;', '>').replace('&lt;', '<');
      }
      message.channel.send(utils.getRichEmbed(this.client, 0xffffff, this.client.user.username, sentence));
    }).catch(reason => {
      console.log(reason);
      message.channel.send(utils.getRichEmbed(this.client, 0xff0000, this.client.user.username, "Something has happened whilst connecting to the server"));
    });
  }

  getTime() {
    let time = new Date();
    return `${time.toTimeString()}, ${time.toDateString()}`;
  }
}

module.exports = ChatModule;