'use strict';

const request = require('request-promise-native');

const Jimp = require('jimp');

const fs = require('fs');

const { oapi } = require('../../config.json');

module.exports = {
  name: "osu!Player",
  category: "osu!",
  superCmd: ['o', 'osu'],
  aliases: ['p', 'player'],
  optArgs: ['play mode (OSU|TAIKO|CATCH|MANIA)'],
  reqArgs: ['player name or id'],
  description: (locale) => { return locale['osu']['player']; },
  executeCommand: async (args) => {
    let user = args.args[(args.args.length > 1) ? 1 : 0];
    let mode = (args.args.length > 1) ? args.args[0] : 0;
    var options = {
      uri: 'https://osu.ppy.sh/api/get_user',
      qs: {
        k: oapi,
        u: user,
        m: mode
      }, headers: {
        'User-Agent': 'Request'
      },
      json: true
    };
    try {
      let response = (await request(options))[0];

      var imgUrl = `resources/temp/${response.user_id}.png`;
      new Jimp(520, 140, 0x111111ff, (err, image) => {
        Jimp.read(`https://a.ppy.sh/${response.user_id}`).then(avatar => {
          Jimp.read('resources/avatar_mask.png').then(mask => {
            image.blit(avatar.resize(100, 100).mask(mask), 20, 20);
          });
          return Jimp.loadFont('resources/Exo2_32i.fnt')
        }).then(font => {
          image.print(font, 140, 20, `${response.username} #${response.user_id}`);
          return Jimp.read(`https://osu.ppy.sh/images/flags/${response.country}.png`);
        }).then(flag => {
          image.blit(flag.resize(60, 40), 146, 80);
          return Jimp.loadFont('resources/Exo2_28.fnt');
        }).then(font => {
          return image
            .print(font, 212, 84, `#${response.pp_rank.toLocaleString('en')}  ${response.pp_raw.toLocaleString('en')}pp`)
            .write(imgUrl);
        }).then(rValue => {
          console.log(rValue);
          return args.message.channel.send({
            files: [{
              attachment: imgUrl,
              name: `${response.user_id}.png`
            }]
          });
        }).then(() => {
          fs.unlink(imgUrl);
        }).catch(error => {
          console.log(error);
        });
      });

      return true;
    } catch (e) {
      return false;
    }
  }
}