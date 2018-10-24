'use strict';

const utils = require('../../framework/utils');

module.exports = {
  name: 'join',
  category: 'voice',
  aliases: ['join', 'j'],
  optArgs: [],
  reqArgs: [],
  permissions: [],
  description: (locale) => { return locale['voice']['join']; },
  executeCommand: async (args) => {
    let joinLocale = args.locale['voice']['join'];

    //Find author's voice channel
    let channel = args.message.member.voiceChannel;

    if (channel) {
      await args.message.channel.send(utils.getRichEmbed(args.client, 0x0affda, joinLocale.title, utils.replace(joinLocale.content, channel.name)));
      try {
        await channel.join();
      } catch (reason) {
        args.message.channel.send(utils.getRichEmbed(args.client, 0xff0000, joinLocale.title, utils.replace(joinLocale['errors']['failed'], channel.name)));
        return (`Error connecting to voice channel: ${reason}`);
      }

      return `Successfully connected to voice channel: ${channel.name} (id: ${channel.id})`;
    } else {
      await args.message.channel.send(utils.getRichEmbed(args.client, 0xff0000, joinLocale.title, joinLocale['errors'].noChannel));
      return 'no channel';

    }
  }
}