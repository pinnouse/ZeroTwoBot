// ZeroTwoBot - A simple Discord bot with diverse functionality
// Copyright (C) 2020  Nicholas Wong
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

client.devMode = process.argv[2] == '--development' || process.argv[2] == '-d'
if (client.devMode)
  console.log('\x1b[33m%s\x1b[0m', "RUNNING IN DEVELOPMENT MODE");

var usedToken = (client.devMode && testToken) ? testToken : token;
if (usedToken === undefined) {
  console.error('\x1b[31m%s\x1b[0m', "NO TOKEN WAS SPECIFIED. Please see the README to properly set up a config.json");
  process.exit(1);
}

const CommandParser = require('./framework/commandParser');
var commandParser = new CommandParser(client);

const ChatModule = require('./framework/chatbot');
var chatModule = new ChatModule(client);

let ready = false;
client.on('ready', () => {
  console.log(`Bot is ready, logged in as: ${client.user.tag}\nwith prefix: ${prefix}`);
  ready = true;
  setActivity();
  setInterval(setActivity, 1000 * 60 * 5);
});

client.on('guildCreate', guild => {
  if (client.debug)
    console.log(`Joined guild: ${guild.name} (id:${guild.id}`);
});

client.on('guildDelete', guild => {
  if (client.debug)
    console.log(`Left guild: ${guild.name} (id:${guild.id})`);
});

client.on('message', async message => {
  if (message.author.bot) return;

  //Mention, that means use the chatbot
  let mentionedRE = new RegExp(`^\<\@(!)?${client.user.id}\>`);
  if (mentionedRE.test(message.content))
    await chatModule.sendMessage(message);
  //For parsing commands
  else
    await commandParser.receiveMessage(message);
});

client.on('voiceStateUpdate', async oldMember => {
  if (client.voice.connections.has(oldMember.guild.id)) {
    let voiceChannel = client.voice.connections.get(oldMember.guild.id).channel;
    if (voiceChannel.members.size <= 1) {
      commandParser.audioController.endPlayback(oldMember.guild.id);
      await voiceChannel.leave();
    }
  }
});

client.login(usedToken).catch(err => {
  console.log(err);
  console.log('\x1b[31m%s\x1b[0m', 'Failed to connect');
  process.exit(10);
});

let i = 0;
let activities = [];
function getActivity(index) {
  return activities[index];
}
function setActivity() {
  i++;
  if (i >= activities.length) i = 0;
  try {
    activities = [
      [`${client.guilds.cache.size} server(s)`, { type: "WATCHING" }],
      [`${client.voice.connections.size} voice channel(s)`, { type: "STREAMING" }],
      [`z2b.xyz`, { url: 'https://z2b.xyz', type: "PLAYING" }],
      [`to your commands 💝`, { type: "LISTENING" }]
    ];
    if (ready) client.user.setActivity(getActivity(i)[0], getActivity(i)[1]);
  } catch(e) {
    //Error setting activity
    console.error(e);
  }
}

///Server portion
const express = require('express');
const bodyParser = require('body-parser');
var app = express();

app.use(bodyParser.urlencoded({ extended: true }));

app.post('/', (req, res) => {
  if (req.body.key === accessKey) {
    res.writeHead(200, { 'Content-Type': 'application/json' });
    var botInfo = {
      guilds: Array.from(client.guilds.cache.entries()),
      ping: client.ping,
      avatar: client.user.displayAvatarURL(),
      tag: client.user.tag,
      commands: commandParser.getCommands(),
      prefix: prefix
    };
    
    res.write(JSON.stringify(botInfo));
  } else {
    res.writeHead(403, { 'Content-Type': 'text/html' });
    res.write('Sorry, you are unauthorized to access this site');
  }
  res.end();
});

app.listen(serverPort);
