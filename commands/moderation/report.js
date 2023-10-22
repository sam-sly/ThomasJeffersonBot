const {
  SlashCommandBuilder,
  ChatInputCommandInteraction,
} = require('discord.js');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('report')
    .setDescription('Report a user to the moderators.')
    .addUserOption(option =>
      option
        .setName('user')
        .setDescription('The user to report.')
        .setRequired(true)
    ),

  /**
  * @param {ChatInputCommandInteraction} interaction
  */
  execute: async (interaction) => {
    // TODO: Add logic to report a user.
  }
};
