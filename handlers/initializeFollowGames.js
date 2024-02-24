const {
  ButtonBuilder,
  ButtonStyle,
  ActionRowBuilder,
} = require('discord.js')
const ButtonListener = require('../models/buttonListener');
const Game = require('../models/game');
const refreshFollowGames = require('./refreshFollowGames');

const SILENT_FLAG = 4096;

module.exports = async (client) => {
  const guild = client.guilds.cache.get(process.env.GUILD_ID);

  console.log('Updating subscriber counts on all games...');

  const games = await Game.find().exec();

  for (const game of games) {
    const role = guild.roles.cache.get(game.roleId);

    if (!role) {
      console.log(`Role not found for game ${game.name}.`);
      continue;
    }

    const subscribers = role.members.size;
    game.subscribers = subscribers;
    await game.save();
    
    console.log(`Updated ${game.name} subscriber count to ${subscribers}.`);
  }

  const followGamesChannel = guild.channels.cache.get(process.env.FOLLOW_GAMES_CHANNEL);
  
  const messagesMap = await followGamesChannel.messages.fetch();
  const messages = Array.from(messagesMap, ([id, message]) => (message)).reverse();

  console.log('Updating follow-games header message...');

  const introMessage = `# ⭐️ Welcome to the Game Selection Hub! ⭐️\n`
    .concat(`## 💠 Select Your Games\n`)
    .concat(`**Browse the list below** and click on the buttons corresponding to the games you play. Gain access to exclusive channels and stay up-to-date with the latest discussions and updates.\n\n`)
    .concat(`## 📮 Request New Games\n`)
    .concat(`**Can't find your favorite game?** 🤔 Click the button below to request its addition! Our moderators will review your suggestion and add it if it aligns with our community's interests.`)
    .concat(`\n​`);

  const newGameButton = new ButtonBuilder()
    .setCustomId('request-new-game')
    .setLabel('➕ Request New Game')
    .setStyle(ButtonStyle.Primary);

  const actionRow = new ActionRowBuilder().addComponents(newGameButton);
  let headerMessage;

  if (messages.length === 0) {
    headerMessage = await followGamesChannel.send({
      content: introMessage,
      embeds: [],
      components: [ actionRow ],
      flags: [ SILENT_FLAG ],
    });

    await ButtonListener.create({
      id: 'request-new-game',
      messageId: headerMessage.id,
      callbackPath: 'followGames',
      callbackName: 'createRequest',
    });
  } else {
    headerMessage = await messages[0].edit({
      content: introMessage,
      embeds: [],
      components: [ actionRow ],
      flags: [ SILENT_FLAG ],
    });

    const newGameListener = await ButtonListener.findOne({ id: 'request-new-game', messageId: headerMessage.id }).exec();

    if (!newGameListener) {
      await ButtonListener.create({
        id: 'request-new-game',
        messageId: headerMessage.id,
        callbackPath: 'gameRequest',
        callbackName: 'createRequest',
      });
    }
  }

  console.log('Updating game buttons...');
  await refreshFollowGames(guild);
  console.log('⭐️ Follow games initialized.')
  return;
};
