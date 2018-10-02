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
    let playLocale = args.locale.voice.play;
    if (!args.playlists.has(args.message.guild.id)) {
      args.playlists.set(args.message.guild.id, {
        player: {
          status: 'OFF',
          songs: [],
          selectList: []
        }
      });
    }

    console.log(args.client.voiceConnections);

    let vChannel = utils.getVoiceChannel(args.client, args.message.author.id).members.find(guildMember => guildMember.id === args.client.user.id);
    let joined = vChannel && args.client.voiceConnections.has(vChannel.id);
    if (!joined)
      await joinCommand.executeCommand(args);
      
    let pl = args.playlists.get(args.message.guild.id)['player']; //Current playlist
    let query = args.args.join(" ");
    let regex = /(?:youtube(?:-nocookie)?\.com\/(?:[^\/\n\s]+\/\S+\v|(?:v|e(?:mbed)?)\/|\S*?[?&]v=)|youtu\.be\/)([a-zA-Z0-9\_\-]{11})/;
    if (regex.test(query)) {
      getSong(query.match(regex)[1]).then(result => {
        pl.songs.push(result);
        args.audioController.playSong(
          result,
          pl,
          utils.getVoiceChannel(args.client, args.message.author.id).connection,
          args.message.channel,
          args.locale
        );
      });
      return 'was a link';
    } else {
      //Search for a song
      searchYouTube(query)
      .then(value => {

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
      }).catch(reason => {
        console.log(reason);
      });
      return 'Searched Songs';
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

  return new Promise((resolve, reject) => {
    request(options)
      .then(results => {
        let item = results.items[0];
        resolve({
            title: item.snippet.title,
            source: 'youtube',
            id: url,
            duration: parseTime(item.contentDetails.duration)
        });
      }).catch(reason => {
        reject(reason)
      });
    }
  );
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

  return new Promise((resolve, reject) => {
    request(options)
    .then(results => {
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
      request(searchOptions)
      .then(results => {
        results.items.forEach(tempVal => {
          tempSongs.forEach((val, i) => {
            if (val.id == tempVal.id) { 
              tempSongs[i].duration = parseTime(tempVal.contentDetails.duration);
              // tempSongs[i].original = tempVal.contentDetails.duration;
            }
          });
        });
        resolve(tempSongs);
      }).catch(reason => {
        reject(reason);
      });
      
    }).catch(reason => {
      reject(reason);
    });
  });
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