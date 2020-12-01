'use strict';

const axios = require('axios');

const config = require('../../config.json');
const GOOGLE_API = config.gapi;

const joinCommand = require('./joinCommand');
const selectCommand = require('./selectCommand');

const utils = require('../../framework/utils');

const Song = require('../../framework/song');

module.exports = {
  name: 'play',
  category: 'voice',
  aliases: ['play', 'p'],
  optArgs: [],
  reqArgs: ['search term or url'],
  unlimitedArgs: true,
  permissions: [],
  description: (locale) => { return locale['voice']['play']; },
  executeCommand: async (context) => {
    const {args, client, message, locale, playlists, audioController, prefix} = context;
    let playLocale = locale['voice']['play'];

    let voiceConnection = utils.getVoiceConnection(client, message.author.id);
    if (!voiceConnection) {
      await joinCommand.executeCommand(context);
      voiceConnection = utils.getVoiceConnection(client, message.author.id);
    }

    let pl = utils.getPlaylist(playlists, message.guild.id);
    let query = args.join(" ");
    let regex = /(?:youtube(?:-nocookie)?\.com\/(?:[^\/\n\s]+\/\S+\v|(?:v|e(?:mbed)?)\/|\S*?[?&]v=)|youtu\.be\/)([a-zA-Z0-9\_\-]{11})/;
    if (regex.test(query)) {
      let result = await getSong(query.match(regex)[1]);
      if (result) {
        pl.songs.push(result);
        await audioController.playSong(
          result,
          pl,
          voiceConnection,
          message.channel,
          locale
        );
        return 'Searched song (link)';
      }

      await message.channel.send(
        utils.getRichEmbed(
          client,
          0xff0000,
          playLocale.title,
          playLocale['errors'].incorrectURL
        )
      );
      return 'Was a link';
    } else {
      //Search for a song
      var value = await searchYouTube(query);
      try {
        if (value.length < 1) {
          await message.channel.send(
            utils.getRichEmbed(client, 0xff0000, playLocale.title,
              utils.replace(playLocale.noResults, query)
            )
          );
          return;
        }
        
        pl.selectList = value;
        // console.log(value);

        let selectUsage = `\`${prefix}`;
        selectCommand.aliases.forEach((alias, ind) => {
          if (ind > 0) selectUsage += " | `";
          selectUsage += `${alias}\``;
        });
        selectUsage += " `" + ((value.length > 1) ? `<1-${value.length}>` : "<1>") + "`";

        let songList = "";
        value.forEach((song, i) => {
          songList += `\n\`[\`[\`${i+1}\`](${song.getURL()})\`]\` - \`${song.duration}\` ${song.title}`;
        });

        await message.channel.send(
          utils.getRichEmbed(client, 0xcccccc, playLocale.title, 
            utils.replace(playLocale.listResults, 
              query, selectUsage, songList
            )
          )
        );

        return 'Searched songs';
      } catch (e) {
        await message.channel.send(
          utils.getRichEmbed(client, 0xff0000, playLocale.title, playLocale['errors'].searchFail)
        );
        return `failed: (search failed ${e})`;
      }
    }
  }
}

async function getSong(url) {
  try {
    const { data: results } = await axios({
      url: 'https://www.googleapis.com/youtube/v3/videos',
      params: {
        id: url,
        part: 'snippet,contentDetails',
        key: GOOGLE_API,
      },
    });
    return results ? new Song(
      results.items[0].snippet.title,
      'youtube',
      url,
      parseTime(results.items[0].contentDetails.duration)
    ) : false;
  } catch(e) {
    return false;
  }
}

async function searchYouTube(query) {
  //Get the videos
  try {
    const { data: results } = await axios({
      url: 'https://www.googleapis.com/youtube/v3/search',
      params: {
        part: 'snippet',
        maxResults: '5',
        safeSearch: 'none',
        type: 'video',
        q: query,
        key: GOOGLE_API
      },
    });
    let tempSongs = [];
    let ids = [];
    results.items.forEach(val => {
      tempSongs.push(
        new Song(
          val.snippet.title,
          'youtube',
          val.id.videoId,
          '00:00'
        )
      );
      ids.push(val.id.videoId);
    });

    // Get times of videos
    const { data: timeResults } = await axios({
      url: 'https://www.googleapis.com/youtube/v3/videos',
      params: {
        part: 'contentDetails',
        id: ids.join(','),
        key: GOOGLE_API,
      }
    })
    timeResults.items.forEach(conDetails => {
      tempSongs.forEach(s => {
        if (s.id == conDetails.id) { 
          s.duration = parseTime(conDetails.contentDetails.duration);
        }
      });
    });
    return tempSongs;
  } catch (e) {
    console.error(e);
    return e;
  }
}

function parseTime(tempDuration) {
  let days = tempDuration.match(/[0-9]{1,2}(?=D)/) || "00";
  let hours = tempDuration.match(/[0-9]{1,2}(?=H)/) || "00";
  let minutes = tempDuration.match(/[0-9]{1,2}(?=M)/) || "00";
  let seconds = tempDuration.match(/[0-9]{1,2}(?=S)/) || "00";
  
  let formattedTime = "";
  if (days !== "00")
    formattedTime = [days, hours, minutes, seconds].join(":");
  else if (hours !== "00")
    formattedTime = [hours, minutes, seconds].join(":");
  else
    formattedTime = [minutes, seconds].join(":");

  formattedTime = formattedTime
  .replace(/^([0-9])(?=:)/gm, "0$1")
  .replace(/:([0-9]):/gm, ":0$1:")
  .replace(/:([0-9])$/gm, ":0$1");
  return formattedTime;
}