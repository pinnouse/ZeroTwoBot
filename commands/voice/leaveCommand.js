'use strict';

const utils = require('../../framework/utils');

const { LOOP_MODE } = require('../../framework/playerDefs');

module.exports = {
  name: 'leave',
  category: 'voice',
  aliases: ['stop', 'st', 'leave', 'l'],
  optArgs: [],
  reqArgs: [],
  permissions: [],
  description: (locale) => { return locale['voice']['leave']; },
  executeCommand: async (args) => {
    let leaveLocale = args.locale['voice']['leave'];
    let pl = utils.getPlaylist(args.playlists, args.message.guild.id);
    
    pl.status = LOOP_MODE.OFF;
    pl.songs = [];
    args.audioController.endPlayback(args.message.guild.id);
    
    if (args.message.author.client.channels.cache.filter(ch => { return ch.type === 'voice'; }).size > 0) {
      let leftChannel = false;

      //Find author's voice channel
      let channels = args.message.author.client.channels.cache.filter(channel => { return channel.type === 'voice' });
      
      await channels.forEach(async (channel) => {
        if (channel.members.has(args.message.author.id)) {
          channel.leave();
          args.message.channel.send(utils.getRichEmbed(args.client, 0x0affda, leaveLocale.title, utils.replace(leaveLocale.content, channel.name)));
          leftChannel = true;
        }
      });

      //If gotten here, the channel hasn't been left
      if (!leftChannel)
        await args.message.channel.send(utils.getRichEmbed(args.client, 0xff0000, leaveLocale.title, leaveLocale['errors'].noChannel));

      return leftChannel;
    } else {
      await args.message.channel.send(utils.getRichEmbed(args.client, 0xff0000, leaveLocale.title, leaveLocale['errors'].noChannel));

     return false;
    }
  }
}