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
  
  for (const message of messagesMap.values()) {
    await message.delete();
  }

  await refreshFollowGames(guild);
  console.log('⭐️ Follow games initialized.')
  return;
};
