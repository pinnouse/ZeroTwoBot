// ZeroTwoBot - A simple Discord bot with diverse functionality
// Copyright (C) 2019  Nicholas Wong
// 
// This program is free software: you can redistribute it and/or modify
// it under the terms of the GNU General Public License as published by
// the Free Software Foundation, either version 3 of the License, or
// (at your option) any later version.
// 
// This program is distributed in the hope that it will be useful,
// but WITHOUT ANY WARRANTY; without even the implied warranty of
// MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
// GNU General Public License for more details.
// 
// You should have received a copy of the GNU General Public License
// along with this program.  If not, see <http://www.gnu.org/licenses/>.

'use strict';

const Discord = require('discord.js');
const client = new Discord.Client();

let config;

try {
  config = require('./config.json');
} catch(e) {
  console.error('\x1b[31m%s\x1b[0m', "CONFIG FILE NOT FOUND. Please see the README to properly set up a config.json");
  process.exit(1);
}

const { prefix, token, testToken, serverPort, accessKey } = config;

client.testing = process.argv[2] == '--testing' || process.argv[2] == '-t';

var usedToken = (client.testing) ? testToken || token : token;
if (usedToken === undefined) {
  console.error('\x1b[31m%s\x1b[0m', "NO TOKEN WAS SPECIFIED. Please see the README to properly set up a config.json");
  process.exit(1);
}

const CommandParser = require('./framework/commandParser');
var cp = new CommandParser(client);

const ChatModule = require('./framework/chatbot');
var chatModule = new ChatModule(client);

client.on('ready', () => {
  console.log(client.guilds.forEach(el => { console.log(el.name); }));
  console.log(`Bot is ready, logged in as: ${client.user.tag}\nwith prefix: ${prefix}`);
  setInterval(() => {
    client.user.setActivity(`${client.guilds.size} channel(s)`, { type: "WATCHING" });
  }, 30000);
});

client.on('guildCreate', guild => {
  console.log(`Joined guild: ${guild.name} (id:${guild.id}`);
});

client.on('guildDelete', guild => {
  console.log(`Left guild: ${guild.name} (id:${guild.id})`);
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
  console.log(`${oldMember} | ${newMember}`);
  if (client.voiceConnections.has(oldMember.guild.id)) {
    var voiceChannel = client.voiceConnections.get(oldMember.guild.id).channel;
    if (voiceChannel.members.filter(mem => { return mem.id != client.id; }).size <= 0) {
      cp.audioController.endPlayback(oldMember.guild.id);
    }
  }
});

client.login(usedToken).catch(err => {
  console.log(err);
  console.log('Failed to connect');
  process.exit(1);
});

///Server portion
const express = require('express');
const bodyParser = require('body-parser');
var app = express();

app.use(bodyParser.urlencoded({ extended: true }));

app.post('/', (req, res) => {
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
