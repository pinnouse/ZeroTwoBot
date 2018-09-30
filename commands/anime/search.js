'use strict';

const utils = require('../../framework/utils');

const request = require('request-promise-native');

module.exports = {
  name: 'anime list',
  category: 'anime',
  superCmd: ['a', 'anime'],
  aliases: ['s', 'search'],
  optArgs: [],
  reqArgs: ['search term'],
  permissions: [],
  description: (locale) => { return locale['anime']['search']; },
  executeCommand: async (args) => {
    var query = `
    query Query($search: String) {
      Page (page: 1, perPage: 10) {
        media (search: $search, type: ANIME) {
          title {
            english
            romaji
            native
          }
          status
          description(asHtml: false)
          startDate
          endDate
          episodes
          meanScore
        }
      }
    }
    `;
    var options = {
      url: 'https://graphql.anilist.co',
      method: 'POST',
      headers: {
        'User-Agent': 'request',
        'Content-Type': 'application/json',
        'Accept': 'application/json'
      },
      body: JSON.stringify({
        query: query,
        variables: { search: args.args.join(" ") }
      }),
      json: true
    };

    await request(options)
      .then(result => {
        console.log(result);
      }).catch(reason => {
        args.message.channel.send(
          utils.getRichEmbed(args.client, 0xff0000, args.locale['anime']['search'].title, args.locale['anime']['search'].errorResponse)
        );
        console.log(reason);
      });
  }
}