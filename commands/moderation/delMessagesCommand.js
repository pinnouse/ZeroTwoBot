'use strict';

const utils = require('../../framework/utils');

module.exports = {
  name: 'delete',
  category: 'moderation',
  aliases: ['del', 'delete', 'deletemessages', 'purge'],
  optArgs: ['number of messages'],
  reqArgs: [],
  unlimitedArgs: false,
  permissions: ['MANAGE_MESSAGES'],
  description: (locale) => { return locale['moderation']['delete']; },
  executeCommand: async (args) => {
    let locale = args.locale['moderation']['delete'];
    if (!args.message.guild.members.get(args.client.user.id).hasPermission('MANAGE_MESSAGES')) {
      args.message.channel.send(
        utils.getRichEmbed(
          args.client,
          0xff0000,
          locale.title,
          locale['errors'].noPermission
        )
      );
      return 'Failed to delete (missing permissions)';
    }

    if (!utils.isInt(args.args[0])) {
      args.message.channel.send(
        utils.getRichEmbed(
          args.client,
          0xff0000,
          locale.title,
          locale['errors'].NaN
        )
      );
      return 'Failed to delete (amount specified is not a number)';
    }

    if (args.args[0] <= 1 || args.args[0] >= 100) {
      args.message.channel.send(
        utils.getRichEmbed(
          args.client,
          0xff0000,
          locale.title,
          locale['errors'].amount
        )
      );
      return 'Failed to delete (amount specified not (1-100)';
    }

    let channel = args.message.channel;
    args.message.delete();
    channel.bulkDelete(Number(args.args[0]) | 2);

    channel.send(
      utils.getRichEmbed(
        args.client,
        0x682828,
        locale.title,
        utils.replace(
          locale.success,
          `\`${args.args[0]}\``
        )
      )
    ).then(message => {
      message.delete(5000).catch(reason => {
        //Error deleting self message ignored
      });
    });
    return `success (cleared ${args.args[0]} messages)`;
  }
}