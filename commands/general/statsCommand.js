'use strict';

const utils = require('../../framework/utils');

const config = require('../../config.json');

const prettyms = require('pretty-ms');

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
    let headers = args.locale['general']['stats']['headers'];
    args.message.channel.send(
      utils.getRichEmbed(
        args.client,
        0x303030,
        args.locale['general']['stats'].title
      )
      .addField(headers.botHash, args.client.user.tag, true)
      .addField(headers.voiceConnections, args.client.voiceConnections.size, true)
      .addField(headers.guildsUsers, `${args.client.guilds.size} : ${(()=>{let count = 0; args.client.guilds.forEach(guild => count += guild.memberCount); return count;})()}`, true)
      .addField(headers.uptime, prettyms(args.client.uptime), true)
      .addField(headers.locale, config.defaultLang, true)
      .addField(headers.prefix, config.prefix, true)
    );

    return true;
  }
}