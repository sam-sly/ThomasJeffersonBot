const {
  SlashCommandBuilder,
  EmbedBuilder,
  ActionRowBuilder,
  ButtonBuilder,
  ButtonStyle,
  InteractionResponse,
  MessageComponentInteraction,
  ModalBuilder,
  ModalSubmitInteraction,
  TextInputBuilder,
  TextInputStyle,
  ChatInputCommandInteraction,
} = require("discord.js");
const { readFile, writeFile } = require('../../utils/json');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('edit-welcome-message')
    .setDescription('Edit the welcome message that gets sent to everyone that joins the server.'),

  /**
   * @param {ChatInputCommandInteraction} interaction
   */
  execute: async (interaction) => {
    var welcomeMessage = await readFile('data/welcomeMessage.json');

    while (true) {
      const previewEmbed = new EmbedBuilder(welcomeMessage.embed);

      const instructions = `**Above is a preview of the current welcome message**.`
        .concat(`\n`)
        .concat(`\nClicking the **\`Edit\`** button will allow you to make changes.`)
        .concat(`\nClicking the **\`Done\`** button will save your changes.`)
        .concat(`\nClicking the **\`Cancel\`** button will revert your changes.`)
        .concat(`\n`)
        .concat(`\nYou can insert certain dynamic values into the message using the notations below:`)
        .concat(`\n`)
        .concat(`\n\`%USER\` will be replaced by the username of the joinee.`)

      const instructionsEmbed = new EmbedBuilder()
        .setDescription(instructions);

      const doneButton = new ButtonBuilder()
        .setCustomId('done')
        .setLabel('Done')
        .setStyle(ButtonStyle.Success);

      const editButton = new ButtonBuilder()
        .setCustomId('edit')
        .setLabel('Edit 📝')
        .setStyle(ButtonStyle.Primary);

      const cancelButton = new ButtonBuilder()
        .setCustomId('cancel')
        .setLabel('Cancel')
        .setStyle(ButtonStyle.Danger);

      const buttons = new ActionRowBuilder()
        .addComponents(editButton, doneButton, cancelButton);

      /**
       * @type {InteractionResponse} response
       */
      const response = await interaction.editReply({
        content: '',
        embeds: [ previewEmbed, instructionsEmbed ],
        components: [ buttons ],
        files: welcomeMessage.attachments,
      });

      /**
       * @type {MessageComponentInteraction} input
       */
      const input = await response.awaitMessageComponent({
        filter: i => i.user.id === interaction.user.id,
      });

      if (input.customId === 'done') {
        await input.update({ fetchReply: false });

        await writeFile(welcomeMessage, 'data/welcomeMessage.json');
        console.log('Successfully wrote the new welcome message template to file.');

        const changesEmbed = new EmbedBuilder()
          .setTitle('✅ *Changes applied.*');

        await interaction.editReply({
          content: '',
          embeds: [ welcomeMessage.embed, changesEmbed ],
          components: [],
          files: welcomeMessage.attachments,
        });
        break;
      }
      else if (input.customId === 'cancel') {
        await input.update({ fetchReply: false });

        const changesEmbed = new EmbedBuilder()
          .setTitle('↩️  *Changes reverted.*');

        console.log('Cancelled changes.');
        await interaction.editReply({
          content: '',
          embeds: [ changesEmbed ],
          components: [],
          files: [],
        });
        break;
      }
      // Otherwise, input.customId === 'edit'
      const modal = new ModalBuilder()
        .setCustomId('editModal')
        .setTitle('Edit Welcome Message');

      const titleInput = new TextInputBuilder()
        .setCustomId('titleInput')
        .setLabel('Title')
        .setStyle(TextInputStyle.Short)
        .setValue(welcomeMessage.embed.title);

      const descriptionInput = new TextInputBuilder()
        .setCustomId('descriptionInput')
        .setLabel('Body')
        .setStyle(TextInputStyle.Paragraph)
        .setValue(welcomeMessage.embed.description);

      modal.addComponents(
        new ActionRowBuilder().addComponents(titleInput),
        new ActionRowBuilder().addComponents(descriptionInput),
      );

      await input.showModal(modal);
      await interaction.editReply({
        content: `If you click \`Cancel\` on the input window, you will have to wait for the **3 minute** timeout before interacting again.  You can also dismiss this whole message and start over.\n\n⏳ **Please wait before performing another action...**`,
        components: [],
      });

      var modalResponse;
      try {
        /**
         * @type {ModalSubmitInteraction} modalResponse
         */
        modalResponse = await interaction.awaitModalSubmit({
          time: 180000,
        });
      } catch (error) {
        if (error.message.endsWith('time')) {
          interaction.editReply({
            content: 'If you click \`Cancel\` on the input window, you will have to wait for the **3 minute** timeout before interacting again.  You can also dismiss this whole message and start over.\n\n⌛️ **Continue**',
          });
          continue;
        }
      }

      welcomeMessage.embed.title = modalResponse.fields.getTextInputValue('titleInput');
      welcomeMessage.embed.description = modalResponse.fields.getTextInputValue('descriptionInput');

      modalResponse.update({ fetchReply: false });
    }
  },
};
