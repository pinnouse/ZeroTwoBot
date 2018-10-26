'use strict';

const utils = require('../../framework/utils');

const request = require('request-promise-native');

module.exports = {
  name: 'anime list',
  category: 'anime',
  superCmd: ['a', 'anime'],
  aliases: ['l', 'list'],
  optArgs: [],
  reqArgs: ['search term'],
  unlimitedArgs: true,
  permissions: [],
  description: (locale) => { return locale['anime']['list']; },
  executeCommand: async (args) => {
    let locale = args.locale['anime']['list'];
    var query = `
    query SearchQuery($search: String) {
      Page (page: 1, perPage: 10) {
        media (search: $search, type: ANIME) {
          title {
            english
            romaji
            native
          }
          status
          description(asHtml: false)
          episodes
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

    let returnValue = "";
    await request(options)
      .then(result => {
        console.log(result.data.Page.media);
        var output = utils.getRichEmbed(args.client, 0x00a1ff, locale.title,
          utils.replace(locale.results, `\` ${args.args.join(" ")} \``)
        );
        result.data.Page['media'].forEach(anime => {
          let animeNames = [];
          if (anime.title.english)
            animeNames.push(anime.title.english);
          if (anime.title.romaji)
            animeNames.push(anime.title.romaji);
          if (anime.title.native)
            animeNames.push(anime.title.native);

          if (animeNames.length == 0)
            return;

          let animeDescription = "";
          if (animeNames.length > 1) {
            animeDescription += "**also known as:** "
            animeNames.slice(1).forEach((name, index) => {
              if (index > 0)
                animeDescription += ", ";
              animeDescription += ` *\` ${name} \`*  `;
            });
            animeDescription += '\n';
          }

          if (anime.episodes) {
            animeDescription += '**episodes:** ' + anime.episodes + '\n';
          }

          anime.description = (anime.description || "").replace(/<[a-zA-Z0-9]+>/g, '').replace(/[\r\n]/g, ' ');

          if (anime.description.split(" ").length > 25)
            anime.description = anime.description.split(" ").slice(0, 25).join(" ") + " ...";

          let animeStatus = anime.status ? ` (${
            anime.status
            .replace('FINISHED', 'finished')
            .replace('RELEASING', 'airing')
            .replace('NOT_YET_RELEASED', 'not released')
          })` : "";

          animeDescription += anime.description;
          output.addField(animeNames[0] + animeStatus, animeDescription);
        });
        returnValue = 'success';
        args.message.channel.send(output);
      }).catch(reason => {
        args.message.channel.send(
          utils.getRichEmbed(args.client, 0xff0000, locale.title, locale.errorResponse)
        );
        returnValue = 'failure: ' + reason.message;
      });
    return returnValue;
  }
}