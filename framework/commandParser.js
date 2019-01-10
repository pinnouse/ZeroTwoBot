'use strict';

const config = require('../config.json');
const utils = require('../framework/utils');
const commandFormat = require('../locales/commandFormat.json');

const AudioController = require('./audioController');

const glob = require('glob');

const fs = require('fs');
const { promisify } = require('util');

const readFile = promisify(fs.readFile);

//Map of commands with keys being command categories
var commands = new Map();

var customPrefixes = new Map();

//Map of structure <GuildID, preferred locale> ex: <93287298141, 'fr'>
var langPrefs = new Map();
//Map of structure <ID, locale>
var locales = new Map();

///MUSIC
//Map of songs to play <GuildID, player object> ex:
/* <287562879284857,
  player: {
    status: 'STREAMING',
    songs: [{
      title: 'Never Gonna Give You Up:'
      source: 'youtube',
      id: 'dQw4w9WgXcQ',
      duration: '03:32'
    }, ...],
    selectList: []
  }>
*/
var playlists = new Map();

class CommandParser {
  constructor(client) {
    this.client = client;
    this.audioController = new AudioController(client);

    //Clear all voice channels first
    client.channels.filter(channel => { return channel.type === 'voice'; }).forEach(channel => { channel.leave(); });

    //Build commands
    console.log("Loading commands...");
    glob.sync('commands/*/*.js').forEach((file) => {
      let tempCommand = require('../' + file);

      if (
        !tempCommand.name ||
        !tempCommand.category ||
        !tempCommand.aliases ||
        typeof tempCommand.description !== 'function' ||
        typeof tempCommand.executeCommand !== 'function'
        ) {
        console.log(`Skipping '${tempCommand.name || file}', incorrect formatting`);
        return;
      }

      process.stdout.write(`'${tempCommand.name}' command... `);

      let catCommands = commands.get(tempCommand.category) || [];
      if (catCommands.find(cmd => { return tempCommand.name === cmd.name; }))
        throw new Error(`Commands sharing same name: ${tempCommand.name}`);
      
      catCommands.push(tempCommand);
      commands.set(tempCommand.category, catCommands);

      //Check for duplicate aliases
      commands.forEach((category) => {
        category.filter(cmd => { return tempCommand.name !== cmd.name; }).forEach((cmd) => {
          cmd.aliases.forEach((cmdAlias) => {
            if (tempCommand.aliases.includes(cmdAlias) && //Aliases
              ((!tempCommand.superCmd && !cmd.superCmd) || //Have different super commands so it doesn't matter sharing aliases
              (tempCommand.superCmd || cmd.superCmd && tempCommand.superCmd === cmd.superCmd))
              ) {
              throw new Error(`Commands '${cmd.name}' and '${tempCommand.name}' share the alias: '${cmdAlias}'`);
            }
          });
        });
      });

      process.stdout.write("DONE!\r\n");
    });

    console.log("Loading locales...");
    let localeDir = 'locales/';
    fs.readdirSync(localeDir).filter(file => fs.lstatSync(localeDir + file).isDirectory()).forEach((folder) => {
      let tempLocale = {};
      process.stdout.write(`'${folder}' locale... `);
      glob.sync(`${localeDir}${folder}/*.json`).forEach(file => {
        var localeModule = /\/([a-zA-Z]+)\.json/g.exec(file);
        tempLocale[localeModule[1]] = require('../' + file);
      });
      locales.set(folder, tempLocale);
      process.stdout.write("DONE!\r\n");
    });

    console.log("Reading Custom Prefixes...");
    readFile('prefixPrefs.json', 'utf-8').then(data => {
      customPrefixes = utils.JSONToMap(data);
    });

    console.log("Reading Custom Locales...");
    readFile('localePrefs.json', 'utf-8').then(data => {
      langPrefs = utils.JSONToMap(data);
    });
  }

  receiveMessage(message) {
    var prefix = config.prefix;
    if (customPrefixes.has(message.guild.id)) {
      prefix = customPrefixes.get(message.guild.id);
    }

    if (message.content.startsWith(prefix)) {
      var regex = new RegExp("^" + utils.escapeRegExp(prefix) + "[a-zA-Z0-9][a-zA-Z0-9 _\\-\\/]*", "im");
      if (regex.test(message.content)) {
        var msg = message.content.substring(prefix.length).trim();
        var args = msg.split(" ");
        var command = args.shift();

        for (let category of commands.values()) {
          let cmd = category.find((cmd) => { return cmd.superCmd && cmd.aliases && cmd.superCmd.includes(command) && cmd.aliases.includes(args[0]); });
          if (cmd === undefined) {
            cmd = category.find(cmd => { return !cmd.superCmd && cmd.aliases && cmd.aliases.includes(command); });
          }
          if (cmd) {
            this.callCommand(cmd, message, args, prefix);
            return;
          }
        }
      }
    }
  }
  
  callCommand(command, message, args, prefix) {
    let lang = langPrefs.has(message.guild.id) ? langPrefs.get(message.guild.id) : config.defaultLang;
    let locale = locales.get(lang);
    let hasArgs = command.optArgs && command.reqArgs;
    if (command.superCmd && command.superCmd.length)
      args.shift();

    //Check if user has permission to use the command
    if (command.permissions && command.permissions.length > 0 && message.member && !message.member.hasPermission(command.permissions, false, false)) {
      message.channel.send(
        utils.getRichEmbed(
          this.client,
          0xff0000,
          locale.botInternal.errorTitle,
          utils.replace(locale.botInternal.notPermissible, utils.getPermissionsString(command.permissions))
        )
      );
    }
    //Check too many arguments
    else if (hasArgs && args.length > command.optArgs.length + command.reqArgs.length && command.unlimitedArgs !== true) {
      message.channel.send(
        utils.getRichEmbed(
          this.client,
          0xff0000,
          locale.botInternal.errorTitle,
          utils.replace(locale.botInternal.tooManyArgs, utils.getCommandUsage(prefix, command, commandFormat.commandHelpFormat))
        )
      );
    }
    //Check if meets amount of required arguments
    else if (hasArgs && args.length < command.reqArgs.length) {
      message.channel.send(
        utils.getRichEmbed(
          this.client,
          0xff0000,
          locale.botInternal.errorTitle,
          utils.replace(locale.botInternal.tooFewArgs, utils.getCommandUsage(prefix, command, commandFormat.commandHelpFormat))
        )
      );
    }
    //Execute the given command
    else {
      command.executeCommand({
        message: message,
        args: args,
        client: this.client,
        commands: commands,
        prefix: prefix,
        customPrefixes: customPrefixes,
        langPrefs: langPrefs,
        language: lang,
        locale: locale,
        locales: locales,
        playlists: playlists,
        audioController: this.audioController
      }).then(success => {
        if (this.client.testing) {
          console.log("\n----------------[Command]----------------" +
            `\ncommand     : ${command.name}` +
            `\nuser        : ${message.author.tag} (${message.author.id})` +
            `\ntime        : ${new Date().toLocaleString()}` +
            `\nsucceeeded  : ${success || "unsure (no return value)"}` +
            `\npassed args : ${JSON.stringify(args)}`
          );
        }
      })/*.catch(e => {
        if (this.client.testing) {
          console.log("\n----------------[ Error ]----------------"
            + `\ncommand     : ${command.name}`
            + `\nuser        : ${message.author.tag} (${message.author.id})`
            + `\ntime        : ${new Date().toLocaleString()}`
            + `\nsucceeeded  : ${e}`
            + `\npassed args : ${JSON.stringify(args)}`
          );
        }
      })*/;
    }
  }

  getCommands() {
    var returnCommands = new Map();
    commands.forEach((cmdArray, category) => {
      returnCommands.set(
        category,
        cmdArray.map((cmd) => {
          console.log(cmd.name);
          return {
            name: cmd.name,
            description: cmd.description(locales.get("en")).description,
            superCmd: cmd.superCmd,
            aliases: cmd.aliases,
            optArgs: cmd.optArgs,
            reqArgs: cmd.reqArgs,
            permissions: utils.getPermissionsString(cmd.permissions, true)
          };
        })
      );
    });

    return Array.from(returnCommands);
  }
}

module.exports = CommandParser;