const {
  VoiceChannel,
  CategoryChannel,
  ChannelType,
  EmbedBuilder,
} = require('discord.js');
const SocialChannel = require('../models/socialChannel.js');
const GamingChannel = require('../models/gamingChannel.js');
const fixChannelPositions = require('../utils/fixChannelPositions.js');

const SILENT_FLAG = 4096;

/**
 * @param {VoiceState} newState
 */
module.exports = async (category) => {
  /**
   * @type {CategoryChannel} category
   */
  const activeSocialChannels = await SocialChannel.find({ isActive: true }).exec();
  const activeGamingChannels = await GamingChannel.find().exec();

  const availableTemplates = await SocialChannel.find({ isActive: false }).exec();
  const channelDetails = availableTemplates[Math.floor(Math.random()*availableTemplates.length)];

  channelDetails.isActive = true;
  await channelDetails.save();

  /**
   * @type {VoiceChannel} newChannel
   */
  const newChannel = await category.guild.channels.create({
    name: channelDetails.fullName,
    type: ChannelType.GuildVoice,
    parent: category,
    permissionOverwrites: category.permissionOverwrites.cache,
  });

  channelDetails.id = newChannel.id,
  await channelDetails.save();

  activeSocialChannels.push(channelDetails);
  fixChannelPositions(category, activeSocialChannels, activeGamingChannels);

  const historyEmbed = new EmbedBuilder()
    .setDescription(`## ${channelDetails.name}\n*${channelDetails.location}*\n\n${channelDetails.description}`);

  await newChannel.messages.channel.send({
    embeds: [ historyEmbed ],
    flags: [ SILENT_FLAG ],
  });

  console.log(`Created new channel "${channelDetails.fullName}".`);
};
