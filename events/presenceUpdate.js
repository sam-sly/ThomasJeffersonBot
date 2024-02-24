const {
  Events,
  Presence,
} = require('discord.js');
const GamingChannel = require('../models/gamingChannel');
const updateChannelActivity = require('../handlers/updateChannelActivity');
const reportTheError = require('../utils/reportTheError');

module.exports = {
	name: Events.PresenceUpdate,
  /**
   * @param {Presence} oldPresence
   * @param {Presence} newPresence
   */
	execute: async (oldPresence, newPresence) => {
    try {
      if ((oldPresence && newPresence) && JSON.stringify(oldPresence.activities) === JSON.stringify(newPresence.activities)) return;

      const validPresence = newPresence || oldPresence;
      const member = validPresence.guild.members.cache.get(validPresence.userId);
      const channel = member.voice?.channel;

      if (!channel) return;

      const activeChannel = await GamingChannel.findOne({ id: channel.id }).exec();

      if (!activeChannel) return;
      // console.log('Old Presence');
      // console.log(oldPresence);
      // console.log('New Presence');
      // console.log(newPresence);
      
      await updateChannelActivity(channel, activeChannel);
    } catch (error) {
      console.log('Old Presence');
      console.log(oldPresence);
      console.log('New Presence');
      console.log(newPresence);
      await reportTheError(error, '❌ Error during PresenceUpdate event.', null, newPresence.guild);
    }
  },
};
