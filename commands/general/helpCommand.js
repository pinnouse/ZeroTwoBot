'use strict';

const config = require('../../config.json');

const utils = require('../../framework/utils');

module.exports = {
  name: 'help',
  category: 'general',
  aliases: ['help', 'h'],
  optArgs: ['category (name or id)'],
  reqArgs: [],
  permissions: [],
  description: 'Get help on using the commands of the bot',
  executeCommand: async (args) => {
    let helpLocale = args.locale.general.help;
    let prefix = args.customPrefixes.get(args.message.guild.id) || config.prefix;
    let categories = Array.from(args.commands.keys());

    if (args.args.length > 0) {
      if ((utils.isInt(args.args[0]) && args.args[0] > 0 && args.args[0] <= categories.length) || args.commands.has(args.args[0].toLowerCase())) {
        let cat = "";
        let commands = [];
        if (utils.isInt(args.args[0]))
          cat = categories[args.args[0] - 1];
        else
          cat = args.args[0].toLowerCase();

        commands = args.commands.get(cat);

        let embed = utils.getRichEmbed(args.client, 0x9e7e08, helpLocale.successCategory.title, utils.replace(helpLocale.successCategory.content, cat));

        commands.forEach(cmd => {
          embed.addField(
            utils.replace(helpLocale.successCategory.listItem.title, cmd.name),
            `${cmd.description}\n${utils.getCommandUsage(prefix, cmd, args.locale.botInternal.commandHelpFormat)}`
          );
        });
        
        await args.message.channel.send(embed);

        return true;
      } else {
        await args.message.channel.send(
          utils.getRichEmbed(
            args.client,
            0xff0000,
            helpLocale.errorIndex.title,
            utils.replace(helpLocale.errorIndex.content, utils.getCommandUsage(prefix, module.exports, args.locale.botInternal.commandHelpFormat))
          )
        );

        return false;
      }
    } else {
      //List all categories
      let allCategories = "";
      categories.forEach((cat, index) => {
        allCategories += `\n${utils.replace(helpLocale.successAll.categoryListItem, index + 1, cat)}\n`;
      });

      await args.message.channel.send(
        utils.getRichEmbed(
          args.client,
          0x9e7e08,
          helpLocale.successAll.title,
          utils.replace(helpLocale.successAll.content, allCategories, utils.getCommandUsage(prefix, module.exports, args.locale.botInternal.commandHelpFormat))
        )
      )
      return true;
    }
  }
}