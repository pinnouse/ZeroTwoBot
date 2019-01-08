# Locales README
Comes prepackaged with an English set: [EN](en/)
&nbsp;

## Creating a locale
Keep in mind the following:
- Locale id must be 2 characters long (lowercase)
- Placeholders can be specified like C# ex: `"My name is {0} nice to meet you."`
- Emotes can be stated in their plaintext: `1 + 1 = 3 :upside_down:`

### Commands
Command locales, stored in:
- `general.json`
- `anime.json`
- `moderation.json`
- `nsfw.json`
- `osu.json`
- `voice.json`

Example:

```js
{
  "8ball": {
    "title": "COMMAND_TITLE",
    "description": "COMMAND_DESCRIPTION",
    "responses": []
  },
  "help": {
    "title": "COMMAND_TITLE",
    "description": "COMMAND_DESCRIPTION",
    ...
  }, ... //And so on and so forth..
}
```

For the command impermissible messages: `botInternal.json`
<br />
Example (en):

```js
{
  "errorTitle": "NOT ALLOWED",
  "notPermissible": ":no_entry_sign: You require the following permissions to use this command: {0}",
  "tooFewArgs": "Not enough parameters specified, correct usage:\n  {0}",
  "tooManyArgs": "Too many parameters specified, correct usage:\n  {0}"
}
```

### TODO: full list of locales and what they do