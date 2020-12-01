'use strict';

const axios = require('axios');

const utils = require('../../framework/utils');

const ojsama = require('ojsama');

const utf8 = require('utf8');

module.exports = {
  name: "osu!Map",
  category: "osu!",
  superCmd: ['o', 'osu'],
  aliases: ['m', 'map'],
  optArgs: ['mods (+HDDT, etc.)', 'acc (98.7%)', 'combo (104x)', 'misses (3m)'],
  reqArgs: ['osu! difficulty'],
  description: (locale) => { return locale['osu']['map']; },
  executeCommand: async ({ args, message, client, locale }) => {

    let re = new RegExp("^(?:http[s]?:\/\/osu.ppy.sh\/beatmapsets\/[0-9]+#osu\/|http[s]?:\/\/osu.ppy.sh\/osu\/|http[s]?:\/\/osu.ppy.sh\/b\/)?([0-9]+)");

    if (re.test(args[0])) {
      // parse args
      let beatMap = re.exec(args[0])[1];

      let mods = ojsama.modbits.none;
      let accPercent, combo, nmisses;
      // console.log(args);
      for (let i = 1; i < args.length; i++) {
        if (args[i].startsWith("+"))
          mods = ojsama.modbits.from_string(args[i].slice(1) || "");
        else if (args[i].endsWith("%"))
          accPercent = parseFloat(args[i]);
        else if (args[i].endsWith("x"))
          combo = parseInt(args[i]);
        else if (args[i].endsWith("m"))
          nmisses = parseInt(args[i]);
      }

      try {
        const { status, data: response } = await axios({
          url: `https://osu.ppy.sh/osu/${beatMap}`,
          responseEncoding: 'binary',
          headers: {
            'User-Agent': `Discord Bot ${client.user.tag}`,
          }
        });
        if (status === 200) {
          let parser = new ojsama.parser().feed(response);

          let map = parser.map;

          let stars = new ojsama.diff().calc({ map: map, mods: mods });

          let pp = ojsama.ppv2({
            stars: stars,
            combo: combo,
            nmiss: nmisses,
            acc_percent: accPercent
          });

          var max_combo = map.max_combo();
          combo = combo || max_combo;

          var mapTitle = map.artist + " - " + map.title;
          if (map.title_unicode || map.artist_unicode) {
            mapTitle += " (" + utf8.decode(map.artist_unicode) + " - "
              + utf8.decode(map.title_unicode) + ")";
          }
          mapTitle += ` [ ${map.version} ] `;

          await message.channel.send(
            utils.getRichEmbed(
              client,
              0xcc5288,
              locale['osu']['map'].title,
              utils.replace(
                locale['osu']['map'].finished,
                utils.escapeRegExp(mapTitle),
                utils.escapeRegExp(map.creator),
                `https://osu.ppy.sh/b/${beatMap}`,
                pp.total.toFixed(2),
                max_combo + 'x',
                map.ar.toFixed(2),
                map.od.toFixed(2),
                map.cs.toFixed(2),
                map.hp.toFixed(2)
              )
            )
          )
        }
      } catch (e) {
        message.channel.send(
          utils.getRichEmbed(
            client,
            0xff0000,
            locale['osu']['map'].title,
            locale['osu']['map']['errors'].difficultyNotFound
          )
        );

        return false;
      }

      return true;
    } else {
      message.channel.send(
        utils.getRichEmbed(
          client,
          0xff0000,
          locale['osu']['map'].title,
          locale['osu']['map']['errors'].difficultyNotFound
        )
      );
    }
  }
}