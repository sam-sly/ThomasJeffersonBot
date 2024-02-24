const {
  Events,
  Interaction,
  EmbedBuilder,
} = require('discord.js');
const reportTheError = require('../utils/reportTheError');
const ButtonListener = require('../models/buttonListener');

module.exports = {
  name: Events.InteractionCreate,
  /**
   * @param {Interaction} interaction
   */
  execute: async (interaction) => {
    if (interaction.guild.id !== process.env.GUILD_ID) return;

    console.log(`🖲️  Interaction received from ${interaction.member.displayName}.`);

    if (interaction.isButton()) {
      try {
        const button = await ButtonListener.findOne({
          id: interaction.customId,
          messageId: interaction.message.id,
        }).exec();

        if (!button) return;

        console.log(`👇 Activating button '${interaction.customId}'.`);

        const callback = require('../buttons/'.concat(button.callbackPath));
        const args = [ interaction ].concat(button.args);
        callback.get(button.callbackName).apply(null, args);
      } catch (error) {
        await reportTheError(error, `❌ Error executing button '${interaction.customId}' in ${interaction.channel.name}`, interaction);
      }
      return;
    }
    else if (interaction.isChatInputCommand()) {
      const command = interaction.client.commands.get(interaction.commandName);

      if (!command) {
        console.error(`No command matching ${interaction.commandName} was found.`);
        return;
      }

      await new Promise(async (resolve, reject) => {
        try {
          await interaction.deferReply({ ephemeral: true });

          const commandTimeout = setTimeout(() => {
            reject('time');
          }, 5 * 60_000); // 5 minute timeout

          console.log(`${interaction.member.displayName} executing ${interaction.commandName}.`);
          await command.execute(interaction);

          clearTimeout(commandTimeout);
          resolve();
        } catch (error) {
          reject(error);
        }
      }).catch(async (error) => {
        if (error === 'time') {
          const embed = new EmbedBuilder()
            .setTitle('⏳ **Command timed out.**');

          await interaction.editReply({
            content: '',
            embeds: [ embed ],
            components: [],
          });
        }
        else await reportTheError(error, `❌ Error executing ${interaction.commandName}`, interaction);

        await new Promise((resolve) => setTimeout(resolve(), 10_000));
      });
      console.log(`Finished ${interaction.member.displayName}'s ${interaction.commandName}.`);

      setTimeout(async () => {
        await interaction.deleteReply();
      }, 10_000);
    }
  },
};
