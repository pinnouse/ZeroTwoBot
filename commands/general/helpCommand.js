'use strict';

const config = require('../../config.json');

const utils = require('../../framework/utils');

const commandFormat = require('../../locales/commandFormat.json');

module.exports = {
  name: 'help',
  category: 'general',
  aliases: ['help', 'h'],
  optArgs: ['category (name or id)'],
  reqArgs: [],
  permissions: [],
  description: (locale) => { return locale['general']['help']; },
  executeCommand: async (args) => {
    let helpLocale = args.locale['general']['help'];
    let prefix = args.customPrefixes.get(args.message.guild.id) || config.prefix;
    let categories = Array.from(args.commands.keys());

    //List category
    if (args.args.length > 0) {
      if ((utils.isInt(args.args[0]) && args.args[0] > 0 && args.args[0] <= categories.length)
        || args.commands.has(args.args[0].toLowerCase())) {
        let cat = "";
        let cmds = [];
        if (utils.isInt(args.args[0]))
          cat = categories[args.args[0] - 1];
        else
          cat = args.args[0].toLowerCase();

        cmds = args.commands.get(cat);

        let embed = utils.getRichEmbed(args.client, 0x9e7e08, helpLocale.title, utils.replace(helpLocale['successCategory'].content, cat));

        cmds.filter(cmd => cmd.showCommand !== false).forEach(cmd => {
          let perms = cmd.permissions && cmd.permissions.length ? utils.getPermissionsString(cmd.permissions) : "*`" + helpLocale['successCategory'].noPerms + "`*";
          embed.addField(
            cmd.name,
            utils.replace(
              helpLocale['successCategory'].listItem,
              cmd.description(args.locale).description,
              perms,
              utils.getCommandUsage(prefix, cmd, commandFormat.commandHelpFormat)
            )
          );
        });
        
        await args.message.channel.send(embed);

        return true;
      } else {

        //Check if user query is command name
        let cmdIterator = args.commands.values();
        let isCommand = false;
        let cmd;
        for (let cmdArray of cmdIterator) {
          cmd = cmdArray.find(tempCmd => {
            return tempCmd.aliases.includes(args.args[0].toLowerCase()); 
          });
          if (cmd != undefined) {
            isCommand = true;
            break;
          }
        }
        if (isCommand) {
          await args.message.channel.send(
            utils.getRichEmbed(
              args.client,
              0x9e7e08,
              helpLocale.title,
              utils.replace(
                helpLocale['successCommand'].content,
                cmd.name,
                utils.getCommandUsage(prefix, cmd, commandFormat.commandHelpFormat)
              )
            )
          );
          return true;
        }

        await args.message.channel.send(
          utils.getRichEmbed(
            args.client,
            0xff0000,
            helpLocale.title,
            utils.replace(helpLocale['errors'].index, utils.getCommandUsage(prefix, module.exports, commandFormat.commandHelpFormat))
          )
        );

        return false;
      }
    } else {
      //List all categories
      let allCategories = "";
      categories.forEach((cat, index) => {
        allCategories += `\n${utils.replace(commandFormat.commandHelpFormat.categoryListItem, index + 1, cat)}\n`;
      });

      await args.message.channel.send(
        utils.getRichEmbed(
          args.client,
          0x9e7e08,
          helpLocale.title,
          utils.replace(helpLocale['successAll'].content, allCategories, utils.getCommandUsage(prefix, module.exports, commandFormat.commandHelpFormat))
        )
      )
      return true;
    }
  }
}