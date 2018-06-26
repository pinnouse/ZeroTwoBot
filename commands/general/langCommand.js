'use strict';

const { RichEmbed } = require('discord.js');

const config = require('../../config.json');

const fs = require('fs');
const { promisify } = require('util');

const writeFile = promisify(fs.writeFile);

const utils = require('../../framework/utils');

module.exports = {
  name: 'language',
  category: 'general',
  aliases: ['language', 'lang', 'locale'],
  optArgs: ['new lang'],
  reqArgs: [],
  permissions: ['MANAGE_GUILD'],
  description: 'Gets or sets the language preference for this server',
  executeCommand: async (args) => {
    let langLocale = args.locale.general.locale;

    let availableLangs = "";
    Array.from(args.locales.keys()).forEach((tempLang) => {
      availableLangs += `\` ${tempLang} \` `;
    });
    
    if (args.args.length > 0) {
      let newLocale = args.args[0].toLowerCase();
      if (newLocale.length != 2) {
        await args.message.channel.send(utils.getRichEmbed(args.client, 0xff0000, langLocale.localeNotExist.title, utils.replace(langLocale.localeNotExist.content, availableLangs)));
        return false;
      } else {
        let compareLang = args.langPrefs.has(args.message.guild.id) ? args.langPrefs.get(args.message.guild.id) : config.defaultLang;
        if (newLocale === compareLang) {
          await args.message.channel.send(utils.getRichEmbed(args.client, 0xff0000, langLocale.alreadySetError.title, utils.replace(langLocale.alreadySetError.content, compareLang)));
          return false;
        } else if (!args.locales.has(newLocale)) {
          await args.message.channel.send(utils.getRichEmbed(args.client, 0xff0000, langLocale.localeNotExist.title, utils.replace(langLocale.localeNotExist.content, availableLangs)));
          return false;
        }

        if (newLocale === config.defaultLang) args.langPrefs.delete(args.message.guild.id);
        else args.langPrefs.set(args.message.guild.id, newLocale);
        
        await writeFile('./localePrefs.json', utils.mapToJSON(args.langPrefs), 'utf-8');

        let newLocaleToUse = args.locales.get(args.langPrefs.has(args.message.guild.id) ? args.langPrefs.get(newLocale) : config.defaultLang);

        await args.message.channel.send(utils.getRichEmbed(args.client, 0x4286f4, newLocaleToUse.botInternal.setLocale.title, utils.replace(newLocaleToUse.botInternal.content, newLocale)));
        return true;
      }
    } else {
      let lang =  args.langPrefs.has(args.message.guild.id) ? args.langPrefs.get(args.message.guild.id) : config.defaultLang;
      await args.message.channel.send(utils.getRichEmbed(args.client, 0x4286f4, langLocale.getLocale.title, utils.replace(langLocale.getLocale.content, lang, availableLangs)));
      return true;
    }
  }
}