'use strict';

const utils = require('../../framework/utils');

const { Role } = require('discord.js');

module.exports = {
  name: 'kick',
  category: 'moderation',
  aliases: ['kick'],
  reqArgs: ['user to kick'],
  optArgs: ['reason'],
  permissions: ['KICK_MEMBERS'],
  description: (locale) => { return locale['moderation']['kick']; },
  executeCommand: async (args) => {
    let locale = args.locale['moderation']['kick'];
    if (!args.message.guild.me.hasPermission('KICK_MEMBERS')) {

      return 'Failed to kick (missing permissions)';
    }

    let userMention = args.args.shift().replace(/[\\<>@#&!]/g, "");
    let userToKick;
    try {
      userToKick = await args.message.channel.guild.fetchMember(userMention);
    } catch(e) {
      args.message.channel.send(
        utils.getRichEmbed(
          args.client,
          0xff0000,
          locale.title,
          locale['errors'].noMember
        )
      );
      return 'Failed to kick (no member found)';
    }

    let messageAuthor = await args.message.channel.guild.fetchMember(args.message);
    if (args.message.channel.guild.ownerID !== messageAuthor.id && (!userToKick.kickable || Role.comparePositions(messageAuthor.highestRole, userToKick.highestRole) <= 0)) {
      args.message.channel.send(
        utils.getRichEmbed(
          args.client,
          0xff0000,
          locale.title,
          locale['errors'].notKickable
        )
      );
      return 'Failed to kick (not kickable)';
    }

    let kickReason = args.args.join(" ");
    if (kickReason.length <= 0) {
      kickReason = "No reason specified";
    }

    try {
      await userToKick.kick();
    } catch(e) {
      args.message.channel.send(
        utils.getRichEmbed(
          args.client,
          0xff0000,
          locale.title,
          locale['errors'].failed
        )
      );
      return `Failed to kick: ${e}`;
    }

    args.message.channel.send(
      utils.getRichEmbed(
        args.client,
        0xfefefe,
        locale.title,
        utils.replace(
          locale.success,
          args.message.author,
          (userToKick.nickname) ? `${userToKick.nickname} (${userToKick.user.tag})` : userToKick.user.tag,
          kickReason
        )
      )
    );
    return `Successfully kicked ${userToKick.displayName}`;
  }
}