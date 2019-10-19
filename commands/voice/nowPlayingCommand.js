'use strict';

const utils = require('../../framework/utils');

module.exports = {
  name: 'now playing',
  category: 'voice',
  aliases: ['np', 'nowplaying', 'q', 'queue'],
  optArgs: [],
  reqArgs: [],
  permissions: [],
  description: (locale) => { return locale['voice']['nowplaying']; },
  executeCommand: async (args) => {
    let locale = args.locale['voice']['nowplaying'];
    let pl = utils.getPlaylist(args.playlists, args.message.guild.id);
    if (pl.songs.length > 0) {
      let songList = "";
      if (pl.songs.length == 1)
        songList = locale.noSongs;
      else {
        pl.songs.slice(1).forEach((song, index) => {
          songList += `  **${index+1}.**  - \`${song.duration}\` ${song.title}\n`;
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

    return 'Returned now playing';
  }
}