'use strict';

const config = require('../../config.json');
//const locales = require('../../locales');

const { RichEmbed } = require('discord.js');

const utils = require('../../framework/utils');


module.exports = {
  name: 'kill',
  category: 'general',
  aliases: ['kill', 'k'],
  optArgs: [],
  reqArgs: [],
  permissions: [],
  description: 'Terminates the bot instance (owner of bot only)',
  executeCommand: async (args) => {
    let killLocale = args.locale.general.kill;
    if (config.owners.includes(args.message.author.id)) {
      args.message.channel.send(utils.getRichEmbed(args.client, 0xff0000, killLocale.success.title, killLocale.success.content)).then(() => {
        destroyService(args.client);
      }, (reason) => {
        destroyService(args.client);
        console.log('could not send message: ' + reason);
      });
    } else {
      await args.message.channel.send(
        utils.getRichEmbed(args.client, 0xff0000, killLocale.ownerError.title, killLocale.ownerError.content));
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