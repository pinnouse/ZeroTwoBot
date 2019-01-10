'use strict';

const { RichEmbed } = require('discord.js');

const { homeUrl } = require('../config.json');

module.exports = {
  escapeRegExp: function(strToReplace) {
    return strToReplace.replace(/[\-\[\]\/\{\}\(\)\*\+\?\.\\\^\$\|]/g, "\\$&");
  },
  replace: function(strToReplace) {
    for(let i = 1; i < arguments.length; i++) {
      let regex = new RegExp(`\\{${i - 1}\\}`, 'g');
      strToReplace = strToReplace.replace(regex, arguments[i]);
    }

    return strToReplace;
  },
  getPermissionsString: function(permissionArray, rawString) {
    let permStr = "";
    if (!permissionArray || !permissionArray.length)
      return "";
    permissionArray.forEach((permission, index) => {
      permStr += `${(rawString===true) ? ((index>0) ? "+": "") : "` "}${
        permission
          .replace("ADMINISTRATOR", "Administrator")
          .replace("CREATE_INSTANT_INVITE", "Create Instant Invite")
          .replace("KICK_MEMBERS", "Kick Members")
          .replace("BAN_MEMBERS", "Ban Members")
          .replace("MANAGE_CHANNELS", "Manage Channels")
          .replace("MANAGE_GUILD", "Manage Server")
          .replace("ADD_REACTIONS", "Add Reactions")
          .replace("VIEW_AUDIT_LOG", "View Audit Log")
          .replace("VIEW_CHANNEL", "View Channel")
          .replace("SEND_MESSAGES", "Send Messages")
          .replace("SEND_TTS_MESSAGES", "Send Text-to-Speech Messages")
          .replace("MANAGE_MESSAGES", "Manage Messages")
          .replace("EMBED_LINKS", "Embed Links")
          .replace("ATTACH_FILES", "Attach Files")
          .replace("READ_MESSAGE_HISTORY", "Read Message History")
          .replace("MENTION_EVERYONE", "Mention Everyone")
          .replace("USE_EXTERNAL_EMOJIS", "Use External Emojis")
          .replace("CONNECT", "Connect")
          .replace("SPEAK", "Speak")
          .replace("MUTE_MEMBERS", "Mute Members")
          .replace("DEAFEN_MEMBERS", "Deafen Members")
          .replace("MOVE_MEMBERS", "Move Members")
          .replace("USE_VAD", "Use Voice Activation Detection")
          .replace("CHANGE_NICKNAME", "Change Nickname")
          .replace("MANAGE_NICKNAMES", "Manage Other Nicknames")
          .replace("MANAGE_ROLES", "Manage Roles")
          .replace("MANAGE_WEBHOOKS", "Manage Webhooks")
          .replace("MANAGE_EMOJIS", "Manage Emojis")
        } ${(rawString===true) ? "" : " ` "}`;
    });

    return permStr;
  },
  mapToJSON: function(map) {
    return JSON.stringify([...map]);
  },
  JSONToMap: function(json) {
    return new Map(JSON.parse(json));
  },
  isInt: function(value) {
    return !isNaN(value);
  },
  getCommandUsage: function(prefix, command, commandLayoutLocale) {
    let argsLayout = "";
    if (command.reqArgs) {
      command.reqArgs.forEach(arg => {
        argsLayout += this.replace(commandLayoutLocale.requiredArgs, arg);
      });
    }

    if (command.optArgs) {
      command.optArgs.forEach(arg => {
        argsLayout += this.replace(commandLayoutLocale.optionalArgs, arg);
      });
    }

    let usage = prefix;
    if (command.superCmd) {
      command.superCmd.sort().forEach((alias, index) => {
        if (index > 0)
          usage += commandLayoutLocale.divider;
        usage += `${alias}`;
      });
      usage += " ";
    }
    command.aliases.sort().forEach((alias, index) => {
      if (index > 0)
        usage += commandLayoutLocale.divider;
      usage += `${alias}`;
    });
    usage += " ";
    return this.replace(commandLayoutLocale.content, usage, argsLayout);
  },
  getRichEmbed: function(client, color, title, description) {
    return new RichEmbed()
      .setColor(color || 0xffffff)
      .setAuthor(title || client.user.username, client.user.displayAvatarURL, homeUrl || "")
      .setDescription(description || "");
  },
  getVoiceChannel: function(client, users) {
    if (users.constructor === Array) {
      let channels = new Map();
      users.forEach(uid => {
        let channel = client.channels.filter(channel => channel.type === 'voice' && channel.members.find(member => member.id === uid)).first();
        if (channel)
          channels.set(uid, channel);
      });
  
      return (channels.size > 0) ? channels : false;
    } else {
      return client.channels.filter(channel => channel.type === 'voice' && channel.members.find(member => member.id === users)).first() || false;
    }
  }
}