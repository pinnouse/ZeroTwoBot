'use strict';

const utils = require('../../framework/utils');

module.exports = {
  name: 'playlist',
  category: 'voice',
  aliases: ['pl', 'playlist', 'queue'],
  optArgs: [],
  reqArgs: [],
  permissions: [],
  description: (locale) => { return locale['voice']['playlist']; },
  executeCommand: async (args) => {
    let locale = args.locale['voice']['playlist'];
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
    if (pl.songs.length > 0) {
      let songList = "";
      if (pl.songs.length == 1)
        songList = locale.noSongs;
      else {
        pl.songs.slice(1).forEach((song, index) => {
          songList += `  **${index+1}.**  -  \` ${song.duration} \`  ${song.title}\n`;
        });
      }

      args.message.channel.send(
        utils.getRichEmbed(
          args.client,
          0xffcd2b,
          locale.title,
          utils.replace(
            locale.content,
            pl.songs[0].title,
            pl.songs[0].duration,
            pl.loopMode,
            songList
          )
        )
      );
    } else {
      args.message.channel.send(
        utils.getRichEmbed(
          args.client,
          0xffcd2b,
          locale.title,
          locale.noPlaying
        )
      );
    }

    return 'Returned playlist';
  }
}