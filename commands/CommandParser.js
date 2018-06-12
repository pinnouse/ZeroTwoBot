"use strict";

const config = require('../config.js');

var customPrefixes = new Map();

class CommandParser {
  constructor() {

  }

  receiveMessage(message) {
    var prefix = config.prefix;
    if (customerPrefixes.has(message.guild)) {
      prefix = customerPrefixes.get(message.guild);
    }

    if (message)
  }
}

module.exports = { CommandParser }