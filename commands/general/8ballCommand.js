'use strict';

const config = require('../../config.json');

const utils = require('../../framework/utils');

module.exports = {
  name: '8ball',
  category: 'general',
  aliases: ['8ball', '8b'],
  optArgs: [],
  reqArgs: ['question'],
  permissions: [],
  unlimitedArgs: true,
  description: (locale) => { return locale['general']['8ball']; },
  executeCommand: async (args) => {
    let locale = args.locale['general']['8ball'];
    
    let response = locale.responses[Math.floor(Math.random() * locale.responses.length)];
    args.message.channel.send(
      utils.getRichEmbed(
        args.client,
        0x101010,
        locale.title,
        response
      )
    );

    return response;
  }
}