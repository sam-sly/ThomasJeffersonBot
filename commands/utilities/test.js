const {
  SlashCommandBuilder,
  ChatInputCommandInteraction,
  ButtonBuilder,
  ButtonStyle,
  ActionRowBuilder,
} = require("discord.js");
const ButtonListener = require("../../models/buttonListener");

module.exports = {
  data: new SlashCommandBuilder()
    .setName('test')
    .setDescription('Test command.'),

  /**
   * @param {ChatInputCommandInteraction} interaction
   */
  execute: async (interaction) => {
    await interaction.editReply({
      content: 'Done.',
    });
    await interaction.deleteReply();

    const button = new ButtonBuilder()
      .setCustomId('test')
      .setLabel('Test')
      .setStyle(ButtonStyle.Primary);

    const actionRow = new ActionRowBuilder().addComponents(button);

    const message = await interaction.channel.send({
      content: 'Loading...',
    });

    await ButtonListener.create({
      id: button.data.custom_id,
      messageId: message.id,
      callbackPath: 'test.js',
      callbackName: 'test',
      args: [ interaction.member.id ],
    });

    await message.edit({
      content: '',
      components: [ actionRow ],
    });
  },
};
