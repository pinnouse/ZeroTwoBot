'use strict';

const { RichEmbed } = require('discord.js');

const config = require('../../config.json');

const fs = require('fs');
const { promisify } = require('util');

const utils = require('../../framework/utils');

module.exports = {
  name: 'prefix',
  category: 'general',
  aliases: ['prefix'],
  optArgs: ['new prefix'],
  reqArgs: [],
  permissions: ['MANAGE_GUILD'],
  description: 'Gets the current server\'s prefix or sets to a new preferred prefix',
  executeCommand: async (args) => {
    let prefixLocale = args.locale.general.prefix;
    if (args.args.length > 0) {
      let newPrefix = args.args[0];
      if (newPrefix.length > 3) {
        await args.message.channel.send(utils.getRichEmbed(args.client, 0xff0000, prefixLocale.tooLongError.title, prefixLocale.tooLongError.content));
        return false;
      } else {
        let comparePrefix = (args.customPrefixes.has(args.message.guild.id)) ? args.customPrefixes.get(args.message.guild.id) : config.prefix;
        if (newPrefix === comparePrefix) {
          await args.message.channel.send(
            utils.getRichEmbed(args.client, 0xff0000, prefixLocale.alreadySetError.title, utils.replace(prefixLocale.alreadySetError.content, comparePrefix))
          );
          return false;
        }

        if (newPrefix === config.prefix) args.customPrefixes.delete(args.message.guild.id);
        else args.customPrefixes.set(args.message.guild.id, newPrefix);

        let writeFile = promisify(fs.writeFile);
        await writeFile('./prefixPrefs.json', utils.mapToJSON(args.customPrefixes), 'utf-8');

        await args.message.channel.send(utils.getRichEmbed(args.client, 0x4286f4, prefixLocale.successSet.title, utils.replace(prefixLocale.successSet.content, newPrefix)));
        return true;
      }
    } else {
      let prefix =  (args.customPrefixes.has(args.message.guild.id)) ? args.customPrefixes.get(args.message.guild.id) : config.prefix;
      await args.message.channel.send(utils.getRichEmbed(args.client, 0x4286f4, prefixLocale.success.title, utils.replace(prefixLocale.success.content, prefix)));
      return true;
    }
  }
}