const { Client, IntentsBitField } = require('discord.js')

const bot = new Client({
  intents: [
    IntentsBitField.Flags.Guilds,
    IntentsBitField.Flags.GuildMembers,
    IntentsBitField.Flags.GuildMessages,
    IntentsBitField.Flags.MessageContent,
  ]
})

bot.login(
  'MTE2MTA1MzA0ODgyMzYyMzc5Mw.GfpUQ_.l0PKtaRY8G5x1dYqkj7gLbswsbmddeics5CKPY'
)
