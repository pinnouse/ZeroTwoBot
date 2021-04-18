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
//Values are array of commands
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

/**
 * A command
 * @typedef {Object} Command
 * @property {string} name Name of command (not to explicitly how to call command)
 * @property {string} category Category of command
 * @property {Array<string>} aliases Different ways to execute command
 * @property {Array<string>} optArgs Optional arguments for command
 * @property {Array<string>} reqArgs Required arguments for command
 * @property {boolean} unlimitedArgs Arguments separated by space are not constrained
 * @property {boolean} nsfw Is command an NSFW command
 * @property {Array<string>} permissions All required permissions to execute the command
 * @property {boolean} showCommand Whether or not to display the command in 'help'
 */

/** Parses commands for user */
class CommandParser {

  /**
   * 
   * @param {import('discord.js').Client} client 
   */
  constructor(client) {
    this.client = client;
    this.audioController = new AudioController(client);

    //Clear all voice channels first
    client.channels.cache.filter(channel => { return channel.type === 'voice'; }).forEach(channel => { channel.leave(); });

    //Build commands
    try {
      this.loadCommands();
    } catch (e) {
      console.error('\x1b[31m%s\x1b[0m', "FAILED TO BUILD COMMANDS. If this error persists, please report an issue: https://github.com/pinnouse/ZeroTwoBot/issues");
      process.exit(2);
    }

    //Generate locales
    try {
      this.loadLocales();
    } catch (e) {
      console.error('\x1b[31m%s\x1b[0m', "FAILED TO GENERATE LOCALES. If this error persists, please report an issue: https://github.com/pinnouse/ZeroTwoBot/issues");
      process.exit(3);
    }

    // TODO: Switch to some database manager for server preferences

    console.log("Reading Custom Prefixes...");
    if (fs.existsSync('prefixPrefs.json')) {
      readFile('prefixPrefs.json', 'utf-8').then(data => {
        customPrefixes = utils.JSONToMap(data);
      });
    }

    console.log("Reading Custom Locales...");
    if (fs.existsSync('localePrefs.json')) {
      readFile('localePrefs.json', 'utf-8').then(data => {
        langPrefs = utils.JSONToMap(data);
      });
    }
  }

  /** Loads all the commands */
  loadCommands() {
    //Clear cache first
    glob.sync('commands/*/*.js').forEach(file => { try { delete require.cache[require.resolve('../' + file)] } catch(e) { /* Do nothing */ } });

    let tempMapCommands = new Map();

    console.log('\x1b[32m%s\x1b[0m', "Loading commands...");
    glob.sync('commands/*/*.js').forEach((file) => {
      try {
        let tempCommand = require('../' + file);
  
        if (
          !tempCommand.name ||
          !tempCommand.category ||
          !tempCommand.aliases ||
          typeof tempCommand.description !== 'function' ||
          typeof tempCommand.executeCommand !== 'function'
          ) {
          if (this.client.devMode) console.log(`Skipping '${tempCommand.name || file}', incorrect formatting`);
          return;
        }
  
        if (this.client.devMode) process.stdout.write(`'${tempCommand.name}' command... `);
  
        let catCommands = tempMapCommands.get(tempCommand.category) || [];
        if (catCommands.find(cmd => { return tempCommand.name === cmd.name; }))
          throw new Error(`Commands sharing same name: ${tempCommand.name}`);
        
        catCommands.push(tempCommand);
        tempMapCommands.set(tempCommand.category, catCommands);
  
        //Check for duplicate aliases
        tempMapCommands.forEach((category) => {
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
      } catch (e) {
        this.client.devMode && console.error(`Failed to load command ${file}`) ^ console.error(e);
      }

      this.client.devMode && process.stdout.write("DONE!\r\n");
    });

    //Set to new map
    commands = tempMapCommands;
  }

  /** Loads all the locales */
  loadLocales() {
    let tempMapLocales = new Map();

    console.log('\x1b[32m%s\x1b[0m', "Loading locales...");
    let localeDir = 'locales/';
    fs.readdirSync(localeDir).filter(file => fs.lstatSync(localeDir + file).isDirectory()).forEach((folder) => {

      // Clear cache first
      glob.sync(`${localeDir}${folder}/*.json`).forEach(file => { try { delete require.cache[require.resolve('../' + file)] } catch(e) { /* Do nothing */ } });

      let tempLocale = {};
      if (this.client.devMode) process.stdout.write(`'${folder}' locale... `);
      glob.sync(`${localeDir}${folder}/*.json`).forEach(file => {
        var localeModule = /\/([a-zA-Z]+)\.json/g.exec(file);
        tempLocale[localeModule[1]] = require('../' + file);
      });
      tempMapLocales.set(folder, tempLocale);
      if (this.client.devMode) process.stdout.write("DONE!\r\n");
    });

    //Set to new map
    locales = tempMapLocales;
  }

  /**
   * Receive a message and check if it's a command that exists
   * 
   * @param {import('discord.js').Message} message DiscordJS message
   */
  async receiveMessage(message) {
    var prefix = config.prefix;
    if (message.guild && customPrefixes.has(message.guild.id)) {
      prefix = customPrefixes.get(message.guild.id);
    }

    if (message.content.startsWith(prefix)) {
      var regex = new RegExp("^" + utils.escapeRegExp(prefix) + "[a-zA-Z0-9][\\w \\-\\/]*", "im");
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
            return await this.callCommand(cmd, message, args, prefix);
          }
        }
      }
    }
  }
  
  /**
   * Calls a Command based on the given inputs and sends client information
   * 
   * @param {Command} command Command object that has been checked against to execute
   * @param {import('discord.js').Message} message DiscordJS message
   * @param {Array<string>} args information of the message string to be sent to command
   * @param {string} prefix command prefix for sending to command
   */
  async callCommand(command, message, args, prefix) {
    if (!message.guild) {
      message.channel.send("Sorry, I only respond in servers. Please join a server to use me.");
      return
    }
    if (!message.guild.available) return;
    let lang = langPrefs.has(message.guild.id) ? langPrefs.get(message.guild.id) : config.defaultLang;
    let locale = locales.get(lang);
    let hasArgs = command.optArgs || command.reqArgs;
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
    // Check if bot has permissions to "execute" the command
    else if(command.clientperms && command.clientperms.length > 0 && !message.guild.me.hasPermission(command.clientperms, false, false)) {
      message.channel.send(
        utils.getRichEmbed(
          this.client,
          0xff0000,
          locale.botInternal.errorTitle,
utils.replace(locale.botInternal.noClientPerms, utils.getPermissionsString(command.clientperms))
        )
      );
    } 
    //Check NSFW
    else if (command.nsfw && !message.channel.nsfw) {
      message.channel.send(
        utils.getRichEmbed(
          this.client,
          0xff0000,
          locale.botInternal.errorTitle,
          locale.botInternal.nsfw
        )
      );
    }
    //Check too many arguments
    else if (hasArgs && command.optArgs && args.length > command.optArgs.length + command.reqArgs.length && command.unlimitedArgs !== true) {
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
      try {
        let success = await command.executeCommand({
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
          audioController: this.audioController,
          commandParser: this
        });
        if (this.client.devMode) {
          console.log("\n----------------[Command]----------------" +
            `\ncommand     : ${command.name}` +
            `\nuser        : ${message.author.tag} (${message.author.id})` +
            `\nserver      : ${message.guild.name} (${message.guild.id})` +
            `\ntime        : ${new Date().toLocaleString()}` +
            `\nresult      : ${success || "unsure (no return value)"}` +
            `\npassed args : ${JSON.stringify(args)}`
            );
        }
        return success;
      } catch(e) {
        console.log("\n----------------[ Error ]----------------" +
          `\ncommand     : ${command.name}` +
          `\nuser        : ${message.author.tag} (${message.author.id})` +
          `\nserver      : ${message.guild.name} (${message.guild.id})` +
          `\ntime        : ${new Date().toLocaleString()}` +
          `\nerror       : ${e.message || e}` +
          `\npassed args : ${JSON.stringify(args)}`
        );
        e.stack && console.log(e.stack);
        return e;
      }
    }
  }

  /**
   * List all commands
   * 
   * @returns {Array<Command>} Array of all commands
   */
  getCommands() {
    var returnCommands = new Map();
    commands.forEach((cmdArray, category) => {
      returnCommands.set(
        category,
        cmdArray.map((cmd) => {
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
