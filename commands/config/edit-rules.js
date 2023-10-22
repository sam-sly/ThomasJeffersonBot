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
    .setName('edit-rules')
    .setDescription('Edit the server rules that all members must agree to.'),

  /**
   * @param {ChatInputCommandInteraction} interaction
   */
  execute: async (interaction) => {
    var rulesMessage = await readFile('data/rules.json');

    while (true) {
      const previewEmbed = new EmbedBuilder()
        .setColor(rulesMessage.color)
        .setTitle(rulesMessage.title)
        .setDescription(rulesMessage.intro)
        .setThumbnail('attachment://founding-sons-logo.png')
        .addFields({ name: ' ', value: ' ' });

      for (let i = 0; i < rulesMessage.rules.length; i++) {
        previewEmbed.addFields(
          {
            name: rulesMessage.numbers[i].emoji.concat(rulesMessage.rules[i].title),
            value: rulesMessage.rules[i].description,
          },
          { name: ' ', value: ' ' },
        );
      }

      previewEmbed.addFields({ name: ' ', value: rulesMessage.outro });

      const editButton = new ButtonBuilder()
        .setCustomId('edit')
        .setLabel('Edit 📝')
        .setStyle(ButtonStyle.Primary);

      const doneButton = new ButtonBuilder()
        .setCustomId('done')
        .setLabel('Done')
        .setStyle(ButtonStyle.Success);

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
        embeds: [ previewEmbed ],
        components: [ buttons ],
        files: [{
          attachment: "resources/founding-sons-logo.png",
          name: "founding-sons-logo.png",
          description: "Founding Sons Logo"
        }],
      });

      /**
       * @type {MessageComponentInteraction} input
       */
      const input = await response.awaitMessageComponent();
      await input.update({ fetchReply: true });

      if (input.customId === 'done') {
        await writeFile(rulesMessage, 'data/rules.json');
        console.log('Successfully wrote the new rules to file.');

        const previewEmbed = new EmbedBuilder()
          .setColor(rulesMessage.color)
          .setTitle(rulesMessage.title)
          .setDescription(rulesMessage.intro)
          .setThumbnail('attachment://founding-sons-logo.png')
          .addFields({ name: ' ', value: ' ' });

        for (let i = 0; i < rulesMessage.rules.length; i++) {
          previewEmbed.addFields(
            {
              name: rulesMessage.numbers[i].emoji.concat(rulesMessage.rules[i].title),
              value: rulesMessage.rules[i].description,
            },
            { name: ' ', value: ' ' },
          );
        }

        previewEmbed.addFields({ name: ' ', value: rulesMessage.outro });

        const changesEmbed = new EmbedBuilder()
          .setTitle('✅ *Changes applied.*');

        await interaction.editReply({
          content: '',
          embeds: [ previewEmbed, changesEmbed ],
          components: [],
          files: [{
            attachment: "resources/founding-sons-logo.png",
            name: "founding-sons-logo.png",
            description: "Founding Sons Logo"
          }],
        });
        break;
      }
      else if (input.customId === 'cancel') {
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
      const actionRows = [];

      const detailsButton = new ButtonBuilder()
        .setCustomId('details')
        .setLabel('Edit Message (Title, Intro, and Outro)')
        .setStyle(ButtonStyle.Primary);

      actionRows.push(new ActionRowBuilder().addComponents(detailsButton))

      const numRules = rulesMessage.rules.length;
      for (let row = 0; row < 2; row++) {
        const actionRow = new ActionRowBuilder();
        for (let i = 0; i < 5; i++) {
          const ruleNum = row * 5 + i;

          const button = new ButtonBuilder()
            .setCustomId(`${ruleNum}`)
            .setLabel(`Rule ${ruleNum+1}`)
            .setStyle(ButtonStyle.Primary)
            .setDisabled(ruleNum >= numRules);

          actionRow.addComponents(button);
        }
        actionRows.push(actionRow);
      }

      const newRuleButton = new ButtonBuilder()
        .setCustomId('new')
        .setLabel('New Rule')
        .setStyle(ButtonStyle.Success)
        .setDisabled(numRules >= 10);

      const removeRuleButton = new ButtonBuilder()
        .setCustomId('remove')
        .setLabel(`Remove Rule ${numRules}`)
        .setStyle(ButtonStyle.Danger)
        .setDisabled(numRules <= 0);

      const backButton = new ButtonBuilder()
        .setCustomId('back')
        .setLabel('Back')
        .setStyle(ButtonStyle.Secondary);

      const newRuleRow = new ActionRowBuilder()
        .addComponents(newRuleButton, removeRuleButton, backButton);

      actionRows.push(newRuleRow);

      const editResponse = await interaction.editReply({
        components: actionRows,
      });

      const editInput = await editResponse.awaitMessageComponent();

      if (editInput.customId === 'back') {
        await editInput.update({ fetchReply: true });
        continue;
      }
      else if (editInput.customId === 'details') {
        const modal = new ModalBuilder()
          .setCustomId('modal')
          .setTitle('Edit Rules')

        const titleInput = new TextInputBuilder()
          .setCustomId('titleInput')
          .setLabel('Title')
          .setStyle(TextInputStyle.Short)
          .setValue(rulesMessage.title);

        const introInput = new TextInputBuilder()
          .setCustomId('introInput')
          .setLabel('Intro')
          .setStyle(TextInputStyle.Paragraph)
          .setValue(rulesMessage.intro);

        const outroInput = new TextInputBuilder()
          .setCustomId('outroInput')
          .setLabel('Outro')
          .setStyle(TextInputStyle.Paragraph)
          .setValue(rulesMessage.outro);

        modal.addComponents(
          new ActionRowBuilder().addComponents(titleInput),
          new ActionRowBuilder().addComponents(introInput),
          new ActionRowBuilder().addComponents(outroInput),
        );

        await editInput.showModal(modal);
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

        rulesMessage.title = modalResponse.fields.getTextInputValue('titleInput');
        rulesMessage.intro = modalResponse.fields.getTextInputValue('introInput');
        rulesMessage.outro = modalResponse.fields.getTextInputValue('outroInput');

        await modalResponse.update({ fetchReply: true });
        continue;
      }
      else if (editInput.customId === 'remove') {
        await editInput.update({ fetchReply: true });
        rulesMessage.rules.pop();
        continue;
      }
      else if (editInput.customId === 'new') {

        const modal = new ModalBuilder()
          .setCustomId('modal')
          .setTitle('Add New Rule');

        const titleInput = new TextInputBuilder()
          .setCustomId('titleInput')
          .setLabel('Rule Title')
          .setStyle(TextInputStyle.Short);

        const descriptionInput = new TextInputBuilder()
          .setCustomId('descriptionInput')
          .setLabel('Rule Description')
          .setStyle(TextInputStyle.Paragraph)
          .setRequired(false);

        modal.addComponents(
          new ActionRowBuilder().addComponents(titleInput),
          new ActionRowBuilder().addComponents(descriptionInput),
        );

        await editInput.showModal(modal);
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

        const newRule = {
          title: modalResponse.fields.getTextInputValue('titleInput'),
          description: modalResponse.fields.getTextInputValue('descriptionInput') || ' ',
        };
        rulesMessage.rules.push(newRule);

        await modalResponse.update({ fetchReply: true })
        continue;
      }
      // Otherwise, a rule was chosen
      const ruleNum = parseInt(editInput.customId);

      const modal = new ModalBuilder()
        .setCustomId('modal')
        .setTitle(`Edit Rule ${ruleNum+1}`);

      const titleInput = new TextInputBuilder()
        .setCustomId('titleInput')
        .setLabel('Rule Title')
        .setStyle(TextInputStyle.Short)
        .setValue(rulesMessage.rules[ruleNum].title);

      const descriptionInput = new TextInputBuilder()
        .setCustomId('descriptionInput')
        .setLabel('Rule Description')
        .setStyle(TextInputStyle.Paragraph)
        .setValue(rulesMessage.rules[ruleNum].description)
        .setRequired(false);

      modal.addComponents(
        new ActionRowBuilder().addComponents(titleInput),
        new ActionRowBuilder().addComponents(descriptionInput),
      );

      await editInput.showModal(modal);
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

      rulesMessage.rules[ruleNum].title = modalResponse.fields.getTextInputValue('titleInput');
      rulesMessage.rules[ruleNum].description = modalResponse.fields.getTextInputValue('descriptionInput') || ' ';

      await modalResponse.update({ fetchReply: true });
    }
  },
};
