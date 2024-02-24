const {
  SlashCommandBuilder,
  ChatInputCommandInteraction,
} = require('discord.js');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('ban')
    .setDescription('Ban a user from the server and send them an automated message.')
    .addUserOption(option =>
      option
        .setName('user')
        .setDescription('The user to report.')
        .setRequired(true)
    )
    .addStringOption(option =>
      option
        .setName('reason')
        .setDescription('The reason for reporting the user.')
        .setRequired(false)
    ),

  /**
  * @param {ChatInputCommandInteraction} interaction
  */
  execute: async (interaction) => {
    // TODO: Add logic to ban a user.
  }
};
