'use strict';

const { RichEmbed } = require('discord.js');

const utils = require('../../framework/utils');

module.exports = {
  name: 'join',
  category: 'voice',
  aliases: ['join', 'j'],
  optArgs: [],
  reqArgs: [],
  permissions: [],
  description: 'Joins the voice channel you are connected to if able to',
  executeCommand: async (args) => {
    let joinLocale = args.locale.voice.join;
    
    //Find author's voice channel
    if (args.message.author.client.channels.size > 0) {
      let joinedChannel = false;

      //Filter out only voice channels
      let channels = args.message.author.client.channels.filter((channel) => { return channel.type === 'voice' });
      
      await channels.forEach(async (channel) => {
        if (channel.members.has(args.message.author.id) && !joinedChannel) {
          await args.message.channel.send(
            utils.getRichEmbed(args.client, 0x0affda, joinLocale.connecting.title, utils.replace(joinLocale.connecting.content, channel.name))
          ).then(() => { //Message sent
            channel.join().then(() => {
              //Join channel
              //Set our return value to true
              joinedChannel = true;
            }, async (reason) => { //Catch couldn't join channel
              await args.message.channel.send(utils.getRichEmbed(args.client, 0xff0000, joinLocale.failed.title, utils.replace(joinLocale.failed.content, channel.name)));
              console.log("Error connecting to voice channel: " + reason);
              joinedChannel = true;
            });
          }, async (reason) => { //Catch couldn't send message
            await args.message.channel.send(utils.getRichEmbed(args.client, 0xff0000, joinLocale.failed.title, utils.replace(joinLocale.failed.content)));
            console.log("Error connecting to voice channel (sending message): " + reason);
            joinedChannel = true;
          });
        }
      });

      if (!joinedChannel)
        await args.message.channel.send(utils.getRichEmbed(args.client, 0xff0000, joinLocale.noChannel.title, joinLocale.noChannel.content));

      return joinedChannel;
    } else {
      await args.message.channel.send(utils.getRichEmbed(args.client, 0xff0000, joinLocale.noChannel.title, joinLocale.noChannel.content));

      return false;
    }
  }
}