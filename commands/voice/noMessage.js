'use strict';

const utils = require('../../framework/utils');

module.exports = {
  name: 'noMsg',
  category: 'voice',
  aliases: ['nomessage', 'nm'],
  optArgs: ['YES|NO'],
  reqArgs: [],
  permissions: [],
  description: (locale) => { return locale['voice']['noMessage']; },
  executeCommand: async (args) => {
    let noMessageLocale = args.locale['voice']['noMessage'];

    if (!/^(yes|no|y|n|on|off)$/i.test(args.args[0])) {
        args.message.channel.send(
            utils.getRichEmbed(
                args.client,
                0xff0000,
                noMessageLocale.title,
                noMessageLocale['errors'].notOption
            )
        )
        return 'Not a valid response';
    }

    switch(args.args[0]) {
        case "yes":
        case "y":
        case "on":
            args.audioController.setMessageOnEnd(args.message.guild.id, true);
            break;
        case "no":
        case "n":
        case "off":
            args.audioController.setMessageOnEnd(args.message.guild.id, false);
            break;
    }

    args.audioController.shouldMessage(args.message.guild.id)

    args.message.channel.send(
        utils.getRichEmbed(
            args.client,
            0x404040,
            noMessageLocale.title,
            args.audioController.shouldMessage(args.message.guild.id) ?
            noMessageLocale.yes :
            noMessageLocale.no
        )
    )
    return "Success"
  }
}