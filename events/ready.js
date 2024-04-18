const {
  Events,
  Client,
  EmbedBuilder,
} = require('discord.js');
const cleanUpVoiceChannels = require('../handlers/cleanUpVoiceChannels');
const initializeFollowGames = require('../handlers/initializeFollowGames');

const SILENT_FLAG = 4096;

module.exports = {
	name: Events.ClientReady,
	once: true,
  /**
   * @param {Client} client
   */
	execute: async (client) => {
    console.log('Starting up...');

    const statusStarting = new EmbedBuilder()
      .setDescription(`*Bot Status*\n# 🟡 ​ ​ Restarting...\n​\nI have been restarted either due to an update or an error.  I am sorry for the inconvenience.  I will be up and running again soon!\n\n**Almost ready...**`)
      .setColor('Yellow');

    const message = await client.channels.cache.get(process.env.MODERATOR_CHANNEL).send({
      embeds: [ statusStarting ],
      flags: [ SILENT_FLAG ],
    });

    await cleanUpVoiceChannels(client);
    await initializeFollowGames(client);

    const statusOnline = new EmbedBuilder()
      .setDescription(`*Bot Status*\n# 🟢 ​ ​ Online\n​\nI have been restarted either due to an update or an error.  I am sorry for the inconvenience.  I will be up and running again soon!\n\n**I'm all ready to go again!**`)
      .setColor('Green');

    await message.edit({
      embeds: [ statusOnline ],
    });
		console.log(`Ready! Logged in as ${client.user.tag}`);
	},
};
