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
      
      this.dispatchers.get(textChannel.guild.id).once('end', (reason) => {
        if (reason !== 'leave') playlist.songs.splice(0, 1);
        if (playlist.songs.length > 0 && playlist.status !== 'OFF') {
          playlist.status = 'NEXT'
          this.playSong(playlist.songs[0], playlist, voiceConnection, textChannel, localeToUse);
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
      });

      this.dispatchers.get(textChannel.guild.id).once('error', (reason) => {
        if (reason !== 'leave') playlist.songs.splice(0, 1);
        if (playlist.songs.length > 0 && playlist.status !== 'OFF') {
          playlist.status = 'NEXT'
          this.playSong(playlist.songs[0], playlist, voiceConnection, textChannel, localeToUse);
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
          console.log('song end (error): ' + reason);
      });
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
}

module.exports = AudioController;