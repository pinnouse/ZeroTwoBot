'use strict';

const config = require('../../config.json');

const utils = require('../../framework/utils');


module.exports = {
  name: 'reload',
  category: 'development',
  aliases: ['reload'],
  optArgs: [],
  reqArgs: [],
  permissions: [],
  showCommand: false,
  description: (locale) => { return locale['development']['reload']; },
  executeCommand: async (args) => {
    if (config.owners.includes(args.message.author.id)) {
      //Reload time
      try {
        args.commandParser.loadCommands();
        args.commandParser.loadLocales();
      } catch(e) {
        console.error(e);
        args.message.channel.send("Failed to reload, check logs.");
        return false;
      }

      args.message.channel.send(
        utils.getRichEmbed(
          args.client,
          0xffffff,
          args.locale['development']['reload'].title,
          args.locale['development']['reload'].content
        )
      );
      return true;
    } else {
      await args.message.channel.send(
        utils.getRichEmbed(args.client, 0xff0000, args.locale['development']['reload'].title, args.locale['devleopment']['reload']['errors'].owner));
      return false;
    }
  }
}