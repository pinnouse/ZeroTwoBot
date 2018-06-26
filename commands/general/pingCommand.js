'use strict';

const utils = require('../../framework/utils');

module.exports = {
  name: 'ping',
  category: 'general',
  aliases: ['ping'],
  optArgs: [],
  reqArgs: [],
  permissions: [],
  description: 'Returns the bot\'s latency (ping)',
  executeCommand: async (args) => {
    let pingLocale = args.locale.general.ping;
    console.log(new Date());
    var message = await args.message.channel.send(utils.getRichEmbed(args.client, 0xffffff, pingLocale.ping.title, pingLocale.ping.content));

    await message.edit(utils.getRichEmbed(args.client, 0xffffff, pingLocale.pong.title, utils.replace(pingLocale.pong.content, message.createdTimestamp - args.message.createdTimestamp, args.client.ping)));
    return true;
  }
}