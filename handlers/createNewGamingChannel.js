const {
  VoiceChannel,
  CategoryChannel,
  VoiceState,
  ChannelType,
} = require('discord.js');
const GamingChannel = require('../models/gamingChannel.js');

const skipActivities = ['Custom Status', 'Spotify'];

const SILENT_FLAG = 4096;

/**
 * @param {VoiceState} newState
 */
module.exports = async (newState) => {
  /**
   * @type {CategoryChannel} category
   */
  const category = newState.channel.parent;

  var number = 0;
  for (let i = 1; i < 100; i++) {
    if (await GamingChannel.findOne({ number: i }).exec() === null) {
      number = i;
      break;
    }
  }

  const channelDetails = await GamingChannel.findOne({ id: newState.channelId });

  channelDetails.name = `Ready Player ${number}`;
  channelDetails.icon = '🎮';
  channelDetails.fullName = `🎮・Ready Player ${number}`;
  channelDetails.number = number;
  channelDetails.ownerId = newState.member.id;

  for (const activity of newState.member.presence.activities) {
    if (skipActivities.includes(activity.name)) continue;
    channelDetails.activity = activity.name;
    break;
  }

  channelDetails.nameChanges = [Date.now()];
  await channelDetails.save();

  /**
   * @type {VoiceChannel} newChannel
   */
  const newChannel = await newState.guild.channels.create({
    name: '➕・New Game Voice',
    type: ChannelType.GuildVoice,
    parent: category,
    permissionOverwrites: category.permissionOverwrites.cache,
  });
  await newChannel.permissionOverwrites.create(newState.guild.roles.cache.find((r) => {
    return r.id === process.env.GUEST_ROLE_ID;
  }), { 'ViewChannel': false });

  await GamingChannel.create({
    name: 'New Game Voice',
    icon: '➕',
    fullName: newChannel.name,
    number: 0,
    id: newChannel.id,
  });

  await newState.channel.setName(channelDetails.activity
      ? `${channelDetails.icon}・${channelDetails.activity}`
      : `${channelDetails.icon}・${channelDetails.name}`
  );
  await newState.channel.permissionOverwrites.create(newState.guild.roles.cache.find((r) => {
    return r.id === process.env.GUEST_ROLE_ID;
  }), { 'ViewChannel': true });

  await newState.channel.send({
    content: `Owner: __**${newState.member.displayName}**__`,
    flags: [ SILENT_FLAG ]
  });

  // TODO: add voice channel controls to text chat

  console.log(`Created new channel "${channelDetails.icon}・${channelDetails.name}".`);
};
