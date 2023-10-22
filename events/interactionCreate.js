const { Events, Interaction } = require('discord.js');
const reportTheError = require('../utils/reportTheError');
const { roles } = require('../data/settings.json');

const PERSISTENT_REPLY_COMMANDS = [
  {
    command: { name: 'add-game' },
    role: { id: roles.member.id },
  },
];

module.exports = {
	name: Events.InteractionCreate,
  /**
   * @param {Interaction} interaction
   */
  execute: async (interaction) => {
		if (!interaction.isChatInputCommand()) return;

		const command = interaction.client.commands.get(interaction.commandName);

		if (!command) {
			console.error(`No command matching ${interaction.commandName} was found.`);
			return;
		}

    await interaction.deferReply({ ephemeral: true });

		try {
      console.log(`${interaction.member.displayName} executing ${interaction.commandName}.`)
			await command.execute(interaction);
		} catch (error) {
      await reportTheError(error, `❌ Error executing ${interaction.commandName}`, interaction);
		}
    console.log(`Finished ${interaction.member.displayName}'s ${interaction.commandName}.`);
    
    // TODO: add idle timeout for commands
    // maybe callback function per command to close

    const persistentReplyCommand = PERSISTENT_REPLY_COMMANDS.find((p) => p.command.name === interaction.commandName);
    const replyIsPersistent = (
      persistentReplyCommand &&
      interaction.member.roles.cache.find((r) => r.id === persistentReplyCommand.role.id)
    );
    
    if (!replyIsPersistent) {
      setTimeout(async () => {
        await interaction.deleteReply();
      }, 10000);
    }
  },
};
