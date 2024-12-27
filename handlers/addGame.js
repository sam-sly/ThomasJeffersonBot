const {
  Colors,
  ChannelType,
  Guild,
} = require("discord.js");
const Game = require("../models/game.js");

/**
 * @param {String} gameName
 * @param {String} iconURL
 * @param {Guild} guild
 * @returns {
 *  {GuildEmoji} emoji
 *  {TextChannel} channel
 *  {Role} role
 * }
 */
module.exports = async (gameName, iconURL, guild) => {
  let emoji;
  try {
    emoji = await guild.emojis.create({
      name: gameName.replace(/\s+/g, '').replace(/[^a-zA-Z0-9-_]/g, ''),
      attachment: iconURL,
    });
  } catch (error) {
    console.error(error);
    return {
      error: error,
    };
  }
  console.log(`Created new emoji ${emoji.name}.`);

  const role = await guild.roles.create({
    name: gameName,
    color: Colors.Aqua,
    icon: (guild.premiumTier >= 2) ? emoji : null,
  });
  console.log(`Created new role ${role.name}.`);

  const gamesCategory = guild.channels.cache.get(process.env.GAMES_CATEGORY);

  const channel = await guild.channels.create({
    name: `💠・${gameName.toLowerCase().replace(/\s+/g, '-').replace(/[^a-zA-Z0-9-_]/g, '')}`,
    type: ChannelType.GuildText,
    permissionOverwrites: gamesCategory.permissionOverwrites.cache,
    parent: gamesCategory,
  });
  console.log(`Created new channel ${channel.name}.`);
  await channel.permissionOverwrites.create(role, {
    ViewChannel: true,
    ManageWebhooks: true,
  });
  console.log(`Added permissions for ${role.name} to ${channel.name}.`);

  // TODO: send message explaining following anouncements in channel

  await Game.create({
    name: gameName,
    emojiId: emoji.id,
    roleId: role.id,
    channelId: channel.id,
  });

  return {
    emoji: emoji,
    channel: channel,
    role: role,
  };
};
