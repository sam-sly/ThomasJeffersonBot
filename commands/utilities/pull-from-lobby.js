const {
  SlashCommandBuilder,
  GuildMember,
  ChatInputCommandInteraction,
} = require("discord.js");
const getMembersRole = require("../../utils/getMembersRole");

module.exports = {
  data: new SlashCommandBuilder()
    .setName('pull-from-lobby')
    .setDescription('Move a user from the lobby voice channel to the voice channel you are in.')
    .addUserOption(option =>
      option
        .setName('user')
        .setDescription('The user to move.')
        .setRequired(true)
    ),

  /**
   * @param {ChatInputCommandInteraction} interaction
   */
  execute: async (interaction) => {
    const { value: usersRole, rank } = await getMembersRole(interaction.member);
    
    if (usersRole < rank.member) {
      await interaction.editReply({
        content: `You don't have permission to use this command.`,
      });
      return;
    }

    const targetChannel = interaction.member.voice.channel;

    if (!targetChannel) {
      await interaction.editReply({
        content: `You need to be connected to a voice channel to use this command.`,
      });
      return;
    }

    /**
     * @type {GuildMember} userToMove
     */
    const userToMove = interaction.options.getMember('user');

    if (userToMove.voice.channel === null || userToMove.voice.channel.id !== process.env.LOBBY_CHANNEL) {
      await interaction.editReply({
        content: `${userToMove} is not connected to <#${process.env.LOBBY_CHANNEL}>.`,
      });
      return;
    }

    await userToMove.voice.setChannel(targetChannel);
    console.log(`Moved ${userToMove.displayName} to ${targetChannel.name}.`);

    await interaction.editReply(`Successfully moved ${userToMove} to ${targetChannel}.`);
  },
};
