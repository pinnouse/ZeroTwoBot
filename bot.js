'use strict';

const Discord = require('discord.js');
const client = new Discord.Client();

const fs = require('fs'); // File stream

const { token } = require('./config.json');

const CommandParser = require('./framework/commandParser');
var cp = new CommandParser(client);

client.on('ready', () => {
  console.log(`Bot is ready, logged in as: ${client.user.tag}`);
  client.user.setActivity(`${client.guilds.size} channel(s)`, { type: "WATCHING" });
});

client.on('guildCreate', guild => {
  console.log(`Joined guild: ${guild.name} (id:${guild.id}`);
  client.user.setActivity(`${client.guilds.size} channel(s)`, { type: "WATCHING" });
});

client.on('guildDelete', guild => {
  console.log(`Left guild: ${guild.name} (id:${guild.id})`);
  client.user.setActivity(`${client.guilds.size} channel(s)`, { type: "WATCHING" });
})

client.on('message', async message => {
  if (message.author.bot) return;

  await cp.receiveMessage(message);
});

client.login(token).catch(console.log);