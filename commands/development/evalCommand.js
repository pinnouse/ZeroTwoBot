'use strict';

const config = require('../../config.json');

const utils = require('../../framework/utils');

module.exports = {
  name: 'eval',
  category: 'development',
  aliases: ['eval'],
  optArgs: [],
  reqArgs: ['JS to evaluate'],
  unlimitedArgs: true,
  permissions: [],
  showCommand: false,
  description: (locale) => { return locale['development']['eval']; },
  executeCommand: async (args) => {
    // https://stackoverflow.com/questions/44072719/node-js-redirect-eval-output-to-string
    let result = "";
    let cons = {
        log: (out) => {
            result += out + '\n';
        }
    }
    if (config.owners.includes(args.message.author.id)) {
      let script = args.args.join(' ');
      try {
          let evaluate = eval(`((console) => { ${script} })`)(cons);
          result += evaluate || "";
          if (result.length > 1200)
            result = result.substr(0, 1200) + "...";
      } catch(e) {
          await args.message.channel.send(
              `message: \`${e.message}\`\n\nstack:\n\`\`\`${e.stack}\`\`\``
          );
      }
      await args.message.channel.send(
        `script: \`${script}\`\n\n result:\n${result ? `\`\`\`${result}\`\`\`` : '*```no output```*'}`
      );
      return true;
    } else
      await args.message.channel.send(
        utils.getRichEmbed(args.client, 0xff0000, args.locale['development']['eval'].title, args.locale['development']['eval']['errors'].owner));
    return false;
  }
}