'use strict';

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
    let response = args.locale['general']['8ball'].responses[Math.floor(Math.random() * args.locale['general']['8ball'].responses.length)];
    args.message.channel.send(
      utils.getRichEmbed(
        args.client,
        0x101010,
        args.locale['general']['8ball'].title,
        response
      )
    );

    return response;
  }
}