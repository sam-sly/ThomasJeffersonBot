const {
  VoiceChannel,
  CategoryChannel,
  VoiceState,
  ChannelType,
  EmbedBuilder,
} = require('discord.js');
const { readFile, writeFile } = require("../utils/json");

/**
 * @param {VoiceState} newState
 */
module.exports = async (newState) => {
  const { active, templates, skipActivities } = await readFile('data/dynamicChannels.json');

  /**
   * @type {CategoryChannel} category
   */
  const category = newState.channel.parent;
  const availableTemplates = [...templates];

  for (const channel of active) {
    const index = availableTemplates.findIndex((c) => channel.name === c.name);
    if (index > -1) {
      availableTemplates.splice(index, 1);
    }
  }

  let channelDetails = availableTemplates[Math.floor(Math.random()*availableTemplates.length)];
  channelDetails.activity = null;

  for (const activity of newState.member.presence.activities) {
    if (skipActivities.includes(activity.name)) continue;
    channelDetails.activity = {
      icon: '🎮',
      name: activity.name,
    };
    break;
  }

  /**
   * @type {VoiceChannel} newChannel
   */
  const newChannel = await newState.guild.channels.create({
    name: (channelDetails.activity)
      ? `${channelDetails.activity.icon}・${channelDetails.activity.name}`
      : `${channelDetails.icon}・${channelDetails.name}`,
    type: ChannelType.GuildVoice,
    parent: category,
    permissionOverwrites: category.permissionOverwrites.cache,
  });

  active.push({
    id: newChannel.id,
    icon: channelDetails.icon,
    name: channelDetails.name,
    activity: channelDetails.activity,
    influence: 'majority',
    owner: newState.member,
  });

  await writeFile({ active, templates, skipActivities }, 'data/dynamicChannels.json');

  const historyEmbed = new EmbedBuilder()
    .setTitle(channelDetails.name)
    .setDescription(`*${channelDetails.location}*\n\n${channelDetails.description}`);

  await newChannel.messages.channel.send({
    embeds: [ historyEmbed ],
  });

  await newChannel.messages.channel.send({ content: `Owner: ${newState.member}` });

  // TODO: add voice channel controls to text chat

  await newState.setChannel(newChannel);

  console.log(`Created new channel "${channelDetails.icon}・${channelDetails.name}".`);
};
