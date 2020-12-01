'use strict';

/**
 * Guild definition for handling audio playback
 * @typedef {Object} Guild
 * @property {import('discord.js').StreamDispatcher} dispatcher
 * @property {Boolean} toMsg
 */

const ytdl = require('ytdl-core');

const utils = require('./utils');

const options = {
  filter: 'audioonly',
  quality: 'highestaudio'
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
   * @param {import('discord.js').StreamDispatcher} guild Copy of the stream dispatcher
   */
  setGuild (guildId, guild) {
    try {
      this.guilds.set(guildId, guild);
    } catch(e) {
      console.error(e);
    }
  }

  /**
   * Retrieves a guild with a dispatcher object attached if exists otherwise
   * will return false
   * 
   * @param {import('discord.js').Snowflake} guildId ID of the guild
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
   * Stops/allows messages to be sent upon song end for the given guild.
   * 
   * @param {import('discord.js').Snowflake} guildId The ID of the guild to update.
   * @param {Boolean} toMsg Set to true to message when songs end and next plays.
   */
  setMessageOnEnd (guildId, toMsg) {
    if (this.getGuild(guildId)) {
      this.setGuild(guildId, {
        dispatcher: this.getGuild(guildId).dispatcher,
        toMsg: toMsg
      });
    }
  }

  /**
   * Returns whether or not to send a message after song end.
   * 
   * @param {import('discord.js').Snowflake} guildId The ID of the guild to check.
   * @returns {Boolean}
   */
  shouldMessage (guildId) {
    return this.getGuild(guildId) ? this.getGuild(guildId).toMsg : true;
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
  async playSong (song, playlist, voiceConnection, textChannel, localeToUse) {
    // console.log('playlist');
    // console.log(playlist);
    if (playlist.status === PLAYER_STATUS.OFF || playlist.status === PLAYER_STATUS.NEXT) {
      let stream = ytdl(song.getURL(), options);
      
      playlist.status = PLAYER_STATUS.STREAMING;
      const streamOptions = { seek: 0, volume: 1 };
      if (voiceConnection == null) {
        await textChannel.send(
          utils.getRichEmbed(this.client, 0xffffff, localeToUse['audioController'].title, localeToUse['audioController']['errors'].noVC)
        )
        return;
      }
      this.setGuild(textChannel.guild.id, {
        dispatcher: voiceConnection.play(stream, streamOptions),
        toMsg: this.shouldMessage(textChannel.guild.id)
      });

      this.shouldMessage(textChannel.guild.id) &&
      await textChannel.send(
        utils.getRichEmbed(this.client, 0xffffff, localeToUse['audioController'].title,
          utils.replace(localeToUse['audioController'].nowPlaying,
            song.title, song.duration
          )
        )
      );

      var controller = this;

      this.getGuild(textChannel.guild.id).dispatcher.on('speaking', value => { if (value === 1) return; controller.endHandler('end', playlist, voiceConnection, textChannel, localeToUse) });
      this.getGuild(textChannel.guild.id).dispatcher.on('close', () => { console.log('closed'); });

      this.getGuild(textChannel.guild.id).dispatcher.on('error', reason => { controller.endHandler(reason, playlist, voiceConnection, textChannel, localeToUse) });
    } //end 'OFF' || 'NEXT'
    else if (playlist.status === PLAYER_STATUS.STREAMING) {
      await textChannel.send(
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
  async endHandler (reason, playlist, voiceConnection, textChannel, localeToUse) {
    if (reason !== 'leave' && reason !== 'stop') {
      switch (Object.keys(LOOP_MODE)[playlist.loopMode]) {
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
    } else {
      playlist.songs = [];
    }

    if (playlist.songs.length > 0 && playlist.status !== PLAYER_STATUS.OFF) {
      playlist.status = PLAYER_STATUS.NEXT
      await this.playSong(playlist.songs[0], playlist, voiceConnection, textChannel, localeToUse);
    } else {
      playlist.status = PLAYER_STATUS.OFF;
      playlist.songs = [];
      if (reason !== 'leave' && reason !== 'stop') {
        await textChannel.send(
          utils.getRichEmbed(this.client, 0xffffff, localeToUse['audioController'].title,
            localeToUse['audioController'].doneStream
          )
        );
        await voiceConnection.channel.leave();
        this.removeGuild(textChannel.guild.id);
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
      this.getGuild(textChannel.guild.id).dispatcher.end();
    }
  }

  /**
   * Emits end event to the dispatcher
   * 
   * @param {import('discord.js').Snowflake} guildId ID of the guild connected to that should be destroyed
   */
  endPlayback (guildId) {
    let guild = this.getGuild(guildId);
    if (!guild || !guild.dispatcher) return;
    guild.dispatcher.end();
  }
}

module.exports = AudioController;