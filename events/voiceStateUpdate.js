const {
  Events,
  VoiceState,
} = require('discord.js');
const reportTheError = require('../utils/reportTheError');
const SocialChannel = require('../models/socialChannel');
const GamingChannel = require('../models/gamingChannel');
const createNewSocialChannel = require('../handlers/createNewSocialChannel');
const createNewGamingChannel = require('../handlers/createNewGamingChannel');
const updateChannelActivity = require('../handlers/updateChannelActivity');
const userJoinedLobbyChannel = require('../handlers/userJoinedLobbyChannel');
const ButtonListener = require('../models/buttonListener');

const userJoinedGuildChannel = async (newState) => {
  console.log(`${newState.member.displayName} joined ${newState.channel.name}.`);

  // User joined the empty Social channel
  if (await SocialChannel.findOne({ id: newState.channelId }).exec() && newState.channel?.members.size === 1) {
    await createNewSocialChannel(newState);
    return;
  }

  // User joined the Create Room channel
  if (await GamingChannel.findOne({ number: 0, id: newState.channelId }).exec()) {
    await createNewGamingChannel(newState);
    return;
  }

  // User joined the Lobby channel
  if (newState.channelId === process.env.LOBBY_CHANNEL) {
    await userJoinedLobbyChannel(newState);
    return;
  }

  // User joined an active gaming channel
  const gamingChannelJoined = await GamingChannel.findOne({ number: { $ne: 0}, id: newState.channelId }).exec();
  if (gamingChannelJoined) {
    await updateChannelActivity(newState.channel, gamingChannelJoined);
    return;
  }
}

const userLeftGuildChannel = async (oldState) => {
  console.log(`${oldState.member.displayName} left ${oldState.channel.name}.`);

  // User left the Lobby channel
  if (oldState.channelId === process.env.LOBBY_CHANNEL) {
    const button = await ButtonListener.findOneAndDelete({ id: oldState.member.id }).exec();

    if (!button) return;

    const message = await oldState.channel.messages.fetch(button.messageId);
    await message.delete();

    return;
  }

  // User left an active gaming channel
  const gamingChannelLeft = await GamingChannel.findOne({ number: { $ne: 0 }, id: oldState.channelId }).exec();
  if (gamingChannelLeft) {
    if (oldState.channel.members.size > 0) {
      await updateChannelActivity(oldState.channel, gamingChannelLeft)
      return;
    }
    // Otherwise, the channel is empty
    console.log(`Deleting ${gamingChannelLeft.icon}・${gamingChannelLeft.name}.`);
    await oldState.channel.delete();

    if (gamingChannelLeft.updateQueue) clearTimeout(gamingChannelLeft.updateQueue);
    await GamingChannel.deleteOne({ id: gamingChannelLeft.id });
    return;
  }

  // User left an active social channel
  const socialChannelLeft = await SocialChannel.findOne({ isActive: true, id: oldState.channelId }).exec();
  if (socialChannelLeft && oldState.channel.members.size === 0) {
    console.log(`Deleting ${socialChannelLeft.icon}・${socialChannelLeft.name}.`);
    await oldState.channel.delete();

    socialChannelLeft.id = null;
    socialChannelLeft.isActive = false;

    await socialChannelLeft.save();
    return;
  }
}

module.exports = {
  name: Events.VoiceStateUpdate,
  /**
   * @param {VoiceState} oldState
   * @param {VoiceState} newState
   */
  execute: async (oldState, newState) => {
    try {
      if (newState.channelId === oldState.channelId) return;

      if (oldState.channelId) await userLeftGuildChannel(oldState);
      if (newState.channelId) await userJoinedGuildChannel(newState);
    } catch (error) {
      await reportTheError(error, '❌ Error during VoiceStateUpdate event.', null, oldState.guild);
    }
  },
};
