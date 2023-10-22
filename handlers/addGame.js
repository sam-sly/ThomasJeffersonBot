const {
  Colors,
  ChannelType,
  Guild,
} = require("discord.js");
const { writeFile } = require("../utils/json");

/**
 * @param {String} gameName
 * @param {String} iconURL
 * @param {Array<Object>} games
 * @param {Array<Object>} channels
 * @param {Guild} guild
 * @returns {
 *  {GuildEmoji} emoji
 *  {TextChannel} channel
 *  {Role} role
 * }
 */
module.exports = async (gameName, iconURL, games, channels, guild) => {
  let emoji;
  try {
    emoji = await guild.emojis.create({
      name: gameName.replace(/\s+/g, '').replace(/[^a-zA-Z0-9-_]/g,''),
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
    icon: (guild.premiumTier >= 2)? emoji : null,
  });
  console.log(`Created new role ${role.name}.`);

  const gamesCategory = guild.channels.cache.get(channels.games.id);

  const channel = await guild.channels.create({
    name: `💠・${gameName.toLowerCase().replace(/\s+/g,'-').replace(/[^a-zA-Z0-9-_]/g,'')}`,
    type: ChannelType.GuildText,
    permissionOverwrites: gamesCategory.permissionOverwrites.cache,
    parent: gamesCategory,
  });
  await channel.permissionOverwrites.create(role, {
    ViewChannel: true,
    ManageWebhooks: true,
  });
  console.log(`Created new channel ${channel.name}.`);

  // TODO: send message explaining following anouncements in channel

  games.push({
    name: gameName,
    emoji: emoji,
    role: role,
    channel: channel,
  });

  games.sort((a, b) => {
    return (a.name.toLowerCase() > b.name.toLowerCase()) ? 1 : ((b.name.toLowerCase() > a.name.toLowerCase()) ? -1 : 0)
  });

  await writeFile({ games }, 'data/games.json');

  return {
    emoji: emoji,
    channel: channel,
    role: role,
  };
};
