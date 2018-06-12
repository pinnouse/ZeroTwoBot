"use strict";

const Discord = require('discord.js');
const client = new Discord.Client();

client.on('ready', () => {
  console.log(`Bot is ready, logged in as: ${client.user.tag}`);
});

