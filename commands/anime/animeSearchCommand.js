'use strict';

const utils = require('../../framework/utils');

const request = require('request-promise-native');

const ANILIST_PREFIX = 'https://anilist.co/anime/';

module.exports = {
  name: 'anime',
  category: 'anime',
  aliases: ['a', 'anime'],
  optArgs: [],
  reqArgs: ['search term'],
  unlimitedArgs: true,
  permissions: [],
  description: (locale) => { return locale['anime']['search']; },
  executeCommand: async (args) => {
    let locale = args.locale['anime']['search'];
    var query = `
    query SearchQuery($search: String) {
      Media (search: $search, type: ANIME) {
        id
        title {
          english
          romaji
          native
        }
        status
        description(asHtml: false)
        startDate {
          year
          month
          day
        }
        endDate {
          year
          month
          day
        }
        episodes
        duration
        meanScore
        coverImage {
          large
        }
      }
    }`;
    var options = {
      url: 'https://graphql.anilist.co',
      method: 'POST',
      headers: {
        'User-Agent': 'request',
        'Content-Type': 'application/json',
        'Accept': 'application/json'
      },
      body: {
        query: query,
        variables: { search: args.args.join(" ") }
      },
      json: true
    };

    try {
      var result = await request(options);
      let anime = result.data.Media;
        
        let animeTitle = [];
        if (anime.title.english)
          animeTitle.push(anime.title.english);
        if (anime.title.romaji)
          animeTitle.push(anime.title.romaji);
        if (anime.title.native)
          animeTitle.push(anime.title.native);
        
        if (animeTitle.length == 0)
          animeTitle.push("*no title*");

          
        let animeDescription = `[link](${ANILIST_PREFIX}${anime.id})\n`;
        if (animeTitle.length > 1) {
          animeDescription += "**also known as:** ";
          animeTitle.slice(1).forEach((name, index) => {
            if (index > 0)
            animeDescription += ", ";
            animeDescription += ` *\` ${name} \`* `;
          });
          animeDescription += '\n';
        }
        
        anime.description = (anime.description || "").replace(/<[a-zA-Z0-9]+>/g, '').replace(/[\r\n]/g, ' ');
        
        animeDescription += anime.description;
        
        let animeStatus = anime.status ? anime.status
          .replace('FINISHED', 'finished')
          .replace('RELEASING', 'airing')
          .replace('NOT_YET_RELEASED', 'not released') : "";
          
        var output = utils.getRichEmbed(args.client, 0x00a1ff, locale.title, animeDescription).setThumbnail(anime.coverImage['large']);
        
        output.addField('Status', animeStatus, true).addField('Episodes', `${anime.episodes != 1 ? anime.episodes + "eps (" + anime.duration + "mins)" : anime.duration + "mins"}`, true);
        if (anime.startDate) {
          let dateStr = `${getMonth(anime.startDate.month)}-${anime.startDate.day}-${anime.startDate.year}`;
          if (anime.endDate)
            dateStr += ` to ${getMonth(anime.endDate.month)}-${anime.endDate.day}-${anime.endDate.year}`;
          output.addField('Aired', dateStr);
        }
        output.addField('Score', `${anime.meanScore / 10.0}/10`)
        args.message.channel.send(output);
        return 'success';
    } catch (e) {
      args.message.channel.send(
        utils.getRichEmbed(args.client, 0xff0000, locale.title, locale.errorResponse)
      );
      return 'failure: ' + reason.message;
    }
  }
}

function getMonth(intMonth) {
  switch (intMonth) {
    case 1:
    default:
      return 'Jan';
    case 2:
      return 'Feb';
    case 3:
      return 'Mar';
    case 4:
      return 'Apr';
    case 5:
      return 'May';
    case 6:
      return 'Jun';
    case 7:
      return 'Jul';
    case 8:
      return 'Aug';
    case 9:
      return 'Sep';
    case 10:
      return 'Oct';
    case 11:
      return 'Nov';
    case 12:
      return 'Dec';
  }
}