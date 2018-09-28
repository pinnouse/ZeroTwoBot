'use strict';

const utils = require('../../framework/utils');

module.exports = {
  name: 'skip',
  category: 'voice',
  aliases: ['sk', 'skip'],
  optArgs: [],
  reqArgs: [],
  unlimitedArgs: false,
  permissions: [],
  description: (locale) => { return locale['voice']['skip']; },
  executeCommand: async (args) => {
    if (!args.playlists.has(args.message.guild.id)) {
      args.playlists.set(args.message.guild.id, {
        player: {
          status: 'OFF',
          songs: [],
          selectList: []
        }
      });
    }

    let playlist = args.playlists.get(args.message.guild.id)['player'];
    args.audioController.skipSong(args.message.channel, playlist, args.locale);
  }
}