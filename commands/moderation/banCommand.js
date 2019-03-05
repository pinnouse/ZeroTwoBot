'use strict';

const utils = require('../../framework/utils');

const { Role } = require('discord.js');

module.exports = {
  name: 'ban',
  category: 'moderation',
  aliases: ['ban'],
  reqArgs: ['user to ban'],
  optArgs: ['reason'],
  permissions: ['BAN_MEMBERS'],
  description: (locale) => { return locale['moderation']['ban']; },
  executeCommand: async (args) => {
    let locale = args.locale['moderation']['ban'];

    if (!args.message.guild.me.hasPermission('BAN_MEMBERS')) {
      args.message.channel.send(
        utils.getRichEmbed(
          args.client,
          0xff0000,
          locale.title,
          locale['errors'].noPermission
        )
      );
      return 'Failed to ban (missing permissions)';
    }

    let userMention = args.args.shift().replace(/[\\<>@#&!]/g, "");
    let userToBan;
    try {
      userToBan = await args.message.channel.guild.fetchMember(userMention);
      if (!userToBan) throw new Error("No user found");
    } catch(e) {
      args.message.channel.send(
        utils.getRichEmbed(
          args.client,
          0xff0000,
          locale.title,
          locale['errors'].noMember
        )
      );
      return 'Failed to ban (no member found)';
    }

    let messageAuthor = await args.message.channel.guild.fetchMember(args.message);
    if (args.message.channel.guild.ownerID !== messageAuthor.id && (!userToBan.bannable || Role.comparePositions(messageAuthor.highestRole, userToBan.highestRole) <= 0)) {
      args.message.channel.send(
        utils.getRichEmbed(
          args.client,
          0xff0000,
          locale.title,
          locale['errors'].notBannable
        )
      );
      return 'Failed to ban (not bannable)';
    }

    let kickReason = args.args.join(" ");
    if (kickReason.length <= 0) {
      kickReason = "No reason specified";
    }

    try {
      await userToBan.ban(kickReason);
    } catch(e) {
      args.message.channel.send(
        utils.getRichEmbed(
          args.client,
          0xff0000,
          locale.title,
          locale['errors'].failed
        )
      );
      return `Failed to ban: ${e}`;
    }

    args.message.channel.send(
      utils.getRichEmbed(
        args.client,
        0xfefefe,
        locale.title,
        utils.replace(
          locale.success,
          args.message.author,
          (userToBan.nickname) ? `${userToBan.nickname} (${userToBan.user.tag})` : userToBan.user.tag,
          kickReason
        )
      )
    );

    return 'Success';
  }
}