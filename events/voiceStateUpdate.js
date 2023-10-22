const {
  Events,
  VoiceState,
} = require('discord.js');
const { readFile, writeFile } = require('../utils/json');
const reportTheError = require('../utils/reportTheError');
const userJoinedCreateRoomChannel = require('../handlers/userJoinedCreateRoomChannel');
const updateChannelActivity = require('../handlers/updateChannelActivity');

module.exports = {
  name: Events.VoiceStateUpdate,
  /**
   * @param {VoiceState} oldState
   * @param {VoiceState} newState
   */
  execute: async (oldState, newState) => {
    try {
      const { channels } = await readFile('data/settings.json');
      const { active, templates, skipActivities } = await readFile('data/dynamicChannels.json');

      if (newState.channelId === oldState.channelId) return;

      // User left an active dynamic channel
      const indexOfActiveChannelLeft = active.findIndex((c) => c.id === oldState.channelId);
      if (indexOfActiveChannelLeft > -1) {
        if (oldState.channel.members.size > 0) {
          await updateChannelActivity(oldState.channel, indexOfActiveChannelLeft)
          return;
        }
        // Otherwise, the channel is empty
        console.log(`Deleting ${active[indexOfActiveChannelLeft].icon}・${active[indexOfActiveChannelLeft].name}.`);
        await oldState.channel.delete();
        active.splice(indexOfActiveChannelLeft, 1);

        await writeFile({ active, templates, skipActivities }, 'data/dynamicChannels.json');
      }

      // User joined an active dynamic channel
      const indexOfActiveChannelJoined = active.findIndex((c) => c.id === newState.channelId);
      if (indexOfActiveChannelJoined > -1) {
        await updateChannelActivity(newState.channel, indexOfActiveChannelJoined);
      }

      // User joined the Create Room channel
      else if (newState.channelId === channels.createRoom.id) {
        await userJoinedCreateRoomChannel(newState);
      }
    } catch (error) {
      await reportTheError(error, '❌ Error during VoiceStateUpdate event.', null, oldState.guild);
    }
  },
};
