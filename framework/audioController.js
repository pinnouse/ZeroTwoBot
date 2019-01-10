'use strict';

const ytdl = require('ytdl-core');

const config = require('../config.json');

const utils = require('./utils');

const urlPrefices = {
  'youtube': 'https://youtube.com/watch?v={URL}'
};

var options = {
  filter: 'audioonly',
  quaity: 251
};

class AudioController {
  constructor(client) {
    this.client = client;
    this.dispatchers = new Map();
  }

  playSong (song, playlist, voiceConnection, textChannel, localeToUse) {
    // console.log('playlist');
    // console.log(playlist);
    if (playlist.status === 'OFF' || playlist.status === 'NEXT') {
      let stream = ytdl(urlPrefices[song.source].replace('{URL}', song.id), options);
      
      playlist.status = 'STREAMING';
      let streamOptions = { seek: 0, volume: 1 };
      this.dispatchers.set(textChannel.guild.id, voiceConnection.playStream(stream, streamOptions));

      textChannel.send(
        utils.getRichEmbed(this.client, 0xffffff, localeToUse['audioController'].title,
          utils.replace(localeToUse['audioController'].nowPlaying,
            song.title, song.duration
          )
        )
      );

      var controller = this;
      
      this.dispatchers.get(textChannel.guild.id).on('end', reason => { controller.endHandler(reason, playlist, voiceConnection, textChannel, localeToUse, controller) });

      this.dispatchers.get(textChannel.guild.id).on('error', reason => { controller.endHandler(reason, playlist, voiceConnection, textChannel, localeToUse, controller) });
    } //end 'OFF' || 'NEXT'
    else if (playlist.status === 'STREAMING') {
      textChannel.send(
        utils.getRichEmbed(this.client, 0xffdd22, localeToUse['audioController'].title,
          utils.replace(localeToUse['audioController'].addToQueue,
          song.title, song.duration
          )
        )
      );
    } //end 'STREAMING'
  }

  endHandler (reason, playlist, voiceConnection, textChannel, localeToUse, controller) {
    if (reason !== 'leave') {
      switch (playlist.loopMode) {
        case 'LIST':
          playlist.songs.push(playlist.songs.shift());
          break;
        case 'SINGLE':
          //Do Nothing
          break;
        default:
          playlist.songs.splice(0, 1);
          break;
      }
    }

    if (playlist.songs.length > 0 && playlist.status !== 'OFF') {
      playlist.status = 'NEXT'
      controller.playSong(playlist.songs[0], playlist, voiceConnection, textChannel, localeToUse);
    } else {
      playlist.status = 'OFF';
      if (reason !== 'leave') {
        textChannel.send(
          utils.getRichEmbed(this.client, 0xffffff, localeToUse['audioController'].title,
            localeToUse['audioController'].doneStream
          )
        );
      }
    }

    if (config.debugmode)
      console.log('song end: ' + reason);
  }

  skipSong (textChannel, playlist, localeToUse) {
    if (playlist.status === 'OFF') {
      textChannel.send(
        utils.getRichEmbed(this.client, 0xdfbb84, localeToUse['audioController'].title,
          localeToUse['audioController'].skip.noSong
        )
      );
    } else {
      textChannel.send(
        utils.getRichEmbed(this.client, 0xdfbb84, localeToUse['audioController'].title,
          utils.replace(localeToUse['audioController'].skip.success,
          playlist.songs[0].title
          )
        )
      );
      this.dispatchers.get(textChannel.guild.id).end('skip');
    }
  }

  endPlayback (guildId) {
    this.dispatchers.get(guildId).end('leave');
  }
}

module.exports = AudioController;