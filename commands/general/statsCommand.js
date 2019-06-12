'use strict';

const utils = require('../../framework/utils');

module.exports = {
  name: 'stats',
  category: 'general',
  aliases: ['stats'],
  optArgs: [],
  reqArgs: [],
  permissions: [],
  unlimitedArgs: false,
  description: (locale) => { return locale['general']['stats']; },
  executeCommand: async (args) => {
    args.message.channel.send(
      utils.getRichEmbed(
        args.client,
        0x303030,
        args.locale['general']['stats'].title
      )
    );

    return true;
  }
}