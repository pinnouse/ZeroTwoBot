'use strict';

const Discord = require('discord.js');
const client = new Discord.Client();

const { prefix, token } = require('./config.json');

const CommandParser = require('./framework/commandParser');
var cp = new CommandParser(client);

const ChatModule = require('./framework/chatbot');
var chatModule = new ChatModule(client);

client.on('ready', () => {
  console.log(`Bot is ready, logged in as: ${client.user.tag}\nwith prefix: ${prefix}`);
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

  //Mention, that means use the chatbot
  if (message.content.startsWith(`<@${client.user.id}>`))
    await chatModule.sendMessage(message);
  //For parsing commands
  else
    await cp.receiveMessage(message);
});

client.login(token).catch(console.log);