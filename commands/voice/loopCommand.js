'use strict';

const utils = require('../../framework/utils');

module.exports = {
  name: 'loop',
  category: 'voice',
  aliases: ['loop'],
  optArgs: ['NONE|SINGLE|LIST'],
  reqArgs: [],
  permissions: [],
  description: (locale) => { return locale['voice']['loop']; },
  executeCommand: async (args) => {
    let locale = args.locale['voice']['loop'];
    if (!args.playlists.has(args.message.guild.id)) {
      args.playlists.set(args.message.guild.id, {
        player: {
          loopMode: 'NONE',
          status: 'OFF',
          songs: [],
          selectList: [],
        }
      });
    }

    let pl = args.playlists.get(args.message.guild.id)['player']; //Current playlist
    if (args.args.length === 0) {
      args.message.channel.send(
        utils.getRichEmbed(
          args.client,
          0xffcd2b,
          locale.title,
          utils.replace(
            locale.set,
            pl.loopMode
          )
        )
      );
      return true;
    } else {
      var loopModes = ['NONE', 'SINGLE', 'LIST'];
      var loopStr = "` " + loopModes.join(" `, ` ") + " `";

      if (args.args[0] != parseInt(args.args[0])) {
        if (loopModes.indexOf(args.args[0].toUpperCase()) >= 0) {
          pl.loopMode = args.args[0].toUpperCase();
        } else {
          await args.message.channel.send(
            utils.getRichEmbed(
              args.client,
              0xff0000,
              locale.title,
              utils.replace(
                locale['errors'].notValid,
                loopStr
              )
            )
          );
          return 'false (not a loop mode - str)';
        }
      } else {
        if (loopModes[parseInt(args.args[0])]) {
          pl.loopMode = loopModes[args.args[0]];
        } else {
          await args.message.channel.send(
            utils.getRichEmbed(
              args.client,
              0xff0000,
              locale.title,
              utils.replace(
                locale['errors'].notValid,
                loopStr
              )
            )
          );
          return 'false (not a loop mode - int)';
        }
      }

      args.message.channel.send(
        utils.getRichEmbed(
          args.client,
          0xffcd2b,
          locale.title,
          utils.replace(
            locale.set,
            pl.loopMode
          )
        )
      );

      return true;
    }
  }
}