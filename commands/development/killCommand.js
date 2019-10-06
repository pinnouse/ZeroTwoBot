'use strict';

const config = require('../../config.json');

const utils = require('../../framework/utils');


module.exports = {
  name: 'kill',
  category: 'development',
  aliases: ['kill'],
  optArgs: [],
  reqArgs: [],
  permissions: [],
  showCommand: false,
  description: (locale) => { return locale['development']['kill']; },
  executeCommand: async (args) => {
    if (config.owners.includes(args.message.author.id)) {
      try {
        await args.message.channel.send(
          utils.getRichEmbed(
            args.client,
            0xff0000,
            args.locale['development']['kill'].title,
            args.locale['development']['kill'].content
          )
        );
      } catch(e) {
        console.error(e);
      }
      destroyService(args.client);
      return true;
    }
    
    async function destroyService(client) {
      try {
        await client.destroy();
      } catch(e) {
        // FIll in catch
      }
      console.log("Kill command received shutting down...");
      process.exit(0);
    }

    await args.message.channel.send(
      utils.getRichEmbed(
        args.client,
        0xff0000,
        args.locale['development']['kill'].title,
        args.locale['development']['kill']['errors'].owner
      )
    );
    return false;
  }
}