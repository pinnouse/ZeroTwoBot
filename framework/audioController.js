'use strict';

/**
 * Guild definition for handling audio playback
 * @typedef {Object} Guild
 * @property {import('discord.js').StreamDispatcher} dispatcher
 */

const ytdl = require('ytdl-core');

const utils = require('./utils');

var options = {
  filter: 'audioonly',
  quality: 251,
  highWaterMark: 1<<25
};

const { PLAYER_STATUS, LOOP_MODE } = require('./playerDefs');

/** AudioController class */
class AudioController {

  /**
   * Creates an Audio Controller and initializes map of guilds
   * @constructor
   * @param {import('discord.js').Client} client 
   */
  constructor(client) {
    /** @private */
    this.client = client;
    /**
     * @private
     * @type {Map<import('discord.js').Snowflake,Guild>}
     */
    this.guilds = new Map();
  }

  /**
   * Sets the stream dispatcher of the guild map
   * 
   * @param {Snowflake} guildId ID of the guild to set
   * @param {import('discord.js').StreamDispatcher} dispatcher Copy of the stream dispatcher
   */
  setGuild (guildId, dispatcher) {
    try {
      this.guilds.set(guildId, { dispatcher: dispatcher });
    } catch(e) {
      console.error(e);
    }
  }

  /**
   * Retrieves a guild with a dispatcher object attached if exists otherwise
   * will return false
   * 
   * @param {Snowflake} guildId ID of the guild
   * @returns {Guild|Boolean}
   */
  getGuild (guildId) {
    return (this.guilds.has(guildId) && this.guilds.get(guildId).dispatcher !== undefined) ? this.guilds.get(guildId) : false;
  }

  /**
   * Removes guild from the map
   * 
   * @param {import('discord.js').Snowflake} guildId The ID of the guild to remove
   */
  removeGuild (guildId) {
    this.guilds.has(guildId) && this.guilds.delete(guildId);
  }

  /**
   * Accepts a song parameter and plays it if valid voice connection
   * 
   * @param {import('./song')} song The song to play
   * @param {import('./playlist')} playlist List of songs to append to
   * @param {import('discord.js').VoiceConnection} voiceConnection Voice connection of the user
   * @param {import('discord.js').TextChannel} textChannel The Discord Text Channel to send messages to
   * @param {object} localeToUse Language locale to text to
   */
  playSong (song, playlist, voiceConnection, textChannel, localeToUse) {
    // console.log('playlist');
    // console.log(playlist);
    if (playlist.status === PLAYER_STATUS.OFF || playlist.status === PLAYER_STATUS.NEXT) {
      let stream = ytdl(song.getURL(), options);
      
      playlist.status = PLAYER_STATUS.STREAMING;
      let streamOptions = { seek: 0, volume: 1 };
      if (voiceConnection == null) {
        textChannel.send(
          utils.getRichEmbed(this.client, 0xffffff, localeToUse['audioController'].title, localeToUse['audioController']['errors'].noVC)
        )
        return;
      }
      this.setGuild(textChannel.guild.id, voiceConnection.playStream(stream, streamOptions));

      textChannel.send(
        utils.getRichEmbed(this.client, 0xffffff, localeToUse['audioController'].title,
          utils.replace(localeToUse['audioController'].nowPlaying,
            song.title, song.duration
          )
        )
      );

      var controller = this;

      this.getGuild(textChannel.guild.id).dispatcher.on('end', reason => { controller.endHandler(reason, playlist, voiceConnection, textChannel, localeToUse) });

      this.getGuild(textChannel.guild.id).dispatcher.on('error', reason => { controller.endHandler(reason, playlist, voiceConnection, textChannel, localeToUse) });
    } //end 'OFF' || 'NEXT'
    else if (playlist.status === PLAYER_STATUS.STREAMING) {
      textChannel.send(
        utils.getRichEmbed(this.client, 0xffdd22, localeToUse['audioController'].title,
          utils.replace(localeToUse['audioController'].addToQueue,
          song.title, song.duration
          )
        )
      );
    } //end 'STREAMING'
  }

  /**
   * Handler for ending songs; queueing the next, looping, leaving channel etc.
   * 
   * @param {string} reason Reason for ending a stream
   * @param {import('./playlist')} playlist List of songs to play
   * @param {import('discord.js').VoiceConnection} voiceConnection Discord Voice Connection handler
   * @param {import('discord.js').TextChannel} textChannel Discord Text Channel that initial messages were sent in
   * @param {object} localeToUse Language locale to use
   */
  endHandler (reason, playlist, voiceConnection, textChannel, localeToUse) {
    if (reason !== 'leave' && reason !== 'stop') {
      switch (playlist.loopMode) {
        case LOOP_MODE.LIST:
          playlist.songs.push(playlist.songs.shift());
          break;
        case LOOP_MODE.SINGLE:
          //Do Nothing
          break;
        default:
          playlist.songs.splice(0, 1);
          break;
      }
    } else {
      playlist.songs = [];
    }

    if (playlist.songs.length > 0 && playlist.status !== PLAYER_STATUS.OFF) {
      playlist.status = PLAYER_STATUS.NEXT
      this.playSong(playlist.songs[0], playlist, voiceConnection, textChannel, localeToUse);
    } else {
      playlist.status = PLAYER_STATUS.OFF;
      playlist.songs = [];
      if (reason !== 'leave' && reason !== 'stop') {
        textChannel.send(
          utils.getRichEmbed(this.client, 0xffffff, localeToUse['audioController'].title,
            localeToUse['audioController'].doneStream
          )
        );
        voiceConnection.channel.leave();
        this.setGuild()
      }
    }

    if (this.client.devMode) console.log('song end: ' + reason);
  }

  /**
   * Handler for skipping to the next song in queue or requests end playback
   * 
   * @param {import('discord').TextChannel} textChannel Discord Text Channel messages were sent in initially
   * @param {import('./playerDefs')} playlist Playlist of songs to play (to use when skipping)
   * @param {object} localeToUse Language locale to read text from
   */
  skipSong (textChannel, playlist, localeToUse) {
    if (playlist.status === PLAYER_STATUS.OFF) {
      textChannel.send(
        utils.getRichEmbed(this.client, 0xdfbb84, localeToUse['audioController'].title,
          localeToUse['audioController']['errors'].noSong
        )
      );
    } else {
      textChannel.send(
        utils.getRichEmbed(this.client, 0xdfbb84, localeToUse['audioController'].title,
          utils.replace(localeToUse['audioController'].skip,
          playlist.songs[0].title
          )
        )
      );
      this.getGuild(textChannel.guild.id).dispatcher.end('skip');
    }
  }

  /**
   * Emits end event to the dispatcher
   * 
   * @param {import('discord.js').Snowflake} guildId ID of the guild connected to that should be destroyed
   */
  endPlayback (guildId) {
    this.getGuild(guildId) && !this.getGuild(guildId).dispatcher.destroyed && this.getGuild(guildId).dispatcher.end('leave');
  }
}

module.exports = AudioController;