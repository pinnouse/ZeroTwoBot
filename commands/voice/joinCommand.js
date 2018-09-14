'use strict';

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

      return new Promise((resolve, reject) => {
        new Promise((res, rej) => {
          Array.from(channels.values()).forEach((channel, ind) => {
            if (channel.members.has(args.message.author.id) && !joinedChannel) {
              joinedChannel = true;
              args.message.channel.send(
                utils.getRichEmbed(args.client, 0x0affda, joinLocale.connecting.title, utils.replace(joinLocale.connecting.content, channel.name))
              ).then(() => { //Message sent
                channel.join().then(() => {
                  //Join channel
                  //Set our return value to true
                  res(`Successfully connected to voice channel: ${channel.name} (id: ${channel.id})`);
                }).catch((reason) => { //Catch couldn't join channel
                  args.message.channel.send(utils.getRichEmbed(args.client, 0xff0000, joinLocale.failed.title, utils.replace(joinLocale.failed.content, channel.name)));
                  console.log("Error connecting to voice channel: " + reason);
                  res(`Error connecting to voice channel: ${reason}`);
                });
              }).catch((reason) => { //Catch couldn't send message
                args.message.channel.send(utils.getRichEmbed(args.client, 0xff0000, joinLocale.failed.title, utils.replace(joinLocale.failed.content)));
                console.log("Error connecting to voice channel (sending message): " + reason);
                res(`Error connecting to voice channel (sending message): ${reason}`);
              });
            }

            if (ind == channels.size - 1 && !joinedChannel) res(false);
          });
        }).then((result) => {

          if (result === false) {
            args.message.channel
            .send(utils.getRichEmbed(args.client, 0xff0000, joinLocale.noChannel.title, joinLocale.noChannel.content))
            .then(() => { resolve(result); });
          }
          
          resolve(result);
        });
      });
      
    } else {
      return new Promise((resolve, reject) => {
        args.message.channel.send(utils.getRichEmbed(args.client, 0xff0000, joinLocale.noChannel.title, joinLocale.noChannel.content)).then(() => { resolve(false) });
      });
    }
  }
}