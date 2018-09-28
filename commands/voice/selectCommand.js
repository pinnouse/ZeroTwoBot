'use strict';

const utils = require('../../framework/utils');

module.exports = {
  name: 'select',
  category: 'voice',
  aliases: ['s', 'sel', 'select'],
  optArgs: [],
  reqArgs: ['selection of song'],
  unlimitedArgs: false,
  permissions: [],
  description: (locale) => { return locale['voice']['select']; },
  executeCommand: async (args) => {
    let selLocale = args.locale.voice.select;
    if (!args.playlists.has(args.message.guild.id)) {
      args.playlists.set(args.message.guild.id, {
        player: {
          status: 'OFF',
          songs: [],
          selectList: []
        }
      });
    }

    let pl = args.playlists.get(args.message.guild.id)['player'];

    if (pl.selectList.length > 0) {
      let selection = args.args[0];
      if (selection >= 1 && selection <= pl.selectList.length) {
        let song = pl.selectList[selection-1];
        pl.songs.push(song);
        pl.selectList = [];
        args.audioController.playSong(
          song,
          pl,
          utils.getVoiceChannel(args.client, args.message.author.id).connection,
          args.message.channel,
          args.locale
        );
        return 'Played song';
      } else {
        await args.message.channel.send(
          utils.getRichEmbed(args.client, 0xff0000, selLocale.title, 
            utils.replace(selLocale.errors.notIndex,
              (pl.selectList.length === 1) ? '<1>' : `<1-${pl.selectList.length}`
            )
          )
        );
        return false;
      }
    }
  }
}