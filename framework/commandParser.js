'use strict';

const config = require('../config.json');
const utils = require('../framework/utils');
const botInternalLocale = require('../locales/botInternal.json');

const { RichEmbed } = require('discord.js');

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

    //Build commands
    console.log("Loading commands...");
    glob.sync('commands/*/*.js').forEach((file) => {
      let tempCommand = require('../' + file);

      process.stdout.write(`'${tempCommand.name}' command... `)

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
    glob.sync('locales/*.json').forEach((file) => {
      let lang = file.match(/([a-zA-Z]+)\.json/)[1];
      process.stdout.write(`'${lang}' locale... `)
      locales.set(lang, require('../' + file));
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

  async receiveMessage(message) {
    var prefix = config.prefix;
    if (customPrefixes.has(message.guild.id)) {
      prefix = customPrefixes.get(message.guild.id);
    }

    
    if (message.content.startsWith(prefix)) {
      var regex = new RegExp("^" + utils.escapeRegExp(prefix) + "[a-zA-Z][a-zA-Z0-9 _\\-\\/]*", "im");
      if (regex.test(message.content)) {
        var msg = message.content.substring(prefix.length).trim();
        var args = msg.split(" ");
        var command = args.shift();

        var executedCommand = false;

        commands.forEach(async (category) => {
          if (executedCommand)
            return;

          category.forEach(async (tempCmd) => {
            if (!executedCommand && tempCmd.aliases && //Check if haven't executed command yet and command has aliases
              (!tempCmd.superCmd && tempCmd.aliases.includes(command)) || //Check if just plain command
              (tempCmd.superCmd && tempCmd.superCmd.includes(command) && tempCmd.aliases.includes(args[0])) //Check if command has a super command (i.e. anime)
              ) { //Begin if command is recognized
              let lang = langPrefs.has(message.guild.id) ? langPrefs.get(message.guild.id) : config.defaultLang;
              let locale = locales.get(lang);
              let hasArgs = tempCmd.optArgs && tempCmd.reqArgs;
              if (tempCmd.superCmd && tempCmd.superCmd.length > 0)
                args.shift();

              //Check if user has permission to use the command
              if (tempCmd.permissions && tempCmd.permissions.length > 0 && message.member && !message.member.hasPermission(tempCmd.permissions, false, false)) {
                message.channel.send(new RichEmbed()
                  .setColor(0xff0000)
                  .setTitle(locale.botInternal.errorTitle)
                  .setDescription(utils.replace(locale.botInternal.notPermissible, utils.getPermissionsString(tempCmd.permissions)))
                );
              }
              //Check too many arguments
              else if (hasArgs && args.length > tempCmd.optArgs.length + tempCmd.reqArgs.length && !tempCmd.unlimitedArgs) {
                message.channel.send(new RichEmbed()
                  .setColor(0xff0000)
                  .setTitle(locale.botInternal.errorTitle)
                  .setDescription(
                    utils.replace(locale.botInternal.tooManyArgs, utils.getCommandUsage(prefix, tempCmd, botInternalLocale.commandHelpFormat))
                  )
                );
              }
              //Check if meets amount of required arguments
              else if (hasArgs && args.length < tempCmd.reqArgs.length) {
                message.channel.send(new RichEmbed()
                  .setColor(0xff0000)
                  .setTitle(locale.botInternal.errorTitle)
                  .setDescription(
                    utils.replace(locale.botInternal.tooFewArgs, utils.getCommandUsage(prefix, tempCmd, botInternalLocale.commandHelpFormat))
                  ));
              } 
              //Execute the given command
              else {
                //try {
                // message.channel.startTyping();
                tempCmd.executeCommand({
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
                  if (config.debugmode) {
                    console.log("\n----------------[Command]----------------"
                      + `\ncommand     : ${tempCmd.name}`
                      + `\nuser        : ${message.author.tag} (${message.author.id})`
                      + `\ntime        : ${new Date().toLocaleString()}`
                      + `\nsucceeeded  : ${success || "unsure (no return value)"}`
                      + `\npassed args : ${JSON.stringify(args)}`
                    );
                  }
                });
                // message.channel.stopTyping();
                  /* * /
                } catch (e) {
                  console.error("Ran into error: " + e);
                }/* */
              }

              //Done a command, don't need to continue looping
              executedCommand = true;
            }
          });
        });
      }
    }
  }
}

module.exports = CommandParser