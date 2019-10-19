'use strict';

const utils = require('../../framework/utils');

const { LOOP_MODE } = require('../../framework/playerDefs');

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
    let pl = utils.getPlaylist(args.playlists, args.message.guild.id);
    if (args.args.length > 0) {
      var loopStr = "` " + Object.keys(LOOP_MODE).join(" `, ` ") + " `";

      if (args.args[0] != parseInt(args.args[0])) {
        if (Object.keys(LOOP_MODE).indexOf(args.args[0].toUpperCase()) >= 0) {
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
        if (parseInt(args.args[0]) >= 0 && parseInt(args.args[0]) < Object.keys(LOOP_MODE).length) {
          pl.loopMode = parseInt(args.args[0])
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
    }

    args.message.channel.send(
      utils.getRichEmbed(
        args.client,
        0xffcd2b,
        locale.title,
        utils.replace(
          locale.set,
          Object.keys(LOOP_MODE)[pl.loopMode]
        )
      )
    );

    return true;
  }
}