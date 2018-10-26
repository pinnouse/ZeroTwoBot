'use strict';

const request = require("request-promise-native");

const config = require('../../config.json');
const GOOGLE_API = config.gapi;

const joinCommand = require('./joinCommand');
const selectCommand = require('./selectCommand');

const utils = require('../../framework/utils');

const urlPrefices = {
  'youtube': 'https://youtube.com/watch?v={URL}'
};

module.exports = {
  name: 'play',
  category: 'voice',
  aliases: ['play', 'p'],
  optArgs: [],
  reqArgs: ['search term or url'],
  unlimitedArgs: true,
  permissions: [],
  description: (locale) => { return locale['voice']['play']; },
  executeCommand: async (args) => {
    let playLocale = args.locale['voice']['play'];
    if (!args.playlists.has(args.message.guild.id)) {
      args.playlists.set(args.message.guild.id, {
        player: {
          status: 'OFF',
          loopMode: 'NONE',
          songs: [],
          selectList: []
        }
      });
    }

    let vChannel = utils.getVoiceChannel(args.client, args.message.author.id);
    let joined = vChannel && args.client.voiceConnections.find(vConn => { return vConn.channel.id === vChannel.id; });
    if (!joined)
      await joinCommand.executeCommand(args);
      
    let pl = args.playlists.get(args.message.guild.id)['player']; //Current playlist
    let query = args.args.join(" ");
    let regex = /(?:youtube(?:-nocookie)?\.com\/(?:[^\/\n\s]+\/\S+\v|(?:v|e(?:mbed)?)\/|\S*?[?&]v=)|youtu\.be\/)([a-zA-Z0-9\_\-]{11})/;
    if (regex.test(query)) {
      let result = await getSong(query.match(regex)[1]);
      if (result) {
        pl.songs.push(result);
        args.audioController.playSong(
          result,
          pl,
          utils.getVoiceChannel(args.client, args.message.author.id).connection,
          args.message.channel,
          args.locale
        );
        return 'Searched song (link)';
      }

      args.message.channel.send(
        utils.getRichEmbed(
          args.client,
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
          args.message.channel.send(
            utils.getRichEmbed(args.client, 0xff0000, playLocale.title,
              utils.replace(playLocale.noResults, query)
            )
          );
          return;
        }
        
        pl.selectList = value;
        // console.log(value);

        let selectUsage = `\`${args.prefix}`;
        selectCommand.aliases.forEach((alias, ind) => {
          if (ind > 0) selectUsage += " | `";
          selectUsage += `${alias}\``;
        });
        selectUsage += " `" + ((value.length > 1) ? `<1-${value.length}>` : "<1>") + "`";

        let songList = "";
        value.forEach((song, i) => {
          songList += `\n\`[\`[\` ${i+1} \`](${urlPrefices[song.source].replace('{URL}', song.id)})\`]\`  -  \` ${song.duration} \`  ${song.title}`;
        });

        args.message.channel.send(
          utils.getRichEmbed(args.client, 0xcccccc, playLocale.title, 
            utils.replace(playLocale.listResults, 
              query, selectUsage, songList
            )
          )
        );

        return 'Searched songs';
      } catch (e) {
        args.message.channel.send(
          utils.getRichEmbed(args.client, 0xff0000, playLocale.title, playLocale['errors'].searchFail)
        );
        return `false (search failed ${e})`
      };
    }
  }
}

async function getSong(url) {
  var options = {
    uri: 'https://www.googleapis.com/youtube/v3/videos',
    qs: {
      id: url,
      part: 'snippet,contentDetails',
      key: GOOGLE_API
    },
    headers: {
      'User-Agent': 'Request'
    },
    json: true
  };

  try {
    var results = await request(options);
    return results ? {
      title: results.items[0].snippet.title,
      source: 'youtube',
      id: url,
      duration: parseTime(results.items[0].contentDetails.duration)
    } : false;
  } catch(e) {
    return false;
  }
}

async function searchYouTube(query) {
  var options = {
    uri: 'https://www.googleapis.com/youtube/v3/search',
    qs: {
      part: 'snippet',
      maxResults: '5',
      safeSearch: 'none',
      type: 'video',
      q: query,
      key: GOOGLE_API
    },
    headers: {
      'User-Agent': 'Request'
    },
    json: true
  };

  try {
    var results = await request(options);
    let tempSongs = [];
    let ids = [];
    results.items.forEach((val, i) => {
      tempSongs[i] = {
        title: val.snippet.title,
        source: 'youtube',
        id: val.id.videoId,
        duration: '00:00'
      };
      ids.push(val.id.videoId);
    });

    // Get times of videos
    var searchOptions = {
      uri: 'https://www.googleapis.com/youtube/v3/videos',
      qs: {
        part: 'contentDetails',
        id: ids.join(','),
        key: GOOGLE_API
      },
      headers: {
        'User-Agent': 'Request'
      },
      json: true
    };
    results = await request(searchOptions);
    results.items.forEach(tempVal => {
      tempSongs.forEach((val, i) => {
        if (val.id == tempVal.id) { 
          tempSongs[i].duration = parseTime(tempVal.contentDetails.duration);
          // tempSongs[i].original = tempVal.contentDetails.duration;
        }
      });
    });
    return tempSongs;
  } catch (e) {
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