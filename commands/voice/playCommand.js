'use strict';

const { RichEmbed } = require('discord.js');

const request = require("request-promise-native");

const config = require('../../config.json');

const joinCommand = require('./joinCommand');
const selectCommand = require('./selectCommand');

const fs = require('fs');
const { promisify } = require('util');

const writeFile = promisify(fs.writeFile);

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
          songs: []
        }
      });
    }
    
    let joined =  await joinCommand.executeCommand(args);
    if (joined) {
      let pl = args.playlists.get(args.message.guild.id); //Current playlist
      let query = args.args.join(" ");
      let regex = new RegExp("http(s)?://(www\.)?youtu[\\w]*\.[a-zA-Z]{2,3}\/[\\w\\?\\-&$,\\.%]+"); //Searching with a link
      if (regex.test(query)) {
        return 'was a link';
      } else {
        //Search for a song
        searchYouTube(query)
        .then(value => {
          
          console.log(value);

          let selectUsage = `\`${args.prefix}`;
          selectCommand.aliases.forEach((alias, ind) => {
            if (ind > 0) selectUsage += " | `";
            selectUsage += `${alias}\``;
          });
          selectUsage += " `" + ((value.length > 1) ? `<1-${value.length}>` : "<1>") + "`";

          let songList = "";
          value.forEach((song, i) => {
            songList += `\n\`[\`[\`${i+1}\`](${urlPrefices[song.source]+song.id})\`]\`  -  \` ${song.duration} \`  ${song.title}`;
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
        return 'was something else';
      }
    } else {
      console.log('not joined channel');
      return false;
    }
  }
}

async function searchYouTube(query) {
  var GOOGLE_API = config.gapi;

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
          let tempDuration = tempVal.contentDetails.duration;
          let days = tempDuration.match(/[0-9]{1,2}(?=D)/) || "00";
          console.log(days);
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
          tempSongs.forEach((val, i) => {
            if (val.id == tempVal.id) { 
              tempSongs[i].duration = formattedTime;
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