'use strict';

const { RichEmbed } = require('discord.js');

const request = require("request-promise-native");

const config = require('../../config.json');

const joinCommand = require('./joinCommand');

const fs = require('fs');
const { promisify } = require('util');

const writeFile = promisify(fs.writeFile);

const utils = require('../../framework/utils');

const urlPrefices = {
  'youtube': 'https://youtube.com/watch?v={URL}'
};

module.exports = {
  name: 'select',
  category: 'voice',
  aliases: ['s', 'sel', 'select'],
  optArgs: [],
  reqArgs: ['selection of song'],
  unlimitedArgs: false,
  permissions: [],
  description: 'Selects a song searched by the ` play ` command',
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

          args.message.channel.send(
            utils.getRichEmbed(args.client, 0xcccccc, playLocale.listResults.title, 
              utils.replace(playLocale.listResults.content, 
                query, 'sel <1-5>'
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
          let formattedTime = tempVal.contentDetails.duration.substr(0, tempVal.contentDetails.duration.length - 1);
          formattedTime = formattedTime.replace(/([0-9]{1,2})[A-Z]([0-9]{1,2})/gim, "$1:$2").replace(/\:([0-9])(?:$|:)/gim, ":0$1").replace(/[^0-9]([0-9])\:/gim, "0$1:").replace(/[A-Z]/gim, "");
          tempSongs.forEach((val, i) => {
            if (val.id == tempVal.id) { 
              tempSongs[i].duration = formattedTime;
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