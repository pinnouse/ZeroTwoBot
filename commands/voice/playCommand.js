'use strict';

const { RichEmbed } = require('discord.js');

const config = require('../../config.json');

const fs = require('fs');
const { promisify } = require('util');

const writeFile = promisify(fs.writeFile);

const utils = require('../../framework/utils');

module.exports = {
  name: 'play',
  category: 'voice',
  aliases: ['play', 'p'],
  optArgs: [],
  reqArgs: ['search term or url'],
  permissions: [],
  description: 'Searches YouTube for the song requested or adds song to queue',
  executeCommand: async (args) => {
    
  }
}