'use strict';

const utils = require('../../framework/utils');

const request = require('request-promise-native');

module.exports = {
  name: 'yandere',
  category: 'nsfw',
  aliases: ['yand', 'yandere'],
  optArgs: ['search tags'],
  reqArgs: [],
  unlimitedArgs: true,
  nsfw: true,
  description: (locale) => { return locale['nsfw']['yandere']; },
  executeCommand: async (args) => {
    let locale = args.locale['nsfw']['yandere'];
    var allowableCharacters = /^[\w\.\(\)\&\+\s]+$/;
    var tags = args.args.join(" ");
    if (tags && !allowableCharacters.test(tags)) {
      args.message.channel.send(
        utils.getRichEmbed(
          args.client,
          0xff0000,
          locale.title,
          locale['errors'].specialCharacters
        )
      );
      return 'not executed (used special characters)';
    }

    var searchingMessage = await args.message.channel.send(
      utils.getRichEmbed(
        args.client,
        0x70bb77,
        locale.title,
        locale.loading
      )
    );

    var options = {
      uri: 'https://yande.re/post.json',
      qs: {
        tags: tags,
        limit: 50,
        json: 1
      }, headers: {
        'User-Agent': 'Request'
      },
      json: true
    };

    let richEmbed;
    let response = await request(options);
    if (!response || !response.length) {
      richEmbed = utils.getRichEmbed(
        args.client,
        0xaaffaa,
        locale.title,
        utils.replace(
          locale['errors'].noResults,
          `\`${tags.split(' ').join('`, `')}\``
        )
      );
      if (!searchingMessage.deleted)
          searchingMessage.edit(richEmbed);
      else
        args.message.channel.send(richEmbed);

      return 'success (no results found for query)';
    }

    let choice = response[Math.abs(Math.round(Math.random() * response.length - 1))];
    richEmbed = utils.getRichEmbed(
      args.client,
      0xaaffaa,
      locale.title,
      utils.replace(
        locale.success,
        `\`${(tags) ? tags.split(' ').join('`, `') : "none"}\``
      )
    );
    richEmbed
      .setImage(choice.file_url)
      .setFooter(`Requested by: ${args.message.author.username}`, args.message.author.displayAvatarURL)
      .setTimestamp(new Date().toISOString());
    if (!searchingMessage.deleted)
      searchingMessage.edit(richEmbed);
    else
      args.message.channel.send(richEmbed);
    return 'success';
  }
}