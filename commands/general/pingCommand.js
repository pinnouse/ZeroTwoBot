'use strict';

const utils = require('../../framework/utils');

module.exports = {
  name: 'ping',
  category: 'general',
  aliases: ['ping'],
  optArgs: [],
  reqArgs: [],
  permissions: [],
  description: (locale) => { return locale['general']['ping']; },
  executeCommand: async (args) => {
    let pingLocale = args.locale['general']['ping'];
    var message = await args.message.channel.send(utils.getRichEmbed(args.client, 0xffffff, pingLocale.title, pingLocale.ping));

    await message.edit(
      utils.getRichEmbed(
        args.client,
        0xffffff,
        pingLocale.title,
        utils.replace(
          pingLocale.pong,
          message.createdTimestamp - args.message.createdTimestamp,
          args.client.ws.ping
        )
      )
    );

    return true;
  }
}