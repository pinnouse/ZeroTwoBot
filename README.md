# ZeroTwoBot
### Designed and created by:
[pinnouse](https://github.com/pinnouse/ZeroTwoBot)

[![Build Status](https://travis-ci.com/pinnouse/ZeroTwoBot.svg?branch=master)](https://travis-ci.com/pinnouse/ZeroTwoBot) [![Dependencies](https://david-dm.org/pinnouse/ZeroTwoBot.svg)](https://david-dm.org/pinnouse/ZeroTwoBot) [![CodeFactor](https://www.codefactor.io/repository/github/pinnouse/zerotwobot/badge)](https://www.codefactor.io/repository/github/pinnouse/zerotwobot)

**[Website](http://zerotwo.gnowbros.com)**

### Table of Contents
[Description](#description)<br />
[Features](#features)<br />
[Self-Hosting](#self-hosting)<br />
[Contact](#contact)<br />
[License](#license)

## Description
You have come across my wonderful, beautiful Discord bot. Based off the star darling in the anime: Darling in the FranXX, this bot is packed to the brim with unfinished functionality.
<br />
<br />
Working and functioning, not like the super bestest, but it sorta kinda maybe works.
<br />
Built using the [DiscordJS](https://discord.js.org) library.

## Features
### (or lack thereof)
- Music (youtube)
- Chatbot
- 8 Ball
- Anime (AniList)
- Osu! (Players, WIP)
- League of Legends (WIP)

For a full list of commands, visit the website: [here](http://zerotwo.gnowbros.com)

## Self-Hosting
### Installation

Prerequisites:
- [ffmpeg](https://www.ffmpeg.org)
- [nodejs](https://nodejs.org)

### Configuration
The bot requires a configuration file named ` config.json ` to be placed in the root directory.
<br />
Example (do not include the `"// ..."`):

```js
{
    "prefix"      : "?", //Default prefix, change if you want
    "homeUrl"     : "OPTIONAL_HOME_URL", //Website URL for RichEmbed author links
    "token"       : "DISCORD_BOT_TOKEN", //https://discordapp.com/developers
    "gapi"        : "GOOGLE_API_KEY", //YouTube functionality
    "oapi"        : "OSU_API_KEY", //osu! functionality
    "owners"      : ["ARRAY_OF_OWNER_IDS (can be obtained by doing '\@username#tag'"], //So you can use the kill command
    "chatbotUrl"  : "URL_OF_CHATBOT" //Configured like ReinaChat (https://github.com/pinnoues/ReinaChat)
    "serverPort"  : 8080, //Port for the builtin backend HTML server
    "accessKey"   : "SECRET", //Set a key to keep the bot server safe, passed as a GET 'key=' argument
    "defaultLang" : "en" //Set to whichever language is supported (found in ./locales/)
}
```

### Testing
If testing the bot, the script you should use is: `node bot.js -t`
<br />
**Note:** This requires you to have in your ` config.json `:

```js
{
    ...
    "testToken": "DISCORD_BOT_TOKEN"
    ...
}
```

## Contact

> **Discord:** `pinnouse#7766`
>
> **Support Channel:** ~~[Doesn't exist yet]()~~
>
> **Home Website:** [link](http://gnowbros.com)
>
> **Email:** Just message me on Discord 👍

## License
GPL v3

[license](./LICENSE)
