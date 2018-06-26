'use strict';

const { RichEmbed } = require('discord.js');

const utils = require('../../framework/utils');

module.exports = {
  name: 'leave',
  category: 'voice',
  aliases: ['leave', 'l'],
  optArgs: [],
  reqArgs: [],
  permissions: [],
  description: 'Leaves the voice channel you are connected to',
  executeCommand: async (args) => {
    let leaveLocale = args.locale.voice.leave;
    
    if (args.message.author.client.channels.size > 0) {
      let leftChannel = false;

      //Find author's voice channel
      let channels = args.message.author.client.channels.filter(channel => { return channel.type === 'voice' });
      
      await channels.forEach(async (channel) => {
        if (channel.members.has(args.message.author.id)) {
          channel.leave();
          await args.message.channel.send(utils.getRichEmbed(args.client, 0x0affda, leaveLocale.success.title, utils.replace(leaveLocale.noChannel.content, channel.name)));
          leftChannel = true;
        }
      });

      //If gotten here, the channel hasn't been left
      if (!leftChannel)
        await args.message.channel.send(utils.getRichEmbed(args.client, 0x0affda, leaveLocale.noChannel.title, leaveLocale.noChannel.content));

      return leftChannel;
    } else {
      await args.message.channel.send(utils.getRichEmbed(args.client, 0xff0000, leaveLocale.noChannel.title, leaveLocale.noChannel.content));

     return false;
    }
  }
}