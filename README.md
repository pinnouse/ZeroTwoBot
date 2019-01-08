# ZeroTwoBot
### Designed and created by: pinnouse
**[Website](http://gnowbros.com/zerotwo)**

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
~~For a working bot, you can hit up: [ReinaBot](http://www.gnowbros.com/reinabot)~~ (Depracated)
<br />
<br />
Working and functioning, not like the super bestest, but it sorta kinda maybe works

## Features
### (or lack thereof)
- Music (youtube)
- Chatbot
- Anime (AniList)
- Osu! (Players, WIP)
- League of Legends (WIP)
- everything is WIP, even this README

## Self-Hosting
### (Installation)

Prerequisites:
- ffmpeg
- [nodejs](https://nodejs.org)

### Configuration
The bot requires a configuration file named ` config.json ` to be placed in the root directory.
<br />
Example:
```js
{
    "prefix": "$",
    "token": "INSERT_DISCORD_BOT_TOKEN",
    "gapi": "GOOGLE_API_KEY", //YouTube functionality
    "oapi": "OSU_API_KEY", //osu! functionality
    "owners": ["ARRAY_OF_OWNER_IDS (can be obtained by doing '\\@username#tag'"], //So you can use the kill command
    "chatbotUrl": "URL_OF_CHATBOT" //Configured like ReinaChat (https://github.com/pinnoues/ReinaChat)
    "serverPort": 8080, //Port for the builtin backend HTML server
    "accessKey": "SECRET", //Set a key to keep the bot server safe passed as a GET 'key=' argument
    "defaultLan": "en" //Set to whichever language is supported (found in ./locales/)
}
```

## Contact

> HMU on Discord: **pinnouse#7766**
>
> Join the support channel: ~~[Doesn't exist yet]()~~
>
> YouTube channel: [link](https://www.youtube.com/channel/UCJSOrfnWGCBDAnpnxpIjsBQ)

## License
[license](./LICENSE)
