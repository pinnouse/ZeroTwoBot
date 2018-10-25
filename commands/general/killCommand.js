'use strict';

const config = require('../../config.json');

const utils = require('../../framework/utils');


module.exports = {
  name: 'kill',
  category: 'general',
  aliases: ['kill', 'k'],
  optArgs: [],
  reqArgs: [],
  permissions: [],
  showCommand: false,
  description: (locale) => { return locale['general']['kill']; },
  executeCommand: async (args) => {
    let killLocale = args.locale['general']['kill'];
    if (config.owners.includes(args.message.author.id)) {
      args.message.channel.send(utils.getRichEmbed(args.client, 0xff0000, killLocale.title, killLocale.content)).then(() => {
        destroyService(args.client);
      }, (reason) => {
        destroyService(args.client);
        console.log('could not send message: ' + reason);
      });
    } else {
      await args.message.channel.send(
        utils.getRichEmbed(args.client, 0xff0000, killLocale.title, killLocale['errors'].owner));
      return false;
    }

    async function destroyService(client) {
      client.destroy().then(() => {
        console.log("Kill command received shutting down...");
        process.exit(0);
      });
    }
  }
}