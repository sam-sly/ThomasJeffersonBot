const {
  Events,
  Presence,
} = require('discord.js');
const { readFile } = require('../utils/json');
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
      const channel = member.voice.channel;

      if (!channel) return;

      const { active } = await readFile('data/dynamicChannels.json');

      const indexOfActiveChannel = active.findIndex((c) => c.id === channel.id);

      if (indexOfActiveChannel === -1) return;
      
      await updateChannelActivity(channel, indexOfActiveChannel);
    } catch (error) {
      console.log('Old Presence');
      console.log(oldPresence);
      console.log('New Presence');
      console.log(newPresence);
      await reportTheError(error, '❌ Error during PresenceUpdate event.', null, newPresence.guild);
    }
  },
};
