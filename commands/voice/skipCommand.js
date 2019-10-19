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
    let pl = utils.getPlaylist(args.playlists, args.message.guild.id);
    args.audioController.skipSong(args.message.channel, pl, args.locale);
    return 'song skip';
  }
}