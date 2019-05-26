'use strict';

const request = require('request-promise-native');

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
  executeCommand: async (args) => {

    let re = new RegExp("^(?:http[s]?:\/\/osu.ppy.sh\/beatmapsets\/[0-9]+#osu\/|http[s]?:\/\/osu.ppy.sh\/osu\/|http[s]?:\/\/osu.ppy.sh\/b\/)?([0-9]+)");

    if (re.test(args.args[0])) {
      // parse args
      let beatMap = re.exec(args.args[0])[1];

      var options = {
        uri: `https://osu.ppy.sh/osu/${beatMap}`, 
        method: "GET",
        encoding: "binary",
        headers: {
          'User-Agent': 'Request'
        }
      }

      let mods = ojsama.modbits.none;
      let accPercent, combo, nmisses;
      console.log(args.args);
      for(let i = 1; i < args.args.length; i++) {
        if (args.args[i].startsWith("+"))
          mods = ojsama.modbits.from_string(args.args[i].slice(1) || "");
        else if (args.args[i].endsWith("%"))
          accPercent = parseFloat(args.args[i]);
        else if (args.args[i].endsWith("x"))
          combo = parseInt(args.args[i]);
        else if (args.args[i].endsWith("m"))
          nmisses = parseInt(args.args[i]);
      }

      var response = await request(options);
      if (response && response.length) {
        let parser = new ojsama.parser().feed(response);

        let map = parser.map;

        let stars = new ojsama.diff().calc({map: map, mods: mods});

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

        args.message.channel.send(
          utils.getRichEmbed(
            args.client,
            0xcc5288,
            args.locale['osu']['map'].title,
            utils.replace(
              args.locale['osu']['map'].finished,
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

        return true;
      } else {
        args.message.channel.send(
          utils.getRichEmbed(
            args.client,
            0xff0000,
            args.locale['osu']['map'].title,
            args.locale['osu']['map']['errors'].difficultyNotFound
          )
        );
      }
    }

  }
}