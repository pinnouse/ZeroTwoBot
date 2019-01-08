'use strict';

const Discord = require('discord.js');
const client = new Discord.Client();

const { prefix, token, testToken, serverPort, accessKey } = require('./config.json');

var usedToken = (process.argv[2] == '--testing' || process.argv[2] == '-t') ? testToken : token;

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
});

client.on('message', message => {
  if (message.author.bot) return;

  //Mention, that means use the chatbot
  if (message.content.startsWith(`<@${client.user.id}>`))
    chatModule.sendMessage(message);
  //For parsing commands
  else
    cp.receiveMessage(message);
});

client.on('voiceStateUpdate', (oldMember, newMember) => {
  if (client.voiceConnections.has(oldMember.guild.id)) {
    var voiceChannel = client.voiceConnections.get(oldMember.guild.id).channel;
    if (voiceChannel.members.filter(mem => { return mem.id != client.id; }).size <= 0) {
      cp.audioController.endPlayback(oldMember.guild.id);
    }
  }
});

client.login(usedToken).catch(err => {
  console.log(err);
  process.exit(1);
});

///Server portion
const express = require('express');
const bodyParser = require('body-parser');
var app = express();

app.use(bodyParser.urlencoded({ extended: true }));

app.post('/', (req, res) => {
  console.log(req.body);

  
  if (req.body.key === accessKey) {
    res.writeHead(200, { 'Content-Type': 'application/json' });
    var botInfo = {
      guilds: Array.from(client.guilds.entries()),
      ping: client.ping,
      avatar: client.user.displayAvatarURL,
      tag: client.user.tag,
      commands: cp.getCommands(),
      prefix: prefix
    };
    
    res.write(JSON.stringify(botInfo));
  } else {
    res.writeHead(401, { 'Content-Type': 'text/html' });
    res.write('<h1>Sorry, you are unauthorized to access this site</h1>');
  }
  res.end();
});

app.listen(serverPort);
